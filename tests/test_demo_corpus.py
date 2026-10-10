"""Integrity of the checked-in demo corpus, `corpus/finflow` (ADR-0004).

Strict where the API is lenient: the API skips a malformed entity, this suite
fails on it.
"""

from __future__ import annotations

from datetime import date, datetime
from pathlib import Path

import pytest

from decisionos import frontmatter
from decisionos.catalog import Catalog, DOCUMENT_FIELDS, PERSON_FIELDS, PROJECT_FIELDS

DEMO = Path(__file__).parent.parent / "corpus" / "finflow"


def person_files(root: Path) -> list[Path]:
    return sorted((root / "people").glob("*.md"))


def check_people(root: Path) -> list[str]:
    """Return every problem found in the people directory."""
    problems: list[str] = []
    seen: dict[str, Path] = {}
    for path in person_files(root):
        try:
            parsed = frontmatter.split(path.read_text(encoding="utf-8"))
        except frontmatter.FrontmatterError as exc:
            problems.append(f"{path.name}: {exc}")
            continue
        if parsed is None:
            problems.append(f"{path.name}: no frontmatter")
            continue
        meta = parsed.meta
        for field in PERSON_FIELDS:
            if not isinstance(meta.get(field), str) or not meta[field].strip():
                problems.append(f"{path.name}: {field} must be a non-empty string")
        person_id = meta.get("id")
        if person_id != path.stem:
            problems.append(f"{path.name}: id {person_id!r} does not match the file name")
        if isinstance(person_id, str):
            if person_id in seen:
                problems.append(f"{path.name}: duplicate id {person_id!r} (also {seen[person_id].name})")
            seen[person_id] = path
    return problems


def project_files(root: Path) -> list[Path]:
    return sorted((root / "projects").glob("*.md"))


def check_projects(root: Path) -> list[str]:
    """Return every problem found in the projects directory."""
    problems: list[str] = []
    seen: dict[str, Path] = {}
    for path in project_files(root):
        text = path.read_text(encoding="utf-8")
        try:
            parsed = frontmatter.split(text)
        except frontmatter.FrontmatterError as exc:
            problems.append(f"{path.name}: {exc}")
            continue
        if parsed is None:
            problems.append(f"{path.name}: no frontmatter")
            continue
        meta = parsed.meta
        for field in PROJECT_FIELDS:
            if not isinstance(meta.get(field), str) or not meta[field].strip():
                problems.append(f"{path.name}: {field} must be a non-empty string")
        description = "\n".join(text.split("\n")[parsed.body_start_line - 1 :]).strip()
        if not description:
            problems.append(f"{path.name}: description (the body) must be a non-empty string")
        project_id = meta.get("id")
        if project_id != path.stem:
            problems.append(f"{path.name}: id {project_id!r} does not match the file name")
        if isinstance(project_id, str):
            if project_id in seen:
                problems.append(f"{path.name}: duplicate id {project_id!r} (also {seen[project_id].name})")
            seen[project_id] = path
    return problems


def test_demo_corpus_has_ten_people():
    assert len(person_files(DEMO)) == 10


def test_demo_people_are_well_formed_with_unique_ids():
    assert check_people(DEMO) == []


def test_the_catalog_serves_every_demo_person():
    people = Catalog(DEMO).people()
    assert sorted(p.id for p in people) == sorted(f.stem for f in person_files(DEMO))


def test_demo_corpus_has_three_projects():
    assert len(project_files(DEMO)) == 3


def test_demo_projects_are_well_formed_with_unique_ids():
    assert check_projects(DEMO) == []


def test_the_catalog_serves_every_demo_project():
    projects = Catalog(DEMO).projects()
    assert sorted(p.id for p in projects) == sorted(f.stem for f in project_files(DEMO))


def document_files(root: Path) -> list[Path]:
    return sorted((root / "documents").glob("*.md"))


def check_documents(root: Path) -> list[str]:
    """Return every problem found in the documents directory."""
    problems: list[str] = []
    seen: dict[str, Path] = {}
    for path in document_files(root):
        text = path.read_text(encoding="utf-8")
        try:
            parsed = frontmatter.split(text)
        except frontmatter.FrontmatterError as exc:
            problems.append(f"{path.name}: {exc}")
            continue
        if parsed is None:
            problems.append(f"{path.name}: no frontmatter")
            continue
        meta = parsed.meta
        for field in DOCUMENT_FIELDS:
            value = meta.get(field)
            if isinstance(value, datetime):
                value = value.date()
            ok = isinstance(value, date) or (isinstance(value, str) and value.strip())
            if not ok:
                problems.append(f"{path.name}: {field} must be a non-empty string")
        for field in ("authors", "decisions"):
            value = meta.get(field)
            if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                problems.append(f"{path.name}: {field} must be a list of ids")
        content = "\n".join(text.split("\n")[parsed.body_start_line - 1 :]).strip()
        if not content:
            problems.append(f"{path.name}: content (the body) must be a non-empty string")
        document_id = meta.get("id")
        if document_id != path.stem:
            problems.append(f"{path.name}: id {document_id!r} does not match the file name")
        if isinstance(document_id, str):
            if document_id in seen:
                problems.append(f"{path.name}: duplicate id {document_id!r} (also {seen[document_id].name})")
            seen[document_id] = path
    return problems


def test_demo_corpus_has_eighteen_documents():
    assert len(document_files(DEMO)) == 18


def test_demo_documents_are_well_formed_with_unique_ids():
    assert check_documents(DEMO) == []


def test_the_catalog_serves_every_demo_document():
    documents = Catalog(DEMO).documents()
    assert sorted(d.id for d in documents) == sorted(f.stem for f in document_files(DEMO))


def write(root: Path, name: str, text: str) -> None:
    target = root / "people" / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


GOOD = "---\nid: {id}\nname: N\nrole: R\ndepartment: D\nemail: e@x.test\n---\n"


@pytest.mark.parametrize(
    ("files", "expected"),
    [
        ({"a.md": "---\nid: a\nname: N\n"}, "frontmatter block is not closed"),
        ({"a.md": "prose only\n"}, "no frontmatter"),
        ({"a.md": "---\nid: a\nname: N\n---\n"}, "role must be a non-empty string"),
        ({"a.md": GOOD.format(id="b")}, "does not match the file name"),
        ({"a.md": GOOD.format(id="a"), "b.md": GOOD.format(id="a")}, "duplicate id 'a'"),
    ],
)
def test_the_checker_flags_malformed_and_duplicate_people(tmp_path: Path, files: dict[str, str], expected: str):
    for name, text in files.items():
        write(tmp_path, name, text)
    assert any(expected in problem for problem in check_people(tmp_path))


def decision_files(root: Path) -> list[Path]:
    return sorted((root / "decisions").glob("*.md"))


def test_demo_corpus_has_three_decisions():
    assert len(decision_files(DEMO)) == 3


def test_the_catalog_serves_every_demo_decision():
    decisions = Catalog(DEMO).decisions()
    assert sorted(d.id for d in decisions) == sorted(f.stem for f in decision_files(DEMO))


def check_decision_cross_references(root: Path) -> list[str]:
    """Every id a decision mentions must exist; links must agree both ways."""
    problems: list[str] = []
    catalog = Catalog(root)
    people = {p.id for p in catalog.people()}
    projects = {p.id for p in catalog.projects()}
    documents = {d.id for d in catalog.documents()}
    decisions = {d.id: d for d in catalog.decisions()}
    if not decisions:
        return ["no decisions were loadable"]

    for d in decisions.values():
        if d.project not in projects:
            problems.append(f"{d.id}: unknown project {d.project!r}")
        for field, ids in (
            ("owner", [d.owner] if d.owner else []),
            ("technicalOwner", [d.technical_owner] if d.technical_owner else []),
            ("contributors", list(d.contributors)),
            ("approvers", list(d.approvers)),
            ("followUp owners", [f["ownerId"] for f in d.follow_ups]),
        ):
            for person_id in ids:
                if person_id not in people:
                    problems.append(f"{d.id}: {field} references unknown person {person_id!r}")
        for field, ids in (
            ("artifacts", list(d.artifacts)),
            ("alternative artifacts", [a for alt in d.alternatives for a in alt["artifactIds"]]),
            ("follow-up artifacts", [a for f in d.follow_ups for a in f["artifactIds"]]),
        ):
            for document_id in ids:
                if document_id not in documents:
                    problems.append(f"{d.id}: {field} references unknown document {document_id!r}")
        for other in d.supersedes:
            if other not in decisions:
                problems.append(f"{d.id}: supersedes unknown decision {other!r}")
            elif d.id not in decisions[other].superseded_by:
                problems.append(f"{d.id}: supersedes {other}, but {other} does not list it in supersededBy")
        for other in d.superseded_by:
            if other not in decisions:
                problems.append(f"{d.id}: supersededBy references unknown decision {other!r}")
            elif d.id not in decisions[other].supersedes:
                problems.append(f"{d.id}: superseded by {other}, but {other} does not list it in supersedes")

    for d in decisions.values():
        for document_id in d.artifacts:
            doc = catalog.document(document_id)
            if doc is not None and d.id not in doc.decisions:
                problems.append(f"{d.id} cites {document_id}, but {document_id} does not list {d.id}")
    for doc in catalog.documents():
        for decision_id in doc.decisions:
            decision = decisions.get(decision_id)
            if decision is None:
                problems.append(f"{doc.id}: references unknown decision {decision_id!r}")
            elif doc.id not in decision.artifacts:
                problems.append(f"{doc.id} -> {decision_id}, but {decision_id} does not cite {doc.id}")
    return problems


def test_every_demo_decision_cross_reference_resolves_and_agrees_both_ways():
    assert check_decision_cross_references(DEMO) == []


def test_dec_003_is_never_approved():
    dec3 = Catalog(DEMO).decision("DEC-003")
    assert dec3 is not None
    assert dec3.status != "Approved"
    assert dec3.status == "Proposed"
    assert dec3.final_decision is None
    assert dec3.approvers == ()
    assert all(alt["disposition"] != "Selected" for alt in dec3.alternatives)


def test_dec_001_marks_the_threshold_provisional():
    dec1 = Catalog(DEMO).decision("DEC-001")
    assert dec1 is not None
    assert any("25,000-line" in caveat and "provisional" in caveat for caveat in dec1.caveats)
