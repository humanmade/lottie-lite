<?php
/**
 * Plugin Name: Lottie Lite
 * Description: Extends image blocks with support for Lottie Animations.
 * Version: 1.2.2
 * Author: Human Made Limited
 * Author URI: https://humanmade.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: lottie-lite
 * Domain Path: /languages
 */

namespace LottieLite;

use WP_HTML_Tag_Processor;

add_action( 'enqueue_block_editor_assets', function() : void {
	$asset = require __DIR__ . '/build/editor.asset.php';
	wp_enqueue_script(
		'lottie-lite-admin',
		plugins_url( 'build/editor.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version']
	);
	wp_enqueue_style(
		'lottie-lite-admin',
		plugins_url( 'build/editor.css', __FILE__ ),
		[],
		$asset['version']
	);
} );

add_action( 'wp_enqueue_media', function() : void {
	$asset = require __DIR__ . '/build/media-view.asset.php';
	wp_enqueue_script(
		'lottie-lite-media-view',
		plugins_url( 'build/media-view.js', __FILE__ ),
		array_merge( [ 'media-views' ], $asset['dependencies'] ),
		$asset['version'],
	);
} );

add_action( 'wp_enqueue_scripts', function() : void {
	$asset = require __DIR__ . '/build/lottie.asset.php';
	wp_register_script(
		'lottie-lite',
		plugins_url( 'build/lottie.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		[
			'strategy' => 'async',
			'in_footer' => true,
		]
	);
} );

add_action( 'init', function () {
	$asset = require __DIR__ . '/build/lottie.asset.php';
	wp_enqueue_block_style(
		'core/image',
		[
			'handle' => 'lottie-lite',
			'src' => plugins_url( 'build/lottie.css', __FILE__ ),
			'version' => $asset['version'],
		]
	);
} );

/**
 * Filters the content of a single block.
 *
 * @param string $block_content The block content.
 * @param array $block The parsed block.
 * @return string The block content.
 */
add_filter( 'render_block', function( string $block_content, array $block ) : string {
	if ( empty( $block['attrs']['lottie'] ) || empty( $block['attrs']['lottie']['breakpoints'] ) ) {
		return $block_content;
	}

	// Only enqueue if we have a lottie file.
	wp_enqueue_script( 'lottie-lite' );

	usort( $block['attrs']['lottie']['breakpoints'], function ( $a, $b ) {
		return $a['minWidth'] <=> $b['minWidth'];
	} );

	foreach ( $block['attrs']['lottie']['breakpoints'] as $i => $breakpoint ) {
		$metadata = wp_get_attachment_metadata( $breakpoint['file'] );
		if ( isset( $metadata['width'] ) && $metadata['height'] ) {
			$block['attrs']['lottie']['breakpoints'][ $i ]['width'] = $metadata['width'];
			$block['attrs']['lottie']['breakpoints'][ $i ]['height'] = $metadata['height'];
		}
	}

	$data = wp_parse_args( $block['attrs']['lottie'], [
		'id' => 'lottie-' . wp_generate_uuid4(),
	] );

	$block = new WP_HTML_Tag_Processor( $block_content );
	if ( $block->next_tag() ) {
		$block->set_attribute( 'data-lottie', wp_json_encode( $data ) );
	}

	return (string) $block;
}, 10, 2 );

/**
 * Adds .lottie file extension to the list of allowed file types in WordPress.
 *
 * @param array $mime_types List of allowed mime types.
 * @return array Updated list of allowed mime types.
 */
add_filter( 'upload_mimes', function( $mime_types ) {
	$mime_types['json'] = 'text/plain'; // This is needed to allow uploading the file type.
	$mime_types['lottie'] = 'application/zip';
	return $mime_types;
} );
add_filter( 'mime_types', function( $mime_types ) {
	$mime_types['json'] = 'text/plain';
	$mime_types['lottie'] = 'application/zip';
	return $mime_types;
} );
add_filter( 'ext2type', function( $types ) {
	$types['archive'][] = 'lottie';
	$types['code'][] = 'json';
	return $types;
} );

/**
 * Filters the attachment data prepared for JavaScript.
 *
 * @param array       $response   Array of prepared attachment data. See {@see wp_prepare_attachment_for_js()}.
 * @param \WP_Post    $attachment Attachment object.
 * @param array|false $meta       Array of attachment meta data, or false if there is none.
 * @return array Array of prepared attachment data. See {@see wp_prepare_attachment_for_js()}.
 */
add_filter( 'wp_prepare_attachment_for_js', function( array $response, \WP_Post $attachment, $meta ) : array {
	$ext = pathinfo( $response['url'], PATHINFO_EXTENSION );

	if ( $ext === 'lottie' ) {
		$response['isLottie'] = true;
	}

	if ( ! empty( $meta['isLottie'] ) ) {
		$response['isLottie'] = true;
	}

	return $response;
}, 10, 3 );

/**
 * Filters the generated attachment meta data.
 *
 * @param array  $metadata      An array of attachment meta data.
 * @param int    $attachment_id Current attachment ID.
 * @return array An array of attachment meta data.
 */
add_filter( 'wp_generate_attachment_metadata', function( array $metadata, int $attachment_id ) : array {
	$file = get_attached_file( $attachment_id );
	$ext = pathinfo( $file, PATHINFO_EXTENSION );

	if ( $ext === 'json' ) {
		$json_content = file_get_contents( $file );
		$json_data = json_decode( $json_content );

		if ( is_object( $json_data ) && property_exists( $json_data, 'v' ) && property_exists( $json_data, 'w' ) && property_exists( $json_data, 'h' ) && property_exists( $json_data, 'fr' ) ) {
			$metadata['isLottie'] = true;
			$metadata['width'] = absint( $json_data->w );
			$metadata['height'] = absint( $json_data->h );
		}

		// Ensure correct mime type is set after our text/plain hack.
		wp_update_post( [
			'ID' => $attachment_id,
			'post_mime_type' => 'application/json',
		] );
	}

	if ( $ext === 'lottie' ) {
		$metadata['isLottie'] = true;
	}

	return $metadata;
}, 10, 3  );
