/**
 * Profile caching module for Iran Amplifier extension.
 * Caches X user profiles to enrich LLM context.
 */

// Cache TTL in milliseconds (7 days)
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Follower count categories
 */
const _FOLLOWER_CATEGORIES = {
  small: { max: 1000, label: 'small' },
  medium: { max: 10000, label: 'medium' },
  large: { max: 100000, label: 'large' },
  huge: { max: 1000000, label: 'huge' },
  celebrity: { max: Infinity, label: 'celebrity' },
};

/**
 * Get follower category from count
 * @param {number} count - Follower count
 * @returns {string} Category label
 */
export function getFollowerCategory(count) {
  if (count < 1000) {
    return 'small';
  }
  if (count < 10000) {
    return 'medium';
  }
  if (count < 100000) {
    return 'large';
  }
  if (count < 1000000) {
    return 'huge';
  }
  return 'celebrity';
}

/**
 * Parse follower count from string (e.g., "12.5K", "1.2M")
 * @param {string} text - Follower count text
 * @returns {number} Approximate follower count
 */
export function parseFollowerCount(text) {
  if (!text) {
    return 0;
  }

  const cleaned = text.trim().toLowerCase();

  // Handle "K" suffix (thousands)
  if (cleaned.includes('k')) {
    const num = parseFloat(cleaned.replace('k', ''));
    return Math.round(num * 1000);
  }

  // Handle "M" suffix (millions)
  if (cleaned.includes('m')) {
    const num = parseFloat(cleaned.replace('m', ''));
    return Math.round(num * 1000000);
  }

  // Handle plain numbers
  const num = parseInt(cleaned.replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Get cached profile for a user
 * @param {string} handle - X handle (without @)
 * @returns {Promise<Object|null>} Cached profile or null
 */
export async function getCachedProfile(handle) {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  try {
    const result = await browser.storage.local.get(['profileCache']);
    const cache = result.profileCache || {};
    const cached = cache[normalizedHandle];

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.cachedAt > CACHE_TTL) {
      // Remove expired entry
      delete cache[normalizedHandle];
      await browser.storage.local.set({ profileCache: cache });
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Error reading profile cache:', error);
    return null;
  }
}

/**
 * Cache a user profile
 * @param {Object} profile - Profile data
 * @param {string} profile.handle - X handle
 * @param {string} profile.displayName - Display name
 * @param {string} profile.bio - Bio/description
 * @param {number} profile.followerCount - Follower count
 * @param {string} profile.category - User category (journalist, activist, etc.)
 * @param {boolean} profile.isVerified - Verified status
 */
export async function cacheProfile(profile) {
  const normalizedHandle = profile.handle.toLowerCase().replace('@', '');

  try {
    const result = await browser.storage.local.get(['profileCache']);
    const cache = result.profileCache || {};

    // Clean up old entries (keep last 500 profiles)
    const handles = Object.keys(cache);
    if (handles.length >= 500) {
      // Sort by cachedAt and remove oldest
      const sorted = handles.sort((a, b) => cache[a].cachedAt - cache[b].cachedAt);
      for (let i = 0; i < 100; i++) {
        delete cache[sorted[i]];
      }
    }

    cache[normalizedHandle] = {
      handle: profile.handle,
      displayName: profile.displayName || '',
      bio: profile.bio || '',
      followerCount: profile.followerCount || 0,
      followerCategory: getFollowerCategory(profile.followerCount || 0),
      category: profile.category || 'unknown',
      isVerified: profile.isVerified || false,
      cachedAt: Date.now(),
    };

    await browser.storage.local.set({ profileCache: cache });
  } catch (error) {
    console.error('Error caching profile:', error);
  }
}

/**
 * Detect user category from bio text
 * @param {string} bio - User bio text
 * @param {string} displayName - Display name
 * @returns {string} Detected category
 */
export function detectCategory(bio, displayName = '') {
  const text = `${bio} ${displayName}`.toLowerCase();

  // Journalist keywords
  const journalistKeywords = [
    'journalist',
    'reporter',
    'correspondent',
    'editor',
    'news',
    'جورنالیست',
    'خبرنگار',
    'روزنامه‌نگار',
    '@nytimes',
    '@washingtonpost',
    '@bbc',
    '@cnn',
    '@reuters',
    '@ap',
    '@vaboradio',
    '@manikinevoa',
    '@iranintl',
    '@bbcpersian',
  ];
  if (journalistKeywords.some((k) => text.includes(k))) {
    return 'journalist';
  }

  // Activist keywords
  const activistKeywords = [
    'activist',
    'human rights',
    'advocate',
    'campaigner',
    'فعال',
    'حقوق بشر',
    'مبارز',
    'amnesty',
    'hrw',
    'iranhr',
  ];
  if (activistKeywords.some((k) => text.includes(k))) {
    return 'activist';
  }

  // Academic/researcher keywords
  const academicKeywords = [
    'professor',
    'researcher',
    'scholar',
    'phd',
    'dr.',
    'university',
    'academic',
    'استاد',
    'پژوهشگر',
  ];
  if (academicKeywords.some((k) => text.includes(k))) {
    return 'academic';
  }

  // Politician/official keywords
  const politicianKeywords = [
    'senator',
    'congressman',
    'representative',
    'ambassador',
    'minister',
    'official',
    'parliament',
    'mp',
    'mep',
    'former',
    'ex-',
    'state dept',
  ];
  if (politicianKeywords.some((k) => text.includes(k))) {
    return 'politician';
  }

  // Artist/creator keywords
  const artistKeywords = [
    'artist',
    'musician',
    'filmmaker',
    'director',
    'actor',
    'actress',
    'writer',
    'author',
    'poet',
    'هنرمند',
    'نویسنده',
    'شاعر',
  ];
  if (artistKeywords.some((k) => text.includes(k))) {
    return 'artist';
  }

  // Iranian diaspora indicators
  const diasporaKeywords = [
    'iranian-american',
    'iranian american',
    'persian',
    'iraniandaily',
    'iran',
    'ایران',
    'ایرانی',
    'diaspora',
  ];
  if (diasporaKeywords.some((k) => text.includes(k))) {
    return 'diaspora';
  }

  return 'unknown';
}
