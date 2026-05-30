<?php
/**
 * Supersonic Site Theme setup.
 *
 * Keep this file focused on presentation support. Site functionality belongs in
 * the Supersonic Site Core plugin.
 */

if (! defined('ABSPATH')) {
	exit;
}

add_action('after_setup_theme', 'supersonic_site_theme_setup');

function supersonic_site_theme_setup() {
	add_theme_support('wp-block-styles');
	add_theme_support('responsive-embeds');
	add_theme_support('editor-styles');
	remove_theme_support('core-block-patterns');
}

add_filter('should_load_remote_block_patterns', '__return_false');
