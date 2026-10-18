// Design-template registry.
//
// A design template is a self-contained page (Tailwind + Headless UI +
// Heroicons) stored under `templates/design/<id>/` with a `template.json`
// manifest and a `files/` folder. Applying a template copies `files/` into the
// pages folder of the active architecture and adds a smoke test, so every page
// in the project starts out tested.
import fs from 'node:fs'
import path from 'node:path'

import {
  copyDir,
  exists,
  isDir,
  listFiles,
  readJson,
  removeDir,
  removeEmptyDirs,
  writeText,
} from './fs.mjs'
import { PACKAGE_ROOT, relativeTo } from './paths.mjs'

export const TEMPLATES_SUBDIR = 'templates/design'
export const APP_MARK = '// rtv:generated'
export const TESTS_DIR = '__tests__'

/** Templates shipped with the project win over the ones bundled in the package. */
export function templatesDir(root) {
  const local = path.join(root, TEMPLATES_SUBDIR)
  return isDir(local) ? local : path.join(PACKAGE_ROOT, TEMPLATES_SUBDIR)
}

/** @returns {object[]} manifests sorted by `order`, then id */
export function listTemplates(root) {
  const dir = templatesDir(root)
  if (!isDir(dir)) return []
  const templates = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifestFile = path.join(dir, entry.name, 'template.json')
    if (!exists(manifestFile)) continue
    const manifest = readJson(manifestFile)
    const filesDir = path.join(dir, entry.name, 'files')
    templates.push({
      ...manifest,
      id: manifest.id ?? entry.name,
      dir: path.join(dir, entry.name),
      files: listFiles(filesDir).map((f) => relativeTo(filesDir, f)),
    })
  }
  return templates.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.id.localeCompare(b.id))
}

export function getTemplate(root, id) {
  const template = listTemplates(root).find((t) => t.id === id)
  if (!template) {
    const ids = listTemplates(root).map((t) => t.id)
    throw new Error(`Unknown design template "${id}". Available: ${ids.join(', ') || 'none'}.`)
  }
  return template
}

export function pageDir(root, arch, template) {
  return path.join(root, arch.roles.pages, template.page)
}

export function smokeTestFile(root, template) {
  return path.join(root, TESTS_DIR, 'pages', `${template.page}.test.tsx`)
}

/**
 * Copy the template into the pages folder and write its smoke test.
 * @returns {{ written: string[], pageDir: string, testFile: string }}
 */
export function applyTemplate({ root, arch, template, force = false }) {
  const target = pageDir(root, arch, template)
  const written = copyDir(path.join(template.dir, 'files'), target, { overwrite: force })
  const testFile = smokeTestFile(root, template)
  if (force || !exists(testFile)) {
    writeText(testFile, renderSmokeTest(template))
    written.push(testFile)
  }
  return { written, pageDir: target, testFile }
}

export function removeTemplate({ root, arch, template }) {
  const removed = []
  const target = pageDir(root, arch, template)
  if (exists(target)) {
    removeDir(target)
    removed.push(target)
  }
  const testFile = smokeTestFile(root, template)
  if (exists(testFile)) {
    fs.rmSync(testFile)
    removed.push(testFile)
    removeEmptyDirs(path.dirname(testFile), path.join(root, TESTS_DIR))
  }
  return removed
}

export function renderSmokeTest(template) {
  return `import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import ${template.page} from '@pages/${template.page}'

describe('<${template.page} />', () => {
  test('renders the page heading', () => {
    render(<${template.page} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(${JSON.stringify(template.heading)})
  })
})
`
}

/** Decide the route table: `/` goes to the template that claims it, else the first one. */
export function routeTable(templates) {
  const routes = []
  const used = new Set()
  const home =
    templates.find((t) => t.route === '/') ?? templates.find((t) => !t.fallback) ?? templates[0]
  for (const t of templates) {
    if (t.fallback) continue
    let route = t === home ? '/' : t.route
    // Two templates may claim the same route (e.g. two home pages): the later one gets a route from its page name.
    if (used.has(route)) route = `/${t.page.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`
    used.add(route)
    routes.push({ path: route, page: t.page })
  }
  const fallback = templates.find((t) => t.fallback)?.page ?? home?.page
  return { routes, fallback }
}

/** `src/App.tsx` for the applied templates: a dependency-free path switch. */
export function renderApp(templates) {
  const { routes, fallback } = routeTable(templates)
  const pages = [...new Set(templates.map((t) => t.page))].sort()
  const imports = pages.map((page) => `import ${page} from '@pages/${page}'`).join('\n')
  const entries = routes.map((r) => `  '${r.path}': ${r.page},`).join('\n')
  return `${APP_MARK} — by \`npm run templates\`. Edit freely; replace this path switch with a router when you need one.
import type { ComponentType } from 'react'

${imports}

const routes: Record<string, ComponentType> = {
${entries}
}

function currentPath(): string {
  const pathname = window.location.pathname.replace(/\\/+$/, '')
  return pathname === '' ? '/' : pathname
}

export default function App() {
  const Page = routes[currentPath()] ?? ${fallback}
  return <Page />
}
`
}

export function renderAppTest() {
  return `${APP_MARK}
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import App from '@/App'

describe('<App />', () => {
  test('renders the home page', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
`
}

/** `src/App.tsx` when no template is applied: the starter example if it still exists, else a placeholder. */
export function renderEmptyApp({ exampleExists }) {
  if (exampleExists) {
    return `${APP_MARK} — no design templates applied. Add pages with \`npm run templates -- add <id>\`.
import ExampleComponent from '@components/ExampleComponent'

export default function App() {
  return <ExampleComponent />
}
`
  }
  return `${APP_MARK} — no design templates applied. Add pages with \`npm run templates -- add <id>\`.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Hello from react-ts-vite</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a page with <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">npm run templates -- add dashboard</code>
        </p>
      </div>
    </main>
  )
}
`
}

/** The starter App (renders the example component) or a generated one may be replaced. */
export function isReplaceableApp(content) {
  return content.includes(APP_MARK) || content.includes('@components/ExampleComponent')
}

/**
 * Write App.tsx and its test for the given templates. Returns written files;
 * refuses to overwrite a hand-written App.tsx unless `force` is set.
 */
export function writeApp({ root, templates, force = false, arch }) {
  const appFile = path.join(root, 'src', 'App.tsx')
  const current = exists(appFile) ? fs.readFileSync(appFile, 'utf8') : ''
  if (current && !force && !isReplaceableApp(current)) {
    return { written: [], skipped: appFile }
  }
  if (templates.length === 0) {
    const exampleExists =
      Boolean(arch) && exists(path.join(root, arch.roles.components, 'ExampleComponent'))
    if (current && !current.includes(APP_MARK) && exampleExists && !force)
      return { written: [], skipped: null } // starter App is already right
    writeText(appFile, renderEmptyApp({ exampleExists }))
  } else {
    writeText(appFile, renderApp(templates))
  }
  const testFile = path.join(root, TESTS_DIR, 'App.test.tsx')
  const currentTest = exists(testFile) ? fs.readFileSync(testFile, 'utf8') : ''
  const written = [appFile]
  if (
    !currentTest ||
    force ||
    currentTest.includes(APP_MARK) ||
    currentTest.includes('Data to enrich')
  ) {
    writeText(testFile, renderAppTest())
    written.push(testFile)
  }
  return { written, skipped: null }
}

/** Remove the starter example component and its barrel export. */
export function removeExampleComponent(root, arch) {
  const removed = []
  const dir = path.join(root, arch.roles.components, 'ExampleComponent')
  if (exists(dir)) {
    removeDir(dir)
    removed.push(dir)
  }
  const barrel = path.join(root, arch.roles.components, 'index.ts')
  if (exists(barrel)) {
    const lines = fs
      .readFileSync(barrel, 'utf8')
      .split('\n')
      .filter((l) => !l.includes('./ExampleComponent'))
    const content = lines.join('\n').trim()
    writeText(
      barrel,
      content
        ? `${content}\n`
        : "// Re-export shared components here, e.g. `export * from './Button'`.\nexport {}\n",
    )
  }
  return removed
}
