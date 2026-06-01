<?php
/**
 * Theme updater: pull verified theme updates from GitHub Releases.
 *
 * WordPress has no native way to update a theme that does not live in the
 * wp.org directory. This class fills that gap for the Supersonic theme only:
 * it asks the GitHub Releases API for the latest `theme-vX.Y.Z` release, offers
 * it to WordPress as an available update, and verifies the downloaded zip
 * against the SHA-256 published in the release before WordPress installs it.
 *
 * The trigger to deploy lives elsewhere (the deploy controller). This class is
 * the verification + install-source layer, so a compromised trigger can still
 * only ever cause WordPress to pull the official, checksum-matched theme.
 *
 * @package Supersonic_Site_Core
 */

if (! defined('ABSPATH')) {
	exit;
}

class Supersonic_Theme_Updater {

	/**
	 * Theme directory slug this updater manages.
	 */
	const THEME_SLUG = 'supersonic-site-theme';

	/**
	 * GitHub repository in owner/name form.
	 */
	const REPO = 'SuperSonicSites/supersonic-core';

	/**
	 * Release tag prefix. Tags look like `theme-v0.1.7`.
	 */
	const TAG_PREFIX = 'theme-v';

	/**
	 * Transient key for the cached release lookup.
	 */
	const CACHE_KEY = 'supersonic_theme_latest_release';

	/**
	 * How long to cache a release lookup (seconds).
	 */
	const CACHE_TTL = 6 * HOUR_IN_SECONDS;

	/**
	 * Wire up the WordPress update hooks.
	 */
	public function register() {
		add_filter('pre_set_site_transient_update_themes', array($this, 'inject_update'));
		add_filter('upgrader_pre_download', array($this, 'guard_download'), 10, 4);
		add_filter('upgrader_source_selection', array($this, 'normalize_source_dir'), 10, 4);
	}

	/**
	 * Force a fresh release lookup on the next check.
	 */
	public function flush_cache() {
		delete_transient(self::CACHE_KEY);
	}

	/**
	 * Offer a GitHub release to WordPress when it is newer than the installed theme.
	 *
	 * @param mixed $transient The update_themes transient (object) or empty.
	 * @return mixed
	 */
	public function inject_update($transient) {
		if (! is_object($transient)) {
			$transient = new stdClass();
		}

		$theme = wp_get_theme(self::THEME_SLUG);
		if (! $theme->exists()) {
			return $transient;
		}

		$release = $this->get_latest_release();
		if (! $release) {
			return $transient;
		}

		$installed = $theme->get('Version');
		if (version_compare($release['version'], $installed, '<=')) {
			// Already current (or ahead): clear any stale offer and stop.
			if (isset($transient->response[ self::THEME_SLUG ])) {
				unset($transient->response[ self::THEME_SLUG ]);
			}
			return $transient;
		}

		$transient->response[ self::THEME_SLUG ] = array(
			'theme'       => self::THEME_SLUG,
			'new_version' => $release['version'],
			'url'         => $release['html_url'],
			'package'     => $release['zip_url'],
		);

		return $transient;
	}

	/**
	 * Verify the SHA-256 of the theme package before WordPress installs it.
	 *
	 * Runs only for our theme's package. Downloads the zip ourselves, compares
	 * its hash to the checksum published in the release, and hands WordPress a
	 * local temp file only on a match. Any mismatch or fetch error aborts the
	 * upgrade with a WP_Error.
	 *
	 * @param bool|WP_Error $reply    Whether to bail without downloading.
	 * @param string        $package  The package file URL.
	 * @param WP_Upgrader   $upgrader The upgrader instance.
	 * @param array         $hook_extra Extra args identifying the upgrade target.
	 * @return bool|string|WP_Error False to let WP handle it, a temp path, or WP_Error.
	 */
	public function guard_download($reply, $package, $upgrader = null, $hook_extra = array()) {
		// Only intervene for our own theme upgrade.
		$is_our_theme = isset($hook_extra['theme']) && self::THEME_SLUG === $hook_extra['theme'];
		if (! $is_our_theme) {
			return $reply;
		}

		$release = $this->get_latest_release();
		if (! $release || empty($release['zip_url'])) {
			return new WP_Error(
				'supersonic_no_release',
				__('Supersonic: no verified theme release is available to install.', 'supersonic-site-core')
			);
		}

		if (empty($release['sha256'])) {
			return new WP_Error(
				'supersonic_missing_checksum',
				__('Supersonic: refusing to install a theme release without a published SHA-256 checksum.', 'supersonic-site-core')
			);
		}

		if (! function_exists('download_url')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$tmp = download_url($release['zip_url']);
		if (is_wp_error($tmp)) {
			return $tmp;
		}

		$actual = hash_file('sha256', $tmp);
		$expected = strtolower(trim($release['sha256']));

		if (! hash_equals($expected, (string) $actual)) {
			wp_delete_file($tmp);
			return new WP_Error(
				'supersonic_checksum_mismatch',
				sprintf(
					/* translators: 1: expected hash, 2: actual hash */
					__('Supersonic: theme package checksum mismatch. Expected %1$s, got %2$s. Install aborted.', 'supersonic-site-core'),
					$expected,
					$actual
				)
			);
		}

		// Verified: hand WordPress the local file to unpack.
		return $tmp;
	}

	/**
	 * Ensure the unzipped folder is named after the theme slug.
	 *
	 * GitHub release zips built by our packager already use the theme slug as
	 * the top-level folder, so this is a safety net rather than a rename in the
	 * common case.
	 *
	 * @param string      $source        Unpacked source directory.
	 * @param string      $remote_source Remote/temp source directory.
	 * @param WP_Upgrader $upgrader      The upgrader instance.
	 * @param array       $hook_extra    Extra args identifying the upgrade target.
	 * @return string|WP_Error
	 */
	public function normalize_source_dir($source, $remote_source, $upgrader = null, $hook_extra = array()) {
		$is_our_theme = isset($hook_extra['theme']) && self::THEME_SLUG === $hook_extra['theme'];
		if (! $is_our_theme) {
			return $source;
		}

		$expected = trailingslashit(dirname($source)) . self::THEME_SLUG;
		$expected = trailingslashit($expected);

		if (trailingslashit($source) === $expected) {
			return $source;
		}

		global $wp_filesystem;
		if ($wp_filesystem && $wp_filesystem->move($source, $expected, true)) {
			return $expected;
		}

		return $source;
	}

	/**
	 * Look up the latest theme release from GitHub, with caching.
	 *
	 * @return array|null { version, zip_url, sha256, html_url } or null.
	 */
	public function get_latest_release() {
		$cached = get_transient(self::CACHE_KEY);
		if (is_array($cached)) {
			return $cached;
		}

		$releases = $this->fetch_releases();
		if (! is_array($releases)) {
			return null;
		}

		$best = null;
		foreach ($releases as $release) {
			if (! is_array($release) || empty($release['tag_name'])) {
				continue;
			}
			if (! empty($release['draft']) || ! empty($release['prerelease'])) {
				continue;
			}
			if (0 !== strpos($release['tag_name'], self::TAG_PREFIX)) {
				continue;
			}

			$version = substr($release['tag_name'], strlen(self::TAG_PREFIX));
			if (! preg_match('/^\d+\.\d+\.\d+$/', $version)) {
				continue;
			}

			if (null === $best || version_compare($version, $best['version'], '>')) {
				$parsed = $this->parse_release($release, $version);
				if ($parsed) {
					$best = $parsed;
				}
			}
		}

		if ($best) {
			set_transient(self::CACHE_KEY, $best, self::CACHE_TTL);
		}

		return $best;
	}

	/**
	 * Pull the release list from the GitHub API.
	 *
	 * The repository is public, so no token is required. We still send a User-Agent
	 * (GitHub requires it) and accept the v3 JSON media type.
	 *
	 * @return array|null Decoded JSON array of releases, or null on failure.
	 */
	protected function fetch_releases() {
		$url = sprintf('https://api.github.com/repos/%s/releases?per_page=20', self::REPO);

		$response = wp_remote_get($url, array(
			'timeout' => 15,
			'headers' => array(
				'Accept'     => 'application/vnd.github+json',
				'User-Agent' => 'Supersonic-Site-Core/' . self::THEME_SLUG,
			),
		));

		if (is_wp_error($response)) {
			return null;
		}

		if (200 !== (int) wp_remote_retrieve_response_code($response)) {
			return null;
		}

		$data = json_decode(wp_remote_retrieve_body($response), true);
		return is_array($data) ? $data : null;
	}

	/**
	 * Turn one GitHub release object into our normalized shape.
	 *
	 * Picks the exact theme zip asset and its exact SHA-256 sidecar asset.
	 *
	 * @param array  $release GitHub release object.
	 * @param string $version Parsed semver version.
	 * @return array|null
	 */
	protected function parse_release($release, $version) {
		$assets = isset($release['assets']) && is_array($release['assets']) ? $release['assets'] : array();
		$expected_zip_name = self::THEME_SLUG . '.zip';
		$expected_sha_name = self::THEME_SLUG . '.zip.sha256';

		$zip_assets = array();
		$sha_assets = array();
		foreach ($assets as $asset) {
			$name = isset($asset['name']) ? (string) $asset['name'] : '';
			$download = isset($asset['browser_download_url']) ? (string) $asset['browser_download_url'] : '';
			if (! $download) {
				continue;
			}
			if ($expected_zip_name === $name) {
				$zip_assets[] = $download;
			} elseif ($expected_sha_name === $name) {
				$sha_assets[] = $download;
			}
		}

		if (1 !== count($zip_assets) || 1 !== count($sha_assets)) {
			return null;
		}

		$sha256 = $this->resolve_checksum($sha_assets[0]);
		if (! $sha256) {
			return null;
		}

		return array(
			'version'  => $version,
			'zip_url'  => $zip_assets[0],
			'sha256'   => $sha256,
			'html_url' => isset($release['html_url']) ? (string) $release['html_url'] : '',
		);
	}

	/**
	 * Resolve the expected SHA-256 from the exact checksum asset.
	 *
	 * @param string $sha_url URL to the `supersonic-site-theme.zip.sha256` asset.
	 * @return string Lowercase hex digest, or '' if none found.
	 */
	protected function resolve_checksum($sha_url) {
		if ($sha_url) {
			$response = wp_remote_get($sha_url, array(
				'timeout' => 15,
				'headers' => array('User-Agent' => 'Supersonic-Site-Core/' . self::THEME_SLUG),
			));
			if (! is_wp_error($response) && 200 === (int) wp_remote_retrieve_response_code($response)) {
				$text = wp_remote_retrieve_body($response);
				if (preg_match('/[a-f0-9]{64}/i', $text, $m)) {
					return strtolower($m[0]);
				}
			}
		}

		return '';
	}
}
