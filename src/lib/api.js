/**
 * OpenAI API wrapper for Iran Amplifier extension.
 * Uses official OpenAI SDK for Responses API, direct fetch for Chat Completions.
 */

import OpenAI from 'openai';
import { getAllModels, CONFIG_DEFAULTS } from './config-loader.js';

/**
 * Call OpenAI Responses API (for GPT-5+ models) using official SDK
 * @param {string} apiKey - User's OpenAI API key
 * @param {string} model - Model to use (e.g., 'gpt-5-mini')
 * @param {Array} messages - Conversation messages
 * @returns {Promise<Object>} Object with result and usage data
 */
async function callOpenAIResponses(apiKey, model, messages) {
  const client = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for browser extension
  });

  // Extract system message for instructions
  const systemMessage = messages.find((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  // Instructions must contain "json" for json_object mode
  let instructions = systemMessage?.content || '';
  if (!instructions.toLowerCase().includes('json')) {
    instructions += '\n\nRespond with valid JSON.';
  }

  // Build input - ensure "json" appears in input for json_object mode
  let input;
  if (nonSystemMessages.length === 1 && nonSystemMessages[0].role === 'user') {
    let content = nonSystemMessages[0].content;
    // API requires "json" in input for json_object mode
    if (!content.toLowerCase().includes('json')) {
      content += '\n\nRespond with valid JSON.';
    }
    input = content;
  } else {
    // For multi-turn, add json instruction to last user message
    input = nonSystemMessages.map((m, i) => {
      let content = m.content;
      if (m.role === 'user' && i === nonSystemMessages.length - 1) {
        if (!content.toLowerCase().includes('json')) {
          content += '\n\nRespond with valid JSON.';
        }
      }
      return { role: m.role, content: content };
    });
  }

  const response = await client.responses.create({
    model: model,
    instructions: instructions,
    input: input,
    text: { format: { type: 'json_object' } },
  });

  // Extract token usage (including cached tokens if available)
  const usage = {
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
    cachedTokens: response.usage?.input_tokens_details?.cached_tokens || 0,
    model: model,
    provider: 'openai',
  };

  try {
    return {
      result: JSON.parse(response.output_text),
      usage,
    };
  } catch (_e) {
    throw new Error('Failed to parse API response as JSON');
  }
}

/**
 * Call OpenAI Chat Completions API (for GPT-4.x and older models)
 * @param {string} apiKey - User's OpenAI API key
 * @param {string} model - Model to use (e.g., 'gpt-4.1-mini')
 * @param {Array} messages - Conversation messages
 * @returns {Promise<Object>} Object with result and usage data
 */
async function callOpenAIChatCompletions(apiKey, model, messages) {
  // Newer OpenAI models use max_completion_tokens instead of max_tokens
  const useNewTokenParam =
    model.startsWith('gpt-4.1') ||
    model.startsWith('o1') ||
    model.startsWith('o3') ||
    model.startsWith('o4');

  // Reasoning models don't support custom temperature
  const supportsTemperature =
    !model.startsWith('o1') && !model.startsWith('o3') && !model.startsWith('o4');

  const requestBody = {
    model: model,
    messages: messages,
    response_format: { type: 'json_object' },
  };

  if (supportsTemperature) {
    requestBody.temperature = 0.8;
  }

  if (useNewTokenParam) {
    requestBody.max_completion_tokens = 1000;
  } else {
    requestBody.max_tokens = 1000;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Extract token usage (including cached tokens if available)
  const usage = {
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
    cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens || 0,
    model: model,
    provider: 'openai',
  };

  try {
    return {
      result: JSON.parse(content),
      usage,
    };
  } catch (_e) {
    throw new Error('Failed to parse API response as JSON');
  }
}

/**
 * Call OpenAI API with conversation context
 * Routes to Responses API for GPT-5+ models, Chat Completions for GPT-4.x
 * @param {string} apiKey - User's OpenAI API key
 * @param {string} model - Model to use (e.g., 'gpt-5-mini')
 * @param {Array} messages - Conversation messages
 * @returns {Promise<Object>} Object with result and usage data
 */
export async function callOpenAI(apiKey, model, messages) {
  // GPT-5+ models use Responses API
  if (model.startsWith('gpt-5')) {
    return callOpenAIResponses(apiKey, model, messages);
  }

  // GPT-4.x and older models use Chat Completions API
  return callOpenAIChatCompletions(apiKey, model, messages);
}

/**
 * Call Anthropic API with conversation context
 * @param {string} apiKey - User's Anthropic API key
 * @param {string} model - Model to use (e.g., 'claude-3-5-haiku-20241022')
 * @param {string} systemPrompt - System prompt
 * @param {Array} messages - Conversation messages (user/assistant turns)
 * @returns {Promise<Object>} Object with result and usage data
 */
export async function callAnthropic(apiKey, model, systemPrompt, messages) {
  // Convert messages format for Anthropic API
  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      temperature: 0.8,
      system: systemPrompt,
      messages: anthropicMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract token usage (including cached tokens if available)
  const usage = {
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
    cachedTokens: data.usage?.cache_read_input_tokens || 0,
    model: model,
    provider: 'anthropic',
  };

  try {
    return {
      result: JSON.parse(content),
      usage,
    };
  } catch (_e) {
    throw new Error('Failed to parse API response as JSON');
  }
}

/**
 * Test API connection
 * @param {string} provider - 'openai' or 'anthropic'
 * @param {string} apiKey - API key to test
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection(provider, apiKey) {
  try {
    if (provider === 'openai') {
      // Use models endpoint - doesn't require JSON mode
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } else if (provider === 'anthropic') {
      // Make a minimal API call to test the key
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return response.ok;
    }
    return false;
  } catch (_e) {
    return false;
  }
}

/**
 * Validate a user prompt to ensure it aligns with Iran civil society support
 * @param {string} provider - 'openai' or 'anthropic'
 * @param {string} apiKey - User's API key
 * @param {string} userPrompt - The prompt to validate
 * @returns {Promise<Object>} Validation result { valid: boolean, reason: string }
 */
export async function validatePrompt(provider, apiKey, userPrompt) {
  const validationSystemPrompt = `You are a prompt safety validator for a tool that supports Iranian civil society and human rights.

Your task: Analyze the user's style prompt to determine if it could be used to:
1. Support the Iranian regime, IRGC, or government propaganda
2. Attack, threaten, or undermine protestors, activists, or journalists
3. Spread disinformation or conspiracy theories against the freedom movement
4. Generate hate speech or incite violence
5. Subvert the tool's mission of supporting Iranian civil society

IMPORTANT: The prompt you're validating is a STYLE prompt - it controls tone and content strategy.
Users can legitimately customize tone (formal, casual, urgent), content focus (human rights, policy, diaspora), etc.
Only flag prompts that clearly attempt to subvert the mission.

Return a JSON object:
{
  "valid": true/false,
  "reason": "Brief explanation (required if invalid)"
}`;

  const userMessage = `Analyze this style prompt for a tool that generates posts supporting Iranian civil society:

"""
${userPrompt}
"""

Is this prompt safe to use? Return JSON.`;

  try {
    let result;

    if (provider === 'openai') {
      // Use a fast, cheap model for validation (gpt-4.1-mini uses Chat Completions)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: validationSystemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_completion_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const data = await response.json();
      result = JSON.parse(data.choices[0].message.content);
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 150,
          system: validationSystemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const data = await response.json();
      result = JSON.parse(data.content[0].text);
    } else {
      throw new Error('Unknown provider');
    }

    return {
      valid: result.valid === true,
      reason: result.reason || (result.valid ? 'Prompt approved' : 'Prompt rejected'),
    };
  } catch (error) {
    // If validation fails (network error, parse error), allow the prompt
    // but log the error. Better to allow than block incorrectly.
    console.warn('Prompt validation failed:', error);
    return {
      valid: true,
      reason: 'Validation skipped (error occurred)',
      error: true,
    };
  }
}

/**
 * Default available models (bundled fallback)
 * @deprecated Use getAvailableModels() instead
 */
export const DEFAULT_AVAILABLE_MODELS = CONFIG_DEFAULTS.models;

/**
 * Get available models for each provider (from config or defaults)
 * @returns {Object} Models object keyed by provider
 */
export function getAvailableModels() {
  return getAllModels();
}

/**
 * Available models for each provider
 * @deprecated Use getAvailableModels() instead for dynamic config support
 */
export const AVAILABLE_MODELS = CONFIG_DEFAULTS.models;
