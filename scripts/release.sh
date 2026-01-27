#!/bin/bash
# Creates a release zip for the Firefox extension

set -e

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
FILENAME="amplifier-v${VERSION}.zip"

echo "Creating release: $FILENAME"

# Remove old zip if exists
rm -f "$FILENAME"

# Create zip with only the necessary files
zip -r "$FILENAME" \
  manifest.json \
  src/content/ \
  src/background/ \
  src/popup/ \
  src/dashboard/ \
  src/onboarding/ \
  src/lib/ \
  icons/ \
  PRIVACY.md \
  TERMS.md \
  -x "*.scss"

echo "Created: $FILENAME"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/4iranorg/amplifier-ext/releases/new"
echo "2. Tag: v${VERSION}"
echo "3. Title: v${VERSION}"
echo "4. Upload: $FILENAME"
echo "5. Publish release"
