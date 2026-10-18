import { describe, expect, test } from 'vitest'

import { aliasesFor, getArchitecture } from '../../scripts/lib/architectures.mjs'
import { checkImports, resolveSpecifier, scanImports } from '../../scripts/lib/imports.mjs'

const ROOT = '/virtual'

/** Run the checker over an in-memory project. */
function check(archId, files, allow = []) {
  const arch = getArchitecture(archId)
  return checkImports({
    root: ROOT,
    arch,
    aliases: aliasesFor(arch),
    allow,
    files: Object.keys(files).map((f) => `${ROOT}/${f}`),
    readFile: (file) => files[file.slice(ROOT.length + 1)],
  })
}

describe('scanImports', () => {
  test('finds static, re-export, dynamic and side-effect imports with line numbers', () => {
    const source = [
      "import a from './a'",
      "import { b } from '@components/B'",
      "export * from '@const/x'",
      "const c = import('@pages/C')",
      "import './side.css'",
      'import {',
      '  multi,',
      "} from '@hooks/multi'",
    ].join('\n')
    expect(scanImports(source)).toEqual([
      { specifier: './a', line: 1, kind: 'from' },
      { specifier: '@components/B', line: 2, kind: 'from' },
      { specifier: '@const/x', line: 3, kind: 'from' },
      { specifier: '@pages/C', line: 4, kind: 'dynamic' },
      { specifier: './side.css', line: 5, kind: 'side-effect' },
      { specifier: '@hooks/multi', line: 8, kind: 'from' },
    ])
  })

  test('ignores comments, strings and rtv-ignore lines', () => {
    const source = [
      "// import x from '@services/x'",
      "/* import y from '@services/y' */",
      'const s = \'import z from "@services/z"\'',
      'const t = `from "@services/t"`',
      "import ok from '@services/ok' // rtv-ignore",
      "import real from '@services/real'",
    ].join('\n')
    expect(scanImports(source).map((i) => i.specifier)).toEqual(['@services/real'])
  })
})

describe('resolveSpecifier', () => {
  const aliases = aliasesFor(getArchitecture('classic'))
  test('resolves aliases, relative paths and ignores packages', () => {
    expect(resolveSpecifier('@components/Button', 'src/App.tsx', aliases)).toBe(
      'src/components/Button',
    )
    expect(resolveSpecifier('@/App', 'src/pages/Home/index.tsx', aliases)).toBe('src/App')
    expect(resolveSpecifier('./data', 'src/pages/Home/index.tsx', aliases)).toBe(
      'src/pages/Home/data',
    )
    expect(resolveSpecifier('../shared/x?raw', 'src/pages/Home/index.tsx', aliases)).toBe(
      'src/pages/shared/x',
    )
    expect(resolveSpecifier('react', 'src/App.tsx', aliases)).toBeNull()
    expect(resolveSpecifier('@headlessui/react', 'src/App.tsx', aliases)).toBeNull()
  })
})

describe('checkImports', () => {
  test('classic: components may not reach services or the composition root', () => {
    const result = check('classic', {
      'src/components/Table/index.tsx':
        "import { api } from '@services/api'\nimport App from '@/App'\nimport { useX } from '@hooks/useX'",
      'src/hooks/useX.ts': "import { api } from '@services/api'",
      'src/pages/Home/index.tsx':
        "import { Table } from '@components/Table'\nimport { useX } from '@hooks/useX'",
    })
    expect(result.violations.map((v) => [v.line, v.rule])).toEqual([
      [1, 'layer'],
      [2, 'upward'],
    ])
    expect(result.warnings).toEqual([])
    expect(result.importsChecked).toBe(6)
  })

  test('fsd: lower layers never import higher ones and slices stay isolated', () => {
    const result = check('fsd', {
      'src/features/auth/ui/Login.tsx':
        "import { User } from '@entities/user'\nimport { pay } from '@features/billing'\nimport { helper } from './helper'",
      'src/entities/user/index.ts': "import { login } from '@features/auth'",
      'src/widgets/header/ui/Header.tsx': "import { Button } from '@shared/ui/Button'",
      'src/app/App.tsx': "import { Header } from '@widgets/header'",
    })
    expect(result.violations.map((v) => `${v.file}:${v.line}:${v.rule}`)).toEqual([
      'src/features/auth/ui/Login.tsx:2:cross-slice',
      'src/entities/user/index.ts:1:layer',
    ])
  })

  test('feature: cross-feature imports must use the public API', () => {
    const result = check('feature', {
      'src/features/auth/components/Login.tsx':
        "import { pay } from '@features/billing'\nimport { PayButton } from '@features/billing/components/PayButton'",
      'src/pages/Checkout/index.tsx':
        "import { pay } from '@features/billing'\nimport { Button } from '@components/Button'",
    })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({ line: 2, rule: 'public-api' })
  })

  test('clean: presentation never imports infrastructure unless explicitly allowed', () => {
    const files = {
      'src/presentation/pages/Home/index.tsx':
        "import { http } from '@infrastructure/api/http'\nimport { listUsers } from '@application/use-cases/ListUsers'",
      'src/domain/entities/User.ts': "import { ListUsers } from '@application/use-cases/ListUsers'",
      'src/app/container.ts': "import { http } from '@infrastructure/api/http'",
    }
    const strict = check('clean', files)
    expect(strict.violations.map((v) => `${v.from}>${v.to}`)).toEqual([
      'presentation>infrastructure',
      'domain>application',
    ])
    const relaxed = check('clean', files, ['presentation>infrastructure'])
    expect(relaxed.violations.map((v) => `${v.from}>${v.to}`)).toEqual(['domain>application'])
  })

  test('atomic: composition goes upwards only and uncategorised components warn', () => {
    const result = check('atomic', {
      'src/components/atoms/Button/index.tsx': "import { Field } from '@molecules/Field'",
      'src/components/Legacy/index.tsx': "import { Button } from '@atoms/Button'",
      'src/components/organisms/Header/index.tsx': "import { Button } from '@atoms/Button'",
    })
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({
      file: 'src/components/atoms/Button/index.tsx',
      to: 'molecules',
    })
    expect(result.warnings.map((w) => w.file)).toEqual(['src/components/Legacy/index.tsx'])
  })

  test('unknown folders produce a single warning per folder', () => {
    const result = check('classic', {
      'src/legacy/a.ts': "import x from './b'",
      'src/legacy/b.ts': 'export const x = 1',
    })
    expect(result.violations).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].message).toContain('`src/legacy/`')
  })
})
