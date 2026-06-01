<?php
/**
 * Title: Contact: Form Mount
 * Slug: supersonic-site-theme/contact-form-simple
 * Categories: supersonic-conversion
 * Keywords: contact, form, shortcode
 * Description: A contact section with a native shortcode mount for an approved site form.
 */
?>
<!-- wp:group {"metadata":{"name":"Contact: Form Mount"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-top">
		<!-- wp:column {"verticalAlignment":"top"} -->
		<div class="wp-block-column is-vertically-aligned-top">
			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Send a message</h2>
			<!-- /wp:heading -->
			<!-- wp:paragraph -->
			<p>Use this section after the site owner approves the form plugin, block, or shortcode for the project.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"top"} -->
		<div class="wp-block-column is-vertically-aligned-top">
			<!-- wp:group {"textColor":"contrast","backgroundColor":"surface","style":{"border":{"radius":"var(--wp--custom--radius--medium)"},"spacing":{"padding":{"top":"var:preset|spacing|l","right":"var:preset|spacing|l","bottom":"var:preset|spacing|l","left":"var:preset|spacing|l"}}}} -->
			<div class="wp-block-group has-contrast-color has-surface-background-color has-text-color has-background" style="border-radius:var(--wp--custom--radius--medium);padding-top:var(--wp--preset--spacing--l);padding-right:var(--wp--preset--spacing--l);padding-bottom:var(--wp--preset--spacing--l);padding-left:var(--wp--preset--spacing--l)">
				<!-- wp:paragraph {"textColor":"contrast-subtle","fontSize":"small"} -->
				<p class="has-contrast-subtle-color has-text-color has-small-font-size">Replace the shortcode below with the approved form for this site.</p>
				<!-- /wp:paragraph -->

				<!-- wp:shortcode -->
				[approved_contact_form]
				<!-- /wp:shortcode -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
