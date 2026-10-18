# AI agents: the `.agent/` folder

`.agent/` makes the project legible to AI coding agents — Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Gemini CLI, Jules, Amp and anything else that reads `AGENTS.md`. It is also the best onboarding document for humans. Everything is plain Markdown under version control; nothing is hidden in a vendor dashboard.

```
.agent/
├── README.md             How the folder works
├── instructions.md       Project-wide instructions: mindset, how to work, never-do list, scripts
├── rules/                Always-on rules
│   ├── architecture.md     GENERATED from rtv.config.json — active architecture, layers, aliases, import rules
│   ├── code-style.md       TypeScript/React/module conventions
│   ├── design-system.md    Tailwind tokens, dark mode, Headless UI, Heroicons, accessibility
│   ├── testing.md          Vitest + Testing Library conventions
│   └── git-workflow.md     Conventional Commits, PRs, releases
├── skills/               Reusable know-how (Agent Skills standard: SKILL.md with YAML front matter)
├── workflows/            Step-by-step procedures (become slash commands in Claude Code)
└── agent.json            GENERATED index
```

## Skills

| Skill | Use it when… |
| --- | --- |
| `project-architecture` | deciding where code lives, fixing `arch:check` violations, switching architectures |
| `react-component` | building, extracting or refactoring components, hooks and pages |
| `scaffold-feature` | implementing a business capability end to end (`$ARGUMENTS` = feature name) |
| `tailwind-design-system` | styling, re-theming, adding dialogs/menus/listboxes |
| `testing-vitest` | writing or fixing tests, raising coverage |
| `clean-code-review` | reviewing a diff or PR against the project rules |
| `accessibility-audit` | checking semantics, keyboard, focus, contrast, forms |
| `dependency-upgrade` | bumping Vite/React/Tailwind/Vitest/TypeScript safely |
| `ci-cd-docker` | debugging CI, adding workflows or deploy targets, running containers |
| `deployment-insights` | producing release notes / risk reports, configuring Claude on deployment |

Skills follow the [Agent Skills](https://agentskills.io) specification: the folder name equals `name`, `description` says what the skill does *and when to use it* (≤ 1024 characters), optional `license`, `compatibility`, `metadata` and `allowed-tools`. Only spec fields are used so the skills stay portable across tools.

## How each tool consumes it

`npm run agent:sync` (also run by `postinstall`, by `npm run setup`, by the architecture switcher and by the Claude Code hook) renders the folder into tool-specific locations. `npm run agent:check` (part of `npm run check`) fails when any of them is stale.

| Tool | Reads | Notes |
| --- | --- | --- |
| **Claude Code** | `CLAUDE.md` → `@AGENTS.md` import, `.claude/skills/<skill>/` (mirrors), `.claude/commands/<workflow>.md` (mirrors), `.claude/settings.json` | Skills are invoked as `/project-architecture`, workflows as `/add-page`, etc. The settings pre-approve `npm run …` scripts and run Prettier after every edit (`scripts/hooks/post-edit.mjs`, which also re-syncs when `.agent/` changes). |
| **Codex, Jules, Amp, Zed, Warp, Gemini CLI, …** | `AGENTS.md` | Generated: instructions + all rules inline + skill and workflow index with links. |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Generated: instructions + rules + skill list. |
| **Cursor** | `.cursor/rules/rtv-*.mdc` | One always-apply rule per `.agent/rules/*.md`. |

Why mirrors instead of symlinks? They work on every OS and in every tool, and the check keeps them honest. Edit the source in `.agent/`; never edit a mirror.

## The generated architecture rule

`.agent/rules/architecture.md` is rendered from `rtv.config.json` and the architecture catalogue every time you run `npm run arch -- apply`, `npm run templates -- add/remove`, `npm run setup` or `npm run agent:sync`. It tells agents the active architecture, where each role lives, the aliases, the layer table with allowed imports, and the applied templates — so an agent never has to guess where a file belongs.

## Adding or changing instructions

- **Rule**: add `.agent/rules/<topic>.md` with front matter `title` and `description`; keep it short and imperative.
- **Skill**: `mkdir .agent/skills/<name>` + `SKILL.md` (front matter `name`, `description`); add supporting files next to it (the deployment-insights skill ships its `PROMPT.md`).
- **Workflow**: `.agent/workflows/<name>.md` with numbered steps referencing skills and scripts.
- Run `npm run agent:sync` and commit the regenerated files together with your change.

## Design notes

- The folder is tool-agnostic on purpose: a team can switch agents without rewriting its conventions.
- Rules are the short, always-on layer; skills carry the long, situational detail; workflows chain them. Keep each rule under ~40 lines and each `SKILL.md` under ~500.
- Generated artefacts carry an `<!-- rtv:generated -->` marker so the tooling never overwrites a hand-written file.
