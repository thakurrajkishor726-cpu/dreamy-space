"""Cloudinary upload signing.

The API secret can never live in a Vite bundle, so signing happens here.
Authority now comes from our own JWT + the users table rather than Firebase.
"""

from __future__ import annotations

import hashlib
import os
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..security import require_admin

router = APIRouter(prefix="/api", tags=["uploads"])

CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
DEFAULT_FOLDER = os.environ.get("CLOUDINARY_FOLDER", "dreamyspaces")


class SignBody(BaseModel):
    folder: str | None = None


@router.post("/sign-upload")
def sign_upload(body: SignBody, _: dict = Depends(require_admin)):
    if not (API_SECRET and API_KEY and CLOUD_NAME):
        raise HTTPException(500, "Cloudinary credentials are not configured on the server.")

    timestamp = int(time.time())
    folder = (body.folder or DEFAULT_FOLDER).strip("/")

    # Cloudinary signs the alphabetically sorted `key=value` pairs of every
    # upload parameter except file, api_key, cloud_name and resource_type.
    # The client must send back exactly these and nothing more.
    params = {"folder": folder, "timestamp": timestamp}
    to_sign = "&".join(f"{key}={params[key]}" for key in sorted(params))
    signature = hashlib.sha1(f"{to_sign}{API_SECRET}".encode()).hexdigest()

    return {
        "cloudName": CLOUD_NAME,
        "apiKey": API_KEY,
        "timestamp": timestamp,
        "folder": folder,
        "signature": signature,
    }
