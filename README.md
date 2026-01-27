# Iran Amplifier

[![CI](https://github.com/4iranorg/amplifier-ext/actions/workflows/ci.yml/badge.svg)](https://github.com/4iranorg/amplifier-ext/actions/workflows/ci.yml)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/4iranorg/amplifier-ext/main.svg)](https://results.pre-commit.ci/latest/github/4iranorg/amplifier-ext/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A privacy-first browser extension that helps amplify voices supporting Iranian civil society on X (formerly Twitter). **Part of [4iran.org](https://4iran.org)**

> **TL;DR:** Generate high-quality replies on X to support Iranian human rights. No bots. No tracking. No servers. Your API key, your browser, your control. Every response is reviewed by you before posting.
>
> **Independence Disclaimer:** This is an independent, open-source project not affiliated with any political party, organization, or individual.

## Key Principles

| Privacy                            | Control                                  |
| ---------------------------------- | ---------------------------------------- |
| No servers — direct API calls only | You choose which arguments to use        |
| No accounts or sign-ups            | You choose which policies to advocate    |
| No data collection or telemetry    | You choose the tone and style            |
| API key stays on your device       | You review every response before posting |
| Open source — fully auditable      | AI assists; you decide what gets posted  |

## Features

- **One-click generation** — Click "Amplify" on any post for contextual responses
- **Multiple variations** — Get 1-3 response options with different approaches
- **Refinement shortcuts** — Iterate with `//shorter`, `//formal`, `//urgent`, and more
- **Full context awareness** — AI understands threads, quoted posts, and author profiles
- **Customizable arguments** — Select facts and talking points the AI can reference
- **Call-to-actions** — Choose policy demands to advocate for when appropriate
- **Cost tracking** — See exactly what you're spending on API calls
- **Activity graph** — Track your amplification history

## Quick Start

1. Download the latest release from [GitHub Releases](https://github.com/4iranorg/amplifier-ext/releases)
2. Unzip and load in Firefox via `about:debugging` → "This Firefox" → "Load Temporary Add-on" → select `manifest.json`
3. Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/)
4. Click the extension icon and configure your API key
5. Find any post on X and click the **Amplify** button

## Refinement Shortcuts

| Shortcut     | Effect                         |
| ------------ | ------------------------------ |
| `//shorter`  | More concise                   |
| `//longer`   | More detail                    |
| `//formal`   | Professional tone              |
| `//casual`   | Conversational tone            |
| `//urgent`   | Add urgency and call to action |
| `//stats`    | Include statistics or facts    |
| `//human`    | Human rights angle             |
| `//us`       | US national interest angle     |
| `//policy`   | Policy demands focus           |
| `//diaspora` | Iranian diaspora perspective   |
| `//question` | Frame as rhetorical question   |

Or type any custom instruction to refine the response.

## Privacy & Security

Your browser makes direct HTTPS calls to the AI provider you choose — no middlemen, no servers. Your API key is stored locally and sent only to OpenAI/Anthropic.

Built-in mission guardrails ensure the extension can only support Iranian civil society. These cannot be bypassed through custom prompts.

See [PRIVACY.md](PRIVACY.md) for detailed information (GDPR compliant) and [SECURITY.md](SECURITY.md) for vulnerability reporting.

## For Users in Iran

This tool amplifies your voice — it does not hide your identity.

- X itself may be monitored by Iranian authorities
- This extension does not provide anonymity or circumvention tools
- Using a VPN or Tor is recommended if personal safety is a concern
- The extension cannot protect you from platform-level surveillance

## For Platform Reviewers

For security auditors and platform compliance teams:

- **No automated posting** — All content requires explicit user action
- **No coordination** — Users operate independently
- **No impersonation** — Responses are human-reviewed and individually posted
- **No identical messages** — Each response is uniquely generated based on context
- **Human-in-the-loop** — AI assists with drafting; humans decide what gets posted

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, commands, project structure, and release process.

## License

MIT License — See [LICENSE](LICENSE) for details.
