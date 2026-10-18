---
name: tailwind-design-system
description: Apply the project's Tailwind CSS design system — brand tokens, dark mode, spacing and typography scale, Headless UI v2 patterns and Heroicons — when styling or re-theming UI. Use when building screens, fixing visual inconsistencies, adding interactive components (dialogs, menus, listboxes) or changing the brand palette.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Tailwind design system

The project pairs **Tailwind CSS 3** (`tailwind.config.cjs`, `postcss.config.cjs`) with **Headless UI v2** for behaviour and **Heroicons** for icons. The always-on rule `design-system` has the principles; this skill has the recipes.

## Tokens

`src/index.css` defines the brand scale as RGB triplets so opacity modifiers work:

```css
:root {
  --brand-600: 79 70 229; /* bg-brand-600, text-brand-600/80 … */
}
```

`tailwind.config.cjs` maps them to `brand-50 … brand-950`. To re-theme, paste a new 11-step scale (e.g. from the Tailwind palette) into the variables — every template follows. Add new semantic tokens the same way (`--surface`, `--accent`) and expose them under `theme.extend.colors`.

Usage conventions:

| Purpose          | Classes                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Primary action   | `bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-600`                                                     |
| Secondary action | `bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700` |
| Page surface     | `bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`                                                                     |
| Card             | `rounded-lg bg-white shadow ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10`                                          |
| Muted text       | `text-gray-600 dark:text-gray-400`                                                                                               |
| Links/accents    | `text-brand-600 hover:text-brand-500 dark:text-brand-400`                                                                        |
| Badge            | `rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20`                      |

## Dark mode

`darkMode: 'class'`. Add `dark:` variants wherever you set a colour. Toggle with the `useTheme` hook from the dashboard template (`document.documentElement.classList.toggle('dark')`, persisted in `localStorage`, defaults to `prefers-color-scheme`). Promote the hook to `@hooks/useTheme` when more than one page needs it.

## Headless UI v2 recipes

Named exports only; style states through data attributes.

```tsx
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

;<Dialog open={open} onClose={setOpen} className="relative z-50">
  <div className="fixed inset-0 bg-gray-900/50" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
      <DialogTitle className="text-lg font-semibold">Title</DialogTitle>…
    </DialogPanel>
  </div>
</Dialog>
```

```tsx
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

;<Menu>
  <MenuButton className="…">Options</MenuButton>
  <MenuItems
    anchor="bottom end"
    className="w-48 rounded-md bg-white p-1 shadow-lg ring-1 ring-gray-900/5 dark:bg-gray-800"
  >
    <MenuItem>
      <a
        href="/settings"
        className="block rounded px-3 py-1.5 text-sm data-[focus]:bg-gray-100 dark:data-[focus]:bg-gray-700"
      >
        Settings
      </a>
    </MenuItem>
  </MenuItems>
</Menu>
```

Other building blocks: `Listbox` (custom select), `Switch` (toggle), `Disclosure` (accordion), `Popover`, `Tabs`, `Transition` (`transition` prop + `data-[closed]:opacity-0`).

## Icons

`@heroicons/react/24/outline` for chrome and navigation, `24/solid` for emphasis, `20/solid` inline/dense. Always `aria-hidden="true"` with an `sr-only` label on icon-only buttons. Size with `h-5 w-5` / `h-6 w-6`.

## Layout and type scale

- Containers: `mx-auto max-w-7xl px-6 lg:px-8`; content column `max-w-2xl`/`max-w-3xl`.
- Vertical rhythm: section padding `py-24 sm:py-32`; stack spacing `space-y-6`; grid gaps `gap-x-8 gap-y-10`.
- Headings: `h1` `text-4xl font-bold tracking-tight sm:text-6xl` (marketing) or `text-2xl font-semibold tracking-tight` (app); body `text-base leading-7` / `text-lg leading-8`; labels `text-sm font-medium leading-6`.
- Breakpoints: design for mobile, then `sm:` (640), `lg:` (1024), `xl:` (1280).

## Forms

`@tailwindcss/forms` normalises controls. Field pattern: `block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm` plus `dark:bg-gray-900 dark:ring-gray-700`. Error state swaps the ring to `ring-red-400 focus:ring-red-500` and links the message with `aria-describedby` (see `TextField` in the auth template).

## Checklist

- [ ] Only utilities and tokens; no ad-hoc hex colours
- [ ] `dark:` variant for every colour
- [ ] Headless UI for interactive patterns, Heroicons for icons
- [ ] Focus visible, contrast AA, mobile first
- [ ] Run Prettier (class order) — `npm run format`
