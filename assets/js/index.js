"use strict";

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

  });
});

// Checkbox settings — auto-bind to storage
const checkboxBindings = {
  days_checkbox: 'show_days',
  spammers_checkbox: 'spammers',
  cheers_checkbox: 'cheers',
  more_downvotes_checkbox: 'more_downvotes',
  hide_spammers_checkbox: 'hide_spammers',
  always_display_upvotes_checkbox: 'always_display_upvotes',
  show_controls_checkbox: 'show_controls',
  hide_meme_checkbox: 'hide_meme',
  hide_promoted_checkbox: 'hide_promoted',
  hide_videos_checkbox: 'hide_videos',
  hide_gifs_checkbox: 'hide_gifs',
  hide_images_checkbox: 'hide_images',
  hide_potz_checkbox: 'hide_potz',
};

const numberBindings = {
  days_input: 'min_days',
  spammers_input: 'spammers_hours',
};

const textBindings = {
  filter_keywords_input: 'filter_keywords',
  filter_tags_input: 'filter_tags',
};

// Load all settings
const allKeys = [...settingsKeys, ...listSettingsKeys];
chrome.storage.local.get(allKeys, (data) => {
  const d = Object.assign({}, defaultSettings, defaultListSettings, data);

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
  renderUserList('blocked_users_list', d.blocked_users || [], 'blocked_users');
  renderUserList('whitelisted_users_list', d.whitelisted_users || [], 'whitelisted_users');
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
  const container = $(`#${containerId}`);
  container.empty();
  if (!users.length) {
    container.append('<em class="user-list-empty">None</em>');
    return;
  }
  users.forEach((username) => {
    const item = $('<div class="user-list-item"></div>');
    const nameSpan = $('<span></span>').text(username);
    const removeBtn = $('<button class="remove-user">&times;</button>');
    removeBtn.on('click', () => {
      const updated = users.filter(u => u !== username);
      chrome.storage.local.set({ [storageKey]: updated });
      renderUserList(containerId, updated, storageKey);
    });
    item.append(nameSpan, removeBtn);
    container.append(item);
  });
}

// Listen for storage changes to update user lists in real-time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blocked_users) {
    renderUserList('blocked_users_list', changes.blocked_users.newValue || [], 'blocked_users');
  }
  if (changes.whitelisted_users) {
    renderUserList('whitelisted_users_list', changes.whitelisted_users.newValue || [], 'whitelisted_users');
  }
});

// Export settings
$('#export_btn').on('click', () => {
  const allKeys = [...settingsKeys, ...listSettingsKeys];
  chrome.storage.local.get(allKeys, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '9gag-fm-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Import settings
$('#import_btn').on('click', () => {
  document.getElementById('import_file').click();
});

$('#import_file').on('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const allKeys = [...settingsKeys, ...listSettingsKeys];
      const filtered = {};
      for (const key of allKeys) {
        if (key in data) {
          filtered[key] = data[key];
        }
      }
      chrome.storage.local.set(filtered, () => {
        location.reload();
      });
    } catch (_err) {
      alert('Invalid settings file');
    }
  };
  reader.readAsText(file);
});
