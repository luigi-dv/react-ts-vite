// Claude deployment insights.
//
// Gathers what changed since the previous release (commits, diff, build output
// sizes, project shape) and asks Claude for a deployment report: a plain-language
// summary, release notes, risk assessment and a verification checklist.
// Two execution modes:
//   api — the official `@anthropic-ai/sdk` (installed on demand), ideal for CI.
//   cli — the Claude Code CLI (`claude -p`), which can also inspect the repository.
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

import { CliError } from './cli.mjs'
import { commandExists, exists, isDir, listFiles, readJson, readText, run } from './fs.mjs'
import { relativeTo } from './paths.mjs'

export const DEFAULT_MODEL = 'claude-opus-5-5'
export const DEFAULT_EFFORT = 'medium'
export const DEFAULT_MAX_TOKENS = 16000
export const REPORT_FILE = 'deployment-insights.md'
export const PROMPT_FILE = '.agent/skills/deployment-insights/PROMPT.md'
const MAX_DIFF_CHARS = 60_000

/* ----------------------------------------------------------------- context */

function git(root, args) {
  const result = run('git', args, { cwd: root })
  return result.ok ? result.stdout : ''
}

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 * The commit range to describe: `--since` if given, else previous tag..HEAD,
 * else the last 30 commits. Returns separate log/diff arguments because a
 * repository with a single commit has to diff against the empty tree.
 */
export function resolveRange(root, since) {
  if (since)
    return { logArgs: [`${since}..HEAD`], diffArgs: [`${since}..HEAD`], label: `since ${since}` }
  const previousTag = git(root, ['describe', '--tags', '--abbrev=0', 'HEAD^'])
  if (previousTag)
    return {
      logArgs: [`${previousTag}..HEAD`],
      diffArgs: [`${previousTag}..HEAD`],
      label: `since tag ${previousTag}`,
    }
  const count = Number(git(root, ['rev-list', '--count', 'HEAD']) || 0)
  if (count <= 1)
    return { logArgs: ['HEAD'], diffArgs: [EMPTY_TREE, 'HEAD'], label: 'initial commit' }
  const n = Math.min(30, count - 1)
  return {
    logArgs: [`HEAD~${n}..HEAD`],
    diffArgs: [`HEAD~${n}..HEAD`],
    label: `last ${n} commits (no previous tag found)`,
  }
}

export function collectBuildOutput(root) {
  const dist = path.join(root, 'dist')
  if (!isDir(dist)) return null
  const files = listFiles(dist).map((file) => {
    const content = fs.readFileSync(file)
    return { file: relativeTo(dist, file), bytes: content.length, gzip: gzipSync(content).length }
  })
  const total = files.reduce(
    (acc, f) => ({ bytes: acc.bytes + f.bytes, gzip: acc.gzip + f.gzip }),
    { bytes: 0, gzip: 0 },
  )
  return { files: files.sort((a, b) => b.bytes - a.bytes), total }
}

/**
 * @param {{ root: string, since?: string, config: object }} options
 */
export function collectContext({ root, since, config }) {
  const pkg = exists(path.join(root, 'package.json'))
    ? readJson(path.join(root, 'package.json'))
    : {}
  const inRepo = run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root }).ok
  const range = inRepo ? resolveRange(root, since) : null
  const label = range ? range.label : 'not a git repository'

  const commits = range
    ? git(root, ['log', '--no-merges', '--date=short', '--format=%h %ad %an: %s', ...range.logArgs])
        .split('\n')
        .filter(Boolean)
    : []
  const stat = range ? git(root, ['diff', '--stat=120', ...range.diffArgs]) : ''
  let diff = range
    ? git(root, [
        'diff',
        ...range.diffArgs,
        '--',
        '.',
        ':!package-lock.json',
        ':!*.lock',
        ':!dist',
        ':!coverage',
      ])
    : ''
  let diffTruncated = false
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… diff truncated (${diff.length - MAX_DIFF_CHARS} more characters)`
    diffTruncated = true
  }

  const env = process.env
  return {
    project: { name: pkg.name, version: pkg.version, description: pkg.description },
    architecture: config.architecture,
    templates: config.templates ?? [],
    git: {
      range: range ? range.logArgs.join(' ') : null,
      label,
      branch: inRepo ? git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) : null,
      head: inRepo ? git(root, ['rev-parse', '--short', 'HEAD']) : null,
      commits,
      stat,
      diff,
      diffTruncated,
    },
    build: collectBuildOutput(root),
    ci: {
      provider: env.GITHUB_ACTIONS ? 'github-actions' : env.CI ? 'ci' : 'local',
      repository: env.GITHUB_REPOSITORY ?? null,
      ref: env.GITHUB_REF_NAME ?? null,
      event: env.GITHUB_EVENT_NAME ?? null,
      deployUrl: env.RTV_DEPLOY_URL ?? env.DEPLOY_URL ?? null,
      environment: env.RTV_DEPLOY_ENV ?? env.DEPLOY_ENV ?? null,
    },
    generatedAt: new Date().toISOString(),
  }
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

/** Markdown rendering of the context, used as the user message. */
export function renderContext(ctx) {
  const lines = [
    '# Deployment context',
    '',
    `- Project: ${ctx.project.name ?? 'unknown'} v${ctx.project.version ?? '?'}${ctx.project.description ? ` — ${ctx.project.description}` : ''}`,
    `- Architecture: ${ctx.architecture}; design templates: ${ctx.templates.join(', ') || 'none'}`,
    `- Git: branch ${ctx.git.branch ?? '?'} at ${ctx.git.head ?? '?'}; changes ${ctx.git.label}`,
    `- CI: ${ctx.ci.provider}${ctx.ci.repository ? ` (${ctx.ci.repository}` + (ctx.ci.ref ? ` @ ${ctx.ci.ref}` : '') + `)` : ''}${ctx.ci.event ? `, event ${ctx.ci.event}` : ''}`,
  ]
  if (ctx.ci.deployUrl)
    lines.push(
      `- Deployment URL: ${ctx.ci.deployUrl}${ctx.ci.environment ? ` (${ctx.ci.environment})` : ''}`,
    )
  lines.push('', '## Commits', '')
  lines.push(
    ctx.git.commits.length
      ? ctx.git.commits.map((c) => `- ${c}`).join('\n')
      : '_No commits in range._',
  )
  if (ctx.git.stat) lines.push('', '## Changed files', '', '```', ctx.git.stat, '```')
  if (ctx.build) {
    lines.push(
      '',
      '## Build output (dist/)',
      '',
      `Total: ${kb(ctx.build.total.bytes)} (${kb(ctx.build.total.gzip)} gzip) across ${ctx.build.files.length} files.`,
      '',
      '| File | Size | Gzip |',
      '| --- | --- | --- |',
    )
    for (const f of ctx.build.files.slice(0, 25))
      lines.push(`| ${f.file} | ${kb(f.bytes)} | ${kb(f.gzip)} |`)
  } else {
    lines.push(
      '',
      '## Build output',
      '',
      '_No dist/ folder found; run `npm run build` first for bundle-size insights._',
    )
  }
  if (ctx.git.diff)
    lines.push(
      '',
      `## Diff${ctx.git.diffTruncated ? ' (truncated)' : ''}`,
      '',
      '```diff',
      ctx.git.diff,
      '```',
    )
  return lines.join('\n')
}

/* ------------------------------------------------------------------ prompt */

export const DEFAULT_SYSTEM_PROMPT = `You are the release engineer for a React + TypeScript + Vite front-end project. You receive the context of a deployment (commits, diff, build output, project shape) and write a concise deployment report in Markdown for the team.

Structure the report with these sections and keep each one short:
1. **Summary** — two or three sentences on what this deployment changes for users.
2. **Release notes** — user-facing bullets grouped as Added / Changed / Fixed / Removed (skip empty groups).
3. **Risk assessment** — rate Low / Medium / High and justify it: breaking changes, dependency bumps, config or build changes, areas without tests.
4. **Bundle** — comment on the build output sizes if present (notable growth, large chunks).
5. **Verify after deploy** — a checklist of five or fewer concrete things to click or check in the deployed app.
6. **Follow-ups** — technical debt or cleanup worth a ticket, if any.

Rules: base every statement on the provided context; say "not enough information" instead of guessing; never invent commits, files or features; use plain language a product manager understands; do not restate the diff.`

export function loadSystemPrompt(root) {
  const file = path.join(root, PROMPT_FILE)
  if (!exists(file)) return DEFAULT_SYSTEM_PROMPT
  const text = readText(file)
  // Allow front matter on the prompt file; the body is the prompt.
  const stripped = text.startsWith('---') ? text.slice(text.indexOf('\n---', 3) + 4) : text
  return stripped.trim() || DEFAULT_SYSTEM_PROMPT
}

/* -------------------------------------------------------------- generation */

/**
 * @param {{ system: string, user: string, mode?: 'auto'|'api'|'cli', model?: string, effort?: string, maxTokens?: number, cwd?: string }} options
 * @returns {Promise<{ text: string, mode: string, model: string }>}
 */
export async function generateInsights({
  system,
  user,
  mode = 'auto',
  model = DEFAULT_MODEL,
  effort = DEFAULT_EFFORT,
  maxTokens = DEFAULT_MAX_TOKENS,
  cwd = process.cwd(),
}) {
  let chosen = mode
  if (mode === 'auto') {
    if (process.env.ANTHROPIC_API_KEY && (await sdkAvailable())) chosen = 'api'
    else if (commandExists('claude')) chosen = 'cli'
    else if (await sdkAvailable()) chosen = 'api'
    else {
      throw new CliError('No way to reach Claude was found.', {
        hint: 'Install the Claude Code CLI (npm i -g @anthropic-ai/claude-code) or the SDK (npm i -D @anthropic-ai/sdk) and set ANTHROPIC_API_KEY.',
      })
    }
  }
  const text =
    chosen === 'cli'
      ? runCli({ system, user, model, cwd })
      : await runApi({ system, user, model, effort, maxTokens })
  return { text, mode: chosen, model }
}

async function sdkAvailable() {
  try {
    await import('@anthropic-ai/sdk')
    return true
  } catch {
    return false
  }
}

async function runApi({ system, user, model, effort, maxTokens }) {
  let Anthropic
  try {
    ;({ default: Anthropic } = await import('@anthropic-ai/sdk'))
  } catch {
    throw new CliError('The Anthropic SDK is not installed.', {
      hint: 'Run `npm i -D @anthropic-ai/sdk` (the setup wizard does this when Claude insights are enabled).',
    })
  }
  const client = new Anthropic()
  const request = {
    model,
    max_tokens: maxTokens,
    system,
    output_config: { effort },
    messages: [{ role: 'user', content: user }],
  }
  let response
  try {
    // Server-side refusal fallbacks: if a safety classifier declines, the API
    // re-runs the request on Anthropic's recommended fallback model.
    response = await client.beta.messages.create({
      ...request,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    })
  } catch (error) {
    if (
      error instanceof Anthropic.BadRequestError &&
      /fallbacks|effort|output_config/i.test(error.message)
    ) {
      // Older models do not accept these parameters; retry with the plain request.
      const plain = { ...request }
      delete plain.output_config
      response = await client.messages.create(plain)
    } else {
      throw describeApiError(error, Anthropic)
    }
  }
  if (response.stop_reason === 'refusal') {
    const details = response.stop_details
      ? ` (${response.stop_details.category ?? 'unspecified'}: ${response.stop_details.explanation ?? ''})`
      : ''
    throw new CliError(`Claude declined to generate the report${details}.`)
  }
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
  if (!text) throw new CliError('Claude returned an empty report.')
  return text
}

function describeApiError(error, Anthropic) {
  if (error instanceof Anthropic.AuthenticationError) {
    return new CliError('Authentication with the Claude API failed.', {
      hint: 'Set ANTHROPIC_API_KEY (locally or as a CI secret).',
    })
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new CliError('The Claude API rate limit was hit. Try again in a moment.')
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new CliError(`Could not reach the Claude API: ${error.message}`)
  }
  if (error instanceof Anthropic.APIError) {
    return new CliError(`Claude API error ${error.status}: ${error.message}`)
  }
  return error
}

function runCli({ system, user, model, cwd }) {
  if (!commandExists('claude')) {
    throw new CliError('The Claude Code CLI (`claude`) is not installed.', {
      hint: 'npm i -g @anthropic-ai/claude-code, or use --mode api.',
    })
  }
  const args = [
    '-p',
    '--output-format',
    'text',
    '--model',
    model,
    '--append-system-prompt',
    system,
    '--allowedTools',
    'Read,Grep,Glob,Bash(git log:*),Bash(git diff:*),Bash(git show:*)',
  ]
  const result = run('claude', args, { cwd, input: `${user}\n\nWrite the deployment report now.` })
  if (!result.ok) {
    throw new CliError(
      `claude exited with status ${result.status}: ${result.stderr || result.stdout}`.trim(),
    )
  }
  return result.stdout.trim()
}

/* ------------------------------------------------------------------ output */

export function writeReport(root, text, { out = REPORT_FILE } = {}) {
  const file = path.isAbsolute(out) ? out : path.join(root, out)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${text.trim()}\n`)
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\n## Claude deployment insights\n\n${text.trim()}\n`,
    )
  }
  return file
}
