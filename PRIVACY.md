# Privacy Policy — 9GAG - facts matter

**Last updated:** May 15, 2026

## Overview

"9GAG - facts matter" is a browser extension that filters and enhances content on 9gag.com. Your privacy is important to us. This policy explains what data the extension accesses and how it is handled.

## Data Collection

**This extension does not collect personal data for us and does not transmit your settings, lists, or cached data to servers owned by us.**

- No analytics or tracking of any kind
- No data is sent to external servers owned by us
- No user accounts or registration required
- No cookies are set by the extension

## Data Storage

The extension stores the following data **locally in your browser** using the Chrome Storage API:

- **User settings** (filter preferences, thresholds, keyword lists)
- **User-managed lists** (blocked users, whitelisted users)
- **Cached API responses** (publicly available 9GAG account/post metadata such as account creation timestamps and recent post vote counts, cached temporarily to reduce network requests)

This data remains on your device and is not sent to us or to any third-party server by the extension.

## Network Requests

The extension makes requests **only** to `9gag.com` to retrieve publicly available user profile/post information needed for filtering (for example account creation date and vote counts). These requests are made directly from your browser to 9GAG's public API — no proxy, no intermediary servers.

Because these requests are sent to `9gag.com`, your browser may include your normal 9GAG session context, such as cookies, according to the browser's same-site rules. The extension does not read, store, or transmit those cookies itself.

## Permissions

| Permission                             | Purpose                                                           |
| -------------------------------------- | ----------------------------------------------------------------- |
| `storage`                              | Save user settings and cache data locally                         |
| `host_permissions: https://9gag.com/*` | Access 9GAG pages to filter content and retrieve public user data |

## Third-Party Libraries

- **Cash.js** — Lightweight DOM manipulation library (bundled, no external requests)
- **Pico CSS** — Styling framework for the popup UI (bundled, no external requests)

## Changes to This Policy

If this policy is updated, the changes will be posted here with an updated date.

## Contact

For questions or concerns, open an issue on the [GitHub repository](https://github.com/faktenteam/9gag-facts-matter).
