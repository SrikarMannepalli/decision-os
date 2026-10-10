# ADR-0001: `scripts/verify.sh` is the completion gate

- Status: accepted
- Date: 2026-10-10
- Supersedes: none
- Superseded by: none

## Context

Agents and CI both need one definition of "this change is done". Separate lint, test, and doc checks drift apart when each caller invents its own command.

## Decision

`scripts/verify.sh` is the only completion gate. `AGENTS.md` tells agents to run it before finishing. `.github/workflows/ci.yml` runs that same script. Language-specific lint and tests are added inside the script, not as extra commands agents must remember.

## Consequences

- A change is unfinished while `scripts/verify.sh` exits non-zero.
- New checks belong in the script.
- Every numbered ADR file must be listed in `docs/adr/README.md`. The script enforces that.
