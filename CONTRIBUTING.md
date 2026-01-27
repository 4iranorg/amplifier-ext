# Contributing to Iran Amplifier

Contributions welcome! This guide covers setup, development workflow, and project structure.

## Prerequisites

- **Firefox** (for testing)
- **Node.js 25+** (see `.nvmrc`)
- **pnpm** (package manager)
- **[just](https://github.com/casey/just)** (task runner)
- **pre-commit** (git hooks)

## Setup

```bash
# Use correct Node version
nvm use

# Install dependencies and pre-commit hooks
just install
# Or manually: pnpm install && pre-commit install
```

## Development Commands

```bash
just              # List all commands
just build        # Build CSS from SCSS
just watch        # Watch SCSS for changes
just lint         # Run eslint + stylelint
just fix          # Auto-fix linting issues
just format       # Format with Prettier
just check        # Run all checks (lint + format)
just pre-commit   # Run pre-commit hooks on all files
```

## Loading the Extension

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Select `manifest.json` from the project root

> **Note:** "Temporary" means the extension is removed when Firefox closes. Reload it each session until we publish to the Firefox Add-ons store.

## Testing Changes

| Change Type          | How to Test                           |
| -------------------- | ------------------------------------- |
| Content script       | Refresh x.com page                    |
| Background script    | Reload extension in `about:debugging` |
| Popup                | Close and reopen popup                |
| Dashboard/Onboarding | Reload the tab                        |
| Styles               | Run `just build` then reload          |

## Project Structure

```text
amplifier/
├── manifest.json              # Extension manifest
├── package.json               # Dependencies
├── .nvmrc                     # Node.js version (25)
├── src/
│   ├── styles/                # SCSS source files
│   │   ├── _variables.scss    # Design tokens (colors, spacing, etc.)
│   │   ├── _mixins.scss       # Reusable patterns
│   │   ├── _base.scss         # Reset and foundation
│   │   ├── _buttons.scss      # Button components
│   │   ├── _forms.scss        # Form elements
│   │   ├── _toggles.scss      # Toggle components
│   │   ├── _stats.scss        # Stats and activity graph
│   │   ├── _panels.scss       # Panels and cards
│   │   ├── content/content.scss
│   │   ├── popup/popup.scss
│   │   ├── dashboard/dashboard.scss
│   │   ├── onboarding/onboarding.scss
│   │   └── landing/landing.scss
│   ├── content/
│   │   ├── content.js         # Post detection, button injection
│   │   └── content.css        # Compiled from SCSS
│   ├── background/
│   │   └── service-worker.js  # API calls, storage, orchestration
│   ├── popup/
│   │   ├── popup.html         # Quick settings UI
│   │   ├── popup.js           # Settings logic
│   │   └── popup.css          # Compiled
│   ├── dashboard/
│   │   ├── dashboard.html     # Full settings + activity page
│   │   ├── dashboard.js       # Graph, arguments/CTAs, settings
│   │   └── dashboard.css      # Compiled
│   ├── onboarding/
│   │   ├── onboarding.html    # First-run setup wizard
│   │   ├── onboarding.js      # Multi-step flow
│   │   └── onboarding.css     # Compiled
│   └── lib/
│       ├── prompts.js         # System prompt, keyword shortcuts
│       ├── api.js             # OpenAI/Anthropic API wrapper
│       ├── config-loader.js   # Remote config, arguments/CTAs
│       ├── cost-tracker.js    # Usage tracking and cost estimation
│       ├── profile-cache.js   # X profile caching
│       └── updater.js         # Version update checker
├── icons/
│   └── iran.svg               # Extension icon
├── docs/                      # Landing page (GitHub Pages)
│   ├── index.html             # 4iran.org landing page
│   ├── landing.css            # Compiled
│   └── CNAME                  # Custom domain config
├── scripts/
│   └── release.sh             # Create release zip locally
├── .github/workflows/
│   ├── ci.yml                 # Lint, format, build checks
│   └── release.yml            # Automated releases on tag push
├── justfile                   # Task runner commands
├── .pre-commit-config.yaml    # Git hooks + CI config
├── eslint.config.js           # ESLint configuration
├── .prettierrc                # Prettier configuration
└── .stylelintrc.json          # Stylelint configuration
```

## Building Styles

The extension uses SCSS. Both source and compiled CSS are tracked in git.

```bash
# Build once
just build

# Watch during development
just watch
```

Edit SCSS in `src/styles/`, never edit compiled CSS directly.

## Releasing

Releases are automated via GitHub Actions when you push a version tag.

**To create a release:**

1. Update version in `manifest.json`
2. Update `CHANGELOG.md` with the new version's changes
3. Commit: `git commit -am "Release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`

The workflow automatically creates a GitHub release with the extension zip and changelog.

**Local release (manual upload):**

```bash
./scripts/release.sh
```

## Code Style

- **JavaScript**: Vanilla JS, `browser.*` API, async/await, JSDoc comments
- **SCSS**: Use variables from `_variables.scss`, mixins from `_mixins.scss`
- **Security**: No innerHTML — use textContent and DOM methods
- **Formatting**: Prettier handles it; run `just format` before committing

Pre-commit hooks enforce style automatically.

## Architecture Notes

### Message Flow

```text
Content Script → sendMessage → Service Worker → API → Response
     ↑                              ↓
     └──────── sendResponse ────────┘
```

### Key Patterns

- **Tweet detection**: MutationObserver watching for `[data-testid="tweet"]`
- **Conversation context**: In-memory per tweet ID, includes cached batch responses
- **Profile caching**: 7-day TTL with auto-detected categories
- **Onboarding**: Triggered on first install via `browser.runtime.onInstalled`

### Adding Arguments or CTAs

Edit `src/lib/config-loader.js`:

- Arguments: `CONFIG_DEFAULTS.arguments` array (IDs 1001-1014 include, 1015+ exclude)
- CTAs: `CONFIG_DEFAULTS.callToActions` array (IDs starting at 2001)

### Adding API Providers

1. Add wrapper in `src/lib/api.js` (return `{ result, usage }`)
2. Add model options in `CONFIG_DEFAULTS.models`
3. Add pricing in `CONFIG_DEFAULTS.pricing`
4. Update `src/background/service-worker.js` to handle new provider

## Questions?

Open an issue on [GitHub](https://github.com/4iranorg/amplifier-ext/issues).
