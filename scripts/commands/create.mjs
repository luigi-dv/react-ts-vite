// `rtv create <dir>` — scaffold a new project from this package, then run the
// setup wizard inside it. Works from a git clone and from the npm package.
import fs from 'node:fs'
import path from 'node:path'

import {
  CliError,
  banner,
  c,
  confirm,
  info,
  isInteractive,
  log,
  setQuiet,
  step,
  success,
  table,
  warn,
} from '../lib/cli.mjs'
import {
  commandExists,
  copyDir,
  exists,
  isDir,
  readJson,
  readText,
  run,
  writeJson,
  writeText,
} from '../lib/fs.mjs'
import { PACKAGE_ROOT } from '../lib/paths.mjs'

export const help = `${c.bold('rtv create')} — scaffold a new project

  npx react-ts-vite create <dir> [setup options]

  Copies the template into <dir>, resets package.json, initialises git and runs
  the setup wizard (architecture, design templates, Claude insights).

  Options
    --description <text>   package.json description
    --install              Run npm install after setup
    --no-git               Skip git init
    --force                Scaffold into a non-empty directory
    plus every \`rtv setup\` option (--arch, --templates, --claude-insights, --yes, …)
`

// Files that belong to the template repository, not to projects created from it.
const EXCLUDE = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.tmp',
  'deployment-insights.md',
  'LICENSE',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.md',
  '.github/workflows/npm-publish.yml',
  '.claude/settings.local.json',
  // The template's own test suites for the CLI and the raw templates; projects get page smoke tests instead.
  '__tests__/scripts',
  '__tests__/templates',
])

export default async function command({ positionals, flags }) {
  if (flags.quiet) setQuiet(true)
  const [dirArg] = positionals
  if (!dirArg)
    throw new CliError('Missing target directory.', { hint: 'npx react-ts-vite create my-app' })
  const target = path.resolve(dirArg)
  const name = toPackageName(path.basename(target))
  if (isDir(target) && fs.readdirSync(target).length > 0 && !flags.force) {
    throw new CliError(`${target} is not empty.`, {
      hint: 'Choose another directory or pass --force.',
    })
  }

  banner('react-ts-vite · create', `New project "${name}"`)

  step('Copying template files')
  const copied = copyDir(PACKAGE_ROOT, target, {
    filter: (rel) => !EXCLUDE.has(rel),
    overwrite: Boolean(flags.force),
  })
  log(`  ${copied.length} files copied from ${c.dim(PACKAGE_ROOT)}`)

  // npm never publishes `.gitignore`; restore it from the project template.
  const gitignore = path.join(target, '.gitignore')
  if (!exists(gitignore)) {
    const npmignore = path.join(target, '.npmignore')
    if (exists(npmignore)) fs.renameSync(npmignore, gitignore)
    else writeText(gitignore, readText(path.join(target, 'templates/project/gitignore')))
  }

  step('Personalising package.json')
  const pkgFile = path.join(target, 'package.json')
  const pkg = readJson(pkgFile)
  const next = {
    name,
    version: '0.1.0',
    private: true,
    description: flags.description ? String(flags.description) : '',
    type: pkg.type,
    license: 'UNLICENSED',
    engines: pkg.engines,
    scripts: pkg.scripts,
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
  }
  writeJson(pkgFile, next)
  writeText(
    path.join(target, 'README.md'),
    readText(path.join(target, 'templates/project/README.md')).replaceAll('{{name}}', name),
  )
  writeText(
    path.join(target, 'CHANGELOG.md'),
    `# Changelog\n\nAll notable changes to ${name} are documented here.\n\n## [Unreleased]\n\n- Project created from [react-ts-vite](https://github.com/Luigi-DV/react-ts-vite).\n`,
  )
  log(`  name ${c.bold(name)} · version 0.1.0 · private`)

  if (flags.git !== false && commandExists('git') && !isDir(path.join(target, '.git'))) {
    step('Initialising git')
    const result = run('git', ['init', '-q'], { cwd: target })
    log(
      result.ok
        ? `  ${c.green('✔')} git repository initialised`
        : `  ${c.yellow('▲')} git init failed: ${result.stderr}`,
    )
  }

  step('Running setup')
  const previousCwd = process.cwd()
  process.chdir(target)
  try {
    const setup = await import('./setup.mjs')
    await setup.default({ positionals: [], flags: { ...flags, install: false } })
  } finally {
    process.chdir(previousCwd)
  }

  const install =
    flags.install === true ||
    (!flags.yes &&
      !flags.y &&
      isInteractive() &&
      (await confirm({ message: 'Run npm install now?', initial: true })))
  if (install) {
    info('Installing dependencies…')
    const result = run('npm', ['install'], { cwd: target, inherit: true })
    if (!result.ok) warn('npm install failed; run it manually.')
  }

  log('')
  success(c.bold(`Project ready at ${target}`))
  log(
    table([
      [
        c.dim('Next'),
        `cd ${path.relative(previousCwd, target) || '.'}${install ? '' : ' && npm install'}`,
      ],
      ['', 'npm run dev'],
      ['', 'npm run check'],
    ]),
  )
}

export function toPackageName(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9-._~]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
  return cleaned || 'my-app'
}
