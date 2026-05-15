# 🛡️ 9GAG - facts matter

> A browser extension for **Chrome**, **Brave**, and **Edge** that gives you full control over your 9GAG feed — filter spam, hide low-quality posts, and improve your browsing experience.

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

---

## ✨ Features

| Feature                          | Description                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 📅 **Show Account Age**          | Displays account age (in days) next to the username                                  |
| 🔞 **Minimum Account Age**       | Hides posts from accounts younger than X days                                        |
| 🚨 **Spammer Detection**         | Flags users as spammers if they post too frequently within a given timeframe (hours) |
| 🙈 **Hide Spammers**             | Completely hides posts from detected spammers                                        |
| 👎 **Downvote Filter**           | Hides posts with more downvotes than upvotes                                         |
| 🎉 **Hide Cheers**               | Removes cheers elements from the feed                                                |
| 📊 **Always Show Upvotes**       | Always displays the upvote count                                                     |
| 🎬 **Show Video Controls**       | Enables native video controls (play, pause, volume, etc.)                            |
| 🖼️ **Hide "Create Meme" Button** | Removes the "Create Meme" button                                                     |
| 🏷️ **Hide Meme Badges**          | Hides Potz badges on posts                                                           |
| 📢 **Hide Promoted Posts**       | Filters out sponsored/promoted posts from the feed                                   |
| 🔤 **Keyword Filter**            | Hides posts based on keywords in the title                                           |
| 🏷️ **Tag Filter**                | Hides posts based on specific tags                                                   |
| 🎥 **Media Type Filter**         | Filters by video, GIF, or image posts                                                |
| 🚫 **Block Users**               | Block individual users directly from the feed                                        |
| ✅ **Whitelist**                 | Whitelist trusted users to bypass filters                                            |
| 💾 **Export / Import**           | Back up and restore your settings                                                    |

---

## 📦 Installation

1. Download or clone this repository:
   ```bash
   git clone https://github.com/faktenteam/9gag-facts-matter.git
   ```
2. Open the extensions page in your browser:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`
   - **Edge**: `edge://extensions/`
3. Enable **Developer Mode** (top right)
4. Click **"Load unpacked"**
5. Select the folder of this repository

---

## ⚙️ Usage

1. Click the **extension icon** in the browser toolbar
2. A **popup window** with all settings will open
3. Adjust the filters to your liking — changes are saved immediately and applied on the next 9GAG page load

---

## 🗂️ Project Structure

```
9gag-facts-matter/
├── manifest.json              # Extension manifest (Manifest V3)
├── index.html                 # Popup UI
├── LICENSE                    # GPL-3.0 License
├── CHANGELOG.md               # User-visible version history
├── RELEASE.md                 # Maintainer release process
├── THIRD_PARTY_NOTICES.md     # Bundled dependency versions/licenses
├── assets/
│   ├── css/
│   │   ├── pico.jade.css      # Pico CSS Framework (Jade theme)
│   │   ├── index.css          # Popup styles
│   │   └── content.css        # Styles for injected elements on 9GAG
│   ├── js/
│   │   ├── cash.js            # Cash.js – lightweight jQuery alternative
│   │   ├── variables.js       # Global variables, selectors & configuration
│   │   ├── functions.js       # Utility functions (DOM observer, username extraction)
│   │   ├── api.js             # API calls, request queue & caching
│   │   ├── filters.js         # Filter logic (spam, keywords, tags, media)
│   │   ├── ui-inject.js       # DOM manipulation (info bars, vote counts, controls)
│   │   ├── content.js         # Content script – initialization & post processing
│   │   └── index.js           # Popup logic (load/save settings)
│   └── icons/
│       ├── icon-16.png        # Toolbar icon
│       ├── icon-48.png        # Extensions page icon
│       └── icon-128.png       # Web Store icon
└── README.md
```

---

## 🛠️ Technologies

- **Manifest V3** – Modern Chromium extension format (Chrome, Brave, Edge)
- **[Pico CSS](https://picocss.com/)** (Jade theme) – Minimal CSS framework for the popup
- **[Cash.js](https://github.com/fabiospampinato/cash)** – Lightweight jQuery alternative (~6 KB)
- **Chrome Storage API** – For persisting user settings

Bundled third-party library versions, licenses, source links, and artifact hashes are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## 🚀 Versioning & Releases

- Current extension version: **1.0.1**
- User-visible changes are tracked in [CHANGELOG.md](CHANGELOG.md).
- Release/version rules and the release ZIP checklist are documented in [RELEASE.md](RELEASE.md).

---

## 📝 Notes

- The extension only works on `https://9gag.com/*`
- Settings are stored locally in the browser via `chrome.storage`
- If you encounter issues: disable/enable the extension or reload the page

---

<p align="center">
  Made with ☕ by factsmatter
</p>
