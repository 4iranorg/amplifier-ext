# Release

Create a new release of the Iran Amplifier extension.

## Instructions

Help the user release a new version of the extension. Follow these steps:

### 1. Check prerequisites

- Run `git status` to check for uncommitted changes
- If there are uncommitted changes, ask if they should be included in this release

### 2. Determine version

- Read current version from `manifest.json`
- Ask user what type of release:
  - **patch** (0.1.0 → 0.1.1): Bug fixes
  - **minor** (0.1.0 → 0.2.0): New features
  - **major** (0.1.0 → 1.0.0): Breaking changes
- Calculate the new version number

### 3. Update CHANGELOG.md

- Ask user for a summary of changes (or offer to generate from recent commits)
- Add a new section at the top of CHANGELOG.md with format:

  ```markdown
  ## [X.Y.Z] - YYYY-MM-DD

  ### Added

  - ...

  ### Changed

  - ...

  ### Fixed

  - ...
  ```

- Only include sections (Added/Changed/Fixed/Removed) that have content

### 4. Update version files

- Update `"version"` in `manifest.json`
- Update `"version"` in `package.json`

### 5. Commit and tag

- Stage changes: `git add manifest.json package.json CHANGELOG.md`
- Include any other uncommitted changes the user confirmed
- Commit with message: `Release vX.Y.Z`
- Create version tag: `git tag vX.Y.Z`
- Update `latest` tag: `git tag -f latest`

### 6. Push

- Ask user to confirm before pushing
- Push commits: `git push`
- Push version tag: `git push origin vX.Y.Z`
- Force push `latest` tag: `git push -f origin latest`

### 7. Confirm

- Tell user the GitHub Action will now create the release automatically
- Provide link: <https://github.com/4iranorg/amplifier-ext/releases>

## Notes

- The GitHub Action at `.github/workflows/release.yml` automatically creates the release
- It extracts changelog content for the version from CHANGELOG.md
- Pre-releases (0.x.x) are automatically marked as such
