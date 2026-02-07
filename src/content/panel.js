/**
 * Panel Alpine component for Iran Amplifier extension.
 * Manages the response panel UI reactively.
 */

import { createFlagIcon, createIcon } from './icons.js';

/**
 * Find the tweet article element on the page by tweet ID
 * @param {string} tweetId - The tweet ID to find
 * @returns {Element|null} The tweet article element or null
 */
function findTweetElement(tweetId) {
  if (!tweetId) {
    return null;
  }
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  for (const article of articles) {
    const link = article.querySelector(`a[href*="/status/${tweetId}"]`);
    if (link) {
      return article;
    }
  }
  return null;
}

/**
 * Wait for a new element matching a selector, ignoring pre-existing ones.
 * @param {string} selector - CSS selector to match
 * @param {Element} parent - Parent element to observe
 * @param {number} timeoutMs - Maximum wait time in milliseconds
 * @param {Set<Element>} [exclude] - Elements already present to skip
 * @returns {Promise<Element|null>} The new element or null on timeout
 */
function waitForElement(selector, parent, timeoutMs, exclude = new Set()) {
  return new Promise((resolve) => {
    const findNew = () => {
      for (const el of parent.querySelectorAll(selector)) {
        if (!exclude.has(el)) {
          return el;
        }
      }
      return null;
    };

    const found = findNew();
    if (found) {
      resolve(found);
      return;
    }

    let resolved = false;
    const observer = new MutationObserver(() => {
      const el = findNew();
      if (el && !resolved) {
        resolved = true;
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(parent, { childList: true, subtree: true });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve(null);
      }
    }, timeoutMs);
  });
}

/**
 * Insert text into X/Twitter's rich text editor (DraftJS-based).
 * The tweetTextarea_0 wrapper contains a contenteditable div with
 * <br data-text="true"> when empty, replaced by <span data-text="true">
 * when text is present.
 * @param {Element} editorElement - The tweetTextarea_0 wrapper or contenteditable element
 * @param {string} text - Text to insert
 * @returns {boolean} Whether insertion succeeded
 */
function insertTextIntoEditor(editorElement, text) {
  try {
    // Find the actual contenteditable element inside the wrapper
    const editable = editorElement.querySelector('[contenteditable="true"]') || editorElement;

    editable.focus();

    // 1. Primary: simulate paste via ClipboardEvent
    //    DraftJS handles paste as a single atomic operation via handlePastedText,
    //    which avoids the per-character hashtag decorator duplication that
    //    execCommand('insertText') triggers.
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData,
      bubbles: true,
      cancelable: true,
    });
    editable.dispatchEvent(pasteEvent);
    if (editable.textContent.includes(text)) {
      return true;
    }

    // 2. Fallback: execCommand insertText (for editors that don't handle paste events)
    document.execCommand('selectAll', false, null);
    const success = document.execCommand('insertText', false, text);
    if (success && editable.textContent.includes(text)) {
      return true;
    }

    // 3. Last resort: InputEvent paste simulation
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    editable.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        data: text,
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      })
    );

    return editable.textContent.includes(text);
  } catch (_err) {
    return false;
  }
}

/**
 * Dismiss the currently open X/Twitter dialog (reply/quote compose).
 * Sends Escape to let the platform close it cleanly.
 */
function dismissOpenDialog() {
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
}

/**
 * Alpine component data for the amplifier panel
 * @returns {Object} Alpine component data
 */
export function amplifierPanelComponent() {
  return {
    // Visibility state
    isVisible: false,
    isLoading: false,
    error: null,

    // Current tab and data
    currentTab: 'reply',
    tweetData: null,

    // Cached results per tab
    cachedReplyResult: null,
    cachedQuoteResult: null,

    // Feedback input
    feedbackText: '',

    // Timing
    generationStartTime: null,

    /**
     * Get the current result based on active tab
     */
    get currentResult() {
      return this.currentTab === 'reply' ? this.cachedReplyResult : this.cachedQuoteResult;
    },

    /**
     * Get responses from current result
     */
    get responses() {
      return this.currentResult?.responses || [];
    },

    /**
     * Get analysis from current result
     */
    get analysis() {
      return this.currentResult?.analysis || null;
    },

    /**
     * Format sentiment text for display (replace underscores with spaces, uppercase)
     * @returns {string} Formatted sentiment
     */
    get formattedSentiment() {
      const sentiment = this.analysis?.post_sentiment || '';
      return sentiment.replace(/_/g, ' ').toUpperCase();
    },

    /**
     * Get usage stats formatted
     */
    get usageStats() {
      if (!this.currentResult) {
        return null;
      }

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
      const usage = this.currentResult.usage;
      const elapsedMs = this.currentResult.elapsedMs;

      if (usage) {
        const inTokens = usage.inputTokens || 0;
        const outTokens = usage.outputTokens || 0;
        const cachedTokens = usage.cachedTokens || 0;
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
      if (this.currentResult.retryCount > 0) {
        parts.push(`Retries: ${this.currentResult.retryCount}`);
      }

      return parts.length > 0 ? parts.join(' | ') : null;
    },

    /**
     * Show the panel at specified position with tweet data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} newTweetData - Tweet data to display
     */
    show(x, y, newTweetData) {
      // Check if this is a new tweet
      const isNewTweet = this.tweetData?.tweetId !== newTweetData.tweetId;

      // Clear cached responses when switching to a different tweet
      if (isNewTweet) {
        this.cachedReplyResult = null;
        this.cachedQuoteResult = null;
      }

      this.tweetData = newTweetData;
      this.currentTab = 'reply';
      this.error = null;
      this.feedbackText = '';
      this.isVisible = true;

      // Position panel with viewport bounds checking
      this.$nextTick(() => {
        this.position(x, y);
        // Generate initial responses
        this.generate();
      });
    },

    /**
     * Position the panel at coordinates, clamping to viewport
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    position(x, y) {
      const panel = this.$el;
      const panelWidth = 400;
      const panelHeight = Math.min(500, window.innerHeight * 0.8);
      const margin = 10;

      const left = Math.max(margin, Math.min(x, window.innerWidth - panelWidth - margin));
      const top = Math.max(margin, Math.min(y, window.innerHeight - panelHeight - margin));

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    },

    /**
     * Reposition panel to stay within viewport bounds
     */
    reposition() {
      if (!this.isVisible) {
        return;
      }

      const panel = this.$el;
      const rect = panel.getBoundingClientRect();
      const margin = 10;

      let left = rect.left;
      let top = rect.top;

      if (rect.right > window.innerWidth - margin) {
        left = window.innerWidth - rect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }
      if (rect.bottom > window.innerHeight - margin) {
        top = window.innerHeight - rect.height - margin;
      }
      if (top < margin) {
        top = margin;
      }

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    },

    /**
     * Hide the panel
     */
    hide() {
      this.isVisible = false;
      this.tweetData = null;
      this.cachedReplyResult = null;
      this.cachedQuoteResult = null;
    },

    /**
     * Switch to a different tab
     * @param {string} tab - 'reply' or 'quote'
     */
    switchTab(tab) {
      if (this.currentTab === tab) {
        return;
      }

      this.currentTab = tab;

      // Generate on-demand if no cached result
      if (!this.currentResult && this.tweetData) {
        this.generate();
      } else {
        this.$nextTick(() => this.reposition());
      }
    },

    /**
     * Generate responses for current tab
     * @param {string|null} feedback - Optional feedback for refinement
     * @param {boolean} forceRegenerate - Force new generation
     */
    async generate(feedback = null, forceRegenerate = false) {
      if (!this.tweetData) {
        return;
      }

      // Capture the response type at the start
      const requestedTab = this.currentTab;

      this.generationStartTime = Date.now();
      this.isLoading = true;
      this.error = null;

      try {
        // Clone tweetData to plain object (Alpine Proxies can't be cloned for messaging)
        const tweetDataPlain = JSON.parse(JSON.stringify(this.tweetData));
        const response = await browser.runtime.sendMessage({
          type: 'generate',
          tweetData: tweetDataPlain,
          responseType: requestedTab,
          feedback,
          forceRegenerate,
        });

        if (response.success) {
          const elapsedMs = Date.now() - this.generationStartTime;
          const result = { ...response.data, elapsedMs };

          // Cache the result for the tab that was requested
          if (requestedTab === 'reply') {
            this.cachedReplyResult = result;
          } else {
            this.cachedQuoteResult = result;
          }

          this.$nextTick(() => this.reposition());
        } else {
          // Only show error if still on the same tab
          if (this.currentTab === requestedTab) {
            this.error = response.error || 'Generation failed';
          }
        }
      } catch (err) {
        console.error('Generation error:', err);
        if (this.currentTab === requestedTab) {
          this.error = err.message || 'Failed to communicate with extension';
        }
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Handle refresh/regenerate button click
     */
    handleRefresh() {
      const feedback = this.feedbackText.trim();
      this.feedbackText = '';
      this.generate(feedback || null, !feedback);
    },

    /**
     * Handle feedback input keypress
     * @param {KeyboardEvent} event
     */
    handleFeedbackKeypress(event) {
      if (event.key === 'Enter') {
        this.handleRefresh();
      }
    },

    /**
     * Copy response text to clipboard
     * @param {Object} response - Response object
     */
    async copyResponse(response) {
      try {
        await navigator.clipboard.writeText(response.text);
        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'copy' });
        this.hide();
      } catch (err) {
        console.error('Copy failed:', err);
      }
    },

    /**
     * Open reply via Web Intent (fallback)
     * @param {Object} response - Response object
     */
    openReplyViaIntent(response) {
      const tweetId = this.tweetData?.tweetId;
      if (tweetId) {
        const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodeURIComponent(response.text)}`;
        window.open(replyUrl, 'amplifier-intent', 'width=620,height=720,noopener,noreferrer');
        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'reply' });
        this.hide();
      }
    },

    /**
     * Open quote via Web Intent (fallback)
     * @param {Object} response - Response object
     */
    openQuoteViaIntent(response) {
      const tweetUrl = this.tweetData?.url;
      if (tweetUrl) {
        const quoteIntentUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(tweetUrl)}&text=${encodeURIComponent(response.text)}`;
        window.open(quoteIntentUrl, 'amplifier-intent', 'width=620,height=720,noopener,noreferrer');
        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'quote' });
        this.hide();
      }
    },

    /**
     * Open reply using native X/Twitter dialog, falling back to Web Intent
     * @param {Object} response - Response object
     */
    async openReply(response) {
      try {
        const tweetEl = findTweetElement(this.tweetData?.tweetId);
        if (!tweetEl) {
          this.openReplyViaIntent(response);
          return;
        }

        const replyBtn = tweetEl.querySelector('[data-testid="reply"]');
        if (!replyBtn) {
          this.openReplyViaIntent(response);
          return;
        }

        // Snapshot existing textareas so we wait for the NEW dialog one
        const existingEditors = new Set(
          document.body.querySelectorAll('[data-testid="tweetTextarea_0"]')
        );

        replyBtn.click();

        const editor = await waitForElement(
          '[data-testid="tweetTextarea_0"]',
          document.body,
          2000,
          existingEditors
        );
        if (!editor) {
          this.openReplyViaIntent(response);
          return;
        }

        const inserted = insertTextIntoEditor(editor, response.text);
        if (!inserted) {
          // Close the dialog before falling back to intent
          dismissOpenDialog();
          this.openReplyViaIntent(response);
          return;
        }

        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'reply' });
        this.hide();
      } catch (_err) {
        this.openReplyViaIntent(response);
      }
    },

    /**
     * Open quote using native X/Twitter dialog, falling back to Web Intent
     * @param {Object} response - Response object
     */
    async openQuote(response) {
      try {
        const tweetEl = findTweetElement(this.tweetData?.tweetId);
        if (!tweetEl) {
          this.openQuoteViaIntent(response);
          return;
        }

        const repostBtn =
          tweetEl.querySelector('[data-testid="retweet"]') ||
          tweetEl.querySelector('[data-testid="unretweet"]');
        if (!repostBtn) {
          this.openQuoteViaIntent(response);
          return;
        }

        repostBtn.click();

        const dropdown = await waitForElement('[data-testid="Dropdown"]', document.body, 2000);
        if (!dropdown) {
          this.openQuoteViaIntent(response);
          return;
        }

        const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
        let quoteItem = null;
        for (const item of menuItems) {
          const text = item.textContent.toLowerCase();
          if (text.includes('quote')) {
            quoteItem = item;
            break;
          }
        }

        if (!quoteItem) {
          // Close dropdown before falling back
          document.body.click();
          this.openQuoteViaIntent(response);
          return;
        }

        // Snapshot existing textareas so we wait for the NEW dialog one
        const existingEditors = new Set(
          document.body.querySelectorAll('[data-testid="tweetTextarea_0"]')
        );

        quoteItem.click();

        const editor = await waitForElement(
          '[data-testid="tweetTextarea_0"]',
          document.body,
          2000,
          existingEditors
        );
        if (!editor) {
          dismissOpenDialog();
          this.openQuoteViaIntent(response);
          return;
        }

        const inserted = insertTextIntoEditor(editor, response.text);
        if (!inserted) {
          // Close the dialog before falling back to intent
          dismissOpenDialog();
          this.openQuoteViaIntent(response);
          return;
        }

        browser.runtime.sendMessage({ type: 'recordAmplification', action: 'quote' });
        this.hide();
      } catch (_err) {
        this.openQuoteViaIntent(response);
      }
    },

    /**
     * Get character count class for a response
     * @param {Object} response - Response object
     * @returns {string} CSS class
     */
    getCharCountClass(response) {
      const count = response.text.length;
      if (count > 280) {
        return 'over';
      }
      if (count > 260) {
        return 'warn';
      }
      return 'ok';
    },
  };
}

/**
 * Helper to create element with attributes
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes object
 * @param {Array} children - Child elements
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (let [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else {
      // Convert Alpine shorthand to long-form (@ and : are invalid for setAttribute)
      if (key.startsWith('@')) {
        key = 'x-on:' + key.slice(1);
      } else if (key.startsWith(':')) {
        key = 'x-bind:' + key.slice(1);
      }
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * Create the panel DOM element with Alpine directives
 * Uses safe DOM construction methods (no innerHTML)
 * @returns {HTMLElement} Panel element
 */
export function createPanelElement() {
  const panel = el('div', {
    className: 'iran-amplifier-panel',
    'x-data': 'amplifierPanel',
    'x-show': 'isVisible',
    'x-cloak': '',
    '@keydown.escape.window': 'hide()',
  });

  // Header
  const headerTitle = el('span', { className: 'iap-title' }, [' Iran Amplifier']);
  headerTitle.prepend(createFlagIcon('18px'));

  const closeBtn = el('button', {
    className: 'iap-close',
    title: 'Close',
    'aria-label': 'Close panel',
    '@click': 'hide()',
    textContent: '×',
  });

  const header = el('div', { className: 'iap-header' }, [headerTitle, closeBtn]);

  // Type selector
  const replyBtn = el('button', {
    className: 'iap-type-btn',
    ':class': "{ 'active': currentTab === 'reply' }",
    '@click': "switchTab('reply')",
    textContent: 'Reply',
  });
  const quoteBtn = el('button', {
    className: 'iap-type-btn',
    ':class': "{ 'active': currentTab === 'quote' }",
    '@click': "switchTab('quote')",
    textContent: 'Quote',
  });
  const typeSelector = el('div', { className: 'iap-type-selector' }, [replyBtn, quoteBtn]);

  // Content area
  const content = el('div', { className: 'iap-content' });

  // Loading state
  const loading = el('div', { className: 'iap-loading', 'x-show': 'isLoading' }, [
    el('div', { className: 'iap-spinner' }),
    el('span', { textContent: 'Generating responses...' }),
  ]);

  // Error state
  const error = el('div', {
    className: 'iap-error',
    'x-show': 'error',
    'x-text': 'error',
  });

  // Responses container
  const responsesContainer = el('div', {
    className: 'iap-responses',
    'x-show': '!isLoading && !error && responses.length > 0',
  });

  // Analysis template
  const analysisTemplate = document.createElement('template');
  analysisTemplate.setAttribute('x-if', 'analysis');
  const analysisDiv = el('div', { className: 'iap-analysis' }, [
    el('span', { className: 'iap-analysis-label', textContent: 'Original post:' }),
    el('span', {
      className: 'iap-sentiment',
      ':class': 'analysis.post_sentiment',
      'x-text': 'formattedSentiment',
    }),
    el('span', {
      className: 'iap-approach',
      'x-text': "analysis.recommended_approach || ''",
    }),
  ]);
  analysisTemplate.content.appendChild(analysisDiv);

  // Usage stats template
  const statsTemplate = document.createElement('template');
  statsTemplate.setAttribute('x-if', 'usageStats');
  statsTemplate.content.appendChild(el('div', { className: 'iap-timing', 'x-text': 'usageStats' }));

  // Response cards template (x-for)
  const cardsTemplate = document.createElement('template');
  cardsTemplate.setAttribute('x-for', '(response, index) in responses');
  cardsTemplate.setAttribute('x-bind:key', 'index');

  const card = el('div', { className: 'iap-response-card' });

  // Card header
  const cardHeader = el('div', { className: 'iap-response-header' }, [
    el('span', { className: 'iap-response-num', 'x-text': "'#' + (index + 1)" }),
    el('span', { className: 'iap-response-tone', 'x-text': "response.tone || 'Standard'" }),
    el('span', {
      className: 'iap-char-count',
      ':class': 'getCharCountClass(response)',
      'x-text': "response.text.length + '/280'",
    }),
  ]);

  // Card text
  const cardText = el('div', { className: 'iap-response-text', 'x-text': 'response.text' });

  // Card actions
  const cardActions = el('div', { className: 'iap-response-actions' });

  // Copy button
  const copyBtn = el('button', {
    className: 'iap-action-btn iap-copy-btn',
    title: 'Copy to clipboard',
    '@click': 'copyResponse(response)',
  });
  copyBtn.appendChild(createIcon('copy', '14px'));
  copyBtn.appendChild(document.createTextNode('Copy'));

  // Reply button template
  const replyBtnTemplate = document.createElement('template');
  replyBtnTemplate.setAttribute('x-if', "currentTab === 'reply'");
  const replyActionBtn = el('button', {
    className: 'iap-action-btn iap-reply-btn iap-suggested',
    title: 'Open reply',
    '@click': 'openReply(response)',
  });
  replyActionBtn.appendChild(createIcon('reply', '14px'));
  replyActionBtn.appendChild(document.createTextNode('Reply'));
  replyBtnTemplate.content.appendChild(replyActionBtn);

  // Quote button template
  const quoteBtnTemplate = document.createElement('template');
  quoteBtnTemplate.setAttribute('x-if', "currentTab === 'quote'");
  const quoteActionBtn = el('button', {
    className: 'iap-action-btn iap-quote-btn iap-suggested',
    title: 'Open quote',
    '@click': 'openQuote(response)',
  });
  quoteActionBtn.appendChild(createIcon('quote', '14px'));
  quoteActionBtn.appendChild(document.createTextNode('Quote'));
  quoteBtnTemplate.content.appendChild(quoteActionBtn);

  cardActions.appendChild(copyBtn);
  cardActions.appendChild(replyBtnTemplate);
  cardActions.appendChild(quoteBtnTemplate);

  card.appendChild(cardHeader);
  card.appendChild(cardText);
  card.appendChild(cardActions);
  cardsTemplate.content.appendChild(card);

  // No results template
  const noResultsTemplate = document.createElement('template');
  noResultsTemplate.setAttribute(
    'x-if',
    '!isLoading && !error && responses.length === 0 && currentResult'
  );
  noResultsTemplate.content.appendChild(
    el('div', { className: 'iap-no-results', textContent: 'No responses generated' })
  );

  responsesContainer.appendChild(analysisTemplate);
  responsesContainer.appendChild(statsTemplate);
  responsesContainer.appendChild(cardsTemplate);
  responsesContainer.appendChild(noResultsTemplate);

  content.appendChild(loading);
  content.appendChild(error);
  content.appendChild(responsesContainer);

  // Feedback area
  const feedbackInput = el('input', {
    type: 'text',
    className: 'iap-feedback-input',
    placeholder: 'Refine with a prompt...',
    'x-model': 'feedbackText',
    '@keypress': 'handleFeedbackKeypress($event)',
  });

  const refreshBtn = el('button', {
    className: 'iap-feedback-btn',
    title: 'Regenerate',
    'aria-label': 'Regenerate responses',
    '@click': 'handleRefresh()',
  });
  refreshBtn.appendChild(createIcon('refresh', '16px'));

  const feedback = el('div', { className: 'iap-feedback' }, [feedbackInput, refreshBtn]);

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(typeSelector);
  panel.appendChild(content);
  panel.appendChild(feedback);

  return panel;
}
