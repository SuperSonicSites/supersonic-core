<?php
/**
 * Title: Section: Text + Image
 * Slug: supersonic-site-theme/section-text-image
 * Categories: supersonic-media
 * Keywords: image, feature, two column, cta
 * Description: Two-column section with copy and action buttons on the left and an editable visual area on the right.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Text + Image"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"center","className":"supersonic-media-split supersonic-media-split--image-right","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-center supersonic-media-split supersonic-media-split--image-right">
		<!-- wp:column {"verticalAlignment":"center","className":"supersonic-media-split__content"} -->
		<div class="wp-block-column is-vertically-aligned-center supersonic-media-split__content">
			<!-- wp:paragraph {"textColor":"accent","fontSize":"small"} -->
			<p class="has-accent-color has-text-color has-small-font-size"><strong>Featured section</strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Explain the most important benefit</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p>Use the copy column for the promise, proof, and one next step. Replace the visual placeholder with a real image before approval.</p>
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

		<!-- wp:column {"verticalAlignment":"center","className":"supersonic-media-split__media"} -->
		<div class="wp-block-column is-vertically-aligned-center supersonic-media-split__media">
			<!-- wp:image {"aspectRatio":"4/3","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--large)"}}} -->
			<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--large);aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
