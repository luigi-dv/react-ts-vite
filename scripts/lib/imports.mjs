// Dependency-direction checker.
//
// Scans every module under src/, resolves its imports (aliases and relative
// paths) to project paths, maps both ends to architecture layers and verifies
// the layer rules declared in the architecture catalogue. Zero dependencies:
// a small comment-aware scanner is all that is needed for import specifiers.
import fs from 'node:fs'
import path from 'node:path'

import { ROOT_LAYER, layerOf } from './architectures.mjs'
import { listFiles } from './fs.mjs'
import { relativeTo } from './paths.mjs'

export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']
const IGNORE_TOKEN = 'rtv-ignore'

/**
 * Replace comments (and the contents of non-import strings) with spaces,
 * keeping line breaks so positions stay stable.
 */
export function blankComments(source) {
  let out = ''
  let i = 0
  let state = 'code' // code | line | block | single | double | template
  let keepString = false
  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]
    switch (state) {
      case 'code':
        if (ch === '/' && next === '/') {
          state = 'line'
          out += '  '
          i += 2
        } else if (ch === '/' && next === '*') {
          state = 'block'
          out += '  '
          i += 2
        } else {
          if (ch === "'") state = 'single'
          else if (ch === '"') state = 'double'
          else if (ch === '`') state = 'template'
          if (state !== 'code')
            keepString =
              state !== 'template' &&
              /(?:\bfrom|\bimport|\bimport\s*\(|\brequire\s*\()\s*$/.test(out)
          out += ch
          i++
        }
        break
      case 'line':
        if (ch === '\n') {
          state = 'code'
          out += ch
        } else out += ' '
        i++
        break
      case 'block':
        if (ch === '*' && next === '/') {
          state = 'code'
          out += '  '
          i += 2
        } else {
          out += ch === '\n' ? '\n' : ' '
          i++
        }
        break
      default: {
        // Inside a string literal. Only import specifiers keep their text; any
        // other string is blanked so `from "x"` inside prose is never scanned.
        const quote = state === 'single' ? "'" : state === 'double' ? '"' : '`'
        if (ch === '\\') {
          out += keepString ? ch + (next ?? '') : '  '
          i += 2
        } else if (ch === quote || (state !== 'template' && ch === '\n')) {
          state = 'code'
          out += ch
          i++
        } else {
          out += keepString || ch === '\n' ? ch : ' '
          i++
        }
      }
    }
  }
  return out
}

const PATTERNS = [
  { kind: 'from', re: /\bfrom\s*(['"])([^'"\n]+)\1/g },
  { kind: 'side-effect', re: /\bimport\s*(['"])([^'"\n]+)\1/g },
  { kind: 'dynamic', re: /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g },
  { kind: 'require', re: /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g },
]

/**
 * Extract import specifiers with their line numbers.
 * A line containing `rtv-ignore` (usually in a trailing comment) is skipped.
 * @returns {{ specifier: string, line: number, kind: string }[]}
 */
export function scanImports(source) {
  const code = blankComments(source)
  const originalLines = source.split('\n')
  const results = []
  const seen = new Set()
  for (const { kind, re } of PATTERNS) {
    re.lastIndex = 0
    let match
    while ((match = re.exec(code))) {
      const line = code.slice(0, match.index).split('\n').length
      const key = `${line}:${match[2]}`
      if (seen.has(key)) continue
      seen.add(key)
      const text = originalLines[line - 1] ?? ''
      const previous = originalLines[line - 2] ?? ''
      if (
        text.includes(IGNORE_TOKEN) ||
        (previous.trim().startsWith('//') && previous.includes(IGNORE_TOKEN))
      )
        continue
      results.push({ specifier: match[2], line, kind })
    }
  }
  return results.sort((a, b) => a.line - b.line)
}

/**
 * Resolve an import specifier to a project-relative posix path, or null for
 * external packages.
 * @param {string} specifier
 * @param {string} fileRel project-relative posix path of the importing file
 * @param {Record<string, string>} aliases
 */
export function resolveSpecifier(specifier, fileRel, aliases) {
  const clean = specifier.split('?')[0]
  if (clean.startsWith('./') || clean.startsWith('../')) {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fileRel), clean))
    return resolved.startsWith('..') ? null : resolved
  }
  const names = Object.keys(aliases).sort((a, b) => b.length - a.length)
  for (const name of names) {
    if (clean === name || clean.startsWith(`${name}/`)) {
      const target = aliases[name].replace(/^\.\//, '')
      const rest = clean.slice(name.length)
      return path.posix.normalize(`${target}${rest}`)
    }
  }
  return null
}

/** Accept `"a>b"` strings or `[a, b]` pairs. */
export function parseAllowList(allow = []) {
  return allow.map((entry) => {
    if (Array.isArray(entry)) return { from: entry[0], to: entry[1] }
    const [from, to] = String(entry)
      .split('>')
      .map((s) => s.trim())
    return { from, to }
  })
}

/**
 * Check every source module under `src/` against the architecture rules.
 * @param {{ root: string, arch: object, aliases: Record<string,string>, allow?: any[], files?: string[] }} options
 */
export function checkImports({ root, arch, aliases, allow = [], files, readFile }) {
  const read = readFile ?? ((file) => fs.readFileSync(file, 'utf8'))
  const sources = files ?? listFiles(path.join(root, 'src'), { extensions: SOURCE_EXTENSIONS })
  const allowed = parseAllowList(allow)
  const violations = []
  const warnings = []
  const warnedDirs = new Set()
  let importsChecked = 0

  for (const file of sources) {
    const rel = relativeTo(root, file)
    const from = layerOf(rel, arch)
    if (from.id === null) {
      const top = rel.split('/').slice(0, 2).join('/')
      if (!warnedDirs.has(top)) {
        warnedDirs.add(top)
        warnings.push({
          file: rel,
          message: `\`${top}/\` is not a folder of the ${arch.title} architecture. Move it into a layer or add it to the catalogue.`,
        })
      }
      continue
    }
    const isLayerRootFile =
      path.posix.dirname(rel) === from.layer?.path &&
      /^(index\.[cm]?[jt]sx?|README\.md)$/.test(path.posix.basename(rel))
    if (from.layer?.warnUncategorized && !isLayerRootFile) {
      warnings.push({
        file: rel,
        message: `uncategorised component — move it into ${arch.layers
          .filter((l) => l.path.startsWith(`${from.layer.path}/`))
          .map((l) => `\`${l.id}\``)
          .join(', ')}.`,
      })
    }
    if (from.id === ROOT_LAYER || from.layer.mayImport.includes('*')) continue

    for (const imp of scanImports(read(file))) {
      const target = resolveSpecifier(imp.specifier, rel, aliases)
      if (!target) continue
      importsChecked++
      const to = layerOf(target, arch)
      const record = (rule, message) =>
        violations.push({
          file: rel,
          line: imp.line,
          specifier: imp.specifier,
          from: from.id,
          to: to.id,
          rule,
          message,
        })

      if (to.id === null) continue // e.g. a stray file; nothing to enforce
      if (to.id === ROOT_LAYER) {
        record('upward', `\`${from.id}\` must not import the composition root (${target}).`)
        continue
      }
      if (to.id === from.id) {
        if (from.layer.sliced) {
          // Inside one slice anything goes; across slices the layer's policy decides.
          if (from.slice && to.slice && from.slice !== to.slice) {
            if (from.layer.crossSlice === 'forbid') {
              record(
                'cross-slice',
                `slices on \`${from.id}\` are isolated: \`${from.slice}\` must not import \`${to.slice}\`. Share through a lower layer.`,
              )
            } else if (
              from.layer.crossSlice === 'public-api' &&
              !isPublicApi(target, from.layer.path, to.slice)
            ) {
              record(
                'public-api',
                `import \`${to.slice}\` through its public API (\`@${from.id}/${to.slice}\`), not its internals.`,
              )
            }
          }
        } else if (!from.layer.mayImport.includes(from.id)) {
          record('layer', `\`${from.id}\` modules must not import each other.`)
        }
        continue
      }
      const permitted =
        from.layer.mayImport.includes(to.id) ||
        allowed.some((a) => a.from === from.id && a.to === to.id)
      if (!permitted) {
        record(
          'layer',
          `\`${from.id}\` may import from ${from.layer.mayImport.map((id) => `\`${id}\``).join(', ') || 'nothing'}, not \`${to.id}\`.`,
        )
      }
    }
  }

  return { violations, warnings, filesScanned: sources.length, importsChecked }
}

function isPublicApi(target, layerPath, slice) {
  const base = `${layerPath}/${slice}`
  return target === base || /^index(\.[cm]?[jt]sx?)?$/.test(target.slice(base.length + 1))
}

/** Human-readable report. */
export function formatReport(result, { color } = {}) {
  const c = color ?? {
    red: (s) => s,
    yellow: (s) => s,
    dim: (s) => s,
    bold: (s) => s,
    green: (s) => s,
  }
  const lines = []
  for (const v of result.violations) {
    lines.push(
      `${c.red('✖')} ${c.bold(`${v.file}:${v.line}`)} ${c.dim(`import '${v.specifier}'`)}\n    ${v.message}`,
    )
  }
  for (const w of result.warnings) {
    lines.push(`${c.yellow('▲')} ${c.bold(w.file)}\n    ${w.message}`)
  }
  const summary = `${result.filesScanned} files, ${result.importsChecked} internal imports, ${result.violations.length} violation(s), ${result.warnings.length} warning(s)`
  lines.push(result.violations.length ? c.red(summary) : c.green(summary))
  return lines.join('\n')
}
