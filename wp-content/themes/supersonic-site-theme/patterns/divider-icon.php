<?php
/**
 * Title: Divider: Icon
 * Slug: supersonic-site-theme/divider-icon
 * Categories: supersonic-info
 * Keywords: divider, ornament, icon, separator
 * Description: Centered ornamental divider: a short rule, a small icon, and a short rule. Sits under section headings.
 */
?>
<!-- wp:group {"metadata":{"name":"Divider: Icon"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-none","bottom":"var:preset|spacing|section-none"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-none);padding-bottom:var(--wp--preset--spacing--section-none)">
	<!-- wp:group {"className":"supersonic-divider-icon","style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center","verticalAlignment":"center"}} -->
	<div class="wp-block-group supersonic-divider-icon">
		<!-- wp:separator {"backgroundColor":"border","className":"supersonic-divider-rule"} -->
		<hr class="wp-block-separator has-text-color has-border-color has-alpha-channel-opacity has-border-background-color has-background supersonic-divider-rule"/>
		<!-- /wp:separator -->

		<!-- wp:image {"width":"28px","sizeSlug":"large","linkDestination":"none","className":"supersonic-divider-glyph"} -->
		<figure class="wp-block-image size-large supersonic-divider-glyph" style="width:28px"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/divider-glyph.svg' ) ); ?>" alt="" style="width:28px"/></figure>
		<!-- /wp:image -->

		<!-- wp:separator {"backgroundColor":"border","className":"supersonic-divider-rule"} -->
		<hr class="wp-block-separator has-text-color has-border-color has-alpha-channel-opacity has-border-background-color has-background supersonic-divider-rule"/>
		<!-- /wp:separator -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
