// `rtv setup` — the project wizard. Picks an architecture, design templates and
// whether Claude should run on deployment, then applies everything in one go.
// Every question has a flag so the wizard also works in CI (`--yes`).
import fs from 'node:fs'
import path from 'node:path'

import { syncAgent } from '../lib/agent.mjs'
import { applyArchitecture, scaffoldArchitecture } from '../lib/architecture-apply.mjs'
import { ARCHITECTURES, getArchitecture } from '../lib/architectures.mjs'
import {
  CliError,
  banner,
  c,
  confirm,
  info,
  isInteractive,
  listFlag,
  log,
  multiselect,
  select,
  setQuiet,
  step,
  success,
  table,
  warn,
} from '../lib/cli.mjs'
import { loadConfig, saveConfig } from '../lib/config.mjs'
import { exists, readJson, readText, run, writeJson, writeText } from '../lib/fs.mjs'
import { DEFAULT_MODEL } from '../lib/insights.mjs'
import { PACKAGE_ROOT, findProjectRoot, relativeTo } from '../lib/paths.mjs'
import {
  applyTemplate,
  getTemplate,
  listTemplates,
  removeExampleComponent,
  removeTemplate,
  writeApp,
} from '../lib/templates.mjs'

export const WORKFLOW_FILE = '.github/workflows/claude-deploy-insights.yml'
export const WORKFLOW_TEMPLATE = 'templates/project/claude-deploy-insights.yml'
export const SDK_PACKAGE = '@anthropic-ai/sdk'
export const SDK_VERSION = '^0.135.0'
const WORKFLOW_MARK = '# rtv:generated'

export const help = `${c.bold('rtv setup')} — interactive project setup

  Walks through three decisions and applies them:
    1. Architecture          --arch <${ARCHITECTURES.map((a) => a.id).join('|')}>
    2. Design templates      --templates <id,id,…> | --no-templates
    3. Claude on deployment  --claude-insights | --no-claude-insights   [--model <id>]

  Other options
    --remove-example / --keep-example   Delete the starter ExampleComponent when templates are added
    --force                             Overwrite existing template files and App.tsx
    --install                           Run npm install when new dependencies were added
    -y, --yes                           Accept defaults for anything not passed as a flag
    --quiet                             Only print warnings and errors

  Examples
    npm run setup
    npm run setup -- --arch fsd --templates dashboard,auth --claude-insights --yes
`

export default async function command({ flags }) {
  if (flags.quiet) setQuiet(true)
  const yes = Boolean(flags.yes || flags.y)
  const root = findProjectRoot()
  if (!exists(path.join(root, 'package.json'))) {
    throw new CliError('No package.json found.', {
      hint: 'Run setup inside a project, or scaffold one with `npx react-ts-vite create <dir>`.',
    })
  }
  const config = loadConfig(root)
  banner('react-ts-vite · project setup', 'Design tool × React × Architecture × Cleanliness')

  /* ------------------------------------------------------------ questions */

  const archId = await decide({
    flag: flags.arch,
    yes,
    fallback: config.architecture,
    validate: (id) => getArchitecture(String(id)).id,
    prompt: () =>
      select({
        message: 'Which architecture should organise src/?',
        choices: ARCHITECTURES.map((a) => ({
          value: a.id,
          title: `${a.title} — ${a.subtitle}`,
          description: a.tagline,
        })),
        initial: config.architecture,
        flag: 'arch',
      }),
  })

  const available = listTemplates(root)
  const templateIds = await decide({
    flag: flags.templates,
    yes,
    fallback: config.templates,
    validate: (value) => {
      const ids = value === false ? [] : listFlag(value)
      for (const id of ids) getTemplate(root, id)
      return ids
    },
    prompt: () =>
      multiselect({
        message:
          'Which design templates should be added as pages? (the first one becomes the home route)',
        choices: available.map((t) => ({
          value: t.id,
          title: t.title,
          description: t.description,
        })),
        initial: config.templates,
        flag: 'templates',
      }),
  })

  const insights = await decide({
    flag: flags.claudeInsights,
    yes,
    fallback: config.claude.deploymentInsights,
    validate: Boolean,
    prompt: () =>
      confirm({
        message:
          'Run Claude on deployment to generate release notes, a risk assessment and a verification checklist?',
        initial: config.claude.deploymentInsights,
        flag: 'claude-insights',
      }),
  })
  const model = flags.model ? String(flags.model) : config.claude.model || DEFAULT_MODEL

  const currentArch = getArchitecture(config.architecture)
  const exampleDir = path.join(root, currentArch.roles.components, 'ExampleComponent')
  let removeExample = false
  if (templateIds.length && exists(exampleDir)) {
    removeExample = await decide({
      flag: flags.keepExample ? false : flags.removeExample,
      yes,
      fallback: true,
      validate: Boolean,
      prompt: () =>
        confirm({
          message: 'Remove the starter ExampleComponent? The selected templates replace it.',
          initial: true,
          flag: 'remove-example',
        }),
    })
  }

  /* -------------------------------------------------------------- summary */

  step('Summary')
  log(
    table([
      [
        c.dim('Architecture'),
        `${c.bold(archId)}${archId !== config.architecture ? c.yellow(`  (was ${config.architecture})`) : ''}`,
      ],
      [c.dim('Design templates'), templateIds.length ? templateIds.join(', ') : c.dim('none')],
      [
        c.dim('Claude on deployment'),
        insights ? `${c.green('enabled')} ${c.dim(`(${model})`)}` : c.dim('disabled'),
      ],
      [c.dim('Starter example'), templateIds.length ? (removeExample ? 'remove' : 'keep') : 'keep'],
    ]),
  )
  if (!yes && isInteractive()) {
    const ok = await confirm({ message: 'Apply these choices?', initial: true })
    if (!ok) {
      warn('Nothing was changed.')
      return
    }
  }

  /* ---------------------------------------------------------------- apply */

  step('Architecture')
  let current = config
  if (archId !== config.architecture) {
    const result = applyArchitecture({ root, config, targetId: archId })
    for (const m of result.moved)
      log(`  ${c.green('↪')} ${relativeTo(root, m.from)} → ${relativeTo(root, m.to)}`)
    for (const f of result.created) log(`  ${c.green('+')} ${relativeTo(root, f)}`)
    current = result.config
    success(`Switched to ${archId}.`)
  } else {
    const created = scaffoldArchitecture(root, getArchitecture(archId))
    for (const f of created) log(`  ${c.green('+')} ${relativeTo(root, f)}`)
    success(`Architecture ${archId} ${created.length ? 'scaffolded' : 'already in place'}.`)
  }
  const arch = getArchitecture(archId)

  step('Design templates')
  for (const id of config.templates.filter((t) => !templateIds.includes(t))) {
    for (const file of removeTemplate({ root, arch, template: getTemplate(root, id) }))
      log(`  ${c.red('−')} ${relativeTo(root, file)}`)
  }
  for (const id of templateIds) {
    const result = applyTemplate({
      root,
      arch,
      template: getTemplate(root, id),
      force: Boolean(flags.force),
    })
    for (const file of result.written) log(`  ${c.green('+')} ${relativeTo(root, file)}`)
  }
  current = { ...current, templates: templateIds }
  if (removeExample)
    for (const file of removeExampleComponent(root, arch))
      log(`  ${c.red('−')} ${relativeTo(root, file)}`)
  const app = writeApp({
    root,
    templates: templateIds.map((id) => getTemplate(root, id)),
    force: Boolean(flags.force),
    arch,
  })
  for (const file of app.written) log(`  ${c.green('✎')} ${relativeTo(root, file)}`)
  if (app.skipped)
    warn(
      `${relativeTo(root, app.skipped)} looks hand-written and was kept. Wire the pages yourself or re-run with --force.`,
    )
  if (templateIds.length) {
    success(
      `${templateIds.length} template(s) applied; pages live in ${arch.roles.pages}/ with smoke tests in __tests__/pages/.`,
    )
  } else {
    info('No templates selected; App.tsx renders the starter example or a placeholder.')
  }

  step('Claude deployment insights')
  current = { ...current, claude: { ...current.claude, deploymentInsights: insights, model } }
  let needsInstall = false
  if (insights) {
    needsInstall = enableInsights(root) || needsInstall
    success(
      `Enabled. The workflow runs on releases, successful deployments and manual dispatch using model ${model}.`,
    )
    info(
      `Add an ${c.bold('ANTHROPIC_API_KEY')} repository secret; without it the workflow skips itself. Locally: \`npm run deploy:insights\`.`,
    )
  } else {
    disableInsights(root)
    info('Disabled. Enable later with `npm run setup -- --claude-insights`.')
  }
  saveConfig(root, current)

  step('AI-agent instructions')
  const synced = syncAgent(root, current)
  success(
    `.agent/ synced (${synced.skills.length} skills) → AGENTS.md, CLAUDE.md imports, .claude/skills, .cursor/rules, copilot-instructions.`,
  )

  if (needsInstall) {
    const install =
      flags.install === true ||
      (!yes &&
        isInteractive() &&
        (await confirm({ message: 'Run npm install now?', initial: true })))
    if (install) {
      info('Installing dependencies…')
      const result = run('npm', ['install'], { cwd: root, inherit: true })
      if (!result.ok) warn('npm install failed; run it manually.')
    } else {
      warn('package.json changed: run `npm install` to pick up new dependencies.')
    }
  }

  log('')
  success(c.bold('Setup complete.'))
  log(
    table([
      [c.dim('Start developing'), 'npm run dev'],
      [
        c.dim('Quality gate'),
        'npm run check   (typecheck · lint · format · arch:check · agent:check · tests)',
      ],
      [c.dim('Change architecture'), 'npm run arch -- apply <id>'],
      [c.dim('Add pages'), 'npm run templates -- add <id>'],
      [
        c.dim('Docs'),
        'docs/architecture.md · docs/design-templates.md · docs/agents.md · docs/deployment-insights.md',
      ],
    ]),
  )
}

/* ------------------------------------------------------------------ helpers */

/** Resolve a decision from a flag, a default (with --yes) or an interactive prompt. */
async function decide({ flag, yes, fallback, validate, prompt }) {
  if (flag !== undefined) {
    try {
      return validate(flag)
    } catch (error) {
      throw new CliError(error.message)
    }
  }
  if (yes || !isInteractive()) {
    if (!yes) {
      // Non-interactive without --yes: be explicit about what happens.
      warn(
        `Not a terminal: using default (${JSON.stringify(fallback)}). Pass flags or --yes to silence this.`,
      )
    }
    return fallback
  }
  return prompt()
}

/** Copy the workflow and add the SDK dev dependency. Returns true when package.json changed. */
export function enableInsights(root) {
  const target = path.join(root, WORKFLOW_FILE)
  if (!exists(target)) {
    const source = [
      path.join(root, WORKFLOW_TEMPLATE),
      path.join(PACKAGE_ROOT, WORKFLOW_TEMPLATE),
    ].find(exists)
    if (!source) throw new CliError(`Workflow template ${WORKFLOW_TEMPLATE} not found.`)
    writeText(target, readText(source))
    log(`  ${c.green('+')} ${WORKFLOW_FILE}`)
  }
  const pkgFile = path.join(root, 'package.json')
  const pkg = readJson(pkgFile)
  if (pkg.devDependencies?.[SDK_PACKAGE] || pkg.dependencies?.[SDK_PACKAGE]) return false
  pkg.devDependencies = sortKeys({ ...(pkg.devDependencies ?? {}), [SDK_PACKAGE]: SDK_VERSION })
  writeJson(pkgFile, pkg)
  log(`  ${c.green('+')} package.json devDependencies.${SDK_PACKAGE}`)
  return true
}

/** Remove the generated workflow (only if it is ours). */
export function disableInsights(root) {
  const target = path.join(root, WORKFLOW_FILE)
  if (exists(target) && readText(target).includes(WORKFLOW_MARK)) {
    run('git', ['rm', '-q', '--cached', WORKFLOW_FILE], { cwd: root })
    fs.rmSync(target, { force: true })
    log(`  ${c.red('−')} ${WORKFLOW_FILE}`)
  }
}

const sortKeys = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
