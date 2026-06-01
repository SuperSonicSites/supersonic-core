<?php
/**
 * Fixture tests for Supersonic_Theme_Updater release asset parsing.
 *
 * These run without WordPress by exercising the protected parser through a
 * test subclass and stubbing checksum resolution.
 */

define('ABSPATH', dirname(__DIR__) . DIRECTORY_SEPARATOR);
define('HOUR_IN_SECONDS', 3600);

require_once ABSPATH . 'wp-content/plugins/supersonic-site-core/includes/class-supersonic-theme-updater.php';

class Supersonic_Theme_Updater_Parser_Test extends Supersonic_Theme_Updater {
	public $resolved_urls = array();

	public function parse_for_test($release) {
		return $this->parse_release($release, '0.1.99');
	}

	protected function resolve_checksum($sha_url) {
		$this->resolved_urls[] = $sha_url;
		return str_repeat('a', 64);
	}
}

class Supersonic_Theme_Updater_Empty_Checksum_Test extends Supersonic_Theme_Updater_Parser_Test {
	protected function resolve_checksum($sha_url) {
		$this->resolved_urls[] = $sha_url;
		return '';
	}
}

function supersonic_parser_asset($name, $url = null) {
	return array(
		'name'                 => $name,
		'browser_download_url' => $url ? $url : 'https://example.test/' . $name,
	);
}

function supersonic_parser_release($assets) {
	return array(
		'assets'   => $assets,
		'html_url' => 'https://example.test/release',
	);
}

function supersonic_parser_assert($condition, $message) {
	if (! $condition) {
		fwrite(STDERR, "FAIL: {$message}\n");
		exit(1);
	}
	echo "PASS: {$message}\n";
}

$tester = new Supersonic_Theme_Updater_Parser_Test();

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip', 'https://example.test/theme.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256', 'https://example.test/theme.zip.sha256'),
)));
supersonic_parser_assert(is_array($parsed), 'exact zip and checksum assets are accepted');
supersonic_parser_assert('https://example.test/theme.zip' === $parsed['zip_url'], 'exact zip URL is selected');
supersonic_parser_assert(str_repeat('a', 64) === $parsed['sha256'], 'checksum is resolved from exact sidecar');
supersonic_parser_assert(array('https://example.test/theme.zip.sha256') === $tester->resolved_urls, 'only exact checksum sidecar is resolved');

$tester = new Supersonic_Theme_Updater_Parser_Test();
$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme-extra.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256'),
)));
supersonic_parser_assert(null === $parsed, 'broad zip asset names are rejected');

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip'),
)));
supersonic_parser_assert(null === $parsed, 'missing checksum sidecar is rejected');

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip'),
	supersonic_parser_asset('unrelated.zip.sha256'),
)));
supersonic_parser_assert(null === $parsed, 'unrelated checksum sidecar is rejected');

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip.sha256'),
	supersonic_parser_asset('supersonic-site-theme.zip'),
)));
supersonic_parser_assert(is_array($parsed), 'out-of-order exact assets are accepted');

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip', 'https://example.test/duplicate.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256'),
)));
supersonic_parser_assert(null === $parsed, 'duplicate exact zip assets are rejected');

$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256', 'https://example.test/duplicate.sha256'),
)));
supersonic_parser_assert(null === $parsed, 'duplicate exact checksum assets are rejected');

$tester = new Supersonic_Theme_Updater_Empty_Checksum_Test();
$parsed = $tester->parse_for_test(supersonic_parser_release(array(
	supersonic_parser_asset('supersonic-site-theme.zip'),
	supersonic_parser_asset('supersonic-site-theme.zip.sha256'),
)));
supersonic_parser_assert(null === $parsed, 'invalid checksum sidecar contents are rejected');
