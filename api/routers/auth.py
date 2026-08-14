from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from .. import db
from ..security import create_token, current_user, hash_password, require_admin, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class CreateUserBody(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    is_admin: bool = False


@router.post("/login")
def login(body: LoginBody):
    user = db.query_one("SELECT * FROM users WHERE email = ?", (body.email,))

    # Same message and roughly the same work either way, so the response
    # doesn't reveal which addresses have accounts.
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Incorrect email or password.")

    return {
        "token": create_token(user),
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "is_admin": bool(user["is_admin"]),
        },
    }


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return {**user, "is_admin": bool(user["is_admin"])}


@router.get("/users")
def list_users(_: dict = Depends(require_admin)):
    return db.query(
        "SELECT id, name, email, is_admin, created_at, updated_at FROM users ORDER BY id"
    )


@router.post("/users", status_code=201)
def create_user(body: CreateUserBody, _: dict = Depends(require_admin)):
    if db.query_one("SELECT id FROM users WHERE email = ?", (body.email,)):
        raise HTTPException(409, "That email is already registered.")

    user_id = db.execute(
        "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
        (body.name, body.email, hash_password(body.password), int(body.is_admin)),
    )
    return {"id": user_id, "name": body.name, "email": body.email, "is_admin": body.is_admin}
