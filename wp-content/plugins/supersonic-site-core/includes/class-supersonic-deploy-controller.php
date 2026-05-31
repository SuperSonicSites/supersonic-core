<?php
/**
 * Deploy controller: the authenticated "check for updates now" trigger.
 *
 * Exposes a single REST route that forces an immediate theme update check and,
 * if a newer verified release exists, installs it. The route accepts NO payload
 * and carries no code: it only tells WordPress to pull the official,
 * checksum-verified theme via Supersonic_Theme_Updater. This keeps the deploy
 * trigger low-authority by design.
 *
 * Security posture:
 * - Requires authentication with the `update_themes` capability.
 * - Staging-only in practice (production is deployed manually by the owner).
 * - No request body is read, so a leaked credential cannot smuggle a package.
 *
 * @package Supersonic_Site_Core
 */

if (! defined('ABSPATH')) {
	exit;
}

class Supersonic_Deploy_Controller {

	const NAMESPACE = 'supersonic/v1';
	const ROUTE = '/check-updates';

	/**
	 * @var Supersonic_Theme_Updater
	 */
	protected $updater;

	/**
	 * @param Supersonic_Theme_Updater $updater Shared updater instance.
	 */
	public function __construct(Supersonic_Theme_Updater $updater) {
		$this->updater = $updater;
	}

	/**
	 * Register the REST route.
	 */
	public function register() {
		add_action('rest_api_init', array($this, 'register_routes'));
	}

	public function register_routes() {
		register_rest_route(self::NAMESPACE, self::ROUTE, array(
			'methods'             => 'POST',
			'callback'            => array($this, 'handle_check_updates'),
			'permission_callback' => array($this, 'check_permission'),
			'args'                => array(), // No accepted parameters by design.
		));
	}

	/**
	 * Only authenticated callers who can update themes may trigger a deploy.
	 *
	 * @return bool|WP_Error
	 */
	public function check_permission() {
		if (! is_user_logged_in()) {
			return new WP_Error(
				'supersonic_not_authenticated',
				__('Authentication required.', 'supersonic-site-core'),
				array('status' => 401)
			);
		}

		if (! current_user_can('update_themes')) {
			return new WP_Error(
				'supersonic_forbidden',
				__('You are not allowed to trigger theme updates.', 'supersonic-site-core'),
				array('status' => 403)
			);
		}

		return true;
	}

	/**
	 * Force a fresh update check and install a newer verified release if present.
	 *
	 * @return WP_REST_Response
	 */
	public function handle_check_updates() {
		$this->load_upgrader_dependencies();

		// Drop caches so we see the just-published release immediately.
		$this->updater->flush_cache();
		delete_site_transient('update_themes');

		$theme = wp_get_theme(Supersonic_Theme_Updater::THEME_SLUG);
		$current = $theme->exists() ? $theme->get('Version') : null;

		$release = $this->updater->get_latest_release();
		if (! $release) {
			return new WP_REST_Response(array(
				'status'          => 'no_release',
				'message'         => 'No verified theme release was found.',
				'current_version' => $current,
			), 200);
		}

		// Nothing to do if we are already current.
		if ($current && version_compare($release['version'], $current, '<=')) {
			return new WP_REST_Response(array(
				'status'          => 'up_to_date',
				'current_version' => $current,
				'latest_version'  => $release['version'],
			), 200);
		}

		// Re-seed the update transient so the upgrader sees the offer.
		wp_update_themes();

		$skin = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Theme_Upgrader($skin);
		$result = $upgrader->upgrade(Supersonic_Theme_Updater::THEME_SLUG);

		$errors = $skin->get_errors();
		if (is_wp_error($errors) && $errors->has_errors()) {
			return new WP_REST_Response(array(
				'status'          => 'error',
				'message'         => $errors->get_error_message(),
				'current_version' => $current,
				'target_version'  => $release['version'],
			), 500);
		}

		if (false === $result || null === $result || is_wp_error($result)) {
			$message = is_wp_error($result) ? $result->get_error_message() : 'Theme upgrade did not complete.';
			return new WP_REST_Response(array(
				'status'          => 'error',
				'message'         => $message,
				'current_version' => $current,
				'target_version'  => $release['version'],
			), 500);
		}

		// Confirm the installed version after upgrade.
		$updated = wp_get_theme(Supersonic_Theme_Updater::THEME_SLUG);
		$new_version = $updated->exists() ? $updated->get('Version') : null;

		return new WP_REST_Response(array(
			'status'           => 'updated',
			'previous_version' => $current,
			'current_version'  => $new_version,
		), 200);
	}

	/**
	 * Load the WordPress upgrader classes used during a REST request.
	 */
	protected function load_upgrader_dependencies() {
		if (! function_exists('wp_update_themes')) {
			require_once ABSPATH . 'wp-includes/update.php';
		}
		if (! class_exists('WP_Upgrader')) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		}
		if (! class_exists('WP_Ajax_Upgrader_Skin')) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
		}
		if (! function_exists('request_filesystem_credentials')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if (! function_exists('show_message')) {
			require_once ABSPATH . 'wp-admin/includes/misc.php';
		}
	}
}
