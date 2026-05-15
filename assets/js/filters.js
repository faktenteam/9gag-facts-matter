"use strict";

// All filter/detection functions

function parseCommaSeparated(str) {
  if (!str || typeof str !== "string") return [];
  return str
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function filterByKeywords(post) {
  const keywords = parseCommaSeparated(settings.filter_keywords);
  if (!keywords.length) return false;

  const titleEl = post.find(S.postTitle).first();
  const title = (titleEl.text() || "").toLowerCase();
  if (!title) return false;

  const matched = keywords.some((kw) => title.includes(kw));
  if (matched) {
    post.addClass("hidden-keyword").hide();
    return true;
  }
  return false;
}

function filterByTags(post) {
  const filterTags = parseCommaSeparated(settings.filter_tags);
  if (!filterTags.length) return false;

  const tagEls = post.find(S.postTags);
  if (!tagEls.length) return false;

  const postTags = [];
  tagEls.each((i, el) => {
    postTags.push(($(el).text() || "").trim().toLowerCase());
  });

  const matched = filterTags.some((ft) =>
    postTags.some((pt) => pt.includes(ft)),
  );
  if (matched) {
    post.addClass("hidden-tag").hide();
    return true;
  }
  return false;
}

function filterPromoted(post) {
  if (!settings.hide_promoted) return false;
  const promoted =
    post.find(S.promotedIndicator).length > 0 ||
    post.is(S.promotedIndicator) ||
    (post.attr("class") || "").includes("promoted");
  if (promoted) {
    post.addClass("hidden-promoted").hide();
    return true;
  }
  return false;
}

function filterByMinDays(post, days) {
  const minDays = parseInt(settings.min_days, 10);
  if (!isNaN(minDays) && minDays > 0 && days < minDays) {
    post.closest(S.streamContainer).first().addClass("filtered");
    post.addClass("hidden-min-days").hide();
    return true;
  }
  return false;
}

function isBlockedUser(username) {
  const blocked = settings.blocked_users || [];
  return blocked.some((u) => u.toLowerCase() === username.toLowerCase());
}

function isWhitelistedUser(username) {
  const whitelisted = settings.whitelisted_users || [];
  return whitelisted.some((u) => u.toLowerCase() === username.toLowerCase());
}

function calculateSpamScore(posts) {
  if (posts.length < CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) {
    return null;
  }

  const validPosts = posts.filter(
    (p) => p.creationTs && typeof p.creationTs === "number",
  );
  if (validPosts.length < CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) {
    if (posts.length >= CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) {
      log(
        `Spam score: ${posts.length - validPosts.length} of ${posts.length} posts had invalid timestamps, reducing valid posts below threshold`,
      );
    }
    return null;
  }

  const postDiffs = validPosts.map((p, i) => {
    if (i === 0) {
      return (Date.now() / 1000 - p.creationTs) / 3600;
    }
    return (validPosts[i - 1].creationTs - p.creationTs) / 3600;
  });

  return postDiffs.reduce((a, b) => a + b) / postDiffs.length;
}

function filterByMediaType(post) {
  const hasVideo = post.find(S.videoPost).length > 0;
  const hasGif = !hasVideo && post.find(S.gifPost).length > 0;

  if (settings.hide_videos && hasVideo) {
    post.addClass("hidden-media").hide();
    return true;
  }
  if (settings.hide_gifs && hasGif) {
    post.addClass("hidden-media").hide();
    return true;
  }
  if (settings.hide_images && !hasVideo && !hasGif) {
    post.addClass("hidden-media").hide();
    return true;
  }
  return false;
}

function handleSpammer(post, avgHoursBetweenPosts) {
  const threshold = !isNaN(settings.spammers_hours)
    ? settings.spammers_hours
    : CONSTANTS.DEFAULT_SPAMMER_HOURS;

  if (avgHoursBetweenPosts < threshold) {
    if (settings.hide_spammers) {
      post.addClass("hidden-spammer").hide();
      return true;
    } else {
      const spam = post.find(".pf-spam");
      if (spam.length) {
        spam.show();
      } else {
        appendToPostHeader(post, `<span class="spammer-label">SPAMMER</span>`);
      }
    }
  }
  return false;
}
