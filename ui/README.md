# Decision OS UI

Frontend for DecisionOS, set in the fictional fintech FinFlow. React 19, TypeScript, Vite, Tailwind CSS v4, Radix primitives, Lucide.

It runs entirely on local typed mock data. No API keys and no backend are needed.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
```

## Chat against the real backend

`npm run dev` answers from the seeded mock. `npm run dev:live` sends chat questions to the FastAPI conversation endpoints instead.

One command does the whole setup (venv, npm installs, `~/.pi/agent/models.json` if absent, both servers). It needs only `ROUTERPLUS_API_KEY`, and must not be run with sudo:

```bash
export ROUTERPLUS_API_KEY=your-key
scripts/dev-live.sh            # API :8000 + UI :5173, Ctrl-C stops both
scripts/dev-live.sh --smoke    # ask one question through the API and exit
```

Or run the pieces by hand:

```bash
# terminal 1 (repo root): the API, with the Pi sidecar's one-time setup done (cd agent && npm install)
uvicorn decisionos.main:app --port 8000      # DECISIONOS_CORPUS points at your markdown corpus
# terminal 2
cd ui && npm run dev:live                     # proxies /api to http://localhost:8000
```

Set `DECISIONOS_API_URL` to use a different API address. In live mode:

- Each UI conversation maps to one backend conversation, created on the first question.
- The answer is the backend's prose, and its `{path, lines}` citations are listed as sources. Clicking a source opens the cited lines (highlighted, with three lines of context) from `GET /files/{path}`. An answer with no citations is shown as "not enough evidence".
- The mock conversations and suggested prompts are hidden. The Decision Log, Documents, Projects and People pages still show the seeded data, because the backend has no endpoints for them yet.

## Structure

- `src/data/` seeded employees, projects, decisions, and 18 source documents
- `src/services/mockRetrieval.ts` deterministic keyword and rule engine (not an LLM)
- `src/services/decisionOSService.ts` `DecisionOSClient` seam; swap `decisionOS` for a real client (for example the FastAPI conversation API) without touching components
- `src/hooks/` routing (hash based, every record is deep-linkable), UI state, chat state
- `src/components/`, `src/pages/` shell, chat, and the Decision Log, Documents, Projects, People, Settings views

## Rules the data layer enforces (see `src/test`)

- Every citation resolves to a seeded document; unknown IDs are never rendered as citations.
- Excerpts are verbatim substrings of their document.
- DEC-003 is never presented as approved. DEC-001's 25,000-line threshold is shown as provisional.
