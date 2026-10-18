---
name: deployment-insights
description: Produce or configure Claude deployment insights — a Markdown report with summary, release notes, risk assessment, bundle notes and a post-deploy checklist generated from commits, diff and build output. Use when asked for release notes, a deployment summary, a risk review before shipping, or to enable/configure "Claude on deployment".
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Deployment insights

## Produce a report

```bash
npm run build                                   # optional: adds bundle sizes to the context
npm run deploy:insights -- --dry-run            # see the prompt and context, no API call
npm run deploy:insights                         # writes deployment-insights.md
npm run deploy:insights -- --since v0.1.0 --mode api --model claude-sonnet-5-5
```

`scripts/lib/insights.mjs` collects the context (commits and diff since the previous tag, `dist/` sizes with gzip, package metadata, architecture, CI/deployment metadata from `GITHUB_*`/`RTV_DEPLOY_URL`), uses `PROMPT.md` in this folder as the system prompt and calls Claude in one of two modes:

- **api** — `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY`; defaults to `claude-opus-5-5`, `output_config.effort` from `rtv.config.json`, server-side refusal fallbacks enabled. Best for CI.
- **cli** — the Claude Code CLI (`claude -p`) with read-only tools, so Claude can also inspect the repository while writing. Best locally.

`--mode auto` picks api when a key and the SDK are present, otherwise the CLI.

## When you are the agent writing the report yourself

1. `npm run deploy:insights -- --context-only > /tmp/context.md` (or run the same git commands).
2. Follow `PROMPT.md` in this folder exactly: six short sections, every statement grounded in the context, "not enough information" instead of guesses.
3. Save it as `deployment-insights.md` and, for a release, paste it into the GitHub release notes.

## Enable "Claude on deployment"

`npm run setup -- --claude-insights` (or answer yes in the wizard). It copies `templates/project/claude-deploy-insights.yml` to `.github/workflows/`, adds `@anthropic-ai/sdk` as a dev dependency and records the choice in `rtv.config.json`. Then add the repository secret `ANTHROPIC_API_KEY`. The workflow runs on published releases, successful `deployment_status` events (Vercel, Netlify, Render…) and manual dispatch; without the secret it skips itself.

Configuration (`rtv.config.json` → `claude`): `model` (any current Claude id), `effort` (`low`…`max`), `deploymentInsights` (toggle). Costs: one call per deployment, roughly the size of the diff (capped at 60k characters) plus ~1–2k output tokens.

## Customise the prompt

Edit `PROMPT.md` next to this file. Keep the section structure (teams rely on it), keep the grounding rules, and add project-specific concerns (e.g. "flag any change under `src/payments/` as High risk"). Run `--dry-run` to preview.

## Alternative: Claude Code GitHub Action

If you prefer Claude to inspect the repository in CI, use `anthropics/claude-code-action@v1` with `prompt: "/deployment-insights"`, `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`, `claude_args: "--max-turns 8 --allowedTools Read,Glob,Grep,Bash(git log *),Bash(git diff *)"` and `display_report: true` (requires `id-token: write` or a `github_token`). See `docs/deployment-insights.md`.
