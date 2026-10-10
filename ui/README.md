# Decision OS UI

Frontend for DecisionOS, set in the fictional fintech FinFlow. React 19, TypeScript, Vite, Tailwind CSS v4, Radix primitives, Lucide.

It runs against the DecisionOS FastAPI backend — there is no mock data layer. Every page (chat, Decision Log, Documents, Projects, People) reads the API; only chat needs a model key.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to the API (see below)
npm run typecheck
npm test
npm run build
```

## Running against the backend

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
cd ui && npm run dev                          # proxies /api to http://localhost:8000
```

Set `DECISIONOS_API_URL` to use a different API address.

- Each UI conversation maps to one backend conversation, created on the first question.
- The answer is the backend's prose, and its `{path, lines}` citations are listed as sources. Clicking a source opens the cited lines (highlighted, with three lines of context) from `GET /files/{path}`. An answer with no citations is shown as "not enough evidence".
- The catalog pages (Decision Log, Documents, Projects, People) read `GET /people`, `/projects`, `/documents`, `/decisions`, so they work without a model key.

## Structure

- `src/services/decisionOSService.ts` the `DecisionOSClient` seam over the FastAPI conversation endpoints
- `src/services/catalogApi.ts` catalog sources over the API, with response-shape validation
- `src/services/liveClient.ts` maps a backend turn (prose + path/line citations) onto the UI's answer shape
- `src/hooks/` routing (hash based, every record is deep-linkable), UI state, chat state, catalog loading
- `src/components/`, `src/pages/` shell, chat, and the Decision Log, Documents, Projects, People, Settings views
