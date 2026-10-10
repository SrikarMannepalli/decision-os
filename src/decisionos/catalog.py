"""Structured corpus entities served read-only (ADR-0004).

Scans the corpus on every call; a malformed entity file is skipped with a
warning rather than failing the listing.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from . import frontmatter

log = logging.getLogger(__name__)

PERSON_FIELDS = ("name", "role", "department", "email")
PROJECT_FIELDS = ("name", "ownerId")


@dataclass(frozen=True)
class Person:
    id: str
    name: str
    role: str
    department: str
    email: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "department": self.department,
            "email": self.email,
        }


@dataclass(frozen=True)
class Project:
    id: str
    name: str
    description: str
    ownerId: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "ownerId": self.ownerId,
        }


class Catalog:
    def __init__(self, corpus: Path) -> None:
        self._corpus = Path(corpus)

    def people(self) -> list[Person]:
        people = (self._load_person(path) for path in sorted((self._corpus / "people").glob("*.md")))
        return [person for person in people if person is not None]

    def person(self, person_id: str) -> Person | None:
        path = self._corpus / "people" / f"{person_id}.md"
        if path.parent != self._corpus / "people" or not path.is_file():
            return None
        return self._load_person(path)

    def _load_person(self, path: Path) -> Person | None:
        if not path.is_file():
            return None
        try:
            parsed = frontmatter.split(path.read_text(encoding="utf-8", errors="replace"))
            if parsed is None:
                raise frontmatter.FrontmatterError("no frontmatter")
            meta = parsed.meta
            if meta.get("id") != path.stem:
                raise frontmatter.FrontmatterError(f"id {meta.get('id')!r} does not match the file name")
            for field in PERSON_FIELDS:
                if not isinstance(meta.get(field), str) or not meta[field].strip():
                    raise frontmatter.FrontmatterError(f"{field} must be a non-empty string")
        except frontmatter.FrontmatterError as exc:
            log.warning("skipping malformed person file %s: %s", path.name, exc)
            return None
        return Person(id=path.stem, **{field: meta[field] for field in PERSON_FIELDS})

    def projects(self) -> list[Project]:
        projects = (self._load_project(path) for path in sorted((self._corpus / "projects").glob("*.md")))
        return [project for project in projects if project is not None]

    def project(self, project_id: str) -> Project | None:
        path = self._corpus / "projects" / f"{project_id}.md"
        if path.parent != self._corpus / "projects" or not path.is_file():
            return None
        return self._load_project(path)

    def _load_project(self, path: Path) -> Project | None:
        if not path.is_file():
            return None
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
            parsed = frontmatter.split(text)
            if parsed is None:
                raise frontmatter.FrontmatterError("no frontmatter")
            meta = parsed.meta
            if meta.get("id") != path.stem:
                raise frontmatter.FrontmatterError(f"id {meta.get('id')!r} does not match the file name")
            for field in PROJECT_FIELDS:
                if not isinstance(meta.get(field), str) or not meta[field].strip():
                    raise frontmatter.FrontmatterError(f"{field} must be a non-empty string")
            description = "\n".join(text.split("\n")[parsed.body_start_line - 1 :]).strip()
            if not description:
                raise frontmatter.FrontmatterError("description (the body) must be a non-empty string")
        except frontmatter.FrontmatterError as exc:
            log.warning("skipping malformed project file %s: %s", path.name, exc)
            return None
        return Project(id=path.stem, description=description, **{field: meta[field] for field in PROJECT_FIELDS})
