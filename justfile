# Iran Amplifier development commands
# Run `just --list` to see all available commands

# Default command: list available commands
default:
    @just --list

# Install dependencies and pre-commit hooks
install:
    pnpm install
    pre-commit install

# Build CSS from SCSS (for development with unbundled source)
build-css:
    pnpm run build:css

# Build bundled extension to dist/
build:
    pnpm run build

# Build bundled extension with sourcemaps for debugging
build-dev:
    pnpm run build:dev

# Watch SCSS for changes and rebuild
watch:
    pnpm run watch:css

# Watch and rebuild bundled JS (for development)
watch-js:
    pnpm run build:watch

# Run all linters (eslint + stylelint)
lint:
    pnpm run lint
    pnpm run lint:css

# Auto-fix all linting issues
fix:
    pnpm run lint:fix
    pnpm run lint:css:fix

# Format all files with Prettier
format:
    pnpm run format

# Check formatting without making changes
format-check:
    pnpm run format:check

# Run all checks (lint + format check)
check:
    pnpm run lint
    pnpm run lint:css
    pnpm run format:check

# Run pre-commit hooks on all files
pre-commit:
    pre-commit run --all-files

# Build and check everything
all: build check

# Clean generated files
clean:
    rm -f src/content/content.css
    rm -f src/popup/popup.css
    rm -f src/dashboard/dashboard.css
    rm -f src/onboarding/onboarding.css
    rm -f docs/landing.css
    rm -rf dist/

# Rebuild from scratch
rebuild: clean build

# Show current version from manifest.json
version:
    @grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/v\1/'

# Create release zip for manual upload
release-zip:
    ./scripts/release.sh

# Verify ready for release (clean status, all checks pass)
release-check:
    #!/usr/bin/env bash
    set -e
    echo "Checking git status..."
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠ Uncommitted changes found:"
        git status --short
        exit 1
    fi
    echo "✓ Working directory clean"
    echo ""
    echo "Running all checks..."
    just all
    echo ""
    echo "✓ Ready for release!"
    just version
