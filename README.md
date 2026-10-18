<div align="center">

# react-ts-vite

**React 19 · TypeScript · Vite 8 · Tailwind CSS 3 · Vitest 5**

A production-grade starter where **design tool × technology × architecture × cleanliness** stay in balance —
with a zero-dependency CLI that lets you **choose your folder architecture**, **drop in design templates**,
**equip AI coding agents with project skills**, and **run Claude on every deployment**.

[![Build](https://github.com/luigi-dv/react-ts-vite/actions/workflows/build.yml/badge.svg)](https://github.com/luigi-dv/react-ts-vite/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/react-ts-vite.svg)](https://www.npmjs.com/package/react-ts-vite)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12-339933.svg)](.nvmrc)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## The mindset

Most starters give you a stack. This one gives you a stack **and a way of working**, so the codebase stays clean after the first sprint:

| Pillar           | What it means here                                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design tool**  | Tailwind CSS 3 with a token-driven `brand-*` palette, class-based dark mode, Headless UI v2 for accessible interactive patterns and Heroicons. Five ready-made page templates share the same tokens, so re-theming is a CSS-variable change. |
| **Technology**   | React 19, TypeScript 5.9 (`strict`), Vite 8, Vitest 5 + Testing Library, ESLint 10 (flat config, React Compiler rules) and Prettier with Tailwind class sorting.                                                                             |
| **Architecture** | Pick **classic**, **feature-based**, **Feature-Sliced Design**, **clean/hexagonal** or **atomic design**. The CLI moves folders, rewrites aliases and regenerates docs; an import-direction checker keeps the layers honest.                 |
| **Cleanliness**  | One command — `npm run check` — runs typecheck, lint, format check, architecture rules, agent-instruction sync and tests. CI runs the same gate on Node 22 and 24 and smoke-tests every architecture.                                        |

Everything an AI agent needs to respect those four pillars lives in [`.agent/`](.agent) and is mirrored to Claude Code, Codex/`AGENTS.md`, Cursor and GitHub Copilot.

## Quick start

```bash
# Scaffold a new project (wizard: architecture → design templates → Claude insights)
npx react-ts-vite create my-app
cd my-app && npm install && npm run dev
```

```bash
# Or clone the template itself
git clone https://github.com/luigi-dv/react-ts-vite my-app
cd my-app && npm install
npm run setup            # same wizard, in place
npm run dev              # http://localhost:3000
```

The wizard is scriptable for CI and dotfiles:

```bash
npx react-ts-vite create my-app --arch fsd --templates dashboard,auth,not-found --claude-insights --yes --install
```

## What you get

```
my-app/
├── .agent/                 AI-agent instructions: rules, skills (Agent Skills standard), workflows
├── .claude/                Claude Code settings (pre-approved scripts, auto-format hook) + skill mirrors
├── .github/workflows/      Quality gate + architecture smoke test; optional Claude deployment insights
├── bin/rtv.mjs             The CLI (also exposed as `npx react-ts-vite`)
├── docker/                 Dev image with hot reload · production multi-stage nginx image
├── docs/                   Guides: architecture, design templates, agents, deployment insights, CLI
├── scripts/                CLI libraries (architecture catalogue, import checker, template registry, …)
├── src/                    Your app — shaped by the architecture you picked
├── templates/design/       Page templates: landing, dashboard, auth, blank, not-found
├── __tests__/              Vitest + Testing Library (every page has a smoke test)
├── rtv.config.json         The project's shape: architecture, templates, aliases, Claude settings
├── AGENTS.md · CLAUDE.md   Generated / importing agent instructions
└── vite.config.ts · tsconfig.*.json · tailwind.config.cjs · eslint.config.js · .prettierrc.json
```

## Architectures

| Architecture          | Shape                                                                      | Pick it when                                                                    |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `classic` _(default)_ | `components/ hooks/ services/ pages/ const/ types/ utils/ assets/`         | Small/medium apps, prototypes, teams new to front-end architecture              |
| `feature`             | `app/ pages/ features/<slice>/ shared/`                                    | Products with several capabilities, teams that split work by feature            |
| `fsd`                 | `app/ pages/ widgets/ features/ entities/ shared/` (Feature-Sliced Design) | Medium to large products wanting an industry-standard structure                 |
| `clean`               | `domain/ application/ infrastructure/ presentation/ shared/ app/`          | Rich business rules, swappable infrastructure, logic testable without a browser |
| `atomic`              | `components/{atoms,molecules,organisms,templates}/ pages/ …`               | Design-system-driven products and component libraries                           |

```bash
npm run arch -- list                   # catalogue
npm run arch -- current                # layers, aliases and import rules of the active one
npm run arch -- apply fsd --dry-run    # preview: which folders move, which aliases change
npm run arch -- apply fsd              # do it (git mv when tracked)
npm run arch:check                     # dependency-direction check (part of npm run check)
```

**Why switching is safe:** application code imports through _role aliases_ (`@components/Button`, `@pages/Dashboard`, `@services/http`…). Each architecture maps those aliases to its own folders in `rtv.config.json`; Vite reads the map directly and `tsconfig.app.json#paths` is regenerated from it. The checker then enforces each layer's allowed imports (e.g. components never import services; FSD slices never import siblings; presentation never imports infrastructure). Details: [docs/architecture.md](docs/architecture.md).

## Design templates

Self-contained pages built with Tailwind + Headless UI + Heroicons, accessible, dark-mode ready and sharing the `brand-*` tokens.

| Template    | Page        | Route        | Highlights                                                                          |
| ----------- | ----------- | ------------ | ----------------------------------------------------------------------------------- |
| `landing`   | `Landing`   | `/`          | Hero, responsive header with mobile dialog menu, feature grid, footer               |
| `dashboard` | `Dashboard` | `/dashboard` | Sidebar drawer, top bar with theme toggle and user menu, stat cards, activity table |
| `auth`      | `Auth`      | `/login`     | Split-screen sign-in / create-account forms with inline validation and live status  |
| `blank`     | `Home`      | `/`          | Minimal centred start page                                                          |
| `not-found` | `NotFound`  | fallback     | 404 page used for unknown paths                                                     |

```bash
npm run templates -- list
npm run templates -- add dashboard auth --remove-example   # copies pages, writes smoke tests, generates App.tsx
npm run templates -- remove auth
```

Pages land in the pages folder of the active architecture with a smoke test in `__tests__/pages/`; `src/App.tsx` becomes a dependency-free path switch you can swap for a router later. Re-theme everything by editing the CSS variables in `src/index.css`. Details: [docs/design-templates.md](docs/design-templates.md).

## AI agents: the `.agent/` folder

`.agent/` is the single source of truth for how agents (and humans) work in the project:

- **Rules** (always on): architecture _(generated from `rtv.config.json`)_, code style, design system, testing, git workflow.
- **Skills** ([Agent Skills](https://agentskills.io) standard): `project-architecture`, `react-component`, `scaffold-feature`, `tailwind-design-system`, `testing-vitest`, `clean-code-review`, `accessibility-audit`, `dependency-upgrade`, `ci-cd-docker`, `deployment-insights`.
- **Workflows**: new project, add page, add feature, switch architecture, release, review PR.

`npm run agent:sync` renders it into what each tool reads — `AGENTS.md` (Codex, Jules, Amp, Gemini CLI…), `CLAUDE.md` + `.claude/skills/` + `.claude/commands/` (Claude Code), `.github/copilot-instructions.md` (Copilot), `.cursor/rules/` (Cursor) — and `npm run agent:check` fails CI when anything drifts. `.claude/settings.json` pre-approves the project scripts and runs Prettier after every edit. Details: [docs/agents.md](docs/agents.md).

## Claude on deployment

Enable **Claude deployment insights** in the wizard (or `npm run setup -- --claude-insights`) and every release or successful deployment produces a Markdown report — summary, release notes, risk assessment, bundle-size notes, post-deploy checklist — appended to the GitHub release and the job summary.

```bash
npm run build && npm run deploy:insights -- --dry-run   # preview the prompt and context, no API call
npm run deploy:insights                                 # writes deployment-insights.md
```

Runs through the official `@anthropic-ai/sdk` (CI) or the Claude Code CLI (locally, with read-only repository access). Needs an `ANTHROPIC_API_KEY` secret; without it the workflow skips itself. Model and effort are configured in `rtv.config.json`. Details: [docs/deployment-insights.md](docs/deployment-insights.md).

## Scripts

| Script                                                  | What it does                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview`                     | Vite dev server (port 3000) · typecheck + production build · serve `dist/`                          |
| `npm test` / `npm run test:run` / `coverage`            | Vitest watch · single run · v8 coverage                                                             |
| `npm run check`                                         | **Quality gate**: `typecheck` · `lint` · `format:check` · `arch:check` · `agent:check` · `test:run` |
| `npm run lint` / `lint:fix` / `format` / `format:check` | ESLint 10 · Prettier (+ Tailwind class sorting)                                                     |
| `npm run setup`                                         | Wizard: architecture, design templates, Claude deployment insights                                  |
| `npm run arch -- …`                                     | `list` · `current` · `apply <id> [--dry-run]` · `check [--strict]` · `scaffold`                     |
| `npm run templates -- …`                                | `list` · `add <id…> [--remove-example]` · `remove <id…>` · `apply`                                  |
| `npm run agent -- …`                                    | `sync` · `check` · `list`                                                                           |
| `npm run deploy:insights -- …`                          | Claude deployment report (`--dry-run`, `--since <ref>`, `--mode api\|cli`, `--model`)               |

Full reference: [docs/cli.md](docs/cli.md).

## Quality gate and CI

`npm run check` is the contract between you, your teammates and your agents. CI (`.github/workflows/build.yml`) runs it on Node 22 and 24, builds, and in a second job applies **every architecture with every template** and re-runs the checker, typecheck and tests — the switcher is tested on each push.

## Releasing

Releases are driven by the **`release` branch** and the version in `package.json` (`.github/workflows/release.yml`):

1. Bump the version and move the **Unreleased** changelog entries into a dated section: `npm version minor --no-git-tag-version`, edit `CHANGELOG.md`, commit `chore(release): vX.Y.Z`.
2. Merge (or push) that commit to the `release` branch.
3. The pipeline runs the quality gate and build, **stages** the version on npm (`npm stage publish`, uploaded with provenance but not public yet), tags `vX.Y.Z`, publishes a GitHub release whose notes are the matching changelog section plus the npm status and, when `ANTHROPIC_API_KEY` is set, appends the Claude deployment report.
4. A maintainer reviews the staged version and makes it live with 2FA — the exact commands are in the job summary and the release notes:

   ```bash
   npm stage view <stage-id>       # inspect; npm stage download <stage-id> fetches the tarball
   npm stage approve <stage-id>    # publish it (prompts for 2FA)
   ```

Staged publishing is npm's recommended setup: a compromised workflow can only upload, never ship. If you prefer fully automatic releases, set `PUBLISH_MODE: direct` at the top of the workflow (or pick `direct` in a manual run) and tick **Allow `npm publish`** on the trusted publisher. A push whose version is already live on npm does nothing, so the branch can receive any commit safely. You can also run the workflow by hand (Actions → Release → Run workflow) with a `patch`, `minor`, `major` or `prerelease` bump: it commits the new version on the branch and releases it. Pre-release versions (`1.2.0-next.0`) use the `next` dist-tag. Publishing relies on **npm trusted publishing** (OIDC): register a trusted publisher on npmjs.com for this repository (GitHub Actions · `luigi-dv/react-ts-vite` · workflow `release.yml` · environment `release`); `npm stage publish` is always allowed and no npm token is ever stored in GitHub. The only optional secret is `ANTHROPIC_API_KEY`. To release from another branch, change `branches: [release]` at the top of the workflow.

## Docker

```bash
docker compose -f docker/development/docker-compose.yml up --build   # Vite dev server with hot reload
docker compose -f docker/production/docker-compose.yml up --build    # multi-stage build served by nginx on :3000
```

## Documentation

- [Architectures](docs/architecture.md) — every layer, alias and rule, generated from the catalogue
- [Design templates](docs/design-templates.md) — gallery, theming, writing your own template
- [AI agents](docs/agents.md) — the `.agent/` folder, mirrors, adding skills
- [Claude deployment insights](docs/deployment-insights.md) — setup, modes, costs, prompt customisation
- [CLI reference](docs/cli.md) — every command and flag
- [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

## Contributing

Issues and pull requests are welcome. Run `npm run check` before pushing; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Luigi Davila
