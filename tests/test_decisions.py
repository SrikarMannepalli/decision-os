"""GET /decisions and /decisions/{id}: structured decisions from the corpus (ADR-0004)."""

from __future__ import annotations

import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import FakeAgent
from decisionos.main import create_app

DEC_001 = """---
id: DEC-001
title: "Phase rollout of large-account reconciliation"
project: PRJ-101
status: Approved with follow-up
owner: maya-chen
technicalOwner: priya-nair
contributors: [arjun-mehta]
approvers: [maya-chen, arjun-mehta]
decidedAt: 2026-10-01
createdAt: 2026-09-26
updatedAt: 2026-10-08
supersedes: []
supersededBy: []
artifacts: [ZOOM-001, ADR-001]
alternatives:
  - title: "Delay the entire release"
    disposition: Rejected
    rationale: "The smaller-account path passed its current test suite."
    artifacts: [ZOOM-001]
followUps:
  - id: FU-001
    description: "Profile the query plan and deliver a new load-test report."
    owner: priya-nair
    dueDate: 2026-10-14
    status: Open
    artifacts: [ZOOM-001, ADR-001]
---
## Problem
A 30,000-line run showed p95 latency of 8.4 seconds against a target below 5 seconds.

## Decision
Launch to small and mid-sized accounts first.

## Rationale
- Large-run performance was 8.4 s p95 against a target below 5 s. [ZOOM-001] [ENG-001]
- A feature flag lets large accounts be admitted gradually. [ADR-001]

## Caveats
- The 25,000-line threshold is provisional. [FOLLOW-001]

## Open questions
- Is invoice line count the right gating signal? [FOLLOW-001]
"""

DEC_003 = """---
id: DEC-003
title: "Explainability for cash-flow forecasts"
project: PRJ-103
status: Proposed
owner: nadia-brooks
contributors: [leo-fischer]
approvers: []
decidedAt: null
createdAt: 2026-10-01
updatedAt: 2026-10-08
supersedes: []
supersededBy: []
artifacts: [ZOOM-003]
alternatives:
  - title: "Show the three largest forecast drivers with source labels"
    disposition: Proposed
    rationale: "This is the leading proposal only."
    artifacts: [PRD-003]
followUps:
  - id: FU-003
    description: "Prototype both variants."
    owner: leo-fischer
    status: Open
    artifacts: [DES-003]
---
## Problem
Early discovery suggests finance users want to understand forecast changes.

## Leading proposal
Show the three largest forecast drivers with source labels.

## Rationale
- Discovery so far points to a need to see which assumptions move the forecast. [ZOOM-003]

## Caveats
- No final decision has been made.

## Open questions
- Should a confidence score appear? [SLACK-003]
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


def test_lists_decisions_sorted_by_id(make_client):
    client = make_client({"decisions/DEC-003.md": DEC_003, "decisions/DEC-001.md": DEC_001})
    res = client.get("/decisions")
    assert res.status_code == 200
    assert [d["id"] for d in res.json()] == ["DEC-001", "DEC-003"]


def test_returns_one_decision_in_full(make_client):
    client = make_client({"decisions/DEC-001.md": DEC_001})
    res = client.get("/decisions/DEC-001")
    assert res.status_code == 200
    body = res.json()
    assert body == {
        "id": "DEC-001",
        "title": "Phase rollout of large-account reconciliation",
        "projectId": "PRJ-101",
        "status": "Approved with follow-up",
        "ownerId": "maya-chen",
        "technicalOwnerId": "priya-nair",
        "contributorIds": ["arjun-mehta"],
        "approverIds": ["maya-chen", "arjun-mehta"],
        "decidedAt": "2026-10-01",
        "createdAt": "2026-09-26",
        "updatedAt": "2026-10-08",
        "problem": "A 30,000-line run showed p95 latency of 8.4 seconds against a target below 5 seconds.",
        "finalDecision": "Launch to small and mid-sized accounts first.",
        "rationale": [
            "Large-run performance was 8.4 s p95 against a target below 5 s. [ZOOM-001] [ENG-001]",
            "A feature flag lets large accounts be admitted gradually. [ADR-001]",
        ],
        "alternatives": [
            {
                "title": "Delay the entire release",
                "disposition": "Rejected",
                "rationale": "The smaller-account path passed its current test suite.",
                "artifactIds": ["ZOOM-001"],
            }
        ],
        "caveats": ["The 25,000-line threshold is provisional. [FOLLOW-001]"],
        "openQuestions": ["Is invoice line count the right gating signal? [FOLLOW-001]"],
        "followUps": [
            {
                "id": "FU-001",
                "description": "Profile the query plan and deliver a new load-test report.",
                "ownerId": "priya-nair",
                "dueDate": "2026-10-14",
                "status": "Open",
                "artifactIds": ["ZOOM-001", "ADR-001"],
            }
        ],
        "supersedes": [],
        "supersededBy": [],
        "artifactIds": ["ZOOM-001", "ADR-001"],
    }


def test_a_proposed_decision_has_null_fields_and_no_technical_owner(make_client):
    client = make_client({"decisions/DEC-003.md": DEC_003})
    body = client.get("/decisions/DEC-003").json()
    assert body["decidedAt"] is None
    assert body["finalDecision"] is None
    assert body["leadingProposal"] == "Show the three largest forecast drivers with source labels."
    assert "technicalOwnerId" not in body
    assert "dueDate" not in body["followUps"][0]


def test_unknown_decision_is_404(make_client):
    client = make_client({"decisions/DEC-001.md": DEC_001})
    assert client.get("/decisions/DEC-009").status_code == 404


@pytest.mark.parametrize("decision_id", ["../DEC-001", "DEC-001.md", "DEC%2F001", "..%2Fdecisions"])
def test_ids_that_are_not_plain_ids_are_404(make_client, decision_id):
    client = make_client({"decisions/DEC-001.md": DEC_001})
    assert client.get(f"/decisions/{decision_id}").status_code == 404


def test_empty_when_the_corpus_has_no_decisions(make_client):
    client = make_client({"people/notes.md": "# notes\n"})
    assert client.get("/decisions").json() == []


def test_the_retrieval_fixture_corpus_has_no_decisions(client: TestClient):
    assert client.get("/decisions").json() == []


def test_skips_malformed_files_with_a_warning(make_client, caplog):
    client = make_client(
        {
            "decisions/DEC-001.md": DEC_001,
            "decisions/unclosed.md": "---\nid: unclosed\ntitle: N\n",
            "decisions/no-frontmatter.md": "just prose\n",
            "decisions/missing-body-section.md": DEC_001.replace("## Problem", "## Context"),
            "decisions/both-decision-and-proposal.md": DEC_001.replace(
                "## Rationale", "## Leading proposal\nNope\n\n## Rationale"
            ),
            "decisions/bad-status.md": DEC_001.replace("status: Approved with follow-up", "status: Approved;"),
            "decisions/bad-follow-up.md": DEC_001.replace("status: Open", "status: Maybe"),
            "decisions/other-id.md": DEC_001,
        }
    )
    with caplog.at_level(logging.WARNING):
        res = client.get("/decisions")
    assert [d["id"] for d in res.json()] == ["DEC-001"]
    skipped = {
        name
        for name in (
            "unclosed",
            "no-frontmatter",
            "missing-body-section",
            "both-decision-and-proposal",
            "bad-status",
            "bad-follow-up",
            "other-id",
        )
        if name in caplog.text
    }
    assert skipped == {
        "unclosed",
        "no-frontmatter",
        "missing-body-section",
        "both-decision-and-proposal",
        "bad-status",
        "bad-follow-up",
        "other-id",
    }
    assert client.get("/decisions/unclosed").status_code == 404


def test_ignores_non_markdown_files_and_nested_directories(make_client):
    client = make_client(
        {
            "decisions/DEC-001.md": DEC_001,
            "decisions/notes.txt": "not a decision",
            "decisions/archive/DEC-003.md": DEC_003,
        }
    )
    assert [d["id"] for d in client.get("/decisions").json()] == ["DEC-001"]


def test_reads_changes_on_disk_without_a_restart(make_client, tmp_path: Path):
    client = make_client({"decisions/DEC-001.md": DEC_001})
    assert len(client.get("/decisions").json()) == 1
    (tmp_path / "corpus" / "decisions" / "DEC-003.md").write_text(DEC_003, encoding="utf-8")
    assert len(client.get("/decisions").json()) == 2


def test_a_decision_file_is_served_by_the_files_route_with_its_entity(make_client):
    client = make_client({"decisions/DEC-001.md": DEC_001})
    res = client.get("/files/decisions/DEC-001.md")
    assert res.status_code == 200
    assert res.json()["entity"] == {"kind": "decision", "id": "DEC-001"}
