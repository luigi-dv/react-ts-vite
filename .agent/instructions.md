# Working in this project

This project was built from **react-ts-vite**, a React 19 + TypeScript + Vite 8 + Tailwind CSS 3 starter whose mindset is **Design tool × Technology × Architecture × Cleanliness**: Tailwind CSS (with Headless UI and Heroicons) for design, React for the UI, a selectable folder architecture for structure, and strict tooling for cleanliness. Keep those four in balance in every change.

## Before you start

- Read `rtv.config.json`: it declares the active architecture, the applied design templates and the path aliases. `npm run arch -- current` prints the layers, their purposes and the import rules that `npm run arch:check` enforces.
- Pick the matching skill in `.agent/skills/` for the task at hand (component, page, feature, tests, review, accessibility, upgrade, CI, deployment report) and follow it.
- Toolchain: Node ≥ 22.12, npm. Install with `npm install`. Scripts are listed below.

## How to work

1. **Place first.** Decide which layer owns the change (see the architecture rule). New top-level folders under `src/` are never created ad hoc.
2. **Import through aliases** (`@components/Button`, `@pages/Dashboard`, `@services/http`). Parent-relative imports (`../`) are an ESLint error; inside a page or slice, import siblings with `./` or through the slice alias (`@pages/Dashboard/data`).
3. **Type everything.** `strict` TypeScript, no `any`, `import type` for types, explicit prop types for components.
4. **Style with Tailwind utilities and the `brand-*` tokens.** Interactive patterns come from Headless UI, icons from Heroicons. Every screen must work in light and dark mode and be keyboard accessible.
5. **Test behaviour.** Vitest + Testing Library; every page has a smoke test in `__tests__/pages/`. Add or update tests with the code they cover.
6. **Run `npm run check`** before finishing: typecheck · lint · format · architecture rules · agent sync · tests. Fix what it reports; never disable a rule, skip a test or add `eslint-disable` to get green.
7. **Keep docs in sync.** New script, template, architecture or skill ⇒ update `README.md`/`docs/` and run `npm run agent:sync`.

## Never

- Move folders by hand to change the architecture; use `npm run arch -- apply <id>`.
- Edit generated files (`AGENTS.md`, `.agent/rules/architecture.md`, `.agent/agent.json`, `.claude/skills/*`, `.claude/commands/*`, `.cursor/rules/*`, `.github/copilot-instructions.md`); edit the source in `.agent/` and run `npm run agent:sync`.
- Add a dependency without stating why in the commit or PR; prefer the platform and the libraries already present.
- Commit secrets. `ANTHROPIC_API_KEY` lives in CI secrets or the developer's shell.

## Scripts

| Script                                                         | Purpose                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev` / `build` / `preview`                            | Vite dev server (port 3000) · production build · serve the build                           |
| `npm test` / `npm run test:run` / `coverage`                   | Vitest watch · single run · coverage report                                                |
| `npm run check`                                                | Quality gate: `typecheck`, `lint`, `format:check`, `arch:check`, `agent:check`, `test:run` |
| `npm run lint:fix` / `format`                                  | Auto-fix ESLint findings · format with Prettier (Tailwind class order included)            |
| `npm run setup`                                                | Wizard: architecture, design templates, Claude deployment insights                         |
| `npm run arch -- <list\|current\|apply <id>\|check\|scaffold>` | Architecture catalogue and switcher                                                        |
| `npm run templates -- <list\|add <id…>\|remove <id…>\|apply>`  | Design-template pages                                                                      |
| `npm run agent -- <sync\|check\|list>`                         | AI-agent instructions                                                                      |
| `npm run deploy:insights`                                      | Claude deployment report (`--dry-run` to preview the prompt)                               |
