#!/usr/bin/env node
// react-ts-vite CLI — architecture switching, design templates, AI-agent
// instructions and Claude deployment insights for projects built from this
// template. Zero runtime dependencies.
import { CliError, c, error, log, parseArgs } from '../scripts/lib/cli.mjs'

const COMMANDS = {
  setup: () => import('../scripts/commands/setup.mjs'),
  create: () => import('../scripts/commands/create.mjs'),
  arch: () => import('../scripts/commands/arch.mjs'),
  templates: () => import('../scripts/commands/templates.mjs'),
  agent: () => import('../scripts/commands/agent.mjs'),
  insights: () => import('../scripts/commands/insights.mjs'),
}

const HELP = `${c.bold('react-ts-vite')} — React + TypeScript + Vite + Tailwind starter toolkit

${c.bold('Usage')}
  npx react-ts-vite <command> [options]
  npm run <script> -- [options]          (inside a project)

${c.bold('Commands')}
  create <dir>        Scaffold a new project from the template, then run setup
  setup               Interactive wizard: architecture, design templates, Claude insights
  arch                Architecture catalogue: list | current | apply <id> | check | scaffold
  templates           Design templates: list | add <id…> | remove <id…> | apply
  agent               AI-agent instructions (.agent): sync | check | list
  insights            Claude deployment insights report (see --help for modes)

${c.bold('Global options')}
  -h, --help          Show help for a command
  -y, --yes           Accept defaults, never prompt
  --quiet             Only print warnings and errors

Run ${c.cyan('npx react-ts-vite <command> --help')} for command options.
`

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    log(HELP)
    return
  }
  const loader = COMMANDS[command]
  if (!loader)
    throw new CliError(`Unknown command "${command}".`, {
      hint: 'Run `npx react-ts-vite --help` to list commands.',
    })
  const mod = await loader()
  const args = parseArgs(rest)
  if (args.flags.help || args.flags.h) {
    log(mod.help)
    return
  }
  await mod.default(args)
}

main().catch((err) => {
  if (err instanceof CliError) {
    error(err.message)
    if (err.hint) log(`  ${c.dim(err.hint)}`)
    process.exit(err.exitCode)
  }
  error(err?.stack ?? String(err))
  process.exit(1)
})
