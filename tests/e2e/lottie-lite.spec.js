const { test, expect } = require( '@playwright/test' );
const { Editor } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editor: async ( { page }, use ) => {
		await use( new Editor( { page } ) );
	},
} );

test.describe( 'Lottie Lite Plugin', () => {
	test.beforeEach( async ( { page } ) => {
		// Navigate to the WordPress admin
		await page.goto( '/wp-admin/' );
	} );

	test( 'should be activated', async ( { page } ) => {
		// Navigate to plugins page
		await page.goto( '/wp-admin/plugins.php' );

		// Check if Lottie Lite plugin is in the list
		const pluginRow = page.locator(
			'tr[data-plugin="lottie-lite/lottie-lite.php"]'
		);
		await expect( pluginRow ).toBeVisible();

		// Verify the plugin is active
		const deactivateLink = pluginRow.locator( 'a:has-text("Deactivate")' );
		await expect( deactivateLink ).toBeVisible();
	} );

	test( 'should add Lottie Animation panel to image block', async ( {
		page,
		editor,
	} ) => {
		await page.goto( '/wp-admin/' );
		await page.getByRole( 'link', { name: 'Posts', exact: true } ).click();
		await page
			.locator( '#wpbody-content' )
			.getByRole( 'link', { name: /Add (New )?Post/ } )
			.click();
		await page.getByRole( 'button', { name: 'Close' } ).click();
		await editor.openDocumentSettingsSidebar();
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
		await page
			.getByRole( 'button', { name: 'Lottie Animation Lottie Logo' } )
			.click();
		await expect( page.locator( '#tabs-3-settings-view' ) ).toContainText(
			'Lottie Animation'
		);
	} );

	// @TODO complete tests once #10 is addressed.
	test.skip( 'should support .lottie and .json file uploads', async ( {
		page,
	} ) => {
		// Navigate to media library
		await page.goto( '/wp-admin/upload.php' );

		// Verify page loaded
		const mediaLibraryTitle = page.locator(
			'h1:has-text("Media Library")'
		);
		await expect( mediaLibraryTitle ).toBeVisible();

		// This test verifies the page loads correctly
		// Actual file upload testing would require sample Lottie files.
	} );
} );
