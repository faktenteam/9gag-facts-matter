"use strict";

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// Checkbox settings — auto-bind to storage
const checkboxBindings = {
  days_checkbox: "show_days",
  spammers_checkbox: "spammers",
  cheers_checkbox: "cheers",
  more_downvotes_checkbox: "more_downvotes",
  hide_spammers_checkbox: "hide_spammers",
  always_display_upvotes_checkbox: "always_display_upvotes",
  show_controls_checkbox: "show_controls",
  hide_meme_checkbox: "hide_meme",
  hide_promoted_checkbox: "hide_promoted",
  hide_videos_checkbox: "hide_videos",
  hide_gifs_checkbox: "hide_gifs",
  hide_images_checkbox: "hide_images",
  hide_potz_checkbox: "hide_potz",
};

const numberBindings = {
  days_input: "min_days",
  spammers_input: "spammers_hours",
};

const textBindings = {
  filter_keywords_input: "filter_keywords",
  filter_tags_input: "filter_tags",
};

// Load all settings
chrome.storage.local.get(allSettingsKeys, (data) => {
  const d = normalizeSettingsData(data);
  const needsSave = allSettingsKeys.some(
    (key) => !settingsValueEquals(data[key], d[key]),
  );
  if (needsSave) {
    chrome.storage.local.set(d);
  }

  // Populate checkboxes
  for (const [elId, key] of Object.entries(checkboxBindings)) {
    $(`#${elId}`).prop("checked", d[key]);
  }

  // Populate number inputs
  for (const [elId, key] of Object.entries(numberBindings)) {
    $(`#${elId}`).val(d[key]);
  }

  // Populate text inputs
  for (const [elId, key] of Object.entries(textBindings)) {
    $(`#${elId}`).val(d[key]);
  }

  // Populate user lists
  renderUserList("blocked_users_list", d.blocked_users || [], "blocked_users");
  renderUserList(
    "whitelisted_users_list",
    d.whitelisted_users || [],
    "whitelisted_users",
  );
});

// Bind checkbox change events
for (const [elId, key] of Object.entries(checkboxBindings)) {
  $(`#${elId}`).on("change", function () {
    chrome.storage.local.set({ [key]: $(this).prop("checked") });
  });
}

// Bind number input change events
for (const [elId, key] of Object.entries(numberBindings)) {
  $(`#${elId}`).on("change", function () {
    const value = parseInt($(this).val(), 10);
    if (!isNaN(value) && value >= 0) {
      chrome.storage.local.set({ [key]: value });
    }
  });
}

// Bind text input change events (debounced)
for (const [elId, key] of Object.entries(textBindings)) {
  let timer;
  $(`#${elId}`).on("input", function () {
    clearTimeout(timer);
    const val = $(this).val();
    timer = setTimeout(() => {
      chrome.storage.local.set({ [key]: val });
    }, 500);
  });
}

// Render a user list with remove buttons
function renderUserList(containerId, users, storageKey) {
  const normalizedUsers = normalizeSettingValue(storageKey, users);
  const container = $(`#${containerId}`);
  container.empty();
  if (!normalizedUsers.length) {
    container.append('<em class="user-list-empty">None</em>');
    return;
  }
  normalizedUsers.forEach((username) => {
    const item = $('<div class="user-list-item"></div>');
    const nameSpan = $("<span></span>").text(username);
    const removeBtn = $('<button class="remove-user">&times;</button>');
    removeBtn.on("click", () => {
      const updated = normalizedUsers.filter((u) => u !== username);
      chrome.storage.local.set({ [storageKey]: updated });
      renderUserList(containerId, updated, storageKey);
    });
    item.append(nameSpan, removeBtn);
    container.append(item);
  });
}

// Listen for storage changes to update user lists in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.blocked_users) {
    renderUserList(
      "blocked_users_list",
      normalizeSettingValue("blocked_users", changes.blocked_users.newValue),
      "blocked_users",
    );
  }
  if (changes.whitelisted_users) {
    renderUserList(
      "whitelisted_users_list",
      normalizeSettingValue(
        "whitelisted_users",
        changes.whitelisted_users.newValue,
      ),
      "whitelisted_users",
    );
  }
});

// Export settings
$("#export_btn").on("click", () => {
  const allKeys = [...settingsKeys, ...listSettingsKeys];
  chrome.storage.local.get(allKeys, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "9gag-fm-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Import settings
$("#import_btn").on("click", () => {
  document.getElementById("import_file").click();
});

$("#import_file").on("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Settings import must be a JSON object");
      }

      const filtered = {};
      for (const key of allSettingsKeys) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          filtered[key] = normalizeSettingValue(key, data[key]);
        }
      }
      if (!Object.keys(filtered).length) {
        throw new Error("Settings import does not contain supported keys");
      }

      chrome.storage.local.set(filtered, () => {
        location.reload();
      });
    } catch (_err) {
      alert("Invalid settings file");
    }
  };
  reader.readAsText(file);
});
