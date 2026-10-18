import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { getArchitecture } from '../../scripts/lib/architectures.mjs'
import { findProjectRoot } from '../../scripts/lib/paths.mjs'
import {
  applyTemplate,
  isReplaceableApp,
  listTemplates,
  removeTemplate,
  renderApp,
  routeTable,
  writeApp,
} from '../../scripts/lib/templates.mjs'

const repoRoot = findProjectRoot()
const templates = listTemplates(repoRoot)
const roots = []

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe('design template catalogue', () => {
  test('ships five templates with complete manifests', () => {
    expect(templates.map((t) => t.id)).toEqual([
      'landing',
      'dashboard',
      'auth',
      'blank',
      'not-found',
    ])
    for (const t of templates) {
      expect(t.title).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.page).toMatch(/^[A-Z][A-Za-z]+$/)
      expect(t.route).toMatch(/^\//)
      expect(t.heading).toBeTruthy()
      expect(t.files).toContain('index.tsx')
    }
    expect(new Set(templates.map((t) => t.page)).size).toBe(templates.length)
  })

  test('routeTable gives the home route to the template that claims it and uses the fallback page', () => {
    const pick = (...ids) => ids.map((id) => templates.find((t) => t.id === id))
    expect(routeTable(pick('dashboard', 'landing', 'not-found'))).toEqual({
      routes: [
        { path: '/dashboard', page: 'Dashboard' },
        { path: '/', page: 'Landing' },
      ],
      fallback: 'NotFound',
    })
    expect(routeTable(pick('dashboard', 'auth'))).toEqual({
      routes: [
        { path: '/', page: 'Dashboard' },
        { path: '/login', page: 'Auth' },
      ],
      fallback: 'Dashboard',
    })
  })

  test('routeTable never emits duplicate routes', () => {
    const pick = (...ids) => ids.map((id) => templates.find((t) => t.id === id))
    expect(routeTable(pick('landing', 'blank'))).toEqual({
      routes: [
        { path: '/', page: 'Landing' },
        { path: '/home', page: 'Home' },
      ],
      fallback: 'Landing',
    })
  })

  test('renderApp produces a path switch over the applied pages', () => {
    const app = renderApp(templates.filter((t) => ['dashboard', 'not-found'].includes(t.id)))
    expect(app).toContain("import Dashboard from '@pages/Dashboard'")
    expect(app).toContain("import NotFound from '@pages/NotFound'")
    expect(app).toContain("'/': Dashboard,")
    expect(app).toContain('?? NotFound')
    expect(isReplaceableApp(app)).toBe(true)
    expect(isReplaceableApp('export default function App() { return <Custom /> }')).toBe(false)
  })
})

describe('applying templates', () => {
  test('copies files into the pages folder and writes a smoke test', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtv-tpl-'))
    roots.push(root)
    const arch = getArchitecture('clean')
    const dashboard = templates.find((t) => t.id === 'dashboard')

    const result = applyTemplate({ root, arch, template: dashboard })
    expect(fs.existsSync(path.join(root, 'src/presentation/pages/Dashboard/index.tsx'))).toBe(true)
    expect(
      fs.existsSync(path.join(root, 'src/presentation/pages/Dashboard/components/Sidebar.tsx')),
    ).toBe(true)
    expect(fs.readFileSync(result.testFile, 'utf8')).toContain(
      "import Dashboard from '@pages/Dashboard'",
    )

    // Re-applying never overwrites customised files unless forced.
    fs.writeFileSync(path.join(root, 'src/presentation/pages/Dashboard/index.tsx'), 'custom')
    applyTemplate({ root, arch, template: dashboard })
    expect(
      fs.readFileSync(path.join(root, 'src/presentation/pages/Dashboard/index.tsx'), 'utf8'),
    ).toBe('custom')
    applyTemplate({ root, arch, template: dashboard, force: true })
    expect(
      fs.readFileSync(path.join(root, 'src/presentation/pages/Dashboard/index.tsx'), 'utf8'),
    ).not.toBe('custom')

    const removed = removeTemplate({ root, arch, template: dashboard })
    expect(removed).toHaveLength(2)
    expect(fs.existsSync(path.join(root, 'src/presentation/pages/Dashboard'))).toBe(false)
    expect(fs.existsSync(path.join(root, '__tests__/pages'))).toBe(false)
  })

  test('writeApp keeps a hand-written App.tsx unless forced', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtv-app-'))
    roots.push(root)
    fs.mkdirSync(path.join(root, 'src'))
    fs.writeFileSync(
      path.join(root, 'src/App.tsx'),
      'export default function App() { return <Custom /> }',
    )
    const selected = templates.filter((t) => t.id === 'blank')
    expect(writeApp({ root, templates: selected }).skipped).toBe(path.join(root, 'src/App.tsx'))
    const forced = writeApp({ root, templates: selected, force: true })
    expect(forced.skipped).toBeNull()
    expect(forced.written.map((f) => path.relative(root, f))).toEqual([
      'src/App.tsx',
      path.join('__tests__', 'App.test.tsx'),
    ])
  })
})
