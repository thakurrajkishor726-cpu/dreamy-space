from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ImageBody(BaseModel):
    image_url: str = Field(min_length=1)


class CategoryBlock(BaseModel):
    category_id: int
    images: list[ImageBody] = []


class ProjectBody(BaseModel):
    name: str = Field(min_length=1)
    location: str = ""
    categories: list[CategoryBlock] = []


def _hydrate(project: dict) -> dict:
    """Attach each linked category and that link's images."""
    links = db.query(
        """
        SELECT pc.id AS link_id, c.id AS category_id, c.name AS category_name
        FROM project_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.project_id = ?
        ORDER BY c.name COLLATE NOCASE
        """,
        (project["id"],),
    )

    for link in links:
        link["images"] = db.query(
            """
            SELECT id, image_url, position
            FROM project_category_images
            WHERE project_categories_id = ?
            ORDER BY position, id
            """,
            (link["link_id"],),
        )

    project["categories"] = links
    return project


@router.get("")
def list_projects(category_id: int | None = None):
    """Public list. `category_id` filters to projects tagged with it."""
    if category_id is None:
        projects = db.query("SELECT * FROM projects ORDER BY id DESC")
    else:
        projects = db.query(
            """
            SELECT p.* FROM projects p
            JOIN project_categories pc ON pc.project_id = p.id
            WHERE pc.category_id = ?
            GROUP BY p.id
            ORDER BY p.id DESC
            """,
            (category_id,),
        )
    return [_hydrate(project) for project in projects]


@router.get("/{project_id}")
def get_project(project_id: int):
    project = db.query_one("SELECT * FROM projects WHERE id = ?", (project_id,))
    if not project:
        raise HTTPException(404, "Project not found.")
    return _hydrate(project)


def _sync_categories(project_id: int, blocks: list[CategoryBlock]) -> None:
    """Reconcile a project's category links and their images in place.

    Rows are diffed rather than deleted-and-recreated so ids and created_at
    survive an edit that didn't actually change them.
    """
    wanted = {block.category_id: block for block in blocks}

    for category_id in wanted:
        if not db.query_one("SELECT id FROM categories WHERE id = ?", (category_id,)):
            raise HTTPException(400, f"Category {category_id} does not exist.")

    existing = {
        row["category_id"]: row["id"]
        for row in db.query(
            "SELECT id, category_id FROM project_categories WHERE project_id = ?", (project_id,)
        )
    }

    # Untagged categories go, taking their images with them via cascade.
    for category_id, link_id in existing.items():
        if category_id not in wanted:
            db.execute("DELETE FROM project_categories WHERE id = ?", (link_id,))

    for category_id, block in wanted.items():
        link_id = existing.get(category_id)
        if link_id is None:
            link_id = db.execute(
                "INSERT INTO project_categories (project_id, category_id) VALUES (?, ?)",
                (project_id, category_id),
            )

        desired_urls = [image.image_url for image in block.images]
        current = db.query(
            "SELECT id, image_url FROM project_category_images WHERE project_categories_id = ?",
            (link_id,),
        )
        current_by_url = {row["image_url"]: row["id"] for row in current}

        for url, image_id in current_by_url.items():
            if url not in desired_urls:
                db.execute("DELETE FROM project_category_images WHERE id = ?", (image_id,))

        for position, url in enumerate(desired_urls):
            image_id = current_by_url.get(url)
            if image_id is None:
                db.execute(
                    "INSERT INTO project_category_images "
                    "(project_categories_id, image_url, position) VALUES (?, ?, ?)",
                    (link_id, url, position),
                )
            else:
                db.execute(
                    "UPDATE project_category_images SET position = ? WHERE id = ?",
                    (position, image_id),
                )
                db.touch("project_category_images", image_id)


@router.post("", status_code=201)
def create_project(body: ProjectBody, _: dict = Depends(require_admin)):
    project_id = db.execute(
        "INSERT INTO projects (name, location) VALUES (?, ?)",
        (body.name.strip(), body.location.strip()),
    )
    _sync_categories(project_id, body.categories)
    return get_project(project_id)


@router.put("/{project_id}")
def update_project(project_id: int, body: ProjectBody, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM projects WHERE id = ?", (project_id,)):
        raise HTTPException(404, "Project not found.")

    db.execute(
        "UPDATE projects SET name = ?, location = ? WHERE id = ?",
        (body.name.strip(), body.location.strip(), project_id),
    )
    db.touch("projects", project_id)
    _sync_categories(project_id, body.categories)
    return get_project(project_id)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, _: dict = Depends(require_admin)):
    if not db.query_one("SELECT id FROM projects WHERE id = ?", (project_id,)):
        raise HTTPException(404, "Project not found.")
    db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
