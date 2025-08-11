# services/ai/main.py
from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from redis import asyncio as aioredis  # redis-py >= 4.2 provides asyncio

from settings import settings
from fastapi import UploadFile, File, Form
from s3 import presign_put, key_for, put_object_bytes
from job_queue import enqueue
from models import get_pool, create_case, insert_artifact, list_cases, get_case, get_case_artifacts, get_case_model_runs


# -------------------
# FastAPI app & CORS
# -------------------
app = FastAPI(title="MedLens AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------
# App lifecycle
# -------------------
@app.on_event("startup")
async def on_startup() -> None:
    # DB pool
    app.state.db = await get_pool()
    # Async Redis client (decode_responses=True returns str instead of bytes)
    app.state.redis: aioredis.Redis = aioredis.from_url(
        settings.REDIS_URL, decode_responses=True
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    r: aioredis.Redis = app.state.redis
    if r:
        await r.close()


# -------------------
# Schemas
# -------------------
class CreateCaseIn(BaseModel):
    title: Optional[str] = None
    # For real auth you'd derive this from the session/JWT. For now we accept it.
    user_id: str = Field(..., description="UUID of user creating the case")


class CreateCaseOut(BaseModel):
    case_id: str


class CaseItem(BaseModel):
    id: str
    title: Optional[str]
    status: str
    created_at: str


class CasesResponse(BaseModel):
    cases: List[CaseItem]


class PresignFile(BaseModel):
    filename: str
    contentType: str
    kind: str  # 'image' | 'document' | 'vitals' | 'fhir'


class PresignRequest(BaseModel):
    case_id: str
    files: List[PresignFile]


class PresignResponseItem(BaseModel):
    url: str
    key: str
    s3_uri: str
    kind: str


class PresignResponse(BaseModel):
    presigned: List[PresignResponseItem]


class IngestArtifact(BaseModel):
    kind: str
    s3_uri: str
    meta: Optional[Dict[str, Any]] = None


class IngestRequest(BaseModel):
    case_id: str
    artifacts: List[IngestArtifact]


class ArtifactDetail(BaseModel):
    id: str
    kind: str
    uri: str
    meta_json: Dict[str, Any]
    parsed_json: Optional[Dict[str, Any]] = None
    created_at: str


class ModelRunDetail(BaseModel):
    id: str
    artifact_id: Optional[str] = None
    task: str
    model_name: str
    params_json: Dict[str, Any]
    result_json: Dict[str, Any]
    latency_ms: Optional[int] = None
    cache_hit: bool
    created_at: str


class CaseDetail(BaseModel):
    id: str
    user_id: str
    title: Optional[str]
    status: str
    created_at: str
    artifacts: List[ArtifactDetail]
    model_runs: List[ModelRunDetail]


# -------------------
# Routes
# -------------------
@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/cases", response_model=CasesResponse)
async def list_cases_route(user_id: str = "00000000-0000-0000-0000-000000000001", limit: int = 50) -> CasesResponse:
    """
    List recent cases for a user.
    """
    cases = await list_cases(app.state.db, user_id, limit)
    return CasesResponse(cases=cases)


@app.post("/cases", response_model=CreateCaseOut)
async def create_case_route(payload: CreateCaseIn) -> CreateCaseOut:
    """
    Create a new case and return its id.
    """
    cid = await create_case(app.state.db, payload.user_id, payload.title)
    return CreateCaseOut(case_id=cid)


@app.get("/cases/{case_id}", response_model=CaseDetail)
async def get_case_route(case_id: str) -> CaseDetail:
    """
    Get a single case's details, uploaded artifacts, and model results.
    """
    case = await get_case(app.state.db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    artifacts = await get_case_artifacts(app.state.db, case_id)
    model_runs = await get_case_model_runs(app.state.db, case_id)
    
    return CaseDetail(
        **case,
        artifacts=artifacts,
        model_runs=model_runs
    )


@app.post("/upload/presign", response_model=PresignResponse)
async def presign_uploads(req: PresignRequest) -> PresignResponse:
    """
    Create presigned PUT URLs in MinIO for each file the client will upload directly.
    """
    items: List[PresignResponseItem] = []
    for f in req.files:
        key = key_for(req.case_id, f.filename)
        sig = presign_put(key, f.contentType)
        items.append(
            PresignResponseItem(
                url=sig["url"], key=sig["key"], s3_uri=sig["s3_uri"], kind=f.kind
            )
        )
    return PresignResponse(presigned=items)


@app.post("/cases/ingest")
async def ingest(req: IngestRequest) -> Dict[str, Any]:
    """
    Save artifact metadata and enqueue jobs for processing.
    Also enqueues a 'fuse' job that will synthesize a diagnosis once signals are ready.
    """
    # Save artifacts and enqueue per-kind jobs
    for a in req.artifacts:
        aid = await insert_artifact(
            app.state.db, req.case_id, a.kind, a.s3_uri, a.meta or {}
        )
        if a.kind == "image":
            enqueue("vision_classify", {"case_id": req.case_id, "artifact_id": aid})
        elif a.kind == "document":
            enqueue("doc_parse", {"case_id": req.case_id, "artifact_id": aid})
        elif a.kind in ("vitals", "fhir"):
            enqueue("vitals_ingest", {"case_id": req.case_id, "artifact_id": aid})

    # Kick a fuse job (the worker can poll for readiness or proceed with partials)
    enqueue("fuse", {"case_id": req.case_id})

    return {"queued": True, "artifacts": len(req.artifacts)}


# -------------------
# WebSocket for job updates
# -------------------
@app.websocket("/ws/cases/{case_id}")
async def ws_case(websocket: WebSocket, case_id: str) -> None:
    """
    Simple pub/sub that forwards job status events to the client.
    NOTE: We currently forward all events; to filter by case, include 'case_id'
    in the published job messages from workers and drop non-matching ones here.
    """
    await websocket.accept()

    redis: aioredis.Redis = app.state.redis
    pubsub = redis.pubsub()
    await pubsub.subscribe("ws:jobs")

    try:
        while True:
            # get_message returns dict|None; ignore subscription acks
            msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=30.0)
            if msg is None:
                # keep the connection alive
                await asyncio.sleep(0.1)
                continue

            try:
                data = json.loads(msg["data"])
            except Exception:
                data = {"raw": msg["data"]}

            # OPTIONAL: filter events per-case if workers publish case_id
            # if data.get("case_id") != case_id: continue

            await websocket.send_json(data)
    except WebSocketDisconnect:
        # client disconnected
        pass
    finally:
        try:
            await pubsub.unsubscribe("ws:jobs")
        finally:
            await pubsub.close()


@app.post("/upload/direct")
async def upload_direct(
    case_id: str = Form(...),
    kind: str = Form(...),   # "image" | "document" | "vitals" | "fhir"
    file: UploadFile = File(...),
):
    data = await file.read()
    key = key_for(case_id, file.filename)
    s3_uri = put_object_bytes(key, data, file.content_type)
    aid = await insert_artifact(app.state.db, case_id, kind, s3_uri, {"filename": file.filename, "size": len(data)})
    payload = {"case_id": case_id, "artifact_id": aid, "s3_uri": s3_uri}
    if kind == "image": enqueue("vision_classify", payload)
    elif kind == "document": enqueue("doc_parse", payload)
    elif kind in ("vitals","fhir"): enqueue("vitals_ingest", payload)
    enqueue("fuse", {"case_id": case_id})
    return {"s3_uri": s3_uri, "artifact_id": aid}