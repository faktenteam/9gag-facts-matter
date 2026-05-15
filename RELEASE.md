# Release Process

This document defines how versions and release artifacts are prepared for `9GAG - facts matter`.

## Versioning

- The source of truth for the extension version is `manifest.json` → `version`.
- Use Semantic Versioning:
  - `MAJOR` for incompatible storage, permission, or behavior changes.
  - `MINOR` for new features or user-visible improvements.
  - `PATCH` for bug fixes, documentation, security hardening, and compatibility fixes.
- Keep the README version badge and `CHANGELOG.md` in sync with every release.
- Git release tags use the format `vX.Y.Z` and must match `manifest.json` exactly.

## Pre-release checklist

Before tagging a release:

1. Update `manifest.json` version.
2. Update the README version badge.
3. Move relevant entries from `CHANGELOG.md` → `Unreleased` into the new version section.
4. Verify `THIRD_PARTY_NOTICES.md` if a bundled dependency changed.
5. Run formatting, linting, and dependency checks.
6. Smoke-test the extension as an unpacked extension in a Chromium-based browser.
7. Build and review the release archive.
8. Create and push the matching git tag.

## Validation commands

Use the local development tooling when available:

```powershell
npm run format:check
npm run lint
npm audit
git diff --check
git status --short --branch
```

## Build the release archive

Use `git archive` to create a deterministic ZIP from the current commit.

```powershell
$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
git archive --format=zip --prefix="9gag-facts-matter-v$version/" --output="9gag-facts-matter-v$version.zip" HEAD
```

Verify the archive contents before publishing:

```powershell
tar -tf "9gag-facts-matter-v$version.zip"
```

The archive should include the extension runtime files, bundled assets, documentation, and license notices needed for publication.

## Release tagging

After validation and archive review:

```powershell
$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
git tag -a "v$version" -m "Release v$version"
git push origin main --tags
```

Create the GitHub release from the matching tag and attach the reviewed ZIP file.

## Bundled dependency refresh

When updating a vendored runtime dependency:

1. Replace the bundled file with an official upstream release artifact.
2. Do not reformat vendored files.
3. Preserve upstream license/version banners when present.
4. Update `THIRD_PARTY_NOTICES.md` with the exact version, source URL, license, and SHA-256 hash.
5. Re-run validation and smoke-test the extension.
