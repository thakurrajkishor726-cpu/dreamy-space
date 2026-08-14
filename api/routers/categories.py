from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/categories", tags=["categories"])


class CategoryBody(BaseModel):
    name: str = Field(min_length=1)


@router.get("")
def list_categories():
    """Public. Includes a project count so the UI can show what's in each."""
    return db.query(
        """
        SELECT c.id, c.name, c.created_at, c.updated_at,
               COUNT(DISTINCT pc.project_id) AS project_count
        FROM categories c
        LEFT JOIN project_categories pc ON pc.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name COLLATE NOCASE
        """
    )


@router.post("", status_code=201)
def create_category(body: CategoryBody, _: dict = Depends(require_admin)):
    name = body.name.strip()
    if db.query_one("SELECT id FROM categories WHERE name = ?", (name,)):
        raise HTTPException(409, f'"{name}" already exists.')
    new_id = db.execute("INSERT INTO categories (name) VALUES (?)", (name,))
    return {"id": new_id, "name": name}


@router.patch("/{category_id}")
def update_category(category_id: int, body: CategoryBody, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM categories WHERE id = ?", (category_id,)):
        raise HTTPException(404, "Category not found.")

    name = body.name.strip()
    clash = db.query_one(
        "SELECT id FROM categories WHERE name = ? AND id != ?", (name, category_id)
    )
    if clash:
        raise HTTPException(409, f'"{name}" already exists.')

    db.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))
    db.touch("categories", category_id)
    return {"id": category_id, "name": name}


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM categories WHERE id = ?", (category_id,)):
        raise HTTPException(404, "Category not found.")
    # ON DELETE CASCADE clears project_categories and their images.
    db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
