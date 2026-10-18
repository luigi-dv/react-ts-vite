// Switch a project from one architecture to another.
//
// Roles (components, pages, hooks, …) are moved to the folder the target
// architecture assigns them, in two phases through a staging directory so the
// order of moves can never matter. Because application code imports through
// role aliases (`@components/Button`) and the alias map is rewritten at the
// same time, imports keep working after the move.
import fs from 'node:fs'
import path from 'node:path'

import {
  ROLES,
  aliasesFor,
  getArchitecture,
  isGeneratedDoc,
  renderLayerReadme,
  scaffoldDirs,
} from './architectures.mjs'
import { syncTsconfigPaths } from './aliases.mjs'
import { saveConfig } from './config.mjs'
import { ensureDir, exists, isDir, movePath, writeText } from './fs.mjs'

const STAGING = 'src/.rtv-staging'

/**
 * Describe what switching from `from` to `to` would do, without touching disk.
 */
export function planArchitectureChange(root, from, to) {
  const moves = []
  for (const role of ROLES) {
    const source = from.roles[role]
    const target = to.roles[role]
    const abs = path.join(root, source)
    if (source !== target && exists(abs) && !isPlaceholderOnly(abs))
      moves.push({ role, from: source, to: target })
  }
  const create = scaffoldDirs(to).filter(
    (dir) => !exists(path.join(root, dir)) && !moves.some((m) => m.to === dir),
  )
  const stale = scaffoldDirs(from).filter(
    (dir) => !scaffoldDirs(to).includes(dir) && !moves.some((m) => m.to === dir),
  )
  return { from: from.id, to: to.id, moves, create, stale, aliases: aliasesFor(to) }
}

/** True when a folder holds nothing but scaffolding placeholders (.gitkeep, generated READMEs). */
export function isPlaceholderOnly(dir) {
  if (!isDir(dir)) return false
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!isPlaceholderOnly(full)) return false
    } else if (entry.name === '.gitkeep') {
      continue
    } else if (entry.name === 'README.md' && isGeneratedDoc(fs.readFileSync(full, 'utf8'))) {
      continue
    } else {
      return false
    }
  }
  return true
}

/**
 * Create every folder of the architecture. Layer folders get a generated
 * README (unless a hand-written one exists), other folders a `.gitkeep`.
 * Returns the files written.
 */
export function scaffoldArchitecture(root, arch) {
  const written = []
  for (const dir of scaffoldDirs(arch)) {
    const abs = path.join(root, dir)
    ensureDir(abs)
    const layer = arch.layers.find((l) => l.path === dir)
    if (layer) {
      const readme = path.join(abs, 'README.md')
      if (!exists(readme) || isGeneratedDoc(fs.readFileSync(readme, 'utf8'))) {
        writeText(readme, renderLayerReadme(arch, layer))
        written.push(readme)
      }
    } else if (fs.readdirSync(abs).length === 0) {
      const keep = path.join(abs, '.gitkeep')
      writeText(keep, '')
      written.push(keep)
    }
  }
  return written
}

/** Remove every empty directory below `dir` (post-order), never `dir` itself. Returns removed paths. */
export function removeEmptyDirsUnder(dir) {
  const removed = []
  const sweep = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const full = path.join(current, entry.name)
      sweep(full)
      if (fs.readdirSync(full).length === 0) {
        fs.rmdirSync(full)
        removed.push(full)
      }
    }
  }
  if (isDir(dir)) sweep(dir)
  return removed
}

/** Delete generated READMEs and redundant .gitkeep files under src/. */
export function cleanGeneratedDocs(root) {
  const removed = []
  const walk = (dir) => {
    if (!isDir(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'README.md' && isGeneratedDoc(fs.readFileSync(full, 'utf8'))) {
        fs.rmSync(full)
        removed.push(full)
      } else if (entry.name === '.gitkeep' && fs.readdirSync(dir).length > 1) {
        fs.rmSync(full)
        removed.push(full)
      }
    }
  }
  walk(path.join(root, 'src'))
  return removed
}

/**
 * Apply an architecture.
 * @param {{ root: string, config: object, targetId: string, dryRun?: boolean }} options
 */
export function applyArchitecture({ root, config, targetId, dryRun = false }) {
  const from = getArchitecture(config.architecture)
  const to = getArchitecture(targetId)
  const plan = planArchitectureChange(root, from, to)
  if (dryRun) return { plan, applied: false, moved: [], created: [], removed: [], config }

  const staging = path.join(root, STAGING)
  const moved = []
  for (const m of plan.moves) movePath(root, path.join(root, m.from), path.join(staging, m.role))
  for (const m of plan.moves) {
    moved.push(...movePath(root, path.join(staging, m.role), path.join(root, m.to)))
  }
  if (exists(staging)) fs.rmSync(staging, { recursive: true, force: true })

  const removed = cleanGeneratedDocs(root)
  const created = scaffoldArchitecture(root, to)

  // Folders that only existed for the previous architecture disappear when they hold nothing but placeholders.
  for (const dir of [...plan.stale].sort((a, b) => b.length - a.length)) {
    const abs = path.join(root, dir)
    const keep = path.join(abs, '.gitkeep')
    if (exists(keep) && fs.readdirSync(abs).length === 1) {
      fs.rmSync(keep)
      removed.push(keep)
    }
  }
  // Moving a role folder can carry empty sub-folders of the old layout along; git never tracks
  // empty folders, so sweeping them is always safe.
  removed.push(...removeEmptyDirsUnder(path.join(root, 'src')))

  const aliases = aliasesFor(to)
  const nextConfig = { ...config, architecture: to.id, aliases }
  saveConfig(root, nextConfig)
  syncTsconfigPaths(root, aliases)

  return { plan, applied: true, moved, created, removed, config: nextConfig }
}
