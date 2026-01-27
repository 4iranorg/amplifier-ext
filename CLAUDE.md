# Iran Amplifier - Claude Code Instructions

## Project Overview

Browser extension that helps users generate AI-powered responses on X/Twitter to support Iranian civil society. Part of [4iran.org](https://4iran.org).

**Independence Disclaimer:** This is an independent, open-source project not affiliated with any political party, organization, or individual. Any similarity to other names or products is coincidental.

**Key principles:**

- Privacy-first: No intermediate servers, direct API calls only
- BYOK: Users provide their own OpenAI/Anthropic API keys
- Open source: Fully auditable code
- Mission-locked: Fixed guardrails prevent misuse

## Tech Stack

- **Platform**: Firefox browser extension (Manifest V3)
- **Language**: Vanilla JavaScript (no framework)
- **Styling**: SCSS → CSS (compiled with Dart Sass)
- **APIs**: OpenAI, Anthropic, GitHub (for updates)
- **Storage**: browser.storage.local
- **Build**: pnpm, Node.js 25+

## Project Structure

```text
amplifier/
├── manifest.json           # Extension manifest (v1.1.0)
├── package.json            # Dependencies (sass, eslint, prettier, stylelint)
├── pnpm-lock.yaml          # Lockfile for reproducible builds
├── .nvmrc                  # Node.js version (25)
├── src/
│   ├── styles/             # SCSS source (theme configuration)
│   │   ├── _variables.scss # Design tokens (colors, spacing, typography)
│   │   ├── _mixins.scss    # Reusable patterns (focus-ring, card, etc.)
│   │   ├── _base.scss      # Reset, root variables, body styles
│   │   ├── _buttons.scss   # Button components
│   │   ├── _forms.scss     # Form elements, selection grids
│   │   ├── _toggles.scss   # Toggle rows, config status
│   │   ├── _stats.scss     # Stats cards, activity graph
│   │   ├── _panels.scss    # Privacy notice, update banner, footer
│   │   ├── content/content.scss   # → src/content/content.css
│   │   ├── popup/popup.scss       # → src/popup/popup.css
│   │   ├── dashboard/dashboard.scss # → src/dashboard/dashboard.css
│   │   ├── onboarding/onboarding.scss # → src/onboarding/onboarding.css
│   │   └── landing/landing.scss   # → docs/landing.css
│   ├── content/
│   │   ├── content.js      # Injected into x.com - button injection, panel UI
│   │   └── content.css     # Compiled from SCSS
│   ├── background/
│   │   └── service-worker.js  # API calls, storage, orchestration
│   ├── popup/
│   │   ├── popup.html      # Quick settings UI with stats
│   │   ├── popup.js        # Settings logic, stats display
│   │   └── popup.css       # Compiled from SCSS
│   ├── dashboard/
│   │   ├── dashboard.html  # Full settings + activity page
│   │   ├── dashboard.js    # Activity graph, arguments/CTAs, advanced settings
│   │   └── dashboard.css   # Compiled from SCSS
│   ├── onboarding/
│   │   ├── onboarding.html # First-run setup wizard
│   │   ├── onboarding.js   # Multi-step flow logic
│   │   └── onboarding.css  # Compiled from SCSS
│   └── lib/
│       ├── prompts.js      # Prompt architecture with arguments/CTAs injection
│       ├── api.js          # OpenAI/Anthropic API wrappers with usage tracking
│       ├── config-loader.js # Remote config loading, arguments/CTAs data
│       ├── cost-tracker.js # Token/cost tracking and statistics
│       ├── profile-cache.js # Twitter profile caching with TTL
│       ├── personalization.js # User preferences and voice fingerprint
│       └── updater.js      # GitHub release version checking
├── icons/                  # Extension icons
├── docs/                   # Landing page (GitHub Pages)
│   ├── index.html          # 4iran.org landing page
│   ├── landing.css         # Compiled from SCSS
│   ├── iran.svg            # Logo
│   ├── favicon.svg         # Favicon
│   └── CNAME               # Custom domain (4iran.org)
├── scripts/
│   └── release.sh          # Create release zip locally
├── .github/
│   └── workflows/
│       └── release.yml     # Automated GitHub releases on tag push
├── .claude/
│   ├── commands/
│   │   └── release.md      # Claude Code /release skill
│   └── settings.local.json # Claude Code permissions
├── justfile                # Development task runner
├── .pre-commit-config.yaml # Pre-commit hooks configuration
├── eslint.config.js        # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .prettierignore         # Prettier ignore patterns
├── .stylelintrc.json       # Stylelint configuration
├── CHANGELOG.md            # Version history
├── PRIVACY.md              # Detailed privacy documentation (GDPR compliant)
└── TERMS.md                # Terms of Service
```

## Key Files

| File                               | Purpose                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `src/content/content.js`           | Main content script - detects tweets, injects Amplify button, shows response panel |
| `src/background/service-worker.js` | Central hub - handles API calls, manages context, tracks usage, handles onboarding |
| `src/lib/prompts.js`               | Prompt architecture with arguments/CTAs injection                                  |
| `src/lib/config-loader.js`         | Remote config, arguments & CTAs data, selection storage                            |
| `src/lib/api.js`                   | API wrappers with token usage tracking, prompt validation                          |
| `src/lib/cost-tracker.js`          | Tracks API usage (tokens/cost) separately from amplifications                      |
| `src/dashboard/dashboard.js`       | Activity graph, arguments/CTAs management, advanced settings                       |
| `src/onboarding/onboarding.js`     | First-run wizard with privacy, arguments, CTAs, API setup                          |
| `docs/index.html`                  | Landing page for 4iran.org (served via GitHub Pages)                               |
| `scripts/release.sh`               | Local script to create release zip                                                 |
| `.github/workflows/release.yml`    | Automated release workflow on tag push                                             |
| `.claude/commands/release.md`      | Claude Code skill for guided releases                                              |

## Architecture Patterns

### Prompt Architecture with Arguments & CTAs

```javascript
// Fixed prompt (not user-editable) - contains mission guardrails
FIXED_SYSTEM_PROMPT = 'Core identity, output format, safety guardrails...';

// User prompt (editable) - controls style only
DEFAULT_USER_PROMPT = 'Tone preferences, content strategy...';

// Arguments (user-selected) - facts and talking points
selectedArguments = [1001, 1003, 1005]; // IDs of selected arguments

// CTAs (user-selected) - policy demands to advocate
selectedCTAs = [2001, 2003, 2006]; // IDs of selected CTAs

// Combined for API calls
buildSystemPrompt(userPrompt, personalization, selectedArguments, selectedCTAs);
```

### Arguments & CTAs Data Structure

```javascript
// Arguments: IDs 1001-1014 (include), 1015 (exclude/always-on)
arguments: [
  { id: 1001, title: 'Mass killings...', description: '...', type: 'include' },
  { id: 1015, title: 'Do not reference NIAC...', description: '...', type: 'exclude' },
];

// CTAs: IDs 2001-2009 (policy demands)
callToActions: [
  { id: 2001, title: 'Designate the IRGC as terrorist organization', description: '...' },
];
```

### Message Flow (Service Worker)

```text
Content Script → sendMessage → Service Worker → API → Response
     ↑                              ↓
     └──────── sendResponse ────────┘
```

Message types:

- `generate` - Generate responses for a tweet
- `clearContext` - Clear conversation history
- `getSettings` - Get settings (without API key)
- `testConnection` - Test API connectivity
- `getUsageStats` - Get token/cost statistics
- `getActivityLog` - Get amplification history
- `recordAmplification` - Record when user uses a response
- `validatePrompt` - AI-powered prompt validation
- `checkForUpdate` - Check GitHub for new version
- `getCachedUpdateInfo` - Get cached update info
- `dismissUpdate` - Dismiss update notification
- `getArguments` - Get all available arguments
- `getCallToActions` - Get all available CTAs
- `getSelectedArguments` - Get user's selected argument IDs
- `getSelectedCTAs` - Get user's selected CTA IDs
- `saveSelectedArguments` - Save argument selections
- `saveSelectedCTAs` - Save CTA selections
- `saveSelections` - Save both arguments and CTAs at once
- `getUserPreferences` - Get voice preferences and seed
- `saveUserPreferences` - Save voice preferences

### Storage Schema

```javascript
// browser.storage.local
{
  // Settings
  apiKey: string,
  provider: 'openai' | 'anthropic',
  model: string,
  customUserPrompt: string,

  // Arguments & CTAs selections
  selectedArguments: [1001, 1003, 1005],  // Array of argument IDs
  selectedCTAs: [2001, 2003, 2006],       // Array of CTA IDs
  onboardingComplete: boolean,

  // Voice preferences
  userPreferences: { voiceStyle, background, approach, length },
  userSeed: string,  // 7-char alphanumeric for voice fingerprint

  // Data sharing (future)
  shareStats: boolean,
  contributeHotPosts: boolean,

  // Usage stats
  usageStats: {
    daily: { 'YYYY-MM-DD': { tokens, cost, requests } },
    monthly: { 'YYYY-MM': { tokens, cost, requests } },
    allTime: { tokens, cost, requests }
  },

  // Activity log
  activityLog: { 'YYYY-MM-DD': amplificationCount },

  // Profile cache
  profileCache: {
    'handle': { handle, displayName, bio, followerCount, category, cachedAt }
  },

  // Updates
  lastUpdateCheck: timestamp,
  updateInfo: { version, name, url, body, publishedAt },
  dismissedVersion: string
}
```

### Statistics Tracking

**Two separate tracking systems:**

1. **Usage Stats** (`usageStats`) - Tracks API consumption
   - **When recorded**: Every LLM API call (generation, refinement, validation)
   - **What's tracked**: Tokens (input + output), estimated cost, request count
   - **Purpose**: Shows users their API spending
   - **Function**: `recordUsage()` in `cost-tracker.js`

2. **Activity Log** (`activityLog`) - Tracks actual amplifications
   - **When recorded**: Only when user clicks Copy, Reply, or Quote button
   - **What's tracked**: Count per day (for contribution graph)
   - **Purpose**: Shows actual engagement/usage, not just API calls
   - **Function**: `recordAmplification()` in `cost-tracker.js`

**Why separate?** A user might generate responses multiple times (refining, exploring) before actually using one. The activity graph should reflect meaningful actions, not experimentation.

**Data retention:**

- Daily usage stats: 90 days
- Monthly usage stats: 24 months
- Activity log: 365 days (for full-year contribution graph)

## Development

### Prerequisites

```bash
# Use correct Node version
nvm use  # reads .nvmrc (Node 25)

# Install dependencies and pre-commit hooks
just install
# Or manually:
pnpm install
pre-commit install
```

### Development Commands (justfile)

This project uses [just](https://github.com/casey/just) as a task runner. Run `just` to see all available commands:

```bash
just              # List all commands
just install      # Install deps + pre-commit hooks
just build        # Build CSS from SCSS
just watch        # Watch SCSS for changes
just lint         # Run eslint + stylelint
just fix          # Auto-fix linting issues
just format       # Format with Prettier
just format-check # Check formatting only
just check        # Run all checks (lint + format)
just pre-commit   # Run pre-commit on all files
just all          # Build + check everything
just clean        # Remove generated CSS
just rebuild      # Clean + build
just version      # Show current version
just release-check # Verify ready for release
just release-zip  # Create release zip locally
```

For the full interactive release process, use the Claude Code skill: `/release`

### Building Styles

```bash
# Build CSS once
just build
# Or: pnpm run build:css

# Watch for changes during development
just watch
# Or: pnpm run watch:css
```

Both SCSS source and compiled CSS are tracked in git for auditability.

### Releasing

Releases are automated via GitHub Actions (`.github/workflows/release.yml`).

**Automated release process:**

1. Update version in `manifest.json`
2. Update `CHANGELOG.md` with new version section
3. Commit: `git commit -am "Release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`

The workflow automatically:

- Creates extension zip (excludes SCSS source files)
- Extracts changelog section for the version
- Creates GitHub release with zip attached
- Marks 0.x.x versions as pre-releases

**Claude Code skill:** Use `/release` to get guided through the release process.

**Local release (for manual upload):**

```bash
./scripts/release.sh
```

### Loading the Extension

1. Open Firefox → `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json`

### Testing Changes

- **Content script**: Refresh the x.com page
- **Background script**: Reload extension in `about:debugging`
- **Popup**: Close and reopen popup
- **Dashboard/Onboarding**: Reload the tab
- **Styles**: Run `just build` then reload

### Important Patterns

**Tweet detection**: Uses MutationObserver to detect dynamically loaded tweets. Tweets are identified by `[data-testid="tweet"]`.

**Compose dialog detection**: Detects quote/reply dialogs via `[data-testid="tweetButton"]` or `[data-testid="tweetButtonInline"]`.

**Conversation context**: Stored in-memory per tweet ID. Includes conversation history for refinement and cached batch responses (3 replies + 3 quotes generated in one API call). If user closes and reopens the panel for the same tweet, cached responses are shown instantly without an API call. Tab switching between Reply/Quote uses cached data without additional API calls. Cleared on page refresh or extension reload.

**API calls**: Made directly from service worker to OpenAI/Anthropic. Token usage extracted from responses.

**Profile caching**: Profiles cached with 7-day TTL. Auto-detects category (journalist, activist, etc.).

**Onboarding**: Triggered on first install via `browser.runtime.onInstalled` listener. Opens onboarding page if `onboardingComplete` is false.

## Code Quality

### Pre-commit Hooks

Pre-commit hooks run automatically on every commit to catch issues early:

| Hook                    | Purpose                        |
| ----------------------- | ------------------------------ |
| trailing-whitespace     | Removes trailing whitespace    |
| end-of-file-fixer       | Ensures files end with newline |
| check-json              | Validates JSON syntax          |
| check-yaml              | Validates YAML syntax          |
| check-added-large-files | Prevents large file commits    |
| detect-private-key      | Catches accidental key commits |
| no-commit-to-branch     | Blocks direct commits to main  |
| prettier                | Formats JS/CSS/HTML/JSON/MD    |
| eslint                  | Lints JavaScript               |
| stylelint               | Lints SCSS/CSS                 |

Run manually: `just pre-commit` or `pre-commit run --all-files`

### Linting & Formatting

```bash
# Check for issues
just lint         # Run eslint + stylelint
just format-check # Check Prettier formatting

# Auto-fix issues
just fix          # Fix eslint + stylelint issues
just format       # Format with Prettier

# Run all checks
just check        # lint + format-check
```

**Configuration files:**

- `eslint.config.js` - ESLint rules (ES2024, browser globals)
- `.prettierrc` - Prettier options (single quotes, trailing commas)
- `.stylelintrc.json` - Stylelint rules (standard SCSS)

## Coding Conventions

### JavaScript

- Use vanilla JavaScript (no frameworks)
- Use `browser.*` API (Firefox WebExtensions)
- Prefer `const` over `let`, avoid `var`
- Use async/await for promises
- Keep functions focused and small
- Add JSDoc comments for public functions
- Use safe DOM methods (createElement, textContent) instead of innerHTML
- Prefix unused variables with `_` (e.g., `catch (_error)`)

### SCSS/Styling

- Edit SCSS in `src/styles/`, never edit compiled CSS directly
- Use variables from `_variables.scss` for colors, spacing, typography
- Use mixins from `_mixins.scss` for common patterns
- Partials are prefixed with `_` (e.g., `_buttons.scss`)
- Entry files import partials and compile to CSS
- Run `just build` after style changes

## Security Considerations

- Never log API keys or tweet content
- API keys stored in browser.storage.local only
- No telemetry or analytics (unless user opts in)
- Minimal permissions in manifest.json
- Fixed mission guardrails cannot be bypassed
- Avoid innerHTML - use textContent and DOM methods

## Common Tasks

### Modifying theme colors or spacing

Edit `src/styles/_variables.scss` and rebuild:

- Colors: `$accent-400/500/600`, `$color-success/warning/error`
- Surfaces: `$surface-primary/secondary/elevated-dark`
- Spacing: `$spacing-xs` through `$spacing-5xl`
- Typography: `$font-size-*`, `$font-weight-*`

Then run `just build`.

### Adding a new argument

Edit `src/lib/config-loader.js` → `CONFIG_DEFAULTS.arguments` array. Use the next available ID (1001-1014 for include, 1015+ for exclude).

### Adding a new CTA

Edit `src/lib/config-loader.js` → `CONFIG_DEFAULTS.callToActions` array. Use IDs starting at 2001.

### Modifying the user prompt

Edit `src/lib/config-loader.js` → `CONFIG_DEFAULTS.prompts.default` constant.

Note: `prompts.fixed` should NOT be modified - it contains mission guardrails.

### Adding a new API provider

1. Add wrapper function in `src/lib/api.js` (return `{ result, usage }`)
2. Add model options in `CONFIG_DEFAULTS.models`
3. Add pricing in `CONFIG_DEFAULTS.pricing`
4. Update `src/background/service-worker.js` to handle new provider
5. Update popup UI to show new provider option

### Adding a new message type

1. Add handler in `src/background/service-worker.js` → message listener switch
2. Call from content script or popup via `browser.runtime.sendMessage({ type: '...' })`

## UI Architecture

### Popup (Quick Settings)

- Update banner
- Usage statistics (today/month)
- Voice preferences (4 dropdowns)
- API configuration
- Link to Dashboard

### Dashboard (Full Settings)

- Activity section (stats, contribution graph, share button)
- API Configuration (provider, model, API key, test connection)
- Voice Preferences (style, background, approach, length, fingerprint)
- Arguments selection (checkbox grid)
- CTAs selection (checkbox grid)
- Style prompt (textarea)
- Remote configuration
- Community features
- About section (product info, independence disclaimer)
- Privacy notice
- Danger zone

### Onboarding (First Run)

1. Privacy Notice (must acknowledge)
2. Arguments selection
3. CTAs selection
4. API key setup (optional, can skip)

## Phase 3 (Future Work)

Backend integration for community features:

- Hot posts aggregation
- Staff picks
- Prompt sharing
- Verification system

See plan file for details.

## Chrome Port (Future)

The extension uses Firefox-specific `browser.*` API. For Chrome:

- Replace `browser.*` with `chrome.*`
- Or use webextension-polyfill
- Update manifest.json for Chrome Manifest V3 differences
