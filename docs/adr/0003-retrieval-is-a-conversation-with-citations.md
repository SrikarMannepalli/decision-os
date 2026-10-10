# ADR-0003: Retrieval is a conversation with citations

- Status: proposed
- Date: 2026-10-10
- Supersedes: [ADR-0002](0002-retrieval-is-a-read-only-pi-session.md)
- Superseded by: none

## Context

The UI is a chat agent. A user asks a question, then follows up: "and what
changed after that?". The product doc promises that a follow-up can open a
later file when it changes an earlier decision, and say what changed with both
files cited. A one-shot `retrieve(question)` has no memory of the previous
turn, so it cannot compare across turns.

## Decision

Retrieval is a conversation. One in-memory Pi session per conversation holds
the message history; its working directory is the corpus root and its tools
are `read`, `grep`, `find`, and `ls`. FastAPI exposes
`retrieve(conversation_id, question)`: it appends the question to the
conversation's session, runs the agent loop, and returns the turn's answer
plus the paths and line ranges that turn opened. Conversations are addressed
by id through `/conversations` routes.

## Consequences

- Each turn's citations come from that turn's tool use, not from the whole
  conversation.
- Sessions are in-memory for V1; adding a store must not change the route or
  the answer shape.
- Context growth from long histories is handled inside the session (later
  design), not by changing the API.
- Everything ADR-0002 kept fixed still holds: the corpus is read-only, the
  tool set is unchanged, and `scripts/verify.sh` stays the completion gate
  (ADR-0001).
