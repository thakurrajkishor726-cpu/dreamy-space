"""Copy every table from one Turso database to another.

    TURSO_URL=<source>       TURSO_TOKEN=<source token>
    DEST_TURSO_URL=<target>  DEST_TURSO_TOKEN=<target token>
    .venv/bin/python scripts/migrate_turso.py [--force]

Rows keep their ids, so every foreign key still points at the same row and
nothing has to be rewritten. Tables are copied parents-first for the same
reason.

Refuses to run when the destination already holds data, unless --force —
copying twice would duplicate every row rather than fail, because the ids are
carried over into tables that mostly have no unique constraint.

Read-only against the source. Nothing is deleted anywhere.
"""

import os
import sys
from pathlib import Path

import libsql

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server  # noqa: E402,F401  (loads .env)

SCHEMA = Path(__file__).resolve().parents[1] / "server" / "schema.sql"

# Parents before children, so foreign keys resolve as rows land.
TABLES = [
    "users",
    "categories",
    "category_images",
    "projects",
    "project_categories",
    "project_category_images",
    "testimonials",
    "leads",
]


def connect(url: str, token: str):
    if not url or not token:
        raise SystemExit("Both a URL and a token are required for each side.")
    return libsql.connect(url, auth_token=token)


def rows(conn, sql: str, params=()):
    cursor = conn.execute(sql, params)
    columns = [c[0] for c in (cursor.description or [])]
    return columns, cursor.fetchall()


def count(conn, table: str) -> int:
    try:
        return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    except Exception:
        return 0


def main() -> None:
    force = "--force" in sys.argv

    source = connect(os.environ.get("TURSO_URL", ""), os.environ.get("TURSO_TOKEN", ""))
    dest = connect(
        os.environ.get("DEST_TURSO_URL", ""), os.environ.get("DEST_TURSO_TOKEN", "")
    )

    print("applying schema to the destination")
    sql = SCHEMA.read_text(encoding="utf-8")
    for statement in filter(None, (part.strip() for part in sql.split(";"))):
        dest.execute(statement)
    dest.commit()
    # The column added after the first release.
    existing = {r[1] for r in dest.execute("PRAGMA table_info(categories)").fetchall()}
    if "show_in_dashboard" not in existing:
        dest.execute(
            "ALTER TABLE categories ADD COLUMN show_in_dashboard INTEGER NOT NULL DEFAULT 1"
        )
        dest.commit()

    occupied = {t: count(dest, t) for t in TABLES}
    if any(occupied.values()) and not force:
        print("\nDestination is not empty:")
        for table, n in occupied.items():
            if n:
                print(f"  {table}: {n} row(s)")
        raise SystemExit(
            "\nRefusing to copy into it — a second pass would duplicate every row.\n"
            "Re-run with --force only if you know it should be merged."
        )

    print("\ncopying")
    totals = {}
    for table in TABLES:
        columns, data = rows(source, f"SELECT * FROM {table}")
        if not data:
            print(f"  {table:<24} 0")
            totals[table] = 0
            continue

        placeholders = ", ".join("?" for _ in columns)
        column_list = ", ".join(columns)
        statement = f"INSERT INTO {table} ({column_list}) VALUES ({placeholders})"
        for row in data:
            dest.execute(statement, tuple(row))
        dest.commit()

        totals[table] = len(data)
        print(f"  {table:<24} {len(data)}")

    print("\nverifying")
    ok = True
    for table in TABLES:
        src_n, dst_n = count(source, table), count(dest, table)
        mark = "ok" if src_n == dst_n else "MISMATCH"
        if src_n != dst_n:
            ok = False
        print(f"  {table:<24} source {src_n:<5} destination {dst_n:<5} {mark}")

    print("\n" + ("Every table matches." if ok else "Row counts differ — do not switch over."))
    if not ok:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
