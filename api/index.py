"""Vercel entrypoint for the API.

Vercel builds every .py file under api/ as its own serverless function, and it
loads that file as a top-level module — not as part of a package. The whole
FastAPI app used to live here, which broke both ways: `from . import db` failed
with "attempted relative import with no known parent package", and db.py,
security.py and each router were separately built as functions of their own.

So the app is a normal package at server/ and this is the only file under api/.
It re-exports the ASGI app; vercel.json bundles server/** alongside it.

    Local:  uvicorn server.main:app --reload   (or: npm run api)
    Vercel: /api/(.*) is rewritten here by vercel.json
"""

from server.main import app

__all__ = ["app"]
