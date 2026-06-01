<?php
/**
 * Title: Section: Media Feature
 * Slug: supersonic-site-theme/section-media-feature
 * Categories: supersonic-media
 * Keywords: media, feature, image
 * Description: A large media-first feature section with a supporting text block below.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Media Feature"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:image {"aspectRatio":"16/9","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--large)"}}} -->
	<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--large);aspect-ratio:16/9;object-fit:cover"/></figure>
	<!-- /wp:image -->

	<!-- wp:group {"layout":{"type":"constrained","contentSize":"760px"}} -->
	<div class="wp-block-group">
		<!-- wp:heading {"textAlign":"center","fontSize":"heading-2"} -->
		<h2 class="wp-block-heading has-text-align-center has-heading-2-font-size">Support the media with a clear message</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">Use this for showroom photos, project screenshots, team photography, venue images, process visuals, or before-and-after proof.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
