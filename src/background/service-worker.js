/**
 * Background service worker for Iran Amplifier extension.
 * Handles API calls, storage, and conversation context.
 */

import { callOpenAI, callAnthropic, testConnection, validatePrompt } from '../lib/api.js';
import {
  buildDeveloperContext,
  buildDeveloperContextForRefine,
  buildUserStylePrompt,
  sanitizeUserInput,
  getFixedPrompt,
} from '../lib/prompts.js';
import {
  recordUsage,
  recordAmplification,
  getUsageStats,
  getActivityLog,
} from '../lib/cost-tracker.js';
import {
  getCachedProfile,
  cacheProfile,
  detectCategory,
  cleanupExpiredProfiles,
} from '../lib/profile-cache.js';
import { checkForUpdate, getCachedUpdateInfo, dismissUpdate } from '../lib/updater.js';
import {
  initConfig,
  loadConfig,
  getConfigStatus,
  setRemoteConfigEnabled,
  getArguments,
  getCallToActions,
  getIncludeArguments,
  getSelectedArguments,
  getSelectedCTAs,
  saveSelectedArguments,
  saveSelectedCTAs,
  getExclusions,
  getRefusalMessages,
} from '../lib/config-loader.js';
import {
  initializeUserSeed,
  getUserPreferences,
  saveUserPreferences,
  isOnboardingComplete,
  completeOnboarding,
} from '../lib/personalization.js';

// In-memory conversation contexts (cleared on extension restart)
const tweetContexts = new Map();

// Maximum retries for auto-regeneration
const MAX_VALIDATION_RETRIES = 2;

// Required hashtag
const REQUIRED_HASHTAG = '#IranRevolution2026';

// Excluded source patterns (from exclusions)
const EXCLUDED_PATTERNS = [/\bNIAC\b/i, /\bNegar\s*Mortazavi\b/i, /\bTrita\s*Parsi\b/i];

// Threat/incitement keywords to reject (specific patterns to avoid false positives)
// Note: Patterns like "violence against" are too broad - they match "regime's violence against protesters"
const THREAT_PATTERNS = [
  /\bkill\s+(them|him|her|all|everyone)\b/i,
  /\bdeath\s+to\b/i,
  /\b(use|commit|advocate|promote)\s+violence\b/i,
  /\battack\s+(them|civilians|innocents)\b/i,
  /\blet'?s\s+bomb\b/i,
  /\bassassinate\b/i,
  /\bexterminate\b/i,
];

/**
 * Validate a single response text
 * @param {string} text - Response text to validate
 * @returns {Object} { valid: boolean, issues: string[] }
 */
function validateResponseText(text) {
  const issues = [];

  // Check length (max 280 characters)
  if (text.length > 280) {
    issues.push('too_long');
  }

  // Check required hashtag
  if (!text.includes(REQUIRED_HASHTAG)) {
    issues.push('missing_hashtag');
  }

  // Count hashtags (max 2: 1 required + 1 optional per X best practices)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount > 2) {
    issues.push('too_many_hashtags');
  }

  // Check for excluded sources
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(text)) {
      issues.push('excluded_source');
      break;
    }
  }

  // Check for threats/incitement
  for (const pattern of THREAT_PATTERNS) {
    if (pattern.test(text)) {
      issues.push('threat_detected');
      break;
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check if responses are too similar (basic similarity check)
 * @param {Array} responses - Array of response objects
 * @returns {boolean} True if responses are too similar
 */
function areResponsesTooSimilar(responses) {
  if (responses.length < 2) {
    return false;
  }

  // Simple check: compare first 50 characters of each response
  const starts = responses.map((r) => r.text.substring(0, 50).toLowerCase());
  const uniqueStarts = new Set(starts);

  // If more than half share the same start, they're too similar
  return uniqueStarts.size < Math.ceil(responses.length / 2);
}

/**
 * Validate a response array (replies or quotes)
 * @param {Array} responses - Array of response objects
 * @param {string} type - 'replies' or 'quotes' for error messages
 * @returns {Object} { issues: string[], hasTooLong, hasMissingHashtag, hasRefusal }
 */
function validateResponseArray(responses, type) {
  const issues = [];
  let hasTooLong = false;
  let hasMissingHashtag = false;
  let hasRefusal = false;

  if (!responses || !Array.isArray(responses)) {
    issues.push(`no_${type}`);
    return { issues, hasTooLong, hasMissingHashtag, hasRefusal };
  }

  if (responses.length === 0 || responses.length > 3) {
    issues.push(`wrong_${type}_count`);
  }

  for (const response of responses) {
    if (!response.text) {
      issues.push('empty_response');
      continue;
    }

    const validation = validateResponseText(response.text);
    if (!validation.valid) {
      issues.push(...validation.issues);

      if (validation.issues.includes('too_long')) {
        hasTooLong = true;
      }
      if (validation.issues.includes('missing_hashtag')) {
        hasMissingHashtag = true;
      }
      if (validation.issues.includes('threat_detected')) {
        hasRefusal = true;
      }
    }
  }

  return { issues, hasTooLong, hasMissingHashtag, hasRefusal };
}

/**
 * Validate the complete API result (batch format with replies + quotes)
 * @param {Object} result - API result with analysis, replies, and quotes
 * @param {boolean} isRefine - Whether this is a refinement (single type)
 * @param {string} refineType - If refinement, which type ('reply' or 'quote')
 * @returns {Object} { valid: boolean, issues: string[], fixHints: string[] }
 */
function validateResult(result, isRefine = false, refineType = null) {
  const issues = [];
  const fixHints = [];

  // Check JSON structure
  if (!result || typeof result !== 'object') {
    return { valid: false, issues: ['invalid_json'], fixHints: [] };
  }

  let hasTooLong = false;
  let hasMissingHashtag = false;

  if (isRefine && refineType) {
    // For single-type generation, check the 'responses' format or the type-specific array
    const responses = result.responses || (refineType === 'reply' ? result.replies : result.quotes);
    const typeValidation = validateResponseArray(
      responses,
      refineType === 'reply' ? 'replies' : 'quotes'
    );
    issues.push(...typeValidation.issues);
    hasTooLong = typeValidation.hasTooLong;
    hasMissingHashtag = typeValidation.hasMissingHashtag;
    if (typeValidation.hasRefusal) {
      return {
        valid: false,
        issues: ['threat_detected'],
        fixHints: [],
        refusal: true,
      };
    }
    // Check similarity for single-type responses
    if (responses && responses.length > 1 && areResponsesTooSimilar(responses)) {
      issues.push(`${refineType}s_too_similar`);
      fixHints.push(`Make each ${refineType} structurally different.`);
    }
  } else {
    // For batch generation, check both replies and quotes
    const repliesValidation = validateResponseArray(result.replies, 'replies');
    const quotesValidation = validateResponseArray(result.quotes, 'quotes');

    issues.push(...repliesValidation.issues, ...quotesValidation.issues);
    hasTooLong = repliesValidation.hasTooLong || quotesValidation.hasTooLong;
    hasMissingHashtag = repliesValidation.hasMissingHashtag || quotesValidation.hasMissingHashtag;

    if (repliesValidation.hasRefusal || quotesValidation.hasRefusal) {
      return {
        valid: false,
        issues: ['threat_detected'],
        fixHints: [],
        refusal: true,
      };
    }

    // Check similarity within each type
    if (result.replies && result.replies.length > 1 && areResponsesTooSimilar(result.replies)) {
      issues.push('replies_too_similar');
      fixHints.push('Make each reply structurally different.');
    }
    if (result.quotes && result.quotes.length > 1 && areResponsesTooSimilar(result.quotes)) {
      issues.push('quotes_too_similar');
      fixHints.push('Make each quote structurally different.');
    }
  }

  // Build fix hints
  if (hasTooLong) {
    fixHints.push('Make responses shorter (max 280 characters).');
  }
  if (hasMissingHashtag) {
    fixHints.push(`Include the required hashtag ${REQUIRED_HASHTAG} in each response.`);
  }

  return {
    valid: issues.length === 0,
    issues: [...new Set(issues)], // Deduplicate
    fixHints,
  };
}

/**
 * Get stored settings
 * @returns {Promise<Object>} Settings object
 */
async function getSettings() {
  const result = await browser.storage.local.get([
    'apiKey',
    'provider',
    'model',
    'customUserPrompt',
  ]);
  return {
    apiKey: result.apiKey || '',
    provider: result.provider || 'openai',
    model: result.model || 'gpt-4o-mini',
    customUserPrompt: result.customUserPrompt || null, // null means use default
  };
}

/**
 * Get user personalization data (preferences + seed)
 * @returns {Promise<Object>} Personalization data
 */
async function getPersonalization() {
  return await getUserPreferences();
}

/**
 * Get or create conversation context for a tweet
 * New architecture: separate contexts per tab (reply/quote) with independent histories
 * @param {string} tweetId - Unique tweet identifier
 * @param {Object} tweetData - Initial tweet data
 * @returns {Object} Conversation context
 */
function getContext(tweetId, tweetData = null) {
  if (!tweetContexts.has(tweetId)) {
    tweetContexts.set(tweetId, {
      tweet: tweetData,
      // Separate contexts per tab type
      reply: {
        history: [],
        responses: [],
        lastGeneratedAt: null,
      },
      quote: {
        history: [],
        responses: [],
        lastGeneratedAt: null,
      },
      analysis: null, // Shared analysis (set on first generation)
    });
  }
  return tweetContexts.get(tweetId);
}

/**
 * Build messages for API call using 4-layer architecture
 * @param {string} provider - 'openai' or 'anthropic'
 * @param {string} fixedPrompt - Layer 1: Fixed system prompt
 * @param {string} developerContext - Layer 2: Developer context (tweet, args, CTAs)
 * @param {string} userStylePrompt - Layer 3: User style preferences
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} userInput - Layer 4: Current user input (sanitized)
 * @returns {Object} { systemPrompt, messages } for API call
 */
function buildApiMessages(
  provider,
  fixedPrompt,
  developerContext,
  userStylePrompt,
  conversationHistory,
  userInput
) {
  if (provider === 'openai') {
    // OpenAI: system message + developer context as first user message
    const systemPrompt = `${fixedPrompt}\n\n${userStylePrompt}`;
    const messages = [];

    // Developer context as first user message (before conversation history)
    if (conversationHistory.length === 0) {
      // Initial request: combine developer context with user input
      messages.push({
        role: 'user',
        content: `${developerContext}\n\n${userInput}`,
      });
    } else {
      // Follow-up: add history and new user input
      messages.push(...conversationHistory);
      messages.push({
        role: 'user',
        content: userInput,
      });
    }

    return { systemPrompt, messages };
  } else if (provider === 'anthropic') {
    // Anthropic: same pattern as OpenAI - developer context in first user message
    // This avoids resending the full developer context on every refinement
    const systemPrompt = `${fixedPrompt}\n\n${userStylePrompt}`;
    const messages = [];

    if (conversationHistory.length === 0) {
      // Initial request: combine developer context with user input
      messages.push({
        role: 'user',
        content: `${developerContext}\n\n${userInput}`,
      });
    } else {
      // Follow-up: add history and new user input (developer context already in history)
      messages.push(...conversationHistory);
      messages.push({
        role: 'user',
        content: userInput,
      });
    }

    return { systemPrompt, messages };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Generate responses for a tweet with 4-layer prompt architecture
 * Uses on-demand generation: 3 responses of a single type (reply or quote)
 * Each tab has its own conversation history for independent refinements
 * @param {Object} tweetData - Tweet information
 * @param {string} responseType - 'reply' or 'quote'
 * @param {string|null} feedback - User feedback for iteration
 * @param {boolean} forceRegenerate - Skip cache and generate new responses
 * @returns {Promise<Object>} Generation result with analysis and responses for the requested type
 */
async function generateResponses(
  tweetData,
  responseType,
  feedback = null,
  forceRegenerate = false
) {
  const settings = await getSettings();

  if (!settings.apiKey) {
    throw new Error('API key not configured. Please add your API key in the extension settings.');
  }

  const tweetId = tweetData.tweetId || tweetData.url;
  const context = getContext(tweetId, tweetData);
  const tabContext = context[responseType]; // Get tab-specific context

  // Return cached result if available (no feedback, not forcing regeneration)
  if (!feedback && !forceRegenerate && tabContext.responses?.length > 0) {
    return {
      analysis: context.analysis,
      responses: tabContext.responses.map((r) => ({ ...r, type: responseType })),
    };
  }

  // Get or cache profile for the tweet author
  let profileContext = null;
  const authorHandle = tweetData.author?.handle || tweetData.authorHandle;
  const authorDisplayName = tweetData.author?.displayName || tweetData.author || '';
  const authorIsVerified = tweetData.author?.isVerified || tweetData.isVerified || false;
  const authorBio = tweetData.author?.bio || '';

  if (authorHandle) {
    profileContext = await getCachedProfile(authorHandle);

    // Update cache if we have new bio data or no cached profile
    if (!profileContext || (authorBio && !profileContext.bio)) {
      // Cache the profile with what we know (including bio if available)
      const category = detectCategory(authorBio, authorDisplayName);
      const newProfile = {
        handle: authorHandle,
        displayName: authorDisplayName,
        bio: authorBio,
        followerCount: profileContext?.followerCount || 0,
        category: category,
        isVerified: authorIsVerified,
      };
      await cacheProfile(newProfile);
      profileContext = await getCachedProfile(authorHandle);

      // Log bio for verification
      if (authorBio) {
        console.log(`[Amplifier] Cached bio for @${authorHandle}:`, authorBio);
      }
    }
  }

  // Get user personalization data
  const personalization = await getPersonalization();

  // Get selected arguments and CTAs
  const selectedArgumentIds = await getSelectedArguments();
  const selectedCTAIds = await getSelectedCTAs();

  // Layer 1: Fixed system prompt (guardrails)
  const fixedPrompt = getFixedPrompt();

  // Determine if this is a refinement (feedback provided)
  const isRefine = !!feedback;

  // Layer 2: Developer context (tweet, arguments, CTAs, exclusions)
  // Both initial and refinement now use the same context builder with responseType
  const developerContext = isRefine
    ? buildDeveloperContextForRefine(
        tweetData,
        selectedArgumentIds,
        selectedCTAIds,
        profileContext,
        responseType
      )
    : buildDeveloperContext(
        tweetData,
        selectedArgumentIds,
        selectedCTAIds,
        profileContext,
        responseType
      );

  // Layer 3: User style prompt (with personalization)
  const userStylePrompt = buildUserStylePrompt(settings.customUserPrompt, personalization);

  // Layer 4: User input (sanitized)
  let userInput;
  if (feedback) {
    // Sanitize user feedback to prevent guardrail bypass
    const sanitizedFeedback = sanitizeUserInput(feedback);
    userInput = sanitizedFeedback
      ? `User feedback: ${sanitizedFeedback}`
      : `Generate 3 new ${responseType} variations.`;
  } else {
    // Initial generation request for this tab type
    userInput = `Generate the 3 ${responseType} response variations for the original post above.`;
  }

  // Build API-specific message structure using tab-specific history
  const { systemPrompt, messages } = buildApiMessages(
    settings.provider,
    fixedPrompt,
    developerContext,
    userStylePrompt,
    tabContext.history,
    userInput
  );

  // Call API with validation and auto-regeneration loop
  let result = null;
  let totalUsage = { inputTokens: 0, outputTokens: 0 };
  let retryCount = 0;
  let lastValidation = null;

  while (retryCount <= MAX_VALIDATION_RETRIES) {
    // Append fix hints to user input if this is a retry
    let currentMessages = [...messages];
    if (retryCount > 0 && lastValidation && lastValidation.fixHints.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      currentMessages[currentMessages.length - 1] = {
        ...lastMessage,
        content: `${lastMessage.content}\n\nIMPORTANT: ${lastValidation.fixHints.join(' ')}`,
      };
    }

    // Call appropriate API
    let apiResponse;
    if (settings.provider === 'openai') {
      const fullMessages = [{ role: 'system', content: systemPrompt }, ...currentMessages];
      apiResponse = await callOpenAI(settings.apiKey, settings.model, fullMessages);
    } else if (settings.provider === 'anthropic') {
      apiResponse = await callAnthropic(
        settings.apiKey,
        settings.model,
        systemPrompt,
        currentMessages
      );
    } else {
      throw new Error(`Unknown provider: ${settings.provider}`);
    }

    result = apiResponse.result;
    totalUsage.inputTokens += apiResponse.usage?.inputTokens || 0;
    totalUsage.outputTokens += apiResponse.usage?.outputTokens || 0;

    // Validate result - always single-type now
    lastValidation = validateResult(result, true, responseType);

    if (lastValidation.valid) {
      break; // Success!
    }

    // Check for refusal (threat detected)
    if (lastValidation.refusal) {
      const refusalMessages = getRefusalMessages();
      const refusalResponse = {
        text: refusalMessages.violence,
        tone: 'refusal',
      };
      result = {
        analysis: {
          post_sentiment: 'unknown',
          key_topics: [],
          recommended_approach: 'Request refused due to policy violation.',
        },
        replies: [refusalResponse],
        quotes: [refusalResponse],
      };
      break;
    }

    console.warn(`Validation failed (attempt ${retryCount + 1}):`, lastValidation.issues);
    retryCount++;
  }

  // Track usage for cost monitoring
  try {
    await recordUsage(totalUsage);
  } catch (e) {
    console.warn('Failed to record usage:', e);
  }

  // Add warning if validation still failed after retries
  if (lastValidation && !lastValidation.valid && !lastValidation.refusal) {
    result._validationWarning = `Some responses may not meet all requirements: ${lastValidation.issues.join(', ')}`;
    console.warn('Returning result with validation warning:', result._validationWarning);
  }

  // Update tab-specific conversation history
  // On first generation, include developer context so refinements have full tweet data
  const historyUserContent =
    tabContext.history.length === 0 ? `${developerContext}\n\n${userInput}` : userInput;
  tabContext.history.push({ role: 'user', content: historyUserContent });

  // Get responses from result (may be in 'responses', 'replies', or 'quotes' depending on model)
  const responses =
    result.responses || (responseType === 'reply' ? result.replies : result.quotes) || [];

  // Format assistant response with explicit numbering
  let formattedResponse = `Generated ${responseType} responses:\n`;
  responses.forEach((response, index) => {
    formattedResponse += `#${index + 1} (${response.tone || 'standard'}):\n"${response.text}"\n`;
  });
  tabContext.history.push({
    role: 'assistant',
    content: formattedResponse,
  });

  // Limit tab-specific history to prevent token overflow
  if (tabContext.history.length > 10) {
    tabContext.history = tabContext.history.slice(-10);
  }

  // Update tab-specific cache
  tabContext.responses = responses;
  tabContext.lastGeneratedAt = Date.now();

  // Update shared analysis if provided (only on first generation)
  if (result.analysis && !context.analysis) {
    context.analysis = result.analysis;
  }

  // Return responses for this tab type only
  return {
    analysis: context.analysis,
    responses: responses.map((r) => ({ ...r, type: responseType })),
    _validationWarning: result._validationWarning,
  };
}

/**
 * Clear conversation context for a tweet
 * @param {string} tweetId - Tweet identifier
 */
function clearContext(tweetId) {
  tweetContexts.delete(tweetId);
}

// Message handler for communication with content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'generate': {
          const result = await generateResponses(
            message.tweetData,
            message.responseType,
            message.feedback,
            message.forceRegenerate
          );
          sendResponse({ success: true, data: result });
          break;
        }

        case 'clearContext': {
          clearContext(message.tweetId);
          sendResponse({ success: true });
          break;
        }

        case 'getSettings': {
          const settings = await getSettings();
          // Don't send the full API key to content script
          sendResponse({
            success: true,
            data: {
              hasApiKey: !!settings.apiKey,
              provider: settings.provider,
              model: settings.model,
            },
          });
          break;
        }

        case 'testConnection': {
          const settings = await getSettings();
          if (!settings.apiKey) {
            sendResponse({ success: false, error: 'No API key configured' });
            break;
          }
          // Test connection using the API's models/validation endpoint
          try {
            const isConnected = await testConnection(settings.provider, settings.apiKey);
            if (isConnected) {
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'Connection failed. Check your API key.' });
            }
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getUsageStats': {
          try {
            const stats = await getUsageStats();
            sendResponse({ success: true, data: stats });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getActivityLog': {
          try {
            const days = message.days || 84;
            const activity = await getActivityLog(days);
            sendResponse({ success: true, data: activity });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'recordAmplification': {
          try {
            await recordAmplification(message.action || 'copy');
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'validatePrompt': {
          const settings = await getSettings();
          if (!settings.apiKey) {
            // Skip validation if no API key configured
            sendResponse({
              success: true,
              data: { valid: true, reason: 'No API key - validation skipped' },
            });
            break;
          }
          try {
            const result = await validatePrompt(settings.provider, settings.apiKey, message.prompt);
            sendResponse({ success: true, data: result });
          } catch (_error) {
            // On error, allow the prompt but flag it
            sendResponse({
              success: true,
              data: { valid: true, reason: 'Validation error', error: true },
            });
          }
          break;
        }

        case 'checkForUpdate': {
          try {
            const updateInfo = await checkForUpdate();
            sendResponse({ success: true, data: updateInfo });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getCachedUpdateInfo': {
          try {
            const updateInfo = await getCachedUpdateInfo();
            sendResponse({ success: true, data: updateInfo });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'dismissUpdate': {
          try {
            await dismissUpdate(message.version);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getConfigStatus': {
          try {
            const status = await getConfigStatus();
            sendResponse({ success: true, data: status });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'loadRemoteConfig': {
          try {
            await loadConfig(true); // Force refresh
            const status = await getConfigStatus();
            sendResponse({ success: true, data: status });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'setRemoteConfigEnabled': {
          try {
            await setRemoteConfigEnabled(message.enabled);
            const status = await getConfigStatus();
            sendResponse({ success: true, data: status });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getUserPreferences': {
          try {
            const data = await getUserPreferences();
            sendResponse({ success: true, data });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'saveUserPreferences': {
          try {
            await saveUserPreferences(message.preferences);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'isOnboardingComplete': {
          try {
            const complete = await isOnboardingComplete();
            sendResponse({ success: true, data: complete });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'completeOnboarding': {
          try {
            await completeOnboarding();
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getArguments': {
          try {
            // Return only include arguments (exclude arguments are always-on)
            const args = getIncludeArguments();
            sendResponse({ success: true, data: args });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getAllArguments': {
          try {
            // Return all arguments including exclusions (for internal use)
            const args = getArguments();
            sendResponse({ success: true, data: args });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getExclusions': {
          try {
            const exclusions = getExclusions();
            sendResponse({ success: true, data: exclusions });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getCallToActions': {
          try {
            const ctas = getCallToActions();
            sendResponse({ success: true, data: ctas });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getSelectedArguments': {
          try {
            const selected = await getSelectedArguments();
            sendResponse({ success: true, data: selected });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'getSelectedCTAs': {
          try {
            const selected = await getSelectedCTAs();
            sendResponse({ success: true, data: selected });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'saveSelectedArguments': {
          try {
            await saveSelectedArguments(message.argumentIds);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'saveSelectedCTAs': {
          try {
            await saveSelectedCTAs(message.ctaIds);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        case 'saveSelections': {
          try {
            if (message.argumentIds !== undefined) {
              await saveSelectedArguments(message.argumentIds);
            }
            if (message.ctaIds !== undefined) {
              await saveSelectedCTAs(message.ctaIds);
            }
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

// Clean up old contexts periodically (every 30 minutes)
setInterval(
  () => {
    tweetContexts.clear();
  },
  30 * 60 * 1000
);

// Handle extension installation/update
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Check if onboarding is already complete (shouldn't be on fresh install)
    const complete = await isOnboardingComplete();
    if (!complete) {
      // Open onboarding page in new tab
      browser.tabs.create({
        url: browser.runtime.getURL('src/onboarding/onboarding.html'),
      });
    }
  }
});

// Initialize config, user seed, and check for updates on startup
initConfig()
  .then(() => {
    console.log('Config initialized');
    // Clean up expired profile cache entries
    return cleanupExpiredProfiles();
  })
  .then(() => {
    // Initialize user seed for personalization
    return initializeUserSeed();
  })
  .then((seed) => {
    console.log('User seed initialized:', seed.slice(0, 3) + '****');
    // Check for updates after config is loaded
    return checkForUpdate();
  })
  .then(() => {
    // Refresh config alongside update check
    return loadConfig(true);
  })
  .catch((e) => console.warn('Startup tasks failed:', e));

console.log('Iran Amplifier background service worker loaded');
