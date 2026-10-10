"""SidecarAgent speaks the JSONL contract of agent/index.mjs."""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from decisionos.sidecar import AgentError, SidecarAgent

pytestmark = pytest.mark.skipif(
    shutil.which("node") is None, reason="node is not installed"
)

TESTS_DIR = Path(__file__).parent


@pytest.fixture
def agent() -> SidecarAgent:
    sidecar = SidecarAgent(agent_dir=TESTS_DIR, script="fake_sidecar.mjs")
    yield sidecar
    sidecar.close()


def test_round_trip(agent):
    result = agent.ask("conv-1", "/tmp/corpus", "what happened?")
    assert result.answer == "echo:conv-1:what happened?"
    assert result.citations[0].path == "decisions/a.md"
    assert result.citations[0].lines == (3, 6)


def test_error_response_raises(agent):
    with pytest.raises(AgentError, match="boom"):
        agent.ask("conv-1", "/tmp/corpus", "explode")
