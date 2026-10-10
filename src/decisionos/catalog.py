"""Structured corpus entities served read-only (ADR-0004).

Scans the corpus on every call; a malformed entity file is skipped with a
warning rather than failing the listing.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

from . import frontmatter

log = logging.getLogger(__name__)


def _as_iso_string(value: object, field: str) -> str:
    """YAML parses bare dates; accept a string or a date and return its ISO text."""
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.isoformat()
    if not isinstance(value, str) or not value.strip():
        raise frontmatter.FrontmatterError(f"{field} must be a non-empty string")
    return value


PERSON_FIELDS = ("name", "role", "department", "email")
PROJECT_FIELDS = ("name", "ownerId")
DOCUMENT_FIELDS = ("title", "type", "project", "createdAt", "summary")
DOCUMENT_LIST_FIELDS = ("authors", "decisions")

DECISION_STATUSES = ("Proposed", "Approved", "Approved with follow-up", "Rejected", "Superseded")
DISPOSITIONS = ("Selected", "Rejected", "Deferred", "Proposed", "Under consideration")
FOLLOW_UP_STATUSES = ("Open", "Done")
DECISION_STRING_FIELDS = ("title", "project", "status", "owner")
DECISION_DATE_FIELDS = ("createdAt", "updatedAt")
DECISION_LIST_FIELDS = ("contributors", "approvers", "supersedes", "supersededBy", "artifacts")


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


@dataclass(frozen=True)
class Document:
    id: str
    title: str
    type: str
    project: str
    authors: tuple[str, ...]
    created_at: str
    decisions: tuple[str, ...]
    summary: str
    content: str
    body_start_line: int

    def to_list_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "projectId": self.project,
            "authorIds": list(self.authors),
            "createdAt": self.created_at,
            "decisionIds": list(self.decisions),
            "summary": self.summary,
        }

    def to_detail_dict(self) -> dict:
        return {**self.to_list_dict(), "content": self.content, "bodyStartLine": self.body_start_line}


@dataclass(frozen=True)
class Decision:
    id: str
    title: str
    project: str
    status: str
    owner: str
    contributors: tuple[str, ...]
    approvers: tuple[str, ...]
    decided_at: str | None
    created_at: str
    updated_at: str
    problem: str
    final_decision: str | None
    leading_proposal: str | None
    rationale: tuple[str, ...]
    alternatives: tuple[dict, ...]
    caveats: tuple[str, ...]
    open_questions: tuple[str, ...]
    follow_ups: tuple[dict, ...]
    supersedes: tuple[str, ...]
    superseded_by: tuple[str, ...]
    artifacts: tuple[str, ...]
    technical_owner: str | None = None

    def to_dict(self) -> dict:
        body = {
            "id": self.id,
            "title": self.title,
            "projectId": self.project,
            "status": self.status,
            "ownerId": self.owner,
            "contributorIds": list(self.contributors),
            "approverIds": list(self.approvers),
            "decidedAt": self.decided_at,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "problem": self.problem,
            "finalDecision": self.final_decision,
            "rationale": list(self.rationale),
            "alternatives": [dict(alt) for alt in self.alternatives],
            "caveats": list(self.caveats),
            "openQuestions": list(self.open_questions),
            "followUps": [dict(f) for f in self.follow_ups],
            "supersedes": list(self.supersedes),
            "supersededBy": list(self.superseded_by),
            "artifactIds": list(self.artifacts),
        }
        if self.technical_owner is not None:
            body["technicalOwnerId"] = self.technical_owner
        if self.leading_proposal is not None:
            body["leadingProposal"] = self.leading_proposal
        return body


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

    def documents(self) -> list[Document]:
        docs = (self._load_document(path) for path in sorted((self._corpus / "documents").glob("*.md")))
        return [doc for doc in docs if doc is not None]

    def document(self, document_id: str) -> Document | None:
        path = self._corpus / "documents" / f"{document_id}.md"
        if path.parent != self._corpus / "documents" or not path.is_file():
            return None
        return self._load_document(path)

    def decisions(self) -> list[Decision]:
        decisions = (self._load_decision(path) for path in sorted((self._corpus / "decisions").glob("*.md")))
        return [decision for decision in decisions if decision is not None]

    def decision(self, decision_id: str) -> Decision | None:
        path = self._corpus / "decisions" / f"{decision_id}.md"
        if path.parent != self._corpus / "decisions" or not path.is_file():
            return None
        return self._load_decision(path)

    def _load_decision(self, path: Path) -> Decision | None:
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
            for field in DECISION_STRING_FIELDS:
                if not isinstance(meta.get(field), str) or not meta[field].strip():
                    raise frontmatter.FrontmatterError(f"{field} must be a non-empty string")
            if meta["status"] not in DECISION_STATUSES:
                raise frontmatter.FrontmatterError(f"status must be one of {DECISION_STATUSES}")
            dates = {field: _as_iso_string(meta.get(field), field) for field in DECISION_DATE_FIELDS}
            decided_at = _nullable_iso(meta.get("decidedAt"), "decidedAt")
            lists: dict[str, tuple[str, ...]] = {}
            for field in DECISION_LIST_FIELDS:
                value = meta.get(field)
                if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                    raise frontmatter.FrontmatterError(f"{field} must be a list of ids")
                lists[field] = tuple(value)
            technical_owner = meta.get("technicalOwner")
            if technical_owner is not None and (not isinstance(technical_owner, str) or not technical_owner.strip()):
                raise frontmatter.FrontmatterError("technicalOwner must be a non-empty string when present")
            alternatives = tuple(self._load_alternatives(meta.get("alternatives")))
            follow_ups = tuple(self._load_follow_ups(meta.get("followUps")))
            body = text.split("\n")[parsed.body_start_line - 1 :]
            sections = _decision_sections("\n".join(body))
            problem = sections.get("problem")
            if problem is None:
                raise frontmatter.FrontmatterError("the body needs a ## Problem section")
            final_decision = sections.get("decision")
            leading_proposal = sections.get("leading proposal")
            if (final_decision is None) == (leading_proposal is None):
                raise frontmatter.FrontmatterError(
                    "the body needs exactly one of ## Decision or ## Leading proposal"
                )
            if final_decision is None and meta["status"] in ("Approved", "Approved with follow-up"):
                raise frontmatter.FrontmatterError("an approved decision needs a ## Decision section")
            rationale = _bullet_list(sections.get("rationale"))
            caveats = _bullet_list(sections.get("caveats"))
            open_questions = _bullet_list(sections.get("open questions"))
            if not rationale:
                raise frontmatter.FrontmatterError("the ## Rationale section needs at least one bullet")
        except frontmatter.FrontmatterError as exc:
            log.warning("skipping malformed decision file %s: %s", path.name, exc)
            return None
        return Decision(
            id=path.stem,
            title=meta["title"],
            project=meta["project"],
            status=meta["status"],
            owner=meta["owner"],
            technical_owner=technical_owner,
            contributors=lists["contributors"],
            approvers=lists["approvers"],
            decided_at=decided_at,
            created_at=dates["createdAt"],
            updated_at=dates["updatedAt"],
            problem=problem,
            final_decision=final_decision,
            leading_proposal=leading_proposal,
            rationale=rationale,
            alternatives=alternatives,
            caveats=caveats,
            open_questions=open_questions,
            follow_ups=follow_ups,
            supersedes=lists["supersedes"],
            superseded_by=lists["supersededBy"],
            artifacts=lists["artifacts"],
        )

    @staticmethod
    def _load_alternatives(value: object) -> list[dict]:
        if not isinstance(value, list):
            raise frontmatter.FrontmatterError("alternatives must be a list")
        alternatives: list[dict] = []
        for item in value:
            if not isinstance(item, dict):
                raise frontmatter.FrontmatterError("each alternative must be a mapping")
            for field in ("title", "rationale"):
                if not isinstance(item.get(field), str) or not item[field].strip():
                    raise frontmatter.FrontmatterError(f"alternative {field} must be a non-empty string")
            if item.get("disposition") not in DISPOSITIONS:
                raise frontmatter.FrontmatterError(f"alternative disposition must be one of {DISPOSITIONS}")
            artifacts = item.get("artifacts")
            if not isinstance(artifacts, list) or not all(isinstance(a, str) and a.strip() for a in artifacts):
                raise frontmatter.FrontmatterError("alternative artifacts must be a list of ids")
            alternatives.append(
                {
                    "title": item["title"],
                    "disposition": item["disposition"],
                    "rationale": item["rationale"],
                    "artifactIds": list(artifacts),
                }
            )
        return alternatives

    @staticmethod
    def _load_follow_ups(value: object) -> list[dict]:
        if not isinstance(value, list):
            raise frontmatter.FrontmatterError("followUps must be a list")
        follow_ups: list[dict] = []
        for item in value:
            if not isinstance(item, dict):
                raise frontmatter.FrontmatterError("each follow-up must be a mapping")
            for field in ("id", "description", "owner"):
                if not isinstance(item.get(field), str) or not item[field].strip():
                    raise frontmatter.FrontmatterError(f"follow-up {field} must be a non-empty string")
            if item.get("status") not in FOLLOW_UP_STATUSES:
                raise frontmatter.FrontmatterError(f"follow-up status must be one of {FOLLOW_UP_STATUSES}")
            artifacts = item.get("artifacts")
            if not isinstance(artifacts, list) or not all(isinstance(a, str) and a.strip() for a in artifacts):
                raise frontmatter.FrontmatterError("follow-up artifacts must be a list of ids")
            follow_up = {
                "id": item["id"],
                "description": item["description"],
                "ownerId": item["owner"],
                "status": item["status"],
                "artifactIds": list(artifacts),
            }
            due = item.get("dueDate")
            if due is not None:
                follow_up["dueDate"] = _as_iso_string(due, "follow-up dueDate")
            follow_ups.append(follow_up)
        return follow_ups


    def _load_document(self, path: Path) -> Document | None:
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
            for field in DOCUMENT_FIELDS:
                value = _as_iso_string(meta.get(field), field)
                meta[field] = value
            lists: dict[str, tuple[str, ...]] = {}
            for field in DOCUMENT_LIST_FIELDS:
                value = meta.get(field)
                if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                    raise frontmatter.FrontmatterError(f"{field} must be a list of ids")
                lists[field] = tuple(value)
            content = "\n".join(text.split("\n")[parsed.body_start_line - 1 :]).strip()
            if not content:
                raise frontmatter.FrontmatterError("content (the body) must be a non-empty string")
        except frontmatter.FrontmatterError as exc:
            log.warning("skipping malformed document file %s: %s", path.name, exc)
            return None
        return Document(
            id=path.stem,
            authors=lists["authors"],
            decisions=lists["decisions"],
            created_at=meta["createdAt"],
            content=content,
            body_start_line=parsed.body_start_line,
            **{field: meta[field] for field in ("title", "type", "project", "summary")},
        )
def _nullable_iso(value: object, field: str) -> str | None:
    if value is None:
        return None
    return _as_iso_string(value, field)


def _decision_sections(body: str) -> dict[str, str]:
    """Split the body at `## ` headings into {lowercased heading: section text}."""
    sections: dict[str, str] = {}
    current: str | None = None
    chunks: list[str] = []
    for line in body.split("\n"):
        if line.startswith("## "):
            if current is not None:
                sections[current] = "\n".join(chunks).strip()
            current = line[3:].strip().lower()
            chunks = []
        elif current is not None:
            chunks.append(line)
    if current is not None:
        sections[current] = "\n".join(chunks).strip()
    return sections


def _bullet_list(section: str | None) -> tuple[str, ...]:
    """The section's `- ` bullets as text; an empty or missing section is empty."""
    if not section:
        return ()
    bullets = []
    for line in section.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if not stripped.startswith("- "):
            raise frontmatter.FrontmatterError("expected only `- ` bullets in this section")
        bullets.append(stripped[2:].strip())
    return tuple(bullets)

