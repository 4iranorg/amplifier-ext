/**
 * Content script for Iran Amplifier extension.
 * Injects "Amplify" buttons into X posts and manages Alpine.js UI.
 */

import Alpine from '@alpinejs/csp';
import { createFlagIcon } from './icons.js';
import { amplifierPanelComponent, createPanelElement } from './panel.js';
import {
  onboardingModalComponent,
  createOnboardingElement,
  checkAndShowOnboarding,
} from './onboarding.js';

// Register Alpine components
Alpine.data('amplifierPanel', amplifierPanelComponent);
Alpine.data('onboardingModal', onboardingModalComponent);

// Start Alpine (runs once)
Alpine.start();

// State: DOM elements managed by Alpine
let panelElement = null;
let onboardingElement = null;

/**
 * Extract tweet data from a tweet element
 * @param {Element} tweetElement - The tweet article element
 * @returns {Object|null} Tweet data
 */
function extractTweetData(tweetElement) {
  try {
    const getPrimaryUserNameNode = () => {
      const nodes = tweetElement.querySelectorAll('[data-testid="User-Name"]');
      for (const node of nodes) {
        if (node.closest('[data-testid="socialContext"]')) {
          continue;
        }
        if (node.closest('[data-testid="quoteTweet"]')) {
          continue;
        }
        return node;
      }
      return nodes[0] || null;
    };

    // Get tweet text
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    const text = textElement ? textElement.innerText : '';

    // Get author info
    const primaryUserNode = getPrimaryUserNameNode();
    const authorLink = primaryUserNode?.querySelector('a[href^="/"]');
    let authorHandle = '';
    let authorDisplayName = '';
    if (authorLink) {
      authorHandle = authorLink.getAttribute('href').slice(1);
      const nameSpan = authorLink.querySelector('span');
      if (nameSpan) {
        authorDisplayName = nameSpan.innerText;
      }
    }

    // Check for verified badge on the primary author
    let authorIsVerified = false;
    if (primaryUserNode) {
      authorIsVerified = !!primaryUserNode.querySelector('[data-testid="icon-verified"]');
    }

    // Get tweet URL/ID from the time element's parent link
    let url = '';
    let tweetId = '';
    const timeElements = tweetElement.querySelectorAll('time');
    for (const timeEl of timeElements) {
      if (timeEl.closest('[role="link"][tabindex="0"]')) {
        continue;
      }
      const timeLink = timeEl.closest('a');
      if (timeLink && timeLink.href.includes('/status/')) {
        url = timeLink.href;
        const match = url.match(/status\/(\d+)/);
        if (match) {
          tweetId = match[1];
        }
        break;
      }
    }

    // Fallback: scan all links
    if (!tweetId || !url) {
      const statusLink = Array.from(tweetElement.querySelectorAll('a[href*="/status/"]')).find(
        (link) =>
          !link.closest('[data-testid="quoteTweet"]') &&
          !link.closest('[role="link"][tabindex="0"]') &&
          !link.closest('[data-testid="tweetText"]')
      );
      if (statusLink) {
        url = url || statusLink.href;
        const match = statusLink.href.match(/status\/(\d+)/);
        if (match) {
          tweetId = tweetId || match[1];
        }
      }
    }

    // Check for quoted tweet
    let quotedTweet = null;
    const quotedTweetElement = tweetElement.querySelector('[data-testid="quoteTweet"]');
    const tweetTextNodes = Array.from(
      tweetElement.querySelectorAll('[data-testid="tweetText"]')
    ).filter((node) => !node.closest('[data-testid="socialContext"]'));

    const quotedTextNode =
      (quotedTweetElement && quotedTweetElement.querySelector('[data-testid="tweetText"]')) ||
      tweetTextNodes.find((node) =>
        node.closest('[role="link"]')?.querySelector('[data-testid="User-Name"]')
      ) ||
      tweetTextNodes[1] ||
      null;

    if (quotedTextNode) {
      const quoteContainer =
        quotedTweetElement ||
        quotedTextNode.closest('[role="link"]') ||
        quotedTextNode.closest('[data-testid="tweet"]') ||
        tweetElement;

      const quotedUserNameEl = quoteContainer.querySelector('[data-testid="User-Name"]');

      const quotedAuthorLink =
        quoteContainer.querySelector('[data-testid="User-Name"] a[href^="/"]') ||
        quotedUserNameEl?.querySelector('a[href^="/"]') ||
        quoteContainer.querySelector('a[href^="/"][role="link"]') ||
        quoteContainer.querySelector('a[href^="/"]');

      let quotedAuthorHandle = '';
      let quotedAuthorDisplayName = '';

      if (quotedAuthorLink) {
        quotedAuthorHandle = quotedAuthorLink.getAttribute('href')?.slice(1) || '';
        const nameSpan = quotedAuthorLink.querySelector('span');
        if (nameSpan) {
          quotedAuthorDisplayName = nameSpan.innerText;
        }
      }

      if (!quotedAuthorHandle && quotedUserNameEl) {
        const textContent = quotedUserNameEl.textContent || '';
        const handleMatch = textContent.match(/@(\w+)/);
        if (handleMatch) {
          quotedAuthorHandle = handleMatch[1];
        }
      }

      if (!quotedAuthorDisplayName && quotedUserNameEl) {
        const spans = quotedUserNameEl.querySelectorAll('span');
        for (const span of spans) {
          const spanText = span.innerText?.trim();
          if (spanText && !spanText.startsWith('@') && spanText.length > 0) {
            quotedAuthorDisplayName = spanText;
            break;
          }
        }
      }

      const quotedIsVerified = quotedUserNameEl
        ? !!quotedUserNameEl.querySelector('[data-testid="icon-verified"]')
        : false;

      quotedTweet = {
        text: quotedTextNode.innerText,
        author: {
          handle: quotedAuthorHandle,
          displayName: quotedAuthorDisplayName || quotedAuthorHandle,
          isVerified: quotedIsVerified,
        },
      };
    }

    // Check for media
    const hasMedia = !!tweetElement.querySelector(
      '[data-testid="tweetPhoto"], [data-testid="videoPlayer"]'
    );

    return {
      tweetId,
      url,
      text,
      hasMedia,
      author: {
        handle: authorHandle,
        displayName: authorDisplayName || authorHandle,
        isVerified: authorIsVerified,
      },
      quotedTweet,
    };
  } catch (error) {
    console.error('Error extracting tweet data:', error);
    return null;
  }
}

/**
 * Create element with attributes and children
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes to set
 * @param {Array} children - Child elements or text
 * @returns {Element} Created element
 */
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'textContent') {
      el.textContent = value;
    } else if (key.startsWith('data')) {
      el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  }
  return el;
}

/**
 * Create the amplify button element
 * @returns {Element} Button element
 */
function createAmplifyButton() {
  const icon = createElement('span', { className: 'iran-amplifier-icon' });
  icon.appendChild(createFlagIcon('14px'));
  const text = createElement('span', { className: 'iran-amplifier-text', textContent: 'Amplify' });
  const button = createElement(
    'button',
    {
      className: 'iran-amplifier-btn',
      title: 'Generate response with Iran Amplifier',
      'aria-label': 'Amplify this post with Iran Amplifier',
    },
    [icon, text]
  );
  return button;
}

/**
 * Ensure the panel element exists and is initialized
 */
function ensurePanel() {
  if (!panelElement) {
    panelElement = createPanelElement();
    document.body.appendChild(panelElement);
    Alpine.initTree(panelElement);
  }
}

/**
 * Get the panel's Alpine data
 * @returns {Object|null} Alpine data object
 */
function getPanelData() {
  if (!panelElement) {
    return null;
  }
  return Alpine.$data(panelElement);
}

/**
 * Show panel at position with tweet data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} tweetData - Tweet data
 */
function showPanel(x, y, tweetData) {
  ensurePanel();
  const data = getPanelData();
  if (data) {
    data.show(x, y, tweetData);
  }
}

/**
 * Handle amplify button click
 * @param {Event} event - Click event
 * @param {Element} tweetElement - Tweet element
 */
async function handleAmplifyClick(event, tweetElement) {
  event.stopPropagation();
  event.preventDefault();

  const tweetData = extractTweetData(tweetElement);
  if (!tweetData || !tweetData.text) {
    alert('Could not extract post data. Please try again.');
    return;
  }

  // Show panel near the button
  const rect = event.target.getBoundingClientRect();
  showPanel(rect.left, rect.bottom + 10, tweetData);
}

/**
 * Inject amplify button into a tweet
 * @param {Element} tweetElement - Tweet article element
 */
function injectButton(tweetElement) {
  if (tweetElement.querySelector('.iran-amplifier-btn')) {
    return;
  }

  const actionBar = tweetElement.querySelector('[role="group"]');
  if (!actionBar) {
    return;
  }

  const button = createAmplifyButton();
  button.addEventListener('click', (e) => handleAmplifyClick(e, tweetElement));

  const wrapper = createElement('div', { className: 'iran-amplifier-wrapper' }, [button]);
  actionBar.appendChild(wrapper);
}

/**
 * Process all tweets on the page
 */
function processTweets() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  tweets.forEach(injectButton);
}

// ============================================
// COMPOSE DIALOG (Quote Tweet) FUNCTIONALITY
// ============================================

/**
 * Extract tweet data from the quoted/replied tweet in compose dialog
 * @param {Element} dialogElement - The compose dialog element
 * @returns {Object|null} Tweet data or null if extraction failed
 */
function extractTweetFromDialog(dialogElement) {
  try {
    const tweetTextElements = dialogElement.querySelectorAll('[data-testid="tweetText"]');

    let textElement = null;
    let authorElement = null;
    let tweetUrl = '';
    let container = null;

    for (const el of tweetTextElements) {
      if (el.closest('[data-testid="tweetTextarea_0"]')) {
        continue;
      }
      textElement = el;

      container =
        el.closest('div[data-testid="Tweet-User-Avatar"]')?.parentElement ||
        el.closest('article') ||
        el.parentElement?.parentElement?.parentElement;

      if (container) {
        const authorLinks = container.querySelectorAll('a[role="link"]');
        for (const link of authorLinks) {
          const href = link.getAttribute('href');
          if (href && href.startsWith('/') && !href.includes('/status/')) {
            authorElement = link;
            break;
          }
        }
        const statusLinks = container.querySelectorAll('a[href*="/status/"]');
        if (statusLinks.length > 0) {
          tweetUrl = statusLinks[0].href;
        }
      }
      break;
    }

    if (!textElement) {
      return null;
    }

    const text = textElement.innerText;

    let authorHandle = '';
    let authorDisplayName = '';
    if (authorElement) {
      const href = authorElement.getAttribute('href');
      if (href) {
        authorHandle = href.slice(1);
      }
      const nameSpan = authorElement.querySelector('span');
      if (nameSpan) {
        authorDisplayName = nameSpan.innerText;
      }
    }

    const userNameEl = container?.querySelector('[data-testid="User-Name"]');
    const isVerified = userNameEl
      ? !!userNameEl.querySelector('[data-testid="icon-verified"]')
      : false;

    let tweetId = '';
    if (tweetUrl) {
      const match = tweetUrl.match(/status\/(\d+)/);
      if (match) {
        tweetId = match[1];
      }
    }

    return {
      tweetId,
      url: tweetUrl,
      text,
      hasMedia: false,
      author: {
        handle: authorHandle,
        displayName: authorDisplayName || authorHandle,
        isVerified,
      },
      quotedTweet: null,
    };
  } catch (error) {
    console.error('Error extracting tweet from dialog:', error);
    return null;
  }
}

/**
 * Create the toolbar amplify button for compose dialog
 * @returns {Element} Button element
 */
function createToolbarAmplifyButton() {
  const iconSpan = createElement('span', { className: 'iran-amplifier-toolbar-icon' });
  iconSpan.appendChild(createFlagIcon('18px'));
  const button = createElement(
    'button',
    {
      className: 'iran-amplifier-toolbar-btn',
      title: 'Generate response with Iran Amplifier',
      'aria-label': 'Generate response with Iran Amplifier',
      type: 'button',
    },
    [iconSpan]
  );
  return button;
}

/**
 * Handle amplify button click in compose dialog
 * @param {Event} event - Click event
 * @param {Element} dialogElement - The compose dialog
 */
function handleComposeAmplifyClick(event, dialogElement) {
  event.stopPropagation();
  event.preventDefault();

  const tweetData = extractTweetFromDialog(dialogElement);
  if (!tweetData || !tweetData.text) {
    alert('Could not extract post data. Please try again.');
    return;
  }

  const rect = event.target.getBoundingClientRect();
  showPanel(rect.left - 350, rect.top - 400, tweetData);
}

/**
 * Inject amplify button into compose dialog toolbar
 * @param {Element} dialogElement - The compose dialog element
 */
function injectComposeButton(dialogElement) {
  if (dialogElement.querySelector('.iran-amplifier-toolbar-btn')) {
    return;
  }

  const hasTweet = !!dialogElement.querySelector('[data-testid="tweetText"]');
  if (!hasTweet) {
    return;
  }

  const postButton = dialogElement.querySelector(
    '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
  );

  if (postButton) {
    const postParent = postButton.parentElement;
    if (!postParent || !postParent.parentElement) {
      return;
    }

    const button = createToolbarAmplifyButton();
    button.addEventListener('click', (e) => handleComposeAmplifyClick(e, dialogElement));

    const wrapper = document.createElement('div');
    wrapper.className = postParent.className + ' iran-amplifier-toolbar-wrapper';
    wrapper.appendChild(button);

    postParent.parentElement.insertBefore(wrapper, postParent);
  }
}

/**
 * Process compose dialogs on the page
 */
function processComposeDialogs() {
  const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');

  dialogs.forEach((dialog) => {
    const hasComposeArea = dialog.querySelector('[data-testid="tweetTextarea_0"]');
    if (hasComposeArea) {
      injectComposeButton(dialog);
    }
  });
}

// ============================================
// ONBOARDING
// ============================================

/**
 * Initialize onboarding modal and check if it should be shown
 */
async function initOnboarding() {
  if (!onboardingElement) {
    onboardingElement = createOnboardingElement();
    document.body.appendChild(onboardingElement);
    Alpine.initTree(onboardingElement);
  }

  await checkAndShowOnboarding(Alpine, onboardingElement);
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize observer for dynamically loaded tweets and dialogs
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      processTweets();
      processComposeDialogs();
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial processing
processTweets();
processComposeDialogs();

// Initialize onboarding
initOnboarding();

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  if (panelElement) {
    const data = getPanelData();
    if (
      data &&
      data.isVisible &&
      !panelElement.contains(e.target) &&
      !e.target.closest('.iran-amplifier-btn')
    ) {
      data.hide();
    }
  }
});

console.log('Iran Amplifier content script loaded');
