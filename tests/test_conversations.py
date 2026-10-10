"""API behavior for conversational retrieval (TASK-001)."""

from __future__ import annotations

import re

from conftest import corpus_digest


def test_create_conversation_returns_id(client):
    response = client.post("/conversations")
    assert response.status_code == 201
    assert re.fullmatch(r"[0-9a-f]+", response.json()["id"])


def test_ask_returns_answer_with_citation(client, fake_agent):
    fake_agent.on(
        "Why was invoice automation deprioritized?",
        "It was deprioritized because the payments partner integration "
        "slipped and Q2 capacity went to audit findings.",
        ("decisions/2024-04-02-invoice-automation-deprioritized.md", (3, 12)),
    )
    conversation_id = client.post("/conversations").json()["id"]
    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={"question": "Why was invoice automation deprioritized?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "deprioritized" in body["answer"]
    assert body["citations"][0]["path"] == (
        "decisions/2024-04-02-invoice-automation-deprioritized.md"
    )


def test_answer_depending_on_two_files_cites_both(client, fake_agent):
    fake_agent.on(
        "Why was invoice automation deprioritized, and what would make us look again?",
        "It was deprioritized on 2024-04-02 after the partner integration "
        "slipped; we will look again once that integration ships and a "
        "sprint frees up after the audit.",
        ("decisions/2024-01-15-invoice-automation-kickoff.md", (1, 6)),
        ("decisions/2024-04-02-invoice-automation-deprioritized.md", (3, 12)),
    )
    conversation_id = client.post("/conversations").json()["id"]
    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={
            "question": "Why was invoice automation deprioritized, "
            "and what would make us look again?"
        },
    )
    assert response.status_code == 200
    paths = {c["path"] for c in response.json()["citations"]}
    assert paths == {
        "decisions/2024-01-15-invoice-automation-kickoff.md",
        "decisions/2024-04-02-invoice-automation-deprioritized.md",
    }


def test_followup_reuses_the_same_conversation_session(client, fake_agent):
    """A follow-up resolves from history: same conversation id, both turns recorded."""
    conversation_id = client.post("/conversations").json()["id"]
    first = "Why was invoice automation deprioritized?"
    followup = "And what would make us look again?"
    fake_agent.on(first, "The partner integration slipped.")
    fake_agent.on(followup, "The integration shipping and post-audit capacity.")
    for question in (first, followup):
        response = client.post(
            f"/conversations/{conversation_id}/messages",
            json={"question": question},
        )
        assert response.status_code == 200

    assert fake_agent.history[conversation_id] == [first, followup]
    history = client.get(f"/conversations/{conversation_id}").json()
    assert [t["question"] for t in history["turns"]] == [first, followup]
    assert history["turns"][1]["answer"] == (
        "The integration shipping and post-audit capacity."
    )


def test_turn_citations_are_per_turn(client, fake_agent):
    conversation_id = client.post("/conversations").json()["id"]
    fake_agent.on(
        "What did we commit to in January?",
        "Three hours saved per week.",
        ("decisions/2024-01-15-invoice-automation-kickoff.md", (1, 6)),
    )
    fake_agent.on(
        "What changed?",
        "It was deprioritized in April.",
        ("decisions/2024-04-02-invoice-automation-deprioritized.md", (3, 12)),
    )
    for question in ("What did we commit to in January?", "What changed?"):
        client.post(
            f"/conversations/{conversation_id}/messages",
            json={"question": question},
        )
    history = client.get(f"/conversations/{conversation_id}").json()["turns"]
    assert history[0]["citations"][0]["path"].endswith("kickoff.md")
    assert history[1]["citations"][0]["path"].endswith("deprioritized.md")


def test_history_keeps_full_turns_with_citations(client, fake_agent):
    fake_agent.on(
        "Why was invoice automation deprioritized?",
        "The integration slipped.",
        ("decisions/2024-04-02-invoice-automation-deprioritized.md", (3, 6)),
    )
    conversation_id = client.post("/conversations").json()["id"]
    client.post(
        f"/conversations/{conversation_id}/messages",
        json={"question": "Why was invoice automation deprioritized?"},
    )
    body = client.get(f"/conversations/{conversation_id}").json()
    turn = body["turns"][0]
    assert turn["question"] == "Why was invoice automation deprioritized?"
    assert turn["answer"] == "The integration slipped."
    assert turn["citations"] == [
        {
            "path": "decisions/2024-04-02-invoice-automation-deprioritized.md",
            "lines": [3, 6],
        }
    ]


def test_unknown_conversation_is_404(client):
    response = client.post(
        "/conversations/nope/messages",
        json={"question": "anything"},
    )
    assert response.status_code == 404
    assert client.get("/conversations/nope").status_code == 404


def test_empty_question_is_rejected(client):
    conversation_id = client.post("/conversations").json()["id"]
    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={"question": ""},
    )
    assert response.status_code == 422


def test_corpus_is_unchanged_after_a_conversation(client, corpus):
    before = corpus_digest(corpus)
    conversation_id = client.post("/conversations").json()["id"]
    for question in (
        "Why was invoice automation deprioritized?",
        "What would make us look again?",
    ):
        client.post(
            f"/conversations/{conversation_id}/messages",
            json={"question": question},
        )
    assert corpus_digest(corpus) == before


def test_agent_failure_is_503_with_the_cause(client, fake_agent):
    from decisionos.sidecar import AgentError

    fake_agent.fail_with = AgentError("Error: No API key found for anthropic.")
    conversation_id = client.post("/conversations").json()["id"]
    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={"question": "anything"},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == (
        "The agent has no model key, so questions cannot be answered. "
        "Set ROUTERPLUS_API_KEY and restart the API."
    )


def test_other_agent_failure_keeps_its_message(client, fake_agent):
    from decisionos.sidecar import AgentError

    fake_agent.fail_with = AgentError("agent sidecar exited: boom")
    conversation_id = client.post("/conversations").json()["id"]
    response = client.post(
        f"/conversations/{conversation_id}/messages",
        json={"question": "anything"},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "The agent could not answer: agent sidecar exited: boom"
