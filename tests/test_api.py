"""End-to-end API tests.

libSQL is SQLite, so these run against a throwaway local file — the same code
paths that hit Turso in production, with none of the risk to live data.

Run: .venv/bin/python -m pytest tests -q
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Must be set before api.db / api.security are imported.
os.environ.pop("TURSO_URL", None)
os.environ.pop("TURSO_TOKEN", None)
os.environ["CATALOGUE_DB_PATH"] = str(Path(tempfile.mkdtemp()) / "test.db")
os.environ["JWT_SECRET"] = "test-secret-not-used-anywhere-real"
os.environ["CLOUDINARY_CLOUD_NAME"] = "testcloud"
os.environ["CLOUDINARY_API_KEY"] = "123456789"
os.environ["CLOUDINARY_API_SECRET"] = "testsecret"

from fastapi.testclient import TestClient  # noqa: E402

from api import db  # noqa: E402
from api.index import app  # noqa: E402
from api.security import hash_password  # noqa: E402

client = TestClient(app)

ADMIN = {"email": "admin@example.com", "password": "correct-horse-battery"}
PLAIN = {"email": "viewer@example.com", "password": "just-a-viewer-pw"}


@pytest.fixture(scope="module", autouse=True)
def seed():
    db.init_schema()
    db.execute(
        "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)",
        ("Admin", ADMIN["email"], hash_password(ADMIN["password"])),
    )
    db.execute(
        "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)",
        ("Viewer", PLAIN["email"], hash_password(PLAIN["password"])),
    )
    for name in ("TV Unit", "Shoe Rack", "Wallpanelling Design"):
        db.execute("INSERT INTO categories (name) VALUES (?)", (name,))
    yield


def token_for(creds):
    response = client.post("/api/auth/login", json=creds)
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(creds):
    return {"Authorization": f"Bearer {token_for(creds)}"}


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------


def test_password_is_not_stored_in_plaintext():
    row = db.query_one("SELECT password FROM users WHERE email = ?", (ADMIN["email"],))
    assert ADMIN["password"] not in row["password"]
    assert row["password"].startswith("$2")  # bcrypt


def test_login_succeeds_and_returns_token():
    body = client.post("/api/auth/login", json=ADMIN).json()
    assert body["user"]["is_admin"] is True
    assert body["token"]


@pytest.mark.parametrize(
    "creds",
    [
        {"email": ADMIN["email"], "password": "wrong"},
        {"email": "nobody@example.com", "password": "whatever"},
    ],
)
def test_bad_credentials_rejected(creds):
    response = client.post("/api/auth/login", json=creds)
    assert response.status_code == 401
    # Same message either way — don't leak which addresses exist.
    assert response.json()["detail"] == "Incorrect email or password."


def test_me_requires_a_token():
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_me_returns_the_user():
    assert client.get("/api/auth/me", headers=auth(ADMIN)).json()["email"] == ADMIN["email"]


# --------------------------------------------------------------------------
# Authorisation
# --------------------------------------------------------------------------


def test_writes_rejected_without_a_token():
    assert client.post("/api/categories", json={"name": "Nope"}).status_code == 401
    assert client.post("/api/projects", json={"name": "Nope"}).status_code == 401
    assert client.post("/api/sign-upload", json={}).status_code == 401


def test_writes_rejected_for_non_admin():
    headers = auth(PLAIN)
    assert client.post("/api/categories", json={"name": "Nope"}, headers=headers).status_code == 403
    assert client.post("/api/sign-upload", json={}, headers=headers).status_code == 403


def test_reads_are_public():
    assert client.get("/api/categories").status_code == 200
    assert client.get("/api/projects").status_code == 200


def test_revoking_admin_takes_effect_immediately():
    """The token still says is_admin; the users table is what counts."""
    headers = auth(ADMIN)
    assert client.post("/api/sign-upload", json={}, headers=headers).status_code == 200

    db.execute("UPDATE users SET is_admin = 0 WHERE email = ?", (ADMIN["email"],))
    try:
        assert client.post("/api/sign-upload", json={}, headers=headers).status_code == 403
    finally:
        db.execute("UPDATE users SET is_admin = 1 WHERE email = ?", (ADMIN["email"],))


# --------------------------------------------------------------------------
# Categories
# --------------------------------------------------------------------------


def test_category_crud_and_duplicate_guard():
    headers = auth(ADMIN)

    created = client.post("/api/categories", json={"name": "Temp Cat"}, headers=headers)
    assert created.status_code == 201
    category_id = created.json()["id"]

    dupe = client.post("/api/categories", json={"name": "temp cat"}, headers=headers)
    assert dupe.status_code == 409, "name uniqueness should be case-insensitive"

    renamed = client.patch(
        f"/api/categories/{category_id}", json={"name": "Renamed Cat"}, headers=headers
    )
    assert renamed.json()["name"] == "Renamed Cat"

    assert client.delete(f"/api/categories/{category_id}", headers=headers).status_code == 204
    assert all(c["id"] != category_id for c in client.get("/api/categories").json())


# --------------------------------------------------------------------------
# Projects — the nested category/image structure
# --------------------------------------------------------------------------


def category_id(name):
    return next(c["id"] for c in client.get("/api/categories").json() if c["name"] == name)


def test_project_lifecycle_with_per_category_images():
    headers = auth(ADMIN)
    tv, shoe = category_id("TV Unit"), category_id("Shoe Rack")

    created = client.post(
        "/api/projects",
        json={
            "name": "Whitefield Apartment",
            "location": "Bengaluru",
            "categories": [
                {"category_id": tv, "images": [{"image_url": "a.jpg"}, {"image_url": "b.jpg"}]},
                {"category_id": shoe, "images": [{"image_url": "c.jpg"}]},
            ],
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    project = created.json()
    project_id = project["id"]

    assert len(project["categories"]) == 2
    by_name = {c["category_name"]: c for c in project["categories"]}
    # Images belong to the project/category pairing, not the project.
    assert [i["image_url"] for i in by_name["TV Unit"]["images"]] == ["a.jpg", "b.jpg"]
    assert [i["image_url"] for i in by_name["Shoe Rack"]["images"]] == ["c.jpg"]

    # Reorder within a category, drop the other category entirely.
    updated = client.put(
        f"/api/projects/{project_id}",
        json={
            "name": "Whitefield Apartment",
            "location": "Bengaluru",
            "categories": [
                {"category_id": tv, "images": [{"image_url": "b.jpg"}, {"image_url": "a.jpg"}]}
            ],
        },
        headers=headers,
    ).json()

    assert len(updated["categories"]) == 1
    assert [i["image_url"] for i in updated["categories"][0]["images"]] == ["b.jpg", "a.jpg"]

    # Dropping the Shoe Rack link must have cascaded its image away.
    orphans = db.query("SELECT * FROM project_category_images WHERE image_url = 'c.jpg'")
    assert orphans == []

    # Filtering by category works, and by the dropped one no longer matches.
    assert any(p["id"] == project_id for p in client.get(f"/api/projects?category_id={tv}").json())
    assert not any(
        p["id"] == project_id for p in client.get(f"/api/projects?category_id={shoe}").json()
    )

    assert client.delete(f"/api/projects/{project_id}", headers=headers).status_code == 204
    assert client.get(f"/api/projects/{project_id}").status_code == 404


def test_unchanged_images_keep_their_row_id():
    """A save that doesn't change an image shouldn't churn the row."""
    headers = auth(ADMIN)
    tv = category_id("TV Unit")

    project = client.post(
        "/api/projects",
        json={
            "name": "Stable ids",
            "location": "",
            "categories": [{"category_id": tv, "images": [{"image_url": "keep.jpg"}]}],
        },
        headers=headers,
    ).json()
    first_id = project["categories"][0]["images"][0]["id"]

    again = client.put(
        f"/api/projects/{project['id']}",
        json={
            "name": "Stable ids renamed",
            "location": "",
            "categories": [
                {"category_id": tv, "images": [{"image_url": "keep.jpg"}, {"image_url": "new.jpg"}]}
            ],
        },
        headers=headers,
    ).json()

    kept = [i for i in again["categories"][0]["images"] if i["image_url"] == "keep.jpg"][0]
    assert kept["id"] == first_id

    client.delete(f"/api/projects/{project['id']}", headers=headers)


def test_unknown_category_is_rejected():
    response = client.post(
        "/api/projects",
        json={"name": "Bad", "location": "", "categories": [{"category_id": 99999, "images": []}]},
        headers=auth(ADMIN),
    )
    assert response.status_code == 400


def test_deleting_a_category_unlinks_it_from_projects():
    headers = auth(ADMIN)
    temp = client.post("/api/categories", json={"name": "Doomed"}, headers=headers).json()

    project = client.post(
        "/api/projects",
        json={
            "name": "Has doomed category",
            "location": "",
            "categories": [
                {"category_id": temp["id"], "images": [{"image_url": "x.jpg"}]},
                {"category_id": category_id("TV Unit"), "images": []},
            ],
        },
        headers=headers,
    ).json()

    client.delete(f"/api/categories/{temp['id']}", headers=headers)

    after = client.get(f"/api/projects/{project['id']}").json()
    assert [c["category_name"] for c in after["categories"]] == ["TV Unit"]
    assert db.query("SELECT * FROM project_category_images WHERE image_url = 'x.jpg'") == []

    client.delete(f"/api/projects/{project['id']}", headers=headers)


# --------------------------------------------------------------------------
# Upload signing
# --------------------------------------------------------------------------


def test_signature_matches_cloudinarys_own_algorithm():
    body = client.post(
        "/api/sign-upload", json={"folder": "dreamyspaces/test"}, headers=auth(ADMIN)
    ).json()

    from cloudinary.utils import api_sign_request

    expected = api_sign_request(
        {"folder": body["folder"], "timestamp": body["timestamp"]}, "testsecret"
    )
    assert body["signature"] == expected


def test_health_reports_config_without_leaking_it():
    body = client.get("/api/health").json()
    assert body["ok"] is True
    assert body["database"] == "local"
    assert body["configured"]["cloudinary_secret"] is True
    assert "testsecret" not in str(body)
