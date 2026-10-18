// `rtv arch` — inspect, check and switch the project architecture.
import { syncAgent } from '../lib/agent.mjs'
import { checkTsconfigPaths } from '../lib/aliases.mjs'
import { applyArchitecture, scaffoldArchitecture } from '../lib/architecture-apply.mjs'
import {
  ARCHITECTURES,
  aliasesFor,
  describeArchitecture,
  getArchitecture,
} from '../lib/architectures.mjs'
import {
  CliError,
  c,
  confirm,
  error,
  info,
  isInteractive,
  log,
  setQuiet,
  step,
  success,
  table,
  warn,
} from '../lib/cli.mjs'
import { loadConfig } from '../lib/config.mjs'
import { checkImports, formatReport } from '../lib/imports.mjs'
import { findProjectRoot, relativeTo } from '../lib/paths.mjs'

export const help = `${c.bold('rtv arch')} — project architecture

  rtv arch                      Show the active architecture and the catalogue
  rtv arch list                 List available architectures
  rtv arch current              Describe the active architecture (layers, aliases, rules)
  rtv arch apply <id>           Switch architecture: moves role folders, rewrites aliases, regenerates docs
      --dry-run                 Only print the plan
      -y, --yes                 Skip the confirmation
  rtv arch check [--strict]     Verify import rules and alias sync (--strict fails on warnings too)
  rtv arch scaffold             Create missing layer folders and READMEs for the active architecture

Architectures: ${ARCHITECTURES.map((a) => a.id).join(', ')}
`

export default async function command({ positionals, flags }) {
  if (flags.quiet) setQuiet(true)
  const [action = 'list', target] = positionals
  const root = findProjectRoot()
  const config = loadConfig(root)

  switch (action) {
    case 'list':
      return list(config)
    case 'current':
      log(describeArchitecture(getArchitecture(config.architecture), { heading: '#' }))
      return
    case 'check':
      return check(root, config, { strict: Boolean(flags.strict) })
    case 'scaffold': {
      const written = scaffoldArchitecture(root, getArchitecture(config.architecture))
      for (const file of written) log(`  ${c.green('+')} ${relativeTo(root, file)}`)
      success(
        written.length
          ? `Created ${written.length} file(s).`
          : 'All architecture folders already exist.',
      )
      return
    }
    case 'apply':
      return apply(root, config, target, {
        dryRun: Boolean(flags.dryRun),
        yes: Boolean(flags.yes || flags.y),
      })
    default:
      throw new CliError(`Unknown arch action "${action}".`, {
        hint: 'Use list, current, apply <id>, check or scaffold.',
      })
  }
}

function list(config) {
  log(c.bold('\nArchitectures'))
  log(
    table(
      ARCHITECTURES.map((a) => [
        a.id === config.architecture ? c.green(`● ${a.id}`) : c.dim(`○ ${a.id}`),
        c.bold(a.title),
        c.dim(a.tagline),
      ]),
    ),
  )
  info(
    `Active: ${c.bold(config.architecture)}. Switch with \`npm run arch -- apply <id>\`; inspect with \`npm run arch -- current\`.`,
  )
}

export function check(root, config, { strict = false } = {}) {
  const arch = getArchitecture(config.architecture)
  const aliases = aliasesFor(arch)
  const problems = []

  // 1. The alias map in rtv.config.json must match the architecture, and tsconfig must match the aliases.
  for (const [name, target] of Object.entries(aliases)) {
    if (config.aliases?.[name] !== target)
      problems.push(
        `rtv.config.json: alias "${name}" should point to "${target}" (found ${JSON.stringify(config.aliases?.[name])}).`,
      )
  }
  for (const name of Object.keys(config.aliases ?? {})) {
    if (!(name in aliases))
      problems.push(
        `rtv.config.json: alias "${name}" is not part of the ${arch.title} architecture.`,
      )
  }
  problems.push(...checkTsconfigPaths(root, aliases))
  if (problems.length) {
    for (const p of problems) error(p)
    throw new CliError('Alias configuration is out of sync.', {
      hint: `Run \`npm run arch -- apply ${arch.id}\` to regenerate it.`,
    })
  }

  // 2. Import rules.
  const result = checkImports({ root, arch, aliases, allow: config.rules?.allow ?? [] })
  log(formatReport(result, { color: c }))
  if (result.violations.length) {
    throw new CliError(
      `${result.violations.length} import rule violation(s) in the ${arch.title} architecture.`,
      {
        hint: 'Move the module to the right layer, import through a lower layer, or add an exception to rules.allow in rtv.config.json (e.g. "presentation>infrastructure").',
      },
    )
  }
  if (strict && result.warnings.length) {
    throw new CliError(`${result.warnings.length} warning(s) with --strict.`)
  }
  success(`Architecture "${arch.id}" is respected.`)
}

async function apply(root, config, target, { dryRun, yes }) {
  if (!target)
    throw new CliError('Missing architecture id.', {
      hint: `Choose one of: ${ARCHITECTURES.map((a) => a.id).join(', ')}.`,
    })
  const to = getArchitecture(target)
  const preview = applyArchitecture({ root, config, targetId: to.id, dryRun: true })

  step(`${config.architecture} → ${to.id}  (${to.title}: ${to.tagline})`)
  if (preview.plan.moves.length) {
    log(c.bold('  Moves'))
    log(table(preview.plan.moves.map((m) => [`  ${c.cyan(m.role)}`, m.from, c.dim('→'), m.to])))
  } else {
    log(c.dim('  No folders need to move.'))
  }
  if (preview.plan.create.length) log(`  ${c.bold('Create')}  ${preview.plan.create.join(', ')}`)
  log(`  ${c.bold('Aliases')} ${Object.keys(preview.plan.aliases).join(' ')}`)
  log(c.dim('  tsconfig paths, rtv.config.json, folder READMEs and .agent rules are regenerated.'))

  if (dryRun) {
    info('Dry run: nothing was changed.')
    return
  }
  if (!yes && isInteractive()) {
    const ok = await confirm({ message: 'Apply this architecture?', initial: true })
    if (!ok) {
      warn('Aborted.')
      return
    }
  }

  const result = applyArchitecture({ root, config, targetId: to.id })
  for (const m of result.moved)
    log(`  ${c.green('↪')} ${relativeTo(root, m.from)} → ${relativeTo(root, m.to)}`)
  for (const f of result.created) log(`  ${c.green('+')} ${relativeTo(root, f)}`)
  syncAgent(root, result.config)
  success(`Architecture "${to.id}" applied.`)
  info(
    'Next: `npm run check` (typecheck, lint, arch:check, tests). Relative imports that crossed moved folders may need updating; alias imports keep working.',
  )
}
