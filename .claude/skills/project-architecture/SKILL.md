---
name: project-architecture
description: Decide where code lives and keep imports pointing the right way in the active folder architecture (classic, feature-based, Feature-Sliced Design, clean/hexagonal or atomic). Use when creating files, resolving `npm run arch:check` violations, choosing between layers, or switching architectures.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Project architecture

The project's shape is declared in `rtv.config.json` (`architecture`, `aliases`, `templates`). The always-on rule `.agent/rules/architecture.md` is generated from it and lists the layers, their purposes, the aliases and the import rules. Read it first; then use this skill to make decisions.

## 1. Find out where things live

```bash
npm run arch -- current      # layers, aliases, import rules of the active architecture
npm run arch -- list         # the catalogue
cat rtv.config.json          # architecture id, aliases, applied templates, rule exceptions
```

Role aliases exist in **every** architecture, so you can always reason in roles:

| I am adding…                                 | Role / alias                                | Notes                                                      |
| -------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| A route-level screen                         | `@pages`                                    | Default export, one `h1`, smoke test in `__tests__/pages/` |
| Reusable UI without business meaning         | `@components`                               | Named export, props-driven, no data access                 |
| Stateful logic or data access                | `@hooks`                                    | `useX`; the only place components get data from            |
| API clients, storage, side effects           | `@services`                                 | Plain TS, no React                                         |
| Pure helpers                                 | `@utils`                                    | No side effects                                            |
| Shared types                                 | `@types`                                    | `type`/`interface` only                                    |
| Constants, navigation, config                | `@const`                                    |                                                            |
| Images, fonts, svg                           | `@assets`                                   |                                                            |
| Business capability (feature/fsd)            | `@features/<slice>`                         | Public API through `index.ts`                              |
| Business entity (fsd) / domain model (clean) | `@entities/<slice>` / `@domain`             |                                                            |
| Use cases and ports (clean)                  | `@application`                              | Depends only on `@domain`                                  |
| Port implementations (clean)                 | `@infrastructure`                           | HTTP, storage, SDKs                                        |
| Wiring, providers, router                    | `@app` (feature/fsd/clean) or `src/App.tsx` | The composition root may import anything                   |

## 2. Respect the dependency direction

Each layer declares what it may import; `npm run arch:check` scans every module under `src/` and fails on violations. General shape:

- **classic / atomic**: pages → components → hooks → services → utils/const/types. Components never import services. Atomic adds atoms → molecules → organisms → templates inside `components/`.
- **feature**: app → pages → features → shared. Features import other features only via their public API (`@features/billing`, never `@features/billing/components/x`).
- **fsd**: app → pages → widgets → features → entities → shared. Slices on the same layer never import each other.
- **clean**: presentation / infrastructure → application → domain; `shared` is the kernel; only the composition root (`src/app`, `main.tsx`) imports infrastructure.

Inside a page or slice, import siblings with `./` or with the slice alias (`@pages/Dashboard/data`). Parent-relative imports (`../`) are an ESLint error everywhere in `src/`.

## 3. Fix a violation

Read the message: it names the importing layer, the imported layer and the allowed list.

1. **Wrong place?** Move the module to the layer that matches its role (git mv, then fix imports).
2. **Upward dependency?** Invert it: pass data via props, lift the call into a hook/page, or define a port (interface) in the lower layer and implement it higher up.
3. **Legitimate exception?** Add `"from>to"` to `rules.allow` in `rtv.config.json` with a comment in the PR explaining why. Keep the list short.
4. **One-off**: append `// rtv-ignore` to the import line (last resort; say why in a comment).

## 4. Switch architecture

`npm run arch -- apply <id> --dry-run` to preview, then without `--dry-run`. Role folders move (via `git mv`), aliases are rewritten in `rtv.config.json` and `tsconfig.app.json`, READMEs and this project's architecture rule regenerate. Afterwards: `npm run typecheck` (finds relative imports that crossed folders), `npm run arch:check`, then categorise code the new architecture expects (e.g. split into slices).

## 5. Extending the catalogue

Architectures are data in `scripts/lib/architectures.mjs` (roles, extra aliases, layers with `mayImport`, folders, principles). Add or adjust an entry, run `npm run agent:sync` and `npm run test:run` (the catalogue has integrity tests), and update `docs/architecture.md` is regenerated automatically.
