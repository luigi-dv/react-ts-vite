---
name: scaffold-feature
description: Plan and create all the files a new business feature needs in the active architecture (types/entities, service or use case, hook, UI, page, route, navigation, tests). Use when asked to "add a feature", "implement <capability>" or scaffold a vertical slice. Accepts the feature name as $ARGUMENTS.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Scaffold a feature

Feature to build: **$ARGUMENTS** (ask for a one-line description if it is not obvious).

## 0. Read the shape

`cat rtv.config.json` → `architecture`. The file plan below depends on it. Aliases are listed in `.agent/rules/architecture.md`.

## 1. File plan per architecture

Replace `invoices` / `Invoice` with the feature name.

**classic**

```
src/types/invoice.ts                 Invoice type(s)
src/services/invoices.ts             listInvoices(), createInvoice() — fetch wrappers
src/hooks/useInvoices.ts             loading/error/data state over the service
src/components/InvoiceTable/index.tsx   presentational
src/pages/Invoices/index.tsx         composes table + hook, default export, h1
__tests__/pages/Invoices.test.tsx    smoke + one behaviour test
```

**feature** (vertical slice)

```
src/features/invoices/
├── index.ts                 public API: export { InvoiceList } ; export type { Invoice }
├── types.ts
├── api/invoices.ts
├── hooks/useInvoices.ts
└── components/InvoiceList.tsx
src/pages/Invoices/index.tsx   imports from '@features/invoices' only
```

**fsd**

```
src/entities/invoice/{index.ts, model/types.ts, ui/InvoiceCard.tsx}
src/features/create-invoice/{index.ts, ui/CreateInvoiceForm.tsx, model/useCreateInvoice.ts, api/createInvoice.ts}
src/widgets/invoice-list/{index.ts, ui/InvoiceList.tsx}
src/pages/invoices/{index.ts, ui/InvoicesPage.tsx}
```

Each slice imports only lower layers and exposes `index.ts`.

**clean**

```
src/domain/entities/Invoice.ts                       entity + invariants (pure TS)
src/domain/repositories/InvoiceRepository.ts         interface (port)
src/application/use-cases/ListInvoices.ts            uses the port
src/infrastructure/repositories/HttpInvoiceRepository.ts  implements the port
src/app/container.ts                                 wires HttpInvoiceRepository into ListInvoices
src/presentation/hooks/useInvoices.ts                calls the use case from context/container
src/presentation/components/InvoiceTable/index.tsx
src/presentation/pages/Invoices/index.tsx
```

Presentation never imports infrastructure; the container (`src/app`) does.

**atomic**

```
src/types/invoice.ts · src/services/invoices.ts · src/hooks/useInvoices.ts
src/components/atoms/Badge/index.tsx
src/components/molecules/InvoiceRow/index.tsx
src/components/organisms/InvoiceTable/index.tsx
src/components/templates/ListPageTemplate/index.tsx
src/pages/Invoices/index.tsx
```

## 2. Build order

1. Types / entity (+ unit test for invariants when logic exists).
2. Service / use case / repository (+ test with a mocked `fetch`).
3. Hook (+ test through a component or `renderHook`).
4. Presentational components (+ behaviour test).
5. Page with `h1`, default export; route in `src/App.tsx`; nav entry in `@const/navigation`; smoke test in `__tests__/pages/`.
6. `npm run arch:check` after each layer; `npm run check` at the end; `CHANGELOG.md` entry.

## 3. Conventions that apply

- Services return typed results and throw typed errors; hooks expose `{ data, error, isLoading, refetch }`.
- Mock data lives in the test, not in `src/` (except deliberate fixtures under `@const`).
- Keep the public surface tiny: export only what the page needs.
