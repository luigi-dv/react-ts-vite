# CLI reference

The CLI lives in `bin/rtv.mjs` and has no runtime dependencies. Inside a project use the npm scripts; from anywhere use `npx react-ts-vite <command>`.

```
npx react-ts-vite <command> [options]
npm run <script> -- [options]
```

Global options: `-h, --help` · `-y, --yes` (accept defaults, never prompt) · `--quiet`.
Non-interactive terminals (CI) must pass flags or `--yes`; the CLI never hangs waiting for input.

## `create <dir>`

Scaffold a new project from the package, then run `setup` inside it.

```bash
npx react-ts-vite create my-app
npx react-ts-vite create my-app --arch clean --templates landing,auth --claude-insights --yes --install
```

| Option                 | Effect                              |
| ---------------------- | ----------------------------------- |
| `--description <text>` | `package.json` description          |
| `--install`            | run `npm install` afterwards        |
| `--no-git`             | skip `git init`                     |
| `--force`              | scaffold into a non-empty directory |
| any `setup` option     | forwarded to the wizard             |

What changes compared to the template: `package.json` is reset (name from the directory, `0.1.0`, private, no `bin`/`files`), the template's `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `release.yml` and the CLI's own test suites are left out, a starter README is written and `.gitignore` is restored.

## `setup`

Interactive wizard (also `npm run setup`). Three decisions, each with a flag:

| Decision             | Flag                                                         |
| -------------------- | ------------------------------------------------------------ |
| Architecture         | `--arch classic\|feature\|fsd\|clean\|atomic`                |
| Design templates     | `--templates dashboard,auth` or `--no-templates`             |
| Claude on deployment | `--claude-insights` / `--no-claude-insights`, `--model <id>` |

Other options: `--remove-example` / `--keep-example` (starter `ExampleComponent` when templates are added), `--force` (overwrite template files and `App.tsx`), `--install`, `--yes`, `--quiet`.

The wizard applies the architecture, applies/removes templates and regenerates `App.tsx`, enables or disables the Claude workflow (and the `@anthropic-ai/sdk` dev dependency), saves `rtv.config.json` and syncs the agent instructions. Safe to re-run at any time.

## `arch`

```bash
npm run arch -- list                 # catalogue, active one marked
npm run arch -- current              # layers, aliases, rules of the active architecture
npm run arch -- apply <id>           # switch (git mv for tracked folders); -y skips the confirmation
npm run arch -- apply <id> --dry-run # plan only
npm run arch -- check [--strict]     # alias sync + import-direction check; --strict fails on warnings
npm run arch -- scaffold             # create missing layer folders/READMEs for the active architecture
```

`npm run arch:check` is the shortcut used by `npm run check`.

## `templates`

```bash
npm run templates -- list
npm run templates -- add <id…> [--force] [--remove-example]
npm run templates -- remove <id…>
npm run templates -- apply [--force]
```

Pages are copied into the pages folder of the active architecture, smoke tests into `__tests__/pages/`, and `src/App.tsx` is regenerated (unless it is hand-written and `--force` is not given).

## `agent`

```bash
npm run agent -- list      # rules, skills, workflows
npm run agent:sync         # regenerate AGENTS.md, copilot-instructions, cursor rules, docs/architecture.md, .claude mirrors
npm run agent:check        # fail when anything is stale (part of npm run check)
```

`agent sync --quiet --if-project` is what `postinstall` runs: it is a no-op when the package is installed as a dependency.

## `insights`

```bash
npm run deploy:insights -- [--since <ref>] [--mode auto|api|cli] [--model <id>] [--effort <level>]
                            [--max-tokens <n>] [--out <file>] [--deploy-url <url>] [--env <name>]
                            [--dry-run] [--context-only]
```

See [deployment-insights.md](deployment-insights.md).

## Configuration file: `rtv.config.json`

```json
{
  "$schema": "./scripts/schema/rtv.config.schema.json",
  "version": 1,
  "architecture": "classic",
  "templates": ["landing"],
  "design": { "system": "tailwind", "ui": ["@headlessui/react", "@heroicons/react"] },
  "claude": { "deploymentInsights": false, "model": "claude-opus-5-5", "effort": "medium" },
  "rules": { "allow": ["presentation>infrastructure"] },
  "aliases": { "@": "./src", "@components": "./src/components", "…": "…" }
}
```

- `aliases` is the single source of truth for path aliases: `vite.config.ts` imports it, `tsconfig.app.json#paths` is generated from it. Do not edit by hand; run `npm run arch -- apply <id>`.
- `rules.allow` lists tolerated layer dependencies (`"from>to"`).
- The JSON schema gives editor validation and completion.

## Exit codes

`0` success · `1` a check failed or a command error occurred (the message names the problem and the fix).
