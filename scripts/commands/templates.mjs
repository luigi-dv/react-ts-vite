// `rtv templates` — add or remove design templates (pages).
import { syncAgent } from '../lib/agent.mjs'
import { getArchitecture } from '../lib/architectures.mjs'
import { CliError, c, info, log, setQuiet, success, table, warn } from '../lib/cli.mjs'
import { loadConfig, saveConfig } from '../lib/config.mjs'
import { findProjectRoot, relativeTo } from '../lib/paths.mjs'
import {
  applyTemplate,
  getTemplate,
  listTemplates,
  removeExampleComponent,
  removeTemplate,
  writeApp,
} from '../lib/templates.mjs'

export const help = `${c.bold('rtv templates')} — design templates (Tailwind + Headless UI + Heroicons pages)

  rtv templates list                 List templates and which are applied
  rtv templates add <id…>            Copy templates into the pages folder, add smoke tests, generate App.tsx
      --force                        Overwrite existing files
      --remove-example               Also delete the starter ExampleComponent
  rtv templates remove <id…>         Delete a template's page folder and test, regenerate App.tsx
  rtv templates apply                Regenerate App.tsx and missing files for the applied templates
`

export default async function command({ positionals, flags }) {
  if (flags.quiet) setQuiet(true)
  const [action = 'list', ...ids] = positionals
  const root = findProjectRoot()
  const config = loadConfig(root)
  const arch = getArchitecture(config.architecture)

  switch (action) {
    case 'list': {
      const templates = listTemplates(root)
      log(c.bold('\nDesign templates'))
      log(
        table(
          templates.map((t) => [
            config.templates.includes(t.id) ? c.green(`■ ${t.id}`) : c.dim(`□ ${t.id}`),
            c.bold(t.title),
            c.dim(t.description),
          ]),
        ),
      )
      info(`Pages folder: ${arch.roles.pages}/ · add with \`npm run templates -- add <id>\``)
      return
    }
    case 'add': {
      if (!ids.length)
        throw new CliError('Missing template id(s).', { hint: 'Run `npm run templates -- list`.' })
      const applied = [...config.templates]
      for (const id of ids) {
        const template = getTemplate(root, id)
        const result = applyTemplate({ root, arch, template, force: Boolean(flags.force) })
        for (const file of result.written) log(`  ${c.green('+')} ${relativeTo(root, file)}`)
        if (!applied.includes(id)) applied.push(id)
      }
      finish(root, config, arch, applied, {
        force: Boolean(flags.force),
        removeExample: Boolean(flags.removeExample),
      })
      success(`Applied: ${ids.join(', ')}.`)
      return
    }
    case 'remove': {
      if (!ids.length) throw new CliError('Missing template id(s).')
      let applied = [...config.templates]
      for (const id of ids) {
        const template = getTemplate(root, id)
        for (const file of removeTemplate({ root, arch, template }))
          log(`  ${c.red('−')} ${relativeTo(root, file)}`)
        applied = applied.filter((t) => t !== id)
      }
      finish(root, config, arch, applied, {})
      success(`Removed: ${ids.join(', ')}.`)
      return
    }
    case 'apply': {
      for (const id of config.templates) {
        const result = applyTemplate({
          root,
          arch,
          template: getTemplate(root, id),
          force: Boolean(flags.force),
        })
        for (const file of result.written) log(`  ${c.green('+')} ${relativeTo(root, file)}`)
      }
      finish(root, config, arch, config.templates, { force: Boolean(flags.force) })
      success('Templates are up to date.')
      return
    }
    default:
      throw new CliError(`Unknown templates action "${action}".`, {
        hint: 'Use list, add <id…>, remove <id…> or apply.',
      })
  }
}

/** Persist the template list, regenerate App.tsx and the agent rules. */
export function finish(root, config, arch, applied, { force = false, removeExample = false } = {}) {
  const next = { ...config, templates: applied }
  saveConfig(root, next)
  if (removeExample) {
    for (const file of removeExampleComponent(root, arch))
      log(`  ${c.red('−')} ${relativeTo(root, file)}`)
  }
  const templates = applied.map((id) => getTemplate(root, id))
  const app = writeApp({ root, templates, force, arch })
  for (const file of app.written) log(`  ${c.green('✎')} ${relativeTo(root, file)}`)
  if (app.skipped)
    warn(
      `${relativeTo(root, app.skipped)} looks hand-written and was left alone. Wire the page(s) yourself or re-run with --force.`,
    )
  if (!applied.length)
    info('No templates applied; App.tsx renders the starter example or a placeholder.')
  syncAgent(root, next)
  return next
}
