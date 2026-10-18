// `rtv insights` — ask Claude for a deployment report.
import { CliError, c, info, log, setQuiet, step, success } from '../lib/cli.mjs'
import { loadConfig } from '../lib/config.mjs'
import {
  DEFAULT_EFFORT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  REPORT_FILE,
  collectContext,
  generateInsights,
  loadSystemPrompt,
  renderContext,
  writeReport,
} from '../lib/insights.mjs'
import { findProjectRoot, relativeTo } from '../lib/paths.mjs'

export const help = `${c.bold('rtv insights')} — Claude deployment insights

  Collects what changed since the previous release (commits, diff, build output sizes,
  project shape) and asks Claude for a deployment report: summary, release notes,
  risk assessment, bundle notes and a post-deploy checklist.

  Options
    --since <ref>        Git ref to compare against (default: the previous tag)
    --mode <mode>        auto | api | cli     api = @anthropic-ai/sdk, cli = Claude Code (\`claude -p\`)
    --model <id>         Model id (default from rtv.config.json: ${DEFAULT_MODEL})
    --effort <level>     low | medium | high | xhigh | max (api mode, default ${DEFAULT_EFFORT})
    --max-tokens <n>     Output budget (api mode, default ${DEFAULT_MAX_TOKENS})
    --out <file>         Report path (default ${REPORT_FILE}); also appended to GITHUB_STEP_SUMMARY in CI
    --deploy-url <url>   Deployment URL to mention in the report (or RTV_DEPLOY_URL)
    --env <name>         Deployment environment name (or RTV_DEPLOY_ENV)
    --dry-run            Print the prompt sizes and context, call nothing
    --context-only       Print the collected context as Markdown and exit

  Authentication: ANTHROPIC_API_KEY (api mode) or a logged-in Claude Code CLI (cli mode).
`

export default async function command({ flags }) {
  if (flags.quiet) setQuiet(true)
  const root = findProjectRoot()
  const config = loadConfig(root)
  if (flags.deployUrl) process.env.RTV_DEPLOY_URL = String(flags.deployUrl)
  if (flags.env) process.env.RTV_DEPLOY_ENV = String(flags.env)

  const context = collectContext({
    root,
    since: flags.since ? String(flags.since) : undefined,
    config,
  })
  const user = renderContext(context)
  const system = loadSystemPrompt(root)

  if (flags.contextOnly) {
    log(user)
    return
  }

  step(
    `Deployment insights for ${context.project.name ?? 'project'} v${context.project.version ?? '?'} (${context.git.label})`,
  )
  info(
    `${context.git.commits.length} commits · ${context.build ? `${context.build.files.length} build files` : 'no dist/ (run npm run build for bundle insights)'} · ${(user.length / 1024).toFixed(1)} kB of context`,
  )

  if (flags.dryRun) {
    log(c.dim('\n--- system prompt ---'))
    log(system)
    log(c.dim('\n--- user message (first 40 lines) ---'))
    log(user.split('\n').slice(0, 40).join('\n'))
    info('Dry run: Claude was not called.')
    return
  }

  const model = flags.model ? String(flags.model) : config.claude?.model || DEFAULT_MODEL
  const effort = flags.effort ? String(flags.effort) : config.claude?.effort || DEFAULT_EFFORT
  const maxTokens = flags.maxTokens ? Number(flags.maxTokens) : DEFAULT_MAX_TOKENS
  if (!Number.isInteger(maxTokens) || maxTokens < 256)
    throw new CliError('--max-tokens must be an integer ≥ 256.')
  const mode = flags.mode ? String(flags.mode) : 'auto'
  if (!['auto', 'api', 'cli'].includes(mode))
    throw new CliError(`Unknown mode "${mode}".`, { hint: 'Use auto, api or cli.' })

  info(`Asking Claude (${model}, mode ${mode})…`)
  const result = await generateInsights({ system, user, mode, model, effort, maxTokens, cwd: root })
  const file = writeReport(root, result.text, { out: flags.out ? String(flags.out) : REPORT_FILE })
  log(`\n${result.text}\n`)
  success(`Report written to ${relativeTo(root, file)} (${result.mode} · ${result.model}).`)
}
