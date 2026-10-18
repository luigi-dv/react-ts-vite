---
name: testing-vitest
description: Write and run tests with Vitest 5, Testing Library and jest-dom in this project — page smoke tests, component behaviour tests, hook tests, service mocks and script tests. Use when adding tests, fixing failing tests, raising coverage or deciding what to test.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Testing with Vitest

## Commands

```bash
npm test                      # watch mode
npm run test:run              # single run (CI)
npm run test:run -- __tests__/pages   # a folder or file
npm run coverage              # v8 coverage → coverage/index.html
```

Config lives in `vite.config.ts` (`test` block): `happy-dom` environment at `http://localhost:3000/`, globals on, `vitest.setup.ts` loads `@testing-library/jest-dom/vitest`. Tests are discovered in `__tests__/**` and `src/**/*.test.tsx`.

## Page smoke test (generated for every template)

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import Dashboard from '@pages/Dashboard'

describe('<Dashboard />', () => {
  test('renders the page heading', () => {
    render(<Dashboard />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Overview')
  })
})
```

## Behaviour test

```tsx
import { fireEvent, render, screen } from '@testing-library/react'

test('shows validation errors on empty submit', () => {
  render(<SignInForm onSubmit={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(screen.getByText('Email address is required.')).toBeInTheDocument()
})
```

Query priority: `getByRole` (with `name`) → `getByLabelText` → `getByText` → `getByTestId` (last resort). Use `findBy*` for async UI and `queryBy*` to assert absence.

## Mocking at the boundary

```ts
vi.mock('@services/customers', () => ({
  listCustomers: vi.fn().mockResolvedValue([{ id: 1, name: 'Ada' }]),
}))
```

Or stub `fetch`: `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))))`. Reset in `afterEach(() => vi.restoreAllMocks())`. Fake timers: `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)`.

## Hooks

Prefer testing through a component. For isolated logic use `renderHook` from `@testing-library/react` and `act` for updates.

## Scripts (`bin/`, `scripts/`)

Plain ESM tests in `__tests__/scripts/*.test.mjs` import the libraries directly (`import { checkImports } from '../../scripts/lib/imports.mjs'`). Use `fs.mkdtempSync` for file-system scenarios and never touch the repository itself.

## What to test (and not)

- ✅ Rendering of every page, validation and error states, conditional UI, hooks' observable behaviour, services' request shaping and error mapping, architecture/catalogue integrity.
- ❌ Tailwind class names, third-party internals (Headless UI focus trapping), snapshots of large trees, implementation details (state variable names).

## Failing test triage

1. Read the assertion and the rendered DOM (`screen.debug()`).
2. Check the accessible name/role you query against the markup.
3. Async? `await screen.findBy…` or `await waitFor(...)`.
4. Environment? URL is `http://localhost:3000/`; `window.matchMedia` exists in happy-dom but returns `matches: false`.
