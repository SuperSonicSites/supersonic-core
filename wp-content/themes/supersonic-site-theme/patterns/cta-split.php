<?php
/**
 * Title: CTA: Split
 * Slug: supersonic-site-theme/cta-split
 * Categories: supersonic-conversion
 * Keywords: cta, split, contact
 * Description: A two-column call-to-action with short proof and action buttons.
 */
?>
<!-- wp:group {"metadata":{"name":"CTA: Split"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:group {"backgroundColor":"contrast","style":{"border":{"radius":"var(--wp--custom--radius--large)"},"spacing":{"padding":{"top":"var:preset|spacing|xl","right":"var:preset|spacing|xl","bottom":"var:preset|spacing|xl","left":"var:preset|spacing|xl"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group has-contrast-background-color has-background" style="border-radius:var(--wp--custom--radius--large);padding-top:var(--wp--preset--spacing--xl);padding-right:var(--wp--preset--spacing--xl);padding-bottom:var(--wp--preset--spacing--xl);padding-left:var(--wp--preset--spacing--xl)">
		<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
		<div class="wp-block-columns are-vertically-aligned-center">
			<!-- wp:column {"verticalAlignment":"center"} -->
			<div class="wp-block-column is-vertically-aligned-center">
				<!-- wp:heading {"textColor":"base","fontSize":"heading-2"} -->
				<h2 class="wp-block-heading has-base-color has-text-color has-heading-2-font-size">Make the decision easy</h2>
				<!-- /wp:heading -->
				<!-- wp:paragraph {"textColor":"base"} -->
				<p class="has-base-color has-text-color">Give visitors a final reason to act, then offer one primary action and one lower-pressure option.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:column -->

			<!-- wp:column {"verticalAlignment":"center"} -->
			<div class="wp-block-column is-vertically-aligned-center">
				<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"},"style":{"spacing":{"blockGap":"var:preset|spacing|s"}}} -->
				<div class="wp-block-buttons">
					<!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
					<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button" href="#">Book a call</a></div>
					<!-- /wp:button -->

					<!-- wp:button {"className":"is-style-outline","textColor":"base"} -->
					<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-base-color has-text-color wp-element-button" href="#">View work</a></div>
					<!-- /wp:button -->
				</div>
				<!-- /wp:buttons -->
			</div>
			<!-- /wp:column -->
		</div>
		<!-- /wp:columns -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
