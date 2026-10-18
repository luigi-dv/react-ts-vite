---
name: dependency-upgrade
description: Upgrade dependencies safely in this React + TypeScript + Vite + Tailwind + Vitest project — grouped bumps, changelog review, known breaking changes, verification with the full quality gate and documentation updates. Use when asked to update, bump or modernise dependencies or to fix a broken upgrade.
license: MIT
metadata:
  author: react-ts-vite
  version: '1.0'
---

# Dependency upgrade

## Procedure

1. **Inventory**: `npm outdated` and `npm ls --depth=0`. Note majors vs minors.
2. **Group** the upgrade so failures are attributable:
   - Toolchain: `vite`, `@vitejs/plugin-react`, `vitest`, `@vitest/coverage-v8`, `typescript`, `happy-dom`.
   - UI: `react`, `react-dom`, `@types/react*`, `@headlessui/react`, `@heroicons/react`, `tailwindcss`, `@tailwindcss/forms`, `postcss`, `autoprefixer`.
   - Quality: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `prettier`, `prettier-plugin-tailwindcss`.
   - Testing library: `@testing-library/*`.
3. **Read the changelog / migration guide** of every major bump before installing (`npm view <pkg> homepage`).
4. **Install one group**: `npm install <pkg>@latest …` (keep caret ranges), then `npm run check && npm run build && npm run preview` (smoke the app). Commit the group.
5. **Engines**: when a tool raises its Node floor, update `engines.node` in `package.json`, `.nvmrc`, Docker base images (`node:XX-alpine`) and the CI matrix together.
6. **Docs**: README stack badges/versions, `CHANGELOG.md` (Unreleased → "Updated"), and this skill if a new pitfall appears.

## Known pitfalls

- **Tailwind CSS 4** is CSS-first: `tailwind.config.cjs` and `@tailwind` directives are replaced by `@import "tailwindcss"` and `@theme`. Staying on 3.x keeps the current structure; migrating is a deliberate project, not a bump (`npx @tailwindcss/upgrade`).
- **Headless UI 2**: dot-notation components (`Dialog.Panel`) are replaced by named exports (`DialogPanel`); state classes become data attributes (`data-[focus]`).
- **React 19**: `@types/react` 19 removed the global `JSX` namespace (use `React.JSX` / `ComponentType`), `forwardRef` is optional (`ref` is a prop), Testing Library ≥ 16 with `@testing-library/dom` peer.
- **Vite 7+**: Node ≥ 20.19/22.12 and no CJS Node API; Vite 8 (Rolldown) warns about JSON imports without `with { type: 'json' }` and prefers `import.meta.dirname`/`fileURLToPath` over `__dirname`.
- **Vitest 4/5**: Node ≥ 22.12; `environmentOptions.happyDOM` for the DOM URL; coverage provider must be installed explicitly.
- **TypeScript 7** (native compiler) is not yet supported by `typescript-eslint` (`<6.1`); stay on 5.x until it is. `tsc -b` requires referenced projects with `noEmit` to be reached through a solution-style root (`tsconfig.json` with `files: []`).
- **ESLint 10**: flat config only (`eslint.config.js`), new `preserve-caught-error` rule (`new Error(msg, { cause })`).
- **react-hooks 7**: ships React Compiler rules (`set-state-in-effect`, `purity`, `refs`); fix the code rather than disabling them.

## After upgrading

`npm run check`, `npm run build`, open `npm run preview` in a browser (light + dark), run `npm run arch -- apply <other-arch> --dry-run` to make sure the tooling still parses configs, and update the lockfile in the same commit.
