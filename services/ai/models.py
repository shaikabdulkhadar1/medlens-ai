from __future__ import annotations
import asyncpg
import json
from settings import settings

_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL, min_size=1, max_size=5)
    return _pool

async def create_case(pool: asyncpg.Pool, user_id: str, title: str | None):
    async with pool.acquire() as con:
        row = await con.fetchrow(
            "INSERT INTO cases (user_id, title) VALUES ($1,$2) RETURNING id",
            user_id, title
        )
        return str(row["id"])

async def insert_artifact(pool: asyncpg.Pool, case_id: str, kind: str, uri: str, meta: dict):
    async with pool.acquire() as con:
        row = await con.fetchrow(
            "INSERT INTO artifacts (case_id, kind, uri, meta_json) VALUES ($1,$2,$3,$4) RETURNING id",
            case_id, kind, uri, json.dumps(meta)
        )
        return str(row["id"])

async def list_cases(pool: asyncpg.Pool, user_id: str, limit: int = 50):
    async with pool.acquire() as con:
        rows = await con.fetch(
            """
            SELECT id, title, status, created_at 
            FROM cases 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
            """,
            user_id, limit
        )
        return [
            {
                "id": str(row["id"]),
                "title": row["title"],
                "status": row["status"],
                "created_at": row["created_at"].isoformat()
            }
            for row in rows
        ]

async def get_case(pool: asyncpg.Pool, case_id: str):
    """Get a single case by ID"""
    async with pool.acquire() as con:
        row = await con.fetchrow(
            """
            SELECT id, user_id, title, status, created_at 
            FROM cases 
            WHERE id = $1
            """,
            case_id
        )
        if not row:
            return None
        return {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "title": row["title"],
            "status": row["status"],
            "created_at": row["created_at"].isoformat()
        }

async def get_case_artifacts(pool: asyncpg.Pool, case_id: str):
    """Get all artifacts for a case"""
    async with pool.acquire() as con:
        rows = await con.fetch(
            """
            SELECT id, kind, uri, meta_json, parsed_json, created_at 
            FROM artifacts 
            WHERE case_id = $1 
            ORDER BY created_at DESC
            """,
            case_id
        )
        return [
            {
                "id": str(row["id"]),
                "kind": row["kind"],
                "uri": row["uri"],
                "meta_json": json.loads(row["meta_json"]) if row["meta_json"] else {},
                "parsed_json": json.loads(row["parsed_json"]) if row["parsed_json"] else None,
                "created_at": row["created_at"].isoformat()
            }
            for row in rows
        ]

async def get_case_model_runs(pool: asyncpg.Pool, case_id: str):
    """Get all model runs for a case"""
    async with pool.acquire() as con:
        rows = await con.fetch(
            """
            SELECT id, artifact_id, task, model_name, params_json, result_json, latency_ms, cache_hit, created_at 
            FROM model_runs 
            WHERE case_id = $1 
            ORDER BY created_at DESC
            """,
            case_id
        )
        return [
            {
                "id": str(row["id"]),
                "artifact_id": str(row["artifact_id"]) if row["artifact_id"] else None,
                "task": row["task"],
                "model_name": row["model_name"],
                "params_json": json.loads(row["params_json"]) if row["params_json"] else {},
                "result_json": json.loads(row["result_json"]) if row["result_json"] else {},
                "latency_ms": row["latency_ms"],
                "cache_hit": row["cache_hit"],
                "created_at": row["created_at"].isoformat()
            }
            for row in rows
        ]