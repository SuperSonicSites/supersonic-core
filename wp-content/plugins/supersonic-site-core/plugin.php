<?php
/**
 * Plugin Name: Supersonic Site Core
 * Plugin URI: https://github.com/SuperSonicSites/supersonic-core
 * Description: Site-core plugin for functionality that should survive theme changes. Ships the verified theme auto-update layer.
 * Version: 0.1.8
 * Requires at least: 7.0
 * Tested up to: 7.0
 * Requires PHP: 8.0
 * Author: SuperSonic Sites
 * Text Domain: supersonic-site-core
 */

if (! defined('ABSPATH')) {
	exit;
}

define('SUPERSONIC_SITE_CORE_VERSION', '0.1.8');
define('SUPERSONIC_SITE_CORE_DIR', plugin_dir_path(__FILE__));

require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-theme-updater.php';
require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-deploy-role.php';
require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-content-role.php';
require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-deploy-controller.php';

/**
 * Boot the theme auto-update layer: verified GitHub-release updater plus the
 * authenticated "check now" deploy endpoint.
 */
function supersonic_site_core_boot() {
	$updater = new Supersonic_Theme_Updater();
	$updater->register();

	$controller = new Supersonic_Deploy_Controller($updater);
	$controller->register();
}
add_action('init', 'supersonic_site_core_boot');

/**
 * On activation, create the least-privilege deploy and content-editor roles.
 */
function supersonic_site_core_activate() {
	require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-deploy-role.php';
	require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-content-role.php';
	Supersonic_Deploy_Role::add_role();
	Supersonic_Content_Role::add_role();
}
register_activation_hook(__FILE__, 'supersonic_site_core_activate');

/**
 * On deactivation, remove the deploy and content-editor roles.
 */
function supersonic_site_core_deactivate() {
	require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-deploy-role.php';
	require_once SUPERSONIC_SITE_CORE_DIR . 'includes/class-supersonic-content-role.php';
	Supersonic_Deploy_Role::remove_role();
	Supersonic_Content_Role::remove_role();
}
register_deactivation_hook(__FILE__, 'supersonic_site_core_deactivate');
