# Changelog

All notable changes to Iran Amplifier will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-07

### Added

- Native compose dialog for Reply and Quote actions instead of Web Intent popups (#13)
- Paste-based text insertion into X/Twitter's DraftJS editor with fallback chain (#13)
- Anti-negotiation argument: opposition to US-Iran talks and regime deals (#12)
- Anti-negotiation CTA: no deals with the Islamic Republic, regime must surrender (#12)
- Prompt logic for detecting posts about US-Iran talks, negotiations, or deals (#12)
- SEO meta tags, robots.txt, and sitemap for landing page (#9)

### Changed

- Reply and Quote buttons now open native X/Twitter compose dialog with pre-filled text (#13)
- Web Intent popups retained as fallback when native dialog fails (#13)
- Strengthened EU IRGC designation CTA to demand concrete enforcement actions (#12)
- Strengthened diplomat expulsion CTA to demand full severing of diplomatic relations (#12)
- Improved response voice: more authentic Iranian perspective, less analyst/reporter framing (#12)
- Improved response opener variety: no more "Exactly" cliche, better category-based variation (#12)
- Updated mission statement to explicitly oppose negotiations that sustain the regime (#12)

### Fixed

- Quote intent now uses separate `url` parameter instead of appending URL to text (#13)

## [0.2.0] - 2026-01-30

### Added

- Quick Start guide page with step-by-step installation instructions
- Cost transparency section on landing page explaining AI service fees
- Alpine.js CSP build for content script components

### Changed

- Landing page: simplified hero description for clarity
- Landing page: reordered sections (How It Works before Control)
- Landing page: updated terminology (Arguments → Talking Points, Call to Actions → Calls to Action)
- Added "(Twitter)" clarification after X references throughout
- Refactored content script to Alpine.js components for better maintainability
- Improved response style with strategic angles and proper classification
- Added response logic for allies criticizing regime apologists

### Fixed

- Race condition when switching tabs during response generation

## [0.1.1] - 2026-01-28

### Added

- Response panel analytics showing generation stats: `In: 3.0k | Out: 308 | Cached: 1.0k | Time: 5.9s`
- Cached token tracking for OpenAI and Anthropic APIs
- Build script with esbuild for faster development

### Changed

- Default model changed from `gpt-5-mini` to `gpt-4.1-mini` for faster responses
- Disabled validation retries (`MAX_VALIDATION_RETRIES = 0`) for speed
- Popup auto-closes after saving settings
- On-demand tab generation with separate contexts for Reply/Quote tabs

### Fixed

- Quote intent now correctly embeds original tweet (appends URL to text per X Web Intent docs)

### Removed

- Excluded source pattern validation (NIAC, etc.)
- Threat/incitement pattern validation

## [0.1.0] - 2026-01-27

Initial pre-release. Using 0.x versioning to indicate early development before Firefox Add-ons store release.

### Added

#### Core Features

- Firefox extension for X
- Amplify button on posts
- Reply and Quote modes
- OpenAI and Anthropic API support
- BYOK (Bring Your Own Key) model
- Keyword shortcuts (//shorter, //formal, etc.)
- Copy, Reply, and Quote actions
- Compose dialog toolbar button
- Settings popup
- Privacy-first design

#### Cost Tracking

- Track API usage with token counts (input + output)
- Estimated cost per request based on model pricing
- Daily, monthly, and all-time usage statistics
- Stats displayed in popup

#### Activity Graph

- GitHub-style contribution graph showing amplification history
- Last 12 weeks of activity visualization
- Day streak tracking
- Best day statistics
- Dedicated activity page accessible from popup

#### Two-Prompt Architecture

- Split prompts into fixed system prompt and editable user prompt
- Fixed system prompt contains mission guardrails (not user-editable)
- User prompt controls tone and style (fully customizable)
- Prevents misuse while allowing personalization

#### Prompt Sanity Check

- AI-powered validation of custom prompts
- Automatically validates prompts when saving
- Rejects prompts that could be used for regime propaganda
- Shows validation status with reason

#### Profile Caching

- Cache X user profiles for enriched LLM context
- Automatic category detection (journalist, activist, academic, etc.)
- 7-day cache TTL with automatic cleanup
- Profile context included in prompts

#### Update Notifications

- Check GitHub releases for new versions
- Show update banner in popup when available
- Dismiss option for updates
- 24-hour check interval

#### Data Sharing Settings (Backend Prep)

- Toggle for anonymous stats sharing (default OFF)
- Toggle for hot posts contribution (default OFF)
- UI prepared for future backend integration
- No actual data sending yet

#### Documentation

- README emphasizing privacy-first design and user control
- PRIVACY.md with detailed privacy policy (GDPR compliant)
- TERMS.md with terms of service
- CLAUDE.md with development instructions
- Onboarding flow with privacy notice and user control messaging
