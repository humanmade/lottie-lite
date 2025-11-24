# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lottie Lite is a WordPress plugin that extends core image blocks (Image, Cover, Media & Text) with support for Lottie animations. The plugin allows overlaying or replacing images with Lottie animations, with responsive breakpoints and interactive triggers.

## Build Commands

```bash
# Build production assets
npm run build

# Development watch mode
npm run start

# Linting
npm run lint:js
npm run lint:css --fix

# Format code
npm run format
```

The build process uses `@wordpress/scripts` to compile JavaScript and CSS from `src/*.js` into the `build/` directory. Three entry points are compiled:
- `src/editor.js` → `build/editor.js` (Block editor interface)
- `src/lottie.js` → `build/lottie.js` (Frontend runtime)
- `src/media-view.js` → `build/media-view.js` (WordPress media library integration)

## Testing

The plugin uses Playwright for end-to-end testing with WordPress Playground.

```bash
# Start WordPress Playground server (local development)
npm run playground:start

# Run e2e tests (in another terminal)
npm run test:e2e

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in watch mode
npm run test:e2e:watch
```

WordPress Playground runs on `http://localhost:9400` with:
- WordPress 6.8
- PHP 8.3
- Auto-login as admin/password
- Debug mode enabled

The environment is configured via `blueprint.json` which defines:
- WordPress and PHP versions
- Auto-login credentials
- Theme installation (twentytwentyfour)
- Plugin activation
- Debug constants

Test files are in `tests/e2e/` and use Playwright Test with `@wordpress/e2e-test-utils-playwright`.

### Blueprint Configuration

The `blueprint.json` file defines the WordPress Playground environment:
- `preferredVersions`: WordPress and PHP versions
- `steps`: Array of setup actions (login, install plugins/themes, set config)
- `landingPage`: Default page to load

Modify the blueprint to change the test environment configuration.

## CI/CD Pipeline

GitHub Actions workflows automate testing and releases:

### Playwright Tests (`.github/workflows/playwright-tests.yml`)
- Triggers on push/PR to main, master, or develop branches
- Builds the plugin and runs Playwright e2e tests
- Uses WordPress Playground CLI on port 9400
- Configured via `blueprint.json` for consistent environments
- Uploads test results and failure artifacts
- Posts test summaries as PR comments

### PR Preview (`.github/workflows/pr-preview.yml`)
- Triggers when PRs are opened or updated
- Adds an interactive "Try it in Playground" button to PR descriptions
- Allows reviewers to test changes directly in their browser
- No local setup required
- Uses WordPress 6.8 with PHP 8.3

### Build & Release (`.github/workflows/build-and-release.yml`)
- Triggers on push to main branch
- Builds production assets via `npm run build`
- Merges compiled assets to `release` branch
- The `release` branch contains only production-ready files (excludes src, tests, node_modules)

Files excluded from release builds are defined in `.gitattributes`.

### Version and Release (`.github/workflows/release.yml`)
- Triggers when a GitHub release is created
- Extracts version from the release tag (e.g., `v1.3.0` → `1.3.0`)
- Replaces `__VERSION__` placeholder in `lottie-lite.php` with actual version
- Commits the versioned file back to the tag
- Creates a clean ZIP archive excluding development files
- Uploads the ZIP as a release asset

## Release Process

The plugin uses `__VERSION__` as a placeholder in `lottie-lite.php` that gets replaced during releases:

```php
/**
 * Version: __VERSION__
 */
```

To create a new release:

1. Ensure all changes are merged to `main` branch
2. Create a new GitHub release with a version tag (e.g., `v1.3.0`)
3. The release workflow automatically:
   - Replaces `__VERSION__` with `1.3.0` in the plugin file
   - Updates the tag to include the versioned file
   - Creates a distributable ZIP file
   - Attaches the ZIP to the release

The versioned ZIP file will contain only production files (build artifacts, PHP files) without development files (src, tests, node_modules, etc.).

## Architecture

### Three-Part System

1. **Editor (`src/editor.js`)**: Block editor integration using WordPress Hooks API
   - Extends core blocks by filtering `editor.BlockEdit` and `blocks.registerBlockType`
   - Adds `lottie` attribute object to supported blocks (core/image, core/cover, core/media-text)
   - Provides Inspector Controls panel for configuring animations with breakpoints
   - Uses `@lottiefiles/dotlottie-web` for preview rendering in editor

2. **Frontend Runtime (`src/lottie.js`)**: Client-side animation handler
   - Scans for `[data-lottie]` elements on page load
   - Implements responsive breakpoint switching based on viewport width
   - Uses IntersectionObserver for lazy loading and performance optimization
   - Manages DotLottie player lifecycle (freeze/unfreeze when out of view)
   - Handles user interaction triggers (click, hover) and reduced motion accessibility

3. **Media Library Integration (`src/media-view.js`)**: WordPress media modal enhancements
   - Extends `wp.media.view.Attachment.Library` and `wp.media.view.Attachment.Details`
   - Renders Lottie previews in media grid and detail views
   - Manages DotLottie instance lifecycle in Backbone views

### PHP Backend (`lottie-lite.php`)

- Enqueues scripts and styles via WordPress hooks
- Filters `render_block` to inject `data-lottie` attribute with configuration JSON
- Extends WordPress mime type support for `.lottie` (zip) and `.json` files
- Processes attachment metadata to detect Lottie files and extract dimensions
- Manages conditional script loading (only enqueues when blocks use Lottie)

### Block Attributes Schema

The `lottie` attribute added to supported blocks contains:
```javascript
{
  breakpoints: [
    {
      file: number,      // WordPress attachment ID
      src: string,       // Animation URL
      minWidth: number,  // Viewport width threshold
      width: number,     // Intrinsic width (populated server-side)
      height: number     // Intrinsic height (populated server-side)
    }
  ],
  trigger: '' | 'click' | 'hover',  // Interaction mode
  overlay: boolean,                  // Overlay vs replace image
  loop: boolean,                     // Animation looping
  bounce: boolean,                   // Reverse playback mode
  reducedMotionFallback: 'no-change' | 'show-first-frame' | 'show-last-frame' | 'hide'
}
```

### Responsive Breakpoint System

Breakpoints are sorted by `minWidth` (ascending) and evaluated on viewport resize. The largest breakpoint where `minWidth < window.innerWidth` wins. This allows art direction: different animations at different screen sizes.

### Animation Lifecycle

Frontend runtime (`src/lottie.js`):
1. Parse `data-lottie` JSON from block wrapper
2. Create canvas element, append to image parent
3. Use IntersectionObserver to defer initialization until in-viewport
4. Handle lazy-loaded images (wait for visibility before creating player)
5. Responsive: Listen to window resize, destroy/recreate player when breakpoint changes
6. Accessibility: Check `prefers-reduced-motion` and apply configured fallback

### Cover Block Special Handling

Cover blocks (`core/cover`) require special treatment:
- Use `layout: { fit: 'cover', align: [0.5, 0.5] }` for DotLottie config
- Don't set `aspectRatio` on canvas (let it fill container)
- Manually set canvas dimensions from getBoundingClientRect
- Apply z-index layering (canvas z-index: 0, inner-container z-index: 1)

### File Type Support

The plugin accepts two Lottie formats:
- `.lottie` files (DotLottie format, ZIP-based)
- `.json` files (original Lottie JSON format)

Detection logic in PHP:
- `.lottie` extension → set `isLottie: true` in attachment metadata
- `.json` files → inspect content for Lottie signature properties (`v`, `w`, `h`, `fr`)

### WordPress Integration Points

- **Block Registration**: `blocks.registerBlockType` filter adds attributes
- **Block Rendering**: `render_block` filter injects configuration
- **Asset Loading**: Scripts/styles registered per block, enqueued conditionally
- **Media Upload**: `upload_mimes`, `mime_types`, `ext2type` filters enable file types
- **Attachment Metadata**: `wp_prepare_attachment_for_js`, `wp_generate_attachment_metadata` filters

## Working with This Codebase

### Adding a New Supported Block

1. Add block name to `SUPPORTED_BLOCKS` array in `src/editor.js`
2. Test that Inspector Controls appear and attributes save correctly
3. Consider if block needs special CSS handling (like Cover block)

### Modifying Animation Behavior

Frontend behavior is in `src/lottie.js`. Key areas:
- Line 5-237: Main initialization loop for all `[data-lottie]` elements
- Line 16-64: Reduced motion accessibility handling
- Line 100-133: IntersectionObserver for lazy loading
- Line 146-228: `setAnimation()` function handles breakpoint switching
- Line 204-219: Interaction trigger handlers (click, hover)

### Changing Editor UI

Inspector Controls panel in `src/editor.js`:
- Line 56-342: `LottieAnimationPanel` higher-order component
- Line 199-313: Breakpoint list with MediaUpload and RangeControl
- Line 81-103: Interaction mode SelectControl
- Line 104-131: Reduced motion fallback SelectControl

### Version Bumping

Version number is in `lottie-lite.php` header comment (line 5). WordPress uses this for update detection.
