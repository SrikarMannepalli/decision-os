"""FastAPI app: conversation routes over retrieve() (ADR-0003) and corpus file content (ADR-0004)."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .corpus import FileNotFound, InvalidPath, InvalidRange, read_slice
from .retrieval import ConversationStore, UnknownConversation
from .sidecar import SidecarAgent

DEFAULT_CORPUS = Path("corpus").resolve()


class MessageRequest(BaseModel):
    question: str = Field(min_length=1)


def create_app(agent=None, corpus: str | None = None) -> FastAPI:
    """Build the app. Tests inject a fake agent; production uses the sidecar."""
    own_agent = agent is None
    if agent is None:
        agent = SidecarAgent()
    corpus_root = corpus or os.environ.get("DECISIONOS_CORPUS", str(DEFAULT_CORPUS))
    store = ConversationStore(agent, corpus_root)
    if own_agent:

        @asynccontextmanager
        async def _lifespan(_app: FastAPI):
            yield
            agent.close()

        app = FastAPI(title="DecisionOS", lifespan=_lifespan)
    else:
        app = FastAPI(title="DecisionOS")
    app.state.store = store

    @app.post("/conversations", status_code=201)
    def create_conversation() -> dict:
        return {"id": store.create().id}

    @app.post("/conversations/{conversation_id}/messages")
    def post_message(conversation_id: str, request: MessageRequest) -> dict:
        try:
            turn = store.retrieve(conversation_id, request.question)
        except UnknownConversation:
            raise HTTPException(status_code=404, detail="unknown conversation")
        return turn.to_dict()

    @app.get("/conversations/{conversation_id}")
    def get_conversation(conversation_id: str) -> dict:
        conversation = store.get(conversation_id, default=None)
        if conversation is None:
            raise HTTPException(status_code=404, detail="unknown conversation")
        return conversation.to_dict()

    @app.get("/files/{path:path}")
    def get_file(path: str, start: int = 1, end: int | None = None) -> dict:
        try:
            return read_slice(Path(corpus_root), path, start, end).to_dict()
        except FileNotFound:
            raise HTTPException(status_code=404, detail="unknown file")
        except (InvalidPath, InvalidRange) as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    return app


app = create_app()
