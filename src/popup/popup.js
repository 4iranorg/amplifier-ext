/**
 * Popup script for Iran Amplifier extension settings.
 * Simplified to essential settings only - advanced settings moved to dashboard.
 */

import { getAvailableModels, AVAILABLE_MODELS } from '../lib/api.js';
import { formatCost, formatTokens } from '../lib/cost-tracker.js';

// DOM Elements
const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('api-key');
const toggleKeyBtn = document.getElementById('toggle-key');
const modelSelect = document.getElementById('model');
const testConnectionBtn = document.getElementById('test-connection');
const connectionStatus = document.getElementById('connection-status');
const saveSettingsBtn = document.getElementById('save-settings');
const viewDashboardBtn = document.getElementById('view-dashboard');

// Voice preferences elements
const voiceStyleSelect = document.getElementById('voice-style');
const backgroundSelect = document.getElementById('background');
const approachSelect = document.getElementById('approach');
const responseLengthSelect = document.getElementById('response-length');
const resetPreferencesBtn = document.getElementById('reset-preferences');
const fingerprintValue = document.getElementById('fingerprint-value');

// Stats elements
const statTodayTokens = document.getElementById('stat-today-tokens');
const statTodayCost = document.getElementById('stat-today-cost');
const statMonthTokens = document.getElementById('stat-month-tokens');
const statMonthCost = document.getElementById('stat-month-cost');
const statAllTime = document.getElementById('stat-all-time');

// Update banner elements
const updateBanner = document.getElementById('update-banner');
const updateVersion = document.getElementById('update-version');
const updateLink = document.getElementById('update-link');
const dismissUpdateBtn = document.getElementById('dismiss-update');

/**
 * Create an SVG icon element
 */
function createIcon(name, size = '14px') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 14 14');
  svg.setAttribute('fill', 'none');
  svg.style.display = 'inline-block';
  svg.style.verticalAlign = 'middle';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  switch (name) {
    case 'check':
      path.setAttribute('d', 'M2 7l4 4 6-8');
      break;
    case 'x':
      path.setAttribute('d', 'M3 3l8 8M11 3l-8 8');
      break;
  }

  svg.appendChild(path);
  return svg;
}

/**
 * Populate model dropdown based on provider
 */
function populateModels(provider, selectedModel = null) {
  while (modelSelect.firstChild) {
    modelSelect.removeChild(modelSelect.firstChild);
  }

  const availableModels = getAvailableModels();
  const models = availableModels[provider] || AVAILABLE_MODELS[provider] || [];

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    if (selectedModel === model.id || (!selectedModel && model.default)) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  });
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  const result = await browser.storage.local.get(['apiKey', 'provider', 'model']);

  providerSelect.value = result.provider || 'openai';
  populateModels(providerSelect.value, result.model);
  apiKeyInput.value = result.apiKey || '';

  await loadVoicePreferences();
}

/**
 * Load voice preferences from storage
 */
async function loadVoicePreferences() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getUserPreferences' });
    if (response.success && response.data) {
      const { preferences, seed } = response.data;

      if (preferences) {
        voiceStyleSelect.value = preferences.voiceStyle || 'personal';
        backgroundSelect.value = preferences.background || 'other';
        approachSelect.value = preferences.approach || 'mixed';
        responseLengthSelect.value = preferences.length || 'medium';
      }

      if (seed) {
        fingerprintValue.textContent = seed.slice(0, 3) + '****';
        fingerprintValue.title = 'Your unique voice identifier';
      }
    }
  } catch (error) {
    console.error('Failed to load voice preferences:', error);
  }
}

/**
 * Save voice preferences
 */
async function saveVoicePreferences() {
  const preferences = {
    voiceStyle: voiceStyleSelect.value,
    background: backgroundSelect.value,
    approach: approachSelect.value,
    length: responseLengthSelect.value,
  };

  try {
    await browser.runtime.sendMessage({ type: 'saveUserPreferences', preferences });
  } catch (error) {
    console.error('Failed to save voice preferences:', error);
  }
}

/**
 * Reset voice preferences to defaults
 */
function resetVoicePreferences() {
  voiceStyleSelect.value = 'personal';
  backgroundSelect.value = 'other';
  approachSelect.value = 'mixed';
  responseLengthSelect.value = 'medium';
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  const settings = {
    provider: providerSelect.value,
    apiKey: apiKeyInput.value.trim(),
    model: modelSelect.value,
  };

  await browser.storage.local.set(settings);
  await saveVoicePreferences();

  saveSettingsBtn.replaceChildren(createIcon('check', '14px'), document.createTextNode(' Saved!'));
  setTimeout(() => {
    saveSettingsBtn.textContent = 'Save Settings';
  }, 2000);
}

/**
 * Test API connection
 */
async function testConnection() {
  connectionStatus.textContent = 'Testing...';
  connectionStatus.className = '';

  try {
    await saveSettings();

    const response = await browser.runtime.sendMessage({ type: 'testConnection' });

    if (response.success) {
      connectionStatus.replaceChildren(
        createIcon('check', '14px'),
        document.createTextNode(' Connected!')
      );
      connectionStatus.className = 'success';
    } else {
      connectionStatus.replaceChildren(
        createIcon('x', '14px'),
        document.createTextNode(` ${response.error || 'Failed'}`)
      );
      connectionStatus.className = 'error';
    }
  } catch (error) {
    connectionStatus.replaceChildren(
      createIcon('x', '14px'),
      document.createTextNode(` ${error.message}`)
    );
    connectionStatus.className = 'error';
  }

  setTimeout(() => {
    connectionStatus.textContent = '';
    connectionStatus.className = '';
  }, 5000);
}

/**
 * Create eye icon SVG
 */
function createEyeIcon(visible) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon-eye');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  if (visible) {
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute(
      'd',
      'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94'
    );
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute(
      'd',
      'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19'
    );
    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('d', 'M14.12 14.12a3 3 0 1 1-4.24-4.24');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '1');
    line.setAttribute('y1', '1');
    line.setAttribute('x2', '23');
    line.setAttribute('y2', '23');
    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    svg.appendChild(line);
  } else {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '3');
    svg.appendChild(path);
    svg.appendChild(circle);
  }

  return svg;
}

/**
 * Toggle API key visibility
 */
function toggleKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.replaceChildren(createEyeIcon(true));
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.replaceChildren(createEyeIcon(false));
  }
}

/**
 * Load and display usage statistics
 */
async function loadStats() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getUsageStats' });
    if (response.success) {
      const { today, thisMonth, allTime } = response.data;

      statTodayTokens.textContent = formatTokens(today.tokens);
      statTodayCost.textContent = formatCost(today.cost);

      statMonthTokens.textContent = formatTokens(thisMonth.tokens);
      statMonthCost.textContent = formatCost(thisMonth.cost);

      statAllTime.textContent = `All time: ${allTime.requests} amplifications`;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

/**
 * Open dashboard page in new tab
 */
function openDashboard() {
  browser.tabs.create({ url: browser.runtime.getURL('src/dashboard/dashboard.html') });
  window.close();
}

/**
 * Check for and display update notification
 */
async function checkForUpdate() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getCachedUpdateInfo' });
    if (response.success && response.data) {
      showUpdateBanner(response.data);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

/**
 * Show update banner
 */
function showUpdateBanner(updateInfo) {
  updateVersion.textContent = `v${updateInfo.version}`;
  updateLink.href = updateInfo.url;
  updateBanner.style.display = 'flex';
}

/**
 * Dismiss update notification
 */
async function dismissUpdateNotification() {
  const version = updateVersion.textContent.replace('v', '');
  try {
    await browser.runtime.sendMessage({ type: 'dismissUpdate', version });
    updateBanner.style.display = 'none';
  } catch (error) {
    console.error('Failed to dismiss update:', error);
  }
}

// Event Listeners
providerSelect.addEventListener('change', () => {
  populateModels(providerSelect.value);
});

toggleKeyBtn.addEventListener('click', toggleKeyVisibility);
testConnectionBtn.addEventListener('click', testConnection);
saveSettingsBtn.addEventListener('click', saveSettings);
resetPreferencesBtn.addEventListener('click', resetVoicePreferences);
dismissUpdateBtn.addEventListener('click', dismissUpdateNotification);

viewDashboardBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openDashboard();
});

// Initialize
loadSettings();
loadStats();
checkForUpdate();
