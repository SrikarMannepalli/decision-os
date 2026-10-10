# Conversational retrieval

## Summary

The chat agent in the UI holds a conversation, so retrieval is a conversation,
not a single question. One Pi session per conversation carries the message
history; each turn may run the tool loop again before answering.

Follows [ADR-0003](../adr/0003-retrieval-is-a-conversation-with-citations.md),
which supersedes [ADR-0002](../adr/0002-retrieval-is-a-read-only-pi-session.md).

## Why

`docs/product/retrieval.md` already promises that "a follow-up on the same
topic can open a later file when that file changes the earlier decision". That
requires the model to remember earlier questions, answers, and citations. A
one-shot `retrieve(question)` cannot do this; it re-reads the tree on every
turn and cannot compare across turns.

## Shape

```text
POST /conversations                 → create conversation, returns id
POST /conversations/{id}/messages   → {question} appended to the conversation
                                    ← {answer, citations[]}
GET  /conversations/{id}            → full message history with citations
```

- A conversation is an ordered list of turns. Each turn is one question and
  one answer.
- `retrieve(conversation_id, question)` appends the question to the
  conversation's Pi session, lets the agent loop run (ls, find, grep, read),
  and returns the answer plus citations (path + line range) extracted from
  that turn's tool use.
- Citations are per-turn. The API response for a turn cites only the files
  that turn opened; the conversation history shows how citations changed
  across turns.
- Sessions live in memory for V1, keyed by conversation id. No persistence in
  this change; a store is a later design.
- The session working directory stays the corpus root and the tool set stays
  `read`, `grep`, `find`, `ls`. The corpus is still never written.

## Turn loop

Per turn:

1. FastAPI receives the question, finds or creates the session.
2. The question is appended to the session's message history.
3. The Pi agent loop runs to completion for this turn: it may list, search,
   and read files, including files it opened in earlier turns.
4. The turn's answer and the files it opened this turn are returned.

## What stays out

- Persistence of conversations beyond process lifetime.
- Streaming responses to the UI.
- Writing decision records or a timeline.
- A search index changing which file the agent opens next.

## Risks

- Long conversations grow the context sent to the model. If that bites,
  compaction or summarizing old turns is a later design — it happens inside
  the session, not in the API contract.
- In-memory sessions are lost on restart. Acceptable for V1; the API shape
  does not change when a store is added.
