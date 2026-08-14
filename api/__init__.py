"""Dreamy Space API package.

Loads .env before anything else imports, because db.py, security.py and
uploads.py all read os.environ at module scope.

Why this exists: nothing used to load .env, so the values had to be exported
into the shell by hand before starting uvicorn. That makes the running process
hold a snapshot of whatever was exported at boot — and `uvicorn --reload`
re-imports modules but cannot change a process's environment. A key rotated in
.env therefore kept failing for hours against the stale one still in memory,
surfacing as a Cloudinary "missing permissions (actions=[create])" error with
nothing in the app to explain it.
"""

import os
from pathlib import Path

_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def _load_dotenv(path: Path = _ENV_PATH) -> None:
    """Fill os.environ from .env.

    Real environment variables always win (setdefault), so a proper deploy
    that injects secrets is unaffected, and the test suite can pin values by
    setting them first. Tests that need to force local mode set TURSO_URL to
    an empty string rather than deleting it, so this cannot put the remote
    credentials back and point them at production.
    """
    if not path.is_file():
        return

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        if key.startswith("export "):
            key = key[len("export ") :].strip()

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]

        if key:
            os.environ.setdefault(key, value)


_load_dotenv()
