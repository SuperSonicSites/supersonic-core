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

	// Sites use a logo link for identity instead of the text Site Title.
	// The core/site-logo block in the header/footer patterns needs this support
	// so the logo can be uploaded once under Appearance > Site Identity.
	add_theme_support('custom-logo', array(
		'height'      => 72,
		'width'       => 200,
		'flex-height' => true,
		'flex-width'  => true,
	));

	remove_theme_support('core-block-patterns');

	$patterns_css = 'assets/css/patterns.css';
	$patterns_css_path = get_theme_file_path($patterns_css);

	if (file_exists($patterns_css_path)) {
		add_editor_style($patterns_css);
	}

	// Navigation interaction/motion layer. Loaded only when the navigation
	// block renders on the front end, and mirrored into the editor canvas.
	$navigation_css = 'assets/css/navigation.css';
	$navigation_css_path = get_theme_file_path($navigation_css);

	if (file_exists($navigation_css_path)) {
		wp_enqueue_block_style(
			'core/navigation',
			array(
				'handle' => 'supersonic-site-navigation',
				'src'    => get_theme_file_uri($navigation_css),
				'path'   => $navigation_css_path,
				'ver'    => (string) filemtime($navigation_css_path),
			)
		);

		add_editor_style($navigation_css);
	}
}

add_filter('should_load_remote_block_patterns', '__return_false');

add_action('wp_enqueue_scripts', 'supersonic_site_theme_enqueue_styles');

function supersonic_site_theme_enqueue_styles() {
	$patterns_css = 'assets/css/patterns.css';
	$patterns_css_path = get_theme_file_path($patterns_css);

	if (file_exists($patterns_css_path)) {
		wp_enqueue_style(
			'supersonic-site-patterns',
			get_theme_file_uri($patterns_css),
			array(),
			(string) filemtime($patterns_css_path)
		);
	}
}

add_action('init', 'supersonic_site_theme_register_pattern_categories');

function supersonic_site_theme_register_pattern_categories() {
	$categories = array(
		'supersonic-headers'    => __('Supersonic Headers', 'supersonic-site-theme'),
		'supersonic-footers'    => __('Supersonic Footers', 'supersonic-site-theme'),
		'supersonic-heroes'     => __('Supersonic Heroes', 'supersonic-site-theme'),
		'supersonic-intros'     => __('Supersonic Intros', 'supersonic-site-theme'),
		'supersonic-media'      => __('Supersonic Media', 'supersonic-site-theme'),
		'supersonic-cards'      => __('Supersonic Cards', 'supersonic-site-theme'),
		'supersonic-trust'      => __('Supersonic Trust', 'supersonic-site-theme'),
		'supersonic-conversion' => __('Supersonic Conversion', 'supersonic-site-theme'),
		'supersonic-info'       => __('Supersonic Info', 'supersonic-site-theme'),
	);

	foreach ($categories as $name => $label) {
		register_block_pattern_category($name, array('label' => $label));
	}
}
