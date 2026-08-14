from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryBody(BaseModel):
    name: str = Field(min_length=1)
    show_in_dashboard: bool = True


class CategoryPatch(BaseModel):
    """Every field optional, so the dashboard toggle doesn't have to resend
    the name and risk clobbering a concurrent rename."""

    name: str | None = Field(default=None, min_length=1)
    show_in_dashboard: bool | None = None


class ImageBody(BaseModel):
    image_url: str = Field(min_length=1, max_length=2048)


class ImageListBody(BaseModel):
    images: list[ImageBody] = []


def _images_for(category_id: int) -> list[dict]:
    return db.query(
        """
        SELECT id, image_url, position
        FROM category_images
        WHERE category_id = ?
        ORDER BY position, id
        """,
        (category_id,),
    )


@router.get("")
def list_categories():
    """Public. Includes a project count and the category's own showcase
    images, so the site can render the home grid without a second request.

    Two queries, not one per category: Turso is a network hop, so an N+1 here
    cost about 450ms per extra round trip and pushed this endpoint past five
    seconds once a few requests overlapped.
    """
    categories = db.query(
        """
        SELECT c.id, c.name, c.show_in_dashboard, c.created_at, c.updated_at,
               COUNT(DISTINCT pc.project_id) AS project_count
        FROM categories c
        LEFT JOIN project_categories pc ON pc.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name COLLATE NOCASE
        """
    )

    images = db.query(
        """
        SELECT id, category_id, image_url, position
        FROM category_images
        ORDER BY category_id, position, id
        """
    )

    by_category: dict[int, list[dict]] = {}
    for image in images:
        by_category.setdefault(image["category_id"], []).append(
            {"id": image["id"], "image_url": image["image_url"], "position": image["position"]}
        )

    for category in categories:
        category["show_in_dashboard"] = bool(category["show_in_dashboard"])
        category["images"] = by_category.get(category["id"], [])

    return categories


@router.post("", status_code=201)
def create_category(body: CategoryBody, _: dict = Depends(require_admin)):
    name = body.name.strip()
    if db.query_one("SELECT id FROM categories WHERE name = ?", (name,)):
        raise HTTPException(409, f'"{name}" already exists.')
    new_id = db.execute(
        "INSERT INTO categories (name, show_in_dashboard) VALUES (?, ?)",
        (name, 1 if body.show_in_dashboard else 0),
    )
    return {"id": new_id, "name": name, "show_in_dashboard": body.show_in_dashboard, "images": []}


@router.patch("/{category_id}")
def update_category(category_id: int, body: CategoryPatch, _: dict = Depends(require_admin)):
    current = db.query_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    if not current:
        raise HTTPException(404, "Category not found.")

    if body.name is not None:
        name = body.name.strip()
        clash = db.query_one(
            "SELECT id FROM categories WHERE name = ? AND id != ?", (name, category_id)
        )
        if clash:
            raise HTTPException(409, f'"{name}" already exists.')
        db.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))

    if body.show_in_dashboard is not None:
        db.execute(
            "UPDATE categories SET show_in_dashboard = ? WHERE id = ?",
            (1 if body.show_in_dashboard else 0, category_id),
        )

    db.touch("categories", category_id)
    updated = db.query_one("SELECT * FROM categories WHERE id = ?", (category_id,))
    return {
        "id": updated["id"],
        "name": updated["name"],
        "show_in_dashboard": bool(updated["show_in_dashboard"]),
    }


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM categories WHERE id = ?", (category_id,)):
        raise HTTPException(404, "Category not found.")
    # ON DELETE CASCADE clears project_categories, their images, and this
    # category's own showcase images.
    db.execute("DELETE FROM categories WHERE id = ?", (category_id,))


# --------------------------------------------------------------------------
# Category showcase images
# --------------------------------------------------------------------------


def _require_category(category_id: int) -> dict:
    category = db.query_one("SELECT id FROM categories WHERE id = ?", (category_id,))
    if not category:
        raise HTTPException(404, "Category not found.")
    return category


@router.get("/{category_id}/images")
def list_category_images(category_id: int):
    _require_category(category_id)
    return _images_for(category_id)


@router.put("/{category_id}/images")
def replace_category_images(
    category_id: int, body: ImageListBody, _: dict = Depends(require_admin)
):
    """Replace the whole list in one call — that is what the admin's drag-to-
    reorder grid produces.

    Rows are diffed by image_url rather than deleted and recreated, so an
    unchanged image keeps its id and created_at across a save.
    """
    _require_category(category_id)

    desired = [image.image_url.strip() for image in body.images]
    # A duplicate URL would make the diff ambiguous and give the grid two
    # tiles that cannot be told apart.
    if len(set(desired)) != len(desired):
        raise HTTPException(422, "The same image appears more than once.")

    current = db.query(
        "SELECT id, image_url FROM category_images WHERE category_id = ?", (category_id,)
    )
    current_by_url = {row["image_url"]: row["id"] for row in current}

    for url, image_id in current_by_url.items():
        if url not in desired:
            db.execute("DELETE FROM category_images WHERE id = ?", (image_id,))

    for position, url in enumerate(desired):
        image_id = current_by_url.get(url)
        if image_id is None:
            db.execute(
                "INSERT INTO category_images (category_id, image_url, position) VALUES (?, ?, ?)",
                (category_id, url, position),
            )
        else:
            db.execute("UPDATE category_images SET position = ? WHERE id = ?", (position, image_id))
            db.touch("category_images", image_id)

    return _images_for(category_id)


@router.post("/{category_id}/images", status_code=201)
def add_category_image(category_id: int, body: ImageBody, _: dict = Depends(require_admin)):
    _require_category(category_id)
    url = body.image_url.strip()

    if db.query_one(
        "SELECT id FROM category_images WHERE category_id = ? AND image_url = ?",
        (category_id, url),
    ):
        raise HTTPException(409, "That image is already on this category.")

    last = db.query_one(
        "SELECT MAX(position) AS max_position FROM category_images WHERE category_id = ?",
        (category_id,),
    )
    position = (last["max_position"] + 1) if last and last["max_position"] is not None else 0

    new_id = db.execute(
        "INSERT INTO category_images (category_id, image_url, position) VALUES (?, ?, ?)",
        (category_id, url, position),
    )
    return {"id": new_id, "image_url": url, "position": position}


@router.delete("/{category_id}/images/{image_id}", status_code=204)
def delete_category_image(category_id: int, image_id: int, _: dict = Depends(require_admin)):
    row = db.query_one(
        "SELECT id FROM category_images WHERE id = ? AND category_id = ?", (image_id, category_id)
    )
    if not row:
        raise HTTPException(404, "Image not found on this category.")
    db.execute("DELETE FROM category_images WHERE id = ?", (image_id,))
