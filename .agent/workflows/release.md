---
title: Release
description: Cut a version from the release branch, publish it to npm and produce the Claude deployment report.
---

# Release

The `Release` workflow (`.github/workflows/release.yml`) does the tagging, the GitHub release and the npm publish. People only prepare the version.

1. On a branch from `master`: `npm run check && npm run build`.
2. Bump the version without tagging: `npm version <patch|minor|major> --no-git-tag-version`. Move the **Unreleased** entries of `CHANGELOG.md` into `## [X.Y.Z] - YYYY-MM-DD` (the workflow turns that section into the release notes).
3. Commit `chore(release): vX.Y.Z`, open a PR into `master`, merge it, then merge `master` into the `release` branch (or push the commit there).
4. The pipeline runs the quality gate, **stages** the version on npm through trusted publishing (`npm stage publish`, provenance included, no token in GitHub), tags `vX.Y.Z`, publishes the GitHub release and, when `ANTHROPIC_API_KEY` is configured, appends the Claude deployment report. A version that is already live on npm is skipped, so re-pushing is harmless.
5. **Approve the staged version** (a human with write access and 2FA, from a logged-in npm CLI): `npm stage view <stage-id>` to inspect, `npm stage approve <stage-id>` to make it live, `npm stage reject <stage-id>` to discard. The stage id is in the workflow's job summary and in the GitHub release notes; `npm stage list react-ts-vite` lists pending stages. The dist-tag is fixed at stage time (reject and re-stage to change it). Trusted-publisher tokens cannot approve, by design.
6. Fully automatic releases: set `PUBLISH_MODE: direct` in the workflow (or choose `direct` in a manual run) and allow `npm publish` on the npmjs.com trusted publisher.
7. Alternative start: Actions → Release → Run workflow on the `release` branch with a bump (`patch`, `minor`, `major`, `prerelease`); the workflow commits the version itself. Pre-releases use the `next` dist-tag.
8. Preview the report locally at any time: `npm run build && npm run deploy:insights -- --dry-run`.

Never create tags or GitHub releases by hand for a version the pipeline has not verified; if you must publish an existing tag, publish a GitHub release for it and the pipeline will push it to npm.
