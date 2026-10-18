#!/usr/bin/env node
// Claude Code PostToolUse hook (see .claude/settings.json).
// 1. Formats the edited file with Prettier so hand-formatting is never needed.
// 2. Re-syncs the agent mirrors when a file under .agent/ changed.
// Always exits 0: a hook must never block the agent.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const FORMATTABLE = /\.(tsx?|mjs|cjs|jsx?|json|css|md|ya?ml|html)$/i

function main() {
  let payload
  try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  } catch {
    return
  }
  const file = payload?.tool_input?.file_path
  if (!file) return
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  const abs = path.isAbsolute(file) ? file : path.join(root, file)
  if (!fs.existsSync(abs)) return

  if (FORMATTABLE.test(abs) && !abs.includes(`${path.sep}node_modules${path.sep}`)) {
    spawnSync('npx', ['prettier', '--write', '--log-level', 'warn', abs], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
  }

  const rel = path.relative(root, abs)
  if (rel.startsWith(`.agent${path.sep}`) || rel === 'rtv.config.json') {
    spawnSync(process.execPath, [path.join(root, 'bin', 'rtv.mjs'), 'agent', 'sync', '--quiet'], {
      cwd: root,
      stdio: 'inherit',
    })
  }
}

try {
  main()
} catch {
  // Never fail the hook.
}
