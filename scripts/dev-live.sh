#!/usr/bin/env bash
# Run the real backend and the UI together. The only thing you provide is
# ROUTERPLUS_API_KEY. Everything else is set up on first run.
#
#   export ROUTERPLUS_API_KEY=...
#   scripts/dev-live.sh            # API on :8000, UI on :5173, Ctrl-C stops both
#   scripts/dev-live.sh --smoke    # ask one question through the API, print it, exit
#
# Optional: DECISIONOS_CORPUS (default corpus/finflow), API_PORT, UI_PORT,
# SMOKE_QUESTION, DECISIONOS_AGENT_MODEL.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

api_port="${API_PORT:-8000}"
ui_port="${UI_PORT:-5173}"
corpus="${DECISIONOS_CORPUS:-$root/corpus/finflow}"
smoke_question="${SMOKE_QUESTION:-Who is the Security Engineer at FinFlow?}"
pi_dir="$HOME/.pi/agent"
smoke=0
[[ "${1:-}" == "--smoke" ]] && smoke=1

say() { echo "dev-live: $*"; }
die() { echo "dev-live: $*" >&2; exit 1; }

[[ "$(id -u)" -ne 0 ]] || die "do not run this with sudo: it drops your exported key and leaves root-owned files. Run: scripts/dev-live.sh"
[[ -n "${ROUTERPLUS_API_KEY:-}" ]] || die "ROUTERPLUS_API_KEY is not set. Run: export ROUTERPLUS_API_KEY=your-key"
[[ -d "$corpus" ]] || die "corpus directory not found: $corpus"
find "$corpus" -name '*.md' -print -quit | grep -q . || die "no markdown files under $corpus"
command -v python3 >/dev/null || die "python3 not found"
command -v node >/dev/null || die "node not found"
command -v curl >/dev/null || die "curl not found"
python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))' || die "Python >= 3.11 is required"
node -e 'process.exit(Number(process.versions.node.split(".")[0]) < 22 ? 1 : 0)' || die "Node >= 22 is required"

if command -v lsof >/dev/null; then
  for port in "$api_port" "$ui_port"; do
    if [[ -n "$(lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null)" ]]; then
      die "port $port is already in use (set API_PORT / UI_PORT to change)"
    fi
  done
fi

# A root-owned ~/.npm (left by an old sudo npm) breaks installs; use a scratch cache instead.
if [[ -d "$HOME/.npm" && ! -w "$HOME/.npm" ]]; then
  export npm_config_cache="${TMPDIR:-/tmp}/decisionos-npm-cache"
  say "~/.npm is not writable; using $npm_config_cache for npm installs"
fi

if [[ ! -x .venv/bin/uvicorn ]]; then
  say "installing the backend into .venv"
  python3 -m venv .venv
  .venv/bin/pip install -q -e .
fi

if [[ ! -d agent/node_modules ]]; then
  say "installing agent dependencies (agent/)"
  (cd agent && npm install --no-audit --no-fund --loglevel=error)
fi

if [[ ! -d ui/node_modules ]]; then
  say "installing UI dependencies (ui/)"
  (cd ui && npm install --no-audit --no-fund --loglevel=error)
fi

# The sidecar reads its model catalog from here. The key is interpolated from
# the environment, so no secret is written. An existing file is never touched.
if [[ -f "$pi_dir/models.json" ]]; then
  say "using existing $pi_dir/models.json"
else
  say "creating $pi_dir/models.json (RouterPlus provider; the key stays in your environment)"
  mkdir -p "$pi_dir"
  cat >"$pi_dir/models.json" <<'EOF'
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
EOF
fi

log_dir="$(mktemp -d "${TMPDIR:-/tmp}/decisionos-live.XXXXXX")"
api_pid=""
ui_pid=""

cleanup() {
  trap - EXIT
  [[ -n "$ui_pid" ]] && kill "$ui_pid" 2>/dev/null || true
  [[ -n "$api_pid" ]] && kill "$api_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM

say "starting the API on :$api_port (corpus: $corpus)"
DECISIONOS_CORPUS="$corpus" .venv/bin/uvicorn decisionos.main:app --port "$api_port" >"$log_dir/api.log" 2>&1 &
api_pid=$!

ready=0
for _ in $(seq 1 40); do
  if curl -sf "http://localhost:$api_port/openapi.json" >/dev/null 2>&1; then ready=1; break; fi
  kill -0 "$api_pid" 2>/dev/null || break
  sleep 0.5
done
if [[ "$ready" != 1 ]]; then
  tail -n 20 "$log_dir/api.log" >&2 || true
  die "the API did not start (log: $log_dir/api.log)"
fi

if [[ "$smoke" == 1 ]]; then
  say "asking: $smoke_question"
  if ! SMOKE_Q="$smoke_question" API="http://localhost:$api_port" python3 - <<'PY'
import json, os, sys, urllib.error, urllib.request

api, question = os.environ["API"], os.environ["SMOKE_Q"]

def post(path, body=None):
    req = urllib.request.Request(
        api + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as res:
        return json.load(res)

try:
    cid = post("/conversations")["id"]
    turn = post(f"/conversations/{cid}/messages", {"question": question})
except urllib.error.HTTPError as e:
    print(f"dev-live: the API answered HTTP {e.code}: {e.read().decode()[:300]}", file=sys.stderr)
    sys.exit(1)
except Exception as e:  # noqa: BLE001
    print(f"dev-live: request failed: {e}", file=sys.stderr)
    sys.exit(1)

print("\n" + turn["answer"].strip() + "\n")
for c in turn["citations"]:
    print(f"  cited: {c['path']} lines {c['lines'][0]}-{c['lines'][1]}")
if not turn["citations"]:
    print("  (no citations returned)")
    sys.exit(2)
PY
  then
    echo "--- API log (last lines) ---" >&2
    tail -n 25 "$log_dir/api.log" >&2 || true
    die "smoke test failed (full log: $log_dir/api.log)"
  fi
  say "smoke test passed"
  exit 0
fi

say "starting the UI on :$ui_port"
(
  cd ui
  VITE_DATA_SOURCE=corpus DECISIONOS_API_URL="http://localhost:$api_port" \
    exec node_modules/.bin/vite --port "$ui_port" --strictPort >"$log_dir/ui.log" 2>&1
) &
ui_pid=$!

for _ in $(seq 1 40); do
  if curl -sf "http://localhost:$ui_port/" >/dev/null 2>&1; then break; fi
  kill -0 "$ui_pid" 2>/dev/null || { tail -n 20 "$log_dir/ui.log" >&2; die "the UI did not start (log: $log_dir/ui.log)"; }
  sleep 0.5
done

say "ready: open http://localhost:$ui_port"
say "logs: $log_dir (api.log, ui.log). Ctrl-C stops both."

while kill -0 "$api_pid" 2>/dev/null && kill -0 "$ui_pid" 2>/dev/null; do
  sleep 1
done
tail -n 20 "$log_dir/api.log" >&2 || true
die "a server exited (logs: $log_dir)"
