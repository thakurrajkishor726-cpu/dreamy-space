# Catalogue setup

The catalogue is a **FastAPI** service backed by **Turso** (hosted SQLite), with
images on **Cloudinary**. No Firebase anywhere.

Two free accounts, neither needs a credit card.

---

## 1. Turso (database)

1. Sign up at [turso.tech](https://turso.tech) — free tier is 5 GB, 1B reads and
   25M writes a month, no card, never expires.
2. Create a database, then **Connect** to get the URL and an auth token.
3. Put them in `.env` as `TURSO_URL` and `TURSO_TOKEN`.

Tables are created automatically on first boot — `CREATE TABLE IF NOT EXISTS`,
so it's a no-op afterwards.

## 2. Cloudinary (images)

1. Sign up at [cloudinary.com](https://cloudinary.com) — free, no card.
2. **Dashboard** → copy **Cloud name**, **API key**, **API secret** into `.env`
   as `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.

No upload preset is needed. Uploads are signed by the API, so the secret never
reaches a browser and an unauthenticated upload is impossible.

Sanity check at any time:

```bash
npm run check:env
```

It compares `.env` against every variable the code actually reads, and flags
both a missing key and a stale one nothing reads any more.

## 3. Session secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

into `JWT_SECRET`. The API refuses to start against Turso without one — a
secret that differs per instance would silently break a multi-instance deploy.

## 4. Run it

```bash
cp .env.example .env          # then fill it in

python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# once, to load categories + their images from public/images/categories
set -a && source .env && set +a
.venv/bin/python scripts/seed_categories.py

# once, to load the starter testimonials (placeholders — replace them)
.venv/bin/python scripts/seed_testimonials.py

# create your login
.venv/bin/python scripts/create_admin.py you@example.com "Your Name"
```

Two terminals:

```bash
npm run api      # FastAPI on :8000
npm run dev      # Vite on :5173, proxies /api to :8000
```

Then **http://localhost:5173/admin**.

`GET /api/health` reports which values it found. Interactive API docs are at
`/api/docs`.

---

## Data model

```
users                     name, email, password (bcrypt), is_admin
categories                name, show_in_dashboard
category_images           category_id, image_url, position
projects                  name, location
project_categories        project_id, category_id
project_category_images   project_categories_id, image_url, position
testimonials              name, designation, rating (1-5), comment, position
leads                     name, email, phone, service, message, handled
```

Every table also has `id`, `created_at`, `updated_at`.

The shape worth noticing: **images hang off `project_categories`, not
`projects`.** A job tagged both *TV Unit* and *Shoe Rack* keeps a separate set
of photos for each, rather than one pooled gallery. The admin reflects that —
selecting a category opens its own image grid.

Deletes cascade: removing a category unlinks it from every project and takes
that link's images with it; the projects themselves survive.

## Two sections, two sources

**Our Work** (`/our-work`) — the six wardrobe/unit categories. These images
ship with the frontend under `public/images/categories/<Folder_Name>/` and are
served from that path directly. Folder names become category names with
underscores replaced by spaces (`TV_Unit` → `TV Unit`), which is the same rule
`seed_categories.py` uses, so the two line up.

Browsers can't list a directory, so `npm run categories:manifest` generates
`src/data/categoryImages.js`. It runs automatically before `dev` and `build`;
run it by hand after adding or renaming a folder.

**Projects** (`/projects`) — client work from the database, with images on
Cloudinary.

## Deploying

[`vercel.json`](vercel.json) routes `/api/*` to the Python function and
everything else to the SPA — one repo, one deploy. Set every server-side
variable from `.env.example` in *Project Settings → Environment Variables*, and
put your production URL in `ALLOWED_ORIGINS`.

### Why the app lives in `server/`, not `api/`

Vercel builds **every `.py` file under `api/` as its own serverless function**,
and it loads that file as a top-level module rather than as part of a package.
With the whole app in `api/`, that broke twice over: `api/index.py` failed on
`from . import db` with *"attempted relative import with no known parent
package"*, and `db.py`, `security.py` and each router were separately built as
functions that export no handler.

So the FastAPI app is an ordinary package at `server/`, and `api/index.py` is
the only file under `api/` — three lines that re-export the ASGI app.
`vercel.json` bundles the package next to it:

```json
"functions": {
  "api/index.py": { "includeFiles": "server/**" }
}
```

`includeFiles` is not optional: `server/` is outside the function directory, so
without it neither the package nor `schema.sql` (read at runtime) ships.

Everything imported at module scope must be in `requirements.txt` or the
function crashes on cold start and every route returns 500.

## Things worth knowing

- **Passwords are bcrypt hashes.** The `users.password` column never holds
  plaintext, so a database leak doesn't hand over accounts.
- **Admin is re-checked per request** against the users table, not read from
  the token. Setting `is_admin = 0` locks someone out immediately rather than
  whenever their token happens to expire.
- **The session token lives in localStorage**, readable by any script on the
  origin. That's the accepted trade for a static SPA with no cookie backend;
  the mitigations are the 12-hour TTL and that per-request admin check.
- **Removing an image** detaches it from the project but leaves the file in
  Cloudinary. Tidy up in the Media Library if storage gets tight.
- **Team and testimonials are not in this schema** and still read the old API.
  Say the word and they can become tables like the rest.

## Tests

```bash
.venv/bin/python -m pytest tests -q
```

libSQL is SQLite, so the suite runs against a throwaway local file — the same
code paths that hit Turso in production, with no risk to live data.
