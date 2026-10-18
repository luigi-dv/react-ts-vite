# `.agent/` — instructions for AI coding agents

This folder is the **single source of truth** for everything an AI agent (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Jules, Amp, …) should know about this project. Humans are welcome too: it is the shortest path to understanding how the codebase is meant to grow.

```
.agent/
├── instructions.md     Project-wide instructions (how to work here)
├── rules/              Always-on rules, one topic per file
│   ├── architecture.md   GENERATED from rtv.config.json — the active architecture and import rules
│   ├── code-style.md
│   ├── design-system.md
│   ├── testing.md
│   └── git-workflow.md
├── skills/             Reusable know-how, Agent Skills standard (SKILL.md + supporting files)
├── workflows/          Step-by-step procedures for recurring jobs
└── agent.json          GENERATED index of everything above
```

## How tools read it

`npm run agent:sync` renders the folder into the places each tool reads. Nothing here is duplicated by hand.

| Tool                                        | Reads                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Claude Code                                 | `CLAUDE.md` (imports `AGENTS.md`), `.claude/skills/<skill>/` (mirrors), `.claude/commands/<workflow>.md` (mirrors) |
| Codex, Jules, Amp, Zed, Warp, Gemini CLI, … | `AGENTS.md` (generated)                                                                                            |
| GitHub Copilot                              | `.github/copilot-instructions.md` (generated)                                                                      |
| Cursor                                      | `.cursor/rules/rtv-*.mdc` (generated)                                                                              |

`npm run agent:check` (part of `npm run check`) fails when a generated file is stale, so the instructions can never drift from the source.

## Conventions

- **Skills** follow the [Agent Skills](https://agentskills.io) format: a folder named like the skill with a `SKILL.md` whose front matter has `name` (equal to the folder name) and `description` (what it does _and_ when to use it, ≤ 1024 characters). Keep `SKILL.md` under ~500 lines; put long reference material in extra files next to it.
- **Rules** are short Markdown files that apply to every task. Prefer a rule over repeating guidance in several skills.
- **Workflows** are numbered steps that reference skills and scripts. They become slash commands in Claude Code.
- The architecture rule is generated — change the architecture with `npm run arch -- apply <id>`, never by editing the file.

## Adding a skill

1. `mkdir .agent/skills/my-skill && $EDITOR .agent/skills/my-skill/SKILL.md`
2. Front matter: `name: my-skill`, `description: …`. Body: when to use, steps, checklists, examples.
3. `npm run agent:sync` — the mirrors and indexes update.
