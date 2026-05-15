"use strict";

function createAddObserver(
  targetElement,
  callback,
  options = { childList: true },
) {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => {
        callback(addedNode);
      });
    });
  });
  observer.observe(targetElement, options);

  return observer;
}

function urlExcludes(...urlFragments) {
  let result = true;

  if (urlFragments) {
    for (const arg of urlFragments) {
      result = result && !window.location.pathname.includes(arg);
    }
  }
  return result;
}

async function getNameFromMenu(art_id) {
  try {
    const article = document.getElementById(art_id);
    if (!article) return null;

    // Try desktop menu first
    const popupMenu = article.querySelector(S.popupMenu);
    if (popupMenu) {
      const button = popupMenu.querySelector(S.menuButton);
      if (!button) return null;

      // Hide menu visually while extracting username to prevent flicker
      popupMenu.style.cssText =
        "position:fixed!important;left:-9999px!important;opacity:0!important;pointer-events:none!important";
      try {
        // Click to open menu
        button.click();

        // Wait for menu to populate with a timeout
        const menuLinks = await waitForElement(
          () => popupMenu.querySelectorAll(S.menuLinks),
          1000,
        );

        if (menuLinks && menuLinks.length > 0) {
          const lastLink = menuLinks[menuLinks.length - 1];
          const text = lastLink.textContent || lastLink.innerText;
          const nameParts = text.split("@");
          const name = nameParts.length > 1 ? nameParts[1].trim() : null;

          // Close menu
          button.click();
          return name;
        }

        // Close menu if we couldn't get the name
        button.click();
        return null;
      } finally {
        popupMenu.style.cssText = "";
      }
    }

    // Try mobile alternative - look for user link in post meta
    const userLink = article.querySelector(S.anyUserLink);
    if (userLink) {
      const href = userLink.getAttribute("href");
      const match = href.match(/\/u\/([^/?]+)/);
      return match ? match[1] : null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting username from menu:", error);
    return null;
  }
}

// Helper function to wait for an element with timeout
function waitForElement(selector, timeout = 1000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = 50;

    const check = () => {
      const result =
        typeof selector === "function"
          ? selector()
          : document.querySelectorAll(selector);

      if (result && (result.length > 0 || result.nodeType)) {
        resolve(result);
      } else if (Date.now() - startTime >= timeout) {
        resolve(null);
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}
