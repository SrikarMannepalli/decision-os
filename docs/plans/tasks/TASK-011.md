# TASK-011: Build the seed UI for a sub-path static host

## Goal

The seed-mode UI builds into static files that work when served from a sub-path such as `https://<user>.github.io/decision-os/`.

## Acceptance criteria

- [x] `VITE_BASE` sets the Vite `base`; unset, it stays `/` and the build is unchanged.
- [x] With `VITE_BASE=/decision-os/ VITE_DATA_SOURCE=seed`, `dist/index.html` references its script, stylesheet and favicon under `/decision-os/`.
- [x] `ui/.env.example` and the README document `VITE_BASE`.
- [x] `scripts/verify.sh` exits 0 and the UI checks pass.

## Out of scope

- The GitHub Pages deploy workflow under `.github/`; it waits until the repo is ready for it.
- Changing the dev proxy or corpus mode.

## Likely files

- `ui/vite.config.ts`, `ui/.env.example`, `README.md`, `ui/README.md`

## Verify

```bash
scripts/verify.sh
cd ui && npm test && npm run typecheck && npm run build
VITE_BASE=/decision-os/ VITE_DATA_SOURCE=seed npm run build
```

## Notes

- Routing is hash-based (`ui/src/hooks/useHashRoute.ts`), so deep links need no 404 fallback.
- Seed mode makes no network calls, so a static host needs no backend.
- Checked by building with and without `VITE_BASE`: asset and favicon URLs move under the base. The seed bundle contains no `/api` string (the live client is tree-shaken). Not opened in a browser.
