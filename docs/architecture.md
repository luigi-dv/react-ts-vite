<!-- rtv:generated -->
# Architectures

> Generated from the catalogue in `scripts/lib/architectures.mjs` by `npm run agent:sync`. Active architecture of this repository: **classic**.

An architecture decides **where each role lives** (components, pages, hooks, services, types, const, utils, assets), which **extra layers** exist and **which layer may import which**. Application code imports through role aliases (`@components/Button`), so switching architecture moves folders without rewriting imports.

```bash
npm run arch -- list                 # catalogue
npm run arch -- current              # layers, aliases and rules of the active one
npm run arch -- apply <id> --dry-run # preview a switch
npm run arch -- apply <id>           # move role folders, rewrite aliases, regenerate docs
npm run arch:check                   # verify import direction (part of npm run check)
```

## Choosing

| Architecture | Pick it when | Watch out for |
| --- | --- | --- |
| [`classic`](#classic) — Classic | Small and medium apps; Prototypes and MVPs; Teams new to front-end architecture | Folders grow wide as features multiply; Code for one feature is spread across several folders |
| [`feature`](#feature) — Feature-based | Products with several distinct capabilities; Teams that split work by feature; Codebases that need to scale without a rewrite | Requires discipline about what is "shared"; Cross-feature needs must go through public APIs |
| [`fsd`](#fsd) — Feature-Sliced Design | Medium to large products; Teams that want an industry-standard structure; Codebases with many reusable business entities | Steeper learning curve; More folders for very small apps |
| [`clean`](#clean) — Clean Architecture | Long-lived products with rich business logic; Teams that test business rules without a browser; Apps that must swap infrastructure (APIs, storage) freely | More files and indirection for simple CRUD screens; Requires explicit dependency wiring |
| [`atomic`](#atomic) — Atomic Design | Design-system driven products; Close designer/developer collaboration; Component libraries and marketing sites | Classification debates ("is this a molecule?"); Business logic needs a home outside the hierarchy |

## How the checker works

Every module under `src/` is scanned for `import`/`export … from`, `import()` and `require()` specifiers. Aliases and relative paths are resolved to project paths and mapped to the **longest matching layer path**. A file directly under `src/` (`main.tsx`, `App.tsx`) is the composition root and may import anything. For each import the checker verifies the importing layer's `mayImport` list, slice isolation (`fsd`) or public-API rules (`feature`), and reports violations with file and line. Exceptions go into `rules.allow` in `rtv.config.json` as `"from>to"`; a single import can be excluded with a trailing `// rtv-ignore` comment.

<a id="classic"></a>

## Classic (`classic`) — layered by type

The simplest mental model. Code is grouped by what it *is* (a component, a hook, a service) rather than by what it does. Zero ceremony, instantly familiar to every React developer.

```
src/
├── assets/
├── components/
├── const/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `pages` | `src/pages` | Route-level screens. Compose UI, read data through hooks and own page state. | `pages`, `components`, `hooks`, `services`, `types`, `const`, `utils`, `assets` |
| `components` | `src/components` | Reusable, presentational UI. Receives data through props and never talks to services directly. | `components`, `hooks`, `types`, `const`, `utils`, `assets` |
| `hooks` | `src/hooks` | Stateful logic and data access (`useSomething`). The bridge between UI and services. | `hooks`, `services`, `types`, `const`, `utils` |
| `services` | `src/services` | Side effects: API clients, storage, analytics. Framework-agnostic — no React here. | `services`, `types`, `const`, `utils` |
| `utils` | `src/utils` | Pure, framework-agnostic helpers. No side effects. | `utils`, `types`, `const` |
| `const` | `src/const` | Constants and configuration: navigation, routes, feature flags, environment access. | `const`, `types` |
| `types` | `src/types` | Shared TypeScript types and interfaces. | `types` |
| `assets` | `src/assets` | Static assets imported by code: images, fonts, SVG. | — |

**Aliases**

- `@` → `src`
- `@assets` → `src/assets`
- `@components` → `src/components`
- `@const` → `src/const`
- `@hooks` → `src/hooks`
- `@pages` → `src/pages`
- `@services` → `src/services`
- `@types` → `src/types`
- `@utils` → `src/utils`

**Principles**

- Dependencies flow downwards: pages → components → hooks → services → utils/const/types.
- Components never import services; data access lives in hooks.
- Every folder exposes an `index.ts` barrel when it has more than one public module.

**Best for:** Small and medium apps · Prototypes and MVPs · Teams new to front-end architecture

**Trade-offs:** Folders grow wide as features multiply · Code for one feature is spread across several folders

<a id="feature"></a>

## Feature-based (`feature`) — vertical slices

Code is grouped by what it *does*. Each feature (auth, billing, search…) owns its components, hooks, api and types and exposes a small public API through `index.ts`. Everything without business meaning lives in `shared/`.

```
src/
├── app/
├── features/
│   └── example/
├── pages/
└── shared/
    ├── assets/
    ├── components/
    ├── const/
    ├── hooks/
    ├── services/
    ├── types/
    └── utils/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `app` | `src/app` | Application shell: providers, router, global layout and bootstrapping. May import anything. | anything |
| `pages` | `src/pages` | Route-level screens that compose features and shared UI. | `pages`, `features`, `shared` |
| `features` | `src/features` | One folder per business capability. A feature owns its `components/`, `hooks/`, `api/` and `types.ts` and exposes a public API through `index.ts`. | `features`, `shared` |
| `shared` | `src/shared` | Code with no business meaning: UI kit, hooks, services, utils, types, assets and config. | `shared` |

**Aliases**

- `@` → `src`
- `@app` → `src/app`
- `@assets` → `src/shared/assets`
- `@components` → `src/shared/components`
- `@const` → `src/shared/const`
- `@features` → `src/features`
- `@hooks` → `src/shared/hooks`
- `@pages` → `src/pages`
- `@services` → `src/shared/services`
- `@shared` → `src/shared`
- `@types` → `src/shared/types`
- `@utils` → `src/shared/utils`

**Principles**

- A feature imports other features only through their `index.ts` public API.
- `shared/` knows nothing about features; features know nothing about pages.
- Promote code to `shared/` only once two features need it.

**Best for:** Products with several distinct capabilities · Teams that split work by feature · Codebases that need to scale without a rewrite

**Trade-offs:** Requires discipline about what is "shared" · Cross-feature needs must go through public APIs

<a id="fsd"></a>

## Feature-Sliced Design (`fsd`) — app · pages · widgets · features · entities · shared

Layers are ordered from the most generic (`shared`) to the most specific (`app`). A layer may only import from layers *below* it, and slices on the same layer never import each other. Each slice is split into segments (`ui`, `model`, `api`, `lib`, `config`).

```
src/
├── app/
├── entities/
├── features/
├── pages/
├── shared/
│   ├── api/
│   ├── assets/
│   ├── config/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── ui/
└── widgets/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `app` | `src/app` | App-wide setup: providers, routing, global styles, analytics bootstrapping. | anything |
| `pages` | `src/pages` | Full pages or large parts of pages in nested routing. | `widgets`, `features`, `entities`, `shared` |
| `widgets` | `src/widgets` | Large self-contained blocks of UI that deliver a complete use case (header, feed, sidebar). | `features`, `entities`, `shared` |
| `features` | `src/features` | Reused implementations of product features: actions that bring business value to the user. | `entities`, `shared` |
| `entities` | `src/entities` | Business entities the project works with (user, product, order). | `shared` |
| `shared` | `src/shared` | Reusable functionality detached from the business: `ui`, `api`, `lib`, `config`, `types`, `assets`. | `shared` |

**Aliases**

- `@` → `src`
- `@app` → `src/app`
- `@assets` → `src/shared/assets`
- `@components` → `src/shared/ui`
- `@const` → `src/shared/config`
- `@entities` → `src/entities`
- `@features` → `src/features`
- `@hooks` → `src/shared/hooks`
- `@pages` → `src/pages`
- `@services` → `src/shared/api`
- `@shared` → `src/shared`
- `@types` → `src/shared/types`
- `@utils` → `src/shared/lib`
- `@widgets` → `src/widgets`

**Principles**

- Import only from lower layers: app → pages → widgets → features → entities → shared.
- Slices on the same layer are isolated; share through a lower layer instead.
- Every slice exposes a public API (`index.ts`); import slices, never their internals.

**Best for:** Medium to large products · Teams that want an industry-standard structure · Codebases with many reusable business entities

**Trade-offs:** Steeper learning curve · More folders for very small apps

<a id="clean"></a>

## Clean Architecture (`clean`) — hexagonal / ports & adapters

Dependencies point inwards. `domain` holds entities and business rules with zero dependencies; `application` orchestrates use cases through ports (interfaces); `infrastructure` implements those ports (HTTP, storage); `presentation` renders with React. The composition root (`src/app`, `main.tsx`) wires everything together.

```
src/
├── app/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── repositories/
├── infrastructure/
│   ├── api/
│   ├── repositories/
│   └── storage/
├── presentation/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   └── pages/
└── shared/
    ├── const/
    ├── types/
    └── utils/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `app` | `src/app` | Composition root: builds infrastructure adapters, injects them into use cases and provides them to the UI. May import anything. | anything |
| `domain` | `src/domain` | Entities, value objects and business rules. Pure TypeScript with no framework or I/O dependencies. | `domain`, `shared` |
| `application` | `src/application` | Use cases and the ports (interfaces) they need. Depends only on the domain. | `application`, `domain`, `shared` |
| `infrastructure` | `src/infrastructure` | Adapters that implement application ports: HTTP clients, storage, third-party SDKs. | `infrastructure`, `application`, `domain`, `shared` |
| `presentation` | `src/presentation` | React: pages, components, hooks and layouts. Talks to use cases, never to infrastructure directly. | `presentation`, `application`, `domain`, `shared` |
| `shared` | `src/shared` | Shared kernel: cross-cutting types, constants and pure utilities. | `shared` |

**Aliases**

- `@` → `src`
- `@app` → `src/app`
- `@application` → `src/application`
- `@assets` → `src/presentation/assets`
- `@components` → `src/presentation/components`
- `@const` → `src/shared/const`
- `@domain` → `src/domain`
- `@hooks` → `src/presentation/hooks`
- `@infrastructure` → `src/infrastructure`
- `@pages` → `src/presentation/pages`
- `@presentation` → `src/presentation`
- `@services` → `src/infrastructure/api`
- `@shared` → `src/shared`
- `@types` → `src/shared/types`
- `@utils` → `src/shared/utils`

**Principles**

- Dependencies point inwards: presentation/infrastructure → application → domain.
- Presentation never imports infrastructure; the composition root (`src/app`) does the wiring.
- Business rules are testable without React or a network.

**Best for:** Long-lived products with rich business logic · Teams that test business rules without a browser · Apps that must swap infrastructure (APIs, storage) freely

**Trade-offs:** More files and indirection for simple CRUD screens · Requires explicit dependency wiring

<a id="atomic"></a>

## Atomic Design (`atomic`) — atoms · molecules · organisms · templates · pages

Components are classified by complexity. Atoms (button, input) combine into molecules (search field), which combine into organisms (header), which are placed on templates (page skeletons) and finally pages. Perfect when the UI kit *is* the product.

```
src/
├── assets/
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── const/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/
```

| Layer | Path | Purpose | May import |
| --- | --- | --- | --- |
| `pages` | `src/pages` | Templates filled with real content and data. | `pages`, `templates`, `organisms`, `molecules`, `atoms`, `hooks`, `services`, `types`, `const`, `utils`, `assets` |
| `templates` | `src/components/templates` | Page-level skeletons that arrange organisms. No real content. | `templates`, `organisms`, `molecules`, `atoms`, `hooks`, `types`, `const`, `utils`, `assets` |
| `organisms` | `src/components/organisms` | Complex, distinct sections of an interface (header, product card grid). | `organisms`, `molecules`, `atoms`, `hooks`, `types`, `const`, `utils`, `assets` |
| `molecules` | `src/components/molecules` | Small groups of atoms working together (search field, form row). | `molecules`, `atoms`, `hooks`, `types`, `const`, `utils`, `assets` |
| `atoms` | `src/components/atoms` | The smallest building blocks: button, input, label, icon. | `atoms`, `types`, `const`, `utils`, `assets` |
| `components` | `src/components` | Uncategorised components. Everything here should move into atoms, molecules, organisms or templates. | `components`, `organisms`, `molecules`, `atoms`, `hooks`, `types`, `const`, `utils`, `assets` |
| `hooks` | `src/hooks` | Stateful logic and data access (`useSomething`). The bridge between UI and services. | `hooks`, `services`, `types`, `const`, `utils` |
| `services` | `src/services` | Side effects: API clients, storage, analytics. Framework-agnostic — no React here. | `services`, `types`, `const`, `utils` |
| `utils` | `src/utils` | Pure, framework-agnostic helpers. No side effects. | `utils`, `types`, `const` |
| `const` | `src/const` | Constants and configuration: navigation, routes, feature flags, environment access. | `const`, `types` |
| `types` | `src/types` | Shared TypeScript types and interfaces. | `types` |
| `assets` | `src/assets` | Static assets imported by code: images, fonts, SVG. | — |

**Aliases**

- `@` → `src`
- `@assets` → `src/assets`
- `@atoms` → `src/components/atoms`
- `@components` → `src/components`
- `@const` → `src/const`
- `@hooks` → `src/hooks`
- `@molecules` → `src/components/molecules`
- `@organisms` → `src/components/organisms`
- `@pages` → `src/pages`
- `@services` → `src/services`
- `@templates` → `src/components/templates`
- `@types` → `src/types`
- `@utils` → `src/utils`

**Principles**

- Compose upwards only: atoms → molecules → organisms → templates → pages.
- Atoms are stateless and themeable; business logic enters at the organism level or above.
- Keep `src/components/` root empty: every component belongs to a level.

**Best for:** Design-system driven products · Close designer/developer collaboration · Component libraries and marketing sites

**Trade-offs:** Classification debates ("is this a molecule?") · Business logic needs a home outside the hierarchy

## Adding an architecture

Architectures are plain data: add an entry to `ARCHITECTURES` in `scripts/lib/architectures.mjs` with `roles` (one path per role), `extraAliases`, `layers` (each with `path`, `purpose`, `mayImport`, optional `sliced`/`crossSlice`), `folders` and `principles`. Run `npm run test:run` (catalogue integrity tests) and `npm run agent:sync` (this file and the agent rule regenerate).
