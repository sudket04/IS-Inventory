"""Backs setup.html: test a SQL Server connection, bootstrap schema.sql
against it, and remember the settings for later requests.
"""
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import db
from config import AppConfig, load_config, save_config

router = APIRouter(prefix="/api")

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema.sql"


class SetupRequest(BaseModel):
    server: str
    database: str
    auth: str
    username: str = ""
    password: str = ""


@router.get("/setup")
async def get_setup():
    cfg = load_config()
    if cfg is None:
        return {}
    # Never send the password back to the browser.
    return {"server": cfg.server, "database": cfg.database, "auth": cfg.auth, "username": cfg.username}


@router.post("/setup")
async def post_setup(body: SetupRequest):
    cfg = AppConfig(
        server=body.server.strip(),
        database=body.database.strip(),
        auth=body.auth if body.auth in ("sql", "windows") else "sql",
        username=body.username.strip(),
        password=body.password,
    )
    if not cfg.server or not cfg.database:
        return JSONResponse({"ok": False, "error": "Server and database are required."}, status_code=400)
    if cfg.auth == "sql" and (not cfg.username or not cfg.password):
        return JSONResponse(
            {"ok": False, "error": "Username and password are required for SQL Server authentication."},
            status_code=400,
        )

    try:
        db.run_schema(cfg, SCHEMA_PATH)
    except Exception as exc:
        return JSONResponse({"ok": False, "error": f"Connection or schema setup failed: {exc}"}, status_code=400)

    save_config(cfg)
    return {"ok": True}
