---
name: accessibility-audit
description: Audit and fix the accessibility of pages and components built with Tailwind, Headless UI and Heroicons — semantics, headings, names, keyboard, focus, contrast, forms, live regions, motion — and verify with Testing Library queries. Use when asked about a11y, WCAG, screen readers, keyboard support or when reviewing UI changes.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Accessibility audit

Target: WCAG 2.2 AA. Work through the checklist on the rendered page (dev server) and the source.

## Checklist

1. **Landmarks & structure** — `header`, `nav` (with `aria-label` when more than one), `main`, `footer`; exactly one `h1`; headings in order without skipping levels; lists are `ul/ol`.
2. **Names** — every control has an accessible name: visible text, `<label htmlFor>`, or `sr-only` text for icon-only buttons; images have `alt` (empty for decoration); icons `aria-hidden="true"`.
3. **Keyboard** — everything reachable with Tab in a sensible order; Enter/Space activate; Escape closes dialogs/menus (Headless UI handles this when you use its components); no keyboard traps; skip link for long pages (`sr-only focus:not-sr-only`).
4. **Focus** — visible focus on every interactive element (`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600`); focus moves into dialogs and returns on close (Headless UI); never `outline-none` without a replacement.
5. **Contrast** — text ≥ 4.5:1, large text/UI ≥ 3:1. The default brand scale: `brand-600` on white and `brand-400` on `gray-900` pass; check custom palettes with a contrast checker. Do not convey state by colour alone (add icon or text).
6. **Forms** — visible labels, `autoComplete`, `type`, errors linked via `aria-describedby` + `aria-invalid`, submit feedback in `role="status"`/`aria-live="polite"`, required fields marked in text.
7. **Dynamic content** — loading and result announcements through live regions; dialogs via `Dialog` with `DialogTitle`; menus via `Menu`; current page via `aria-current="page"`.
8. **Motion & preferences** — respect `prefers-reduced-motion` (`motion-safe:`/`motion-reduce:`), dark mode via `dark:`; no auto-playing media.
9. **Responsive & zoom** — no horizontal scroll at 320 px; text resizes to 200 %; touch targets ≥ 24 px.
10. **Language & titles** — `<html lang>`, meaningful `<title>` per page.

## Verify with tests

```tsx
screen.getByRole('heading', { level: 1 })
screen.getByRole('button', { name: /open main menu/i })
screen.getByLabelText('Email address')
expect(screen.getByRole('status')).toHaveTextContent(/saved/i)
```

If a query needs `data-testid`, the markup probably lacks semantics — fix the markup first. For automated checks add `vitest-axe` or run Lighthouse/axe DevTools in the browser.

## Report format

For each issue: location, WCAG criterion (e.g. 1.3.1, 2.4.7, 4.1.2), impact (blocker / serious / moderate / minor), fix with the exact Tailwind/JSX change.
