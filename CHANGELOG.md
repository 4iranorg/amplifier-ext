# Changelog

All notable changes to Iran Amplifier will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
