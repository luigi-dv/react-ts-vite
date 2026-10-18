// `rtv agent` — keep the AI-agent instructions in sync with the project.
import path from 'node:path'

import {
  AGENT_DIR,
  checkAgent,
  listRules,
  listSkills,
  listWorkflows,
  syncAgent,
} from '../lib/agent.mjs'
import { CliError, c, error, info, log, setQuiet, success, table } from '../lib/cli.mjs'
import { loadConfig } from '../lib/config.mjs'
import { isDir } from '../lib/fs.mjs'
import { findProjectRoot } from '../lib/paths.mjs'

export const help = `${c.bold('rtv agent')} — AI-agent instructions (.agent/)

  rtv agent sync [--quiet] [--if-project]   Regenerate the architecture rule, AGENTS.md,
                                             .github/copilot-instructions.md, .cursor/rules and
                                             mirror skills into .claude/skills
  rtv agent check                            Fail when any generated file is stale (used by \`npm run check\`)
  rtv agent list                             Show rules, skills and workflows

  --if-project   Exit quietly when not run inside a project (used by the postinstall hook)
`

export default async function command({ positionals, flags }) {
  if (flags.quiet) setQuiet(true)
  const [action = 'list'] = positionals
  const root = findProjectRoot()

  if (flags.ifProject) {
    const initCwd = process.env.INIT_CWD
    const installingAsDependency = initCwd && path.resolve(initCwd) !== path.resolve(root)
    if (installingAsDependency || !isDir(path.join(root, AGENT_DIR))) return
  }

  if (!isDir(path.join(root, AGENT_DIR))) {
    throw new CliError(`No ${AGENT_DIR}/ folder found in ${root}.`, {
      hint: 'Run this inside a project created from react-ts-vite.',
    })
  }
  const config = loadConfig(root)

  switch (action) {
    case 'sync': {
      const result = syncAgent(root, config)
      if (result.written.length === 0 && result.removed.length === 0) {
        success('Agent instructions already in sync.')
      } else {
        for (const file of result.written) log(`  ${c.green('✎')} ${file}`)
        for (const file of result.removed) log(`  ${c.red('✖')} ${file} (stale mirror removed)`)
        success(
          `Synced ${result.skills.length} skills and ${result.written.length} generated files.`,
        )
      }
      return
    }
    case 'check': {
      const problems = checkAgent(root, config)
      if (problems.length) {
        for (const p of problems) error(p)
        throw new CliError(`${problems.length} agent instruction problem(s).`, {
          hint: 'Run `npm run agent:sync` and commit the result.',
        })
      }
      success('Agent instructions are in sync with rtv.config.json and .agent/.')
      return
    }
    case 'list': {
      const rules = listRules(root)
      const skills = listSkills(root)
      const workflows = listWorkflows(root)
      log(c.bold('\nRules (always apply)'))
      log(table(rules.map((r) => [c.cyan(r.id), r.description || r.title])))
      log(c.bold('\nSkills'))
      log(table(skills.map((s) => [c.cyan(s.id), s.description])))
      log(c.bold('\nWorkflows'))
      log(table(workflows.map((w) => [c.cyan(w.id), w.description || w.title])))
      info(
        `Source of truth: ${AGENT_DIR}/ · mirrors: .claude/skills, .claude/commands, AGENTS.md, .github/copilot-instructions.md, .cursor/rules`,
      )
      return
    }
    default:
      throw new CliError(`Unknown agent action "${action}".`, { hint: 'Use sync, check or list.' })
  }
}
