"""Seed categories and their showcase images from public/images/categories.

Folder name -> category name, underscores become spaces. The images inside
each folder are recorded as local paths (/images/categories/<Folder>/<file>)
because that is where the frontend already serves them from — nothing is
uploaded anywhere. Anything added later through the admin goes to Cloudinary
and stores its delivery URL in the same column.

Paths are URL-encoded to match scripts/generate-category-manifest.mjs exactly,
so a row written here and a path in the build-time manifest are the same
string.

Idempotent: running it twice adds nothing and reorders nothing.

Run: .venv/bin/python scripts/seed_categories.py
"""

import sys
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import db  # noqa: E402

FOLDER = Path(__file__).resolve().parents[1] / "public" / "images" / "categories"
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}


def natural_key(name: str) -> list:
    """Sort "image copy 10.png" after "image copy 2.png", matching the
    numeric collation the JS manifest generator uses."""
    parts = []
    digits = ""
    for char in name.lower():
        if char.isdigit():
            digits += char
        else:
            if digits:
                parts.append((1, int(digits), ""))
                digits = ""
            parts.append((0, 0, char))
    if digits:
        parts.append((1, int(digits), ""))
    return parts


def web_path(folder: str, filename: str) -> str:
    # quote() with no safe characters, matching encodeURIComponent.
    return f"/images/categories/{quote(folder, safe='')}/{quote(filename, safe='')}"


def main() -> None:
    if not FOLDER.is_dir():
        raise SystemExit(f"Not found: {FOLDER}")

    db.init_schema()

    folders = sorted((d for d in FOLDER.iterdir() if d.is_dir()), key=lambda d: natural_key(d.name))

    added_categories, added_images, skipped_images = 0, 0, 0

    for directory in folders:
        files = sorted(
            (f.name for f in directory.iterdir() if f.suffix.lower() in IMAGE_EXT),
            key=natural_key,
        )
        if not files:
            print(f"  skip    {directory.name} (no images)")
            continue

        name = directory.name.replace("_", " ").strip()
        row = db.query_one("SELECT id FROM categories WHERE name = ?", (name,))
        if row:
            category_id = row["id"]
            print(f"  exists  {name}")
        else:
            category_id = db.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            added_categories += 1
            print(f"  added   {name}")

        existing = {
            r["image_url"]
            for r in db.query(
                "SELECT image_url FROM category_images WHERE category_id = ?", (category_id,)
            )
        }
        last = db.query_one(
            "SELECT MAX(position) AS max_position FROM category_images WHERE category_id = ?",
            (category_id,),
        )
        position = (last["max_position"] + 1) if last and last["max_position"] is not None else 0

        for filename in files:
            url = web_path(directory.name, filename)
            if url in existing:
                skipped_images += 1
                continue
            db.execute(
                "INSERT INTO category_images (category_id, image_url, position) VALUES (?, ?, ?)",
                (category_id, url, position),
            )
            position += 1
            added_images += 1

        print(f"          {len(files)} image(s) on disk")

    print(
        f"\n{added_categories} categor{'y' if added_categories == 1 else 'ies'} added, "
        f"{added_images} image(s) added, {skipped_images} already present."
    )


if __name__ == "__main__":
    main()
