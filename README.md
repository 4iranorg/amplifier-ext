# Iran Amplifier

[![CI](https://github.com/4iranorg/amplifier/actions/workflows/ci.yml/badge.svg)](https://github.com/4iranorg/amplifier/actions/workflows/ci.yml)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/4iranorg/amplifier/main.svg)](https://results.pre-commit.ci/latest/github/4iranorg/amplifier/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A privacy-first browser extension that helps amplify voices supporting Iranian civil society and human rights on X (formerly Twitter).

**Part of [4iran.org](https://4iran.org)** - Tools for supporting Iran's freedom movement.

> **TL;DR:** Iran Amplifier helps you write high-quality replies on X to support Iranian civil society and human rights. No bots. No tracking. No servers. Your API key, your browser, your control. Every response is reviewed by you before posting.
>
> **Independence Disclaimer:** This is an independent, open-source project not affiliated with any political party, organization, or individual. Any similarity to other names or products is coincidental.

---

## Privacy First, Always

|                        |                                                              |
| ---------------------- | ------------------------------------------------------------ |
| **No servers**         | Your data never touches our infrastructure — there isn't any |
| **No accounts**        | No sign-up, no login, no tracking                            |
| **No data collection** | Zero analytics, zero telemetry, zero surveillance            |
| **Direct API calls**   | Your browser talks directly to OpenAI/Anthropic              |
| **Local storage only** | Settings and stats stay on your device                       |
| **Open source**        | Every line of code is auditable                              |

Your API key is stored only in your browser and sent only to the AI provider you choose. We physically cannot access it.

---

## You Control the Output

Iran Amplifier is a tool that assists you — it never posts anything automatically.

| You Decide                    | How                                             |
| ----------------------------- | ----------------------------------------------- |
| **What arguments to use**     | Select from curated talking points, or use none |
| **What policies to advocate** | Choose your call-to-actions                     |
| **The tone and style**        | Customize the style prompt                      |
| **Which AI provider**         | OpenAI or Anthropic, your choice                |
| **Which model**               | From budget-friendly to most capable            |
| **What gets posted**          | Review every response before using it           |

Every response is generated on demand, shown to you for review, and only used when you explicitly click Copy, Reply, or Quote.

**This extension does not automate posting, coordinate users, or generate identical messages.** No bots, no astroturfing — just a human (you) with better tools.

---

## Features

### Response Generation

- **One-click generation**: Click "Amplify" on any post to get contextual responses
- **Multiple variations**: Get 1-3 response options with different approaches
- **Refinement shortcuts**: Iterate with //shorter, //formal, //urgent, //stats, and more
- **Full conversation context**: AI understands the thread, quoted posts, and author profiles

### Customization

- **Arguments**: Select facts and talking points the AI can reference
- **Call-to-Actions**: Choose policy demands to advocate for when appropriate
- **Style prompt**: Fine-tune tone, perspective, and content strategy
- **Model selection**: Choose between speed, cost, and capability

### Transparency

- **Cost tracking**: See exactly what you're spending on API calls
- **Activity graph**: Track your amplification history
- **Open source**: Audit every line of code on [GitHub](https://github.com/4iranorg/amplifier-ext)

## Why Open Source?

Browser extensions have access to the websites you visit. That's a lot of trust. Here's why we made every line of code public:

- **Verify, don't trust**: Read the code yourself or ask someone you trust to audit it
- **Prove there's no tracking**: The code shows all network calls go only to your chosen AI provider
- **Confirm the mission guardrails**: See exactly how the extension prevents misuse
- **Security review**: The community can examine the code for vulnerabilities

Closed-source extensions require faith. Open source extensions can be verified.

## Try It Yourself

You don't need to be technical to try this extension. Follow these steps and you'll be up and running in about 5 minutes.

### What You'll Need

- **Firefox browser** (Chrome support coming soon)
- **An AI API key** — we'll show you how to get one below
- **5 minutes** of your time

### Step 1: Get Firefox

If you don't have Firefox installed, download it from [firefox.com](https://www.firefox.com/en-GB/). It's free and works on Windows, Mac, and Linux.

### Step 2: Download the Extension

1. Go to the [Amplifier releases page](https://github.com/4iranorg/amplifier-ext/releases)
2. Find the latest release at the top
3. Click on `amplifier-vX.X.X.zip` to download it (X.X.X is the version number)
4. Unzip the downloaded file to a folder you'll remember (like your Desktop)

### Step 3: Load It in Firefox

Since the extension isn't on the Firefox Add-ons store yet, you'll load it directly. Don't worry — this is safe and easy.

1. Open Firefox
2. Type `about:debugging` in the address bar and press Enter
3. Click **"This Firefox"** in the left sidebar
4. Click the **"Load Temporary Add-on..."** button
5. Navigate to the folder where you unzipped the extension
6. Select the `manifest.json` file and click Open

You should see "Amplifier" appear in the list of Temporary Extensions. The extension is now active.

> **Note:** "Temporary" means the extension will be removed when you close Firefox. You'll need to reload it next time. Once we publish to the Firefox Add-ons store, this won't be necessary.

### Step 4: Get an API Key

The extension needs an API key to generate responses. Before you begin, you'll need to create an API key which you'll use to securely access the AI service.

> **What is an API key?** It's like a password that lets the extension talk to the AI service on your behalf. Your key stays on your device and is never shared with anyone except the AI provider you choose.

**Option A: OpenAI (Recommended for beginners)**

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create an account or sign in with Google/Microsoft/Apple
3. Click **"Create new secret key"**
4. Give it a name (e.g., "Iran Amplifier")
5. Copy the key immediately (it starts with `sk-` and won't be shown again)
6. Go to [Billing](https://platform.openai.com/account/billing/overview) and add credit ($5 is plenty to start)

**Option B: Anthropic**

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to **API Keys** section
4. Click **"Create Key"** and copy it
5. Add credit to your account in the billing section

### Step 5: Configure the Extension

1. Click the **puzzle piece icon** in Firefox's toolbar (Extensions menu)
2. Click **Amplifier** to open its settings
3. Paste your API key into the "API Key" field
4. Select your AI provider (OpenAI or Anthropic)
5. Choose a model — **GPT-4o-mini** is recommended (fast and affordable)
6. Click **Save Settings**

### Step 6: Start Amplifying

1. Go to [x.com](https://x.com)
2. Find any post about Iran, human rights, or related topics
3. Look for the **Amplify** button in the post's action bar (next to like, repost, etc.)
4. Click it and watch the magic happen!

### What to Expect

When you click Amplify:

- A small panel appears with response options
- You'll see 1-3 suggested responses in different tones
- Click "Copy" to copy a response to your clipboard
- Or click "Reply" or "Quote" to use it directly

The responses are generated to support Iranian civil society while being factual and constructive. You can refine them with shortcuts like `//shorter` or `//formal`.

### Cost

Generating responses costs a few cents per use (paid to OpenAI or Anthropic, not us). The extension tracks your spending — click the extension icon to see your usage stats.

## Installation

### Firefox Add-ons Store

_Coming soon — see "Try It Yourself" above for manual installation_

### Chrome Web Store

_Coming soon_

## Usage

### Generating Responses

1. Find a post you want to respond to
2. Click the **Amplify** button in the post's action bar
3. Choose **Reply** or **Quote** mode
4. Review the generated responses
5. Click **Copy**, **Reply**, or **Quote** to use a response

### Refining Responses

Use the feedback input to iterate on responses:

| Shortcut     | Effect                         |
| ------------ | ------------------------------ |
| `//shorter`  | Make response more concise     |
| `//longer`   | Add more detail                |
| `//formal`   | Use professional tone          |
| `//casual`   | Use conversational tone        |
| `//urgent`   | Add urgency and call to action |
| `//stats`    | Include statistics or facts    |
| `//human`    | Focus on human rights angle    |
| `//us`       | Focus on US national interest  |
| `//policy`   | Focus on policy demands        |
| `//diaspora` | Iranian diaspora perspective   |
| `//question` | Frame as rhetorical question   |

Or type any custom instruction to refine the response.

### Viewing Activity

1. Click the extension icon
2. Click "Dashboard" to see your contribution graph
3. Track your daily amplifications and usage stats
4. Manage arguments, CTAs, and advanced settings

## Privacy & Security

See [PRIVACY.md](PRIVACY.md) for detailed information, including GDPR compliance. See [SECURITY.md](SECURITY.md) for vulnerability reporting.

**Architecture**: No servers, no middlemen. Your browser makes direct HTTPS calls to the AI provider you choose. The AI provider (OpenAI or Anthropic) may log requests according to their own privacy policies — we do not proxy, store, or inspect your API calls.

**Your API key**: Stored in browser local storage, sent only to OpenAI/Anthropic. We cannot access it.

**What we DON'T collect**: Your identity, browsing history, which posts you amplify, what you post, your location, any analytics.

**Mission guardrails**: Built-in safeguards ensure the extension can only support Iranian civil society. These cannot be bypassed through custom prompts. Examples of blocked content:

- Requests to praise or legitimize the Islamic Republic regime
- Calls for violence against any individuals or groups
- Disinformation or fabricated claims

**Remote configuration**: The extension can fetch updated arguments and call-to-actions from a remote config file. This is read-only, versioned, and limited to content data — it cannot inject code, alter permissions, or modify extension behavior.

## Threat Model

Iran Amplifier is designed to be safe for:

- **Iranian diaspora and allies** outside Iran who want to support civil society
- **Journalists, researchers, and advocates** covering Iranian human rights issues
- **Anyone** who wants to engage constructively on Iran-related topics

⚠️ **Users inside Iran should understand:**

- X itself may be monitored by Iranian authorities
- This extension does not provide anonymity or circumvention tools
- Using a VPN or Tor is recommended if personal safety is a concern
- The extension cannot protect you from platform-level surveillance

This tool amplifies your voice — it does not hide your identity.

## Compliance Notes

For platform reviewers and security auditors:

- **No automated posting**: All content requires explicit user action to post
- **No coordination**: Users operate independently; no shared accounts or synchronized activity
- **No impersonation**: Responses are clearly human-reviewed and individually posted
- **No identical messages**: Each response is uniquely generated based on context
- **Human-in-the-loop**: AI assists with drafting; humans decide what gets posted

## Development

### Project Structure

```text
amplifier/
├── manifest.json              # Extension manifest
├── package.json               # Dependencies (sass, eslint, prettier, stylelint)
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
│   │   └── landing/landing.scss  # Landing page styles
│   ├── content/
│   │   ├── content.js         # Post detection, button injection
│   │   └── content.css        # Compiled from SCSS
│   ├── background/
│   │   └── service-worker.js  # API calls, storage, orchestration
│   ├── popup/
│   │   ├── popup.html         # Quick settings UI
│   │   ├── popup.js           # Settings logic
│   │   └── popup.css          # Compiled from SCSS
│   ├── dashboard/
│   │   ├── dashboard.html     # Full settings + activity page
│   │   ├── dashboard.js       # Graph, arguments/CTAs, settings
│   │   └── dashboard.css      # Compiled from SCSS
│   ├── onboarding/
│   │   ├── onboarding.html    # First-run setup wizard
│   │   ├── onboarding.js      # Multi-step flow logic
│   │   └── onboarding.css     # Compiled from SCSS
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
│   ├── landing.css            # Compiled from SCSS
│   ├── iran.svg               # Logo
│   ├── favicon.svg            # Favicon
│   └── CNAME                  # Custom domain config
├── scripts/
│   └── release.sh             # Create release zip locally
├── .github/
│   └── workflows/
│       ├── ci.yml             # Lint, format, build checks
│       └── release.yml        # Automated releases on tag push
├── .claude/
│   ├── commands/
│   │   └── release.md         # Claude Code release skill
│   └── settings.local.json    # Claude Code permissions
├── justfile                   # Development task runner
├── .pre-commit-config.yaml    # Pre-commit hooks + CI config
├── eslint.config.js           # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .stylelintrc.json          # Stylelint configuration
├── README.md
├── CHANGELOG.md
├── PRIVACY.md
└── TERMS.md
```

### Setup

```bash
# Use correct Node version
nvm use  # reads .nvmrc

# Install dependencies and pre-commit hooks
just install
# Or manually: pnpm install && pre-commit install
```

### Development Commands

This project uses [just](https://github.com/casey/just) as a task runner:

```bash
just              # List all commands
just build        # Build CSS from SCSS
just watch        # Watch SCSS for changes
just lint         # Run eslint + stylelint
just fix          # Auto-fix linting issues
just format       # Format with Prettier
just check        # Run all checks
just pre-commit   # Run pre-commit hooks
```

### Building

The extension uses SCSS for styling. Both source and compiled CSS are tracked in the repo, so the extension works without building.

**To modify styles:**

```bash
# Build CSS once
just build

# Watch for changes during development
just watch
```

The SCSS source is in `src/styles/` and compiles to CSS files alongside the JS files.

### Releasing

Releases are automated via GitHub Actions. When you push a version tag, the workflow creates a GitHub release with the extension zip and changelog.

**To create a release:**

1. Update version in `manifest.json`
2. Update `CHANGELOG.md` with the new version's changes
3. Commit: `git commit -am "Release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`

The GitHub Action will automatically:

- Create a release zip with extension files
- Extract changelog for the version
- Create a GitHub release with the zip attached
- Mark pre-releases (0.x.x) appropriately

**Local release (manual):**

```bash
./scripts/release.sh
```

This creates a zip file you can manually upload to GitHub or submit to browser stores.

### Testing

1. Load the extension in Firefox via `about:debugging`
2. Navigate to x.com
3. Verify the Amplify button appears on posts
4. Test API integration with your key
5. Check usage stats in the popup
6. View the activity graph

## Troubleshooting

### Button not appearing on posts

- Refresh the page
- Check that the extension is enabled
- Ensure you're on x.com

### API errors

- Verify your API key is correct
- Check your API account has sufficient credits
- Try a different model

### Responses too long

- Use the `//shorter` shortcut
- Choose a different model (smaller models tend to be more concise)

### Prompt validation failed

- Ensure your custom prompt supports Iranian civil society
- Prompts that appear to support the regime will be rejected
- Reset to default prompt if needed

## Built With

This project is primarily built with [Claude Code](https://claude.com/product/claude-code), Anthropic's AI-powered coding assistant. We believe in transparency about AI's role in software development.

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## Support the Cause

This tool is built to support the Iranian people's fight for freedom. Consider also:

- Using #IranRevolution in your posts
- Contacting your representatives about Iran policy
- Contributing to the project on [GitHub](https://github.com/4iranorg/amplifier-ext)

## Related

- [4iran.org](https://4iran.org) - Main site
- [X](https://x.com) - Where the extension works
