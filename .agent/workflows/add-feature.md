---
title: Add a feature end to end
description: Implement a business capability across layers in the active architecture, with tests and documentation.
---

# Add a feature

1. Read the architecture rule (`.agent/rules/architecture.md`) and follow the skill `scaffold-feature` for the layer-by-layer file plan of the active architecture.
2. Model the data first (types/entities), then the service or use case, then the hook, then the UI. Each step gets its test.
3. Expose the feature to the app: a page or a slot in an existing page, a route in `src/App.tsx`, navigation entries in `@const/navigation`.
4. Run `npm run arch:check` early — it tells you immediately if a dependency points the wrong way.
5. `npm run check`, update `CHANGELOG.md` (Unreleased) and any affected docs.
