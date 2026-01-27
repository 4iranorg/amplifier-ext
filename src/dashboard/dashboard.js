/**
 * Dashboard script for Iran Amplifier extension.
 * Combines activity tracking and settings management.
 */

import { formatCost, formatTokens, getLocalDateKey } from '../lib/cost-tracker.js';
import { getDefaultPrompt } from '../lib/prompts.js';
import { getAvailableModels, AVAILABLE_MODELS } from '../lib/api.js';

// State
let allArguments = [];
let allCTAs = [];
let selectedArguments = [];
let selectedCTAs = [];

// DOM Elements - Activity
const totalAmplifications = document.getElementById('total-amplifications');
const currentStreak = document.getElementById('current-streak');
const bestDay = document.getElementById('best-day');
const graphGrid = document.getElementById('graph-grid');
const graphMonths = document.getElementById('graph-months');
const shareBtn = document.getElementById('share-stats');

// Usage elements
const usageTodayTokens = document.getElementById('usage-today-tokens');
const usageTodayCost = document.getElementById('usage-today-cost');
const usageWeekTokens = document.getElementById('usage-week-tokens');
const usageWeekCost = document.getElementById('usage-week-cost');
const usageMonthTokens = document.getElementById('usage-month-tokens');
const usageMonthCost = document.getElementById('usage-month-cost');
const usageAllTokens = document.getElementById('usage-all-tokens');
const usageAllCost = document.getElementById('usage-all-cost');

// Arguments elements
const argumentsGrid = document.getElementById('arguments-grid');
const selectAllArgs = document.getElementById('select-all-args');
const deselectAllArgs = document.getElementById('deselect-all-args');
const saveArgumentsBtn = document.getElementById('save-arguments');

// CTAs elements
const ctasGrid = document.getElementById('ctas-grid');
const selectAllCTAs = document.getElementById('select-all-ctas');
const deselectAllCTAs = document.getElementById('deselect-all-ctas');
const saveCTAsBtn = document.getElementById('save-ctas');

// Style prompt elements
const customPromptTextarea = document.getElementById('custom-prompt');
const resetPromptBtn = document.getElementById('reset-prompt');
const savePromptBtn = document.getElementById('save-prompt');

// Config elements
const useRemoteConfigCheckbox = document.getElementById('use-remote-config');
const configStatusValue = document.getElementById('config-status-value');
const refreshConfigBtn = document.getElementById('refresh-config');

// Community elements
const shareStatsToggle = document.getElementById('share-stats-toggle');
const contributeHotPosts = document.getElementById('contribute-hot-posts');

// API Configuration elements
const apiProviderSelect = document.getElementById('api-provider');
const apiModelSelect = document.getElementById('api-model');
const apiKeyInput = document.getElementById('api-key');
const toggleApiKeyBtn = document.getElementById('toggle-api-key');
const testApiConnectionBtn = document.getElementById('test-api-connection');
const apiConnectionStatus = document.getElementById('api-connection-status');
const saveApiConfigBtn = document.getElementById('save-api-config');

// Voice Preferences elements
const voiceStyleSelect = document.getElementById('voice-style');
const voiceBackgroundSelect = document.getElementById('voice-background');
const voiceApproachSelect = document.getElementById('voice-approach');
const voiceLengthSelect = document.getElementById('voice-length');
const voiceFingerprintValue = document.getElementById('voice-fingerprint-value');
const resetVoiceBtn = document.getElementById('reset-voice');
const saveVoiceBtn = document.getElementById('save-voice');

// Danger zone
const clearDataBtn = document.getElementById('clear-data');

// Spread the word
const copyLinkBtn = document.getElementById('copy-link');

// ============================================
// Activity Functions (from activity.js)
// ============================================

/**
 * Get activity level (0-4) based on count
 */
function getActivityLevel(count, maxCount) {
  if (count === 0) {
    return 0;
  }
  if (maxCount <= 4) {
    return Math.min(count, 4);
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 4;
  }
  if (ratio >= 0.5) {
    return 3;
  }
  if (ratio >= 0.25) {
    return 2;
  }
  return 1;
}

/**
 * Format date for display
 */
function formatDate(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get short month name
 */
function getMonthName(date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Calculate streak
 */
function calculateStreak(activityLog) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = getLocalDateKey(date);

    if (activityLog[key] && activityLog[key] > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

/**
 * Find best day
 */
function findBestDay(activityLog) {
  let max = 0;
  for (const count of Object.values(activityLog)) {
    if (count > max) {
      max = count;
    }
  }
  return max;
}

/**
 * Calculate total
 */
function calculateTotal(activityLog) {
  return Object.values(activityLog).reduce((sum, count) => sum + count, 0);
}

/**
 * Clear all children from an element
 */
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Render the activity graph
 */
function renderGraph(activityLog) {
  clearElement(graphGrid);
  clearElement(graphMonths);

  const weeks = 52;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - dayOfWeek);

  const startDate = new Date(lastSunday);
  startDate.setDate(lastSunday.getDate() - (weeks - 1) * 7);

  const maxCount = findBestDay(activityLog);
  const monthLabels = [];
  let currentMonth = -1;

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + week * 7);

    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);

      if (date > today) {
        const cell = document.createElement('div');
        cell.className = 'graph-cell level-0';
        cell.style.visibility = 'hidden';
        graphGrid.appendChild(cell);
        continue;
      }

      const key = getLocalDateKey(date);
      const count = activityLog[key] || 0;
      const level = getActivityLevel(count, maxCount);

      if (day === 0) {
        const month = date.getMonth();
        if (month !== currentMonth) {
          monthLabels.push({
            name: getMonthName(date),
            week: week,
          });
          currentMonth = month;
        }
      }

      const cell = document.createElement('div');
      cell.className = `graph-cell level-${level}`;
      cell.dataset.tooltip = `${count} amplification${count !== 1 ? 's' : ''} on ${formatDate(date)}`;
      graphGrid.appendChild(cell);
    }
  }

  const cellWidth = 15;
  for (const label of monthLabels) {
    const span = document.createElement('span');
    span.textContent = label.name;
    span.style.left = `${label.week * cellWidth}px`;
    graphMonths.appendChild(span);
  }
}

/**
 * Load activity data
 */
async function loadActivity() {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'getActivityLog',
      days: 365,
    });

    if (response.success) {
      const activityLog = response.data;
      totalAmplifications.textContent = calculateTotal(activityLog);
      currentStreak.textContent = calculateStreak(activityLog);
      bestDay.textContent = findBestDay(activityLog);
      renderGraph(activityLog);
    }
  } catch (error) {
    console.error('Failed to load activity:', error);
  }
}

/**
 * Load usage statistics
 */
async function loadUsage() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getUsageStats' });

    if (response.success) {
      const { today, thisMonth, allTime } = response.data;

      usageTodayTokens.textContent = formatTokens(today.tokens);
      usageTodayCost.textContent = formatCost(today.cost);

      const weekStats = await calculateWeekStats();
      usageWeekTokens.textContent = formatTokens(weekStats.tokens);
      usageWeekCost.textContent = formatCost(weekStats.cost);

      usageMonthTokens.textContent = formatTokens(thisMonth.tokens);
      usageMonthCost.textContent = formatCost(thisMonth.cost);

      usageAllTokens.textContent = formatTokens(allTime.tokens);
      usageAllCost.textContent = formatCost(allTime.cost);
    }
  } catch (error) {
    console.error('Failed to load usage:', error);
  }
}

/**
 * Calculate week stats
 */
async function calculateWeekStats() {
  try {
    const result = await browser.storage.local.get(['usageStats']);
    const stats = result.usageStats || { daily: {} };

    const today = new Date();
    let weekTokens = 0;
    let weekCost = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      if (stats.daily[key]) {
        weekTokens += stats.daily[key].tokens || 0;
        weekCost += stats.daily[key].cost || 0;
      }
    }

    return { tokens: weekTokens, cost: weekCost };
  } catch (_error) {
    return { tokens: 0, cost: 0 };
  }
}

// ============================================
// Arguments & CTAs Functions
// ============================================

/**
 * Create argument checkbox item
 */
function createArgumentItem(arg) {
  const label = document.createElement('label');
  label.className = `selection-item ${arg.type === 'exclude' ? 'exclude' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = arg.id;
  checkbox.checked = selectedArguments.includes(arg.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      if (!selectedArguments.includes(arg.id)) {
        selectedArguments.push(arg.id);
      }
    } else {
      selectedArguments = selectedArguments.filter((id) => id !== arg.id);
    }
  });

  const content = document.createElement('div');
  content.className = 'item-content';

  const title = document.createElement('span');
  title.className = 'item-title';
  title.textContent = arg.title;
  if (arg.type === 'exclude') {
    const badge = document.createElement('span');
    badge.className = 'exclude-badge';
    badge.textContent = 'Exclude';
    title.appendChild(badge);
  }

  const desc = document.createElement('span');
  desc.className = 'item-description';
  desc.textContent = arg.description;

  content.appendChild(title);
  content.appendChild(desc);
  label.appendChild(checkbox);
  label.appendChild(content);

  return label;
}

/**
 * Create CTA checkbox item
 */
function createCTAItem(cta) {
  const label = document.createElement('label');
  label.className = 'selection-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = cta.id;
  checkbox.checked = selectedCTAs.includes(cta.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      if (!selectedCTAs.includes(cta.id)) {
        selectedCTAs.push(cta.id);
      }
    } else {
      selectedCTAs = selectedCTAs.filter((id) => id !== cta.id);
    }
  });

  const content = document.createElement('div');
  content.className = 'item-content';

  const title = document.createElement('span');
  title.className = 'item-title';
  title.textContent = cta.title;

  const desc = document.createElement('span');
  desc.className = 'item-description';
  desc.textContent = cta.description;

  content.appendChild(title);
  content.appendChild(desc);
  label.appendChild(checkbox);
  label.appendChild(content);

  return label;
}

/**
 * Render arguments grid
 */
function renderArguments() {
  clearElement(argumentsGrid);

  const includeArgs = allArguments.filter((a) => a.type === 'include');
  const excludeArgs = allArguments.filter((a) => a.type === 'exclude');

  for (const arg of includeArgs) {
    argumentsGrid.appendChild(createArgumentItem(arg));
  }

  if (excludeArgs.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'section-separator';
    const separatorText = document.createElement('span');
    separatorText.textContent = 'Sources to Exclude';
    separator.appendChild(separatorText);
    argumentsGrid.appendChild(separator);

    for (const arg of excludeArgs) {
      argumentsGrid.appendChild(createArgumentItem(arg));
    }
  }
}

/**
 * Render CTAs grid
 */
function renderCTAs() {
  clearElement(ctasGrid);
  for (const cta of allCTAs) {
    ctasGrid.appendChild(createCTAItem(cta));
  }
}

/**
 * Load arguments and CTAs
 */
async function loadArgumentsAndCTAs() {
  try {
    const argsResponse = await browser.runtime.sendMessage({ type: 'getArguments' });
    if (argsResponse.success) {
      allArguments = argsResponse.data;
    }

    const ctasResponse = await browser.runtime.sendMessage({ type: 'getCallToActions' });
    if (ctasResponse.success) {
      allCTAs = ctasResponse.data;
    }

    const selectedArgsResponse = await browser.runtime.sendMessage({
      type: 'getSelectedArguments',
    });
    if (selectedArgsResponse.success) {
      const existingArgs = selectedArgsResponse.data || [];
      // If no existing selections or old IDs don't match new format, use defaults
      if (existingArgs.length === 0 || !allArguments.some((a) => existingArgs.includes(a.id))) {
        // Default: select all include arguments
        selectedArguments = allArguments.map((a) => a.id);
      } else {
        selectedArguments = existingArgs;
      }
    }

    const selectedCTAsResponse = await browser.runtime.sendMessage({ type: 'getSelectedCTAs' });
    if (selectedCTAsResponse.success) {
      const existingCTAs = selectedCTAsResponse.data || [];
      // If no existing selections or old IDs don't match new format, use defaults
      if (existingCTAs.length === 0 || !allCTAs.some((c) => existingCTAs.includes(c.id))) {
        // Default: select CTAs with default: true (or all if no default field)
        selectedCTAs = allCTAs.filter((c) => c.default !== false).map((c) => c.id);
      } else {
        selectedCTAs = existingCTAs;
      }
    }

    renderArguments();
    renderCTAs();
  } catch (error) {
    console.error('Error loading arguments/CTAs:', error);
  }
}

/**
 * Save arguments
 */
async function saveArguments() {
  try {
    saveArgumentsBtn.disabled = true;
    saveArgumentsBtn.textContent = 'Saving...';

    await browser.runtime.sendMessage({
      type: 'saveSelectedArguments',
      argumentIds: selectedArguments,
    });

    saveArgumentsBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveArgumentsBtn.textContent = 'Save Arguments';
      saveArgumentsBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Error saving arguments:', error);
    saveArgumentsBtn.textContent = 'Error';
    setTimeout(() => {
      saveArgumentsBtn.textContent = 'Save Arguments';
      saveArgumentsBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Save CTAs
 */
async function saveCTAs() {
  try {
    saveCTAsBtn.disabled = true;
    saveCTAsBtn.textContent = 'Saving...';

    await browser.runtime.sendMessage({
      type: 'saveSelectedCTAs',
      ctaIds: selectedCTAs,
    });

    saveCTAsBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveCTAsBtn.textContent = 'Save CTAs';
      saveCTAsBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Error saving CTAs:', error);
    saveCTAsBtn.textContent = 'Error';
    setTimeout(() => {
      saveCTAsBtn.textContent = 'Save CTAs';
      saveCTAsBtn.disabled = false;
    }, 2000);
  }
}

// ============================================
// Settings Functions
// ============================================

/**
 * Load style prompt
 */
async function loadStylePrompt() {
  const result = await browser.storage.local.get(['customUserPrompt']);
  const defaultPrompt = getDefaultPrompt();
  customPromptTextarea.value = result.customUserPrompt || defaultPrompt;
}

/**
 * Save style prompt
 */
async function saveStylePrompt() {
  try {
    savePromptBtn.disabled = true;
    savePromptBtn.textContent = 'Saving...';

    const defaultPrompt = getDefaultPrompt();
    const prompt = customPromptTextarea.value.trim() || defaultPrompt;

    await browser.storage.local.set({ customUserPrompt: prompt });

    savePromptBtn.textContent = 'Saved!';
    setTimeout(() => {
      savePromptBtn.textContent = 'Save Prompt';
      savePromptBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Error saving prompt:', error);
    savePromptBtn.textContent = 'Error';
    setTimeout(() => {
      savePromptBtn.textContent = 'Save Prompt';
      savePromptBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Reset prompt to default
 */
function resetPrompt() {
  customPromptTextarea.value = getDefaultPrompt();
}

/**
 * Load config status
 */
async function loadConfigStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getConfigStatus' });
    if (response.success && response.data) {
      const { source, version, fetchedAt, useRemoteConfig } = response.data;

      useRemoteConfigCheckbox.checked = useRemoteConfig;

      let statusText = '';
      if (source === 'remote') {
        statusText = `Remote (v${version})`;
      } else if (source === 'cached') {
        statusText = `Cached (v${version})`;
      } else {
        statusText = 'Bundled (default)';
      }

      if (fetchedAt && source !== 'bundled') {
        const ago = getTimeAgo(fetchedAt);
        statusText += ` - ${ago}`;
      }

      configStatusValue.textContent = statusText;
      configStatusValue.className = `config-status-value ${source}`;
    }
  } catch (error) {
    console.error('Failed to load config status:', error);
    configStatusValue.textContent = 'Unknown';
  }
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours ago`;
  }
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Toggle remote config
 */
async function toggleRemoteConfig() {
  const enabled = useRemoteConfigCheckbox.checked;
  try {
    configStatusValue.textContent = 'Updating...';
    await browser.runtime.sendMessage({
      type: 'setRemoteConfigEnabled',
      enabled,
    });
    await loadConfigStatus();
  } catch (error) {
    console.error('Failed to toggle remote config:', error);
    useRemoteConfigCheckbox.checked = !enabled;
  }
}

/**
 * Refresh remote config
 */
async function refreshConfig() {
  try {
    refreshConfigBtn.disabled = true;
    refreshConfigBtn.textContent = 'Refreshing...';
    configStatusValue.textContent = 'Refreshing...';

    await browser.runtime.sendMessage({ type: 'loadRemoteConfig' });
    await loadConfigStatus();

    refreshConfigBtn.textContent = 'Refreshed!';
    setTimeout(() => {
      refreshConfigBtn.textContent = 'Refresh Config';
    }, 2000);
  } catch (error) {
    console.error('Failed to refresh config:', error);
    refreshConfigBtn.textContent = 'Failed';
    setTimeout(() => {
      refreshConfigBtn.textContent = 'Refresh Config';
    }, 2000);
  } finally {
    refreshConfigBtn.disabled = false;
  }
}

/**
 * Load community settings
 */
async function loadCommunitySettings() {
  const result = await browser.storage.local.get(['shareStats', 'contributeHotPosts']);
  shareStatsToggle.checked = result.shareStats || false;
  contributeHotPosts.checked = result.contributeHotPosts || false;
}

/**
 * Save community settings
 */
async function saveCommunitySettings() {
  await browser.storage.local.set({
    shareStats: shareStatsToggle.checked,
    contributeHotPosts: contributeHotPosts.checked,
  });
}

/**
 * Clear all data
 */
async function clearAllData() {
  if (
    confirm(
      'Are you sure you want to clear all extension data? This will remove your API key, settings, and activity history.'
    )
  ) {
    await browser.storage.local.clear();
    alert('All data cleared. The extension will now reload.');
    window.location.reload();
  }
}

/**
 * Share stats on X
 */
function shareStats() {
  const total = totalAmplifications.textContent;
  const streak = currentStreak.textContent;

  let shareText = `I've made ${total} amplification${total !== '1' ? 's' : ''} supporting Iranian civil society with Iran Amplifier!`;

  if (parseInt(streak) > 1) {
    shareText += ` Currently on a ${streak}-day streak.`;
  }

  shareText +=
    '\n\nJoin the movement: https://github.com/4iranorg/amplifier-ext\n\n#IranRevolution2026 #4Iran #IranAmplifier';

  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  window.open(shareUrl, '_blank');
}

// ============================================
// API Configuration Functions
// ============================================

/**
 * Populate model options for selected provider
 */
function populateModelOptions(provider, selectedModel = null) {
  clearElement(apiModelSelect);
  const availableModels = getAvailableModels();
  const models = availableModels[provider] || AVAILABLE_MODELS[provider] || [];
  for (const model of models) {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    if (selectedModel === model.id || (!selectedModel && model.default)) {
      option.selected = true;
    }
    apiModelSelect.appendChild(option);
  }
}

/**
 * Load API configuration
 */
async function loadApiConfig() {
  const result = await browser.storage.local.get(['provider', 'model', 'apiKey']);
  const provider = result.provider || 'openai';

  apiProviderSelect.value = provider;
  populateModelOptions(provider, result.model);

  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
}

/**
 * Save API configuration
 */
async function saveApiConfig() {
  try {
    saveApiConfigBtn.disabled = true;
    saveApiConfigBtn.textContent = 'Saving...';

    await browser.storage.local.set({
      provider: apiProviderSelect.value,
      model: apiModelSelect.value,
      apiKey: apiKeyInput.value,
    });

    saveApiConfigBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveApiConfigBtn.textContent = 'Save API Config';
      saveApiConfigBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Error saving API config:', error);
    saveApiConfigBtn.textContent = 'Error';
    setTimeout(() => {
      saveApiConfigBtn.textContent = 'Save API Config';
      saveApiConfigBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Test API connection
 */
async function testApiConnection() {
  if (!apiKeyInput.value) {
    apiConnectionStatus.textContent = 'Please enter an API key';
    apiConnectionStatus.className = 'error';
    return;
  }

  try {
    testApiConnectionBtn.disabled = true;
    apiConnectionStatus.textContent = 'Testing...';
    apiConnectionStatus.className = '';

    // Save current settings first
    await browser.storage.local.set({
      provider: apiProviderSelect.value,
      model: apiModelSelect.value,
      apiKey: apiKeyInput.value,
    });

    const response = await browser.runtime.sendMessage({ type: 'testConnection' });

    if (response.success) {
      apiConnectionStatus.textContent = '✓ Connected';
      apiConnectionStatus.className = 'success';
    } else {
      apiConnectionStatus.textContent = response.error || 'Connection failed';
      apiConnectionStatus.className = 'error';
    }
  } catch (error) {
    apiConnectionStatus.textContent = error.message || 'Connection failed';
    apiConnectionStatus.className = 'error';
  } finally {
    testApiConnectionBtn.disabled = false;
  }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
  } else {
    apiKeyInput.type = 'password';
  }
}

// ============================================
// Voice Preferences Functions
// ============================================

/**
 * Generate voice fingerprint from preferences
 */
function generateFingerprint(preferences) {
  const { voiceStyle, background, approach, length } = preferences;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  const str = `${voiceStyle}-${background}-${approach}-${length}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  let fingerprint = '';
  for (let i = 0; i < 6; i++) {
    fingerprint += chars[Math.abs(hash >> (i * 5)) % chars.length];
  }
  return fingerprint;
}

/**
 * Load voice preferences
 */
async function loadVoicePreferences() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getUserPreferences' });
    if (response.success && response.data) {
      const { preferences, seed } = response.data;

      if (preferences) {
        voiceStyleSelect.value = preferences.voiceStyle || 'personal';
        voiceBackgroundSelect.value = preferences.background || 'other';
        voiceApproachSelect.value = preferences.approach || 'mixed';
        voiceLengthSelect.value = preferences.length || 'medium';
      }

      // Generate and display fingerprint
      const fp = generateFingerprint({
        voiceStyle: voiceStyleSelect.value,
        background: voiceBackgroundSelect.value,
        approach: voiceApproachSelect.value,
        length: voiceLengthSelect.value,
      });
      voiceFingerprintValue.textContent =
        fp + (seed ? `-${seed.toString(16).slice(0, 4).toUpperCase()}` : '');
    }
  } catch (error) {
    console.error('Failed to load voice preferences:', error);
  }
}

/**
 * Save voice preferences
 */
async function saveVoicePreferences() {
  try {
    saveVoiceBtn.disabled = true;
    saveVoiceBtn.textContent = 'Saving...';

    const preferences = {
      voiceStyle: voiceStyleSelect.value,
      background: voiceBackgroundSelect.value,
      approach: voiceApproachSelect.value,
      length: voiceLengthSelect.value,
    };

    await browser.runtime.sendMessage({ type: 'saveUserPreferences', preferences });

    // Update fingerprint display
    const fp = generateFingerprint(preferences);
    voiceFingerprintValue.textContent = fp;

    saveVoiceBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveVoiceBtn.textContent = 'Save Preferences';
      saveVoiceBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Error saving voice preferences:', error);
    saveVoiceBtn.textContent = 'Error';
    setTimeout(() => {
      saveVoiceBtn.textContent = 'Save Preferences';
      saveVoiceBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Reset voice preferences to defaults
 */
function resetVoicePreferences() {
  voiceStyleSelect.value = 'personal';
  voiceBackgroundSelect.value = 'other';
  voiceApproachSelect.value = 'mixed';
  voiceLengthSelect.value = 'medium';

  const fp = generateFingerprint({
    voiceStyle: 'personal',
    background: 'other',
    approach: 'mixed',
    length: 'medium',
  });
  voiceFingerprintValue.textContent = fp;
}

// ============================================
// Event Listeners
// ============================================

// API Configuration
apiProviderSelect.addEventListener('change', () => {
  populateModelOptions(apiProviderSelect.value);
});
toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
testApiConnectionBtn.addEventListener('click', testApiConnection);
saveApiConfigBtn.addEventListener('click', saveApiConfig);

// Voice Preferences
resetVoiceBtn.addEventListener('click', resetVoicePreferences);
saveVoiceBtn.addEventListener('click', saveVoicePreferences);

// Activity
shareBtn.addEventListener('click', shareStats);

// Arguments
selectAllArgs.addEventListener('click', () => {
  selectedArguments = allArguments.map((a) => a.id);
  renderArguments();
});
deselectAllArgs.addEventListener('click', () => {
  selectedArguments = [];
  renderArguments();
});
saveArgumentsBtn.addEventListener('click', saveArguments);

// CTAs
selectAllCTAs.addEventListener('click', () => {
  selectedCTAs = allCTAs.map((c) => c.id);
  renderCTAs();
});
deselectAllCTAs.addEventListener('click', () => {
  selectedCTAs = [];
  renderCTAs();
});
saveCTAsBtn.addEventListener('click', saveCTAs);

// Style prompt
resetPromptBtn.addEventListener('click', resetPrompt);
savePromptBtn.addEventListener('click', saveStylePrompt);

// Config
useRemoteConfigCheckbox.addEventListener('change', toggleRemoteConfig);
refreshConfigBtn.addEventListener('click', refreshConfig);

// Community
shareStatsToggle.addEventListener('change', saveCommunitySettings);
contributeHotPosts.addEventListener('change', saveCommunitySettings);

// Danger zone
clearDataBtn.addEventListener('click', clearAllData);

// Spread the word
copyLinkBtn.addEventListener('click', async () => {
  const url = 'https://github.com/4iranorg/amplifier-ext';
  try {
    await navigator.clipboard.writeText(url);
    const textNode = copyLinkBtn.lastChild;
    const originalText = textNode.textContent;
    textNode.textContent = ' Copied!';
    setTimeout(() => {
      textNode.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
});

// ============================================
// Initialize
// ============================================

loadActivity();
loadUsage();
loadApiConfig();
loadVoicePreferences();
loadArgumentsAndCTAs();
loadStylePrompt();
loadConfigStatus();
loadCommunitySettings();
