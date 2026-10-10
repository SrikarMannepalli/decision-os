# Testing the backend

How to verify DecisionOS on this machine or a fresh one. Two levels:

offline (no credentials, no network) and live (real model turns through
RouterPlus). Offline is the completion gate; live is manual verification.

## What talks to what

```text
curl → uvicorn (FastAPI) → node agent/index.mjs → Pi session → RouterPlus
```

The sidecar inherits the server's environment, so every env var below must be
set in the shell that starts uvicorn. The Pi session reads its model catalog
from the machine-local `~/.pi/agent/models.json` — that file is **not** in
this repo and must exist on every machine that runs the backend live.

## Prerequisites

- Python ≥ 3.11, Node ≥ 22, git
- A RouterPlus API key (set as `ROUTERPLUS_API_KEY`)
- A markdown corpus to point the server at

## Offline tests (no credentials)

This is what CI runs. It fakes the sidecar at the `Agent` seam and the JSONL
protocol against a fake Node sidecar, so it needs no key and no network:

```bash
scripts/verify.sh
```

It also creates `.venv` and installs the package into it, which the live
steps below reuse.

## One-time live setup on a fresh machine

1. Clone the repo and check out the branch or commit under test.

2. Create `~/.pi/agent/models.json` with the RouterPlus provider. The key
   itself is **not** in this file — it is interpolated from the environment —
   so the file is safe to copy around:

   ```json
   {
     "providers": {
       "anthropic": {
         "baseUrl": "https://api.routerplus.com",
         "apiKey": "$ROUTERPLUS_API_KEY",
         "headers": {
           "Authorization": "Bearer $ROUTERPLUS_API_KEY"
         },
         "models": [
           {
             "id": "claude-haiku-5-5",
             "name": "Claude Haiku 5.5 (RouterPlus)",
             "reasoning": true,
             "input": ["text", "image"],
             "contextWindow": 200000,
             "maxTokens": 64000
           },
           {
             "id": "claude-sonnet-5-5",
             "name": "Claude Sonnet 5.5 (RouterPlus)",
             "reasoning": true,
             "input": ["text", "image"],
             "contextWindow": 200000,
             "maxTokens": 64000
           }
         ]
       }
     }
   }
   ```

   Both headers are sent on purpose: pi's `apiKey` becomes `x-api-key`, and
   the explicit `Authorization: Bearer` mirrors what Claude Code sends. Most
   Anthropic-compatible proxies accept either; if yours rejects one, delete
   the other.

3. Install the sidecar dependencies:

   ```bash
   cd agent && npm install && cd ..
   ```

## Run the backend live

```bash
export ROUTERPLUS_API_KEY=your-key

# Quick smoke test: use the fixture corpus.
# For a real corpus, point DECISIONOS_CORPUS at its absolute path.
DECISIONOS_CORPUS=$PWD/tests/corpus .venv/bin/uvicorn decisionos.main:app --port 8000
```

Optional overrides:

- `DECISIONOS_AGENT_MODEL` — a different model id from `models.json`
  (default `claude-haiku-5-5`).
- `DECISIONOS_CORPUS` — corpus root (default `./corpus`).

## Smoke test

In a second shell:

```bash
id=$(curl -s -X POST localhost:8000/conversations | grep -o '"id":"[^"]*' | cut -d'"' -f4)

curl -s -X POST localhost:8000/conversations/$id/messages \
  -H 'content-type: application/json' \
  -d '{"question":"Why was invoice automation deprioritized?"}'
```

Expected: JSON with an `answer` and `citations` naming files under
`decisions/` in the corpus. Then verify memory across turns:

```bash
curl -s -X POST localhost:8000/conversations/$id/messages \
  -H 'content-type: application/json' \
  -d '{"question":"Which earlier decision did that supersede?"}'

curl -s localhost:8000/conversations/$id
```

Record live results in the active task file's Notes (AGENTS.md).

## Troubleshooting

| Symptom | Cause → fix |
| --- | --- |
| `model anthropic/claude-haiku-5-5 is not registered` | `~/.pi/agent/models.json` missing or the id differs → create/fix the file |
| HTTP 401 from RouterPlus | Bad `ROUTERPLUS_API_KEY`, or the proxy wants only one auth style → fix the key or drop one header from `models.json` |
| `agent sidecar exited: ... MODEL_ID ...` stack on stderr | Same as "not registered" — check `models.json` and `DECISIONOS_AGENT_MODEL` |
| `model ... does not exist` from the API | RouterPlus names its haiku differently → check ids with `curl -s https://api.routerplus.com/v1/models -H "Authorization: Bearer $ROUTERPLUS_API_KEY"`, then fix `models.json` (and the `DECISIONOS_AGENT_MODEL` default) |
| Connection errors to `api.routerplus.com` | Network/egress from that machine |
| `npm install` fails in `agent/` | Check Node ≥ 22 |

## Notes

- The wrong-model-id case fails on the first request, not at startup: the
  sidecar checks registration locally (id exists in `models.json`) but only
  the live call discovers upstream id mismatches.
- `scripts/verify.sh` remains the completion gate for changes; live runs are
  manual verification on top of it.
