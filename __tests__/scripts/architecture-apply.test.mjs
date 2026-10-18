import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { readTsconfigPaths } from '../../scripts/lib/aliases.mjs'
import { applyArchitecture, scaffoldArchitecture } from '../../scripts/lib/architecture-apply.mjs'
import { aliasesFor, getArchitecture, isGeneratedDoc } from '../../scripts/lib/architectures.mjs'
import { DEFAULT_CONFIG, loadConfig, saveConfig } from '../../scripts/lib/config.mjs'

const roots = []

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtv-apply-'))
  roots.push(root)
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    fs.writeFileSync(path.join(root, rel), content)
  }
  const classic = getArchitecture('classic')
  saveConfig(root, { ...structuredClone(DEFAULT_CONFIG), aliases: aliasesFor(classic) })
  write(
    'tsconfig.app.json',
    '{\n  "compilerOptions": {\n    "strict": true,\n    "paths": {}\n  }\n}\n',
  )
  write('src/main.tsx', "import App from './App'")
  write(
    'src/App.tsx',
    "import { Button } from '@components/Button'\nexport default function App() { return <Button /> }",
  )
  write('src/components/Button/index.tsx', 'export function Button() { return null }')
  write('src/components/README.md', '# My hand-written notes\n')
  write('src/const/navigation.ts', 'export const navigation = []')
  scaffoldArchitecture(root, classic)
  return { root, exists: (rel) => fs.existsSync(path.join(root, rel)) }
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe('applyArchitecture', () => {
  test('dry run reports the plan without touching disk', () => {
    const { root, exists } = makeProject()
    const result = applyArchitecture({
      root,
      config: loadConfig(root),
      targetId: 'feature',
      dryRun: true,
    })
    expect(result.applied).toBe(false)
    expect(result.plan.moves.map((m) => `${m.from} → ${m.to}`)).toEqual([
      'src/components → src/shared/components',
      'src/const → src/shared/const',
    ])
    expect(exists('src/components/Button/index.tsx')).toBe(true)
    expect(loadConfig(root).architecture).toBe('classic')
  })

  test('moves role folders, rewrites aliases and regenerates docs', () => {
    const { root, exists } = makeProject()
    const result = applyArchitecture({ root, config: loadConfig(root), targetId: 'feature' })
    expect(result.applied).toBe(true)
    expect(exists('src/shared/components/Button/index.tsx')).toBe(true)
    expect(exists('src/shared/components/README.md')).toBe(true) // hand-written README travels with the folder
    expect(exists('src/components')).toBe(false)
    expect(exists('src/.rtv-staging')).toBe(false)
    expect(exists('src/features/README.md')).toBe(true)
    expect(isGeneratedDoc(fs.readFileSync(path.join(root, 'src/shared/README.md'), 'utf8'))).toBe(
      true,
    )

    const config = loadConfig(root)
    expect(config.architecture).toBe('feature')
    expect(config.aliases['@components']).toBe('./src/shared/components')
    expect(config.aliases['@features']).toBe('./src/features')
    expect(readTsconfigPaths(root)['@components/*']).toEqual(['./src/shared/components/*'])
    expect(readTsconfigPaths(root)['@features/*']).toEqual(['./src/features/*'])
  })

  test('round trip through clean and back to classic leaves no stale folders', () => {
    const { root, exists } = makeProject()
    applyArchitecture({ root, config: loadConfig(root), targetId: 'feature' })
    applyArchitecture({ root, config: loadConfig(root), targetId: 'clean' })
    expect(exists('src/presentation/components/Button/index.tsx')).toBe(true)
    expect(exists('src/shared/const/navigation.ts')).toBe(true)
    expect(exists('src/features')).toBe(false)
    expect(exists('src/domain/entities/.gitkeep')).toBe(true)

    applyArchitecture({ root, config: loadConfig(root), targetId: 'classic' })
    expect(exists('src/components/Button/index.tsx')).toBe(true)
    expect(exists('src/const/navigation.ts')).toBe(true)
    expect(exists('src/presentation')).toBe(false)
    expect(exists('src/shared')).toBe(false)
    expect(exists('src/domain')).toBe(false)
    expect(exists('src/components/README.md')).toBe(true)
    expect(loadConfig(root).aliases).toEqual(aliasesFor(getArchitecture('classic')))
  })
})
