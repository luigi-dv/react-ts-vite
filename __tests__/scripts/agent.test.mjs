import { describe, expect, test } from 'vitest'

import {
  checkAgent,
  computeArtifacts,
  embedMarkdown,
  listRules,
  listSkills,
  listWorkflows,
  parseFrontmatter,
  renderArchitectureRule,
  validateSkills,
} from '../../scripts/lib/agent.mjs'
import { loadConfig } from '../../scripts/lib/config.mjs'
import { findProjectRoot } from '../../scripts/lib/paths.mjs'

const root = findProjectRoot()
const config = loadConfig(root)

describe('front matter', () => {
  test('parses scalars, quoted strings, lists and one-level maps', () => {
    const { data, body } = parseFrontmatter(`---
name: my-skill
description: "Does things. Use when: always"
tags:
  - a
  - b
metadata:
  author: me
  version: "1.0"
---
# Title

Body`)
    expect(data).toEqual({
      name: 'my-skill',
      description: 'Does things. Use when: always',
      tags: ['a', 'b'],
      metadata: { author: 'me', version: '1.0' },
    })
    expect(body).toBe('# Title\n\nBody')
  })

  test('embedMarkdown drops the first H1 and demotes the rest', () => {
    expect(embedMarkdown('# Title\n\ntext\n\n## Section', { levels: 2 })).toBe(
      'text\n\n#### Section',
    )
  })
})

describe('.agent inventory', () => {
  test('skills follow the Agent Skills conventions', () => {
    const skills = listSkills(root)
    expect(skills.length).toBeGreaterThanOrEqual(10)
    expect(validateSkills(skills)).toEqual([])
    for (const skill of skills) {
      expect(skill.description).toMatch(/Use when/i)
      expect(skill.files).toContain('SKILL.md')
    }
  })

  test('rules and workflows have titles and descriptions', () => {
    for (const item of [...listRules(root), ...listWorkflows(root)]) {
      expect(item.title).toBeTruthy()
      expect(item.description).toBeTruthy()
    }
    expect(listRules(root).map((r) => r.id)).toContain('architecture')
  })

  test('the architecture rule is generated from the active config', () => {
    const rule = renderArchitectureRule(
      { ...config, architecture: 'fsd', templates: ['dashboard'] },
      root,
    )
    const { data, body } = parseFrontmatter(rule)
    expect(data.title).toBe('Project architecture')
    expect(body).toContain('**Feature-Sliced Design**')
    expect(body).toContain('`dashboard`')
    expect(body).toContain('npm run arch:check')
  })

  test('generated artefacts cover every tool and the committed mirrors are in sync', () => {
    const { artifacts } = computeArtifacts(root, config)
    const files = [...artifacts.keys()]
    expect(files).toEqual(
      expect.arrayContaining([
        'AGENTS.md',
        '.github/copilot-instructions.md',
        '.agent/agent.json',
        'docs/architecture.md',
      ]),
    )
    expect(files.some((f) => f.startsWith('.cursor/rules/'))).toBe(true)
    expect(files.some((f) => f.startsWith('.claude/commands/'))).toBe(true)
    expect(checkAgent(root, config)).toEqual([])
  })
})
