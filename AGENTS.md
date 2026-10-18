<!-- rtv:generated -->
# AGENTS.md

> Generated from `.agent/` by `npm run agent:sync`. Edit the files in `.agent/`, not this one. Active architecture: **classic**.

This project was built from **react-ts-vite**, a React 19 + TypeScript + Vite 8 + Tailwind CSS 3 starter whose mindset is **Design tool × Technology × Architecture × Cleanliness**: Tailwind CSS (with Headless UI and Heroicons) for design, React for the UI, a selectable folder architecture for structure, and strict tooling for cleanliness. Keep those four in balance in every change.

### Before you start

- Read `rtv.config.json`: it declares the active architecture, the applied design templates and the path aliases. `npm run arch -- current` prints the layers, their purposes and the import rules that `npm run arch:check` enforces.
- Pick the matching skill in `.agent/skills/` for the task at hand (component, page, feature, tests, review, accessibility, upgrade, CI, deployment report) and follow it.
- Toolchain: Node ≥ 22.12, npm. Install with `npm install`. Scripts are listed below.

### How to work

1. **Place first.** Decide which layer owns the change (see the architecture rule). New top-level folders under `src/` are never created ad hoc.
2. **Import through aliases** (`@components/Button`, `@pages/Dashboard`, `@services/http`). Parent-relative imports (`../`) are an ESLint error; inside a page or slice, import siblings with `./` or through the slice alias (`@pages/Dashboard/data`).
3. **Type everything.** `strict` TypeScript, no `any`, `import type` for types, explicit prop types for components.
4. **Style with Tailwind utilities and the `brand-*` tokens.** Interactive patterns come from Headless UI, icons from Heroicons. Every screen must work in light and dark mode and be keyboard accessible.
5. **Test behaviour.** Vitest + Testing Library; every page has a smoke test in `__tests__/pages/`. Add or update tests with the code they cover.
6. **Run `npm run check`** before finishing: typecheck · lint · format · architecture rules · agent sync · tests. Fix what it reports; never disable a rule, skip a test or add `eslint-disable` to get green.
7. **Keep docs in sync.** New script, template, architecture or skill ⇒ update `README.md`/`docs/` and run `npm run agent:sync`.

### Never

- Move folders by hand to change the architecture; use `npm run arch -- apply <id>`.
- Edit generated files (`AGENTS.md`, `.agent/rules/architecture.md`, `.agent/agent.json`, `.claude/skills/*`, `.claude/commands/*`, `.cursor/rules/*`, `.github/copilot-instructions.md`); edit the source in `.agent/` and run `npm run agent:sync`.
- Add a dependency without stating why in the commit or PR; prefer the platform and the libraries already present.
- Commit secrets. `ANTHROPIC_API_KEY` lives in CI secrets or the developer's shell.

### Scripts

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

## Rules (always apply)

### Project architecture

<!-- source: .agent/rules/architecture.md -->

This project uses the **Classic** architecture (`classic`): Folders by technical role: components, hooks, services, pages.

- Place new code in the layer whose purpose matches it (see the table below). Never create new top-level folders under `src/` without updating the architecture catalogue (`scripts/lib/architectures.mjs`).
- Import through the path aliases listed below (`@components/Button`, `@pages/Dashboard`). Never use parent-relative imports (`../`); the ESLint rule `no-restricted-imports` enforces this.
- Respect the layer dependency direction. Run `npm run arch:check` before finishing a task; it fails on any forbidden import.
- Applied design templates: none. Pages live in `src/pages/`, each with a smoke test in `__tests__/pages/`.
- To switch architecture run `npm run arch -- apply <id>` (never move folders by hand). Project root: `react-ts-vite`.

##### Classic (`classic`) — layered by type

The simplest mental model. Code is grouped by what it *is* (a component, a hook, a service) rather than by what it does. Zero ceremony, instantly familiar to every React developer.

```
src/
├── assets/
├── components/
├── const/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `pages` | `src/pages` | Route-level screens. Compose UI, read data through hooks and own page state. | `pages`, `components`, `hooks`, `services`, `types`, `const`, `utils`, `assets` |
| `components` | `src/components` | Reusable, presentational UI. Receives data through props and never talks to services directly. | `components`, `hooks`, `types`, `const`, `utils`, `assets` |
| `hooks` | `src/hooks` | Stateful logic and data access (`useSomething`). The bridge between UI and services. | `hooks`, `services`, `types`, `const`, `utils` |
| `services` | `src/services` | Side effects: API clients, storage, analytics. Framework-agnostic — no React here. | `services`, `types`, `const`, `utils` |
| `utils` | `src/utils` | Pure, framework-agnostic helpers. No side effects. | `utils`, `types`, `const` |
| `const` | `src/const` | Constants and configuration: navigation, routes, feature flags, environment access. | `const`, `types` |
| `types` | `src/types` | Shared TypeScript types and interfaces. | `types` |
| `assets` | `src/assets` | Static assets imported by code: images, fonts, SVG. | — |

**Aliases**

- `@` → `src`
- `@assets` → `src/assets`
- `@components` → `src/components`
- `@const` → `src/const`
- `@hooks` → `src/hooks`
- `@pages` → `src/pages`
- `@services` → `src/services`
- `@types` → `src/types`
- `@utils` → `src/utils`

**Principles**

- Dependencies flow downwards: pages → components → hooks → services → utils/const/types.
- Components never import services; data access lives in hooks.
- Every folder exposes an `index.ts` barrel when it has more than one public module.

**Best for:** Small and medium apps · Prototypes and MVPs · Teams new to front-end architecture

**Trade-offs:** Folders grow wide as features multiply · Code for one feature is spread across several folders

### Code style and cleanliness

<!-- source: .agent/rules/code-style.md -->

- **Formatting is Prettier's job** (`.prettierrc.json`: no semicolons, single quotes, trailing commas, 100 columns, Tailwind class sorting). Never hand-format or discuss style in reviews.
- **TypeScript**: `strict` is on. No `any` (use `unknown` and narrow), no non-null assertions unless the invariant is explained in a comment, `import type` for type-only imports, `satisfies` for typed literals. Prefer `type` aliases for props and unions; `interface` only for extensible object contracts.
- **Components**: one component per file, named `PascalCase`, folder `ComponentName/index.tsx` for anything with more than one file. Props are a `type ComponentNameProps`. Components are **named exports**; pages (route-level) and `App` are **default exports**. Keep a component under ~150 lines: split by responsibility, not by line count.
- **Hooks** are `useSomething` and own stateful or side-effectful logic. Components stay presentational; data access goes through hooks, hooks call services. Follow the React Compiler-era lint rules (`react-hooks/*`): no `setState` inside effects, no mutation of props or state, derive values during render.
- **Services** are plain TypeScript modules (no React, no JSX) with explicit return types. Errors are thrown as `Error` subclasses or returned as typed results; never swallow them silently.
- **Modules**: import through aliases; order imports as external packages → aliases → relative, separated by blank lines. No default exports from barrels; `index.ts` re-exports only.
- **Naming**: files mirror their export (`useTheme.ts`, `Button/index.tsx`, `formatCurrency.ts`); booleans read as predicates (`isOpen`, `hasError`); event handlers are `handleX` inside and `onX` as props.
- **Comments** explain _why_, never _what_. No commented-out code, no `console.log` in committed code, no TODO without an owner or issue link.
- **Dead code** is deleted, not kept "just in case". Git remembers.
- **Small, reversible changes**: one concern per commit, generated files regenerated by their tool, not edited.

### Design system (Tailwind CSS + Headless UI + Heroicons)

<!-- source: .agent/rules/design-system.md -->

- **Utilities first.** Style with Tailwind utility classes in JSX. Custom CSS belongs only in `src/index.css` (`@layer base`) for tokens and global resets. No inline `style` except for truly dynamic values (e.g. a computed width).
- **Tokens.** The brand colour scale is defined once as CSS variables in `src/index.css` and exposed as `brand-50 … brand-950` (e.g. `bg-brand-600`, `text-brand-400`, `ring-brand-600/20`). Use `brand-*` for primary actions and accents, Tailwind greys for surfaces and text. Re-theming means changing the variables, never find-and-replace in components.
- **Dark mode** uses the `class` strategy (`darkMode: 'class'`): add `dark:` variants for every surface, text and border colour you set. The `useTheme` hook (dashboard template) toggles the `dark` class on `<html>` and persists the choice.
- **Layout**: mobile-first (`sm:` → `lg:` → `xl:`), max-width containers (`mx-auto max-w-7xl px-6 lg:px-8`), the 4-pt spacing scale, consistent radii (`rounded-md` controls, `rounded-lg`/`rounded-2xl` surfaces) and shadows (`shadow-sm` controls, `shadow` cards).
- **Interactive patterns come from Headless UI v2** (`Dialog`, `DialogPanel`, `Menu`, `MenuItems`, `Listbox`, `Switch`, `Disclosure`, `Popover`, `Transition`). Use the named exports and state styling via data attributes (`data-[focus]:bg-gray-50`, `data-[open]:…`). Never re-implement focus traps, keyboard navigation or aria wiring by hand.
- **Icons** are Heroicons: `@heroicons/react/24/outline` for navigation and UI chrome, `24/solid` for emphasis, `20/solid` for dense/inline use. Always `aria-hidden="true"` and give the surrounding control an accessible name (`<span class="sr-only">`).
- **Forms** use `@tailwindcss/forms` base styles plus `ring-1 ring-inset` borders and `focus:ring-2 focus:ring-brand-600`. Every field has a visible `<label>`; errors are linked with `aria-describedby`.
- **Accessibility is part of the design**: semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, visible `focus-visible:outline` styles, `aria-current="page"` on active nav, `role="status"`/`aria-live` for async feedback, WCAG AA contrast (the default brand scale passes on white and gray-900).
- **Conditional classes**: compose with array `.join(' ')` or a tiny `cn` helper in `@utils`; keep class strings static where possible so Tailwind can see them.
- **Class order** is enforced by `prettier-plugin-tailwindcss`; do not reorder by hand.

### Git workflow and releases

<!-- source: .agent/rules/git-workflow.md -->

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:`, with an optional scope (`feat(dashboard): add period filter`). Subject in the imperative, ≤ 72 characters, body explains _why_.
- **Branches**: `feat/<topic>`, `fix/<topic>`, `chore/<topic>` from `master`. One concern per branch; keep PRs reviewable (< ~400 changed lines when possible).
- **Before pushing**: `npm run check` must pass locally; CI runs the same gate on Node 22 and 24 plus an architecture-switch smoke test.
- **Pull requests** describe the change, how it was tested and any follow-ups. Link issues. Generated files (`AGENTS.md`, mirrors, lockfile) are committed together with the change that produced them.
- **Changelog**: add a line under `## [Unreleased]` in `CHANGELOG.md` for every user-visible change (Keep a Changelog format).
- **Release**: bump `version` in `package.json` (`npm version <patch|minor|major> --no-git-tag-version`), move Unreleased into a dated changelog section, commit `chore(release): vX.Y.Z` and merge it into the `release` branch. The `Release` workflow (`.github/workflows/release.yml`) runs the quality gate, tags `vX.Y.Z`, publishes the GitHub release from the changelog section, publishes to npm with provenance and, when `ANTHROPIC_API_KEY` is configured, appends a Claude deployment report. Never tag by hand.
- **Never** rewrite shared history (`push --force` on `master`), commit `.env` files or credentials, or merge with a red CI.

### Testing

<!-- source: .agent/rules/testing.md -->

- **Stack**: Vitest 5 (`happy-dom` environment, URL `http://localhost:3000/`), `@testing-library/react` 16, `@testing-library/jest-dom` matchers (loaded in `vitest.setup.ts`). `globals: true` is on, but import `describe/test/expect` from `vitest` explicitly for clarity.
- **Location**: `__tests__/` mirrors `src/` (`__tests__/pages/Dashboard.test.tsx`, `__tests__/components/Button.test.tsx`). Script and library tests live in `__tests__/scripts/*.test.mjs`. Design templates are tested from `__tests__/templates/`.
- **Every page has a smoke test** that renders it and asserts its `h1`. `npm run templates -- add <id>` generates it; keep it when you customise the page.
- **Test behaviour, not implementation**: query by role and accessible name first (`getByRole('button', { name: /sign in/i })`), then label/text; avoid `data-testid` unless there is no accessible handle. Interact with `fireEvent` (or `@testing-library/user-event` if you add it) and assert visible outcomes.
- **Isolate at the boundary**: mock services (`vi.mock('@services/http')`) or `fetch`, never React internals. Hooks are tested through the components that use them or with `renderHook`.
- **Keep tests deterministic**: no real timers or network; use `vi.useFakeTimers()` when time matters; reset mocks in `afterEach`.
- **Coverage** (`npm run coverage`, v8 provider) is a signal, not a target. Cover branches that matter: validation, error states, empty states, permissions.
- **Run** `npm run test:run` (CI mode) before pushing; `npm test` watches while developing.

## Skills

Reusable know-how for specific tasks. Read the linked `SKILL.md` before starting a matching task.

| Skill | When to use |
| --- | --- |
| [`accessibility-audit`](.agent/skills/accessibility-audit/SKILL.md) | Audit and fix the accessibility of pages and components built with Tailwind, Headless UI and Heroicons — semantics, headings, names, keyboard, focus, contrast, forms, live regions, motion — and verify with Testing Library queries. Use when asked about a11y, WCAG, screen readers, keyboard support or when reviewing UI changes. |
| [`ci-cd-docker`](.agent/skills/ci-cd-docker/SKILL.md) | Work with this project's delivery pipeline — the GitHub Actions quality gate and architecture smoke test, npm publishing with provenance, the Claude deployment-insights workflow, and the Docker images (Vite dev server with hot reload, nginx production image). Use when CI fails, when adding a workflow or deploy target, or when running the app in containers. |
| [`clean-code-review`](.agent/skills/clean-code-review/SKILL.md) | Review a diff or pull request against this project's rules — architecture placement, import direction, types, component design, design-system usage, accessibility, tests and docs — and report findings by severity with concrete fixes. Use when asked to review, audit or critique code, or before opening a PR. |
| [`dependency-upgrade`](.agent/skills/dependency-upgrade/SKILL.md) | Upgrade dependencies safely in this React + TypeScript + Vite + Tailwind + Vitest project — grouped bumps, changelog review, known breaking changes, verification with the full quality gate and documentation updates. Use when asked to update, bump or modernise dependencies or to fix a broken upgrade. |
| [`deployment-insights`](.agent/skills/deployment-insights/SKILL.md) | Produce or configure Claude deployment insights — a Markdown report with summary, release notes, risk assessment, bundle notes and a post-deploy checklist generated from commits, diff and build output. Use when asked for release notes, a deployment summary, a risk review before shipping, or to enable/configure "Claude on deployment". |
| [`project-architecture`](.agent/skills/project-architecture/SKILL.md) | Decide where code lives and keep imports pointing the right way in the active folder architecture (classic, feature-based, Feature-Sliced Design, clean/hexagonal or atomic). Use when creating files, resolving `npm run arch:check` violations, choosing between layers, or switching architectures. |
| [`react-component`](.agent/skills/react-component/SKILL.md) | Create or refactor a React component the way this project expects — typed props, named export, Tailwind tokens, accessibility, co-located test and the right layer. Use when asked to build, extract, split or clean up a component, hook or page. |
| [`scaffold-feature`](.agent/skills/scaffold-feature/SKILL.md) | Plan and create all the files a new business feature needs in the active architecture (types/entities, service or use case, hook, UI, page, route, navigation, tests). Use when asked to "add a feature", "implement <capability>" or scaffold a vertical slice. Accepts the feature name as $ARGUMENTS. |
| [`tailwind-design-system`](.agent/skills/tailwind-design-system/SKILL.md) | Apply the project's Tailwind CSS design system — brand tokens, dark mode, spacing and typography scale, Headless UI v2 patterns and Heroicons — when styling or re-theming UI. Use when building screens, fixing visual inconsistencies, adding interactive components (dialogs, menus, listboxes) or changing the brand palette. |
| [`testing-vitest`](.agent/skills/testing-vitest/SKILL.md) | Write and run tests with Vitest 5, Testing Library and jest-dom in this project — page smoke tests, component behaviour tests, hook tests, service mocks and script tests. Use when adding tests, fixing failing tests, raising coverage or deciding what to test. |

## Workflows

Step-by-step procedures for recurring jobs.

| Workflow | Purpose |
| --- | --- |
| [`add-feature`](.agent/workflows/add-feature.md) | Implement a business capability across layers in the active architecture, with tests and documentation. |
| [`add-page`](.agent/workflows/add-page.md) | Add a route-level page from a design template or from scratch, wire its route and test it. |
| [`new-project`](.agent/workflows/new-project.md) | Scaffold a project from react-ts-vite, choose its architecture and templates, and make the first commit. |
| [`release`](.agent/workflows/release.md) | Cut a version from the release branch, publish it to npm and produce the Claude deployment report. |
| [`review-pr`](.agent/workflows/review-pr.md) | Review changes against the project rules and report findings in a consistent format. |
| [`switch-architecture`](.agent/workflows/switch-architecture.md) | Move the project to another folder architecture safely with the switcher, then verify. |
