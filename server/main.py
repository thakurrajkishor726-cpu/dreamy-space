"""Dreamy Space catalogue API.

Everything the admin and the public site need: auth, categories, projects
(with per-category image sets) and Cloudinary upload signing. Data lives in
Turso; images live in Cloudinary.
"""

from __future__ import annotations

import os

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .routers import auth, categories, leads, projects, uploads

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

@asynccontextmanager
async def lifespan(_: FastAPI):
    # CREATE TABLE IF NOT EXISTS, so this is a no-op once the schema exists.
    db.init_schema()
    yield


app = FastAPI(
    title="Dreamy Space catalogue API",
    docs_url="/api/docs",
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(leads.router)
app.include_router(projects.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health() -> dict:
    """Readiness probe that reports configuration without leaking any of it."""
    return {
        "ok": True,
        "database": "turso" if db.is_remote() else "local",
        "configured": {
            "cloudinary_cloud": bool(uploads.CLOUD_NAME),
            "cloudinary_key": bool(uploads.API_KEY),
            "cloudinary_secret": bool(uploads.API_SECRET),
        },
    }
