// Read and write `rtv.config.json`, the single source of truth for the
// project's shape: active architecture, applied design templates, Claude
// settings and the path-alias map consumed by vite.config.ts.
import fs from 'node:fs'
import path from 'node:path'

import { CONFIG_FILE } from './paths.mjs'

export const CONFIG_VERSION = 1

export const DEFAULT_CONFIG = Object.freeze({
  $schema: './scripts/schema/rtv.config.schema.json',
  version: CONFIG_VERSION,
  architecture: 'classic',
  templates: [],
  design: {
    system: 'tailwind',
    ui: ['@headlessui/react', '@heroicons/react'],
  },
  claude: {
    deploymentInsights: false,
    model: 'claude-opus-5-5',
    effort: 'medium',
  },
  rules: {
    allow: [],
  },
  aliases: {
    '@': './src',
  },
})

/**
 * Deep-merge `source` into a clone of `target` (plain objects only; arrays replace).
 */
export function merge(target, source) {
  const out = Array.isArray(target) ? [...target] : { ...target }
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = merge(out[key] && typeof out[key] === 'object' ? out[key] : {}, value)
    } else {
      out[key] = value
    }
  }
  return out
}

export function configPath(root) {
  return path.join(root, CONFIG_FILE)
}

export function hasConfig(root) {
  return fs.existsSync(configPath(root))
}

/**
 * Load the config, filling in defaults for missing keys.
 * @param {string} root
 */
export function loadConfig(root) {
  const file = configPath(root)
  if (!fs.existsSync(file)) return structuredClone(DEFAULT_CONFIG)
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`${CONFIG_FILE} is not valid JSON: ${error.message}`, { cause: error })
  }
  return merge(structuredClone(DEFAULT_CONFIG), parsed)
}

/** Stable key order so diffs stay readable. */
const KEY_ORDER = [
  '$schema',
  'version',
  'architecture',
  'templates',
  'design',
  'claude',
  'rules',
  'aliases',
]

export function serializeConfig(config) {
  const ordered = {}
  for (const key of KEY_ORDER) if (key in config) ordered[key] = config[key]
  for (const key of Object.keys(config)) if (!(key in ordered)) ordered[key] = config[key]
  return `${JSON.stringify(ordered, null, 2)}\n`
}

export function saveConfig(root, config) {
  fs.writeFileSync(configPath(root), serializeConfig(config))
  return config
}
