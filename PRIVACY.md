# Privacy Policy — 9GAG - facts matter

**Last updated:** April 13, 2026

## Overview

"9GAG - facts matter" is a browser extension that filters and enhances content on 9gag.com. Your privacy is important to us. This policy explains what data the extension accesses and how it is handled.

## Data Collection

**This extension does not collect, transmit, or store any personal data.**

- No analytics or tracking of any kind
- No data is sent to external servers owned by us
- No user accounts or registration required
- No cookies are set by the extension

## Data Storage

The extension stores the following data **locally in your browser** using the Chrome Storage API:

- **User settings** (filter preferences, thresholds, keyword lists)
- **Cached API responses** (publicly available 9GAG user data, cached temporarily to reduce network requests)
- **User-managed lists** (blocked users, whitelisted users)

All data remains on your device and is never transmitted to any third party.

## Network Requests

The extension makes requests **only** to `9gag.com` to retrieve publicly available user profile information (e.g., account creation date). These requests are made directly to 9GAG's public API — no proxy, no intermediary servers.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save user settings and cache data locally |
| `host_permissions: https://9gag.com/*` | Access 9GAG pages to filter content and retrieve public user data |

## Third-Party Libraries

- **Cash.js** — Lightweight DOM manipulation library (bundled, no external requests)
- **Pico CSS** — Styling framework for the popup UI (bundled, no external requests)

## Changes to This Policy

If this policy is updated, the changes will be posted here with an updated date.

## Contact

For questions or concerns, open an issue on the [GitHub repository](https://github.com/faktenteam/9gag-facts-matter).
