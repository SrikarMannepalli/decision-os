"""Node sidecar client.

Speaks newline-delimited JSON with agent/index.mjs: one Pi session per
conversation, read-only tools, cwd = corpus root. The SDK enters the Node
process only; Python sees a request/response seam so tests can fake it.
"""

from __future__ import annotations

import json
import os
import subprocess
import threading
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

AGENT_DIR = Path(__file__).resolve().parents[2] / "agent"


@dataclass(frozen=True)
class Citation:
    path: str
    lines: tuple[int, int]

    def to_dict(self) -> dict:
        return {"path": self.path, "lines": list(self.lines)}


@dataclass(frozen=True)
class TurnResult:
    answer: str
    citations: tuple[Citation, ...]

    def to_dict(self) -> dict:
        return {
            "answer": self.answer,
            "citations": [c.to_dict() for c in self.citations],
        }


class AgentError(RuntimeError):
    pass


class Agent(Protocol):
    """The seam FastAPI talks to. retrieve() delegates here (ADR-0003)."""

    def ask(self, conversation_id: str, corpus: str, question: str) -> TurnResult: ...


class SidecarAgent:
    """Long-lived agent sidecar process, one JSONL request per turn."""

    def __init__(self, agent_dir: Path = AGENT_DIR, script: str = "index.mjs") -> None:
        env = {**os.environ, "NODE_NO_WARNINGS": "1"}
        self._proc = subprocess.Popen(
            ["node", script],
            cwd=agent_dir,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            env=env,
        )
        self._lock = threading.Lock()

    def ask(self, conversation_id: str, corpus: str, question: str) -> TurnResult:
        request = {
            "id": uuid.uuid4().hex,
            "conversationId": conversation_id,
            "corpus": corpus,
            "question": question,
        }
        with self._lock:
            assert self._proc.stdin is not None
            assert self._proc.stdout is not None
            self._proc.stdin.write(json.dumps(request) + "\n")
            self._proc.stdin.flush()
            line = self._proc.stdout.readline()
        if not line:
            stderr = self._proc.stderr.read() if self._proc.stderr else ""
            raise AgentError(f"agent sidecar exited: {stderr.strip()}")
        response = json.loads(line)
        if not response.get("ok"):
            raise AgentError(response.get("error", "unknown agent error"))
        citations = tuple(
            Citation(path=c["path"], lines=tuple(c["lines"]))
            for c in response.get("citations", [])
        )
        return TurnResult(answer=response["answer"], citations=citations)

    def close(self) -> None:
        with self._lock:
            if self._proc.stdin:
                self._proc.stdin.close()
            self._proc.terminate()
            self._proc.wait(timeout=10)
