/**
 * Update checker module for Iran Amplifier extension.
 * Checks GitHub releases for new versions.
 */

// GitHub repository info
export const GITHUB_OWNER = '4iranorg';
export const GITHUB_REPO = 'amplifier-ext';
export const RELEASES_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// Check interval (24 hours)
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * Parse version string to comparable number
 * @param {string} version - Version string (e.g., "1.2.3")
 * @returns {number} Comparable version number
 */
function parseVersion(version) {
  const parts = version.replace(/^v/, '').split('.');
  let num = 0;
  for (let i = 0; i < 3; i++) {
    num = num * 1000 + (parseInt(parts[i], 10) || 0);
  }
  return num;
}

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  const n1 = parseVersion(v1);
  const n2 = parseVersion(v2);
  if (n1 < n2) {
    return -1;
  }
  if (n1 > n2) {
    return 1;
  }
  return 0;
}

/**
 * Get current extension version from manifest
 * @returns {string} Current version
 */
export function getCurrentVersion() {
  return browser.runtime.getManifest().version;
}

/**
 * Check for updates from GitHub
 * @returns {Promise<Object|null>} Update info or null if no update
 */
export async function checkForUpdate() {
  try {
    // Check if we've checked recently
    const result = await browser.storage.local.get(['lastUpdateCheck', 'updateInfo']);

    const now = Date.now();
    if (result.lastUpdateCheck && now - result.lastUpdateCheck < CHECK_INTERVAL) {
      // Return cached info if recent check
      return result.updateInfo || null;
    }

    // Fetch latest release from GitHub
    const response = await fetch(RELEASES_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to check for updates:', response.status);
      return null;
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = getCurrentVersion();

    // Save check time
    await browser.storage.local.set({ lastUpdateCheck: now });

    if (compareVersions(latestVersion, currentVersion) > 0) {
      // New version available
      const updateInfo = {
        version: latestVersion,
        name: release.name || `Version ${latestVersion}`,
        url: release.html_url,
        body: release.body || '',
        publishedAt: release.published_at,
      };

      await browser.storage.local.set({ updateInfo });
      return updateInfo;
    } else {
      // No update available
      await browser.storage.local.set({ updateInfo: null });
      return null;
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Get cached update info
 * @returns {Promise<Object|null>} Cached update info or null
 */
export async function getCachedUpdateInfo() {
  try {
    const result = await browser.storage.local.get(['updateInfo']);
    return result.updateInfo || null;
  } catch (_error) {
    return null;
  }
}

/**
 * Dismiss the update notification
 * @param {string} version - Version to dismiss
 */
export async function dismissUpdate(version) {
  await browser.storage.local.set({
    dismissedVersion: version,
    updateInfo: null,
  });
}

/**
 * Check if update was dismissed
 * @param {string} version - Version to check
 * @returns {Promise<boolean>} True if dismissed
 */
export async function isUpdateDismissed(version) {
  try {
    const result = await browser.storage.local.get(['dismissedVersion']);
    return result.dismissedVersion === version;
  } catch (_error) {
    return false;
  }
}
