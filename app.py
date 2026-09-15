"""FastAPI entry point for the IS Inventory app.

Serves the static front-end (index.html, setup.html) and the API routes it
calls: /api/setup (connection setup, see setup.py) and /api/data/<key> (the
key/value bridge to SQL Server, see data.py).

Run with: uvicorn app:app --host 0.0.0.0 --port 8000
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse

from routers import data as data_router
from routers import setup as setup_router

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="IS Inventory")

app.include_router(setup_router.router)
app.include_router(data_router.router)


@app.get("/")
async def serve_root():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/index.html")
async def serve_index():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/setup.html")
async def serve_setup():
    return FileResponse(BASE_DIR / "setup.html")
