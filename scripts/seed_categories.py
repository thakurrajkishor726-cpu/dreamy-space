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

Renaming a folder breaks the rows that point into it, because a local path
carries the folder name. The script reports any local image_url whose file is
missing, and `--relink` repairs the ones it can prove: a row whose file is gone
but present under the folder that matches its category name.

    .venv/bin/python scripts/seed_categories.py
    .venv/bin/python scripts/seed_categories.py --relink
"""

import sys
from pathlib import Path
from urllib.parse import quote, unquote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import db  # noqa: E402

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


def local_file(url: str) -> Path | None:
    """Filesystem path for a local image_url, or None for a remote URL."""
    if not url.startswith("/images/categories/"):
        return None
    return Path(__file__).resolve().parents[1] / "public" / unquote(url).lstrip("/")


def audit_paths(relink: bool) -> None:
    """Report local image_urls whose file is gone, and optionally repoint them.

    A rename only ever moves the folder, and the folder is derivable from the
    category name — so if the file is missing where the row says but present
    under the category's own folder, the fix is unambiguous. Anything else is
    reported and left alone.
    """
    rows = db.query(
        """
        SELECT ci.id, ci.image_url, c.name AS category_name
        FROM category_images ci
        JOIN categories c ON c.id = ci.category_id
        ORDER BY c.name, ci.position
        """
    )

    broken, fixed, unresolved = 0, 0, []
    for row in rows:
        path = local_file(row["image_url"])
        if path is None or path.exists():
            continue

        broken += 1
        filename = unquote(row["image_url"]).rsplit("/", 1)[-1]
        expected_folder = row["category_name"].replace(" ", "_")
        candidate = FOLDER / expected_folder / filename

        if candidate.is_file():
            new_url = web_path(expected_folder, filename)
            # Re-running the seed after a rename adds correct rows alongside
            # the stale ones, so the target often already exists. Repointing
            # then would duplicate it — drop the stale row instead.
            duplicate = db.query_one(
                """
                SELECT ci.id FROM category_images ci
                JOIN categories c ON c.id = ci.category_id
                WHERE c.name = ? AND ci.image_url = ? AND ci.id != ?
                """,
                (row["category_name"], new_url, row["id"]),
            )

            if relink:
                if duplicate:
                    db.execute("DELETE FROM category_images WHERE id = ?", (row["id"],))
                    print(f"  removed   {row['image_url']}  (already present as {new_url})")
                else:
                    db.execute(
                        "UPDATE category_images SET image_url = ? WHERE id = ?",
                        (new_url, row["id"]),
                    )
                    db.touch("category_images", row["id"])
                    print(f"  relinked  {row['image_url']}  ->  {new_url}")
                fixed += 1
            else:
                print(f"  BROKEN    {row['image_url']}")
                action = "already present, would be removed" if duplicate else f"found at {new_url}"
                print(f"            {action} — run with --relink to repair")
        else:
            unresolved.append((row["category_name"], row["image_url"]))

    if not broken:
        print("\nAll local image paths resolve on disk.")
        return

    for name, url in unresolved:
        print(f"  MISSING   [{name}] {url} — no matching file found")

    if relink:
        renumber()
        print(f"\n{fixed} repaired, {len(unresolved)} still missing.")
    else:
        print(f"\n{broken} broken path(s). Re-run with --relink to repair what can be matched.")


def renumber() -> None:
    """Close the gaps a removal leaves, so position stays 0..n-1 per category."""
    for category in db.query("SELECT id FROM categories"):
        rows = db.query(
            "SELECT id FROM category_images WHERE category_id = ? ORDER BY position, id",
            (category["id"],),
        )
        for index, row in enumerate(rows):
            db.execute(
                "UPDATE category_images SET position = ? WHERE id = ? AND position != ?",
                (index, row["id"], index),
            )


def main() -> None:
    if not FOLDER.is_dir():
        raise SystemExit(f"Not found: {FOLDER}")

    relink = "--relink" in sys.argv

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

    print("\nChecking stored paths against disk:")
    audit_paths(relink)


if __name__ == "__main__":
    main()
