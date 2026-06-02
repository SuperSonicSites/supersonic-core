<?php
/**
 * Title: Section: Image + Text
 * Slug: supersonic-site-theme/section-image-text
 * Categories: supersonic-media
 * Keywords: image, feature, reverse, cta
 * Description: Two-column section with an editable visual area on the left, copy on the right, and a call-to-action button.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Image + Text"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"center","className":"supersonic-media-split supersonic-media-split--image-left","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-center supersonic-media-split supersonic-media-split--image-left">
		<!-- wp:column {"verticalAlignment":"center","className":"supersonic-media-split__media"} -->
		<div class="wp-block-column is-vertically-aligned-center supersonic-media-split__media">
			<!-- wp:image {"aspectRatio":"4/3","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--large)"}}} -->
			<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--large);aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","className":"supersonic-media-split__content"} -->
		<div class="wp-block-column is-vertically-aligned-center supersonic-media-split__content">
			<!-- wp:paragraph {"textColor":"accent","fontSize":"small"} -->
			<p class="has-accent-color has-text-color has-small-font-size"><strong>Visual proof</strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Show the proof, then make the next step clear</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p>Use this variation when the visual should lead the section and the supporting copy should clarify what visitors are seeing.</p>
			<!-- /wp:paragraph -->

			<!-- wp:buttons {"style":{"spacing":{"blockGap":"var:preset|spacing|s"}}} -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">View details</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
