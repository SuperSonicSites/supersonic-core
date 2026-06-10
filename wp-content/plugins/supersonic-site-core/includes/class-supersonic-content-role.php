<?php
/**
 * Least-privilege content-editor role.
 *
 * Creates a `supersonic_content_editor` role whose only powers are page/post
 * content editing and media uploads. The media pipeline and copy workflows
 * authenticate as a user with this role (via an application password), so the
 * stored credential cannot administer the site, manage plugins or themes, or
 * touch users.
 *
 * Capabilities are intentionally minimal:
 * - read                 : required for a usable WordPress user.
 * - upload_files         : media library uploads for the media pipeline.
 * - edit_pages           : draft and edit page content.
 * - edit_others_pages    : edit pages created by other users.
 * - publish_pages        : publish staging QA and content pages.
 * - edit_published_pages : update already-published pages (the QA-page update flow).
 * - edit_posts           : draft and edit post content.
 * - edit_others_posts    : edit posts created by other users.
 * - publish_posts        : publish posts.
 * - edit_published_posts : update already-published posts.
 *
 * The role is (re)created on plugin activation and removed on deactivation.
 *
 * @package Supersonic_Site_Core
 */

if (! defined('ABSPATH')) {
	exit;
}

class Supersonic_Content_Role {

	const ROLE = 'supersonic_content_editor';

	/**
	 * Capabilities granted to the content-editor role.
	 *
	 * @return array<string,bool>
	 */
	public static function capabilities() {
		return array(
			'read'                 => true,
			'upload_files'         => true,
			'edit_pages'           => true,
			'edit_others_pages'    => true,
			'publish_pages'        => true,
			'edit_published_pages' => true,
			'edit_posts'           => true,
			'edit_others_posts'    => true,
			'publish_posts'        => true,
			'edit_published_posts' => true,
		);
	}

	/**
	 * Create (or refresh) the content-editor role. Safe to call repeatedly.
	 */
	public static function add_role() {
		// remove_role is a no-op if it does not exist; this keeps caps in sync.
		remove_role(self::ROLE);
		add_role(
			self::ROLE,
			__('Supersonic Content Editor', 'supersonic-site-core'),
			self::capabilities()
		);
	}

	/**
	 * Remove the content-editor role on deactivation.
	 */
	public static function remove_role() {
		remove_role(self::ROLE);
	}
}
