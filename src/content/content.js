/**
 * Content script for Iran Amplifier extension.
 * Injects "Amplify" buttons into X posts.
 */

/**
 * Create Iran flag icon element as an img tag
 * @param {string} size - CSS size (e.g., '16px', '1em')
 * @returns {Element} img element
 */
function createFlagIcon(size = '1em') {
  const img = document.createElement('img');
  img.src = browser.runtime.getURL('icons/iran.svg');
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.style.width = size;
  img.style.height = size;
  img.style.display = 'inline-block';
  img.style.verticalAlign = 'middle';
  return img;
}

/**
 * Create an SVG icon element
 * @param {string} name - Icon name: 'copy', 'check', 'reply', 'quote', 'refresh'
 * @param {string} size - CSS size (e.g., '14px', '1em')
 * @returns {Element} SVG element
 */
function createIcon(name, size = '14px') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.style.display = 'inline-block';
  svg.style.verticalAlign = 'middle';

  // Refresh, quote, and reply icons use 24x24 viewBox, others use 14x14
  if (name === 'refresh' || name === 'quote' || name === 'reply') {
    svg.setAttribute('viewBox', '0 0 24 24');
  } else {
    svg.setAttribute('viewBox', '0 0 14 14');
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', name === 'refresh' ? '2' : '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  switch (name) {
    case 'copy':
      path.setAttribute(
        'd',
        'M8 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2m3-4h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z'
      );
      break;
    case 'check':
      path.setAttribute('d', 'M2 7l4 4 6-8');
      path.setAttribute('stroke-width', '2');
      break;
    case 'reply':
      // Speech bubble icon (X's reply style)
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('stroke', 'none');
      path.setAttribute(
        'd',
        'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z'
      );
      break;
    case 'quote':
      // Pencil/edit icon (X's repost-with-comment style)
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('stroke', 'none');
      path.setAttribute(
        'd',
        'M14.23 2.854c.98-.977 2.56-.977 3.54 0l3.38 3.378c.97.977.97 2.559 0 3.536L9.91 21H3v-6.914L14.23 2.854zm2.12 1.414c-.19-.195-.51-.195-.7 0L5 14.914V19h4.09L19.73 8.354c.2-.196.2-.512 0-.708l-3.38-3.378zM14.75 19l-2 2H21v-2h-6.25z'
      );
      break;
    case 'refresh':
      // Lucide rotate-ccw icon (two paths)
      path.setAttribute('d', 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('fill', 'none');
      path2.setAttribute('stroke', 'currentColor');
      path2.setAttribute('stroke-width', '2');
      path2.setAttribute('stroke-linecap', 'round');
      path2.setAttribute('stroke-linejoin', 'round');
      path2.setAttribute('d', 'M3 3v5h5');
      svg.appendChild(path2);
      break;
  }

  svg.appendChild(path);
  return svg;
}

// State management
let panelContainer = null;
let currentTweetData = null;
let currentResponseType = 'reply';
let onboardingModal = null;
let generationStartTime = null;

// Separate cached results per tab (on-demand generation)
let cachedReplyResult = null;
let cachedQuoteResult = null;

// Personalization options (must match lib/personalization.js)
const VOICE_STYLES = [
  { id: 'professional', label: 'Professional & measured' },
  { id: 'passionate', label: 'Passionate & direct' },
  { id: 'analytical', label: 'Thoughtful & analytical' },
  { id: 'personal', label: 'Warm & personal' },
];

const BACKGROUNDS = [
  { id: 'tech', label: 'Technology' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'law', label: 'Law & Policy' },
  { id: 'business', label: 'Business' },
  { id: 'student', label: 'Student/Academic' },
  { id: 'other', label: 'Other' },
];

const APPROACHES = [
  { id: 'facts', label: 'Facts & evidence' },
  { id: 'human', label: 'Human stories & impact' },
  { id: 'policy', label: 'Policy & action' },
  { id: 'mixed', label: 'Mixed approach' },
];

const LENGTHS = [
  { id: 'punchy', label: 'Punchy (short)' },
  { id: 'medium', label: 'Medium' },
  { id: 'full', label: 'Full (280 chars)' },
];

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @param {Element} parent - Parent element to search within (defaults to document)
 * @returns {Promise<Element|null>} Element or null if timeout
 */
function waitForElement(selector, timeout = 2000, parent = document) {
  return new Promise((resolve) => {
    const existing = parent.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = parent.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(parent, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Extract author bio by triggering X's hover card
 * @param {Element} tweetElement - The tweet article element
 * @returns {Promise<string>} Bio text or empty string
 */
async function _extractAuthorBio(tweetElement) {
  try {
    // Find the profile link (avatar or username)
    const profileLink = tweetElement.querySelector(
      '[data-testid="User-Name"] a[href^="/"], [data-testid="Tweet-User-Avatar"] a[href^="/"]'
    );
    if (!profileLink) {
      console.log('[Amplifier] Bio extraction: No profile link found');
      return '';
    }

    const handle = profileLink.getAttribute('href')?.slice(1) || 'unknown';
    console.log(`[Amplifier] Attempting bio extraction for @${handle}...`);

    // Try multiple event types to trigger hover card
    const rect = profileLink.getBoundingClientRect();
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };

    // Try pointerenter first (X likely uses pointer events)
    profileLink.dispatchEvent(new PointerEvent('pointerenter', eventOptions));
    profileLink.dispatchEvent(new MouseEvent('mouseenter', eventOptions));
    profileLink.dispatchEvent(new MouseEvent('mouseover', eventOptions));

    // Wait for hover card to appear
    const hoverCard = await waitForElement('[data-testid="HoverCard"]', 2000);
    if (!hoverCard) {
      console.log(`[Amplifier] Bio extraction: Hover card did not appear for @${handle}`);
      profileLink.dispatchEvent(new PointerEvent('pointerleave', eventOptions));
      profileLink.dispatchEvent(new MouseEvent('mouseleave', eventOptions));
      return '';
    }

    console.log(`[Amplifier] Hover card appeared for @${handle}`);

    // Debug: log hover card structure
    console.log(
      '[Amplifier] Hover card testids:',
      [...hoverCard.querySelectorAll('[data-testid]')].map((el) => el.dataset.testid)
    );

    // Extract bio from hover card - try multiple selectors
    let bioElement = hoverCard.querySelector('[data-testid="UserDescription"]');
    if (!bioElement) {
      // Fallback: look for bio in common locations
      bioElement = hoverCard.querySelector('[data-testid="UserBio"]');
    }
    if (!bioElement) {
      // Fallback: look for the bio text container (usually after name/handle)
      const spans = hoverCard.querySelectorAll('span');
      for (const span of spans) {
        // Bio is usually longer text, not a name or handle
        const text = span.textContent?.trim() || '';
        if (text.length > 30 && !text.startsWith('@') && !text.includes('followers')) {
          bioElement = span;
          break;
        }
      }
    }
    const bio = bioElement?.textContent?.trim() || '';

    // Close hover card
    profileLink.dispatchEvent(new PointerEvent('pointerleave', eventOptions));
    profileLink.dispatchEvent(new MouseEvent('mouseleave', eventOptions));

    // Log for verification
    if (bio) {
      console.log(`[Amplifier] Extracted bio for @${handle}:`, bio);
    } else {
      console.log(`[Amplifier] No bio found for @${handle}`);
    }

    return bio;
  } catch (error) {
    console.error('[Amplifier] Error extracting bio:', error);
    return '';
  }
}

/**
 * Extract profile data from a tweet element
 * @param {Element} tweetElement - The tweet article element
 * @returns {Object|null} Profile data or null
 */
function _extractProfileData(tweetElement) {
  try {
    const getPrimaryUserNameNode = () => {
      const nodes = tweetElement.querySelectorAll('[data-testid="User-Name"]');
      for (const node of nodes) {
        // Skip reposter/social context and quoted tweets
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

    const profile = {
      handle: '',
      displayName: '',
      bio: '',
      followerCount: 0,
      isVerified: false,
    };

    // Get author handle from the primary tweet author block (avoids picking the reposter)
    const primaryUserNode = getPrimaryUserNameNode();
    const authorLink = primaryUserNode?.querySelector('a[href^="/"]');
    if (authorLink) {
      profile.handle = authorLink.getAttribute('href').slice(1);
      const nameSpan = authorLink.querySelector('span');
      if (nameSpan) {
        profile.displayName = nameSpan.innerText;
      }
    }

    // Check for verified badge
    profile.isVerified = !!tweetElement.querySelector('[data-testid="icon-verified"]');

    // Note: Bio and follower count are not available in tweet view
    // They would require hovering or visiting the profile
    // We'll let the background script detect category from name

    if (profile.handle) {
      return profile;
    }
    return null;
  } catch (error) {
    console.error('Error extracting profile data:', error);
    return null;
  }
}

/**
 * Extract tweet data from a tweet element
 * @param {Element} tweetElement - The tweet article element
 * @returns {Object|null} Tweet data with structure:
 *   {
 *     tweetId: string,
 *     url: string,
 *     text: string,
 *     hasMedia: boolean,
 *     author: { handle: string, displayName: string, isVerified: boolean },
 *     quotedTweet: { text: string, author: { handle, displayName, isVerified } } | null
 *   }
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

    // Check for verified badge on the primary author (exclude quoted tweet badges)
    let authorIsVerified = false;
    if (primaryUserNode) {
      authorIsVerified = !!primaryUserNode.querySelector('[data-testid="icon-verified"]');
    }

    // Get tweet URL/ID from the time element's parent link
    // Skip time elements inside quoted tweet containers (role="link" with tabindex="0")
    let url = '';
    let tweetId = '';
    const timeElements = tweetElement.querySelectorAll('time');
    for (const timeEl of timeElements) {
      // Skip time elements inside quoted tweet containers
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

    // Fallback: scan all links in the tweet for a status URL
    // Skip links inside quoted containers or tweet text (which may contain self-referencing URLs)
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

    // Check for quoted tweet (support both quoteTweet container and generic nested tweet text)
    let quotedTweet = null;
    const quotedTweetElement = tweetElement.querySelector('[data-testid="quoteTweet"]');
    const tweetTextNodes = Array.from(
      tweetElement.querySelectorAll('[data-testid="tweetText"]')
    ).filter((node) => !node.closest('[data-testid="socialContext"]'));

    const quotedTextNode =
      (quotedTweetElement && quotedTweetElement.querySelector('[data-testid="tweetText"]')) ||
      // Prefer a tweetText node that is inside a link that itself contains a User-Name (typical quote shell)
      tweetTextNodes.find((node) =>
        node.closest('[role="link"]')?.querySelector('[data-testid="User-Name"]')
      ) ||
      tweetTextNodes[1] || // second tweetText in the article is usually the quote
      null;

    if (quotedTextNode) {
      // Find the nearest ancestor that contains the quoted tweet author block
      const quoteContainer =
        quotedTweetElement ||
        quotedTextNode.closest('[role="link"]') || // quoted shell is usually a link
        quotedTextNode.closest('[data-testid="tweet"]') ||
        tweetElement;

      // Find the User-Name element in the quote container
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
        // Try to get display name from the link's span
        const nameSpan = quotedAuthorLink.querySelector('span');
        if (nameSpan) {
          quotedAuthorDisplayName = nameSpan.innerText;
        }
      }

      // Fallback: extract handle from text content when no anchor exists
      if (!quotedAuthorHandle && quotedUserNameEl) {
        const textContent = quotedUserNameEl.textContent || '';
        const handleMatch = textContent.match(/@(\w+)/);
        if (handleMatch) {
          quotedAuthorHandle = handleMatch[1];
        }
      }

      // Fallback for display name: try to find it in the User-Name element
      if (!quotedAuthorDisplayName && quotedUserNameEl) {
        // The display name is usually in the first span before the @handle
        const spans = quotedUserNameEl.querySelectorAll('span');
        for (const span of spans) {
          const spanText = span.innerText?.trim();
          // Skip if it's a handle (@...) or empty
          if (spanText && !spanText.startsWith('@') && spanText.length > 0) {
            quotedAuthorDisplayName = spanText;
            break;
          }
        }
      }

      // Check for verified badge in quoted tweet
      const quotedIsVerified = quotedUserNameEl
        ? !!quotedUserNameEl.querySelector('[data-testid="icon-verified"]')
        : false;

      quotedTweet = {
        text: quotedTextNode.innerText,
        author: {
          handle: quotedAuthorHandle,
          displayName: quotedAuthorDisplayName || quotedAuthorHandle, // Fallback to handle
          isVerified: quotedIsVerified,
        },
      };
    }

    // Check for media
    const hasMedia = !!tweetElement.querySelector(
      '[data-testid="tweetPhoto"], [data-testid="videoPlayer"]'
    );

    const result = {
      tweetId,
      url,
      text,
      hasMedia,
      author: {
        handle: authorHandle,
        displayName: authorDisplayName || authorHandle, // Fallback to handle
        isVerified: authorIsVerified,
      },
      quotedTweet,
    };

    return result;
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
 * Create the response panel
 * @returns {Element} Panel element
 */
function createPanel() {
  const panel = createElement('div', { className: 'iran-amplifier-panel' });

  // Header
  const titleSpan = createElement('span', { className: 'iap-title' });
  titleSpan.appendChild(createFlagIcon('18px'));
  titleSpan.appendChild(document.createTextNode(' Iran Amplifier'));
  const header = createElement('div', { className: 'iap-header' }, [
    titleSpan,
    createElement('button', {
      className: 'iap-close',
      title: 'Close',
      'aria-label': 'Close panel',
      textContent: '×',
    }),
  ]);

  // Type selector
  const typeSelector = createElement('div', { className: 'iap-type-selector' }, [
    createElement('button', {
      className: 'iap-type-btn active',
      'data-type': 'reply',
      textContent: 'Reply',
    }),
    createElement('button', {
      className: 'iap-type-btn',
      'data-type': 'quote',
      textContent: 'Quote',
    }),
  ]);

  // Content area - separate containers per tab
  const loading = createElement('div', { className: 'iap-loading', style: 'display: none;' }, [
    createElement('div', { className: 'iap-spinner' }),
    createElement('span', { textContent: 'Generating responses...' }),
  ]);
  const error = createElement('div', { className: 'iap-error', style: 'display: none;' });
  // Separate response containers for reply and quote tabs
  const replyContainer = createElement('div', {
    className: 'iap-responses iap-replies-container',
  });
  const quoteContainer = createElement('div', {
    className: 'iap-responses iap-quotes-container',
    style: 'display: none;',
  });
  const content = createElement('div', { className: 'iap-content' }, [
    loading,
    error,
    replyContainer,
    quoteContainer,
  ]);

  // Feedback area
  const feedbackInput = createElement('input', {
    type: 'text',
    className: 'iap-feedback-input',
    placeholder: 'Refine with a prompt...',
  });
  const feedbackBtn = createElement('button', {
    className: 'iap-feedback-btn',
    title: 'Regenerate',
    'aria-label': 'Regenerate responses',
  });
  feedbackBtn.appendChild(createIcon('refresh', '16px'));
  const feedback = createElement('div', { className: 'iap-feedback' }, [
    feedbackInput,
    feedbackBtn,
  ]);

  panel.appendChild(header);
  panel.appendChild(typeSelector);
  panel.appendChild(content);
  panel.appendChild(feedback);

  // Event listeners
  header.querySelector('.iap-close').addEventListener('click', hidePanel);

  // Type selector - show/hide containers and generate on-demand
  typeSelector.querySelectorAll('.iap-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      typeSelector.querySelectorAll('.iap-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentResponseType = btn.dataset.type;

      // Show/hide appropriate container
      if (currentResponseType === 'reply') {
        replyContainer.style.display = 'block';
        quoteContainer.style.display = 'none';
        replyContainer.scrollTop = 0;
      } else {
        replyContainer.style.display = 'none';
        quoteContainer.style.display = 'block';
        quoteContainer.scrollTop = 0;
      }

      if (currentTweetData) {
        // Check if we have cached responses for this tab
        const cachedResult =
          currentResponseType === 'reply' ? cachedReplyResult : cachedQuoteResult;
        if (cachedResult) {
          // Already displayed, just show the container
          repositionPanel();
        } else {
          // Generate on-demand for this tab
          generateAndDisplay();
        }
      }
    });
  });

  // Feedback/refresh button
  feedbackBtn.addEventListener('click', () => {
    if (!currentTweetData) {
      return;
    }
    const feedbackText = feedbackInput.value.trim();
    // If no feedback text, force regeneration with new responses
    generateAndDisplay(feedbackText || null, !feedbackText);
    feedbackInput.value = '';
  });

  feedbackInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      feedbackBtn.click();
    }
  });

  return panel;
}

/**
 * Show panel at position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function showPanel(x, y) {
  if (!panelContainer) {
    panelContainer = createPanel();
    document.body.appendChild(panelContainer);
  }

  // Position panel with viewport bounds checking
  const panelWidth = 400;
  const panelHeight = Math.min(500, window.innerHeight * 0.8);
  const margin = 10;

  // Clamp to viewport bounds (prevent going off any edge)
  const left = Math.max(margin, Math.min(x, window.innerWidth - panelWidth - margin));
  const top = Math.max(margin, Math.min(y, window.innerHeight - panelHeight - margin));

  panelContainer.style.display = 'block';
  panelContainer.style.left = `${left}px`;
  panelContainer.style.top = `${top}px`;

  // Reset state - clear both containers
  const replyContainerEl = panelContainer.querySelector('.iap-replies-container');
  const quoteContainerEl = panelContainer.querySelector('.iap-quotes-container');
  while (replyContainerEl.firstChild) {
    replyContainerEl.removeChild(replyContainerEl.firstChild);
  }
  while (quoteContainerEl.firstChild) {
    quoteContainerEl.removeChild(quoteContainerEl.firstChild);
  }
  // Show reply container, hide quote container (reply is default)
  replyContainerEl.style.display = 'block';
  quoteContainerEl.style.display = 'none';
  panelContainer.querySelector('.iap-error').style.display = 'none';
  panelContainer.querySelector('.iap-feedback-input').value = '';
}

/**
 * Hide panel
 */
function hidePanel() {
  if (panelContainer) {
    panelContainer.style.display = 'none';
  }
  currentTweetData = null;
  // Clear cached responses for both tabs
  cachedReplyResult = null;
  cachedQuoteResult = null;
}

/**
 * Reposition panel to stay within viewport bounds
 * Called after content changes that may affect panel size
 */
function repositionPanel() {
  if (!panelContainer || panelContainer.style.display === 'none') {
    return;
  }

  const rect = panelContainer.getBoundingClientRect();
  const margin = 10;

  let left = rect.left;
  let top = rect.top;

  // Adjust if going off right edge
  if (rect.right > window.innerWidth - margin) {
    left = window.innerWidth - rect.width - margin;
  }
  // Adjust if going off left edge
  if (left < margin) {
    left = margin;
  }
  // Adjust if going off bottom edge
  if (rect.bottom > window.innerHeight - margin) {
    top = window.innerHeight - rect.height - margin;
  }
  // Adjust if going off top edge
  if (top < margin) {
    top = margin;
  }

  panelContainer.style.left = `${left}px`;
  panelContainer.style.top = `${top}px`;
}

/**
 * Display loading state
 */
function showLoading() {
  if (panelContainer) {
    panelContainer.querySelector('.iap-loading').style.display = 'flex';
    panelContainer.querySelector('.iap-error').style.display = 'none';
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  if (panelContainer) {
    panelContainer.querySelector('.iap-loading').style.display = 'none';
  }
}

/**
 * Display error message
 * @param {string} message - Error message
 */
function showError(message) {
  if (panelContainer) {
    const errorEl = panelContainer.querySelector('.iap-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    hideLoading();
    repositionPanel();
  }
}

/**
 * Create response card element
 * @param {Object} response - Response object
 * @param {number} index - Response index
 * @param {string} responseType - 'reply' or 'quote' - determines which action button to show
 * @returns {Element} Response card element
 */
function createResponseCard(response, index, responseType) {
  const card = createElement('div', { className: 'iap-response-card' });

  const charCount = response.text.length;
  const charClass = charCount > 280 ? 'over' : charCount > 260 ? 'warn' : 'ok';

  // Header
  const header = createElement('div', { className: 'iap-response-header' }, [
    createElement('span', { className: 'iap-response-num', textContent: `#${index + 1}` }),
    createElement('span', {
      className: 'iap-response-tone',
      textContent: response.tone || 'Standard',
    }),
    createElement('span', {
      className: `iap-char-count ${charClass}`,
      textContent: `${charCount}/280`,
    }),
  ]);

  // Text content
  const textEl = createElement('div', {
    className: 'iap-response-text',
    textContent: response.text,
  });

  // Actions - Copy button always shown
  const copyBtn = createElement('button', {
    className: 'iap-action-btn iap-copy-btn',
    title: 'Copy to clipboard',
  });
  copyBtn.appendChild(createIcon('copy', '14px'));
  copyBtn.appendChild(document.createTextNode('Copy'));

  const actionButtons = [copyBtn];

  // Reply button - only shown in Reply tab
  if (responseType === 'reply') {
    const replyBtn = createElement('button', {
      className: 'iap-action-btn iap-reply-btn iap-suggested',
      title: 'Open reply',
    });
    replyBtn.appendChild(createIcon('reply', '14px'));
    replyBtn.appendChild(document.createTextNode('Reply'));

    // Reply button - opens Twitter reply intent
    replyBtn.addEventListener('click', () => {
      const tweetId = currentTweetData?.tweetId;
      if (tweetId) {
        const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodeURIComponent(response.text)}`;
        window.open(replyUrl, 'amplifier-intent', 'width=620,height=720,noopener,noreferrer');
        // Record amplification
        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'reply' });
        hidePanel();
      }
    });

    actionButtons.push(replyBtn);
  }

  // Quote button - only shown in Quote tab
  if (responseType === 'quote') {
    const quoteBtn = createElement('button', {
      className: 'iap-action-btn iap-quote-btn iap-suggested',
      title: 'Open quote',
    });
    quoteBtn.appendChild(createIcon('quote', '14px'));
    quoteBtn.appendChild(document.createTextNode('Quote'));

    // Quote button - opens Twitter intent with tweet URL in text (creates quote embed)
    quoteBtn.addEventListener('click', () => {
      const tweetUrl = currentTweetData?.url;
      if (tweetUrl) {
        // Include tweet URL in text - Twitter recognizes it and creates a quote embed
        const textWithUrl = `${response.text} ${tweetUrl}`;
        const quoteIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textWithUrl)}`;
        window.open(quoteIntentUrl, 'amplifier-intent', 'width=620,height=720,noopener,noreferrer');
        // Record amplification
        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'quote' });
        hidePanel();
      }
    });

    actionButtons.push(quoteBtn);
  }

  const actions = createElement('div', { className: 'iap-response-actions' }, actionButtons);

  card.appendChild(header);
  card.appendChild(textEl);
  card.appendChild(actions);

  // Copy button handler
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(response.text);
      // Record amplification
      browser.runtime.sendMessage({ type: 'recordAmplification', action: 'copy' });
      hidePanel();
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });

  return card;
}

/**
 * Display responses for a specific tab
 * @param {Object} result - The result with analysis and responses
 * @param {string} responseType - 'reply' or 'quote'
 * @param {number|null} elapsedMs - Time taken to generate responses in milliseconds
 */
function displayResponsesForTab(result, responseType, elapsedMs = null) {
  // Get the appropriate container for this tab
  const container = panelContainer.querySelector(
    responseType === 'reply' ? '.iap-replies-container' : '.iap-quotes-container'
  );
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Show analysis if available
  if (result.analysis) {
    const analysisEl = createElement('div', { className: 'iap-analysis' }, [
      createElement('span', {
        className: 'iap-analysis-label',
        textContent: 'Original post:',
      }),
      createElement('span', {
        className: `iap-sentiment ${result.analysis.post_sentiment}`,
        textContent: result.analysis.post_sentiment.replace(/_/g, ' ').toUpperCase(),
      }),
      createElement('span', {
        className: 'iap-approach',
        textContent: result.analysis.recommended_approach || '',
      }),
    ]);
    container.appendChild(analysisEl);
  }

  // Show timing and token usage if available
  if (elapsedMs || result.usage) {
    const formatTokens = (n) => {
      if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
      }
      if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'k';
      }
      return String(n);
    };

    const parts = [];
    if (result.usage) {
      const inTokens = result.usage.inputTokens || 0;
      const outTokens = result.usage.outputTokens || 0;
      const cachedTokens = result.usage.cachedTokens || 0;
      parts.push(`In: ${formatTokens(inTokens)}`);
      parts.push(`Out: ${formatTokens(outTokens)}`);
      if (cachedTokens > 0) {
        parts.push(`Cached: ${formatTokens(cachedTokens)}`);
      }
    }
    if (elapsedMs) {
      const seconds = (elapsedMs / 1000).toFixed(1);
      parts.push(`Time: ${seconds}s`);
    }
    if (result.retryCount > 0) {
      parts.push(`Retries: ${result.retryCount}`);
    }
    const timingEl = createElement('div', {
      className: 'iap-timing',
      textContent: parts.join(' | '),
    });
    container.appendChild(timingEl);
  }

  // Get responses (new format: result.responses)
  const responses = result.responses || [];

  // Show responses
  if (responses.length > 0) {
    responses.forEach((response, index) => {
      container.appendChild(createResponseCard(response, index, responseType));
    });
  } else {
    container.appendChild(
      createElement('div', {
        className: 'iap-no-results',
        textContent: 'No responses generated',
      })
    );
  }

  // Scroll to top of the container
  container.scrollTop = 0;

  // Reposition panel after content changes to stay within viewport
  repositionPanel();
}

/**
 * Display responses in panel
 * @param {Object} result - API result with analysis and responses
 * @param {number|null} elapsedMs - Time taken to generate responses in milliseconds
 */
function displayResponses(result, elapsedMs = null) {
  // Cache the result for this specific tab
  if (currentResponseType === 'reply') {
    cachedReplyResult = result;
  } else {
    cachedQuoteResult = result;
  }

  // Display using the tab-specific function
  displayResponsesForTab(result, currentResponseType, elapsedMs);
}

/**
 * Generate responses and display them
 * @param {string|null} feedback - Optional feedback for iteration
 * @param {boolean} forceRegenerate - Force new generation (skip cache)
 */
async function generateAndDisplay(feedback = null, forceRegenerate = false) {
  if (!currentTweetData) {
    return;
  }

  generationStartTime = Date.now();
  showLoading();

  try {
    const response = await browser.runtime.sendMessage({
      type: 'generate',
      tweetData: currentTweetData,
      responseType: currentResponseType,
      feedback,
      forceRegenerate,
    });

    hideLoading();

    if (response.success) {
      const elapsedMs = Date.now() - generationStartTime;
      displayResponses(response.data, elapsedMs);
    } else {
      showError(response.error || 'Generation failed');
    }
  } catch (error) {
    console.error('Generation error:', error);
    showError(error.message || 'Failed to communicate with extension');
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

  // Check if this is a new tweet
  const isNewTweet = currentTweetData?.tweetId !== tweetData.tweetId;

  // Clear cached responses when switching to a different tweet
  if (isNewTweet) {
    cachedReplyResult = null;
    cachedQuoteResult = null;
  }

  currentTweetData = tweetData;
  currentResponseType = 'reply';

  // Show panel near the button
  const rect = event.target.getBoundingClientRect();
  showPanel(rect.left, rect.bottom + 10);

  // Reset type selector
  if (panelContainer) {
    panelContainer.querySelectorAll('.iap-type-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.type === 'reply');
    });
  }

  // Bio extraction disabled - X's hover card API causes errors
  // TODO: Find alternative approach (e.g., profile page scrape or manual entry)
  // if (isNewTweet) {
  //   const bio = await extractAuthorBio(tweetElement);
  //   if (bio && currentTweetData?.author) {
  //     currentTweetData.author.bio = bio;
  //   }
  // }

  // Generate initial responses
  generateAndDisplay();
}

/**
 * Inject amplify button into a tweet
 * @param {Element} tweetElement - Tweet article element
 */
function injectButton(tweetElement) {
  // Check if button already injected
  if (tweetElement.querySelector('.iran-amplifier-btn')) {
    return;
  }

  // Find the action bar (contains reply, retweet, like buttons)
  const actionBar = tweetElement.querySelector('[role="group"]');
  if (!actionBar) {
    return;
  }

  // Create and inject button
  const button = createAmplifyButton();
  button.addEventListener('click', (e) => handleAmplifyClick(e, tweetElement));

  // Create wrapper to match Twitter's button styling
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
    // Look for tweet text in the dialog (the tweet being replied to or quoted)
    const tweetTextElements = dialogElement.querySelectorAll('[data-testid="tweetText"]');

    let textElement = null;
    let authorElement = null;
    let tweetUrl = '';
    let container = null;

    // Find the tweet text that's NOT in the compose area
    for (const el of tweetTextElements) {
      // Skip if it's inside the compose textarea
      if (el.closest('[data-testid="tweetTextarea_0"]')) {
        continue;
      }
      textElement = el;

      // Find author and URL near this text
      container =
        el.closest('div[data-testid="Tweet-User-Avatar"]')?.parentElement ||
        el.closest('article') ||
        el.parentElement?.parentElement?.parentElement;

      if (container) {
        // Look for author link
        const authorLinks = container.querySelectorAll('a[role="link"]');
        for (const link of authorLinks) {
          const href = link.getAttribute('href');
          if (href && href.startsWith('/') && !href.includes('/status/')) {
            authorElement = link;
            break;
          }
        }
        // Look for status link
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

    // Extract author info
    let authorHandle = '';
    let authorDisplayName = '';
    if (authorElement) {
      const href = authorElement.getAttribute('href');
      if (href) {
        authorHandle = href.slice(1);
      }
      // Try to get display name
      const nameSpan = authorElement.querySelector('span');
      if (nameSpan) {
        authorDisplayName = nameSpan.innerText;
      }
    }

    // Check for verified badge
    const userNameEl = container?.querySelector('[data-testid="User-Name"]');
    const isVerified = userNameEl
      ? !!userNameEl.querySelector('[data-testid="icon-verified"]')
      : false;

    // Extract tweet ID
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
 * Handle amplify button click in compose dialog - shows the panel
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

  // Clear cached responses when switching to a different tweet
  if (currentTweetData?.tweetId !== tweetData.tweetId) {
    cachedReplyResult = null;
    cachedQuoteResult = null;
  }

  currentTweetData = tweetData;
  currentResponseType = 'reply';

  // Show panel near the button
  const rect = event.target.getBoundingClientRect();
  showPanel(rect.left - 350, rect.top - 400);

  // Reset type selector
  if (panelContainer) {
    panelContainer.querySelectorAll('.iap-type-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.type === 'reply');
    });
  }

  // Generate initial responses
  generateAndDisplay();
}

/**
 * Inject amplify button into compose dialog toolbar
 * @param {Element} dialogElement - The compose dialog element
 */
function injectComposeButton(dialogElement) {
  // Check if already injected
  if (dialogElement.querySelector('.iran-amplifier-toolbar-btn')) {
    return;
  }

  // Check if this dialog has a tweet to respond to
  const hasTweet = !!dialogElement.querySelector('[data-testid="tweetText"]');
  if (!hasTweet) {
    return;
  }

  // Find the Post/Reply button using stable data-testid
  const postButton = dialogElement.querySelector(
    '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
  );

  if (postButton) {
    const postParent = postButton.parentElement;
    if (!postParent || !postParent.parentElement) {
      return;
    }

    // Create our button
    const button = createToolbarAmplifyButton();
    button.addEventListener('click', (e) => handleComposeAmplifyClick(e, dialogElement));

    // Create wrapper with same classes as post button's parent for alignment
    const wrapper = document.createElement('div');
    wrapper.className = postParent.className + ' iran-amplifier-toolbar-wrapper';
    wrapper.appendChild(button);

    // Insert before post button's parent
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
// ONBOARDING MODAL FUNCTIONALITY
// ============================================

/**
 * Create a question section for the onboarding modal
 * @param {string} name - Input name attribute
 * @param {string} label - Question label
 * @param {Array} options - Array of { id, label } options
 * @param {string} defaultValue - Default selected value
 * @returns {Element} Question section element
 */
function createQuestionSection(name, label, options, defaultValue) {
  const section = createElement('div', { className: 'iap-onboard-question' });
  const labelEl = createElement('label', { className: 'iap-onboard-label', textContent: label });
  section.appendChild(labelEl);

  const optionsContainer = createElement('div', { className: 'iap-onboard-options' });
  options.forEach((opt) => {
    const optionEl = createElement('label', { className: 'iap-onboard-option' }, [
      createElement('input', {
        type: 'radio',
        name: name,
        value: opt.id,
        ...(opt.id === defaultValue ? { checked: 'checked' } : {}),
      }),
      createElement('span', { textContent: opt.label }),
    ]);
    // Set checked attribute properly
    if (opt.id === defaultValue) {
      optionEl.querySelector('input').checked = true;
    }
    optionsContainer.appendChild(optionEl);
  });

  section.appendChild(optionsContainer);
  return section;
}

/**
 * Create the onboarding modal
 * @param {Object} savedPreferences - Already saved preferences to pre-select
 * @returns {Element} Modal element
 */
function createOnboardingModal(savedPreferences = {}) {
  const overlay = createElement('div', { className: 'iap-onboard-overlay' });
  const modal = createElement('div', { className: 'iap-onboard-modal' });

  // Header
  const flagIcon = createFlagIcon('48px');
  flagIcon.className = 'iap-onboard-icon';

  const header = createElement('div', { className: 'iap-onboard-header' }, [
    flagIcon,
    createElement('h2', { textContent: 'Personalize Your Voice' }),
    createElement('p', {
      textContent:
        'Help us generate unique responses that match your style. You can change these later in settings.',
    }),
  ]);

  // Use saved preferences or fall back to defaults
  const voiceStyle = savedPreferences.voiceStyle || 'personal';
  const background = savedPreferences.background || 'other';
  const approach = savedPreferences.approach || 'mixed';
  const length = savedPreferences.length || 'medium';

  // Questions container
  const questions = createElement('div', { className: 'iap-onboard-questions' });
  questions.appendChild(
    createQuestionSection(
      'voiceStyle',
      'How do you prefer to communicate?',
      VOICE_STYLES,
      voiceStyle
    )
  );
  questions.appendChild(
    createQuestionSection('background', "What's your background?", BACKGROUNDS, background)
  );
  questions.appendChild(
    createQuestionSection('approach', 'What resonates with you?', APPROACHES, approach)
  );
  questions.appendChild(
    createQuestionSection('length', 'Preferred response length?', LENGTHS, length)
  );

  // Actions
  const actions = createElement('div', { className: 'iap-onboard-actions' }, [
    createElement('button', { className: 'iap-onboard-skip', textContent: 'Skip for now' }),
    createElement('button', { className: 'iap-onboard-save', textContent: 'Save Preferences' }),
  ]);

  modal.appendChild(header);
  modal.appendChild(questions);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  // Event listeners
  actions.querySelector('.iap-onboard-skip').addEventListener('click', () => {
    hideOnboardingModal();
    completeOnboardingRemote();
  });

  actions.querySelector('.iap-onboard-save').addEventListener('click', () => {
    saveOnboardingPreferences();
  });

  return overlay;
}

/**
 * Show the onboarding modal
 * Fetches saved preferences first to pre-select them
 */
async function showOnboardingModal() {
  if (!onboardingModal) {
    // Fetch any already-saved preferences
    let savedPreferences = {};
    try {
      const response = await browser.runtime.sendMessage({ type: 'getUserPreferences' });
      if (response.success && response.data?.preferences) {
        savedPreferences = response.data.preferences;
      }
    } catch (error) {
      console.error('Failed to fetch saved preferences:', error);
    }

    onboardingModal = createOnboardingModal(savedPreferences);
    document.body.appendChild(onboardingModal);
  }
  onboardingModal.style.display = 'flex';
}

/**
 * Hide the onboarding modal
 */
function hideOnboardingModal() {
  if (onboardingModal) {
    onboardingModal.style.display = 'none';
  }
}

/**
 * Mark onboarding complete via background script
 */
async function completeOnboardingRemote() {
  try {
    await browser.runtime.sendMessage({ type: 'completeOnboarding' });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
  }
}

/**
 * Save onboarding preferences
 */
async function saveOnboardingPreferences() {
  if (!onboardingModal) {
    return;
  }

  const preferences = {
    voiceStyle:
      onboardingModal.querySelector('input[name="voiceStyle"]:checked')?.value || 'personal',
    background: onboardingModal.querySelector('input[name="background"]:checked')?.value || 'other',
    approach: onboardingModal.querySelector('input[name="approach"]:checked')?.value || 'mixed',
    length: onboardingModal.querySelector('input[name="length"]:checked')?.value || 'medium',
  };

  try {
    await browser.runtime.sendMessage({ type: 'saveUserPreferences', preferences });
    await completeOnboardingRemote();
    hideOnboardingModal();
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

/**
 * Check if onboarding should be shown
 */
async function checkOnboarding() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'isOnboardingComplete' });
    if (response.success && !response.data) {
      // Small delay to ensure page is loaded, then show modal with saved preferences
      setTimeout(() => {
        showOnboardingModal().catch((err) => console.error('Failed to show onboarding:', err));
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
  }
}

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

// Check if onboarding should be shown
checkOnboarding();

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  if (
    panelContainer &&
    panelContainer.style.display !== 'none' &&
    !panelContainer.contains(e.target) &&
    !e.target.closest('.iran-amplifier-btn')
  ) {
    hidePanel();
  }
});

// Close panel on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hidePanel();
  }
});

console.log('Iran Amplifier content script loaded');
