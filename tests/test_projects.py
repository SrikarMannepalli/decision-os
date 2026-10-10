"""GET /projects and /projects/{id}: structured projects from the corpus (ADR-0004)."""

from __future__ import annotations

import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import FakeAgent
from decisionos.main import create_app

INVOICE = """---
id: PRJ-101
name: Invoice Reconciliation
ownerId: maya-chen
---
Improve reconciliation speed and reliability for mid-market finance teams.
"""

BULK = INVOICE.replace("PRJ-101", "PRJ-102").replace("Invoice Reconciliation", "Bulk Invoice Actions").replace(
    "Improve reconciliation speed and reliability for mid-market finance teams.",
    "Allow finance operators to apply actions to multiple invoices safely.",
)


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


def test_lists_projects_sorted_by_id(make_client):
    client = make_client({"projects/PRJ-102.md": BULK, "projects/PRJ-101.md": INVOICE})
    res = client.get("/projects")
    assert res.status_code == 200
    assert res.json() == [
        {
            "id": "PRJ-101",
            "name": "Invoice Reconciliation",
            "description": "Improve reconciliation speed and reliability for mid-market finance teams.",
            "ownerId": "maya-chen",
        },
        {
            "id": "PRJ-102",
            "name": "Bulk Invoice Actions",
            "description": "Allow finance operators to apply actions to multiple invoices safely.",
            "ownerId": "maya-chen",
        },
    ]


def test_returns_one_project(make_client):
    client = make_client({"projects/PRJ-101.md": INVOICE})
    res = client.get("/projects/PRJ-101")
    assert res.status_code == 200
    assert set(res.json()) == {"id", "name", "description", "ownerId"}


def test_unknown_project_is_404(make_client):
    client = make_client({"projects/PRJ-101.md": INVOICE})
    assert client.get("/projects/PRJ-999").status_code == 404


@pytest.mark.parametrize("project_id", ["../PRJ-101", "PRJ-101.md", "PRJ%2F101", "..%2Fprojects"])
def test_ids_that_are_not_plain_ids_are_404(make_client, project_id):
    client = make_client({"projects/PRJ-101.md": INVOICE})
    assert client.get(f"/projects/{project_id}").status_code == 404


def test_empty_when_the_corpus_has_no_projects(make_client):
    client = make_client({"people/notes.md": "# notes\n"})
    res = client.get("/projects")
    assert res.status_code == 200
    assert res.json() == []


def test_the_retrieval_fixture_corpus_has_no_projects(client: TestClient):
    assert client.get("/projects").json() == []


def test_description_can_span_lines_and_is_trimmed(make_client):
    client = make_client(
        {
            "projects/PRJ-101.md": "---\nid: PRJ-101\nname: N\nownerId: o\n---\n\nFirst line.\n\nSecond line.\n\n"
        }
    )
    assert client.get("/projects/PRJ-101").json()["description"] == "First line.\n\nSecond line."


def test_skips_malformed_files_with_a_warning(make_client, caplog):
    client = make_client(
        {
            "projects/PRJ-101.md": INVOICE,
            "projects/unclosed.md": "---\nid: unclosed\nname: N\n",
            "projects/no-frontmatter.md": "just prose\n",
            "projects/missing-field.md": "---\nid: missing-field\nname: N\n---\nA body.\n",
            "projects/empty-body.md": "---\nid: empty-body\nname: N\nownerId: o\n---\n\n \n",
            "projects/other-id.md": INVOICE,
        }
    )
    with caplog.at_level(logging.WARNING):
        res = client.get("/projects")
    assert [p["id"] for p in res.json()] == ["PRJ-101"]
    skipped = {
        name
        for name in ("unclosed", "no-frontmatter", "missing-field", "empty-body", "other-id")
        if name in caplog.text
    }
    assert skipped == {"unclosed", "no-frontmatter", "missing-field", "empty-body", "other-id"}
    assert client.get("/projects/unclosed").status_code == 404


def test_ignores_non_markdown_files_and_nested_directories(make_client):
    client = make_client(
        {
            "projects/PRJ-101.md": INVOICE,
            "projects/notes.txt": "not a project",
            "projects/archive/PRJ-102.md": BULK,
        }
    )
    assert [p["id"] for p in client.get("/projects").json()] == ["PRJ-101"]


def test_reads_changes_on_disk_without_a_restart(make_client, tmp_path: Path):
    client = make_client({"projects/PRJ-101.md": INVOICE})
    assert len(client.get("/projects").json()) == 1
    (tmp_path / "corpus" / "projects" / "PRJ-102.md").write_text(BULK, encoding="utf-8")
    assert len(client.get("/projects").json()) == 2
