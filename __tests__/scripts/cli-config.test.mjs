import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { listFlag, parseArgs } from '../../scripts/lib/cli.mjs'
import {
  DEFAULT_CONFIG,
  loadConfig,
  merge,
  saveConfig,
  serializeConfig,
} from '../../scripts/lib/config.mjs'
import { toPackageName } from '../../scripts/commands/create.mjs'

describe('parseArgs', () => {
  test('handles positionals, --flag, --flag=value, --flag value, --no-flag and -y', () => {
    const { positionals, flags } = parseArgs([
      'apply',
      'fsd',
      '--dry-run',
      '--arch=clean',
      '--templates',
      'a,b',
      '--no-git',
      '-y',
      '--',
      'rest',
    ])
    expect(positionals).toEqual(['apply', 'fsd', 'rest'])
    expect(flags).toEqual({ dryRun: true, arch: 'clean', templates: 'a,b', git: false, y: true })
  })

  test('repeated flags become lists and listFlag splits on commas', () => {
    const { flags } = parseArgs(['--templates', 'a', '--templates', 'b,c'])
    expect(listFlag(flags.templates)).toEqual(['a', 'b', 'c'])
    expect(listFlag(undefined)).toEqual([])
    expect(listFlag(true)).toEqual([])
  })
})

describe('config', () => {
  test('merge is deep for objects and replaces arrays', () => {
    expect(merge({ a: { b: 1, c: 2 }, list: [1] }, { a: { c: 3 }, list: [2, 3] })).toEqual({
      a: { b: 1, c: 3 },
      list: [2, 3],
    })
  })

  test('loadConfig falls back to defaults and saveConfig keeps a stable key order', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtv-cfg-'))
    try {
      expect(loadConfig(root)).toEqual(DEFAULT_CONFIG)
      saveConfig(root, { aliases: { '@': './src' }, architecture: 'fsd', version: 1, extra: true })
      const text = fs.readFileSync(path.join(root, 'rtv.config.json'), 'utf8')
      expect(Object.keys(JSON.parse(text))).toEqual(['version', 'architecture', 'aliases', 'extra'])
      expect(loadConfig(root).architecture).toBe('fsd')
      expect(loadConfig(root).claude.model).toBe('claude-opus-5-5')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test('serializeConfig ends with a newline', () => {
    expect(serializeConfig({ version: 1 })).toBe('{\n  "version": 1\n}\n')
  })
})

describe('toPackageName', () => {
  test('produces valid npm names', () => {
    expect(toPackageName('My App!')).toBe('my-app')
    expect(toPackageName('.hidden')).toBe('hidden')
    expect(toPackageName('---')).toBe('my-app')
  })
})
