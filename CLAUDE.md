# CLAUDE.md

@AGENTS.md

## Claude Code notes

- **Skills** — `.claude/skills/` mirrors `.agent/skills/`. Edit the source in `.agent/`, then run `npm run agent:sync` (a PostToolUse hook in `.claude/settings.json` does this automatically when you edit anything under `.agent/`). Invoke skills with `/project-architecture`, `/react-component`, `/scaffold-feature`, `/tailwind-design-system`, `/testing-vitest`, `/clean-code-review`, `/accessibility-audit`, `/dependency-upgrade`, `/ci-cd-docker`, `/deployment-insights`.
- **Workflows** — `.claude/commands/*.md` mirror `.agent/workflows/`; they are step-by-step procedures (`/add-page`, `/add-feature`, `/switch-architecture`, `/release`, `/review-pr`, `/new-project`).
- **Formatting** — Prettier runs after every edit through the hook; never hand-format or argue about style.
- **Quality gate** — `npm run check` (typecheck · lint · format · arch:check · agent:check · tests) is pre-approved in `.claude/settings.json`. Run it before you report a task as done and fix what it reports instead of disabling rules.
- **Generated files** — never edit `AGENTS.md`, `.agent/rules/architecture.md`, `.agent/agent.json`, `.claude/skills/*`, `.claude/commands/*`, `.cursor/rules/*` or `.github/copilot-instructions.md` directly.
