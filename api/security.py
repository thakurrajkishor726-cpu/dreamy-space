"""Password hashing and session tokens.

Replaces Firebase Auth. Passwords are bcrypt hashes — the `users.password`
column never holds plaintext, so a database leak doesn't hand over accounts.
Sessions are short-lived signed JWTs; there is no server-side session store,
which keeps the API stateless enough to run serverless.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Header

from . import db

ALGORITHM = "HS256"
TOKEN_TTL_HOURS = int(os.environ.get("JWT_TTL_HOURS", "12"))

# A random fallback keeps local dev working, but it rotates on every restart
# (so sessions drop) and is refused outright in production — a shared secret
# that changes per instance would silently break a multi-instance deploy.
_SECRET = os.environ.get("JWT_SECRET", "").strip()
if not _SECRET:
    if db.is_remote():
        raise RuntimeError(
            "JWT_SECRET must be set when running against Turso. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
    _SECRET = secrets.token_urlsafe(48)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_token(user: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user["id"]),
            "email": user["email"],
            "is_admin": bool(user["is_admin"]),
            "iat": now,
            "exp": now + timedelta(hours=TOKEN_TTL_HOURS),
        },
        _SECRET,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, _SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired — sign in again.") from None
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid session token.") from None


def current_user(authorization: str = Header(default="")) -> dict[str, Any]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(401, "Missing bearer token.")

    claims = decode_token(token)

    # Re-read the user rather than trusting the token's copy of is_admin, so
    # revoking admin (or deleting the account) takes effect immediately
    # instead of whenever the token happens to expire.
    user = db.query_one(
        "SELECT id, name, email, is_admin, created_at, updated_at FROM users WHERE id = ?",
        (claims.get("sub"),),
    )
    if not user:
        raise HTTPException(401, "Account no longer exists.")
    return user


def require_admin(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if not user["is_admin"]:
        raise HTTPException(403, "Admin access required.")
    return user
