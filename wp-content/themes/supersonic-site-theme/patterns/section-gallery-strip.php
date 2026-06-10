<?php
/**
 * Title: Section: Gallery Strip
 * Slug: supersonic-site-theme/section-gallery-strip
 * Categories: supersonic-media
 * Keywords: gallery, photos, strip, full width
 * Description: A full-bleed edge-to-edge photo strip: six cropped images in two three-column rows with no gaps.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Gallery Strip"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-none","bottom":"var:preset|spacing|section-none"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-none);padding-bottom:var(--wp--preset--spacing--section-none)">
	<!-- wp:gallery {"columns":3,"imageCrop":true,"linkTo":"none","sizeSlug":"large","align":"full","style":{"spacing":{"blockGap":{"top":"0","left":"0"}}}} -->
	<figure class="wp-block-gallery alignfull has-nested-images columns-3 is-cropped">
		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->

		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->

		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->

		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->

		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->

		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
		<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:16/10;object-fit:cover"/></figure>
		<!-- /wp:image -->
	</figure>
	<!-- /wp:gallery -->
</div>
<!-- /wp:group -->
