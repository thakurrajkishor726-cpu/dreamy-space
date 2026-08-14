"""Database access for the catalogue.

Turso is libSQL, which is SQLite — so the same code runs against a remote
Turso database in production and a plain local file in tests. That means the
whole API can be exercised end to end without any credentials.

Set TURSO_URL + TURSO_TOKEN for remote; set CATALOGUE_DB_PATH (or neither, and
get ./catalogue.db) for local.
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Iterable

import libsql

SCHEMA_PATH = Path(__file__).with_name("schema.sql")

TURSO_URL = os.environ.get("TURSO_URL", "").strip()
TURSO_TOKEN = os.environ.get("TURSO_TOKEN", "").strip()
LOCAL_DB_PATH = os.environ.get("CATALOGUE_DB_PATH", "catalogue.db")

_local = threading.local()


def is_remote() -> bool:
    return bool(TURSO_URL and TURSO_TOKEN)


def connect():
    """One connection per thread.

    libSQL connections are not safe to share across threads, and FastAPI runs
    sync endpoints in a threadpool, so each worker thread gets its own.
    """
    existing = getattr(_local, "conn", None)
    if existing is not None:
        return existing

    if is_remote():
        conn = libsql.connect(TURSO_URL, auth_token=TURSO_TOKEN)
    else:
        conn = libsql.connect(LOCAL_DB_PATH)

    _local.conn = conn
    return conn


def reset_connection() -> None:
    """Drop this thread's connection — used between tests."""
    conn = getattr(_local, "conn", None)
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass
    _local.conn = None


# --------------------------------------------------------------------------
# Query helpers
#
# Rows come back as tuples, so every helper pairs them with cursor.description
# to produce dicts. Keeps the routers free of positional-index bugs.
# --------------------------------------------------------------------------


def _rows_to_dicts(cursor) -> list[dict[str, Any]]:
    columns = [column[0] for column in (cursor.description or [])]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def query(sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    return _rows_to_dicts(connect().execute(sql, tuple(params)))


def query_one(sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: Iterable[Any] = ()) -> int:
    """Run a write and return lastrowid."""
    conn = connect()
    cursor = conn.execute(sql, tuple(params))
    conn.commit()
    return cursor.lastrowid


def execute_many(statements: list[tuple[str, Iterable[Any]]]) -> None:
    conn = connect()
    for sql, params in statements:
        conn.execute(sql, tuple(params))
    conn.commit()


def touch(table: str, row_id: int) -> None:
    """Bump updated_at. The column default only fires on insert."""
    execute(
        f"UPDATE {table} SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
        (row_id,),
    )


def init_schema() -> None:
    """Create tables if they don't exist. Safe to call on every boot."""
    conn = connect()
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    for statement in filter(None, (part.strip() for part in sql.split(";"))):
        conn.execute(statement)
    conn.commit()
