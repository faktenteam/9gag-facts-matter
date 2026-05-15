# Changelog

All notable changes to this project are documented here.

This project follows [Semantic Versioning](https://semver.org/) for the extension version in `manifest.json`.

## [Unreleased]

No unreleased changes yet.

## [1.2] - 2026-05-15

### Changed

- Updated the popup to better match 9GAG's dark color palette.
- Toned down active switches, focus rings, and export/import button hover states.

## [1.0.2] - 2026-05-15

### Added

- Added a small popup footer credit.

### Fixed

- Blocked and whitelisted user lists are now mutually exclusive.
- Settings imports and existing stored lists are normalized to remove blocklist/whitelist conflicts.

## [1.0.1] - 2026-05-15

### Added

- Release/version process documentation in `RELEASE.md`.
- Third-party notice documentation for bundled runtime assets in `THIRD_PARTY_NOTICES.md`.

### Changed

- Hardened settings normalization and import validation.
- Improved SPA navigation and scroll-position restoration robustness.
- Clarified privacy wording around local storage and direct 9GAG requests.

### Fixed

- Whitelisted users now consistently bypass post-hiding filters.
- GIF detection no longer treats static WebP images as GIFs.
- The downvote filter now only hides posts with more downvotes than upvotes.
- Posts hidden by the downvote filter are marked as processed consistently.

## [1.0.0] - 2026-04-13

### Added

- Initial Manifest V3 browser extension for Chromium-based browsers.
- 9GAG feed filters for account age, spam cadence, downvotes, promoted posts, keywords, tags, media type, and blocked users.
- Popup UI for settings, blocklist/whitelist management, and settings export/import.
- Local Chrome Storage persistence for settings and temporary 9GAG API cache data.
