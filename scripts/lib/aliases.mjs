// Keep `tsconfig.app.json#compilerOptions.paths` in sync with the alias map in
// rtv.config.json. Vite reads the map directly (see vite.config.ts); TypeScript
// cannot, so the paths block is regenerated from the same source.
import fs from 'node:fs'
import path from 'node:path'

export const TSCONFIG_FILE = 'tsconfig.app.json'

/** `{ '@/*': ['./src/*'], '@x': ['./src/x'], '@x/*': ['./src/x/*'] }` */
export function tsconfigPaths(aliases) {
  const paths = {}
  for (const [name, target] of Object.entries(aliases)) {
    if (name === '@') {
      paths['@/*'] = [`${target}/*`]
      continue
    }
    paths[name] = [target]
    paths[`${name}/*`] = [`${target}/*`]
  }
  return paths
}

/** Tolerant JSON parser: strips // and /* comments and trailing commas (tsconfig style). */
export function parseJsonc(text) {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inString) {
      out += ch
      if (ch === '\\') out += text[++i] ?? ''
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
    } else if (ch === '/' && next === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
    } else {
      out += ch
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

/**
 * Replace the `"paths": { ... }` block in a tsconfig source text, preserving
 * everything else (including comments). Falls back to a full rewrite when the
 * block cannot be located.
 */
export function replacePathsBlock(source, paths) {
  const keyIndex = source.search(/"paths"\s*:\s*\{/)
  const indentUnit = detectIndent(source)
  if (keyIndex !== -1) {
    const braceStart = source.indexOf('{', keyIndex)
    const braceEnd = matchBrace(source, braceStart)
    if (braceEnd !== -1) {
      const lineStart = source.lastIndexOf('\n', keyIndex) + 1
      const baseIndent = source.slice(lineStart, keyIndex)
      const body = Object.entries(paths)
        .map(([k, v]) => `${baseIndent}${indentUnit}${JSON.stringify(k)}: ${JSON.stringify(v)}`)
        .join(',\n')
      const block = `{\n${body}\n${baseIndent}}`
      return source.slice(0, braceStart) + block + source.slice(braceEnd + 1)
    }
  }
  const json = parseJsonc(source)
  json.compilerOptions = { ...(json.compilerOptions ?? {}), paths }
  return `${JSON.stringify(json, null, indentUnit.length || 2)}\n`
}

function detectIndent(source) {
  const match = source.match(/\n([ \t]+)"/)
  return match ? match[1] : '  '
}

function matchBrace(text, start) {
  let depth = 0
  let inString = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return i
  }
  return -1
}

export function readTsconfigPaths(root) {
  const file = path.join(root, TSCONFIG_FILE)
  if (!fs.existsSync(file)) return null
  return parseJsonc(fs.readFileSync(file, 'utf8')).compilerOptions?.paths ?? {}
}

/** Write the paths block. Returns true when the file changed. */
export function syncTsconfigPaths(root, aliases) {
  const file = path.join(root, TSCONFIG_FILE)
  const source = fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8')
    : '{\n  "compilerOptions": {}\n}\n'
  const next = replacePathsBlock(source, tsconfigPaths(aliases))
  if (next === source) return false
  fs.writeFileSync(file, next)
  return true
}

/** Compare the tsconfig paths with what the aliases imply. Returns a list of problems. */
export function checkTsconfigPaths(root, aliases) {
  const actual = readTsconfigPaths(root)
  if (actual === null) return [`${TSCONFIG_FILE} not found`]
  const expected = tsconfigPaths(aliases)
  const problems = []
  for (const [key, value] of Object.entries(expected)) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(value)) {
      problems.push(
        `${TSCONFIG_FILE}: paths["${key}"] should be ${JSON.stringify(value)} (found ${JSON.stringify(actual[key])})`,
      )
    }
  }
  for (const key of Object.keys(actual)) {
    if (!(key in expected))
      problems.push(`${TSCONFIG_FILE}: paths["${key}"] is not declared in rtv.config.json aliases`)
  }
  return problems
}
