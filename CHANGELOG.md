# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Release pipeline (`.github/workflows/release.yml`): pushing a new `package.json` version to the `release` branch — or running the workflow with a version bump — runs the quality gate, tags `vX.Y.Z`, publishes a GitHub release from the matching changelog section, stages the version on npm through trusted publishing (OIDC, no stored token, provenance included) for a maintainer to approve with 2FA — or publishes it directly when `PUBLISH_MODE` is `direct` — and appends the Claude deployment report. Versions already live on npm are skipped, and a hand-published GitHub release publishes its tag too.

### Changed

- Repository URLs use the canonical lowercase owner `luigi-dv`, which npm provenance requires to match the source repository.

### Removed

- `npm-publish.yml`, superseded by the release pipeline.

## [0.2.0] - 2026-10-18

### Added

- **CLI** (`bin/rtv.mjs`, also `npx react-ts-vite`): `create`, `setup`, `arch`, `templates`, `agent`, `insights`. Zero runtime dependencies; every prompt has a flag so it runs in CI.
- **Selectable architectures** — `classic`, `feature`, `fsd` (Feature-Sliced Design), `clean` (hexagonal) and `atomic` — described as data in `scripts/lib/architectures.mjs`. `npm run arch -- apply <id>` moves role folders (via `git mv`), rewrites the alias map in `rtv.config.json` and `tsconfig.app.json`, and regenerates folder READMEs and agent rules.
- **Import-direction checker** (`npm run arch:check`): enforces each layer's allowed imports, slice isolation (FSD) and public-API imports (feature-based); exceptions via `rules.allow` or `// rtv-ignore`.
- **Design templates** (`templates/design/`): landing, dashboard (dark-mode toggle, sidebar, table), auth (validated forms), blank and not-found pages built with Tailwind, Headless UI v2 and Heroicons. Applying a template writes the page, a smoke test and a dependency-free route switch in `src/App.tsx`.
- **`.agent/` folder**: project instructions, always-on rules (architecture _generated_, code style, design system, testing, git workflow), ten skills in the Agent Skills format and six workflows. `npm run agent:sync` mirrors them to `AGENTS.md`, `CLAUDE.md` imports, `.claude/skills`, `.claude/commands`, `.cursor/rules` and `.github/copilot-instructions.md`; `npm run agent:check` guards against drift. `.claude/settings.json` pre-approves project scripts and auto-formats edits through a PostToolUse hook.
- **Claude deployment insights** (`npm run deploy:insights`): collects commits, diff, bundle sizes and project shape, asks Claude (SDK or Claude Code CLI) for a release report, and ships an optional GitHub Actions workflow that runs on releases and successful deployments.
- Design tokens: `brand-*` colour scale driven by CSS variables, class-based dark mode.
- Quality tooling: ESLint 10 flat config (typescript-eslint, react-hooks 7, react-refresh), Prettier with Tailwind class sorting, `.editorconfig`, `.nvmrc`, `npm run check` quality gate, `@testing-library/jest-dom`, v8 coverage.
- JSON schema for `rtv.config.json`; tests for the CLI libraries and every design template.
- Documentation: new README, `docs/` guides, CONTRIBUTING, MIT LICENSE file.

### Changed

- Toolchain upgraded: Vite 3 → 8, Vitest 0.26 → 5, TypeScript 4.6 → 5.9, React 18 → 19, Tailwind 3.2 → 3.4, Headless UI 1 → 2, Testing Library 13 → 16, Node ≥ 22.12 (`.nvmrc` 24).
- `tsconfig.json` is now a solution file referencing `tsconfig.app.json` (with the alias `paths`) and `tsconfig.node.json`; `build` runs `tsc -b && vite build`.
- Path aliases are declared once in `rtv.config.json` and read by `vite.config.ts`; `@/*` and `@pages`, `@hooks`, `@utils` aliases were added.
- `ExampleComponent` uses Headless UI v2 named exports (`DialogPanel`) and real placeholder links.
- CI: Node 22/24 matrix running `npm run check` + build, plus an architecture-switch smoke test; npm publish with provenance and an optional Claude release report.
- Docker: Node 24 images, dev compose with hot-reload volumes, production image now a multi-stage build served by nginx with SPA fallback and asset caching.
- `package.json`: `type: module`, `bin`, `files`, `engines`, MIT license (matches the README badge), richer keywords.

### Removed

- `cssnano` (Vite already minifies CSS on build).
