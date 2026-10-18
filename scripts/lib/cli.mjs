// Terminal toolkit: argument parsing, colours, logging and interactive prompts
// built on node:readline only (no dependencies). Every prompt has a flag
// equivalent so the CLI can run in CI or be scripted.
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

export class CliError extends Error {
  constructor(message, { hint, exitCode = 1 } = {}) {
    super(message)
    this.name = 'CliError'
    this.hint = hint
    this.exitCode = exitCode
  }
}

/* ------------------------------------------------------------------ colours */

const colourEnabled =
  !process.env.NO_COLOR && (process.env.FORCE_COLOR !== undefined || Boolean(output.isTTY))

const paint = (open, close) => (text) =>
  colourEnabled ? `\u001b[${open}m${text}\u001b[${close}m` : String(text)

export const c = {
  bold: paint(1, 22),
  dim: paint(2, 22),
  italic: paint(3, 23),
  underline: paint(4, 24),
  red: paint(31, 39),
  green: paint(32, 39),
  yellow: paint(33, 39),
  blue: paint(34, 39),
  magenta: paint(35, 39),
  cyan: paint(36, 39),
  gray: paint(90, 39),
}

/* ------------------------------------------------------------------ logging */

let quiet = false
export const setQuiet = (value) => {
  quiet = Boolean(value)
}

export const log = (...parts) => {
  if (!quiet) console.log(...parts)
}
export const info = (message) => log(`${c.blue('ℹ')} ${message}`)
export const success = (message) => log(`${c.green('✔')} ${message}`)
export const warn = (message) => console.warn(`${c.yellow('▲')} ${message}`)
export const error = (message) => console.error(`${c.red('✖')} ${message}`)
export const step = (message) => log(`\n${c.bold(c.cyan('›'))} ${c.bold(message)}`)

const pad = (text, width) => text + ' '.repeat(Math.max(0, width - stripAnsi(text).length))

export function banner(title, subtitle) {
  const width = Math.max(stripAnsi(title).length, stripAnsi(subtitle ?? '').length) + 4
  const line = '─'.repeat(width)
  log(c.cyan(`┌${line}┐`))
  log(c.cyan('│') + pad(`  ${c.bold(title)}`, width) + c.cyan('│'))
  if (subtitle) log(c.cyan('│') + pad(`  ${c.dim(subtitle)}`, width) + c.cyan('│'))
  log(c.cyan(`└${line}┘`))
}

/** Render rows of cells as aligned columns. */
export function table(rows, { indent = '  ', gap = 2 } = {}) {
  const widths = []
  for (const row of rows)
    row.forEach((cell, i) => (widths[i] = Math.max(widths[i] ?? 0, stripAnsi(cell).length)))
  return rows
    .map(
      (row) =>
        indent +
        row
          .map(
            (cell, i) =>
              cell + ' '.repeat(i < row.length - 1 ? widths[i] - stripAnsi(cell).length + gap : 0),
          )
          .join(''),
    )
    .join('\n')
}

export function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return String(text).replace(/\u001b\[[0-9;]*m/g, '')
}

/* ---------------------------------------------------------------- arguments */

/**
 * Parse argv into positionals and flags.
 * Supports `--flag`, `--flag=value`, `--flag value`, `--no-flag`, `-y`.
 * Repeated flags become arrays.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const positionals = []
  const flags = {}
  const set = (key, value) => {
    if (key in flags) flags[key] = [].concat(flags[key], value)
    else flags[key] = value
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1))
      break
    }
    if (arg.startsWith('--')) {
      const body = arg.slice(2)
      const eq = body.indexOf('=')
      if (eq !== -1) {
        set(camel(body.slice(0, eq)), body.slice(eq + 1))
      } else if (body.startsWith('no-')) {
        set(camel(body.slice(3)), false)
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        set(camel(body), argv[++i])
      } else {
        set(camel(body), true)
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (const short of arg.slice(1)) set(short, true)
    } else {
      positionals.push(arg)
    }
  }
  return { positionals, flags }
}

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase())

/** Split a comma separated flag (or repeated flags) into a trimmed list. */
export function listFlag(value) {
  if (value === undefined || value === true || value === false) return []
  return []
    .concat(value)
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean)
}

/* ------------------------------------------------------------------ prompts */

export function isInteractive() {
  return Boolean(input.isTTY && output.isTTY) && !process.env.CI && !process.env.RTV_NON_INTERACTIVE
}

async function ask(question) {
  const rl = readline.createInterface({ input, output })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

function requireInteractive(flag) {
  if (!isInteractive()) {
    throw new CliError(`Missing required option --${flag}.`, {
      hint: `This terminal is not interactive. Pass --${flag} (and --yes to accept defaults), or run the command in a TTY.`,
    })
  }
}

/**
 * @template T
 * @param {{ message: string, choices: {value: T, title: string, description?: string}[], initial?: T, flag?: string }} options
 */
export async function select({ message, choices, initial, flag = 'option' }) {
  requireInteractive(flag)
  log(`\n${c.bold(message)}`)
  choices.forEach((choice, i) => {
    const marker = choice.value === initial ? c.cyan('●') : c.dim('○')
    log(
      `  ${marker} ${c.bold(String(i + 1))}) ${choice.title}${choice.description ? c.dim(` — ${choice.description}`) : ''}`,
    )
  })
  const initialIndex = Math.max(
    0,
    choices.findIndex((ch) => ch.value === initial),
  )
  for (;;) {
    const answer = await ask(c.dim(`  Choose 1-${choices.length} [${initialIndex + 1}]: `))
    if (answer === '') return choices[initialIndex].value
    const n = Number(answer)
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) return choices[n - 1].value
    const byValue = choices.find((ch) => String(ch.value) === answer)
    if (byValue) return byValue.value
    warn(`Please enter a number between 1 and ${choices.length}.`)
  }
}

/**
 * @template T
 * @param {{ message: string, choices: {value: T, title: string, description?: string}[], initial?: T[], flag?: string, allowEmpty?: boolean }} options
 */
export async function multiselect({
  message,
  choices,
  initial = [],
  flag = 'option',
  allowEmpty = true,
}) {
  requireInteractive(flag)
  log(`\n${c.bold(message)}`)
  choices.forEach((choice, i) => {
    const marker = initial.includes(choice.value) ? c.cyan('■') : c.dim('□')
    log(
      `  ${marker} ${c.bold(String(i + 1))}) ${choice.title}${choice.description ? c.dim(` — ${choice.description}`) : ''}`,
    )
  })
  const initialLabel = initial.length
    ? initial.map((v) => choices.findIndex((ch) => ch.value === v) + 1).join(',')
    : 'none'
  for (;;) {
    const answer = await ask(
      c.dim(`  Numbers separated by commas, "all" or "none" [${initialLabel}]: `),
    )
    if (answer === '') return [...initial]
    if (answer === 'none') {
      if (allowEmpty) return []
      warn('Pick at least one option.')
      continue
    }
    if (answer === 'all') return choices.map((ch) => ch.value)
    const picks = answer.split(/[\s,]+/).filter(Boolean)
    const values = []
    let valid = true
    for (const pick of picks) {
      const n = Number(pick)
      const choice = Number.isInteger(n)
        ? choices[n - 1]
        : choices.find((ch) => String(ch.value) === pick)
      if (!choice) {
        valid = false
        break
      }
      if (!values.includes(choice.value)) values.push(choice.value)
    }
    if (valid && (values.length || allowEmpty)) return values
    warn(`Please enter numbers between 1 and ${choices.length}, separated by commas.`)
  }
}

export async function confirm({ message, initial = true, flag = 'yes' }) {
  requireInteractive(flag)
  const answer = await ask(`${c.bold(message)} ${c.dim(initial ? '(Y/n)' : '(y/N)')} `)
  if (answer === '') return initial
  return /^y(es)?$/i.test(answer)
}

export async function text({ message, initial = '', flag = 'value', validate }) {
  requireInteractive(flag)
  for (;;) {
    const answer = await ask(`${c.bold(message)}${initial ? c.dim(` [${initial}]`) : ''}: `)
    const value = answer === '' ? initial : answer
    const problem = validate?.(value)
    if (!problem) return value
    warn(problem)
  }
}
