"use strict";

// Main entry point — initialization, navigation, post processing, observers

// Check if jQuery/Cash.js is available
if (typeof $ === 'undefined') {
  console.error('9GAG facts matter: jQuery/Cash.js is not loaded. Extension cannot function.');
  throw new Error('Required library $ is not available');
}

// Promise to track when settings are loaded
const settingsLoaded = new Promise((resolve) => {
  const allKeys = [...settingsKeys, ...listSettingsKeys];
  chrome.storage.local.get(allKeys, (data) => {
    const merged = Object.assign({}, defaultSettings, defaultListSettings, data);
    const needsSave = allKeys.some(k => data[k] === undefined);
    if (needsSave) {
      chrome.storage.local.set(merged);
    }
    settings = merged;
    log('Settings loaded:', JSON.stringify(settings));
    resolve();
  });
});

// Intersection Observer for lazy processing — only process posts near the viewport
const postIntersectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      postIntersectionObserver.unobserve(entry.target);
      processPost($(entry.target));
    }
  }
}, { rootMargin: '200px 0px' });

function queuePost(postElement) {
  if (processedPosts.has(postElement)) return;
  if (postElement.classList.contains('filtering')) return;
  postElement.classList.add('filtering');
  postIntersectionObserver.observe(postElement);
}

let reprocessTimer = null;
const reprocessKeys = new Set([...settingsKeys, ...listSettingsKeys]);
chrome.storage.onChanged.addListener((changes) => {
  let needsReprocess = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
    if (reprocessKeys.has(key)) needsReprocess = true;
  }
  if (!needsReprocess) return;
  log('Settings changed:', Object.keys(changes).join(', '));
  clearTimeout(reprocessTimer);
  reprocessTimer = setTimeout(reprocessAllPosts, 300);
});

function reprocessAllPosts() {
  $(S.processed).each((i, el) => {
    const $el = $(el);
    stripInjectedContent($el);
    $el.removeClass('pf-processed filtering hidden hidden-spammer hidden-min-days hidden-keyword hidden-tag hidden-promoted hidden-blocked hidden-media').show();
    $el.closest(S.streamContainer).css('min-height', '');
    processedPosts.delete(el);
  });
  // Mark stream containers for min-height collapse when hiding posts
  if (settings.hide_spammers || settings.more_downvotes || settings.min_days > 0) {
    $(S.streamContainer).addClass('filtered');
  }
  // Re-queue all unprocessed articles
  document.querySelectorAll(S.unprocessed).forEach(article => queuePost(article));
}

let lastUrl = location.href;

function handleNavigation() {
  const currentUrl = location.href;
  if (currentUrl === lastUrl) return;
  saveScrollPosition(lastUrl);
  lastUrl = currentUrl;
  log('Navigation detected →', currentUrl);

  $(S.processed).each((i, el) => {
    stripInjectedContent($(el));
    processedPosts.delete(el);
  });
  $(S.processed).removeClass('pf-processed filtering hidden hidden-spammer hidden-min-days hidden-keyword hidden-tag hidden-promoted hidden-blocked hidden-media').show();

  // Toggle flash-prevention CSS based on page type
  document.body.classList.toggle('pf-active', urlExcludes('/u/'));

  // Re-queue any articles already in the DOM after navigation
  // (new articles added by Vue will be caught by the article observer)
  document.querySelectorAll(S.unprocessed).forEach(article => queuePost(article));

  if (urlExcludes("/gag/") && urlExcludes("/u/")) {
    restoreScrollPosition();
  }
}

window.addEventListener("popstate", handleNavigation);

// Detect SPA navigation via title changes (pushState)
const titleEl = document.querySelector('title');
if (titleEl) {
  new MutationObserver(() => handleNavigation()).observe(titleEl, {
    childList: true, characterData: true, subtree: true,
  });
}

// --- Scroll position save / restore for SPA navigation ---
const SCROLL_HEADER_OFFSET = 60;

function getTopVisibleArticle() {
  const articles = document.querySelectorAll('article');
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    if (rect.top >= -100 && rect.top < window.innerHeight && article.id) {
      return article.id;
    }
  }
  return null;
}

function saveScrollPosition(path) {
  try {
    const data = { timestamp: Date.now(), articleId: getTopVisibleArticle(), scrollY: window.scrollY };
    sessionStorage.setItem('9gfm_scroll_' + (path || location.pathname), JSON.stringify(data));
  } catch (_e) { /* quota exceeded or private mode */ }
}

function restoreScrollPosition() {
  const key = '9gfm_scroll_' + location.pathname;
  let saved;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) saved = JSON.parse(raw);
  } catch (_e) { return; }
  if (!saved) return;

  let attempts = 0;
  const interval = setInterval(() => {
    let restored = false;
    if (saved.articleId) {
      const el = document.getElementById(saved.articleId);
      if (el) {
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - SCROLL_HEADER_OFFSET, behavior: 'auto' });
        restored = true;
      }
    }
    if (!restored && saved.scrollY > 0 && document.body.scrollHeight >= saved.scrollY) {
      window.scrollTo(0, saved.scrollY);
      if (Math.abs(window.scrollY - saved.scrollY) < 50) restored = true;
    }
    attempts++;
    if (restored || attempts >= 20) clearInterval(interval);
  }, 100);
}

// Save before click-based navigation
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link || !link.href) return;
  try {
    const url = new URL(link.href, location.origin);
    if (url.origin === location.origin && url.pathname !== location.pathname) {
      saveScrollPosition();
    }
  } catch (_err) { /* invalid URL */ }
}, true);

// Main initialization
(async function initExtension() {
  await settingsLoaded;

  // Validate DOM selectors and warn if 9GAG layout changed
  validateSelectors();

  const containerElement = document.querySelector(S.container);
  log('Init: URL =', location.href);
  log('Init: container found =', !!containerElement);

  if (containerElement) {
    document.body.classList.toggle('pf-active', urlExcludes('/u/'));

    // Single observer: detect new articles and stream-containers as Vue renders them.
    // This replaces the old chain of list-view → stream-container → article observers.
    createAddObserver(
      containerElement,
      (addedNode) => {
        if (addedNode.nodeType !== Node.ELEMENT_NODE) return;
        // Collapse stream-container height when hiding posts
        if (addedNode.matches?.(S.streamContainer) && (settings.hide_spammers || settings.more_downvotes || settings.min_days > 0)) {
          addedNode.classList.add('filtered');
        }
        // Queue individual articles for processing
        if (addedNode.matches?.('article')) {
          queuePost(addedNode);
          return;
        }
        // Queue articles inside added containers (stream-container, list-view, etc.)
        const articles = addedNode.querySelectorAll?.(S.unprocessed);
        if (articles?.length) {
          articles.forEach(article => queuePost(article));
        }
      },
      { childList: true, subtree: true },
    );

    // Process articles already in the DOM
    document.querySelectorAll(S.unprocessed).forEach(article => queuePost(article));
  }
})();

// Delegated click handlers for block/whitelist buttons
document.addEventListener('click', (e) => {
  const blockBtn = e.target.closest('.pf-block-btn, .block-btn');
  const wlBtn = e.target.closest('.pf-wl-btn, .whitelist-btn');
  if (!blockBtn && !wlBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const username = decodeURIComponent((blockBtn || wlBtn).dataset.username);
  if (!username) return;

  if (blockBtn) {
    const blocked = settings.blocked_users || [];
    if (!blocked.some(u => u.toLowerCase() === username.toLowerCase())) {
      blocked.push(username);
      chrome.storage.local.set({ blocked_users: blocked });
    }
  } else {
    const whitelisted = settings.whitelisted_users || [];
    if (!whitelisted.some(u => u.toLowerCase() === username.toLowerCase())) {
      whitelisted.push(username);
      chrome.storage.local.set({ whitelisted_users: whitelisted });
    }
  }
});

// Re-apply cached info when Vue.js re-renders article DOM (virtual scrolling)
function reapplyFromCache(post) {
  const articleId = post.attr("id");
  if (!articleId) return;

  const creatorLink = post.find(S.creatorUserLink).first();
  const authorEl = post.find(S.postCreatorAuthor);
  let username = null;
  if (creatorLink.length) {
    const match = creatorLink.attr("href")?.match(/\/u\/([^/?]+)/);
    username = match ? match[1] : null;
  } else if (authorEl.length) {
    username = authorEl.text()?.trim();
  }
  if (!username) return;

  const cached = getCachedUserData(username);
  if (!cached) return;

  const profile = cached.profile;
  const posts = cached.posts;
  if (!profile || !posts) return;

  log('Reapplying cached info for', username, 'on', articleId);

  if (isBlockedUser(username)) {
    post.addClass('hidden-blocked').hide();
    return;
  }

  stripInjectedContent(post);

  // Build the info bar for reapply (same as addUsername does for fresh posts)
  if (!post.find('.pf-info').length) {
    const hasAuthor = post.find(S.postCreatorAuthor).length > 0;
    appendToPostHeader(post, createInfoBar(username, hasAuthor));
  }

  const whitelisted = isWhitelistedUser(username);
  const accountAge = calculateAccountAge(profile.creationTs);
  if (!whitelisted && filterByMinDays(post, accountAge)) return;

  addAccountAge(post, accountAge);

  if (!whitelisted && settings.spammers) {
    const avgHours = calculateSpamScore(posts);
    if (avgHours !== null) {
      if (handleSpammer(post, avgHours)) return;
    }
  }

  const postId = getPostId(post);
  if (postId) {
    const { downvotes, upvotes } = findPostVotes(posts, postId);
    addVoteCounts(post, downvotes, upvotes);
  }

  addVideoControls(post);
  hideCheersBadges(post);
  hideMemeButton(post);
  hidePotzBadges(post);
}

// Watch for Vue.js re-rendering (virtual scrolling strips our injected elements)
const reapplyObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const article = mutation.target.closest?.('article.pf-processed');
    if (!article) continue;
    const $article = $(article);
    const hasOurContent = article.querySelector(S.injectedAll);
    if (hasOurContent) continue;
    if (article._reapplyTimeout) continue;
    article._reapplyTimeout = setTimeout(() => {
      reapplyFromCache($article);
      article._reapplyTimeout = null;
    }, 100);
  }
});
reapplyObserver.observe(document.querySelector(S.container) || document.body, { childList: true, subtree: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  activeIntervals.forEach(interval => clearInterval(interval));
  activeIntervals = [];
  reapplyObserver.disconnect();
  postIntersectionObserver.disconnect();
});



// Periodic cache cleanup (memory + persistent storage)
const cacheCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [username, cached] of userDataCache.entries()) {
    if (now - cached.timestamp >= CONSTANTS.CACHE_DURATION) {
      userDataCache.delete(username);
    }
  }
  // Clean expired persistent cache entries
  chrome.storage.local.get(null, (items) => {
    const expired = Object.keys(items).filter(k => {
      if (!k.startsWith('uc_')) return false;
      const entry = items[k];
      return !entry || !entry.timestamp || (now - entry.timestamp >= CONSTANTS.CACHE_DURATION);
    });
    if (expired.length) chrome.storage.local.remove(expired);
  });
}, CONSTANTS.CACHE_DURATION);
activeIntervals.push(cacheCleanupInterval);


async function processPost(post) {
  const postElement = post[0];

  if (processedPosts.has(postElement)) {
    log('Skipping already processed post:', post.attr("id"));
    return;
  }

  const t0 = performance.now();
  try {
    post.addClass("filtering");
    processedPosts.add(postElement);

    // Early filters that don't need API calls
    if (filterPromoted(post)) { post.addClass("pf-processed"); return; }
    if (filterByKeywords(post)) { post.addClass("pf-processed"); return; }
    if (filterByTags(post)) { post.addClass("pf-processed"); return; }
    if (filterByMediaType(post)) { post.addClass("pf-processed"); return; }

    addVideoControls(post);
    hideCheersBadges(post);
    hideMemeButton(post);
    hidePotzBadges(post);

    const articleId = post.attr("id") || null;
    const tName0 = performance.now();
    const username = await addUsername(post, articleId);
    const tName1 = performance.now();
    if (!username) {
      log('Could not extract username for post:', articleId, `(${(tName1-tName0).toFixed(0)}ms)`);
      post.addClass("pf-processed");
      return;
    }
    log('Found username:', username, 'for post:', articleId, `(${(tName1-tName0).toFixed(0)}ms)`);

    if (isBlockedUser(username)) {
      post.addClass('hidden-blocked').hide();
      post.addClass("pf-processed");
      return;
    }

    const whitelisted = isWhitelistedUser(username);

    if (whitelisted || settings.show_days || settings.min_days > 0 || settings.spammers || settings.more_downvotes || settings.always_display_upvotes) {
      const tFetch0 = performance.now();
      const userData = await fetchUserData(username);
      const tFetch1 = performance.now();
      log('API for', username + ':', `${(tFetch1-tFetch0).toFixed(0)}ms`, userData ? '(ok)' : '(failed)');
      if (!userData) {
        post.addClass("pf-processed");
        return;
      }

      const profile = userData.profile;
      const posts = userData.posts;

      if (!profile || !posts) {
        post.addClass("pf-processed");
        return;
      }

      if (!profile.creationTs || typeof profile.creationTs !== 'number') {
        post.addClass("pf-processed");
        return;
      }
      const accountAge = calculateAccountAge(profile.creationTs);

      if (!whitelisted && filterByMinDays(post, accountAge)) {
        post.addClass("pf-processed");
        return;
      }

      addAccountAge(post, accountAge);

      if (!whitelisted && settings.spammers) {
        const avgHours = calculateSpamScore(posts);
        log('Spam score for', username + ':', avgHours, 'hours (threshold:', (!isNaN(settings.spammers_hours) ? settings.spammers_hours : CONSTANTS.DEFAULT_SPAMMER_HOURS) + ')');
        if (avgHours !== null) {
          const wasRemoved = handleSpammer(post, avgHours);
          if (wasRemoved) {
            post.addClass("pf-processed");
            return;
          }
        }
      }

      const postId = getPostId(post);
      if (postId) {
        const { downvotes, upvotes } = findPostVotes(posts, postId);
        const wasHidden = addVoteCounts(post, downvotes, upvotes);
        if (wasHidden) return;
      }
    }

    post.addClass("pf-processed");
    log('Post', post.attr("id"), 'done in', `${(performance.now()-t0).toFixed(0)}ms`);
  } catch (error) {
    console.error("Error processing post:", error);
    post.addClass("pf-processed");
  }
}

