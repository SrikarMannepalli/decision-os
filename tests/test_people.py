"""GET /people and /people/{id}: structured people from the corpus (ADR-0004)."""

from __future__ import annotations

import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import FakeAgent
from decisionos.main import create_app

ADA = """---
id: ada-lovelace
name: Ada Lovelace
role: Staff Engineer
department: Engineering
email: ada@example.test
---
Ada leads the analytical engine team.
"""

GRACE = ADA.replace("ada-lovelace", "grace-hopper").replace("Ada Lovelace", "Grace Hopper").replace("ada@", "grace@")


@pytest.fixture
def make_client(tmp_path: Path):
    def _make(files: dict[str, str]) -> TestClient:
        root = tmp_path / "corpus"
        root.mkdir()
        for rel, text in files.items():
            target = root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
        return TestClient(create_app(agent=FakeAgent(root), corpus=str(root)))

    return _make


def test_lists_people_as_employees_sorted_by_id(make_client):
    client = make_client({"people/grace-hopper.md": GRACE, "people/ada-lovelace.md": ADA})
    res = client.get("/people")
    assert res.status_code == 200
    assert res.json() == [
        {
            "id": "ada-lovelace",
            "name": "Ada Lovelace",
            "role": "Staff Engineer",
            "department": "Engineering",
            "email": "ada@example.test",
        },
        {
            "id": "grace-hopper",
            "name": "Grace Hopper",
            "role": "Staff Engineer",
            "department": "Engineering",
            "email": "grace@example.test",
        },
    ]


def test_returns_one_person(make_client):
    client = make_client({"people/ada-lovelace.md": ADA})
    res = client.get("/people/ada-lovelace")
    assert res.status_code == 200
    assert res.json()["name"] == "Ada Lovelace"
    assert set(res.json()) == {"id", "name", "role", "department", "email"}


def test_unknown_person_is_404(make_client):
    client = make_client({"people/ada-lovelace.md": ADA})
    assert client.get("/people/nobody").status_code == 404


@pytest.mark.parametrize("person_id", ["../ada-lovelace", "ada-lovelace.md", "ada%2Flovelace", "..%2Fpeople"])
def test_ids_that_are_not_plain_ids_are_404(make_client, person_id):
    client = make_client({"people/ada-lovelace.md": ADA})
    assert client.get(f"/people/{person_id}").status_code == 404


def test_empty_when_the_corpus_has_no_people(make_client):
    client = make_client({"decisions/notes.md": "# notes\n"})
    res = client.get("/people")
    assert res.status_code == 200
    assert res.json() == []


def test_the_retrieval_fixture_corpus_has_no_people(client: TestClient):
    assert client.get("/people").json() == []


def test_skips_malformed_files_with_a_warning(make_client, caplog):
    client = make_client(
        {
            "people/ada-lovelace.md": ADA,
            "people/unclosed.md": "---\nid: unclosed\nname: Un Closed\n",
            "people/no-frontmatter.md": "just prose\n",
            "people/missing-field.md": "---\nid: missing-field\nname: Missing\n---\n",
            "people/wrong-type.md": ADA.replace("ada-lovelace", "wrong-type").replace("Staff Engineer", "[1, 2]"),
            "people/other-id.md": ADA,
        }
    )
    with caplog.at_level(logging.WARNING):
        res = client.get("/people")
    assert [p["id"] for p in res.json()] == ["ada-lovelace"]
    skipped = {name for name in ("unclosed", "no-frontmatter", "missing-field", "wrong-type", "other-id") if name in caplog.text}
    assert skipped == {"unclosed", "no-frontmatter", "missing-field", "wrong-type", "other-id"}
    assert client.get("/people/unclosed").status_code == 404


def test_ignores_non_markdown_files_and_nested_directories(make_client):
    client = make_client(
        {
            "people/ada-lovelace.md": ADA,
            "people/notes.txt": "not a person",
            "people/archive/grace-hopper.md": GRACE,
        }
    )
    assert [p["id"] for p in client.get("/people").json()] == ["ada-lovelace"]


def test_reads_changes_on_disk_without_a_restart(make_client, tmp_path: Path):
    client = make_client({"people/ada-lovelace.md": ADA})
    assert len(client.get("/people").json()) == 1
    (tmp_path / "corpus" / "people" / "grace-hopper.md").write_text(GRACE, encoding="utf-8")
    assert len(client.get("/people").json()) == 2
