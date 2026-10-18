---
name: ci-cd-docker
description: Work with this project's delivery pipeline — the GitHub Actions quality gate and architecture smoke test, npm publishing with provenance, the Claude deployment-insights workflow, and the Docker images (Vite dev server with hot reload, nginx production image). Use when CI fails, when adding a workflow or deploy target, or when running the app in containers.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# CI, CD and Docker

## Workflows (`.github/workflows/`)

| File                         | Trigger                                                            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build.yml`                  | push/PR to `master`, manual                                        | Matrix Node 22 & 24: `npm ci`, `npm run check`, `npm run build`. Second job applies every architecture with all templates and runs `arch check`, typecheck and tests.                                                                                                                                                                                                                                                                           |
| `release.yml`                | push to the `release` branch, GitHub release published, manual run | Release pipeline: `verify` (quality gate + build) → `release` (resolve the version in `package.json`, skip if already on npm, tag `vX.Y.Z`, GitHub release from the matching `CHANGELOG.md` section, `npm publish --provenance --access public`; manual runs can bump the version first) → `insights` (Claude deployment report appended to the release when `ANTHROPIC_API_KEY` is set). Template repository only; `rtv create` leaves it out. |
| `claude-deploy-insights.yml` | release published, `deployment_status` = success, manual           | Builds, runs `node bin/rtv.mjs insights --mode api`, uploads `deployment-insights.md`, appends it to the release. Created by `npm run setup` when Claude insights are enabled; skips itself without the secret.                                                                                                                                                                                                                                 |

Conventions: pin actions by major (`actions/checkout@v5`, `actions/setup-node@v5`), use `node-version-file: .nvmrc`, cache npm, keep `permissions` minimal and explicit, prefer one `npm run check` over many separate steps so local and CI gates are identical.

## Debugging a red CI

1. Reproduce locally with the same command (`npm run check`, `npm run build`). Node version differences? Use `nvm use` (`.nvmrc` = 24).
2. Format failures → `npm run format`. Lint → `npm run lint:fix` then fix the rest by hand. Architecture → skill `project-architecture`. Agent sync → `npm run agent:sync` and commit.
3. Architecture smoke job failing: run the same loop locally (see the job's `run:` block). It catches templates or code that only work in one architecture.
4. Never fix CI by deleting a check, skipping a test or adding `continue-on-error`.

## Deploying the app

The build is static (`dist/`). Any static host works: Vercel/Netlify (framework preset Vite, output `dist`), GitHub Pages (`actions/upload-pages-artifact` on `dist`), S3/CloudFront, or the Docker production image below. Set `base` in `vite.config.ts` when the app is served from a sub-path. Runtime config goes through `VITE_*` environment variables (`import.meta.env.VITE_API_URL`); never ship secrets to the client bundle.

Hosts that create GitHub _deployments_ (Vercel, Netlify, Render…) trigger the `deployment_status` event, which is how the Claude insights workflow runs after each successful deployment.

## Docker

```bash
# development — Vite dev server with hot reload (source mounted as a volume)
docker compose -f docker/development/docker-compose.yml up --build

# production — multi-stage build, nginx serving dist/ on :3000 with SPA fallback
docker compose -f docker/production/docker-compose.yml up --build
```

`docker/production/nginx.conf` sets immutable caching for `/assets/`, `no-cache` for `index.html`, gzip and basic security headers. Adjust `add_header Content-Security-Policy` when you know your origins.

## Adding a workflow

Copy the structure of `build.yml`, keep `permissions` explicit, use `npm ci`, run `npm run check` before anything that deploys, and document the new workflow here and in `docs/deployment-insights.md` or `README.md`.
