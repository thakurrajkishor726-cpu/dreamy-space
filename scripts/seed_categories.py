"""Seed the categories table from public/images/categories folder names.

Folder name -> category name, underscores become spaces. Idempotent: running
it twice does not create duplicates.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import db  # noqa: E402

FOLDER = Path(__file__).resolve().parents[1] / "public" / "images" / "categories"


def main() -> None:
    if not FOLDER.is_dir():
        raise SystemExit(f"Not found: {FOLDER}")

    db.init_schema()
    names = sorted(d.name.replace("_", " ").strip() for d in FOLDER.iterdir() if d.is_dir())

    added, skipped = [], []
    for name in names:
        if db.query_one("SELECT id FROM categories WHERE name = ?", (name,)):
            skipped.append(name)
        else:
            db.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            added.append(name)

    for name in added:
        print(f"  added   {name}")
    for name in skipped:
        print(f"  exists  {name}")
    print(f"\n{len(added)} added, {len(skipped)} already present.")


if __name__ == "__main__":
    main()
