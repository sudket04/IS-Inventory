"""Generic relational CRUD for the "flat" tables in table_registry.py.

This replaces the whole-array KV blob approach (routers/data.py /
StorageAdapter) with real per-record endpoints: an insert is one INSERT, an
edit is one UPDATE on one row, not a read-modify-write of an entire table's
JSON blob. That fixes the two biggest problems with the KV bridge:

  1. Two users editing the same table no longer silently clobber each
     other's changes — PUT requires the record's last-known updated_at and
     is rejected (409) if it's stale, instead of overwriting blind.
  2. Ids are allocated atomically by the database (db.next_id), not
     computed as "max + 1" over an array sitting in one browser's memory,
     so two concurrent creates can't collide.

NOT wired into index.html yet — per the plan, the front-end keeps talking to
/api/data/<key> until the DB is actually connected and tested end-to-end.
This module is the structure to switch to at that point: swap
StorageAdapter's get/set for calls to these endpoints table-by-table.
"""
from typing import Any, Dict, Optional

import pyodbc
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

import auth
import db
from config import load_config
from table_registry import TABLE_REGISTRY

router = APIRouter(prefix="/api/records")


def _require_config():
    cfg = load_config()
    if cfg is None:
        raise HTTPException(status_code=503, detail="Database not configured yet. Visit /setup.html.")
    return cfg


def _require_spec(table: str):
    spec = TABLE_REGISTRY.get(table)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown table '{table}'")
    return spec


def _writable_columns(cfg, spec) -> list:
    columns = db.list_columns(cfg, spec.table)
    return [c for c in columns if c not in (spec.id_column, "created_at", "updated_at")]


def _extract_values(payload: Dict[str, Any], writable: list, spec) -> Dict[str, Any]:
    values = {k: v for k, v in payload.items() if k in writable}
    if spec.hash_password and payload.get("password"):
        values["password_hash"] = auth.hash_password(payload["password"])
    return values


@router.get("/{table}")
async def list_records(table: str):
    cfg = _require_config()
    spec = _require_spec(table)
    return db.fetch_all(cfg, spec.table, spec.id_column)


@router.get("/{table}/{record_id}")
async def get_record(table: str, record_id: str):
    cfg = _require_config()
    spec = _require_spec(table)
    record = db.fetch_one(cfg, spec.table, spec.id_column, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Not found")
    return record


@router.post("/{table}")
async def create_record(table: str, payload: Dict[str, Any]):
    cfg = _require_config()
    spec = _require_spec(table)
    writable = _writable_columns(cfg, spec)
    values = _extract_values(payload, writable, spec)
    values[spec.id_column] = db.next_id(cfg, spec.id_prefix)
    try:
        db.insert_row(cfg, spec.table, values)
    except pyodbc.IntegrityError as exc:
        return JSONResponse({"ok": False, "error": f"Duplicate or invalid reference: {exc}"}, status_code=409)
    return db.fetch_one(cfg, spec.table, spec.id_column, values[spec.id_column])


@router.put("/{table}/{record_id}")
async def update_record(table: str, record_id: str, payload: Dict[str, Any]):
    cfg = _require_config()
    spec = _require_spec(table)
    existing = db.fetch_one(cfg, spec.table, spec.id_column, record_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Not found")

    writable = _writable_columns(cfg, spec)
    values = _extract_values(payload, writable, spec)
    # The client's last-known updated_at, used as an optimistic-lock token —
    # never a column to write directly (update_row always sets it fresh).
    expected_updated_at: Optional[str] = payload.get("updated_at")

    try:
        ok = db.update_row(cfg, spec.table, spec.id_column, record_id, values, expected_updated_at)
    except pyodbc.IntegrityError as exc:
        return JSONResponse({"ok": False, "error": f"Duplicate or invalid reference: {exc}"}, status_code=409)

    if not ok:
        current = db.fetch_one(cfg, spec.table, spec.id_column, record_id)
        return JSONResponse(
            {"ok": False, "error": "This record was changed by someone else — reload and try again.", "current": current},
            status_code=409,
        )
    return db.fetch_one(cfg, spec.table, spec.id_column, record_id)


@router.delete("/{table}/{record_id}")
async def delete_record(table: str, record_id: str):
    cfg = _require_config()
    spec = _require_spec(table)
    try:
        ok = db.delete_row(cfg, spec.table, spec.id_column, record_id)
    except pyodbc.IntegrityError as exc:
        return JSONResponse({"ok": False, "error": f"Still referenced elsewhere: {exc}"}, status_code=409)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
