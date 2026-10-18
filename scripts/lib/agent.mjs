// `.agent/` is the single source of truth for everything an AI coding agent
// needs to know about this project: always-on rules, reusable skills
// (Agent Skills standard: SKILL.md with YAML front matter) and step-by-step
// workflows. This module renders the generated parts (the architecture rule,
// the index) and mirrors the folder into the places each tool reads:
//
//   Claude Code  → .claude/skills/<skill>/, .claude/commands/<workflow>.md, CLAUDE.md (hand-written, imports .agent)
//   Codex, Jules, Amp, Zed, Gemini CLI, … → AGENTS.md (generated)
//   GitHub Copilot → .github/copilot-instructions.md (generated)
//   Cursor → .cursor/rules/rtv-*.mdc (generated)
import fs from 'node:fs'
import path from 'node:path'

import { ARCHITECTURES, describeArchitecture, getArchitecture } from './architectures.mjs'
import { copyDir, exists, isDir, listFiles, readText, writeText } from './fs.mjs'
import { relativeTo, toPosix } from './paths.mjs'

export const AGENT_DIR = '.agent'
export const GENERATED_MARK = '<!-- rtv:generated -->'
const MIRROR_MARK = '.rtv-mirror'

/* ------------------------------------------------------------ front matter */

/** Minimal YAML front-matter parser: scalars, `key: value` maps (one level) and `- item` lists. */
export function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { data: {}, body: text }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: text }
  const raw = text.slice(3, end).trim().split('\n')
  const body = text.slice(end + 4).replace(/^\r?\n/, '')
  const data = {}
  let currentKey = null
  for (const line of raw) {
    if (!line.trim()) continue
    const nested = line.match(/^\s+([\w-]+):\s*(.*)$/)
    const item = line.match(/^\s*-\s+(.*)$/)
    const top = line.match(/^([\w-]+):\s*(.*)$/)
    if (top) {
      currentKey = top[1]
      data[currentKey] = top[2] === '' ? null : unquote(top[2])
    } else if (item && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(unquote(item[1]))
    } else if (nested && currentKey) {
      if (!data[currentKey] || typeof data[currentKey] !== 'object') data[currentKey] = {}
      data[currentKey][nested[1]] = unquote(nested[2])
    }
  }
  return { data, body }
}

const unquote = (value) => {
  const v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    return v.slice(1, -1)
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

/** Drop the first H1 (the renderer prints its own title) and shift remaining headings down. */
export function embedMarkdown(body, { levels = 1 } = {}) {
  const lines = body.replace(GENERATED_MARK, '').trim().split('\n')
  const firstHeading = lines.findIndex((line) => /^#\s+/.test(line))
  if (firstHeading !== -1) lines.splice(firstHeading, 1)
  const shifted = lines.map((line) =>
    /^#{1,5}\s/.test(line) ? `${'#'.repeat(levels)}${line}` : line,
  )
  return shifted.join('\n').trim()
}

function firstHeading(body) {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function firstParagraph(body) {
  const withoutHeadings = body.replace(GENERATED_MARK, '').split('\n')
  const para = []
  for (const line of withoutHeadings) {
    if (!line.trim()) {
      if (para.length) break
      continue
    }
    if (line.startsWith('#') || line.startsWith('>')) continue
    para.push(line.trim())
  }
  return para.join(' ')
}

/* ------------------------------------------------------------- inventory */

export function listSkills(root) {
  const dir = path.join(root, AGENT_DIR, 'skills')
  if (!isDir(dir)) return []
  const skills = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = path.join(dir, entry.name, 'SKILL.md')
    if (!exists(file)) continue
    const { data, body } = parseFrontmatter(readText(file))
    skills.push({
      id: entry.name,
      name: data.name ?? entry.name,
      description: data.description ?? firstParagraph(body),
      data,
      dir: path.join(dir, entry.name),
      path: toPosix(path.join(AGENT_DIR, 'skills', entry.name, 'SKILL.md')),
      files: listFiles(path.join(dir, entry.name)).map((f) =>
        relativeTo(path.join(dir, entry.name), f),
      ),
    })
  }
  return skills.sort((a, b) => a.id.localeCompare(b.id))
}

/** Validate skills against the Agent Skills conventions. Returns problems. */
export function validateSkills(skills) {
  const problems = []
  for (const skill of skills) {
    if (skill.name !== skill.id)
      problems.push(
        `${skill.path}: front-matter name "${skill.name}" must match the folder name "${skill.id}".`,
      )
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skill.id) || skill.id.length > 64)
      problems.push(
        `${skill.path}: skill names are lowercase letters, digits and hyphens (max 64 chars).`,
      )
    if (!skill.data.description)
      problems.push(`${skill.path}: missing required "description" in front matter.`)
    else if (skill.data.description.length > 1024)
      problems.push(`${skill.path}: description longer than 1024 characters.`)
  }
  return problems
}

function listMarkdown(root, subdir) {
  const dir = path.join(root, AGENT_DIR, subdir)
  if (!isDir(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const content = readText(path.join(dir, file))
      const { data, body } = parseFrontmatter(content)
      return {
        id: file.replace(/\.md$/, ''),
        title: data.title ?? firstHeading(body) ?? file,
        description: data.description ?? firstParagraph(body),
        data,
        body,
        content,
        path: toPosix(path.join(AGENT_DIR, subdir, file)),
      }
    })
}

export const listRules = (root) => listMarkdown(root, 'rules')
export const listWorkflows = (root) => listMarkdown(root, 'workflows')

export function readInstructions(root) {
  const file = path.join(root, AGENT_DIR, 'instructions.md')
  return exists(file) ? readText(file) : ''
}

/* ------------------------------------------------------------- rendering */

export function renderArchitectureRule(config, root) {
  const arch = getArchitecture(config.architecture)
  const templates = config.templates?.length
    ? config.templates.map((t) => `\`${t}\``).join(', ')
    : 'none'
  return `---
title: Project architecture
description: The active folder architecture, its layers, aliases and import rules. Generated from rtv.config.json by \`npm run arch\`.
---
${GENERATED_MARK}

# Architecture rule

This project uses the **${arch.title}** architecture (\`${arch.id}\`): ${arch.tagline}

- Place new code in the layer whose purpose matches it (see the table below). Never create new top-level folders under \`src/\` without updating the architecture catalogue (\`scripts/lib/architectures.mjs\`).
- Import through the path aliases listed below (\`@components/Button\`, \`@pages/Dashboard\`). Never use parent-relative imports (\`../\`); the ESLint rule \`no-restricted-imports\` enforces this.
- Respect the layer dependency direction. Run \`npm run arch:check\` before finishing a task; it fails on any forbidden import.
- Applied design templates: ${templates}. Pages live in \`${arch.roles.pages}/\`, each with a smoke test in \`__tests__/pages/\`.
- To switch architecture run \`npm run arch -- apply <id>\` (never move folders by hand). Project root: \`${toPosix(path.basename(root))}\`.

${describeArchitecture(arch, { heading: '##' })}
`
}

export function renderAgentsMd({ instructions, rules, skills, workflows, config }) {
  const lines = [
    GENERATED_MARK,
    '# AGENTS.md',
    '',
    `> Generated from \`.agent/\` by \`npm run agent:sync\`. Edit the files in \`.agent/\`, not this one. Active architecture: **${config.architecture}**.`,
    '',
    embedMarkdown(instructions),
    '',
    '## Rules (always apply)',
    '',
  ]
  for (const rule of rules) {
    lines.push(
      `### ${rule.title}`,
      '',
      `<!-- source: ${rule.path} -->`,
      '',
      embedMarkdown(rule.body, { levels: 3 }),
      '',
    )
  }
  lines.push(
    '## Skills',
    '',
    'Reusable know-how for specific tasks. Read the linked `SKILL.md` before starting a matching task.',
    '',
    '| Skill | When to use |',
    '| --- | --- |',
  )
  for (const skill of skills)
    lines.push(`| [\`${skill.id}\`](${skill.path}) | ${skill.description.replace(/\|/g, '\\|')} |`)
  lines.push(
    '',
    '## Workflows',
    '',
    'Step-by-step procedures for recurring jobs.',
    '',
    '| Workflow | Purpose |',
    '| --- | --- |',
  )
  for (const wf of workflows)
    lines.push(`| [\`${wf.id}\`](${wf.path}) | ${wf.description.replace(/\|/g, '\\|')} |`)
  lines.push('')
  return lines.join('\n')
}

export function renderCopilotInstructions({ instructions, rules, skills, config }) {
  const lines = [
    GENERATED_MARK,
    `<!-- Generated from .agent/ by \`npm run agent:sync\` (architecture: ${config.architecture}). Edit .agent/, not this file. -->`,
    '',
    '# Copilot instructions',
    '',
    embedMarkdown(instructions),
    '',
  ]
  for (const rule of rules)
    lines.push(`## ${rule.title}`, '', embedMarkdown(rule.body, { levels: 2 }), '')
  lines.push('## Skills', '', 'Detailed guides live in `.agent/skills/<name>/SKILL.md`:', '')
  for (const skill of skills) lines.push(`- \`${skill.id}\` — ${skill.description}`)
  lines.push('')
  return lines.join('\n')
}

export function renderCursorRule(rule) {
  const description = (rule.description || rule.title).replace(/\n/g, ' ')
  return `---
description: ${JSON.stringify(description)}
globs:
alwaysApply: true
---
${GENERATED_MARK}
<!-- Generated from ${rule.path} by \`npm run agent:sync\`. -->

${rule.body.replace(GENERATED_MARK, '').trim()}
`
}

export function renderClaudeCommand(workflow) {
  const description = (workflow.description || workflow.title).replace(/\n/g, ' ')
  return `---
description: ${JSON.stringify(description)}
---
${GENERATED_MARK}
<!-- Generated from ${workflow.path} by \`npm run agent:sync\`. -->

${workflow.body.replace(GENERATED_MARK, '').trim()}
`
}

export function renderManifest({ rules, skills, workflows, config }) {
  return `${JSON.stringify(
    {
      $comment: 'Generated by `npm run agent:sync` from the contents of .agent/. Do not edit.',
      architecture: config.architecture,
      templates: config.templates ?? [],
      rules: rules.map((r) => ({ id: r.id, title: r.title, path: r.path })),
      skills: skills.map((s) => ({ name: s.id, description: s.description, path: s.path })),
      workflows: workflows.map((w) => ({ id: w.id, title: w.title, path: w.path })),
      mirrors: {
        claudeCode: ['.claude/skills/<skill>/', '.claude/commands/<workflow>.md', 'CLAUDE.md'],
        agentsMd: 'AGENTS.md',
        copilot: '.github/copilot-instructions.md',
        cursor: '.cursor/rules/rtv-<rule>.mdc',
      },
    },
    null,
    2,
  )}\n`
}

export function renderArchitectureDocs(config) {
  const lines = [
    GENERATED_MARK,
    '# Architectures',
    '',
    `> Generated from the catalogue in \`scripts/lib/architectures.mjs\` by \`npm run agent:sync\`. Active architecture of this repository: **${config.architecture}**.`,
    '',
    'An architecture decides **where each role lives** (components, pages, hooks, services, types, const, utils, assets), which **extra layers** exist and **which layer may import which**. Application code imports through role aliases (`@components/Button`), so switching architecture moves folders without rewriting imports.',
    '',
    '```bash',
    'npm run arch -- list                 # catalogue',
    'npm run arch -- current              # layers, aliases and rules of the active one',
    'npm run arch -- apply <id> --dry-run # preview a switch',
    'npm run arch -- apply <id>           # move role folders, rewrite aliases, regenerate docs',
    'npm run arch:check                   # verify import direction (part of npm run check)',
    '```',
    '',
    '## Choosing',
    '',
    '| Architecture | Pick it when | Watch out for |',
    '| --- | --- | --- |',
  ]
  for (const arch of ARCHITECTURES)
    lines.push(
      `| [\`${arch.id}\`](#${arch.id}) — ${arch.title} | ${arch.bestFor.join('; ')} | ${arch.tradeoffs.join('; ')} |`,
    )
  lines.push(
    '',
    '## How the checker works',
    '',
    'Every module under `src/` is scanned for `import`/`export … from`, `import()` and `require()` specifiers. Aliases and relative paths are resolved to project paths and mapped to the **longest matching layer path**. A file directly under `src/` (`main.tsx`, `App.tsx`) is the composition root and may import anything. For each import the checker verifies the importing layer\'s `mayImport` list, slice isolation (`fsd`) or public-API rules (`feature`), and reports violations with file and line. Exceptions go into `rules.allow` in `rtv.config.json` as `"from>to"`; a single import can be excluded with a trailing `// rtv-ignore` comment.',
    '',
  )
  for (const arch of ARCHITECTURES) {
    lines.push(`<a id="${arch.id}"></a>`, '', describeArchitecture(arch, { heading: '##' }))
  }
  lines.push(
    '## Adding an architecture',
    '',
    'Architectures are plain data: add an entry to `ARCHITECTURES` in `scripts/lib/architectures.mjs` with `roles` (one path per role), `extraAliases`, `layers` (each with `path`, `purpose`, `mayImport`, optional `sliced`/`crossSlice`), `folders` and `principles`. Run `npm run test:run` (catalogue integrity tests) and `npm run agent:sync` (this file and the agent rule regenerate).',
    '',
  )
  return lines.join('\n')
}

/* -------------------------------------------------------------- sync/check */

/**
 * Compute every generated artefact as `{ relativePath: content }` plus the
 * skill directories to mirror.
 */
export function computeArtifacts(root, config) {
  const artifacts = new Map()
  artifacts.set(`${AGENT_DIR}/rules/architecture.md`, renderArchitectureRule(config, root))

  // The architecture rule must be part of the inventory even before it is written.
  const rules = listRules(root).filter((r) => r.id !== 'architecture')
  const archRule = {
    ...parseFrontmatter(artifacts.get(`${AGENT_DIR}/rules/architecture.md`)),
    id: 'architecture',
    path: `${AGENT_DIR}/rules/architecture.md`,
  }
  const archEntry = {
    id: 'architecture',
    title: 'Project architecture',
    description: archRule.data.description,
    data: archRule.data,
    body: archRule.body,
    path: archRule.path,
  }
  const allRules = [archEntry, ...rules]
  const skills = listSkills(root)
  const workflows = listWorkflows(root)
  const instructions = readInstructions(root)

  artifacts.set(
    'AGENTS.md',
    renderAgentsMd({ instructions, rules: allRules, skills, workflows, config }),
  )
  artifacts.set(
    '.github/copilot-instructions.md',
    renderCopilotInstructions({ instructions, rules: allRules, skills, config }),
  )
  artifacts.set(
    `${AGENT_DIR}/agent.json`,
    renderManifest({ rules: allRules, skills, workflows, config }),
  )
  artifacts.set('docs/architecture.md', renderArchitectureDocs(config))
  for (const rule of allRules)
    artifacts.set(`.cursor/rules/rtv-${rule.id}.mdc`, renderCursorRule(rule))
  for (const wf of workflows) artifacts.set(`.claude/commands/${wf.id}.md`, renderClaudeCommand(wf))

  return { artifacts, skills, rules: allRules, workflows }
}

/**
 * Write all generated files and mirror skills into `.claude/skills/`.
 * @returns {{ written: string[], removed: string[], skills: object[] }}
 */
export function syncAgent(root, config) {
  const { artifacts, skills } = computeArtifacts(root, config)
  const written = []
  for (const [rel, content] of artifacts) {
    const file = path.join(root, rel)
    if (!exists(file) || readText(file) !== content) {
      writeText(file, content)
      written.push(rel)
    }
  }

  const mirrorRoot = path.join(root, '.claude', 'skills')
  for (const skill of skills) {
    const target = path.join(mirrorRoot, skill.id)
    const copied = copyDir(skill.dir, target, { overwrite: true })
    writeText(
      path.join(target, MIRROR_MARK),
      `Mirrored from ${skill.path} by \`npm run agent:sync\`. Edit the source, not this copy.\n`,
    )
    for (const file of copied) {
      const rel = relativeTo(root, file)
      if (!written.includes(rel)) written.push(rel)
    }
    // Remove files that disappeared from the source skill.
    for (const file of listFiles(target)) {
      const rel = relativeTo(target, file)
      if (rel !== MIRROR_MARK && !skill.files.includes(rel)) fs.rmSync(file)
    }
  }
  const removed = []
  if (isDir(mirrorRoot)) {
    for (const entry of fs.readdirSync(mirrorRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const isMirror = exists(path.join(mirrorRoot, entry.name, MIRROR_MARK))
      if (isMirror && !skills.some((s) => s.id === entry.name)) {
        fs.rmSync(path.join(mirrorRoot, entry.name), { recursive: true, force: true })
        removed.push(toPosix(path.join('.claude', 'skills', entry.name)))
      }
    }
  }
  return { written: written.map(toPosix), removed, skills }
}

/** Report generated files that are missing or stale. */
export function checkAgent(root, config) {
  const { artifacts, skills } = computeArtifacts(root, config)
  const problems = [...validateSkills(skills)]
  for (const [rel, content] of artifacts) {
    const file = path.join(root, rel)
    if (!exists(file)) problems.push(`${rel} is missing — run \`npm run agent:sync\`.`)
    else if (readText(file) !== content)
      problems.push(`${rel} is out of date — run \`npm run agent:sync\`.`)
  }
  for (const skill of skills) {
    const target = path.join(root, '.claude', 'skills', skill.id)
    for (const rel of skill.files) {
      const source = path.join(skill.dir, rel)
      const mirror = path.join(target, rel)
      if (!exists(mirror))
        problems.push(`.claude/skills/${skill.id}/${rel} is missing — run \`npm run agent:sync\`.`)
      else if (readText(source) !== readText(mirror))
        problems.push(
          `.claude/skills/${skill.id}/${rel} differs from ${skill.path} — run \`npm run agent:sync\`.`,
        )
    }
  }
  const claudeMd = path.join(root, 'CLAUDE.md')
  if (!exists(claudeMd)) problems.push('CLAUDE.md is missing at the project root.')
  return problems
}
