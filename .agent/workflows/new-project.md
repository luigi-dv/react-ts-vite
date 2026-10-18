---
title: Start a new project
description: Scaffold a project from react-ts-vite, choose its architecture and templates, and make the first commit.
---

# New project

1. Scaffold: `npx react-ts-vite create <dir>` (or clone the template and run `npm install` then `npm run setup`).
2. In the wizard choose the **architecture** (see `docs/architecture.md` — `classic` for small apps, `feature`/`fsd` for products, `clean` for rich domains, `atomic` for design-system work), the **design templates** that match the product (landing, dashboard, auth, blank, not-found) and whether to enable **Claude deployment insights**.
3. `npm install && npm run check` — everything must be green before any product code is written.
4. Replace placeholders: project name in `package.json`/`index.html`, the `Acme` brand marks in the templates, the `brand-*` variables in `src/index.css`.
5. Review `.agent/instructions.md` and the generated architecture rule; adjust `rules.allow` in `rtv.config.json` only with a documented reason.
6. Commit: `git add -A && git commit -m "chore: bootstrap project from react-ts-vite"`.
