<?php
/**
 * Title: CTA: Band
 * Slug: supersonic-site-theme/cta-band
 * Categories: supersonic-conversion
 * Keywords: cta, call to action, conversion
 * Description: A full-width call-to-action band with centered copy and buttons.
 */
?>
<!-- wp:group {"metadata":{"name":"CTA: Band"},"align":"full","backgroundColor":"accent","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-accent-background-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:group {"layout":{"type":"constrained","contentSize":"860px"}} -->
	<div class="wp-block-group">
		<!-- wp:heading {"textAlign":"center","textColor":"accent-contrast","fontSize":"heading-2"} -->
		<h2 class="wp-block-heading has-text-align-center has-accent-contrast-color has-text-color has-heading-2-font-size">Ready for the next step?</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","textColor":"accent-contrast","fontSize":"large"} -->
		<p class="has-text-align-center has-accent-contrast-color has-text-color has-large-font-size">Use this section when the visitor has enough context and needs one clear action.</p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
			<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button" href="#">Start now</a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
