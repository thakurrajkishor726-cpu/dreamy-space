# Dreamy Space

Site and catalogue admin for Dreamy Space, an interior design studio in
Bengaluru. Made-to-measure wardrobes, TV units, shoe racks, crockery units,
pooja units and wall panelling.

One repo, one deploy: a Vite/React site and a FastAPI service that share an
origin on Vercel.

## Stack

- **Vite 8 + React 19**, React Router 7, Bootstrap 5.3 for the grid
- **Framer Motion** — page and section reveals, the project lightbox
- **GSAP + ScrollTrigger** — the work grid's rise and parallax
- **FastAPI + Pydantic v2** on **Turso** (libSQL), **Cloudinary** for uploads
- **Fraunces** for display, **Inter** for everything else

## Design

`src/styles/app.css` holds the whole system. Warm plaster ground, deep
green-black ink for the dark bands, burnt terracotta as the accent:

```
--ds-canvas #f5f1ea   --ds-ink #1c2b26   --ds-clay #a94b29
--ds-text   #1f2a26   --ds-muted #5e6b64
```

Colour pairs are checked to WCAG AA: clay is 5.0:1 on the canvas and 5.6:1
behind white button text.

Layouts adapt to however much content exists rather than assuming a count.
The home work grid and the projects grid both derive their column spans from
`nth-child` rules, so adding a category or publishing a project can never
leave the layout and the data disagreeing.

## Data

Everything the site shows comes from Turso through the API, except the
category showcase images that ship with the frontend.

| Table | Holds |
| --- | --- |
| `users` | admin logins, bcrypt hashes |
| `categories` | name, `show_in_dashboard` |
| `category_images` | the category's own photos, local path or Cloudinary URL |
| `projects` / `project_categories` | jobs, and which categories each covers |
| `project_category_images` | photos, per project *and* category |
| `testimonials` | name, designation, rating, comment |
| `leads` | contact form enquiries |

Images hang off `project_categories`, not `projects`: a job tagged both
*TV Unit* and *Shoe Rack* keeps a separate set of photos for each.

## Admin

`/admin`, behind a bcrypt login and a short-lived JWT. Manage projects and
their per-category image sets, categories and their showcase images, whether
each category appears on the home page, testimonials, and the enquiries the
contact form collects.

## Getting started

See [SETUP.md](SETUP.md) — credentials, seeding, running both halves, and how
the Vercel deployment is laid out.

```bash
npm install
npm run dev      # site on :5173
npm run api      # API on :8000  (API_PORT overrides both)
```

## Logo

`public/images/logo/logo.jpeg` is the source. `scripts/build_logo.py` derives
the transparent PNG, a light variant for dark backgrounds, an SVG and the
monogram from it. Re-run it after replacing the source.

## Tests

```bash
.venv/bin/python -m pytest tests -q
```

These run against a throwaway local SQLite file — libSQL is SQLite, so it is
the same code path that hits Turso in production, with none of the risk to
live data.
