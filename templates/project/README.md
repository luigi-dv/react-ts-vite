# {{name}}

Built with [react-ts-vite](https://github.com/luigi-dv/react-ts-vite): React 19 · TypeScript · Vite · Tailwind CSS · Vitest.

## Scripts

| Command                   | What it does                                                                      |
| ------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`             | Start the Vite dev server on http://localhost:3000                                |
| `npm run build`           | Type-check and build for production into `dist/`                                  |
| `npm run preview`         | Serve the production build locally                                                |
| `npm test`                | Run Vitest in watch mode (`npm run test:run` for a single run)                    |
| `npm run check`           | Quality gate: typecheck · lint · format · architecture rules · agent sync · tests |
| `npm run setup`           | Re-run the project wizard (architecture, design templates, Claude insights)       |
| `npm run arch`            | Inspect or switch the folder architecture (`-- apply <id>`, `-- check`)           |
| `npm run templates`       | Add or remove design-template pages (`-- add dashboard`)                          |
| `npm run agent:sync`      | Regenerate AI-agent instructions from `.agent/`                                   |
| `npm run deploy:insights` | Ask Claude for a deployment report (release notes, risks, checklist)              |

## Project shape

The folder architecture, path aliases and applied templates are declared in `rtv.config.json`.
Run `npm run arch -- current` to see the layers and their import rules; `npm run arch:check`
fails on any import that goes against the dependency direction. Full guides live in `docs/`.

## Working with AI agents

`.agent/` holds the always-on rules, reusable skills and workflows for AI coding agents.
They are mirrored to `AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, `.cursor/rules/` and
`.github/copilot-instructions.md` by `npm run agent:sync`, so every tool reads the same guidance.

## Docker

```bash
docker compose -f docker/development/docker-compose.yml up   # dev server with hot reload
docker compose -f docker/production/docker-compose.yml up    # production build served by nginx
```
