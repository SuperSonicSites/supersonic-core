<?php
/**
 * Title: Section: Text + Image
 * Slug: supersonic-site-theme/section-text-image
 * Categories: supersonic-media
 * Keywords: image, feature, two column
 * Description: Two-column section with copy on the left and an editable visual area on the right.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Text + Image"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-center">
		<!-- wp:column {"verticalAlignment":"center"} -->
		<div class="wp-block-column is-vertically-aligned-center">
			<!-- wp:paragraph {"textColor":"accent","fontSize":"small"} -->
			<p class="has-accent-color has-text-color has-small-font-size"><strong>Featured section</strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Explain the most important benefit</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
			<p class="has-contrast-subtle-color has-text-color">Use the copy column for the promise, proof, and one next step. Replace the visual placeholder with a real image before approval.</p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">See how it works</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center"} -->
		<div class="wp-block-column is-vertically-aligned-center">
			<!-- wp:group {"backgroundColor":"muted","style":{"border":{"radius":"var(--wp--custom--radius--large)"},"dimensions":{"minHeight":"420px"},"spacing":{"padding":{"top":"var:preset|spacing|xl","right":"var:preset|spacing|xl","bottom":"var:preset|spacing|xl","left":"var:preset|spacing|xl"}}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center","verticalAlignment":"center"}} -->
			<div class="wp-block-group has-muted-background-color has-background" style="border-radius:var(--wp--custom--radius--large);min-height:420px;padding-top:var(--wp--preset--spacing--xl);padding-right:var(--wp--preset--spacing--xl);padding-bottom:var(--wp--preset--spacing--xl);padding-left:var(--wp--preset--spacing--xl)">
				<!-- wp:image -->
				<figure class="wp-block-image"><img alt=""/></figure>
				<!-- /wp:image -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
