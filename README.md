# Lottie Lite

[![Playwright Tests](https://github.com/humanmade/lottie-lite/actions/workflows/playwright-tests.yml/badge.svg)](https://github.com/humanmade/lottie-lite/actions/workflows/playwright-tests.yml)
[![Lint](https://github.com/humanmade/lottie-lite/actions/workflows/lint.yml/badge.svg)](https://github.com/humanmade/lottie-lite/actions/workflows/lint.yml)

Adds support for Lottie animations as an enhancement to the following blocks:

- Core image block
- Core cover block
- Core media & text block

Allows overlaying or replacing the image with an animation.

[**🎮 Try it on WordPress Playground**](https://playground.wordpress.net/#eyJsYW5kaW5nUGFnZSI6Ii93cC1hZG1pbi8iLCJwcmVmZXJyZWRWZXJzaW9ucyI6eyJwaHAiOiI4LjMiLCJ3cCI6IjYuOCJ9LCJzdGVwcyI6W3sicGx1Z2luWmlwRmlsZSI6eyJyZXNvdXJjZSI6InVybCIsInVybCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9odW1hbm1hZGUvbG90dGllLWxpdGUvYXJjaGl2ZS9yZWZzL2hlYWRzL3JlbGVhc2UuemlwIn0sIm9wdGlvbnMiOnsiYWN0aXZhdGUiOnRydWV9LCJzdGVwIjoiaW5zdGFsbFBsdWdpbiJ9LHsic3RlcCI6ImxvZ2luIiwidXNlcm5hbWUiOiJhZG1pbiIsInBhc3N3b3JkIjoicGFzc3dvcmQifV19)

## Installation

1. Download the plugin from the [GitHub repository](https://github.com/humanmade/lottie-lite).
2. Upload the plugin to your site's `wp-content/plugins` directory.
3. Activate the plugin from the WordPress admin.

## Development

### Available npm Scripts

```bash
# Build production assets
npm run build

# Development watch mode
npm run start

# Format code
npm run format

# Linting
npm run lint:js        # Check JavaScript
npm run lint:css       # Check CSS
npm run lint:js:fix    # Fix JavaScript issues
npm run lint:css:fix   # Fix CSS issues

# Create distributable plugin ZIP
npm run plugin-zip

# Testing
npm run playground:start    # Start WordPress Playground server
npm run test:e2e           # Run end-to-end tests
npm run test:e2e:debug     # Run tests in debug mode
npm run test:e2e:watch     # Run tests in watch mode
```

The build process uses `@wordpress/scripts` to compile JavaScript and CSS from `src/*.js` into the `build/` directory.

### Testing

The plugin uses [Playwright](https://playwright.dev/) for end-to-end testing with [WordPress Playground](https://wordpress.github.io/wordpress-playground/).

#### Running Tests Locally

1. Start the WordPress Playground server (in one terminal):
```bash
npm run playground:start
```

2. Run the tests (in another terminal):
```bash
npm run test:e2e
```

The Playground environment runs on `http://localhost:9400` with WordPress 6.8, PHP 8.3, and auto-login enabled.

#### CI Testing

Tests run automatically on GitHub Actions using a matrix of:
- **PHP versions**: 8.3, 8.4
- **WordPress versions**: 6.7, 6.8, latest

This ensures compatibility across multiple PHP and WordPress versions.

#### Adding New Tests

Tests are located in the `tests/e2e/` directory. Here's an example test:

```javascript
const { test, expect } = require( '@playwright/test' );
const { Editor } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editor: async ( { page }, use ) => {
		await use( new Editor( { page } ) );
	},
} );

test.describe( 'Lottie Lite Plugin', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( '/wp-admin/' );
	} );

	test( 'should add Lottie Animation panel to image block', async ( {
		page,
		editor,
	} ) => {
		// Navigate to create new post
		await page.goto( '/wp-admin/post-new.php' );
		await page.getByRole( 'button', { name: 'Close' } ).click();
		await editor.openDocumentSettingsSidebar();

		// Insert an image block
		await page
			.locator( 'iframe[name="editor-canvas"]' )
			.contentFrame()
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page
			.locator( 'iframe[name="editor-canvas"]' )
			.contentFrame()
			.getByRole( 'document', { name: 'Empty block; start writing or' } )
			.fill( '/image' );
		await page
			.getByRole( 'option', { name: 'Image', exact: true } )
			.click();

		// Verify Lottie Animation panel exists
		await page
			.getByRole( 'button', { name: 'Lottie Animation Lottie Logo' } )
			.click();
		await expect( page.locator( '#tabs-3-settings-view' ) ).toContainText(
			'Lottie Animation'
		);
	} );
} );
```

For more information on writing Playwright tests, see:
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [WordPress E2E Test Utils](https://github.com/WordPress/gutenberg/tree/trunk/packages/e2e-test-utils-playwright)

### Pull Request Previews

When you open or update a pull request, a workflow automatically:
- Builds the plugin with your changes
- Generates a unique WordPress Playground link
- Adds a "Try it in Playground" button to your PR description

This allows reviewers to test your changes directly in their browser without any local setup required.

## Advanced Usage

The plugin exposes the DotLottie web player object on the enhanced blocks. This allows you to interact with the player and control the animation.

To access the player object, you can use the following JavaScript code:

```js
function doStuff(player) {
    // Do stuff with the player object
}

// Wait for the player to be ready as they may be loaded asynchronously,
// depending on the block's visibility and whether the image is lazy-loaded.
document.querySelectorAll( '[data-lottie]' ).forEach( ( element ) => {
    if ( element.lottie ) {
        doStuff( element.lottie );
    } else {
        element.addEventListener( 'lottieReady', () => {
            doStuff( element.lottie );
        } );
    }
} );
```

Full documentation for the DotLottie web player can be found here:

https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/
