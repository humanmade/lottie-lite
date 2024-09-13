# Lottie Lite

Adds support for Lottie animations as an enhancement to the following blocks:

- Core image block
- Core cover block
- Core media & text block

Allows overlaying or replacing the image with an animation.

## Installation

1. Download the plugin from the [GitHub repository](https://github.com/humanmade/lottie-lite).
2. Upload the plugin to your site's `wp-content/plugins` directory.
3. Activate the plugin from the WordPress admin.

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
