from __future__ import annotations
import asyncpg
import json
from .settings import settings

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