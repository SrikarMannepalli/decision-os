# TASK-012: Deploy the seed UI to GitHub Pages

## Goal

Every merge to the default branch publishes the seed-mode UI to GitHub Pages.

## Acceptance criteria

- [x] `.github/workflows/pages.yml` builds `ui/` with `VITE_DATA_SOURCE=seed` and `VITE_BASE=/<repo>/`, runs the UI tests, and deploys `ui/dist` with the official Pages actions.
- [x] The workflow needs no secrets and no backend.
- [x] The README says how to enable Pages and where the site lives.
- [x] `scripts/verify.sh` exits 0.

## Out of scope

- Corpus mode or the backend on Pages.
- Custom domains.
- Adding gitleaks to CI.

## Likely files

- `.github/workflows/pages.yml`, `README.md`

## Verify

```bash
scripts/verify.sh
cd ui && VITE_BASE=/decision-os/ VITE_DATA_SOURCE=seed npm test && npm run build
```

## Notes

- Needs human review: it touches `.github/`.
- The workflow itself can only be exercised on GitHub. Before the first run the repo must be public (free plan) and Pages source set to "GitHub Actions"; both are repo settings, not code.
- Builds on TASK-011 (`VITE_BASE`).
- Checked locally: workflow YAML parses, and `npm ci`, tests and the seeded build with `VITE_BASE` pass. The deploy itself is unverified until it runs on GitHub.
