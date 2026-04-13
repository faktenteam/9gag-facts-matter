"use strict";

// API calls, request queue, and cache management

const userDataCache = new Map();
const pendingRequests = new Map();

// API error tracking for user feedback
let apiErrorCount = 0;
let errorBannerShown = false;

function trackApiError() {
  apiErrorCount++;
  if (apiErrorCount >= 3 && !errorBannerShown) {
    showErrorBanner(`9GAG Filter: Could not check ${apiErrorCount} posts (API errors or rate limit)`);
    errorBannerShown = true;
  }
}

function showErrorBanner(message) {
  // Remove existing banner if any
  const existing = document.getElementById('9gag-fm-error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = '9gag-fm-error-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#e53935;color:#fff;padding:8px 16px;font-size:13px;text-align:center;cursor:pointer;font-family:sans-serif;';
  banner.textContent = message;
  banner.title = 'Click to dismiss';
  banner.addEventListener('click', () => banner.remove());
  document.body.appendChild(banner);

  // Auto-dismiss after 10 seconds
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 10000);
}

// Concurrency-limited request queue to avoid rate limiting
const MAX_CONCURRENT = 3;
let activeRequests = 0;
const waitingRequests = [];

function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeRequests++;
      try {
        const result = await fn();
        resolve(result);
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        if (waitingRequests.length > 0) {
          const next = waitingRequests.shift();
          next();
        }
      }
    };

    if (activeRequests < MAX_CONCURRENT) {
      run();
    } else {
      waitingRequests.push(run);
    }
  });
}

function getCachedUserData(username) {
  const cached = userDataCache.get(username);
  if (cached && Date.now() - cached.timestamp < CONSTANTS.CACHE_DURATION) {
    return cached;
  }
  return null;
}

function setCachedUserData(username, apiJson) {
  const d = apiJson && apiJson.data;
  if (!d || !d.profile || !d.posts) return;
  const entry = {
    profile: d.profile,
    posts: d.posts,
    timestamp: Date.now(),
  };
  userDataCache.set(username, entry);

  // Persist minimized data to chrome.storage.local for cross-tab / reload reuse
  const storageEntry = {
    profile: { creationTs: d.profile.creationTs },
    posts: d.posts.map(p => ({ id: p.id, creationTs: p.creationTs, upVoteCount: p.upVoteCount, downVoteCount: p.downVoteCount })),
    timestamp: entry.timestamp,
  };
  chrome.storage.local.set({ [`uc_${username}`]: storageEntry });
}

// Try loading user data from persistent storage when memory cache misses
async function getCachedUserDataPersistent(username) {
  const mem = getCachedUserData(username);
  if (mem) return mem;

  try {
    const key = `uc_${username}`;
    const result = await chrome.storage.local.get(key);
    const cached = result[key];
    if (cached && Date.now() - cached.timestamp < CONSTANTS.CACHE_DURATION) {
      userDataCache.set(username, cached);
      return cached;
    }
  } catch (_e) {
    // storage read failed, fall through
  }
  return null;
}

async function doFetch(username) {
  const response = await fetch(`https://9gag.com/v1/user-posts/username/${encodeURIComponent(username)}/type/posts`, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.5",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
    referrer: "https://9gag.com",
    referrerPolicy: "strict-origin-when-cross-origin",
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    throw new Error('Rate limited (non-JSON response)');
  }
  return response.json();
}

async function fetchUserData(username) {
  try {
    const cached = await getCachedUserDataPersistent(username);
    if (cached) {
      return cached;
    }

    if (pendingRequests.has(username)) {
      return await pendingRequests.get(username);
    }

    const requestPromise = enqueueRequest(async () => {
      // Re-check cache (another queued request for same user may have resolved)
      const cached2 = getCachedUserData(username);
      if (cached2) return cached2;

      for (let attempt = 0; attempt <= CONSTANTS.MAX_FETCH_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            log(`Retry ${attempt}/${CONSTANTS.MAX_FETCH_RETRIES} for ${username}`);
            await new Promise(r => setTimeout(r, CONSTANTS.RETRY_DELAY * attempt));
          }
          const json = await doFetch(username);
          setCachedUserData(username, json);
          log(`Fetched data for ${username} (attempt ${attempt + 1})`);
          return getCachedUserData(username);
        } catch (error) {
          if (attempt === CONSTANTS.MAX_FETCH_RETRIES) {
            log(`Failed to fetch ${username} after ${attempt + 1} attempts:`, error.message);
            trackApiError();
            return null;
          }
        }
      }
      return null;
    });

    pendingRequests.set(username, requestPromise);
    const result = await requestPromise;
    pendingRequests.delete(username);
    return result;
  } catch (error) {
    pendingRequests.delete(username);
    console.error(`Error in fetchUserData for ${username}:`, error);
    return null;
  }
}
