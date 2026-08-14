"""Contact-form enquiries.

The frontend used to POST this form straight to the API of the site this
project was modelled on, which meant every prospective customer's name, email
and phone number was handed to a third party. It lands here now.

POST is public because the contact form has to work for anonymous visitors.
Everything else needs an admin token — these rows are other people's personal
data, not catalogue content.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/leads", tags=["leads"])

# Long enough for a real enquiry, short enough that the endpoint isn't a free
# blob store for anyone who finds it.
MAX_MESSAGE = 4000


class LeadBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=32)
    service: str = Field(default="", max_length=120)
    message: str = Field(default="", max_length=MAX_MESSAGE)


class HandledBody(BaseModel):
    handled: bool


@router.post("", status_code=201)
def create_lead(body: LeadBody):
    """Public. Returns only an id — never echoes the stored row back."""
    db.execute(
        """
        INSERT INTO leads (name, email, phone, service, message)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            body.name.strip(),
            str(body.email).strip(),
            body.phone.strip(),
            body.service.strip(),
            body.message.strip(),
        ),
    )
    return {"message": "Thanks for reaching out. We will get back to you shortly."}


@router.get("")
def list_leads(_: dict = Depends(require_admin)):
    return db.query(
        """
        SELECT id, name, email, phone, service, message, handled, created_at
        FROM leads
        ORDER BY handled ASC, created_at DESC
        """
    )


@router.patch("/{lead_id}")
def set_handled(lead_id: int, body: HandledBody, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM leads WHERE id = ?", (lead_id,)):
        raise HTTPException(404, "Enquiry not found.")
    db.execute("UPDATE leads SET handled = ? WHERE id = ?", (1 if body.handled else 0, lead_id))
    db.touch("leads", lead_id)
    return {"id": lead_id, "handled": body.handled}


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM leads WHERE id = ?", (lead_id,)):
        raise HTTPException(404, "Enquiry not found.")
    db.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
