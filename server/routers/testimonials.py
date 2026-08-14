"""Client testimonials.

Reading is public — the site renders these on the home page and the
Testimonials page. Writing needs an admin token.

A published testimonial is a statement a real customer made. Nothing here
invents one: the seed script loads the placeholder set that was previously
hardcoded in the frontend, and every one of those is flagged for replacement.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/testimonials", tags=["testimonials"])

SELECT_COLUMNS = "id, name, designation, rating, comment, position, created_at, updated_at"


class TestimonialBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    designation: str = Field(default="", max_length=160)
    rating: int = Field(default=5, ge=1, le=5)
    comment: str = Field(min_length=1, max_length=2000)

    @field_validator("name", "designation", "comment", mode="before")
    @classmethod
    def _strip(cls, value):
        """Strip before the length checks run, so a name of three spaces is
        rejected rather than stored as an empty string."""
        return value.strip() if isinstance(value, str) else value


class ReorderBody(BaseModel):
    ids: list[int]


def _get(testimonial_id: int) -> dict:
    row = db.query_one(
        f"SELECT {SELECT_COLUMNS} FROM testimonials WHERE id = ?", (testimonial_id,)
    )
    if not row:
        raise HTTPException(404, "Testimonial not found.")
    return row


@router.get("")
def list_testimonials():
    """Public, in display order."""
    return db.query(f"SELECT {SELECT_COLUMNS} FROM testimonials ORDER BY position, id")


@router.post("", status_code=201)
def create_testimonial(body: TestimonialBody, _: dict = Depends(require_admin)):
    last = db.query_one("SELECT MAX(position) AS max_position FROM testimonials")
    position = (last["max_position"] + 1) if last and last["max_position"] is not None else 0

    new_id = db.execute(
        """
        INSERT INTO testimonials (name, designation, rating, comment, position)
        VALUES (?, ?, ?, ?, ?)
        """,
        (body.name, body.designation, body.rating, body.comment, position),
    )
    return _get(new_id)


@router.put("/{testimonial_id}")
def update_testimonial(
    testimonial_id: int, body: TestimonialBody, _: dict = Depends(require_admin)
):
    _get(testimonial_id)
    db.execute(
        """
        UPDATE testimonials
        SET name = ?, designation = ?, rating = ?, comment = ?
        WHERE id = ?
        """,
        (body.name, body.designation, body.rating, body.comment, testimonial_id),
    )
    db.touch("testimonials", testimonial_id)
    return _get(testimonial_id)


@router.put("/{testimonial_id}/position")
def move_testimonial(testimonial_id: int, direction: str, _: dict = Depends(require_admin)):
    """Swap with the neighbour above or below.

    Swapping two rows keeps every other position untouched, so a reorder never
    rewrites the whole table.
    """
    if direction not in ("up", "down"):
        raise HTTPException(422, "direction must be 'up' or 'down'.")

    current = _get(testimonial_id)
    comparison = "<" if direction == "up" else ">"
    order = "DESC" if direction == "up" else "ASC"

    neighbour = db.query_one(
        f"""
        SELECT id, position FROM testimonials
        WHERE (position, id) {comparison} (?, ?)
        ORDER BY position {order}, id {order}
        LIMIT 1
        """,
        (current["position"], testimonial_id),
    )
    if not neighbour:
        return list_testimonials()  # already at the end; nothing to do

    db.execute(
        "UPDATE testimonials SET position = ? WHERE id = ?",
        (neighbour["position"], testimonial_id),
    )
    db.execute(
        "UPDATE testimonials SET position = ? WHERE id = ?",
        (current["position"], neighbour["id"]),
    )
    return list_testimonials()


@router.delete("/{testimonial_id}", status_code=204)
def delete_testimonial(testimonial_id: int, _: dict = Depends(require_admin)):
    _get(testimonial_id)
    db.execute("DELETE FROM testimonials WHERE id = ?", (testimonial_id,))
