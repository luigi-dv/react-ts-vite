---
title: Git workflow and releases
description: Commit conventions, pull-request hygiene and how releases and deployment reports are produced.
---

# Git workflow

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:`, with an optional scope (`feat(dashboard): add period filter`). Subject in the imperative, ≤ 72 characters, body explains _why_.
- **Branches**: `feat/<topic>`, `fix/<topic>`, `chore/<topic>` from `master`. One concern per branch; keep PRs reviewable (< ~400 changed lines when possible).
- **Before pushing**: `npm run check` must pass locally; CI runs the same gate on Node 22 and 24 plus an architecture-switch smoke test.
- **Pull requests** describe the change, how it was tested and any follow-ups. Link issues. Generated files (`AGENTS.md`, mirrors, lockfile) are committed together with the change that produced them.
- **Changelog**: add a line under `## [Unreleased]` in `CHANGELOG.md` for every user-visible change (Keep a Changelog format).
- **Release**: bump `version` in `package.json` (semver), move Unreleased to a dated section, tag `vX.Y.Z`, publish a GitHub release. The `Node.js Package` workflow publishes to npm with provenance; when `ANTHROPIC_API_KEY` is configured it also appends a Claude deployment report to the release notes.
- **Never** rewrite shared history (`push --force` on `master`), commit `.env` files or credentials, or merge with a red CI.
