# Privacy Policy

Iran Amplifier is designed with privacy as a core principle. We operate no servers and collect no data.

## Summary

| Principle              | Implementation                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **No servers**         | We have no backend infrastructure. Nothing to hack, nothing to subpoena.                |
| **No data collection** | Zero analytics, zero telemetry, zero tracking.                                          |
| **Local-only storage** | All settings and stats stay on your device.                                             |
| **Direct API calls**   | Your browser talks directly to OpenAI/Anthropic. No middlemen.                          |
| **Full control**       | You choose what arguments to use, what to generate, and what to post.                   |
| **Open source**        | Every line of code is auditable on [GitHub](https://github.com/4iranorg/amplifier-ext). |

## Independence Disclaimer

This is an independent, open-source project not affiliated with any political party, organization, or individual. Any similarity to other names or products is coincidental.

## Your API Key is Safe

**Your API key NEVER touches our servers.**

Here's exactly what happens with your API key:

1. You enter it in the extension settings
2. It's stored in your browser's local storage (on YOUR device only)
3. When you generate a response, it's sent DIRECTLY to OpenAI/Anthropic
4. We have NO servers - there's nowhere for us to store or see your key

**We physically cannot:**

- See your API key
- Access your API key
- Store your API key remotely
- Use your API key
- Share your API key

**Verify this yourself:**

- The extension is open source: [GitHub](https://github.com/4iranorg/amplifier-ext)
- Check the network tab in browser DevTools - only calls go to api.openai.com or api.anthropic.com
- Search the codebase - there are no calls to any other servers

If you're still concerned, you can:

- Use a separate API key just for this extension
- Set usage limits on your API key in your provider's dashboard
- Revoke the key anytime through your provider's settings

## Cookies & Tracking

**We use NO cookies whatsoever.**

- No tracking cookies
- No analytics cookies
- No session cookies
- No third-party cookies

**We use NO tracking technologies:**

- No pixel trackers
- No fingerprinting
- No analytics scripts (Google Analytics, etc.)
- No advertising networks
- No social media trackers

The extension uses only `browser.storage.local` to store your settings and usage statistics locally on your device. This is NOT a cookie - it's browser extension storage that never leaves your device.

## Data Storage (Local Only)

The following data is stored **only in your browser** using `browser.storage.local`:

### Settings

| Data               | Purpose                       | Retention          |
| ------------------ | ----------------------------- | ------------------ |
| API Key            | Authenticate with AI provider | Until you clear it |
| Provider           | OpenAI or Anthropic selection | Until changed      |
| Model              | Selected AI model             | Until changed      |
| Custom Prompt      | Your style preferences        | Until changed      |
| Selected Arguments | Talking points to use         | Until changed      |
| Selected CTAs      | Policy demands to advocate    | Until changed      |

### Usage Statistics

| Data           | Purpose               | Retention                            |
| -------------- | --------------------- | ------------------------------------ |
| Token counts   | Show usage estimates  | 90 days (daily), 24 months (monthly) |
| Cost estimates | Help monitor spending | 90 days (daily), 24 months (monthly) |
| Request counts | Activity tracking     | 90 days (daily), 24 months (monthly) |

### Activity Log

| Data                       | Purpose            | Retention |
| -------------------------- | ------------------ | --------- |
| Daily amplification counts | Contribution graph | 365 days  |

### Profile Cache

| Data              | Purpose               | Retention             |
| ----------------- | --------------------- | --------------------- |
| X handles         | Enrich prompt context | 7 days (auto-refresh) |
| Display names     | Enrich prompt context | 7 days (auto-refresh) |
| Detected category | Enrich prompt context | 7 days (auto-refresh) |

### Update Info

| Data                   | Purpose                   | Retention        |
| ---------------------- | ------------------------- | ---------------- |
| Last update check time | Avoid excessive API calls | Until next check |
| Latest version info    | Show update notification  | Until dismissed  |

## Data Transmission

### To AI Providers (OpenAI or Anthropic)

When you click "Amplify", the following is sent to your chosen AI provider:

| Data                 | Why It's Sent                          |
| -------------------- | -------------------------------------- |
| Post text            | Required to generate relevant response |
| Author name/handle   | Provides context for response          |
| Quoted post (if any) | Provides full context                  |
| Your custom prompt   | Defines response style                 |
| Conversation history | Enables iterative refinement           |
| Selected arguments   | Talking points for AI to use           |
| Selected CTAs        | Policy demands for AI to advocate      |

**Important**: Your API key authenticates these requests. The extension makes **direct API calls** - no data passes through any intermediate server.

### To GitHub API

On extension startup and daily thereafter:

| Data                         | Why It's Sent              |
| ---------------------------- | -------------------------- |
| None (anonymous GET request) | Check for new versions     |
| None (anonymous GET request) | Fetch remote configuration |

These are simple, unauthenticated requests. No user data is transmitted.

## Third-Party Data Processing

Response generation is powered by your choice of OpenAI or Anthropic APIs. When you generate a response:

**Data sent to AI provider:**

- Tweet text and author information
- Your custom style prompt
- Selected arguments and CTAs
- Conversation history (for refinements)

**OpenAI** may retain API data for up to 30 days for abuse monitoring. They do not use API data to train models. See their [Privacy Policy](https://openai.com/privacy/) and [API Data Usage Policy](https://openai.com/policies/api-data-usage-policies/).

**Anthropic** retains API data per their data retention policies. See their [Privacy Policy](https://www.anthropic.com/privacy) and [Terms of Service](https://www.anthropic.com/legal/consumer-terms).

## GDPR Compliance (EU Users)

Under the General Data Protection Regulation (GDPR), you have rights regarding your personal data:

**Your rights:**

- **Access**: View all data stored by the extension (Settings → Dashboard → see stored data)
- **Rectification**: Edit your settings at any time
- **Erasure**: "Clear All Extension Data" removes everything
- **Portability**: Data is stored in standard browser storage format

**Our position**: Since we do not operate servers or store personal data, there is no data to access, rectify, or delete from our systems. All data remains on your device.

**For AI provider data**: Contact OpenAI at <privacy@openai.com> or Anthropic at <privacy@anthropic.com> to exercise your rights for data they may have processed.

## Legal Basis for Processing

The legal basis for processing your input through AI providers is **your explicit consent**, given when you:

1. Install and configure the extension
2. Click "Amplify" to generate a response

You may withdraw consent at any time by:

- Uninstalling the extension
- Clearing extension data
- Simply not using the generation feature

## International Data Transfer

OpenAI and Anthropic are US-based companies. By using this extension, you acknowledge that:

- Your data may be transferred to and processed in the United States
- US data protection laws may differ from those in your country of residence
- Both companies have committed to data protection standards (see their respective policies)

**EU-US Data Transfer**: Both providers handle EU user data in compliance with applicable data transfer mechanisms.

## Future: Community Features (Opt-In Only)

If you enable community features in the future, the following **may** be sent to our backend:

| Data                   | Purpose               | When Enabled              |
| ---------------------- | --------------------- | ------------------------- |
| Post URL (hashed)      | Hot posts aggregation | "Contribute to hot posts" |
| Timestamp              | Hot posts aggregation | "Contribute to hot posts" |
| Anonymous usage counts | Product improvement   | "Share anonymous stats"   |

**These features are currently disabled** and no backend exists yet. When implemented:

- They will be OFF by default
- You must explicitly opt-in
- No personal data will ever be collected
- Post URLs will be hashed (not stored in plain text)

## Data NOT Collected

We **never** collect:

- Your identity or personal information
- Your X username
- Your browsing history
- Which specific posts you amplify
- The responses you choose to use
- Your location
- Device fingerprints
- Any analytics or telemetry (by default)

## Data Security

- API keys are stored using Firefox's secure storage API
- All API calls use HTTPS
- No data is sent to third parties (except your chosen AI provider)
- Source code is open for audit

## Your Rights

You can:

1. **Clear all data**: Click "Clear All Extension Data" in settings
2. **Export data**: Use Firefox's extension data export
3. **Opt out of future features**: Leave community features toggled off
4. **Audit the code**: Full source available on GitHub

## Mission Guardrails

The extension includes fixed mission guardrails that:

- Ensure responses support Iranian civil society
- Prevent generation of regime propaganda
- Block attempts to attack activists or spread disinformation
- Cannot be bypassed by custom prompts

When you save a custom prompt, it's validated to ensure alignment with the mission.

## Changes to This Policy

Any changes to data practices will be:

1. Documented in CHANGELOG.md
2. Announced in release notes
3. Require new opt-in for expanded data collection

## Contact

For privacy questions or concerns:

- Open an issue on GitHub
- Email: <privacy@4iran.org>

## Last Updated

January 27, 2026
