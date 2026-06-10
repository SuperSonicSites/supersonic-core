<?php
/**
 * Title: CTA: Split Band
 * Slug: supersonic-site-theme/cta-split-band
 * Categories: supersonic-conversion
 * Keywords: cta, band, split, conversion
 * Description: Full-width accent band with a large heading and supporting copy on the left and a button on the right.
 */
?>
<!-- wp:group {"metadata":{"name":"CTA: Split Band"},"align":"full","backgroundColor":"accent","textColor":"accent-contrast","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-accent-contrast-color has-accent-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|xl"}}}} -->
	<div class="wp-block-columns are-vertically-aligned-center">
		<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
			<!-- wp:heading {"fontSize":"heading-1"} -->
			<h2 class="wp-block-heading has-heading-1-font-size">Ready to take the next step?</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"fontSize":"body"} -->
			<p class="has-body-font-size">A short supporting sentence that reinforces the value of acting now and what happens after the click.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">
			<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">Get in Touch &rarr;</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
