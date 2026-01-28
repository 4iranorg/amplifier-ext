/**
 * Cost tracking module for Iran Amplifier extension.
 * Tracks API usage (tokens, cost) and activity (amplifications per day).
 */

import { getModelPricing, getAllPricing, CONFIG_DEFAULTS } from './config-loader.js';

/**
 * Default model pricing per 1M tokens (bundled fallback)
 * Prices in USD
 * @deprecated Use getModelPricing() from config-loader instead
 */
export const DEFAULT_MODEL_PRICING = CONFIG_DEFAULTS.pricing;

/**
 * Get current model pricing (from config or defaults)
 * @returns {Object} Pricing object keyed by model ID
 */
export function getModelPricingData() {
  return getAllPricing();
}

/**
 * Calculate cost for a request
 * @param {string} model - Model ID
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Cost in USD
 */
export function calculateCost(model, inputTokens, outputTokens) {
  const pricing = getModelPricing(model);
  if (!pricing) {
    // Default to gpt-5-mini pricing if unknown (avoid recursion)
    const fallbackPricing = { input: 0.25, output: 2.0 };
    const inputCost = (inputTokens / 1000000) * fallbackPricing.input;
    const outputCost = (outputTokens / 1000000) * fallbackPricing.output;
    return inputCost + outputCost;
  }

  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Get date key in YYYY-MM-DD format using LOCAL timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Date string
 */
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string (local timezone)
 * @returns {string} Date string
 */
export function getTodayKey() {
  return getLocalDateKey(new Date());
}

/**
 * Get current month as YYYY-MM string (local timezone)
 * @returns {string} Month string
 */
export function getMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Record usage for a request
 * @param {Object} usageData - Usage data from API
 * @param {number} usageData.inputTokens - Input tokens
 * @param {number} usageData.outputTokens - Output tokens
 * @param {string} usageData.model - Model used
 * @param {string} usageData.provider - Provider (openai/anthropic)
 */
export async function recordUsage(usageData) {
  const { inputTokens, outputTokens, model, provider: _provider } = usageData;
  const cost = calculateCost(model, inputTokens, outputTokens);
  const todayKey = getTodayKey();
  const monthKey = getMonthKey();

  // Get current stats
  const result = await browser.storage.local.get(['usageStats']);
  const stats = result.usageStats || {
    daily: {},
    monthly: {},
    allTime: { tokens: 0, cost: 0, requests: 0 },
  };

  // Update daily stats
  if (!stats.daily[todayKey]) {
    stats.daily[todayKey] = { tokens: 0, cost: 0, requests: 0 };
  }
  stats.daily[todayKey].tokens += inputTokens + outputTokens;
  stats.daily[todayKey].cost += cost;
  stats.daily[todayKey].requests += 1;

  // Update monthly stats
  if (!stats.monthly[monthKey]) {
    stats.monthly[monthKey] = { tokens: 0, cost: 0, requests: 0 };
  }
  stats.monthly[monthKey].tokens += inputTokens + outputTokens;
  stats.monthly[monthKey].cost += cost;
  stats.monthly[monthKey].requests += 1;

  // Update all-time stats
  stats.allTime.tokens += inputTokens + outputTokens;
  stats.allTime.cost += cost;
  stats.allTime.requests += 1;

  // Clean up old daily stats (keep last 90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoffKey = getLocalDateKey(cutoffDate);
  for (const key of Object.keys(stats.daily)) {
    if (key < cutoffKey) {
      delete stats.daily[key];
    }
  }

  // Clean up old monthly stats (keep last 24 months)
  const monthCutoff = new Date();
  monthCutoff.setMonth(monthCutoff.getMonth() - 24);
  const year = monthCutoff.getFullYear();
  const month = String(monthCutoff.getMonth() + 1).padStart(2, '0');
  const monthCutoffKey = `${year}-${month}`;
  for (const key of Object.keys(stats.monthly)) {
    if (key < monthCutoffKey) {
      delete stats.monthly[key];
    }
  }

  // Save updated stats
  await browser.storage.local.set({ usageStats: stats });

  return { cost, tokens: inputTokens + outputTokens };
}

/**
 * Record an actual amplification (when user uses a response via Copy, Reply, or Quote)
 * @param {string} action - The action taken: 'copy', 'reply', or 'quote'
 */
export async function recordAmplification(_action = 'copy') {
  const todayKey = getTodayKey();

  // Get current activity log
  const result = await browser.storage.local.get(['activityLog']);
  const activityLog = result.activityLog || {};

  // Increment today's count
  if (!activityLog[todayKey]) {
    activityLog[todayKey] = 0;
  }
  activityLog[todayKey] += 1;

  // Clean up old entries (keep last 365 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);
  const cutoffKey = getLocalDateKey(cutoffDate);
  for (const key of Object.keys(activityLog)) {
    if (key < cutoffKey) {
      delete activityLog[key];
    }
  }

  // Save updated activity log
  await browser.storage.local.set({ activityLog });
}

/**
 * Get usage statistics
 * @returns {Promise<Object>} Usage stats
 */
export async function getUsageStats() {
  const result = await browser.storage.local.get(['usageStats']);
  const stats = result.usageStats || {
    daily: {},
    monthly: {},
    allTime: { tokens: 0, cost: 0, requests: 0 },
  };

  const todayKey = getTodayKey();
  const monthKey = getMonthKey();

  return {
    today: stats.daily[todayKey] || { tokens: 0, cost: 0, requests: 0 },
    thisMonth: stats.monthly[monthKey] || { tokens: 0, cost: 0, requests: 0 },
    allTime: stats.allTime,
  };
}

/**
 * Get activity log for contribution graph
 * @param {number} days - Number of days to retrieve (default 84 = 12 weeks)
 * @returns {Promise<Object>} Activity log
 */
export async function getActivityLog(days = 84) {
  const result = await browser.storage.local.get(['activityLog']);
  const activityLog = result.activityLog || {};

  // Generate array of last N days using local timezone
  const activity = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = getLocalDateKey(date);
    activity[key] = activityLog[key] || 0;
  }

  return activity;
}

/**
 * Format cost for display
 * @param {number} cost - Cost in USD
 * @returns {string} Formatted cost string
 */
export function formatCost(cost) {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Format token count for display
 * @param {number} tokens - Token count
 * @returns {string} Formatted token string
 */
export function formatTokens(tokens) {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
