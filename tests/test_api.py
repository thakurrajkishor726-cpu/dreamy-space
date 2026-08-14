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

# Must be set before server.db / server.security are imported.
#
# Set to empty rather than deleted: server/__init__.py fills os.environ from .env
# with setdefault, so a deleted key would be repopulated from the real Turso
# credentials and the suite would run against production.
os.environ["TURSO_URL"] = ""
os.environ["TURSO_TOKEN"] = ""
os.environ["CATALOGUE_DB_PATH"] = str(Path(tempfile.mkdtemp()) / "test.db")
os.environ["JWT_SECRET"] = "test-secret-not-used-anywhere-real"
os.environ["CLOUDINARY_CLOUD_NAME"] = "testcloud"
os.environ["CLOUDINARY_API_KEY"] = "123456789"
os.environ["CLOUDINARY_API_SECRET"] = "testsecret"

from fastapi.testclient import TestClient  # noqa: E402

from server import db  # noqa: E402
from server.main import app  # noqa: E402
from server.security import hash_password  # noqa: E402

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


# --------------------------------------------------------------------------
# Leads (contact form)
#
# These rows are prospective customers' personal data. The form has to accept
# anonymous submissions, but nothing else about them may be public.
# --------------------------------------------------------------------------


LEAD = {
    "name": "Ananya Sharma",
    "email": "ananya@example.com",
    "phone": "9876543210",
    "service": "TV Unit",
    "message": "Living room media wall, roughly 10ft, needed by March.",
}


def test_anyone_can_submit_the_contact_form():
    response = client.post("/api/leads", json=LEAD)
    assert response.status_code == 201, response.text
    assert "message" in response.json()


def test_submitting_a_lead_does_not_echo_it_back():
    """A public endpoint that returned the stored row would leak the last
    submission to whoever posted next."""
    body = client.post("/api/leads", json=LEAD).json()
    assert LEAD["email"] not in str(body)
    assert LEAD["phone"] not in str(body)


def test_lead_is_persisted_with_the_submitted_values():
    client.post("/api/leads", json={**LEAD, "message": "persistence check"})
    row = db.query_one("SELECT * FROM leads WHERE message = ?", ("persistence check",))
    assert row["name"] == LEAD["name"]
    assert row["email"] == LEAD["email"]
    assert row["handled"] == 0


def test_reading_leads_requires_a_token():
    assert client.get("/api/leads").status_code == 401


def test_reading_leads_requires_admin_not_just_a_login():
    assert client.get("/api/leads", headers=auth(PLAIN)).status_code == 403


def test_admin_can_read_leads():
    rows = client.get("/api/leads", headers=auth(ADMIN)).json()
    assert any(row["email"] == LEAD["email"] for row in rows)


def test_lead_rejects_a_malformed_email():
    bad = client.post("/api/leads", json={**LEAD, "email": "not-an-email"})
    assert bad.status_code == 422


def test_lead_message_is_length_capped():
    """Otherwise the public endpoint is a free blob store."""
    huge = client.post("/api/leads", json={**LEAD, "message": "x" * 5000})
    assert huge.status_code == 422


def test_admin_can_mark_a_lead_handled_and_delete_it():
    created = client.post("/api/leads", json={**LEAD, "message": "to be handled"})
    assert created.status_code == 201
    lead_id = db.query_one("SELECT id FROM leads WHERE message = ?", ("to be handled",))["id"]

    marked = client.patch(f"/api/leads/{lead_id}", json={"handled": True}, headers=auth(ADMIN))
    assert marked.status_code == 200
    assert db.query_one("SELECT handled FROM leads WHERE id = ?", (lead_id,))["handled"] == 1

    assert client.delete(f"/api/leads/{lead_id}", headers=auth(ADMIN)).status_code == 204
    assert db.query_one("SELECT id FROM leads WHERE id = ?", (lead_id,)) is None


def test_non_admin_cannot_delete_a_lead():
    client.post("/api/leads", json={**LEAD, "message": "not yours to delete"})
    lead_id = db.query_one("SELECT id FROM leads WHERE message = ?", ("not yours to delete",))["id"]
    assert client.delete(f"/api/leads/{lead_id}", headers=auth(PLAIN)).status_code == 403
    assert db.query_one("SELECT id FROM leads WHERE id = ?", (lead_id,)) is not None


# --------------------------------------------------------------------------
# Category showcase images + dashboard visibility
# --------------------------------------------------------------------------


def new_category(name):
    response = client.post("/api/categories", json={"name": name}, headers=auth(ADMIN))
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_categories_default_to_showing_on_the_dashboard():
    category_id = new_category("Defaults Check")
    row = next(c for c in client.get("/api/categories").json() if c["id"] == category_id)
    assert row["show_in_dashboard"] is True
    assert row["images"] == []


def test_dashboard_visibility_can_be_toggled_without_resending_the_name():
    category_id = new_category("Toggle Me")
    response = client.patch(
        f"/api/categories/{category_id}", json={"show_in_dashboard": False}, headers=auth(ADMIN)
    )
    assert response.status_code == 200, response.text
    assert response.json()["show_in_dashboard"] is False
    # The name must survive a body that never mentioned it.
    assert response.json()["name"] == "Toggle Me"


def test_renaming_leaves_dashboard_visibility_alone():
    category_id = new_category("Rename Me")
    client.patch(
        f"/api/categories/{category_id}", json={"show_in_dashboard": False}, headers=auth(ADMIN)
    )
    renamed = client.patch(
        f"/api/categories/{category_id}", json={"name": "Renamed"}, headers=auth(ADMIN)
    ).json()
    assert renamed["name"] == "Renamed"
    assert renamed["show_in_dashboard"] is False


def test_toggling_visibility_requires_admin():
    category_id = new_category("Guarded")
    assert (
        client.patch(
            f"/api/categories/{category_id}",
            json={"show_in_dashboard": False},
            headers=auth(PLAIN),
        ).status_code
        == 403
    )


def test_category_images_accept_both_local_paths_and_cloudinary_urls():
    """The originals are local files; anything added later is a Cloudinary
    URL. Both live in the same ordered list."""
    category_id = new_category("Mixed Sources")
    local = "/images/categories/TV_Unit/image.png"
    remote = "https://res.cloudinary.com/demo/image/upload/v1/dreamyspaces/tv.jpg"

    response = client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": local}, {"image_url": remote}]},
        headers=auth(ADMIN),
    )
    assert response.status_code == 200, response.text
    assert [row["image_url"] for row in response.json()] == [local, remote]
    assert [row["position"] for row in response.json()] == [0, 1]


def test_reordering_images_keeps_their_row_ids():
    """Delete-and-recreate would churn ids and created_at on every save."""
    category_id = new_category("Reorder Me")
    urls = ["/images/a.png", "/images/b.png", "/images/c.png"]
    first = client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": u} for u in urls]},
        headers=auth(ADMIN),
    ).json()
    ids_by_url = {row["image_url"]: row["id"] for row in first}

    reordered = client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": u} for u in reversed(urls)]},
        headers=auth(ADMIN),
    ).json()

    assert [row["image_url"] for row in reordered] == list(reversed(urls))
    assert {row["image_url"]: row["id"] for row in reordered} == ids_by_url


def test_replacing_images_drops_the_ones_left_out():
    category_id = new_category("Prune Me")
    client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": "/images/x.png"}, {"image_url": "/images/y.png"}]},
        headers=auth(ADMIN),
    )
    remaining = client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": "/images/y.png"}]},
        headers=auth(ADMIN),
    ).json()
    assert [row["image_url"] for row in remaining] == ["/images/y.png"]


def test_duplicate_images_are_rejected():
    """Two identical URLs make the diff ambiguous and give the admin grid two
    tiles it cannot tell apart."""
    category_id = new_category("Dupe Check")
    response = client.put(
        f"/api/categories/{category_id}/images",
        json={"images": [{"image_url": "/images/same.png"}, {"image_url": "/images/same.png"}]},
        headers=auth(ADMIN),
    )
    assert response.status_code == 422


def test_adding_and_deleting_a_single_image():
    category_id = new_category("Single Ops")
    created = client.post(
        f"/api/categories/{category_id}/images",
        json={"image_url": "/images/one.png"},
        headers=auth(ADMIN),
    )
    assert created.status_code == 201, created.text
    image_id = created.json()["id"]

    assert len(client.get(f"/api/categories/{category_id}/images").json()) == 1

    deleted = client.delete(
        f"/api/categories/{category_id}/images/{image_id}", headers=auth(ADMIN)
    )
    assert deleted.status_code == 204
    assert client.get(f"/api/categories/{category_id}/images").json() == []


def test_an_image_cannot_be_deleted_through_a_different_category():
    """Otherwise the category in the path is decorative and any id is fair
    game."""
    owner = new_category("Owner Cat")
    other = new_category("Other Cat")
    image_id = client.post(
        f"/api/categories/{owner}/images",
        json={"image_url": "/images/owned.png"},
        headers=auth(ADMIN),
    ).json()["id"]

    assert client.delete(f"/api/categories/{other}/images/{image_id}", headers=auth(ADMIN)).status_code == 404
    assert len(client.get(f"/api/categories/{owner}/images").json()) == 1


def test_category_images_are_public_to_read_but_admin_to_write():
    category_id = new_category("Perms Check")
    assert client.get(f"/api/categories/{category_id}/images").status_code == 200
    assert (
        client.put(
            f"/api/categories/{category_id}/images",
            json={"images": [{"image_url": "/images/nope.png"}]},
        ).status_code
        == 401
    )
    assert (
        client.put(
            f"/api/categories/{category_id}/images",
            json={"images": [{"image_url": "/images/nope.png"}]},
            headers=auth(PLAIN),
        ).status_code
        == 403
    )


def test_deleting_a_category_takes_its_images_with_it():
    category_id = new_category("Cascade Me")
    client.post(
        f"/api/categories/{category_id}/images",
        json={"image_url": "/images/gone.png"},
        headers=auth(ADMIN),
    )
    assert client.delete(f"/api/categories/{category_id}", headers=auth(ADMIN)).status_code == 204
    assert db.query_one(
        "SELECT id FROM category_images WHERE category_id = ?", (category_id,)
    ) is None


# --------------------------------------------------------------------------
# Schema migration
#
# show_in_dashboard was added after the first release. CREATE TABLE IF NOT
# EXISTS does nothing to a table that already exists and SQLite has no ADD
# COLUMN IF NOT EXISTS, so without _ensure_column the flag would only ever
# appear on a brand new database — and never on the live Turso one.
# --------------------------------------------------------------------------


def _probe_columns():
    return {row["name"] for row in db.query("PRAGMA table_info(migration_probe)")}


def test_ensure_column_adds_a_missing_column_to_an_existing_table():
    db.execute("DROP TABLE IF EXISTS migration_probe")
    db.execute("CREATE TABLE migration_probe (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
    db.execute("INSERT INTO migration_probe (name) VALUES ('pre-existing row')")
    assert "flag" not in _probe_columns()

    db._ensure_column("migration_probe", "flag", "flag INTEGER NOT NULL DEFAULT 1")

    assert "flag" in _probe_columns()
    row = db.query_one("SELECT name, flag FROM migration_probe")
    assert row["name"] == "pre-existing row", "existing data must survive the migration"
    assert row["flag"] == 1, "existing rows must pick up the column default"

    # Every boot calls this, so a second run must be a no-op rather than an error.
    db._ensure_column("migration_probe", "flag", "flag INTEGER NOT NULL DEFAULT 1")
    assert "flag" in _probe_columns()

    db.execute("DROP TABLE migration_probe")


def test_init_schema_is_safe_to_run_twice():
    db.init_schema()
    db.init_schema()
    assert "show_in_dashboard" in {
        row["name"] for row in db.query("PRAGMA table_info(categories)")
    }


# --------------------------------------------------------------------------
# Testimonials
# --------------------------------------------------------------------------


QUOTE = {
    "name": "Ananya Sharma",
    "designation": "Homeowner, Whitefield",
    "rating": 5,
    "comment": "They measured everything twice and the tall unit is the thing I use most.",
}


def make_quote(**overrides):
    response = client.post("/api/testimonials", json={**QUOTE, **overrides}, headers=auth(ADMIN))
    assert response.status_code == 201, response.text
    return response.json()


def test_testimonials_are_public_to_read():
    make_quote(name="Publicly Visible")
    listed = client.get("/api/testimonials")
    assert listed.status_code == 200
    assert any(row["name"] == "Publicly Visible" for row in listed.json())


def test_creating_a_testimonial_requires_admin():
    assert client.post("/api/testimonials", json=QUOTE).status_code == 401
    assert client.post("/api/testimonials", json=QUOTE, headers=auth(PLAIN)).status_code == 403


def test_testimonial_round_trips_every_field():
    created = make_quote(name="Round Trip", rating=4)
    assert created["name"] == "Round Trip"
    assert created["designation"] == QUOTE["designation"]
    assert created["rating"] == 4
    assert created["comment"] == QUOTE["comment"]


def test_rating_must_be_one_to_five():
    for bad in (0, 6, -1, 99):
        response = client.post(
            "/api/testimonials", json={**QUOTE, "rating": bad}, headers=auth(ADMIN)
        )
        assert response.status_code == 422, f"rating {bad} should be rejected"


def test_database_also_rejects_an_out_of_range_rating():
    """The API validates, but a star row is rendered by repeating a character
    `rating` times — a direct SQL write must not be able to break it."""
    import pytest as _pytest

    with _pytest.raises(Exception):
        db.execute(
            "INSERT INTO testimonials (name, comment, rating) VALUES (?, ?, ?)",
            ("Bad Row", "nope", 9),
        )


def test_whitespace_only_name_or_comment_is_rejected():
    """min_length alone would pass three spaces and then store an empty
    string, putting a nameless quote on the home page."""
    for field in ("name", "comment"):
        for blank in ("", "   ", "\n\t"):
            response = client.post(
                "/api/testimonials", json={**QUOTE, field: blank}, headers=auth(ADMIN)
            )
            assert response.status_code == 422, f"{field}={blank!r} should be rejected"


def test_surrounding_whitespace_is_trimmed_not_rejected():
    created = make_quote(name="  Padded Name  ", comment="  Padded comment.  ")
    assert created["name"] == "Padded Name"
    assert created["comment"] == "Padded comment."


def test_a_rejected_write_does_not_wedge_the_connection():
    """A statement that raises leaves its transaction open; the thread-local
    connection is long lived, so the next write would fail with "database is
    locked" and look nothing like its cause."""
    import pytest as _pytest

    with _pytest.raises(Exception):
        db.execute(
            "INSERT INTO testimonials (name, comment, rating) VALUES (?, ?, ?)",
            ("Wedge Test", "nope", 42),
        )

    # The very next write must still succeed.
    assert make_quote(name="After A Failed Write")["name"] == "After A Failed Write"


def test_updating_a_testimonial():
    created = make_quote(name="Before Edit")
    updated = client.put(
        f"/api/testimonials/{created['id']}",
        json={**QUOTE, "name": "After Edit", "rating": 3},
        headers=auth(ADMIN),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "After Edit"
    assert updated.json()["rating"] == 3


def test_updating_requires_admin():
    created = make_quote(name="Guarded Edit")
    assert client.put(f"/api/testimonials/{created['id']}", json=QUOTE).status_code == 401
    assert (
        client.put(
            f"/api/testimonials/{created['id']}", json=QUOTE, headers=auth(PLAIN)
        ).status_code
        == 403
    )


def test_deleting_a_testimonial():
    created = make_quote(name="To Delete")
    assert (
        client.delete(f"/api/testimonials/{created['id']}", headers=auth(ADMIN)).status_code == 204
    )
    assert all(row["id"] != created["id"] for row in client.get("/api/testimonials").json())


def test_deleting_requires_admin():
    created = make_quote(name="Guarded Delete")
    assert client.delete(f"/api/testimonials/{created['id']}", headers=auth(PLAIN)).status_code == 403


def test_missing_testimonial_is_404_not_500():
    assert client.put("/api/testimonials/999999", json=QUOTE, headers=auth(ADMIN)).status_code == 404
    assert client.delete("/api/testimonials/999999", headers=auth(ADMIN)).status_code == 404


def test_reordering_swaps_neighbours_and_holds():
    """Order is what the site displays, so it has to survive a round trip."""
    db.execute("DELETE FROM testimonials")
    first = make_quote(name="First")
    second = make_quote(name="Second")
    third = make_quote(name="Third")

    order = lambda: [r["name"] for r in client.get("/api/testimonials").json()]  # noqa: E731
    assert order() == ["First", "Second", "Third"]

    moved = client.put(
        f"/api/testimonials/{third['id']}/position?direction=up", headers=auth(ADMIN)
    )
    assert moved.status_code == 200, moved.text
    assert order() == ["First", "Third", "Second"]

    client.put(f"/api/testimonials/{first['id']}/position?direction=down", headers=auth(ADMIN))
    assert order() == ["Third", "First", "Second"]

    # Already last: a no-op, not an error and not a corrupted order.
    client.put(f"/api/testimonials/{second['id']}/position?direction=down", headers=auth(ADMIN))
    assert order() == ["Third", "First", "Second"]


def test_reordering_requires_admin():
    row = client.get("/api/testimonials").json()[0]
    assert (
        client.put(
            f"/api/testimonials/{row['id']}/position?direction=up", headers=auth(PLAIN)
        ).status_code
        == 403
    )
