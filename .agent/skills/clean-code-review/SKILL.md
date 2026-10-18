---
name: clean-code-review
description: Review a diff or pull request against this project's rules — architecture placement, import direction, types, component design, design-system usage, accessibility, tests and docs — and report findings by severity with concrete fixes. Use when asked to review, audit or critique code, or before opening a PR.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Clean code review

## Procedure

1. **Run the gate**: `npm run check`. Anything it reports is a blocking finding (never suggest disabling a rule).
2. **Read the diff** file by file with the checklist below. Open the surrounding code when a change's intent is unclear.
3. **Report** findings ordered by severity, each with `file:line`, the rule or principle, why it matters, and the fix. Three sections: _Blocking_, _Should fix_, _Nits_. Finish with one line on what is good.

## Checklist

**Architecture & modules**

- Module sits in the layer matching its role (`project-architecture`); no new top-level `src/` folders.
- Imports use aliases; no `../`; no imports against the dependency direction (`npm run arch:check`).
- Slices/features expose a public `index.ts`; no deep imports into other slices.

**TypeScript**

- No `any`, no unchecked casts, no `!` without justification; `import type` for types.
- Exhaustive handling of unions (`switch` with `never` default or `satisfies`).
- Public functions have explicit return types where inference is unclear.

**React**

- Components are presentational; data flows through hooks; no `@services` in components.
- No `setState` in effects, no derived state stored in state, stable keys in lists, event handlers not recreated needlessly where it matters.
- Component under ~150 lines and single-responsibility; props typed; named export (default only for pages).

**Design system & accessibility**

- Tailwind utilities with `brand-*` tokens, `dark:` variants present, Prettier class order.
- Headless UI for interactive patterns; Heroicons `aria-hidden`; icon-only controls have `sr-only` labels.
- Semantic elements, one `h1`, labels on inputs, errors linked via `aria-describedby`, visible focus.

**Tests**

- Behaviour covered (happy path + error/empty state); page has a smoke test; mocks at the service boundary; no snapshot of large trees.

**Cleanliness**

- No dead code, commented-out code, `console.log`, TODO without owner.
- Comments explain why; names reveal intent; duplication extracted only when it is real duplication (same reason to change).
- Generated files regenerated, not hand-edited; `CHANGELOG.md` updated for user-visible changes; docs updated for new scripts/templates.

**Security & robustness**

- No secrets or tokens in code; `dangerouslySetInnerHTML` only with sanitised input; external links with `rel="noopener"`; user input validated at the boundary.

## Severity guide

- **Blocking**: breaks the build/gate, violates architecture direction, security issue, missing tests for new behaviour.
- **Should fix**: readability, type looseness, accessibility gaps, duplicated logic.
- **Nit**: naming, comment wording, minor ordering.
