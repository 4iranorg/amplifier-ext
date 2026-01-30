/**
 * Onboarding Alpine component for Iran Amplifier extension.
 * Manages the first-run preferences modal.
 */

import { createFlagIcon } from './icons.js';

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
 * Alpine component data for the onboarding modal
 * @returns {Object} Alpine component data
 */
export function onboardingModalComponent() {
  return {
    isVisible: false,

    // Preferences (will be loaded from storage or set to defaults)
    voiceStyle: 'personal',
    background: 'other',
    approach: 'mixed',
    length: 'medium',

    // Options for display
    voiceStyles: VOICE_STYLES,
    backgrounds: BACKGROUNDS,
    approaches: APPROACHES,
    lengths: LENGTHS,

    /**
     * Initialize and show the modal
     */
    async init() {
      // Load saved preferences if any
      try {
        const response = await browser.runtime.sendMessage({ type: 'getUserPreferences' });
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences;
          this.voiceStyle = prefs.voiceStyle || 'personal';
          this.background = prefs.background || 'other';
          this.approach = prefs.approach || 'mixed';
          this.length = prefs.length || 'medium';
        }
      } catch (error) {
        console.error('Failed to fetch saved preferences:', error);
      }
    },

    /**
     * Show the modal
     */
    show() {
      this.isVisible = true;
    },

    /**
     * Hide the modal
     */
    hide() {
      this.isVisible = false;
    },

    /**
     * Skip onboarding (use defaults)
     */
    async skip() {
      this.hide();
      await this.completeOnboarding();
    },

    /**
     * Save preferences and complete onboarding
     */
    async save() {
      const preferences = {
        voiceStyle: this.voiceStyle,
        background: this.background,
        approach: this.approach,
        length: this.length,
      };

      try {
        await browser.runtime.sendMessage({ type: 'saveUserPreferences', preferences });
        await this.completeOnboarding();
        this.hide();
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    },

    /**
     * Mark onboarding as complete
     */
    async completeOnboarding() {
      try {
        await browser.runtime.sendMessage({ type: 'completeOnboarding' });
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      }
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
 * Create a question section with radio buttons
 * @param {string} name - Input name
 * @param {string} label - Question label
 * @param {string} model - Alpine model binding
 * @param {string} optionsVar - Options variable name
 * @returns {HTMLElement}
 */
function createQuestionSection(name, label, model, optionsVar) {
  const section = el('div', { className: 'iap-onboard-question' });
  section.appendChild(el('label', { className: 'iap-onboard-label', textContent: label }));

  const optionsContainer = el('div', { className: 'iap-onboard-options' });

  // Use x-for template for options
  const optionTemplate = document.createElement('template');
  optionTemplate.setAttribute('x-for', `opt in ${optionsVar}`);
  optionTemplate.setAttribute('x-bind:key', 'opt.id');

  const optionLabel = el('label', { className: 'iap-onboard-option' });
  const radio = el('input', {
    type: 'radio',
    name: name,
    ':value': 'opt.id',
    'x-model': model,
  });
  const span = el('span', { 'x-text': 'opt.label' });

  optionLabel.appendChild(radio);
  optionLabel.appendChild(span);
  optionTemplate.content.appendChild(optionLabel);

  optionsContainer.appendChild(optionTemplate);
  section.appendChild(optionsContainer);

  return section;
}

/**
 * Create the onboarding modal DOM element with Alpine directives
 * @returns {HTMLElement} Modal overlay element
 */
export function createOnboardingElement() {
  const overlay = el('div', {
    className: 'iap-onboard-overlay',
    'x-data': 'onboardingModal',
    'x-show': 'isVisible',
    'x-cloak': '',
    'x-init': 'init()',
  });

  const modal = el('div', { className: 'iap-onboard-modal' });

  // Header
  const flagIcon = createFlagIcon('48px');
  flagIcon.className = 'iap-onboard-icon';

  const header = el('div', { className: 'iap-onboard-header' }, [
    flagIcon,
    el('h2', { textContent: 'Personalize Your Voice' }),
    el('p', {
      textContent:
        'Help us generate unique responses that match your style. You can change these later in settings.',
    }),
  ]);

  // Questions container
  const questions = el('div', { className: 'iap-onboard-questions' }, [
    createQuestionSection(
      'voiceStyle',
      'How do you prefer to communicate?',
      'voiceStyle',
      'voiceStyles'
    ),
    createQuestionSection('background', "What's your background?", 'background', 'backgrounds'),
    createQuestionSection('approach', 'What resonates with you?', 'approach', 'approaches'),
    createQuestionSection('length', 'Preferred response length?', 'length', 'lengths'),
  ]);

  // Actions
  const actions = el('div', { className: 'iap-onboard-actions' }, [
    el('button', {
      className: 'iap-onboard-skip',
      textContent: 'Skip for now',
      '@click': 'skip()',
    }),
    el('button', {
      className: 'iap-onboard-save',
      textContent: 'Save Preferences',
      '@click': 'save()',
    }),
  ]);

  modal.appendChild(header);
  modal.appendChild(questions);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  return overlay;
}

/**
 * Check if onboarding should be shown and show modal if needed
 * @param {Object} Alpine - Alpine instance
 * @param {HTMLElement} onboardingEl - Onboarding element
 */
export async function checkAndShowOnboarding(Alpine, onboardingEl) {
  try {
    const response = await browser.runtime.sendMessage({ type: 'isOnboardingComplete' });
    if (response.success && !response.data) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        const data = Alpine.$data(onboardingEl);
        if (data) {
          data.show();
        }
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
  }
}
