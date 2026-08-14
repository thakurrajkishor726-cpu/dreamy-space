-- Dreamy Space catalogue schema (SQLite / libSQL).
--
-- Every table carries id / created_at / updated_at. Timestamps are stored as
-- ISO-8601 UTC text, which SQLite compares and sorts correctly as strings.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password    TEXT    NOT NULL,          -- bcrypt hash, never plaintext
    is_admin    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- show_in_dashboard gates whether the category gets a tile in the "What we
-- make" grid on the home page. It does not hide the category anywhere else:
-- the nav, the Our Work page and the project tagging all still list it.
CREATE TABLE IF NOT EXISTS categories (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    show_in_dashboard INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- The category's own showcase photos, separate from project photos.
--
-- image_url holds either a local path served by the frontend
-- (/images/categories/<Folder>/<file>, which is what the originals are) or a
-- Cloudinary URL for anything uploaded through the admin since. Both render
-- the same way: cloudinaryUrl() passes non-Cloudinary URLs through untouched.
CREATE TABLE IF NOT EXISTS category_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url   TEXT    NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ci_category ON category_images (category_id, position);

CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    location    TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- A project belongs to one or more categories. Deleting either side removes
-- the link (and, via the next table, that link's images).
CREATE TABLE IF NOT EXISTS project_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id)   ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (project_id, category_id)
);

-- Images hang off the project/category pairing rather than the project, so the
-- kitchen shots and the bathroom shots of the same job stay separate.
CREATE TABLE IF NOT EXISTS project_category_images (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    project_categories_id INTEGER NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
    image_url             TEXT    NOT NULL,
    position              INTEGER NOT NULL DEFAULT 0,
    created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Enquiries from the public contact form.
--
-- This is personal data belonging to people who have not bought anything yet,
-- so it stays in your own database and is readable only by an admin token.
CREATE TABLE IF NOT EXISTS leads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    phone       TEXT    NOT NULL DEFAULT '',
    service     TEXT    NOT NULL DEFAULT '',
    message     TEXT    NOT NULL DEFAULT '',
    handled     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_new   ON leads (handled, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pc_project  ON project_categories (project_id);
CREATE INDEX IF NOT EXISTS idx_pc_category ON project_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_pci_link    ON project_category_images (project_categories_id, position);
