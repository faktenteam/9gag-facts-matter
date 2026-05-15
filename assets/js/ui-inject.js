"use strict";

// DOM manipulation for injecting/removing content in 9GAG posts

function stripInjectedContent(post) {
  post.find(".pf-info").remove();
  post.find(S.injectedAll).remove();
  post.find(S.userLink).parent("span").remove();
  post.find(".block-btn, .whitelist-btn, .pf-block-btn, .pf-wl-btn").remove();
  post.find("video").removeAttr("controls");
  post.find(`${S.postAward}, ${S.postAwardUsers}`).show();
  post.find(S.createMemeBtn).show();
}

function calculateAccountAge(creationTs) {
  const now = Date.now() / 1000;
  const diff = now - creationTs;
  return Math.floor(diff / CONSTANTS.SECONDS_PER_DAY);
}

function appendToTarget(target, content, shouldClone) {
  if (!target.length) return;
  if (content && typeof content.cloneNode === "function") {
    target.append(shouldClone ? content.cloneNode(true) : content);
  } else {
    target.append(content);
  }
}

function appendToPostHeader(post, content) {
  if (post.find(S.postCreator).length) {
    appendToTarget(post.find(S.postCreator).first(), content, false);
  } else {
    appendToTarget(post.find(S.postHeaderLeft).first(), content, false);
    appendToTarget(post.find(S.postMetaMobile).first(), content, true);
  }
}

function createInfoBar(username, hasAuthor) {
  const encodedName = encodeURIComponent(username);
  const infoBar = document.createElement("span");
  infoBar.className = "pf-info";

  if (!hasAuthor) {
    const userLink = document.createElement("a");
    userLink.className = "pf-user";
    userLink.href = `https://9gag.com/u/${encodedName}`;
    userLink.textContent = `@${username}`;
    infoBar.appendChild(userLink);
  }

  const age = document.createElement("span");
  age.className = "pf-age";
  infoBar.appendChild(age);

  const spam = document.createElement("span");
  spam.className = "pf-spam";
  spam.textContent = CONSTANTS.SPAMMER_LABEL;
  infoBar.appendChild(spam);

  const actions = document.createElement("span");
  actions.className = "pf-actions";

  const blockButton = document.createElement("span");
  blockButton.className = "pf-block-btn";
  blockButton.dataset.username = encodedName;
  blockButton.title = "Block user";
  blockButton.textContent = "×";

  const whitelistButton = document.createElement("span");
  whitelistButton.className = "pf-wl-btn";
  whitelistButton.dataset.username = encodedName;
  whitelistButton.title = "Whitelist user";
  whitelistButton.textContent = "☆";

  actions.append(blockButton, whitelistButton);
  infoBar.appendChild(actions);

  return infoBar;
}

function addAccountAge(post, days) {
  if (!settings.show_days) return;
  const info = post.find(".pf-info");
  if (info.length) {
    info.find(".pf-age").text(`${days}d`).show();
  } else {
    appendToPostHeader(post, `<span class="days-label">${days}d</span>`);
  }
}

function addVideoControls(post) {
  if (!settings.show_controls) return;

  const video = post.find("video").first();
  if (video.length) {
    video.attr("controls", "controls");
  }
}

async function addUsername(post, articleId) {
  try {
    let name = null;

    // Fast path: extract username directly from DOM (no clicks needed)
    const creatorLink = post.find(S.creatorUserLink).first();
    if (creatorLink.length) {
      const href = creatorLink.attr("href");
      const match = href && href.match(/\/u\/([^/?]+)/);
      name = match ? match[1] : null;
      log("Fast DOM extraction →", name);
    }

    // Try any /u/ link in the post
    if (!name) {
      const authorLink = post.find(S.anyUserLink).first();
      if (authorLink.length) {
        const href = authorLink.attr("href");
        const match = href && href.match(/\/u\/([^/?]+)/);
        name = match ? match[1] : null;
        log("Author link extraction →", name);
      }
    }

    // Slow fallback: click popup menu to get username
    if (!name && articleId) {
      name = await getNameFromMenu(articleId);
      log('getNameFromMenu("' + articleId + '") →', name);
    }

    if (!name) {
      log(
        "No username found for post, links available:",
        post.find("a").length,
      );
    }

    if (!name) return null;

    // Build the unified info bar
    if (!post.find(".pf-info").length) {
      const hasAuthor = post.find(S.postCreatorAuthor).length > 0;
      appendToPostHeader(post, createInfoBar(name, hasAuthor));
    }

    return name;
  } catch (error) {
    console.error("Error adding username:", error);
    return null;
  }
}

function hideCheersBadges(post) {
  if (settings.cheers && post.find(S.postAward).length) {
    post.find(S.postAward).hide();
  }

  if (settings.cheers && post.find(S.postAwardUsers).length) {
    post.find(S.postAwardUsers).hide();
  }
}

function hideMemeButton(post) {
  if (settings.hide_meme) {
    post.find(S.createMemeBtn).hide();
  }
}

function hidePotzBadges(post) {
  if (settings.hide_potz) {
    post.find(S.potzBadge).hide();
  }
}

function getPostId(post) {
  try {
    const headerLinks = post.find(S.headerLinks);
    if (!headerLinks || !headerLinks.length) return null;

    const lastLink = headerLinks[headerLinks.length - 1];
    if (!lastLink || !lastLink.href) return null;

    const parts = lastLink.href.split("/");
    if (!parts || parts.length === 0) return null;

    const postId = parts[parts.length - 1];
    return postId || null;
  } catch (error) {
    console.error("Error getting post ID:", error);
    return null;
  }
}

function findPostVotes(posts, postId) {
  const post = posts.find((p) => p.id === postId);
  return post
    ? { downvotes: post.downVoteCount, upvotes: post.upVoteCount }
    : { downvotes: null, upvotes: null };
}

function addVoteCounts(post, downvotes, upvotes, allowHiding = true) {
  if (downvotes === null || upvotes === null) return false;

  if (allowHiding && settings.more_downvotes && downvotes > upvotes) {
    post.closest(S.streamContainer).first().addClass("filtered");
    post.hide();
    return true;
  }

  const upvoteElement = post.find(S.upvote).eq(1);
  if (
    settings.always_display_upvotes &&
    upvoteElement.length &&
    upvoteElement.html() === "•"
  ) {
    const parsedUpvotes = parseInt(upvotes, 10);
    upvoteElement.text(isNaN(parsedUpvotes) ? "-" : parsedUpvotes);
  }

  // Sanitize vote counts (should be numbers, but be safe)
  const safeDownvotes = parseInt(downvotes, 10) || 0;
  const downvoteSpan = `<span class="post-vote__text downvote upvote">${safeDownvotes}</span>`;
  post.find(S.postVote).append(downvoteSpan);
  post
    .find(S.downvoteGrouped)
    .after(`<span class="post-vote__text downvote">${safeDownvotes}</span>`);

  return false;
}
