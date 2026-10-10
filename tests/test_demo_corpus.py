"""Integrity of the checked-in demo corpus, `corpus/finflow` (ADR-0004).

Strict where the API is lenient: the API skips a malformed entity, this suite
fails on it.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from decisionos import frontmatter
from decisionos.catalog import Catalog, PERSON_FIELDS

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


def test_demo_corpus_has_ten_people():
    assert len(person_files(DEMO)) == 10


def test_demo_people_are_well_formed_with_unique_ids():
    assert check_people(DEMO) == []


def test_the_catalog_serves_every_demo_person():
    people = Catalog(DEMO).people()
    assert sorted(p.id for p in people) == sorted(f.stem for f in person_files(DEMO))


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
