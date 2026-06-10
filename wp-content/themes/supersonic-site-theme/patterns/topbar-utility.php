<?php
/**
 * Title: Top Bar: Utility
 * Slug: supersonic-site-theme/topbar-utility
 * Categories: supersonic-headers
 * Keywords: topbar, utility, phone, email, social
 * Description: Slim dark utility bar above the navbar with email left, phone center, and social icons right. Any zone can be emptied per site.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-topbar","backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|2-xs","bottom":"var:preset|spacing|2-xs"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-topbar has-base-color has-contrast-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--2-xs);padding-bottom:var(--wp--preset--spacing--2-xs)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"fontSize":"small","style":{"elements":{"link":{"color":{"text":"var:preset|color|base"}}}}} -->
		<p class="has-link-color has-small-font-size"><a href="mailto:hello@example.com">hello@example.com</a></p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"fontSize":"small","style":{"elements":{"link":{"color":{"text":"var:preset|color|base"}}}}} -->
		<p class="has-link-color has-small-font-size"><a href="tel:+15555555555">(555) 555-5555</a></p>
		<!-- /wp:paragraph -->

		<!-- wp:social-links {"iconColor":"base","iconColorValue":"#ffffff","className":"is-style-logos-only","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|s"}}}} -->
		<ul class="wp-block-social-links has-icon-color is-style-logos-only">
			<!-- wp:social-link {"url":"https://www.facebook.com/","service":"facebook"} /-->
		</ul>
		<!-- /wp:social-links -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
