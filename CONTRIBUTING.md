# Contributing

Thanks for helping make react-ts-vite better. The project follows its own rules — the `.agent/` folder documents them for humans and AI agents alike.

## Development

```bash
npm install
npm run dev          # the example app
npm run check        # typecheck · lint · format · arch:check · agent:check · tests
```

Node ≥ 22.12 (`.nvmrc` pins 24). `npm run check` must be green before you open a pull request; CI runs the same gate plus an architecture-switch smoke test.

## Where things live

| Area                   | Location                                                                                 | Notes                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| CLI entry point        | `bin/rtv.mjs`                                                                            | Dispatches to `scripts/commands/*`                                                                      |
| Commands               | `scripts/commands/`                                                                      | One file per command, `export default async function command({ positionals, flags })` + `help`          |
| Libraries              | `scripts/lib/`                                                                           | Pure, testable modules: architecture catalogue, import checker, template registry, agent sync, insights |
| Architecture catalogue | `scripts/lib/architectures.mjs`                                                          | Add an architecture by adding data; docs and rules regenerate                                           |
| Design templates       | `templates/design/<id>/`                                                                 | `template.json` + `files/`; add a render test in `__tests__/templates/`                                 |
| Agent instructions     | `.agent/`                                                                                | Edit here, then `npm run agent:sync`; never edit the mirrors                                            |
| Tests                  | `__tests__/scripts/*.test.mjs`, `__tests__/templates/*.test.tsx`, `__tests__/*.test.tsx` | Vitest projects: `node` for scripts, `dom` for UI                                                       |

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`).
- Keep the CLI dependency-free; use `node:` built-ins.
- Every behaviour change comes with a test and a line under **Unreleased** in `CHANGELOG.md`.
- Generated files (`AGENTS.md`, `docs/architecture.md`, `.agent/rules/architecture.md`, `.agent/agent.json`, `.claude/skills/*`, `.claude/commands/*`, `.cursor/rules/*`, `.github/copilot-instructions.md`) are regenerated with `npm run agent:sync` and committed together with their source changes.
- `templates/project/gitignore` must stay identical to the root `.gitignore` (it is what `npx react-ts-vite create` uses when installed from npm).

## Adding a design template

1. Create `templates/design/<id>/template.json` (`id`, `order`, `title`, `description`, `page`, `route`, `heading`, optional `fallback`) and `files/index.tsx` (default export, one `h1`).
2. Keep it self-contained: page-local components under `files/components/`, imports via `./` or aliases, no `../`.
3. Add `__tests__/templates/<id>.test.tsx` and mention it in `docs/design-templates.md` and the README table.
4. `npm run check` — the catalogue tests verify the manifest, the CI smoke job applies it in every architecture.

## Adding an architecture

Add an entry to `ARCHITECTURES` in `scripts/lib/architectures.mjs` (`roles`, `extraAliases`, `layers` with `mayImport`, `folders`, `principles`), extend the enum in `scripts/schema/rtv.config.schema.json`, run `npm run agent:sync` and `npm run check`.

## Releasing

Follow `.agent/workflows/release.md`: bump the version with `npm version <patch|minor|major> --no-git-tag-version`, move the Unreleased changelog entries into a dated section, commit `chore(release): vX.Y.Z` and merge it into the `release` branch. The `Release` workflow (`.github/workflows/release.yml`) runs the quality gate, tags `vX.Y.Z`, publishes the GitHub release from the changelog section and publishes to npm with provenance. Never create tags by hand.
