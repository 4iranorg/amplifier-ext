/**
 * Personalization utilities for Iran Amplifier extension.
 * Handles user preferences and unique voice generation.
 */

/**
 * Voice style options
 */
export const VOICE_STYLES = [
  {
    id: 'professional',
    label: 'Professional & measured',
    description: 'Calm, factual, authoritative tone',
  },
  {
    id: 'passionate',
    label: 'Passionate & direct',
    description: 'Urgent, emotionally engaged, calls to action',
  },
  {
    id: 'analytical',
    label: 'Thoughtful & analytical',
    description: 'Evidence-based, nuanced, educational',
  },
  {
    id: 'personal',
    label: 'Warm & personal',
    description: 'Conversational, empathetic, human stories',
  },
];

/**
 * Background/expertise options
 */
export const BACKGROUNDS = [
  {
    id: 'tech',
    label: 'Technology',
    description: 'Tech industry, digital rights, internet freedom',
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Medical, humanitarian, public health angles',
  },
  {
    id: 'arts',
    label: 'Arts & Culture',
    description: 'Cultural preservation, artistic expression',
  },
  {
    id: 'law',
    label: 'Law & Policy',
    description: 'Legal frameworks, international law, sanctions',
  },
  { id: 'business', label: 'Business', description: 'Economic impact, trade, entrepreneurship' },
  {
    id: 'student',
    label: 'Student/Academic',
    description: 'Education, youth perspective, research',
  },
  { id: 'other', label: 'Other', description: 'General perspective' },
];

/**
 * Content approach options
 */
export const APPROACHES = [
  { id: 'facts', label: 'Facts & evidence', description: 'Data, statistics, documented events' },
  {
    id: 'human',
    label: 'Human stories & impact',
    description: 'Personal narratives, real consequences',
  },
  { id: 'policy', label: 'Policy & action', description: 'What can be done, calls for change' },
  { id: 'mixed', label: 'Mixed approach', description: 'Balance of all approaches' },
];

/**
 * Response length options
 */
export const LENGTHS = [
  { id: 'punchy', label: 'Punchy', description: 'Short, impactful (under 180 chars)' },
  { id: 'medium', label: 'Medium', description: 'Balanced length (180-240 chars)' },
  { id: 'full', label: 'Full', description: 'Use full character limit (up to 280 chars)' },
];

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES = {
  voiceStyle: 'mixed',
  background: 'other',
  approach: 'mixed',
  length: 'medium',
};

/**
 * Generate a unique user seed (7-character alphanumeric)
 * @returns {string} Unique seed string
 */
export function generateUserSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let seed = '';
  const randomValues = new Uint8Array(7);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 7; i++) {
    seed += chars[randomValues[i] % chars.length];
  }
  return seed;
}

/**
 * Get user preferences from storage
 * @returns {Promise<Object>} User preferences object
 */
export async function getUserPreferences() {
  const result = await browser.storage.local.get(['userPreferences', 'userSeed']);
  return {
    preferences: result.userPreferences || DEFAULT_PREFERENCES,
    seed: result.userSeed || null,
  };
}

/**
 * Save user preferences to storage
 * @param {Object} preferences - User preferences object
 */
export async function saveUserPreferences(preferences) {
  await browser.storage.local.set({ userPreferences: preferences });
}

/**
 * Initialize user seed if not exists
 * @returns {Promise<string>} The user seed
 */
export async function initializeUserSeed() {
  const result = await browser.storage.local.get(['userSeed']);
  if (result.userSeed) {
    return result.userSeed;
  }
  const seed = generateUserSeed();
  await browser.storage.local.set({ userSeed: seed });
  return seed;
}

/**
 * Check if onboarding has been completed
 * @returns {Promise<boolean>} True if onboarding is complete
 */
export async function isOnboardingComplete() {
  const result = await browser.storage.local.get(['onboardingComplete']);
  return result.onboardingComplete === true;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding() {
  await browser.storage.local.set({ onboardingComplete: true });
}

/**
 * Build personalization prompt section from preferences
 * @param {Object} preferences - User preferences
 * @param {string} seed - User's unique seed
 * @returns {string} Formatted personalization section for the prompt
 */
export function buildPersonalizationPrompt(preferences, seed) {
  if (!preferences && !seed) {
    return '';
  }

  const parts = ['## Your Personalized Style'];

  // Voice style
  if (preferences?.voiceStyle && preferences.voiceStyle !== 'mixed') {
    const style = VOICE_STYLES.find((s) => s.id === preferences.voiceStyle);
    if (style) {
      parts.push(`Voice: ${style.label} - ${style.description}`);
    }
  }

  // Background
  if (preferences?.background && preferences.background !== 'other') {
    const bg = BACKGROUNDS.find((b) => b.id === preferences.background);
    if (bg) {
      parts.push(
        `Background: ${bg.label} - reference ${bg.description.toLowerCase()} when relevant`
      );
    }
  }

  // Approach
  if (preferences?.approach && preferences.approach !== 'mixed') {
    const approach = APPROACHES.find((a) => a.id === preferences.approach);
    if (approach) {
      parts.push(`Approach: ${approach.description}`);
    }
  }

  // Length preference
  if (preferences?.length) {
    const length = LENGTHS.find((l) => l.id === preferences.length);
    if (length) {
      parts.push(`Length: ${length.label} - ${length.description}`);
    }
  }

  // Unique voice fingerprint
  if (seed) {
    parts.push(
      `Voice fingerprint: ${seed} - let this subtly influence your unique word choices and phrasing`
    );
  }

  // Only return if we have more than just the header
  if (parts.length > 1) {
    return parts.join('\n');
  }

  // Even with no preferences, include the seed for uniqueness
  if (seed) {
    return `## Your Unique Voice\nVoice fingerprint: ${seed} - let this subtly influence your unique word choices and phrasing`;
  }

  return '';
}
