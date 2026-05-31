<?php
/**
 * Least-privilege deploy role.
 *
 * Creates a `supersonic_deployer` role whose only meaningful power is to update
 * themes through the deploy endpoint. The GitHub Actions workflow authenticates
 * as a user with this role (via an application password), so the credential
 * stored in CI cannot administer the site, edit content, or manage users.
 *
 * Capabilities are intentionally minimal:
 * - read            : required for a usable WordPress user.
 * - update_themes   : gates the deploy endpoint and the upgrader.
 *
 * The role is (re)created on plugin activation and removed on deactivation.
 *
 * @package Supersonic_Site_Core
 */

if (! defined('ABSPATH')) {
	exit;
}

class Supersonic_Deploy_Role {

	const ROLE = 'supersonic_deployer';

	/**
	 * Capabilities granted to the deploy role.
	 *
	 * @return array<string,bool>
	 */
	public static function capabilities() {
		return array(
			'read'          => true,
			'update_themes' => true,
		);
	}

	/**
	 * Create (or refresh) the deploy role. Safe to call repeatedly.
	 */
	public static function add_role() {
		// remove_role is a no-op if it does not exist; this keeps caps in sync.
		remove_role(self::ROLE);
		add_role(
			self::ROLE,
			__('Supersonic Deployer', 'supersonic-site-core'),
			self::capabilities()
		);
	}

	/**
	 * Remove the deploy role on deactivation.
	 */
	public static function remove_role() {
		remove_role(self::ROLE);
	}
}
