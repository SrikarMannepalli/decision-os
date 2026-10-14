# DecisionOS

DecisionOS answers why a product decision was made, what was assumed, and how it changed, by reading a file corpus.

A person asks a question, then follows up. A read-only agent lists, searches, and reads the files, then answers with the paths and lines it used — remembering the conversation so far.

## V1

The corpus is markdown on disk. Python and FastAPI expose the API. [Pi](https://pi.dev) runs the agent loop. Each conversation is one Pi session that may use `read`, `grep`, `find`, and `ls`, with its working directory set to the corpus.

```text
POST /conversations
    │
    ▼
FastAPI
    │  conversation id
    ▼
POST /conversations/{id}/messages
    │  question
    ▼
Pi session (one per conversation)
    tools: ls, find, grep, read
    │
    ▼
answer + cited file paths for that turn
```

`retrieve(conversation_id, question)` is the function FastAPI calls. A later search index can change how the next file is chosen inside that function. The routes and the answer shape stay the same.

Writing decision records, a timeline, and embeddings come after this loop can open the right file and quote it.

## Repo

Intent lives in `docs/product/`. Binding choices live in `docs/adr/`. The active task lives in `docs/plans/`.

```bash
scripts/verify.sh
```

Live backend testing (fresh machine, RouterPlus credentials) is documented in
`docs/runbooks/testing-the-backend.md`.

## Running the UI: seed data or the backend

The UI reads one of two data sources, chosen by `VITE_DATA_SOURCE` in `ui/.env.local` (copy `ui/.env.example`):

- `seed` (default): the UI's own data in `ui/src/data`, plus a mock answer engine. No backend needed.
- `corpus`: the FastAPI backend over `corpus/finflow`.

A `seed` build is plain static files, so it can be hosted without a backend. The app is served from `/decision-os/` by default (locally: http://localhost:5173/decision-os/), which is also what a GitHub Pages project site needs; build with `VITE_DATA_SOURCE=seed npm run build` in `ui/`. Set `VITE_BASE=/` to serve from the root. Routing is hash-based, so deep links need no server rewrite.

`.github/workflows/pages.yml` publishes the seed build to GitHub Pages on every push to `main` (or by hand from the Actions tab). One-time setup: make the repo public if you are on a free plan, then set Settings → Pages → Source to "GitHub Actions". The site lives at `https://<user>.github.io/<repo>/`.

To point the UI at the backend, change the following:

1. In `ui/.env.local`, set `VITE_DATA_SOURCE=corpus`, then restart `npm run dev` (Vite reads env vars only at startup). `npm run dev:live` does the same for one run.
2. Install and start the API from the repo root, with Python ≥ 3.11 in `.venv`:
   ```bash
   .venv/Scripts/python -m pip install -e '.[dev]'    # .venv/bin/ on macOS/Linux
   DECISIONOS_CORPUS=$PWD/corpus/finflow .venv/Scripts/uvicorn decisionos.main:app --port 8000
   ```
   The corpus root is `corpus/finflow`, not `corpus`; the wrong path returns empty lists.
3. The four catalog pages (Decision Log, Documents, Projects, People) work now. Chat also needs: `cd agent && npm install`, a `~/.pi/agent/models.json` (template in `docs/runbooks/testing-the-backend.md`), and `ROUTERPLUS_API_KEY` exported in the shell that starts uvicorn. Restart the API after setting it.
4. The dev server proxies `/api` to `http://localhost:8000`. Set `DECISIONOS_API_URL` to use another address.

A static host such as GitHub Pages has no backend, so deploy it with `seed`.

`scripts/dev-live.sh` does steps 1–3 in one command.
