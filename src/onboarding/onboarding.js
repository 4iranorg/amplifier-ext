/**
 * Onboarding script for Iran Amplifier extension.
 * Multi-step flow: Privacy -> Arguments -> CTAs -> API Key
 */

import { getAvailableModels, AVAILABLE_MODELS } from '../lib/api.js';

// State
let currentStep = 1;
const totalSteps = 4;
let selectedArguments = [];
let selectedCTAs = [];
let allArguments = [];
let allCTAs = [];

// DOM Elements
const progressSteps = document.querySelectorAll('.progress-step');
const stepContents = document.querySelectorAll('.step-content');
const btnBack = document.getElementById('btn-back');
const btnContinue = document.getElementById('btn-continue');

// Step 1 elements
const privacyConsent = document.getElementById('privacy-consent');

// Step 2 elements
const argumentsGrid = document.getElementById('arguments-grid');
const selectAllArgs = document.getElementById('select-all-args');
const deselectAllArgs = document.getElementById('deselect-all-args');

// Step 3 elements
const ctasGrid = document.getElementById('ctas-grid');
const selectAllCTAs = document.getElementById('select-all-ctas');
const deselectAllCTAs = document.getElementById('deselect-all-ctas');

// Step 4 elements
const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('api-key');
const toggleKeyBtn = document.getElementById('toggle-key');
const modelSelect = document.getElementById('model');

/**
 * Update progress indicator
 */
function updateProgress() {
  progressSteps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.toggle('active', stepNum <= currentStep);
    step.classList.toggle('completed', stepNum < currentStep);
  });
}

/**
 * Show the current step
 */
function showStep(step) {
  stepContents.forEach((content, index) => {
    content.classList.toggle('hidden', index + 1 !== step);
  });

  // Update back button visibility
  btnBack.style.visibility = step === 1 ? 'hidden' : 'visible';

  // Update continue button text
  if (step === totalSteps) {
    btnContinue.textContent = 'Get Started';
  } else {
    btnContinue.textContent = 'Continue';
  }

  // Check if continue should be enabled
  validateStep(step);
}

/**
 * Validate current step and enable/disable continue button
 */
function validateStep(step) {
  let isValid = false;

  switch (step) {
    case 1:
      isValid = privacyConsent.checked;
      break;
    case 2:
      // Arguments are optional, always valid
      isValid = true;
      break;
    case 3:
      // CTAs are optional, always valid
      isValid = true;
      break;
    case 4:
      // API key is optional, always valid
      isValid = true;
      break;
  }

  btnContinue.disabled = !isValid;
}

/**
 * Create argument checkbox item
 */
function createArgumentItem(arg) {
  const label = document.createElement('label');
  label.className = `selection-item ${arg.type === 'exclude' ? 'exclude' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = arg.id;
  checkbox.checked = selectedArguments.includes(arg.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedArguments.push(arg.id);
    } else {
      selectedArguments = selectedArguments.filter((id) => id !== arg.id);
    }
  });

  const content = document.createElement('div');
  content.className = 'item-content';

  const title = document.createElement('span');
  title.className = 'item-title';
  title.textContent = arg.title;
  if (arg.type === 'exclude') {
    const badge = document.createElement('span');
    badge.className = 'exclude-badge';
    badge.textContent = 'Exclude';
    title.appendChild(badge);
  }

  const desc = document.createElement('span');
  desc.className = 'item-description';
  desc.textContent = arg.description;

  content.appendChild(title);
  content.appendChild(desc);
  label.appendChild(checkbox);
  label.appendChild(content);

  return label;
}

/**
 * Create CTA checkbox item
 */
function createCTAItem(cta) {
  const label = document.createElement('label');
  label.className = 'selection-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = cta.id;
  checkbox.checked = selectedCTAs.includes(cta.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedCTAs.push(cta.id);
    } else {
      selectedCTAs = selectedCTAs.filter((id) => id !== cta.id);
    }
  });

  const content = document.createElement('div');
  content.className = 'item-content';

  const title = document.createElement('span');
  title.className = 'item-title';
  title.textContent = cta.title;

  const desc = document.createElement('span');
  desc.className = 'item-description';
  desc.textContent = cta.description;

  content.appendChild(title);
  content.appendChild(desc);
  label.appendChild(checkbox);
  label.appendChild(content);

  return label;
}

/**
 * Clear all children from an element
 */
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Render arguments grid
 */
function renderArguments() {
  clearElement(argumentsGrid);

  // Separate include and exclude arguments
  const includeArgs = allArguments.filter((a) => a.type === 'include');
  const excludeArgs = allArguments.filter((a) => a.type === 'exclude');

  // Add include arguments first
  for (const arg of includeArgs) {
    argumentsGrid.appendChild(createArgumentItem(arg));
  }

  // Add a separator if there are exclude arguments
  if (excludeArgs.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'section-separator';
    const separatorText = document.createElement('span');
    separatorText.textContent = 'Sources to Exclude';
    separator.appendChild(separatorText);
    argumentsGrid.appendChild(separator);

    for (const arg of excludeArgs) {
      argumentsGrid.appendChild(createArgumentItem(arg));
    }
  }
}

/**
 * Render CTAs grid
 */
function renderCTAs() {
  clearElement(ctasGrid);
  for (const cta of allCTAs) {
    ctasGrid.appendChild(createCTAItem(cta));
  }
}

/**
 * Populate model dropdown based on provider
 */
function populateModels(provider, selectedModel = null) {
  clearElement(modelSelect);

  const availableModels = getAvailableModels();
  const models = availableModels[provider] || AVAILABLE_MODELS[provider] || [];

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    if (selectedModel === model.id || (!selectedModel && model.default)) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  });
}

/**
 * Create eye icon for password toggle
 */
function createEyeIcon(visible) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon-eye');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  if (visible) {
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute(
      'd',
      'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94'
    );
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute(
      'd',
      'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19'
    );
    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('d', 'M14.12 14.12a3 3 0 1 1-4.24-4.24');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '1');
    line.setAttribute('y1', '1');
    line.setAttribute('x2', '23');
    line.setAttribute('y2', '23');
    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    svg.appendChild(line);
  } else {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '3');
    svg.appendChild(path);
    svg.appendChild(circle);
  }

  return svg;
}

/**
 * Toggle API key visibility
 */
function toggleKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.replaceChildren(createEyeIcon(true));
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.replaceChildren(createEyeIcon(false));
  }
}

/**
 * Save all settings and complete onboarding
 */
async function completeOnboarding() {
  try {
    // Save selected arguments and CTAs
    await browser.runtime.sendMessage({
      type: 'saveSelections',
      argumentIds: selectedArguments,
      ctaIds: selectedCTAs,
    });

    // Save API settings if provided
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await browser.storage.local.set({
        apiKey: apiKey,
        provider: providerSelect.value,
        model: modelSelect.value,
      });
    }

    // Mark onboarding as complete
    await browser.runtime.sendMessage({ type: 'completeOnboarding' });

    // Redirect to X.com or close tab
    window.location.href = 'https://x.com';
  } catch (error) {
    console.error('Error completing onboarding:', error);
    alert('An error occurred. Please try again.');
  }
}

/**
 * Handle continue button click
 */
async function handleContinue() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateProgress();
    showStep(currentStep);
  } else {
    // Complete onboarding
    btnContinue.disabled = true;
    btnContinue.textContent = 'Setting up...';
    await completeOnboarding();
  }
}

/**
 * Handle back button click
 */
function handleBack() {
  if (currentStep > 1) {
    currentStep--;
    updateProgress();
    showStep(currentStep);
  }
}

/**
 * Load arguments and CTAs from backend
 */
async function loadData() {
  try {
    // Load arguments
    const argsResponse = await browser.runtime.sendMessage({ type: 'getArguments' });
    if (argsResponse.success) {
      allArguments = argsResponse.data;
      renderArguments();
    }

    // Load CTAs
    const ctasResponse = await browser.runtime.sendMessage({ type: 'getCallToActions' });
    if (ctasResponse.success) {
      allCTAs = ctasResponse.data;
      renderCTAs();
    }

    // Load existing selections if any
    const selectedArgsResponse = await browser.runtime.sendMessage({
      type: 'getSelectedArguments',
    });
    if (selectedArgsResponse.success) {
      const existingArgs = selectedArgsResponse.data || [];
      // If no existing selections or old IDs don't match new format, use defaults
      if (existingArgs.length === 0 || !allArguments.some((a) => existingArgs.includes(a.id))) {
        // Default: select all include arguments
        selectedArguments = allArguments.map((a) => a.id);
      } else {
        selectedArguments = existingArgs;
      }
      renderArguments();
    }

    const selectedCTAsResponse = await browser.runtime.sendMessage({ type: 'getSelectedCTAs' });
    if (selectedCTAsResponse.success) {
      const existingCTAs = selectedCTAsResponse.data || [];
      // If no existing selections or old IDs don't match new format, use defaults
      if (existingCTAs.length === 0 || !allCTAs.some((c) => existingCTAs.includes(c.id))) {
        // Default: select CTAs with default: true (or all if no default field)
        selectedCTAs = allCTAs.filter((c) => c.default !== false).map((c) => c.id);
      } else {
        selectedCTAs = existingCTAs;
      }
      renderCTAs();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

/**
 * Select/deselect all arguments
 */
function selectAllArguments(select) {
  if (select) {
    selectedArguments = allArguments.map((a) => a.id);
  } else {
    selectedArguments = [];
  }
  renderArguments();
}

/**
 * Select/deselect all CTAs
 */
function selectAllCTAsFunc(select) {
  if (select) {
    selectedCTAs = allCTAs.map((c) => c.id);
  } else {
    selectedCTAs = [];
  }
  renderCTAs();
}

// Event Listeners
btnContinue.addEventListener('click', handleContinue);
btnBack.addEventListener('click', handleBack);
privacyConsent.addEventListener('change', () => validateStep(1));

providerSelect.addEventListener('change', () => {
  populateModels(providerSelect.value);
});

toggleKeyBtn.addEventListener('click', toggleKeyVisibility);

selectAllArgs.addEventListener('click', () => selectAllArguments(true));
deselectAllArgs.addEventListener('click', () => selectAllArguments(false));
selectAllCTAs.addEventListener('click', () => selectAllCTAsFunc(true));
deselectAllCTAs.addEventListener('click', () => selectAllCTAsFunc(false));

// Initialize
updateProgress();
showStep(1);
populateModels('openai');
loadData();
