"use strict";

// Debug logging
const DEBUG = false;
function log(...args) {
  if (DEBUG)
    console.log("%c[9gag-fm]", "color: #00ff88; font-weight: bold;", ...args);
}

const CONSTANTS = {
  CACHE_DURATION: 3 * 60 * 60 * 1000,
  SECONDS_PER_DAY: 86400,
  DEFAULT_SPAMMER_HOURS: 12,
  MIN_POSTS_FOR_SPAM_CHECK: 10,
  MAX_FETCH_RETRIES: 2,
  RETRY_DELAY: 1000,
  SPAMMER_LABEL: "FactsDon'tMatter",
};

// Shared mutable state
let settings = {};
const processedPosts = new WeakSet();
let activeIntervals = [];

const settingsKeys = [
  "show_days",
  "min_days",
  "spammers",
  "spammers_hours",
  "cheers",
  "more_downvotes",
  "hide_spammers",
  "always_display_upvotes",
  "show_controls",
  "hide_meme",
  "filter_keywords",
  "filter_tags",
  "hide_promoted",
  "hide_videos",
  "hide_gifs",
  "hide_images",
  "hide_potz",
];

// Array-based settings stored separately in chrome.storage
const listSettingsKeys = ["blocked_users", "whitelisted_users"];

const defaultSettings = {
  show_days: true,
  min_days: 0,
  spammers: true,
  spammers_hours: 12,
  cheers: true,
  more_downvotes: false,
  hide_spammers: false,
  always_display_upvotes: true,
  show_controls: false,
  hide_meme: false,
  filter_keywords: "",
  filter_tags: "",
  hide_promoted: false,
  hide_videos: false,
  hide_gifs: false,
  hide_images: false,
  hide_potz: true,
};

const defaultListSettings = {
  blocked_users: [],
  whitelisted_users: [],
};

const allSettingsKeys = [...settingsKeys, ...listSettingsKeys];
const allSettingsKeySet = new Set(allSettingsKeys);

function isKnownSettingKey(key) {
  return allSettingsKeySet.has(key);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false;
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function normalizeUsernameKey(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

function userListIncludes(users, username) {
  const key = normalizeUsernameKey(username);
  if (!key) return false;
  return normalizeStringList(users).some(
    (u) => normalizeUsernameKey(u) === key,
  );
}

function removeUserFromList(users, username) {
  const key = normalizeUsernameKey(username);
  if (!key) return normalizeStringList(users);
  return normalizeStringList(users).filter(
    (u) => normalizeUsernameKey(u) !== key,
  );
}

function removeUsersFromList(users, usersToRemove) {
  const keysToRemove = new Set(
    normalizeStringList(usersToRemove).map((u) => normalizeUsernameKey(u)),
  );
  if (!keysToRemove.size) return normalizeStringList(users);
  return normalizeStringList(users).filter(
    (u) => !keysToRemove.has(normalizeUsernameKey(u)),
  );
}

function getOtherUserListKey(key) {
  if (key === "blocked_users") return "whitelisted_users";
  if (key === "whitelisted_users") return "blocked_users";
  return null;
}

function reconcileExclusiveUserLists(data, preferredKey = "whitelisted_users") {
  const preferredListKey = getOtherUserListKey(preferredKey)
    ? preferredKey
    : "whitelisted_users";
  const otherKey = getOtherUserListKey(preferredListKey);
  const normalized = {
    ...data,
    blocked_users: normalizeStringList(data.blocked_users),
    whitelisted_users: normalizeStringList(data.whitelisted_users),
  };

  normalized[otherKey] = removeUsersFromList(
    normalized[otherKey],
    normalized[preferredListKey],
  );
  return normalized;
}

function normalizeSettingsPatch(
  data = {},
  preferredListKey = "whitelisted_users",
) {
  const normalized = {};
  for (const key of allSettingsKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      normalized[key] = normalizeSettingValue(key, data[key]);
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(normalized, "blocked_users") &&
    Object.prototype.hasOwnProperty.call(normalized, "whitelisted_users")
  ) {
    const reconciled = reconcileExclusiveUserLists(
      normalized,
      preferredListKey,
    );
    normalized.blocked_users = reconciled.blocked_users;
    normalized.whitelisted_users = reconciled.whitelisted_users;
  }

  return normalized;
}

function addUserToExclusiveList(storageKey, username, currentData = {}) {
  const otherKey = getOtherUserListKey(storageKey);
  const cleanUsername = typeof username === "string" ? username.trim() : "";
  if (!otherKey || !cleanUsername) return {};

  const currentTarget = normalizeSettingValue(
    storageKey,
    currentData[storageKey],
  );
  const currentOther = normalizeSettingValue(otherKey, currentData[otherKey]);
  const nextTarget = userListIncludes(currentTarget, cleanUsername)
    ? currentTarget
    : normalizeStringList([...currentTarget, cleanUsername]);
  const nextOther = removeUserFromList(currentOther, cleanUsername);

  const updates = {};
  if (!settingsValueEquals(currentTarget, nextTarget)) {
    updates[storageKey] = nextTarget;
  }
  if (!settingsValueEquals(currentOther, nextOther)) {
    updates[otherKey] = nextOther;
  }
  return updates;
}

function getDefaultSettingValue(key) {
  if (listSettingsKeys.includes(key)) {
    return [...defaultListSettings[key]];
  }
  return defaultSettings[key];
}

function normalizeSettingValue(key, value) {
  if (listSettingsKeys.includes(key)) {
    return normalizeStringList(value);
  }

  const fallback = defaultSettings[key];
  if (typeof fallback === "boolean") {
    return typeof value === "boolean" ? value : fallback;
  }
  if (typeof fallback === "number") {
    const numberValue = typeof value === "number" ? value : parseInt(value, 10);
    return Number.isFinite(numberValue) && numberValue >= 0
      ? Math.floor(numberValue)
      : fallback;
  }
  if (typeof fallback === "string") {
    return typeof value === "string" ? value : fallback;
  }
  return fallback;
}

function normalizeSettingsData(
  data = {},
  preferredListKey = "whitelisted_users",
) {
  const normalized = {};
  for (const key of allSettingsKeys) {
    const hasValue = Object.prototype.hasOwnProperty.call(data, key);
    normalized[key] = normalizeSettingValue(
      key,
      hasValue ? data[key] : getDefaultSettingValue(key),
    );
  }
  return reconcileExclusiveUserLists(normalized, preferredListKey);
}

function settingsValueEquals(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

// Centralized DOM selectors for 9GAG elements.
// If 9GAG redesigns their DOM, only this registry needs updating.
// Some selectors have fallback arrays — use resolveSelector() to pick the first match.
const S = {
  // Containers
  container: "#container",
  listView: "#list-view-2",
  listViewClass: "list-view",
  listViewContent: ".list-view__content",
  streamContainer: ".stream-container",

  // Post header / creator
  postCreator: ".ui-post-creator",
  postCreatorAuthor: ".ui-post-creator__author",
  postHeaderLeft: ".post-header__left",
  postMetaMobile: ".post-meta.mobile",
  creatorUserLink: '.creator a[href*="/u/"]',
  anyUserLink: 'a[href*="/u/"]',
  headerLinks: "header a",

  // Post content
  postAward: ".post-award",
  postAwardUsers: ".post-award-users",
  createMemeBtn: ".create-meme-btn",
  potzBadge: ".potz-badge",
  postTitle: "header h1, header h2, .post-title",
  postTags: 'a[href*="/tag/"]',
  promotedIndicator:
    '.badge-is-promoted, .promoted-badge, [data-is-promoted="true"]',

  // Voting
  upvote: ".upvote",
  postVote: ".post-vote",
  downvoteGrouped: ".downvote.grouped",

  // Media type detection
  videoPost: 'video, .post-video source[type*="video"]',
  gifPost:
    '.post-gif, img[src*=".gif"], img[srcset*=".gif"], source[src*=".gif"], source[srcset*=".gif"]',

  // Menu (username extraction fallback)
  popupMenu: ".uikit-popup-menu",
  menuButton: ".button",
  menuLinks: ".menu a",

  // Our injected content
  injectedAll:
    ".pf-info, .spammer-label, .days-label, .post-vote__text.downvote, .user-link",
  userLink: ".pf-user, .user-link",

  // Article states
  unprocessed: "article:not(.pf-processed):not(.filtering)",
  processed: "article.pf-processed, article.filtering",
};

// Validate critical selectors on startup and warn about missing ones
function validateSelectors() {
  const critical = [
    ["container", S.container],
    ["listView", S.listView],
    ["streamContainer", S.streamContainer],
  ];
  const warnings = [];
  for (const [name, selector] of critical) {
    if (!document.querySelector(selector)) {
      warnings.push(name);
    }
  }
  if (warnings.length) {
    console.warn(
      "[9gag-fm] Missing DOM elements for selectors:",
      warnings.join(", "),
      "— 9GAG may have changed their layout. Some features may not work.",
    );
  }
  return warnings;
}
