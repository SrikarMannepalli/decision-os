"""Conversations and retrieve() (ADR-0003).

A conversation is an ordered list of turns. Each turn appends the question to
the conversation's Pi session and records the answer with that turn's
citations. Sessions live in the agent process, keyed by conversation id;
the turn history lives here, in memory.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from .sidecar import Agent, Citation, TurnResult

_MISSING = object()


class UnknownConversation(KeyError):
    pass


@dataclass
class Turn:
    question: str
    answer: str
    citations: tuple[Citation, ...] = ()

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "answer": self.answer,
            "citations": [c.to_dict() for c in self.citations],
        }


@dataclass
class Conversation:
    id: str
    turns: list[Turn] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"id": self.id, "turns": [t.to_dict() for t in self.turns]}


class ConversationStore:
    """In-memory conversations. A persistent store must keep this shape."""

    def __init__(self, agent: Agent, corpus: str) -> None:
        self._agent = agent
        self._corpus = corpus
        self._conversations: dict[str, Conversation] = {}

    def create(self) -> Conversation:
        conversation = Conversation(id=uuid.uuid4().hex)
        self._conversations[conversation.id] = conversation
        return conversation

    def get(self, conversation_id: str, default=_MISSING) -> Conversation:
        if conversation_id in self._conversations:
            return self._conversations[conversation_id]
        if default is _MISSING:
            raise UnknownConversation(conversation_id)
        return default

    def retrieve(self, conversation_id: str, question: str) -> Turn:
        """Append one turn to a conversation and return it."""
        conversation = self.get(conversation_id)
        result: TurnResult = self._agent.ask(
            conversation_id, self._corpus, question
        )
        turn = Turn(
            question=question,
            answer=result.answer,
            citations=result.citations,
        )
        conversation.turns.append(turn)
        return turn
