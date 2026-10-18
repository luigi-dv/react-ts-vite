import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Path aliases are the single source of truth in rtv.config.json. The architecture
// switcher (`npm run arch`) rewrites them, and `tsconfig.json#paths` is kept in
// sync from the same map so imports such as `@components/Button` survive any
// folder-structure change.
import rtv from './rtv.config.json' with { type: 'json' }

const alias = Object.fromEntries(
  Object.entries(rtv.aliases).map(([name, target]) => [
    name,
    fileURLToPath(new URL(target, import.meta.url)),
  ]),
)

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  server: {
    host: true,
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    target: 'es2022',
    sourcemap: process.env.SOURCEMAP === 'true',
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/**/*.mjs'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.d.ts'],
      reporter: ['text', 'html', 'lcov'],
    },
    // Two projects: UI code runs in a DOM, the CLI libraries run in plain Node.
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'happy-dom',
          environmentOptions: {
            happyDOM: { url: 'http://localhost:3000/' },
          },
          setupFiles: ['./vitest.setup.ts'],
          include: ['__tests__/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['__tests__/scripts/**/*.{test,spec}.mjs'],
        },
      },
    ],
  },
})
