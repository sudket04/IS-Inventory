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


def list_columns(cfg: AppConfig, table: str) -> list:
    """Live-introspect a table's column names from the database itself,
    rather than trusting a hand-maintained list or (worse) the client. This
    is what makes the generic CRUD in routers/records.py safe: it only ever
    builds SQL using column names the database actually has.
    """
    conn = get_connection(cfg)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
            table,
        )
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()


def next_id(cfg: AppConfig, prefix: str, width: int = 3) -> str:
    """Atomically allocate the next id for a prefix (e.g. "HW" -> "HW-004").

    Runs as its own short transaction: the UPDATE takes a row lock on
    dbo.id_counters for the duration, so two concurrent inserts can never be
    handed the same id — the second caller simply waits for the first
    transaction to commit before it gets its (higher) number. This replaces
    the old approach of computing "max + 1" over data already loaded into
    the browser, which two simultaneous users could both compute identically.

    Seed rows in dbo.id_counters start at next_seq = 0, so the first call
    for a fresh prefix returns "<prefix>-001".
    """
    conn = get_connection(cfg)
    try:
        conn.autocommit = False
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE dbo.id_counters SET next_seq = next_seq + 1 OUTPUT INSERTED.next_seq WHERE counter_key = ?",
            prefix,
        )
        row = cursor.fetchone()
        if row is None:
            cursor.execute("INSERT INTO dbo.id_counters (counter_key, next_seq) VALUES (?, 1)", prefix)
            seq = 1
        else:
            seq = row[0]
        conn.commit()
        return f"{prefix}-{str(seq).zfill(width)}"
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_all(cfg: AppConfig, table: str, id_column: str) -> list:
    conn = get_connection(cfg)
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM dbo.{table} ORDER BY {id_column}")
        columns = [c[0] for c in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def fetch_one(cfg: AppConfig, table: str, id_column: str, id_value: str) -> Optional[dict]:
    conn = get_connection(cfg)
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM dbo.{table} WHERE {id_column} = ?", id_value)
        row = cursor.fetchone()
        if row is None:
            return None
        columns = [c[0] for c in cursor.description]
        return dict(zip(columns, row))
    finally:
        conn.close()


def insert_row(cfg: AppConfig, table: str, values: dict) -> None:
    """Caller's contract: every key in `values` must already be a column
    name that actually exists on `table` (see list_columns) — this function
    trusts its caller and does not re-check, so it must never be handed
    column names sourced directly from client input.
    """
    columns = list(values.keys())
    placeholders = ", ".join("?" for _ in columns)
    column_list = ", ".join(columns)
    conn = get_connection(cfg)
    try:
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(f"INSERT INTO dbo.{table} ({column_list}) VALUES ({placeholders})", *values.values())
    finally:
        conn.close()


def update_row(cfg: AppConfig, table: str, id_column: str, id_value: str, values: dict,
                expected_updated_at: Optional[str]) -> bool:
    """Update a row. When expected_updated_at is given, the row is only
    updated if its current updated_at still matches what the caller last
    read (optimistic concurrency) — returns False instead of silently
    overwriting a change someone else made in between. Same column-name
    contract as insert_row.
    """
    set_clause = ", ".join(f"{col} = ?" for col in values.keys())
    params = list(values.values())
    sql = f"UPDATE dbo.{table} SET {set_clause}, updated_at = SYSUTCDATETIME() WHERE {id_column} = ?"
    params.append(id_value)
    if expected_updated_at is not None:
        sql += " AND updated_at = ?"
        params.append(expected_updated_at)
    conn = get_connection(cfg)
    try:
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(sql, *params)
        return cursor.rowcount > 0
    finally:
        conn.close()


def delete_row(cfg: AppConfig, table: str, id_column: str, id_value: str) -> bool:
    conn = get_connection(cfg)
    try:
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM dbo.{table} WHERE {id_column} = ?", id_value)
        return cursor.rowcount > 0
    finally:
        conn.close()


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
