"""Shared fixtures: a small markdown corpus and an injectable fake agent."""

from __future__ import annotations

import hashlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from decisionos.main import create_app
from decisionos.sidecar import Agent, Citation, TurnResult

CORPUS = Path(__file__).parent / "corpus"


@pytest.fixture
def corpus() -> Path:
    return CORPUS


def corpus_digest(corpus: Path) -> dict[str, str]:
    return {
        str(p.relative_to(corpus)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(corpus.rglob("*.md"))
    }


class FakeAgent:
    """Records turns per conversation; answers from a canned script."""

    def __init__(self, corpus: Path) -> None:
        self.corpus = corpus
        self.history: dict[str, list[str]] = {}
        self.script: dict[str, TurnResult] = {}
        self.default = TurnResult(
            answer="I looked and the corpus does not say.",
            citations=(),
        )
        # Set to an AgentError to make every turn fail (503 path).
        self.fail_with: Exception | None = None

    def on(self, question: str, answer: str, *citations: tuple[str, tuple[int, int]]) -> None:
        self.script[question] = TurnResult(
            answer=answer,
            citations=tuple(Citation(path=p, lines=ln) for p, ln in citations),
        )

    def ask(self, conversation_id: str, corpus: str, question: str) -> TurnResult:
        assert corpus == str(self.corpus)
        if self.fail_with is not None:
            raise self.fail_with
        self.history.setdefault(conversation_id, []).append(question)
        return self.script.get(question, self.default)


@pytest.fixture
def fake_agent(corpus: Path) -> FakeAgent:
    return FakeAgent(corpus)


@pytest.fixture
def client(fake_agent: FakeAgent, corpus: Path) -> TestClient:
    app = create_app(agent=fake_agent, corpus=str(corpus))
    with TestClient(app) as test_client:
        yield test_client
