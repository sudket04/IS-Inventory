"""SQL Server connection + schema bootstrap helpers, built on pyodbc."""
import os
import re
from pathlib import Path
from typing import Optional

import pyodbc

from config import AppConfig

_GO_RE = re.compile(r"(?im)^\s*GO\s*$")


def _pick_driver() -> str:
    override = os.environ.get("DB_ODBC_DRIVER")
    if override:
        return override
    installed = [d for d in pyodbc.drivers() if "SQL Server" in d]
    for preferred in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server"):
        if preferred in installed:
            return preferred
    if installed:
        return installed[-1]
    raise RuntimeError(
        "No SQL Server ODBC driver found. Install msodbcsql18 (or 17) and unixODBC, "
        "or set DB_ODBC_DRIVER to the driver name registered on this machine."
    )


def build_connection_string(cfg: AppConfig, driver: Optional[str] = None) -> str:
    driver = driver or _pick_driver()
    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={cfg.server}",
        f"DATABASE={cfg.database}",
        "Encrypt=yes",
        "TrustServerCertificate=yes",
        "Connection Timeout=5",
    ]
    if cfg.auth == "windows":
        parts.append("Trusted_Connection=yes")
    else:
        parts.append(f"UID={cfg.username}")
        parts.append(f"PWD={cfg.password}")
    return ";".join(parts)


def get_connection(cfg: AppConfig) -> pyodbc.Connection:
    return pyodbc.connect(build_connection_string(cfg), timeout=5)


def run_schema(cfg: AppConfig, schema_path: Path) -> None:
    """Test the connection and (re)apply schema.sql. schema.sql is written to
    be safe to re-run (every object is guarded with IF NOT EXISTS), so this
    doubles as both the connection test and the one-time bootstrap.
    """
    sql_text = schema_path.read_text(encoding="utf-8")
    batches = [b.strip() for b in _GO_RE.split(sql_text) if b.strip()]
    conn = get_connection(cfg)
    try:
        conn.autocommit = True
        cursor = conn.cursor()
        for batch in batches:
            cursor.execute(batch)
    finally:
        conn.close()
