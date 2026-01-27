# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Iran Amplifier, please report it responsibly.

### How to Report

**Email:** <security@4iran.org>

**Or:** Open a [GitHub Security Advisory](https://github.com/4iranorg/amplifier/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 7 days
- **Resolution timeline:** Depends on severity, typically 30-90 days

### Scope

**In scope:**

- Code execution vulnerabilities
- Data leakage (API keys, user data)
- Authentication/authorization bypasses
- Cross-site scripting (XSS) in extension UI
- Prompt injection that bypasses mission guardrails
- Privacy violations

**Out of scope:**

- Social engineering attacks
- Physical access attacks
- Denial of service
- Issues in third-party dependencies (report to upstream)
- Vulnerabilities in OpenAI/Anthropic APIs

## Security Model

### Architecture

Iran Amplifier is designed with a minimal attack surface:

- **No backend servers**: All processing happens locally in your browser
- **No accounts**: Nothing to compromise
- **Direct API calls**: Your browser talks directly to OpenAI/Anthropic
- **Local storage only**: Sensitive data never leaves your device

### Data Flow

```text
User → Extension (local) → AI Provider API
         ↓
    browser.storage.local (API key, settings)
```

### Sensitive Data

| Data                | Storage               | Exposure                        |
| ------------------- | --------------------- | ------------------------------- |
| API key             | browser.storage.local | Sent only to chosen AI provider |
| Settings            | browser.storage.local | Never transmitted               |
| Usage stats         | browser.storage.local | Never transmitted               |
| Generated responses | Memory only           | Discarded on page refresh       |

### Permissions

The extension requests minimal permissions:

- `activeTab`: Access current tab only when user clicks extension
- `storage`: Store settings locally
- `*://*.x.com/*`: Inject UI on X only

### Mission Guardrails

The extension includes hardcoded guardrails that:

- Ensure generated content supports Iranian civil society
- Block attempts to generate regime-supportive content
- Cannot be bypassed through user prompts
- Are enforced at the prompt level before API calls

## Secure Development

### Code Review

- All changes require PR review
- Security-sensitive changes require additional scrutiny
- Pre-commit hooks enforce linting and formatting

### Dependencies

- Minimal dependencies (sass, eslint, prettier, stylelint - dev only)
- No runtime dependencies
- Regular dependency updates via Dependabot

### Build Process

- Reproducible builds
- Source and compiled assets both tracked in git
- Release artifacts built via GitHub Actions

## Acknowledgments

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be acknowledged here (with permission).
