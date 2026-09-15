"""Backs index.html's StorageAdapter: one JSON blob per key in dbo.app_kv.
This is a deliberate bridge — see the note at the top of schema.sql — that
lets the existing front-end persist to SQL Server with no further backend
work. Swap it for real relational endpoints table-by-table when ready.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import db
from config import load_config

router = APIRouter(prefix="/api")


class DataValue(BaseModel):
    value: str


def _require_config():
    cfg = load_config()
    if cfg is None:
        raise HTTPException(status_code=503, detail="Database not configured yet. Visit /setup.html.")
    return cfg


@router.get("/data/{key}")
async def get_data(key: str):
    cfg = _require_config()
    conn = db.get_connection(cfg)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT kv_value FROM dbo.app_kv WHERE kv_key = ?", key)
        row = cursor.fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return {"value": row[0]}


@router.put("/data/{key}")
async def put_data(key: str, body: DataValue):
    cfg = _require_config()
    conn = db.get_connection(cfg)
    try:
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(
            """
            MERGE dbo.app_kv AS target
            USING (SELECT ? AS kv_key) AS src
            ON target.kv_key = src.kv_key
            WHEN MATCHED THEN UPDATE SET kv_value = ?, updated_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN INSERT (kv_key, kv_value) VALUES (src.kv_key, ?);
            """,
            key,
            body.value,
            body.value,
        )
    finally:
        conn.close()
    return {"ok": True}
