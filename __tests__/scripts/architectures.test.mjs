import { describe, expect, test } from 'vitest'

import {
  ARCHITECTURES,
  ROLES,
  ROOT_LAYER,
  aliasesFor,
  describeArchitecture,
  getArchitecture,
  isGeneratedDoc,
  layerOf,
  renderLayerReadme,
  renderTree,
  scaffoldDirs,
} from '../../scripts/lib/architectures.mjs'

describe('architecture catalogue', () => {
  test.each(ARCHITECTURES.map((a) => [a.id, a]))('%s is internally consistent', (_, arch) => {
    const ids = arch.layers.map((l) => l.id)
    const paths = arch.layers.map((l) => l.path)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(paths).size).toBe(paths.length)
    for (const role of ROLES) {
      expect(arch.roles[role]).toMatch(/^src\//)
      // every role path is owned by a layer so the checker can reason about it
      expect(layerOf(`${arch.roles[role]}/file.ts`, arch).id).not.toBeNull()
    }
    for (const layer of arch.layers) {
      for (const id of layer.mayImport) if (id !== '*') expect(ids).toContain(id)
    }
    expect(arch.principles.length).toBeGreaterThan(0)
    expect(arch.bestFor.length).toBeGreaterThan(0)
  })

  test('aliases always include @ and one alias per role', () => {
    for (const arch of ARCHITECTURES) {
      const aliases = aliasesFor(arch)
      expect(aliases['@']).toBe('./src')
      for (const role of ROLES) expect(aliases[`@${role}`]).toBe(`./${arch.roles[role]}`)
      expect(Object.keys(aliases)[0]).toBe('@')
    }
  })

  test('layerOf picks the longest matching layer path', () => {
    const atomic = getArchitecture('atomic')
    expect(layerOf('src/components/atoms/Button/index.tsx', atomic).id).toBe('atoms')
    expect(layerOf('src/components/Legacy/index.tsx', atomic).id).toBe('components')
    expect(layerOf('src/pages/Home/index.tsx', atomic).id).toBe('pages')
  })

  test('files directly under src/ are the composition root; unknown folders have no layer', () => {
    const classic = getArchitecture('classic')
    expect(layerOf('src/App.tsx', classic).id).toBe(ROOT_LAYER)
    expect(layerOf('src/main.tsx', classic).id).toBe(ROOT_LAYER)
    expect(layerOf('src/mystery/thing.ts', classic).id).toBeNull()
  })

  test('sliced layers expose the slice name', () => {
    const fsd = getArchitecture('fsd')
    expect(layerOf('src/features/auth/ui/LoginForm.tsx', fsd)).toMatchObject({
      id: 'features',
      slice: 'auth',
    })
    expect(layerOf('src/shared/ui/Button.tsx', fsd)).toMatchObject({ id: 'shared', slice: null })
  })

  test('scaffoldDirs covers layers, roles and documented folders', () => {
    const clean = getArchitecture('clean')
    const dirs = scaffoldDirs(clean)
    expect(dirs).toContain('src/domain')
    expect(dirs).toContain('src/presentation/pages')
    expect(dirs).toContain('src/application/use-cases')
    expect(dirs).toEqual([...dirs].sort())
  })

  test('renderTree draws nested folders', () => {
    const tree = renderTree(['src/a', 'src/a/b', 'src/c'])
    expect(tree).toBe('src/\n├── a/\n│   └── b/\n└── c/')
  })

  test('describeArchitecture lists every layer and alias', () => {
    const fsd = getArchitecture('fsd')
    const doc = describeArchitecture(fsd)
    for (const layer of fsd.layers) expect(doc).toContain(`| \`${layer.id}\` |`)
    for (const alias of Object.keys(aliasesFor(fsd))) expect(doc).toContain(`\`${alias}\``)
    expect(doc).toContain('**Principles**')
  })

  test('layer README is generated, mentions the rules and sub-folders', () => {
    const clean = getArchitecture('clean')
    const domain = clean.layers.find((l) => l.id === 'domain')
    const readme = renderLayerReadme(clean, domain)
    expect(isGeneratedDoc(readme)).toBe(true)
    expect(readme).toContain('**May import from:** `domain`, `shared`')
    expect(readme).toContain('`entities/`')
    expect(readme).toContain('npm run arch:check')
  })

  test('getArchitecture rejects unknown ids', () => {
    expect(() => getArchitecture('hexagonal-ish')).toThrow(/Unknown architecture/)
  })
})
