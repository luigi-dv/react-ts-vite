import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { loadConfig } from '../../scripts/lib/config.mjs'
import {
  DEFAULT_SYSTEM_PROMPT,
  collectContext,
  loadSystemPrompt,
  renderContext,
} from '../../scripts/lib/insights.mjs'
import { findProjectRoot } from '../../scripts/lib/paths.mjs'

const repoRoot = findProjectRoot()

describe('deployment insights context', () => {
  test('collectContext works outside a git repository and without dist/', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtv-ins-'))
    try {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ name: 'demo', version: '1.2.3' }),
      )
      const ctx = collectContext({ root, config: loadConfig(root) })
      expect(ctx.project).toMatchObject({ name: 'demo', version: '1.2.3' })
      expect(ctx.git.label).toBe('not a git repository')
      expect(ctx.git.commits).toEqual([])
      expect(ctx.build).toBeNull()
      const markdown = renderContext(ctx)
      expect(markdown).toContain('# Deployment context')
      expect(markdown).toContain('demo v1.2.3')
      expect(markdown).toContain('_No commits in range._')
      expect(markdown).toContain('No dist/ folder found')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test('collectContext describes the current project', () => {
    const ctx = collectContext({ root: repoRoot, config: loadConfig(repoRoot) })
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
    expect(ctx.project.name).toBe(pkg.name)
    expect(typeof ctx.git.label).toBe('string')
    expect(ctx.architecture).toBe(loadConfig(repoRoot).architecture)
    expect(ctx.ci.provider).toMatch(/^(local|ci|github-actions)$/)
  })

  test('renderContext lists build output sizes when present', () => {
    const markdown = renderContext({
      project: { name: 'demo', version: '1.0.0' },
      architecture: 'classic',
      templates: ['landing'],
      git: {
        label: 'since tag v0.9.0',
        branch: 'main',
        head: 'abc1234',
        commits: ['abc1234 2026-10-18 Ada: feat: thing'],
        stat: ' 1 file changed',
        diff: '+added',
        diffTruncated: false,
      },
      build: {
        files: [{ file: 'assets/index.js', bytes: 2048, gzip: 1024 }],
        total: { bytes: 2048, gzip: 1024 },
      },
      ci: { provider: 'local', deployUrl: 'https://example.com', environment: 'production' },
    })
    expect(markdown).toContain('| assets/index.js | 2.0 kB | 1.0 kB |')
    expect(markdown).toContain('Deployment URL: https://example.com (production)')
    expect(markdown).toContain('```diff\n+added\n```')
  })

  test('the system prompt comes from the deployment-insights skill', () => {
    const prompt = loadSystemPrompt(repoRoot)
    expect(prompt).toContain('release engineer')
    expect(prompt.startsWith('---')).toBe(false)
    expect(loadSystemPrompt(os.tmpdir())).toBe(DEFAULT_SYSTEM_PROMPT)
  })
})
