/**
 * Prompt management for Iran Amplifier content generation.
 * Implements a 4-layer prompt architecture:
 * - Layer 1 (SYSTEM): Fixed guardrails and output format (not user-editable)
 * - Layer 2 (DEVELOPER): Tweet context, arguments, CTAs, exclusions (built per-request)
 * - Layer 3 (USER): Style preferences (user-editable default prompt)
 * - Layer 4 (USER INPUT): Runtime refinement instructions (sanitized)
 */

import {
  getFixedSystemPrompt as getConfigFixedPrompt,
  getDefaultUserPrompt as getConfigDefaultPrompt,
  getArguments,
  getCallToActions,
  getExclusions,
  CONFIG_DEFAULTS,
} from './config-loader.js';
import { buildPersonalizationPrompt } from './personalization.js';

/**
 * Fixed system prompt - defines core behavior and guardrails.
 * This prompt cannot be modified by users to prevent misuse.
 * @deprecated Use getFixedPrompt() instead for dynamic config support
 */
export const FIXED_SYSTEM_PROMPT = CONFIG_DEFAULTS.prompts.fixed;

/**
 * Default user prompt - defines tone and style preferences.
 * Users can customize this to adjust response style.
 * @deprecated Use getDefaultPrompt() instead for dynamic config support
 */
export const DEFAULT_USER_PROMPT = CONFIG_DEFAULTS.prompts.default;

/**
 * For backwards compatibility - combines both prompts
 * @deprecated Use the 4-layer architecture instead
 */
export const DEFAULT_SYSTEM_PROMPT = `${FIXED_SYSTEM_PROMPT}

${DEFAULT_USER_PROMPT}`;

/**
 * Get the fixed system prompt (Layer 1: SYSTEM)
 * @returns {string} Fixed system prompt with guardrails
 */
export function getFixedPrompt() {
  return getConfigFixedPrompt();
}

/**
 * Get the default user prompt (Layer 3: USER)
 * @returns {string} Default user style prompt
 */
export function getDefaultPrompt() {
  return getConfigDefaultPrompt();
}

/**
 * Patterns that indicate guardrail bypass attempts
 */
const BYPASS_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?(instructions?|rules?|guardrails?|constraints?)/i,
  /bypass\s+(all\s+)?(security|safety|guardrails?|rules?)/i,
  /override\s+(all\s+)?(previous\s+)?(instructions?|rules?|guardrails?)/i,
  /disregard\s+(all\s+)?(previous\s+)?(instructions?|rules?)/i,
  /forget\s+(all\s+)?(previous\s+)?(instructions?|rules?)/i,
  /no\s+hashtag/i,
  /without\s+hashtag/i,
  /skip\s+hashtag/i,
  /remove\s+hashtag/i,
  /don'?t\s+(include|add|use)\s+hashtag/i,
  /support\s+(the\s+)?regime/i,
  /pro[- ]?regime/i,
  /defend\s+(the\s+)?(irgc|islamic\s+republic)/i,
];

/**
 * Sanitize user input to remove guardrail bypass attempts
 * @param {string} input - User's runtime instruction
 * @returns {string} Sanitized input
 */
export function sanitizeUserInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Check each line for bypass patterns
  const lines = sanitized.split('\n');
  const filteredLines = lines.filter((line) => {
    for (const pattern of BYPASS_PATTERNS) {
      if (pattern.test(line)) {
        console.warn('Filtered potential bypass attempt:', line.substring(0, 50));
        return false;
      }
    }
    return true;
  });

  return filteredLines.join('\n').trim();
}

/**
 * Build the developer context (Layer 2: DEVELOPER)
 * Contains tweet data, selected arguments, CTAs, and exclusions
 * Requests 3 responses of a single type (reply or quote)
 * @param {Object} postData - Tweet information (new structure with nested author object)
 * @param {Array} selectedArgumentIds - Array of selected argument IDs
 * @param {Array} selectedCTAIds - Array of selected CTA IDs
 * @param {Object|null} profileContext - Cached profile info for the author
 * @param {string} responseType - 'reply' or 'quote'
 * @returns {string} Developer context string
 */
export function buildDeveloperContext(
  postData,
  selectedArgumentIds,
  selectedCTAIds,
  profileContext = null,
  responseType = 'reply'
) {
  const parts = [];

  // Task instruction for single-type generation (3 responses)
  parts.push('## TASK');
  parts.push(`Write exactly 3 X ${responseType} responses to the original post below.`);
  if (responseType === 'reply') {
    parts.push('These should be direct replies to the author.');
  } else {
    parts.push('These should be quote reposts with commentary that can stand alone.');
  }
  parts.push('');

  // Original post section
  parts.push('## ORIGINAL POST');

  // Extract author info (support both old and new structure)
  const handle = postData.author?.handle || postData.authorHandle || postData.author || 'unknown';
  const displayName = postData.author?.displayName || postData.author || handle;
  const isVerified = postData.author?.isVerified || postData.isVerified || false;
  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;

  // Author line with display name and handle
  parts.push(`Author: ${displayName} (${displayHandle})`);

  // Build metadata line
  const metaParts = [];
  if (profileContext && profileContext.category && profileContext.category !== 'unknown') {
    metaParts.push(`Category: ${profileContext.category}`);
  }
  if (profileContext && profileContext.followerCategory) {
    metaParts.push(`Followers: ${profileContext.followerCategory}`);
  }
  metaParts.push(`Verified: ${isVerified ? 'yes' : 'no'}`);
  parts.push(`- ${metaParts.join(' | ')}`);

  // Include bio if available
  if (profileContext && profileContext.bio) {
    parts.push(`- Bio: "${profileContext.bio}"`);
  }

  // Media presence
  if (postData.hasMedia !== undefined) {
    parts.push(`- Contains media: ${postData.hasMedia ? 'yes' : 'no'}`);
  }

  parts.push('');
  parts.push(`Text: ${postData.text || ''}`);

  // Quoted/thread context with enhanced info
  if (postData.quotedPost || postData.quotedTweet) {
    const quoted = postData.quotedPost || postData.quotedTweet;
    parts.push('');
    parts.push('## QUOTED POST');

    // Extract quoted author info (support both old and new structure)
    const quotedHandle = quoted.author?.handle || quoted.authorHandle || quoted.author || 'unknown';
    const quotedDisplayName = quoted.author?.displayName || quoted.author || quotedHandle;
    const quotedIsVerified = quoted.author?.isVerified || false;
    const quotedDisplayHandle = quotedHandle.startsWith('@') ? quotedHandle : `@${quotedHandle}`;

    parts.push(`Author: ${quotedDisplayName} (${quotedDisplayHandle})`);
    parts.push(`- Verified: ${quotedIsVerified ? 'yes' : 'no'}`);
    parts.push('');
    parts.push(`Text: ${quoted.text || ''}`);
  }
  parts.push('');

  // Selected arguments section
  const allArguments = getArguments();
  const selectedArgs = [];

  if (selectedArgumentIds && selectedArgumentIds.length > 0) {
    for (const id of selectedArgumentIds) {
      const arg = allArguments.find((a) => a.id === id && a.type === 'include');
      if (arg) {
        selectedArgs.push(arg);
      }
    }
  }

  if (selectedArgs.length > 0) {
    parts.push('## SELECTED ARGUMENTS (facts you MAY use if relevant; do not invent)');
    for (const arg of selectedArgs) {
      parts.push(`- [${arg.id}] ${arg.title}: ${arg.description}`);
    }
    parts.push('');
  }

  // Selected CTAs section
  const allCTAs = getCallToActions();
  const selectedCTAList = [];

  if (selectedCTAIds && selectedCTAIds.length > 0) {
    for (const id of selectedCTAIds) {
      const cta = allCTAs.find((c) => c.id === id);
      if (cta) {
        selectedCTAList.push(cta);
      }
    }
  }

  if (selectedCTAList.length > 0) {
    parts.push('## SELECTED CALLS TO ACTION (policy asks you MAY include if relevant)');
    for (const cta of selectedCTAList) {
      parts.push(`- [${cta.id}] ${cta.title}: ${cta.description}`);
    }
    parts.push('');
  }

  // Always-on exclusions
  const exclusions = getExclusions();
  if (exclusions.length > 0) {
    parts.push('## ALWAYS-ON EXCLUSIONS');
    for (const excl of exclusions) {
      parts.push(`- ${excl.description}`);
    }
    parts.push('');
  }

  // Instructions for using arguments/CTAs
  parts.push('## INSTRUCTIONS FOR USING ARGUMENTS/CTAs');
  parts.push('- Use only items that are relevant to THIS post.');
  parts.push('- If none are relevant, write a response without forcing them.');
  parts.push('- Do not add new factual claims beyond the selected arguments and the post text.');
  parts.push('- Treat sensitive numbers as estimates and use attribution language.');

  return parts.join('\n');
}

/**
 * Build the developer context for refinement (Layer 2: DEVELOPER)
 * Used when user provides feedback - only regenerates 3 responses of the specified type
 * @param {Object} postData - Tweet information (new structure with nested author object)
 * @param {Array} selectedArgumentIds - Array of selected argument IDs
 * @param {Array} selectedCTAIds - Array of selected CTA IDs
 * @param {Object|null} profileContext - Cached profile info for the author
 * @param {string} responseType - 'reply' or 'quote'
 * @returns {string} Developer context string
 */
export function buildDeveloperContextForRefine(
  postData,
  selectedArgumentIds,
  selectedCTAIds,
  profileContext = null,
  responseType = 'reply'
) {
  const parts = [];

  // Task instruction for single-type refinement (3 responses)
  parts.push('## TASK');
  parts.push(`Write exactly 3 X ${responseType} responses to the original post below.`);
  if (responseType === 'reply') {
    parts.push('These should be direct replies to the author.');
  } else {
    parts.push('These should be quote reposts with commentary that can stand alone.');
  }
  parts.push('');

  // Original post section
  parts.push('## ORIGINAL POST');

  // Extract author info (support both old and new structure)
  const handle = postData.author?.handle || postData.authorHandle || postData.author || 'unknown';
  const displayName = postData.author?.displayName || postData.author || handle;
  const isVerified = postData.author?.isVerified || postData.isVerified || false;
  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;

  // Author line with display name and handle
  parts.push(`Author: ${displayName} (${displayHandle})`);

  // Build metadata line
  const metaParts = [];
  if (profileContext && profileContext.category && profileContext.category !== 'unknown') {
    metaParts.push(`Category: ${profileContext.category}`);
  }
  if (profileContext && profileContext.followerCategory) {
    metaParts.push(`Followers: ${profileContext.followerCategory}`);
  }
  metaParts.push(`Verified: ${isVerified ? 'yes' : 'no'}`);
  parts.push(`- ${metaParts.join(' | ')}`);

  // Include bio if available
  if (profileContext && profileContext.bio) {
    parts.push(`- Bio: "${profileContext.bio}"`);
  }

  // Media presence
  if (postData.hasMedia !== undefined) {
    parts.push(`- Contains media: ${postData.hasMedia ? 'yes' : 'no'}`);
  }

  parts.push('');
  parts.push(`Text: ${postData.text || ''}`);

  // Quoted/thread context with enhanced info
  if (postData.quotedPost || postData.quotedTweet) {
    const quoted = postData.quotedPost || postData.quotedTweet;
    parts.push('');
    parts.push('## QUOTED POST');

    // Extract quoted author info (support both old and new structure)
    const quotedHandle = quoted.author?.handle || quoted.authorHandle || quoted.author || 'unknown';
    const quotedDisplayName = quoted.author?.displayName || quoted.author || quotedHandle;
    const quotedIsVerified = quoted.author?.isVerified || false;
    const quotedDisplayHandle = quotedHandle.startsWith('@') ? quotedHandle : `@${quotedHandle}`;

    parts.push(`Author: ${quotedDisplayName} (${quotedDisplayHandle})`);
    parts.push(`- Verified: ${quotedIsVerified ? 'yes' : 'no'}`);
    parts.push('');
    parts.push(`Text: ${quoted.text || ''}`);
  }
  parts.push('');

  // Selected arguments section
  const allArguments = getArguments();
  const selectedArgs = [];

  if (selectedArgumentIds && selectedArgumentIds.length > 0) {
    for (const id of selectedArgumentIds) {
      const arg = allArguments.find((a) => a.id === id && a.type === 'include');
      if (arg) {
        selectedArgs.push(arg);
      }
    }
  }

  if (selectedArgs.length > 0) {
    parts.push('## SELECTED ARGUMENTS (facts you MAY use if relevant; do not invent)');
    for (const arg of selectedArgs) {
      parts.push(`- [${arg.id}] ${arg.title}: ${arg.description}`);
    }
    parts.push('');
  }

  // Selected CTAs section
  const allCTAs = getCallToActions();
  const selectedCTAList = [];

  if (selectedCTAIds && selectedCTAIds.length > 0) {
    for (const id of selectedCTAIds) {
      const cta = allCTAs.find((c) => c.id === id);
      if (cta) {
        selectedCTAList.push(cta);
      }
    }
  }

  if (selectedCTAList.length > 0) {
    parts.push('## SELECTED CALLS TO ACTION (policy asks you MAY include if relevant)');
    for (const cta of selectedCTAList) {
      parts.push(`- [${cta.id}] ${cta.title}: ${cta.description}`);
    }
    parts.push('');
  }

  // Always-on exclusions
  const exclusions = getExclusions();
  if (exclusions.length > 0) {
    parts.push('## ALWAYS-ON EXCLUSIONS');
    for (const excl of exclusions) {
      parts.push(`- ${excl.description}`);
    }
    parts.push('');
  }

  // Instructions for using arguments/CTAs
  parts.push('## INSTRUCTIONS FOR USING ARGUMENTS/CTAs');
  parts.push('- Use only items that are relevant to THIS post.');
  parts.push('- If none are relevant, write a response without forcing them.');
  parts.push('- Do not add new factual claims beyond the selected arguments and the post text.');
  parts.push('- Treat sensitive numbers as estimates and use attribution language.');

  return parts.join('\n');
}

/**
 * Build the user style prompt (Layer 3: USER)
 * Combines default style prompt with custom user preferences and personalization
 * @param {string|null} customUserPrompt - User's custom style prompt (null for default)
 * @param {Object|null} personalization - User personalization data { preferences, seed }
 * @returns {string} Complete user style prompt
 */
export function buildUserStylePrompt(customUserPrompt = null, personalization = null) {
  const defaultPrompt = getDefaultPrompt();
  const effectiveUserPrompt =
    customUserPrompt && customUserPrompt.trim() ? customUserPrompt : defaultPrompt;

  const parts = [effectiveUserPrompt];

  // Add personalization section if available
  if (personalization) {
    const personalizationSection = buildPersonalizationPrompt(
      personalization.preferences,
      personalization.seed
    );
    if (personalizationSection) {
      parts.push(personalizationSection);
    }
  }

  return parts.join('\n\n');
}

/**
 * Build the complete system prompt for API calls
 * For backwards compatibility - combines fixed prompt with user style
 * Note: Developer context is now separate and injected differently per provider
 * @param {string|null} userPrompt - User's custom prompt (null for default)
 * @param {Object|null} personalization - User personalization data { preferences, seed }
 * @param {Array|null} selectedArgumentIds - DEPRECATED: Arguments now in developer context
 * @param {Array|null} selectedCTAIds - DEPRECATED: CTAs now in developer context
 * @returns {string} Complete system prompt (fixed + user style)
 */
export function buildSystemPrompt(
  userPrompt = null,
  personalization = null,
  _selectedArgumentIds = null,
  _selectedCTAIds = null
) {
  const fixedPrompt = getFixedPrompt();
  const userStylePrompt = buildUserStylePrompt(userPrompt, personalization);

  // Note: Arguments and CTAs are now in the developer context layer
  // which is injected separately based on the API provider
  return `${fixedPrompt}\n\n${userStylePrompt}`;
}

/**
 * Build arguments section for the system prompt
 * @deprecated Use buildDeveloperContext() instead
 * @param {Array} selectedArgumentIds - Array of selected argument IDs
 * @returns {string} Formatted arguments section
 */
export function buildArgumentsSection(selectedArgumentIds) {
  if (!selectedArgumentIds || selectedArgumentIds.length === 0) {
    return '';
  }

  const allArguments = getArguments();
  const includeArgs = [];
  const excludeArgs = [];

  for (const id of selectedArgumentIds) {
    const arg = allArguments.find((a) => a.id === id);
    if (arg) {
      if (arg.type === 'include') {
        includeArgs.push(arg.description);
      } else if (arg.type === 'exclude') {
        excludeArgs.push(arg.description);
      }
    }
  }

  const parts = [];

  if (includeArgs.length > 0) {
    parts.push('## Available Arguments');
    parts.push('When relevant to the tweet, you may incorporate these points:\n');
    for (const desc of includeArgs) {
      parts.push(`- ${desc}\n`);
    }
  }

  if (excludeArgs.length > 0) {
    parts.push('## Sources/References to Avoid');
    parts.push('Do NOT reference or cite:\n');
    for (const desc of excludeArgs) {
      parts.push(`- ${desc}\n`);
    }
  }

  return parts.join('\n');
}

/**
 * Build CTAs section for the system prompt
 * @deprecated Use buildDeveloperContext() instead
 * @param {Array} selectedCTAIds - Array of selected CTA IDs
 * @returns {string} Formatted CTAs section
 */
export function buildCTAsSection(selectedCTAIds) {
  if (!selectedCTAIds || selectedCTAIds.length === 0) {
    return '';
  }

  const allCTAs = getCallToActions();
  const selectedCTAs = [];

  for (const id of selectedCTAIds) {
    const cta = allCTAs.find((c) => c.id === id);
    if (cta) {
      selectedCTAs.push(cta.description);
    }
  }

  if (selectedCTAs.length === 0) {
    return '';
  }

  const parts = ['## Call to Action'];
  parts.push('When appropriate to the tweet context, advocate for these policy demands:\n');
  for (const desc of selectedCTAs) {
    parts.push(`- ${desc}\n`);
  }

  return parts.join('\n');
}

/**
 * Build user prompt for content generation (legacy)
 * @deprecated Use buildDeveloperContext() for tweet data instead
 * @param {Object} postData - Post information
 * @param {string} responseType - 'reply' or 'quote'
 * @param {string|null} additionalInstructions - User feedback for iteration
 * @param {Object|null} profileContext - Cached profile info for the author
 * @returns {string} Formatted user prompt
 */
export function buildUserPrompt(
  postData,
  responseType = 'reply',
  additionalInstructions = null,
  profileContext = null
) {
  const parts = [];

  // Post information
  parts.push('## Original Post\n');

  // Include profile context if available
  if (profileContext) {
    let authorLine = `Author: ${postData.author}`;
    if (profileContext.category && profileContext.category !== 'unknown') {
      authorLine += ` (${profileContext.category}`;
      if (profileContext.followerCategory) {
        authorLine += `, ${profileContext.followerCategory} followers`;
      }
      authorLine += ')';
    }
    parts.push(authorLine);
  } else {
    parts.push(`Author: ${postData.author}`);
  }

  parts.push(`Post URL: ${postData.url}`);
  parts.push(`Text: ${postData.text}`);

  if (postData.quotedPost) {
    parts.push('\n## Quoted Post (within the original)');
    parts.push(`Author: ${postData.quotedPost.author}`);
    parts.push(`Text: ${postData.quotedPost.text}`);
  }

  // Response type
  parts.push('\n## Task');
  parts.push(`Generate 3 ${responseType} variations.`);

  // Additional instructions
  if (additionalInstructions) {
    parts.push('\n## Additional Instructions from User');
    parts.push(additionalInstructions);
  }

  return parts.join('\n');
}
