"""FastAPI app: conversation routes over retrieve() (ADR-0003) and corpus file content (ADR-0004)."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .catalog import Catalog
from .corpus import FileNotFound, InvalidPath, InvalidRange, read_slice
from .retrieval import ConversationStore, UnknownConversation
from .sidecar import AgentError, SidecarAgent

DEFAULT_CORPUS = Path("corpus").resolve()


class MessageRequest(BaseModel):
    question: str = Field(min_length=1)


def agent_detail(exc: AgentError) -> str:
    """A 503 body a person can act on: say what failed and what to check."""
    message = str(exc)
    if "api key" in message.lower():
        return (
            "The agent has no model key, so questions cannot be answered. "
            "Set ROUTERPLUS_API_KEY and restart the API."
        )
    return f"The agent could not answer: {message}"


def create_app(agent=None, corpus: str | None = None) -> FastAPI:
    """Build the app. Tests inject a fake agent; production uses the sidecar."""
    own_agent = agent is None
    if agent is None:
        agent = SidecarAgent()
    corpus_root = corpus or os.environ.get("DECISIONOS_CORPUS", str(DEFAULT_CORPUS))
    store = ConversationStore(agent, corpus_root)
    catalog = Catalog(Path(corpus_root))
    if own_agent:

        @asynccontextmanager
        async def _lifespan(_app: FastAPI):
            yield
            agent.close()

        app = FastAPI(title="DecisionOS", lifespan=_lifespan)
    else:
        app = FastAPI(title="DecisionOS")
    app.state.store = store
    app.state.catalog = catalog

    @app.post("/conversations", status_code=201)
    def create_conversation() -> dict:
        return {"id": store.create().id}

    @app.post("/conversations/{conversation_id}/messages")
    def post_message(conversation_id: str, request: MessageRequest) -> dict:
        try:
            turn = store.retrieve(conversation_id, request.question)
        except UnknownConversation:
            raise HTTPException(status_code=404, detail="unknown conversation")
        except AgentError as exc:
            raise HTTPException(status_code=503, detail=agent_detail(exc))
        return turn.to_dict()

    @app.get("/conversations/{conversation_id}")
    def get_conversation(conversation_id: str) -> dict:
        conversation = store.get(conversation_id, default=None)
        if conversation is None:
            raise HTTPException(status_code=404, detail="unknown conversation")
        return conversation.to_dict()

    @app.get("/people")
    def list_people() -> list[dict]:
        return [person.to_dict() for person in catalog.people()]

    @app.get("/people/{person_id}")
    def get_person(person_id: str) -> dict:
        person = catalog.person(person_id)
        if person is None:
            raise HTTPException(status_code=404, detail="unknown person")
        return person.to_dict()

    @app.get("/projects")
    def list_projects() -> list[dict]:
        return [project.to_dict() for project in catalog.projects()]

    @app.get("/projects/{project_id}")
    def get_project(project_id: str) -> dict:
        project = catalog.project(project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="unknown project")
        return project.to_dict()

    @app.get("/documents")
    def list_documents() -> list[dict]:
        return [doc.to_list_dict() for doc in catalog.documents()]

    @app.get("/documents/{document_id}")
    def get_document(document_id: str) -> dict:
        doc = catalog.document(document_id)
        if doc is None:
            raise HTTPException(status_code=404, detail="unknown document")
        return doc.to_detail_dict()

    @app.get("/decisions")
    def list_decisions() -> list[dict]:
        return [decision.to_dict() for decision in catalog.decisions()]

    @app.get("/decisions/{decision_id}")
    def get_decision(decision_id: str) -> dict:
        decision = catalog.decision(decision_id)
        if decision is None:
            raise HTTPException(status_code=404, detail="unknown decision")
        return decision.to_dict()

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
