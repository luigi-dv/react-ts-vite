---
title: Release
description: Cut a version from the release branch, publish it to npm and produce the Claude deployment report.
---

# Release

The `Release` workflow (`.github/workflows/release.yml`) does the tagging, the GitHub release and the npm publish. People only prepare the version.

1. On a branch from `master`: `npm run check && npm run build`.
2. Bump the version without tagging: `npm version <patch|minor|major> --no-git-tag-version`. Move the **Unreleased** entries of `CHANGELOG.md` into `## [X.Y.Z] - YYYY-MM-DD` (the workflow turns that section into the release notes).
3. Commit `chore(release): vX.Y.Z`, open a PR into `master`, merge it, then merge `master` into the `release` branch (or push the commit there).
4. The pipeline runs the quality gate, tags `vX.Y.Z`, publishes the GitHub release, publishes to npm with provenance (`npm_token` secret) and, when `ANTHROPIC_API_KEY` is configured, appends the Claude deployment report. A version that is already on npm is skipped, so re-pushing is harmless.
5. Alternative: Actions → Release → Run workflow on the `release` branch with a bump (`patch`, `minor`, `major`, `prerelease`); the workflow commits the version itself. Pre-releases publish under the `next` dist-tag.
6. Preview the report locally at any time: `npm run build && npm run deploy:insights -- --dry-run`.

Never create tags or GitHub releases by hand for a version the pipeline has not verified; if you must publish an existing tag, publish a GitHub release for it and the pipeline will push it to npm.
