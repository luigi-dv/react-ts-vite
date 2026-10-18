// Filesystem and git helpers. Everything here is synchronous on purpose: the
// CLI is a short-lived process and sequential, readable code wins.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const exists = (p) => fs.existsSync(p)
export const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory()
export const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile()

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function readText(file) {
  return fs.readFileSync(file, 'utf8')
}

export function writeText(file, content) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content)
  return file
}

export function readJson(file) {
  return JSON.parse(readText(file))
}

export function writeJson(file, data) {
  return writeText(file, `${JSON.stringify(data, null, 2)}\n`)
}

/**
 * Recursively list files under `dir` as absolute paths.
 * @param {string} dir
 * @param {{ ignore?: string[], extensions?: string[] }} [options]
 */
export function listFiles(dir, options = {}) {
  const ignore = new Set(options.ignore ?? ['node_modules', '.git', 'dist', 'coverage'])
  const extensions = options.extensions ?? null
  const out = []
  if (!isDir(dir)) return out
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (ignore.has(entry.name)) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (!extensions || extensions.includes(path.extname(entry.name))) out.push(full)
    }
  }
  walk(dir)
  return out.sort()
}

/**
 * Copy a directory tree. Existing files are kept unless `overwrite` is true.
 * Returns the list of destination files that were written.
 * @param {string} src
 * @param {string} dest
 * @param {{ overwrite?: boolean, filter?: (relativePath: string) => boolean, rename?: (name: string) => string }} [options]
 */
export function copyDir(src, dest, options = {}) {
  const written = []
  const walk = (from, to, rel) => {
    ensureDir(to)
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (options.filter && !options.filter(relPath)) continue
      const target = path.join(to, options.rename ? options.rename(entry.name) : entry.name)
      if (entry.isDirectory()) {
        walk(path.join(from, entry.name), target, relPath)
      } else if (options.overwrite || !fs.existsSync(target)) {
        fs.copyFileSync(path.join(from, entry.name), target)
        written.push(target)
      }
    }
  }
  walk(src, dest, '')
  return written
}

export function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

/** Remove `dir` and its parents while they are empty, stopping at `stopAt`. */
export function removeEmptyDirs(dir, stopAt) {
  let current = dir
  while (current.startsWith(stopAt) && current !== stopAt && isDir(current)) {
    if (fs.readdirSync(current).length > 0) break
    fs.rmdirSync(current)
    current = path.dirname(current)
  }
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    input: options.input,
    env: { ...process.env, ...(options.env ?? {}) },
    shell: process.platform === 'win32',
  })
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
    error: result.error,
  }
}

export function commandExists(command) {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  return run(probe, [command]).ok
}

export function isGitRepo(root) {
  return run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root }).ok
}

export function isGitTracked(root, relPath) {
  return run('git', ['ls-files', '--error-unmatch', relPath], { cwd: root }).ok
}

/**
 * Move a file or directory, using `git mv` when the source is tracked so that
 * history follows the file. When the destination exists, directories are merged
 * child by child and existing files are left alone.
 * Returns a list of `{ from, to }` moves actually performed.
 */
export function movePath(root, fromAbs, toAbs) {
  const moves = []
  if (!fs.existsSync(fromAbs)) return moves
  if (path.resolve(fromAbs) === path.resolve(toAbs)) return moves

  if (fs.existsSync(toAbs)) {
    if (!isDir(fromAbs) || !isDir(toAbs)) return moves // never overwrite files
    for (const entry of fs.readdirSync(fromAbs)) {
      moves.push(...movePath(root, path.join(fromAbs, entry), path.join(toAbs, entry)))
    }
    removeEmptyDirs(fromAbs, root)
    return moves
  }

  ensureDir(path.dirname(toAbs))
  const rel = path.relative(root, fromAbs)
  const useGit = isGitRepo(root) && isGitTracked(root, rel)
  if (useGit) {
    const result = run('git', ['mv', '-k', rel, path.relative(root, toAbs)], { cwd: root })
    if (!result.ok || fs.existsSync(fromAbs)) fs.renameSync(fromAbs, toAbs)
  } else {
    try {
      fs.renameSync(fromAbs, toAbs)
    } catch {
      fs.cpSync(fromAbs, toAbs, { recursive: true })
      fs.rmSync(fromAbs, { recursive: true, force: true })
    }
  }
  moves.push({ from: fromAbs, to: toAbs })
  return moves
}
