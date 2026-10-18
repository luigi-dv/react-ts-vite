import { describe, expect, test } from 'vitest'

import { loadConfig } from '../../scripts/lib/config.mjs'
import {
  checkTsconfigPaths,
  parseJsonc,
  replacePathsBlock,
  tsconfigPaths,
} from '../../scripts/lib/aliases.mjs'
import { aliasesFor, getArchitecture } from '../../scripts/lib/architectures.mjs'
import { findProjectRoot } from '../../scripts/lib/paths.mjs'

describe('alias ↔ tsconfig sync', () => {
  test('tsconfigPaths expands aliases into bare and wildcard entries', () => {
    expect(tsconfigPaths({ '@': './src', '@components': './src/components' })).toEqual({
      '@/*': ['./src/*'],
      '@components': ['./src/components'],
      '@components/*': ['./src/components/*'],
    })
  })

  test('parseJsonc tolerates comments and trailing commas', () => {
    const json = parseJsonc(
      '{\n  // comment\n  "a": 1, /* block */\n  "b": ["x",],\n  "c": "http://not-a-comment",\n}',
    )
    expect(json).toEqual({ a: 1, b: ['x'], c: 'http://not-a-comment' })
  })

  test('replacePathsBlock rewrites only the paths block and keeps comments', () => {
    const source = `{
  // keep me
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@old/*": ["./src/old/*"]
    },
    "jsx": "react-jsx"
  }
}
`
    const next = replacePathsBlock(source, { '@/*': ['./src/*'] })
    expect(next).toContain('// keep me')
    expect(next).toContain('"strict": true')
    expect(next).toContain('"jsx": "react-jsx"')
    expect(next).not.toContain('@old')
    expect(parseJsonc(next).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
  })

  test('replacePathsBlock adds a paths block when none exists', () => {
    const next = replacePathsBlock('{\n  "compilerOptions": {\n    "strict": true\n  }\n}\n', {
      '@/*': ['./src/*'],
    })
    expect(parseJsonc(next).compilerOptions).toEqual({
      strict: true,
      paths: { '@/*': ['./src/*'] },
    })
  })

  test('the repository tsconfig matches the active architecture aliases', () => {
    const root = findProjectRoot()
    const arch = getArchitecture(loadConfig(root).architecture)
    expect(checkTsconfigPaths(root, aliasesFor(arch))).toEqual([])
  })
})
