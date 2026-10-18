---
name: react-component
description: Create or refactor a React component the way this project expects — typed props, named export, Tailwind tokens, accessibility, co-located test and the right layer. Use when asked to build, extract, split or clean up a component, hook or page.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# React component

## Where it goes

Decide the role first (skill `project-architecture`): reusable UI → `@components`, route-level → `@pages`, logic → `@hooks`. A component used by one page lives inside that page's folder (`<pages>/<Page>/components/`) until a second page needs it.

## File layout

```
src/components/Button/
├── index.tsx          # the component (named export)
└── Button.test.tsx    # optional co-located unit test; page tests live in __tests__/pages
```

Barrel: add `export * from './Button'` to the folder's `index.ts` when one exists.

## Shape

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-600',
  secondary:
    'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
```

Rules of thumb:

- **Props**: a `type XProps`; extend the native element's attributes when wrapping one; `children: ReactNode` when composition is expected; callbacks named `onX`.
- **State** stays as low as possible; lift it only when siblings need it. Derive values during render instead of mirroring them in state.
- **Effects** are for synchronising with the outside world (DOM, subscriptions, storage), never for computing state. Lint (`react-hooks/*`) will flag `setState` in effects.
- **Data** comes in through props or a hook from `@hooks`; components never import `@services`.
- **Styling**: Tailwind utilities with `brand-*` tokens and `dark:` variants (rule `design-system`). Accept `className` to allow composition; put it last.
- **Accessibility**: real elements (`button`, `a`, `label`), accessible names for icon-only controls (`sr-only`), `aria-*` only when semantics are missing.
- **Size**: under ~150 lines; split by responsibility (layout vs. content, container vs. presentational).

## Pages

Default export, one `h1`, composed from components; `__tests__/pages/<Page>.test.tsx` renders it and asserts the heading. Register the route in `src/App.tsx`.

## Hooks

`useX` in `@hooks` (or inside the page/slice while local). Return a small object; keep side effects inside; accept dependencies as parameters so they are testable. Lazy-initialise state (`useState(() => read())`) instead of effects that set state.

## Checklist

- [ ] Right layer and alias imports (no `../`)
- [ ] Typed props, named export (default only for pages)
- [ ] Works in light and dark mode, mobile first
- [ ] Keyboard reachable with visible focus; icons `aria-hidden`
- [ ] Test added or updated; `npm run check` green
