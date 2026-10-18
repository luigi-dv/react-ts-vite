---
title: Release
description: Cut a version, publish it and produce the Claude deployment report.
---

# Release

1. `npm run check && npm run build` on `master`.
2. Update `CHANGELOG.md`: move Unreleased into `## [X.Y.Z] - YYYY-MM-DD`; bump `version` in `package.json` (`npm version <patch|minor|major> --no-git-tag-version`).
3. Commit `chore(release): vX.Y.Z`, tag `vX.Y.Z`, push with tags.
4. Publish a GitHub release for the tag. CI publishes to npm (template repository) or deploys (your project), and the Claude deployment insights workflow appends the report when `ANTHROPIC_API_KEY` is configured.
5. Preview the report locally at any time: `npm run build && npm run deploy:insights -- --dry-run` (no API call) or without `--dry-run` to generate it.
