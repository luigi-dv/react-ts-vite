import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'node_modules',
    '.claude/skills',
    '.cursor',
    'templates/project',
    '**/*.tsbuildinfo',
  ]),

  // Browser code: React + TypeScript (application, design templates and tests).
  {
    files: [
      'src/**/*.{ts,tsx}',
      'templates/design/**/*.{ts,tsx}',
      '__tests__/**/*.{ts,tsx}',
      'vitest.setup.ts',
    ],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },

  // Cleanliness rule: application code imports through path aliases, never by
  // climbing directories. Aliases are what keep imports stable when the
  // architecture changes (`npm run arch`).
  {
    files: ['src/**/*.{ts,tsx}', 'templates/design/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['..', '../**'],
              message:
                'Import through a path alias (@components, @pages, @services, …) instead of "../". Aliases keep imports stable when the folder structure changes.',
            },
          ],
        },
      ],
    },
  },

  // Node tooling written in TypeScript (Vite config).
  {
    files: ['vite.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // Node tooling written in plain ESM JavaScript (CLI, scripts, config, script tests).
  {
    files: ['bin/**/*.mjs', 'scripts/**/*.mjs', '__tests__/**/*.mjs', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // CommonJS config files (Tailwind, PostCSS).
  {
    files: ['**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
])
