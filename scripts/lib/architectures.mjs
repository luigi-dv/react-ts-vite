// Architecture catalogue.
//
// Every architecture is data: where each *role* (components, pages, hooks,
// services, …) lives, which extra layers exist, and which layer may import
// from which. The CLI, the import-rule checker, the generated folder READMEs
// and the `.agent` rules are all rendered from this single description, so the
// structure, the tooling and the instructions given to AI agents can never
// disagree.

/** Roles every architecture must place somewhere. Aliases are `@<role>`. */
export const ROLES = [
  'components',
  'pages',
  'hooks',
  'services',
  'types',
  'const',
  'utils',
  'assets',
]

/** Files directly under src/ (main.tsx, App.tsx, index.css) form the composition root. */
export const ROOT_LAYER = 'root'

export const ROLE_DOCS = {
  components:
    'Reusable, presentational UI. Receives data through props and never talks to services directly.',
  pages: 'Route-level screens. Compose UI, read data through hooks and own page state.',
  hooks: 'Stateful logic and data access (`useSomething`). The bridge between UI and services.',
  services: 'Side effects: API clients, storage, analytics. Framework-agnostic — no React here.',
  types: 'Shared TypeScript types and interfaces.',
  const: 'Constants and configuration: navigation, routes, feature flags, environment access.',
  utils: 'Pure, framework-agnostic helpers. No side effects.',
  assets: 'Static assets imported by code: images, fonts, SVG.',
}

const classicLayers = [
  layer('pages', 'src/pages', ROLE_DOCS.pages, [
    'pages',
    'components',
    'hooks',
    'services',
    'types',
    'const',
    'utils',
    'assets',
  ]),
  layer('components', 'src/components', ROLE_DOCS.components, [
    'components',
    'hooks',
    'types',
    'const',
    'utils',
    'assets',
  ]),
  layer('hooks', 'src/hooks', ROLE_DOCS.hooks, ['hooks', 'services', 'types', 'const', 'utils']),
  layer('services', 'src/services', ROLE_DOCS.services, ['services', 'types', 'const', 'utils']),
  layer('utils', 'src/utils', ROLE_DOCS.utils, ['utils', 'types', 'const']),
  layer('const', 'src/const', ROLE_DOCS.const, ['const', 'types']),
  layer('types', 'src/types', ROLE_DOCS.types, ['types']),
  layer('assets', 'src/assets', ROLE_DOCS.assets, []),
]

export const ARCHITECTURES = [
  {
    id: 'classic',
    title: 'Classic',
    subtitle: 'layered by type',
    tagline: 'Folders by technical role: components, hooks, services, pages.',
    description:
      'The simplest mental model. Code is grouped by what it *is* (a component, a hook, a service) rather than by what it does. Zero ceremony, instantly familiar to every React developer.',
    bestFor: [
      'Small and medium apps',
      'Prototypes and MVPs',
      'Teams new to front-end architecture',
    ],
    tradeoffs: [
      'Folders grow wide as features multiply',
      'Code for one feature is spread across several folders',
    ],
    roles: {
      components: 'src/components',
      pages: 'src/pages',
      hooks: 'src/hooks',
      services: 'src/services',
      types: 'src/types',
      const: 'src/const',
      utils: 'src/utils',
      assets: 'src/assets',
    },
    extraAliases: {},
    layers: classicLayers,
    folders: {},
    principles: [
      'Dependencies flow downwards: pages → components → hooks → services → utils/const/types.',
      'Components never import services; data access lives in hooks.',
      'Every folder exposes an `index.ts` barrel when it has more than one public module.',
    ],
  },
  {
    id: 'feature',
    title: 'Feature-based',
    subtitle: 'vertical slices',
    tagline: 'One folder per business capability, plus a shared kit.',
    description:
      'Code is grouped by what it *does*. Each feature (auth, billing, search…) owns its components, hooks, api and types and exposes a small public API through `index.ts`. Everything without business meaning lives in `shared/`.',
    bestFor: [
      'Products with several distinct capabilities',
      'Teams that split work by feature',
      'Codebases that need to scale without a rewrite',
    ],
    tradeoffs: [
      'Requires discipline about what is "shared"',
      'Cross-feature needs must go through public APIs',
    ],
    roles: {
      components: 'src/shared/components',
      pages: 'src/pages',
      hooks: 'src/shared/hooks',
      services: 'src/shared/services',
      types: 'src/shared/types',
      const: 'src/shared/const',
      utils: 'src/shared/utils',
      assets: 'src/shared/assets',
    },
    extraAliases: { app: 'src/app', features: 'src/features', shared: 'src/shared' },
    layers: [
      layer(
        'app',
        'src/app',
        'Application shell: providers, router, global layout and bootstrapping. May import anything.',
        ['*'],
      ),
      layer('pages', 'src/pages', 'Route-level screens that compose features and shared UI.', [
        'pages',
        'features',
        'shared',
      ]),
      layer(
        'features',
        'src/features',
        'One folder per business capability. A feature owns its `components/`, `hooks/`, `api/` and `types.ts` and exposes a public API through `index.ts`.',
        ['features', 'shared'],
        { sliced: true, crossSlice: 'public-api' },
      ),
      layer(
        'shared',
        'src/shared',
        'Code with no business meaning: UI kit, hooks, services, utils, types, assets and config.',
        ['shared'],
      ),
    ],
    folders: {
      'src/features/example':
        'A sample slice. Rename or delete it. Keep `index.ts` as the only entry point.',
    },
    principles: [
      'A feature imports other features only through their `index.ts` public API.',
      '`shared/` knows nothing about features; features know nothing about pages.',
      'Promote code to `shared/` only once two features need it.',
    ],
  },
  {
    id: 'fsd',
    title: 'Feature-Sliced Design',
    subtitle: 'app · pages · widgets · features · entities · shared',
    tagline: 'The standardised layer/slice/segment methodology for front-end projects.',
    description:
      'Layers are ordered from the most generic (`shared`) to the most specific (`app`). A layer may only import from layers *below* it, and slices on the same layer never import each other. Each slice is split into segments (`ui`, `model`, `api`, `lib`, `config`).',
    bestFor: [
      'Medium to large products',
      'Teams that want an industry-standard structure',
      'Codebases with many reusable business entities',
    ],
    tradeoffs: ['Steeper learning curve', 'More folders for very small apps'],
    roles: {
      components: 'src/shared/ui',
      pages: 'src/pages',
      hooks: 'src/shared/hooks',
      services: 'src/shared/api',
      types: 'src/shared/types',
      const: 'src/shared/config',
      utils: 'src/shared/lib',
      assets: 'src/shared/assets',
    },
    extraAliases: {
      app: 'src/app',
      widgets: 'src/widgets',
      features: 'src/features',
      entities: 'src/entities',
      shared: 'src/shared',
    },
    layers: [
      layer(
        'app',
        'src/app',
        'App-wide setup: providers, routing, global styles, analytics bootstrapping.',
        ['*'],
      ),
      layer(
        'pages',
        'src/pages',
        'Full pages or large parts of pages in nested routing.',
        ['widgets', 'features', 'entities', 'shared'],
        { sliced: true, crossSlice: 'forbid' },
      ),
      layer(
        'widgets',
        'src/widgets',
        'Large self-contained blocks of UI that deliver a complete use case (header, feed, sidebar).',
        ['features', 'entities', 'shared'],
        { sliced: true, crossSlice: 'forbid' },
      ),
      layer(
        'features',
        'src/features',
        'Reused implementations of product features: actions that bring business value to the user.',
        ['entities', 'shared'],
        { sliced: true, crossSlice: 'forbid' },
      ),
      layer(
        'entities',
        'src/entities',
        'Business entities the project works with (user, product, order).',
        ['shared'],
        { sliced: true, crossSlice: 'forbid' },
      ),
      layer(
        'shared',
        'src/shared',
        'Reusable functionality detached from the business: `ui`, `api`, `lib`, `config`, `types`, `assets`.',
        ['shared'],
      ),
    ],
    folders: {},
    principles: [
      'Import only from lower layers: app → pages → widgets → features → entities → shared.',
      'Slices on the same layer are isolated; share through a lower layer instead.',
      'Every slice exposes a public API (`index.ts`); import slices, never their internals.',
    ],
  },
  {
    id: 'clean',
    title: 'Clean Architecture',
    subtitle: 'hexagonal / ports & adapters',
    tagline: 'Business rules at the centre, frameworks at the edges.',
    description:
      'Dependencies point inwards. `domain` holds entities and business rules with zero dependencies; `application` orchestrates use cases through ports (interfaces); `infrastructure` implements those ports (HTTP, storage); `presentation` renders with React. The composition root (`src/app`, `main.tsx`) wires everything together.',
    bestFor: [
      'Long-lived products with rich business logic',
      'Teams that test business rules without a browser',
      'Apps that must swap infrastructure (APIs, storage) freely',
    ],
    tradeoffs: [
      'More files and indirection for simple CRUD screens',
      'Requires explicit dependency wiring',
    ],
    roles: {
      components: 'src/presentation/components',
      pages: 'src/presentation/pages',
      hooks: 'src/presentation/hooks',
      services: 'src/infrastructure/api',
      types: 'src/shared/types',
      const: 'src/shared/const',
      utils: 'src/shared/utils',
      assets: 'src/presentation/assets',
    },
    extraAliases: {
      app: 'src/app',
      domain: 'src/domain',
      application: 'src/application',
      infrastructure: 'src/infrastructure',
      presentation: 'src/presentation',
      shared: 'src/shared',
    },
    layers: [
      layer(
        'app',
        'src/app',
        'Composition root: builds infrastructure adapters, injects them into use cases and provides them to the UI. May import anything.',
        ['*'],
      ),
      layer(
        'domain',
        'src/domain',
        'Entities, value objects and business rules. Pure TypeScript with no framework or I/O dependencies.',
        ['domain', 'shared'],
      ),
      layer(
        'application',
        'src/application',
        'Use cases and the ports (interfaces) they need. Depends only on the domain.',
        ['application', 'domain', 'shared'],
      ),
      layer(
        'infrastructure',
        'src/infrastructure',
        'Adapters that implement application ports: HTTP clients, storage, third-party SDKs.',
        ['infrastructure', 'application', 'domain', 'shared'],
      ),
      layer(
        'presentation',
        'src/presentation',
        'React: pages, components, hooks and layouts. Talks to use cases, never to infrastructure directly.',
        ['presentation', 'application', 'domain', 'shared'],
      ),
      layer(
        'shared',
        'src/shared',
        'Shared kernel: cross-cutting types, constants and pure utilities.',
        ['shared'],
      ),
    ],
    folders: {
      'src/domain/entities': 'Business objects and their invariants.',
      'src/domain/repositories': 'Repository interfaces owned by the domain.',
      'src/application/use-cases': 'One file per use case (`CreateOrder.ts`).',
      'src/application/ports': 'Interfaces the use cases need from the outside world.',
      'src/infrastructure/api': 'HTTP clients and API adapters.',
      'src/infrastructure/repositories': 'Repository implementations.',
      'src/infrastructure/storage': 'Local/session storage adapters.',
      'src/presentation/layouts': 'Page layouts and shells.',
    },
    principles: [
      'Dependencies point inwards: presentation/infrastructure → application → domain.',
      'Presentation never imports infrastructure; the composition root (`src/app`) does the wiring.',
      'Business rules are testable without React or a network.',
    ],
  },
  {
    id: 'atomic',
    title: 'Atomic Design',
    subtitle: 'atoms · molecules · organisms · templates · pages',
    tagline: 'A design-system-first component hierarchy.',
    description:
      'Components are classified by complexity. Atoms (button, input) combine into molecules (search field), which combine into organisms (header), which are placed on templates (page skeletons) and finally pages. Perfect when the UI kit *is* the product.',
    bestFor: [
      'Design-system driven products',
      'Close designer/developer collaboration',
      'Component libraries and marketing sites',
    ],
    tradeoffs: [
      'Classification debates ("is this a molecule?")',
      'Business logic needs a home outside the hierarchy',
    ],
    roles: {
      components: 'src/components',
      pages: 'src/pages',
      hooks: 'src/hooks',
      services: 'src/services',
      types: 'src/types',
      const: 'src/const',
      utils: 'src/utils',
      assets: 'src/assets',
    },
    extraAliases: {
      atoms: 'src/components/atoms',
      molecules: 'src/components/molecules',
      organisms: 'src/components/organisms',
      templates: 'src/components/templates',
    },
    layers: [
      layer('pages', 'src/pages', 'Templates filled with real content and data.', [
        'pages',
        'templates',
        'organisms',
        'molecules',
        'atoms',
        'hooks',
        'services',
        'types',
        'const',
        'utils',
        'assets',
      ]),
      layer(
        'templates',
        'src/components/templates',
        'Page-level skeletons that arrange organisms. No real content.',
        [
          'templates',
          'organisms',
          'molecules',
          'atoms',
          'hooks',
          'types',
          'const',
          'utils',
          'assets',
        ],
      ),
      layer(
        'organisms',
        'src/components/organisms',
        'Complex, distinct sections of an interface (header, product card grid).',
        ['organisms', 'molecules', 'atoms', 'hooks', 'types', 'const', 'utils', 'assets'],
      ),
      layer(
        'molecules',
        'src/components/molecules',
        'Small groups of atoms working together (search field, form row).',
        ['molecules', 'atoms', 'hooks', 'types', 'const', 'utils', 'assets'],
      ),
      layer(
        'atoms',
        'src/components/atoms',
        'The smallest building blocks: button, input, label, icon.',
        ['atoms', 'types', 'const', 'utils', 'assets'],
      ),
      layer(
        'components',
        'src/components',
        'Uncategorised components. Everything here should move into atoms, molecules, organisms or templates.',
        [
          'components',
          'organisms',
          'molecules',
          'atoms',
          'hooks',
          'types',
          'const',
          'utils',
          'assets',
        ],
        { warnUncategorized: true },
      ),
      layer('hooks', 'src/hooks', ROLE_DOCS.hooks, [
        'hooks',
        'services',
        'types',
        'const',
        'utils',
      ]),
      layer('services', 'src/services', ROLE_DOCS.services, [
        'services',
        'types',
        'const',
        'utils',
      ]),
      layer('utils', 'src/utils', ROLE_DOCS.utils, ['utils', 'types', 'const']),
      layer('const', 'src/const', ROLE_DOCS.const, ['const', 'types']),
      layer('types', 'src/types', ROLE_DOCS.types, ['types']),
      layer('assets', 'src/assets', ROLE_DOCS.assets, []),
    ],
    folders: {},
    principles: [
      'Compose upwards only: atoms → molecules → organisms → templates → pages.',
      'Atoms are stateless and themeable; business logic enters at the organism level or above.',
      'Keep `src/components/` root empty: every component belongs to a level.',
    ],
  },
]

function layer(id, path, purpose, mayImport, extra = {}) {
  return {
    id,
    path,
    purpose,
    mayImport,
    sliced: false,
    crossSlice: 'allow',
    warnUncategorized: false,
    ...extra,
  }
}

export const ARCHITECTURE_IDS = ARCHITECTURES.map((a) => a.id)

export function getArchitecture(id) {
  const arch = ARCHITECTURES.find((a) => a.id === id)
  if (!arch) {
    throw new Error(`Unknown architecture "${id}". Available: ${ARCHITECTURE_IDS.join(', ')}.`)
  }
  return arch
}

/** `{ '@': './src', '@components': './src/components', ... }` sorted, `@` first. */
export function aliasesFor(arch) {
  const entries = new Map([['@', './src']])
  for (const role of ROLES) entries.set(`@${role}`, `./${arch.roles[role]}`)
  for (const [name, target] of Object.entries(arch.extraAliases))
    entries.set(`@${name}`, `./${target}`)
  const sorted = [...entries.entries()].sort(([a], [b]) =>
    a === '@' ? -1 : b === '@' ? 1 : a.localeCompare(b),
  )
  return Object.fromEntries(sorted)
}

/** Every directory the architecture expects to exist (layers, roles and documented sub-folders). */
export function scaffoldDirs(arch) {
  const dirs = new Set()
  for (const l of arch.layers) dirs.add(l.path)
  for (const p of Object.values(arch.roles)) dirs.add(p)
  for (const p of Object.keys(arch.folders)) dirs.add(p)
  return [...dirs].sort()
}

/**
 * Resolve the layer (and slice) that owns a project-relative posix path.
 * Longest matching layer path wins, so `src/components/atoms/x` is `atoms`
 * even though `src/components` is also a layer.
 * @returns {{ id: string, slice: string|null, layer: object|null }}
 */
export function layerOf(relPath, arch) {
  let best = null
  for (const l of arch.layers) {
    if (relPath === l.path || relPath.startsWith(`${l.path}/`)) {
      if (!best || l.path.length > best.path.length) best = l
    }
  }
  if (!best) {
    // Files directly under src/ (App.tsx, main.tsx, index.css) are the composition root.
    if (/^src\/[^/]+$/.test(relPath)) return { id: ROOT_LAYER, slice: null, layer: null }
    return { id: null, slice: null, layer: null }
  }
  let slice = null
  if (best.sliced) {
    const rest = relPath.slice(best.path.length + 1)
    slice = rest.split('/')[0] || null
  }
  return { id: best.id, slice, layer: best }
}

export function layerById(arch, id) {
  return arch.layers.find((l) => l.id === id) ?? null
}

/* ----------------------------------------------------------- documentation */

const GENERATED_MARK = '<!-- rtv:generated -->'

export function isGeneratedDoc(content) {
  return content.includes(GENERATED_MARK)
}

/** README content for a layer folder. */
export function renderLayerReadme(arch, l) {
  const allowed = l.mayImport.includes('*')
    ? 'anything — this is the composition root'
    : l.mayImport.length
      ? l.mayImport.map((id) => `\`${id}\``).join(', ')
      : 'nothing — this layer has no code dependencies'
  const forbidden = l.mayImport.includes('*')
    ? []
    : arch.layers
        .filter((other) => other.id !== l.id && !l.mayImport.includes(other.id))
        .map((other) => `\`${other.id}\``)
  const subFolders = [
    ...ROLES.filter((role) => arch.roles[role].startsWith(`${l.path}/`)).map((role) => [
      arch.roles[role],
      ROLE_DOCS[role],
    ]),
    ...Object.entries(arch.folders).filter(([p]) => p.startsWith(`${l.path}/`)),
  ].sort(([a], [b]) => a.localeCompare(b))
  const alias = Object.entries(aliasesFor(arch)).find(([, target]) => target === `./${l.path}`)?.[0]

  const lines = [
    GENERATED_MARK,
    '',
    `# \`${l.path}\` — ${l.id}`,
    '',
    `> Architecture: **${arch.title}** (\`${arch.id}\`). Generated by \`npm run arch\`; edit the architecture catalogue in \`scripts/lib/architectures.mjs\` instead of this file.`,
    '',
    l.purpose,
    '',
    '## Import rules',
    '',
    `- **May import from:** ${allowed}.`,
  ]
  if (forbidden.length) lines.push(`- **Must not import from:** ${forbidden.join(', ')}.`)
  if (l.sliced) {
    lines.push(
      l.crossSlice === 'forbid'
        ? '- **Slices are isolated:** a slice never imports a sibling slice on this layer.'
        : '- **Cross-slice imports go through the public API:** import `@' +
            l.id +
            '/<slice>`, never `@' +
            l.id +
            '/<slice>/internals`.',
    )
  }
  if (alias) lines.push(`- **Alias:** \`${alias}\` → \`${l.path}\`.`)
  lines.push('', 'Run `npm run arch:check` to verify these rules across the project.')
  if (subFolders.length) {
    lines.push('', '## Folders', '')
    for (const [p, description] of subFolders)
      lines.push(`- \`${p.slice(l.path.length + 1)}/\` — ${description}`)
  }
  lines.push('')
  return lines.join('\n')
}

/** ASCII tree for a list of posix paths. */
export function renderTree(paths, rootLabel = 'src') {
  const tree = {}
  for (const p of paths) {
    const parts = p.split('/').filter((part) => part && part !== rootLabel)
    let node = tree
    for (const part of parts) node = node[part] ??= {}
  }
  const lines = [`${rootLabel}/`]
  const walk = (node, prefix) => {
    const keys = Object.keys(node).sort()
    keys.forEach((key, i) => {
      const last = i === keys.length - 1
      lines.push(`${prefix}${last ? '└── ' : '├── '}${key}/`)
      walk(node[key], `${prefix}${last ? '    ' : '│   '}`)
    })
  }
  walk(tree, '')
  return lines.join('\n')
}

/** Markdown description of an architecture, used by docs and agent rules. */
export function describeArchitecture(arch, { heading = '##' } = {}) {
  const aliases = aliasesFor(arch)
  const lines = [
    `${heading} ${arch.title} (\`${arch.id}\`) — ${arch.subtitle}`,
    '',
    arch.description,
    '',
    '```',
    renderTree(scaffoldDirs(arch)),
    '```',
    '',
    '| Layer | Path | Purpose | May import |',
    '| --- | --- | --- | --- |',
  ]
  for (const l of arch.layers) {
    const may = l.mayImport.includes('*')
      ? 'anything'
      : l.mayImport.map((id) => `\`${id}\``).join(', ') || '—'
    lines.push(`| \`${l.id}\` | \`${l.path}\` | ${l.purpose.replace(/\|/g, '\\|')} | ${may} |`)
  }
  lines.push('', '**Aliases**', '')
  for (const [name, target] of Object.entries(aliases))
    lines.push(`- \`${name}\` → \`${target.replace(/^\.\//, '')}\``)
  lines.push('', '**Principles**', '')
  for (const p of arch.principles) lines.push(`- ${p}`)
  lines.push(
    '',
    '**Best for:** ' + arch.bestFor.join(' · '),
    '',
    '**Trade-offs:** ' + arch.tradeoffs.join(' · '),
    '',
  )
  return lines.join('\n')
}
