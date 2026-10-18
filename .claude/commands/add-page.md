---
description: "Add a route-level page from a design template or from scratch, wire its route and test it."
---
<!-- rtv:generated -->
<!-- Generated from .agent/workflows/add-page.md by `npm run agent:sync`. -->

# Add a page

1. From a template: `npm run templates -- add <id>` (`npm run templates -- list` shows the catalogue). This copies the page into the pages folder of the active architecture, writes `__tests__/pages/<Page>.test.tsx` and regenerates `src/App.tsx`.
2. From scratch: create `<pages>/<Page>/index.tsx` with a default-exported component and a single `h1`; add it to the route table in `src/App.tsx`; write the smoke test (copy the shape of an existing one).
3. Compose the page from `@components` and hooks; keep page-local pieces inside the page folder (`./components/…`) until a second page needs them, then promote them.
4. Check dark mode, mobile layout and keyboard navigation (skill `accessibility-audit`).
5. `npm run check`; update `docs/design-templates.md` if the page is meant to be a reusable template (`templates/design/<id>/`).
