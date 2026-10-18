---
title: Design system (Tailwind CSS + Headless UI + Heroicons)
description: How to style screens consistently with tokens, dark mode and accessible interactive components.
---

# Design system

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
