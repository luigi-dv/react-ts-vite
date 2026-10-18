---
title: Switch architecture
description: Move the project to another folder architecture safely with the switcher, then verify.
---

# Switch architecture

1. Preview: `npm run arch -- apply <id> --dry-run` shows which role folders move and which aliases change.
2. Apply: `npm run arch -- apply <id>`. Folders are moved (via `git mv` when tracked), aliases are rewritten in `rtv.config.json` and `tsconfig.app.json`, layer READMEs and `.agent/rules/architecture.md` are regenerated.
3. Fix what aliases cannot: relative imports that crossed moved folders (`npm run typecheck` lists them) — replace them with alias imports.
4. `npm run arch:check` reports imports that break the new layer rules; move modules or add a justified exception to `rules.allow`.
5. Categorise what the new architecture expects (e.g. move components into `atoms/molecules/organisms` for `atomic`, split features into slices for `fsd`).
6. `npm run check`, then commit with `refactor: switch to <id> architecture`.
