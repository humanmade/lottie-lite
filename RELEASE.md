# Lottie Lite Release Process

This document describes the automated release process for the Lottie Lite plugin.

## Overview

The plugin uses GitHub Actions to automate version management, testing, and release asset creation:

- **PR Preview**: Every pull request gets an interactive "Try it in Playground" button for easy testing
- **Automated Testing**: Playwright tests run on every push using WordPress Playground
- **Continuous Build**: Built assets are pushed to the `release` branch on every main branch update
- **Release Automation**: When you create a GitHub release, the workflow automatically versions and packages the plugin

## PR Preview Workflow

When you open a pull request:

1. The PR preview workflow builds the plugin
2. A "Try it in Playground" button is added to the PR description
3. Reviewers can test changes in their browser without any local setup
4. The preview uses WordPress 6.8 with PHP 8.3

This makes code review and testing much easier for both developers and reviewers.

## Release Workflow

When you create a GitHub release, the workflow automatically:

1. Replaces `__VERSION__` placeholders in the plugin file with the actual version number
2. Commits the versioned file back to the tag
3. Creates a production-ready ZIP file excluding development files
4. Uploads the ZIP as a release asset

## Prerequisites

Before creating a release:

1. **Ensure `main` branch is ready**
   - All changes merged and reviewed
   - Tests passing (Playwright tests run automatically on every PR/push)
   - Build assets up to date (`npm run build`)
   - PR preview button tested by reviewers

2. **Version the release branch**
   - The `build-and-release.yml` workflow automatically pushes built assets to the `release` branch on every push to `main`
   - Verify the `release` branch has the latest built files

## Creating a Release

1. **Decide on version number** following semantic versioning:
   - **Major** (X.0.0): Breaking changes
   - **Minor** (x.Y.0): New features, backwards compatible
   - **Patch** (x.y.Z): Bug fixes, backwards compatible

2. **Create a GitHub Release**
   - Go to [Releases](https://github.com/humanmade/lottie-lite/releases) in the repository
   - Click "Draft a new release"
   - Create a new tag following the format `vX.Y.Z` (e.g., `v1.3.0`)
   - Target branch: `main`
   - Fill in release title and description
   - Click "Publish release"

3. **Automated workflow runs**
   - The `release.yml` workflow triggers automatically
   - It will:
     - Extract version from tag (e.g., `v1.3.0` → `1.3.0`)
     - Replace `__VERSION__` in `lottie-lite.php` with `1.3.0`
     - Commit changes and update the tag
     - Create a clean ZIP archive
     - Upload `lottie-lite-v1.3.0.zip` to the release

4. **Verify the release**
   - Check the release page to confirm the ZIP file is attached
   - Download and inspect the ZIP to ensure:
     - Version in plugin header is correct
     - Build assets are included
     - Development files are excluded

## What Gets Included in the ZIP

The release ZIP includes:
- `lottie-lite.php` (with version replaced)
- `build/` directory (compiled JavaScript and CSS)
- `assets/` directory

The release ZIP **excludes**:
- `.git/`, `.github/`
- `node_modules/`
- `src/` (source files)
- `tests/` (test files)
- `.wp-env/` (local WordPress environment)
- Configuration files (`.gitignore`, `package.json`, `playwright.config.js`, etc.)
- Documentation files (`README.md`, `CLAUDE.md`, `RELEASE.md`)

## Versioning Strategy

The plugin uses `__VERSION__` as a placeholder in the main plugin file:

```php
/**
 * Plugin Name: Lottie Lite
 * Version: __VERSION__
 */
```

This placeholder gets replaced with the actual version during the release workflow. This ensures:
- Single source of truth (the Git tag)
- No manual version updates required
- Consistent versioning across releases

## Troubleshooting

**Workflow fails on "Commit version changes to tag"**
- Ensure the workflow has `contents: write` permissions
- Check if the tag format is correct (`vX.Y.Z`)

**ZIP file is missing built assets**
- Ensure the `release` branch has the latest build
- Run `npm run build` locally and push to `main` if needed

**Wrong version in ZIP file**
- Verify the tag format matches `vX.Y.Z`
- Check the workflow logs for version extraction

## Manual Release (Not Recommended)

If automation fails, you can create a manual release:

1. Checkout the tag: `git checkout vX.Y.Z`
2. Replace `__VERSION__`: `sed -i 's/__VERSION__/X.Y.Z/g' lottie-lite.php`
3. Create ZIP: Follow the rsync and zip commands from `.github/workflows/release.yml`
4. Upload ZIP to the release manually

However, this should only be used as a last resort. The automated workflow is the preferred method.
