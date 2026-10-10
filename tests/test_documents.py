"""GET /documents and /documents/{id}: structured documents from the corpus (ADR-0004)."""

from __future__ import annotations

import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import FakeAgent
from decisionos.main import create_app

ZOOM = """---
id: ZOOM-001
title: Reconciliation rollout and peak-load review
type: Zoom transcript
project: PRJ-101
authors:
  - maya-chen
  - arjun-mehta
createdAt: 2026-09-30
decisions:
  - DEC-001
summary: Review of load-test results.
---
## Attendees
Maya Chen, Arjun Mehta

## Outcome
We launch to small accounts.
"""

SLACK = """---
id: SLACK-001
title: Large-run latency and rollout flag
type: Slack thread
project: PRJ-101
authors:
  - maya-chen
createdAt: 2026-09-30
decisions: []
summary: Follow-on thread agreeing the feature-flag approach.
---
#recon-rollout

Maya Chen: Recap of the review.
"""


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


def test_lists_documents_sorted_by_id_without_content(make_client):
    client = make_client({"documents/SLACK-001.md": SLACK, "documents/ZOOM-001.md": ZOOM})
    res = client.get("/documents")
    assert res.status_code == 200
    assert res.json() == [
        {
            "id": "SLACK-001",
            "title": "Large-run latency and rollout flag",
            "type": "Slack thread",
            "projectId": "PRJ-101",
            "authorIds": ["maya-chen"],
            "createdAt": "2026-09-30",
            "decisionIds": [],
            "summary": "Follow-on thread agreeing the feature-flag approach.",
        },
        {
            "id": "ZOOM-001",
            "title": "Reconciliation rollout and peak-load review",
            "type": "Zoom transcript",
            "projectId": "PRJ-101",
            "authorIds": ["maya-chen", "arjun-mehta"],
            "createdAt": "2026-09-30",
            "decisionIds": ["DEC-001"],
            "summary": "Review of load-test results.",
        },
    ]


def test_returns_one_document_with_content_and_body_start_line(make_client):
    client = make_client({"documents/ZOOM-001.md": ZOOM})
    res = client.get("/documents/ZOOM-001")
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"id", "title", "type", "projectId", "authorIds", "createdAt", "decisionIds", "summary", "content", "bodyStartLine"}
    assert body["content"] == "## Attendees\nMaya Chen, Arjun Mehta\n\n## Outcome\nWe launch to small accounts."
    # the frontmatter block ends with its closing fence on line 13; the body starts on line 14
    assert body["bodyStartLine"] == 14


def test_unknown_document_is_404(make_client):
    client = make_client({"documents/ZOOM-001.md": ZOOM})
    assert client.get("/documents/NOPE-001").status_code == 404


@pytest.mark.parametrize("document_id", ["../ZOOM-001", "ZOOM-001.md", "ZOOM%2F001", "..%2Fdocuments"])
def test_ids_that_are_not_plain_ids_are_404(make_client, document_id):
    client = make_client({"documents/ZOOM-001.md": ZOOM})
    assert client.get(f"/documents/{document_id}").status_code == 404


def test_empty_when_the_corpus_has_no_documents(make_client):
    client = make_client({"people/notes.md": "# notes\n"})
    res = client.get("/documents")
    assert res.status_code == 200
    assert res.json() == []


def test_the_retrieval_fixture_corpus_has_no_documents(client: TestClient):
    assert client.get("/documents").json() == []


def test_skips_malformed_files_with_a_warning(make_client, caplog):
    client = make_client(
        {
            "documents/ZOOM-001.md": ZOOM,
            "documents/unclosed.md": "---\nid: unclosed\ntitle: N\n",
            "documents/no-frontmatter.md": "just prose\n",
            "documents/missing-field.md": "---\nid: missing-field\ntitle: N\n---\nA body.\n",
            "documents/empty-body.md": "---\nid: empty-body\ntitle: N\ntype: T\nproject: P\nauthors: []\ncreatedAt: 2026-01-01\ndecisions: []\nsummary: S\n---\n\n \n",
            "documents/bad-authors.md": "---\nid: bad-authors\ntitle: N\ntype: T\nproject: P\nauthors: maya-chen\ncreatedAt: 2026-01-01\ndecisions: []\nsummary: S\n---\nA body.\n",
            "documents/other-id.md": ZOOM,
        }
    )
    with caplog.at_level(logging.WARNING):
        res = client.get("/documents")
    assert [d["id"] for d in res.json()] == ["ZOOM-001"]
    skipped = {
        name
        for name in ("unclosed", "no-frontmatter", "missing-field", "empty-body", "bad-authors", "other-id")
        if name in caplog.text
    }
    assert skipped == {"unclosed", "no-frontmatter", "missing-field", "empty-body", "bad-authors", "other-id"}
    assert client.get("/documents/unclosed").status_code == 404


def test_ignores_non_markdown_files_and_nested_directories(make_client):
    client = make_client(
        {
            "documents/ZOOM-001.md": ZOOM,
            "documents/notes.txt": "not a document",
            "documents/archive/SLACK-001.md": SLACK,
        }
    )
    assert [d["id"] for d in client.get("/documents").json()] == ["ZOOM-001"]


def test_reads_changes_on_disk_without_a_restart(make_client, tmp_path: Path):
    client = make_client({"documents/ZOOM-001.md": ZOOM})
    assert len(client.get("/documents").json()) == 1
    (tmp_path / "corpus" / "documents" / "SLACK-001.md").write_text(SLACK, encoding="utf-8")
    assert len(client.get("/documents").json()) == 2


def test_a_document_file_is_served_by_the_files_route_with_its_entity(make_client):
    client = make_client({"documents/ZOOM-001.md": ZOOM})
    res = client.get("/files/documents/ZOOM-001.md")
    assert res.status_code == 200
    assert res.json()["entity"] == {"kind": "document", "id": "ZOOM-001"}
