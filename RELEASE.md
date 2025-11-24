# Lottie Lite Release Process

This document describes the automated release process for the Lottie Lite plugin.

## Overview

The plugin uses GitHub Actions to automate version management, testing, and release asset creation:

- **PR Preview**: Every pull request gets an interactive "Try it in Playground" button for easy testing
- **Automated Testing**: Playwright tests run on every push using WordPress Playground
- **Continuous Build**: Built assets are pushed to the `release` branch on every main branch update
- **Release Automation**: When you create a GitHub release, the workflow automatically versions and packages the plugin

## PR Preview Workflow

The plugin uses a two-stage PR preview system for security and compatibility with fork PRs:

### How It Works

1. **Build Stage** (`pr-playground-preview-build.yml`):
   - Runs when a PR is opened or updated
   - Has read-only permissions (safe for external contributions)
   - Checks out code, installs dependencies, and builds the plugin
   - Creates a distributable ZIP excluding development files
   - Uploads the ZIP as a workflow artifact

2. **Publish Stage** (`pr-playground-preview-publish.yml`):
   - Triggers automatically when the build completes successfully
   - Has write permissions to expose artifacts and update PR descriptions
   - Downloads the artifact and publishes it to a draft release
   - Automatically publishes the draft release as a pre-release (first time only)
   - Generates a Playground blueprint with the plugin URL
   - Adds a "Try it in Playground" button to the PR description

3. **Testing**:
   - Reviewers click the button to test changes in their browser
   - No local setup required
   - Uses WordPress 6.8 with PHP 8.3

### Automatic Setup

The workflow automatically handles the one-time setup:
- The first time a PR is created, the workflow creates a draft release named `playground-builds`
- The workflow automatically publishes this as a pre-release
- Future PRs work immediately with no manual intervention required

The preview button will work right away for all PRs.

### Why Two Workflows?

This separation is required for security when accepting PRs from forks:
- Fork PRs cannot access repository secrets or write permissions
- The build workflow runs untrusted code with minimal permissions
- The publish workflow only runs trusted code with elevated permissions
- This pattern allows safe PR previews from any contributor

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
