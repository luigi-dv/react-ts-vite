// Path helpers shared by every command.
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const CONFIG_FILE = 'rtv.config.json'

/** Absolute path of this package (the template itself), whatever the cwd is. */
export const PACKAGE_ROOT = fileURLToPath(new URL('../..', import.meta.url))

/**
 * Find the project root: the closest directory, starting at `cwd`, that holds
 * an `rtv.config.json` or, failing that, a `package.json`.
 * @param {string} [cwd]
 * @returns {string}
 */
export function findProjectRoot(cwd = process.cwd()) {
  let dir = path.resolve(cwd)
  let fallback = null
  for (;;) {
    if (existsSync(path.join(dir, CONFIG_FILE))) return dir
    if (!fallback && existsSync(path.join(dir, 'package.json'))) fallback = dir
    const parent = path.dirname(dir)
    if (parent === dir) return fallback ?? path.resolve(cwd)
    dir = parent
  }
}

/** Normalise a path to forward slashes (for display, config files and matching). */
export function toPosix(p) {
  return p.split(path.sep).join('/')
}

/** Project-relative posix path. */
export function relativeTo(root, absolute) {
  return toPosix(path.relative(root, absolute))
}
