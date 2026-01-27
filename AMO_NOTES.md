# Reviewer Notes (Firefox Add-ons)

This document provides context for Firefox Add-ons (AMO) reviewers to understand the extension's purpose, architecture, and safety measures.

## Purpose

Iran Amplifier is a browser extension that helps users generate AI-powered responses on X/Twitter to support Iranian civil society and human rights. It is designed to amplify voices supporting protestors, activists, journalists, and human rights defenders in Iran.

## Key Safety Features

### No Automated Posting

- All actions are **user-initiated** (Copy, Reply, Quote buttons)
- The extension never posts automatically
- Users must manually click to copy text or open X/Twitter intent URLs
- Each response is reviewed by the user before any action

### No User Tracking

- **Zero analytics or telemetry**
- No data is collected about user behavior
- No tracking pixels or third-party analytics

### Network Requests

- Only to **user-selected AI provider** (OpenAI or Anthropic)
- Uses **user-supplied API key** (BYOK model)
- No intermediate servers
- No data sent to extension developers

### Local Storage Only

- Settings stored in `browser.storage.local`
- API key stored locally (never transmitted elsewhere)
- Usage counters for user's personal tracking
- No cloud sync or external storage

### Open Source

- Fully auditable code at <https://github.com/4iranorg/amplifier-ext>
- No obfuscated or minified source code
- All dependencies are standard and auditable

### No Coordination

- Does not coordinate users or generate identical messages
- **Enforces variation** between generated responses
- Each user gets unique responses based on their preferences
- No central database of responses

### Content Guardrails

- Fixed mission guardrails prevent misuse
- Cannot generate content supporting the Iranian regime
- Cannot generate threats, violence, or disinformation
- Guardrails are hardcoded and cannot be bypassed by users
- Output validation rejects problematic content

## Remote Configuration

The extension can optionally fetch configuration updates from GitHub Releases:

- **Cannot execute code** - only static JSON data
- Contains only text lists (arguments, CTAs, model options)
- Users can disable remote config in settings
- Falls back to bundled defaults if fetch fails
- Configuration is validated before use

## Permissions Explained

| Permission      | Reason                                     |
| --------------- | ------------------------------------------ |
| `*://*.x.com/*` | Inject Amplify button into X/Twitter posts |
| `storage`       | Save user preferences and API key locally  |

## File Structure

```text
src/
├── content/content.js    - Injects buttons, displays panel
├── background/service-worker.js - Handles API calls
├── lib/
│   ├── api.js           - OpenAI/Anthropic API wrappers
│   ├── prompts.js       - Prompt building with guardrails
│   └── config-loader.js - Configuration management
├── popup/               - Quick settings UI
├── dashboard/           - Full settings page
└── onboarding/          - First-run setup
```

## Testing the Extension

1. Install the extension temporarily via `about:debugging`
2. Navigate to <https://x.com>
3. Find any post and click the "Amplify" button
4. Without an API key, you'll see an error prompting configuration
5. With an API key, you'll see generated responses
6. Click Copy/Reply/Quote to use a response

## Questions?

For questions about this extension, please contact:

- GitHub Issues: <https://github.com/4iranorg/amplifier-ext/issues>
- Website: <https://4iran.org>
