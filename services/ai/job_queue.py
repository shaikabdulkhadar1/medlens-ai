# Simple Redis-backed FIFO queue (blocking pop)
from __future__ import annotations
import json
import uuid
from typing import Literal, Callable, Dict, Any
import redis
from .settings import settings

r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

QUEUE   = "medlens:jobs"
PUBCHAN = "ws:jobs"

JobKind = Literal["vision_classify", "doc_parse", "vitals_ingest", "fuse"]

def enqueue(kind: JobKind, payload: dict) -> str:
    jid = str(uuid.uuid4())
    r.hset(f"job:{jid}", mapping={
        "kind": kind,
        "status": "queued",
        "payload": json.dumps(payload),
    })
    r.lpush(QUEUE, jid)
    return jid

def _publish_status(jid: str, status: str, result: dict | None = None):
    if result is None:
        result = {}
    r.hset(f"job:{jid}", mapping={
        "status": status,
        "result": json.dumps(result),
    })
    # Workers can include case_id in result payload to let UI filter
    r.publish(PUBCHAN, json.dumps({"jid": jid, "status": status, "result": result}))

def worker_loop(handler_map):
    while True:
        popped = r.brpop(QUEUE, timeout=5)
        if not popped:
            continue
        _, jid = popped
        job = r.hgetall(f"job:{jid}")
        kind = job.get("kind")
        payload = json.loads(job.get("payload", "{}"))
        try:
            print(f"[worker] running {kind} jid={jid}")   # <— add
            _publish_status(jid, "running", {"kind": kind, **payload})
            handler = handler_map[kind]
            result = handler(payload)
            print(f"[worker] done {kind} jid={jid}")      # <— add
            _publish_status(jid, "done", result)
        except Exception as e:
            print(f"[worker] error {kind} jid={jid}: {e}")# <— add
            _publish_status(jid, "error", {"error": str(e), "kind": kind})