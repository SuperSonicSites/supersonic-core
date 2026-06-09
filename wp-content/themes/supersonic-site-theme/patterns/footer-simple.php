<?php
/**
 * Title: Footer: Simple
 * Slug: supersonic-site-theme/footer-simple
 * Categories: supersonic-footers
 * Block Types: core/template-part/footer
 * Keywords: footer, columns, links, contact
 * Description: Three-column footer with a logo link (home), quick links, and contact info, plus a centered copyright line. Rides the site gutter; vertical rhythm only.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-footer","backgroundColor":"muted","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"},"blockGap":"var:preset|spacing|l"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-footer has-muted-background-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"isStackedOnMobile":false} -->
	<div class="wp-block-columns is-not-stacked-on-mobile">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"supersonic-brand-lockup","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group supersonic-brand-lockup">
				<!-- wp:site-logo {"width":120} /-->
			</div>
			<!-- /wp:group -->

			<!-- wp:paragraph {"fontSize":"small"} -->
			<p class="has-small-font-size">A short line describing the site or business. Edit this in the Footer: Simple pattern.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:heading {"level":2,"fontSize":"small"} -->
			<h2 class="wp-block-heading has-small-font-size">Explore</h2>
			<!-- /wp:heading -->

			<!-- wp:navigation {"overlayMenu":"never","fontSize":"small","style":{"spacing":{"blockGap":"var:preset|spacing|xs"}},"layout":{"type":"flex","orientation":"vertical"}} -->
				<!-- wp:navigation-link {"label":"Home","url":"#"} /-->
				<!-- wp:navigation-link {"label":"About","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Services","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Contact","url":"#"} /-->
			<!-- /wp:navigation -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:heading {"level":2,"fontSize":"small"} -->
			<h2 class="wp-block-heading has-small-font-size">Get in touch</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"fontSize":"small"} -->
			<p class="has-small-font-size"><a href="mailto:hello@example.com">hello@example.com</a><br><a href="tel:+15555555555">(555) 555-5555</a></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:separator -->
	<hr class="wp-block-separator has-alpha-channel-opacity"/>
	<!-- /wp:separator -->

	<!-- wp:group {"className":"supersonic-footer-legal","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group supersonic-footer-legal">
		<!-- wp:paragraph {"fontSize":"small"} -->
		<p class="has-small-font-size">&copy; [supersonic_year] . All rights reserved</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"fontSize":"small"} -->
		<p class="has-small-font-size">Handcrafted with &#10084;&#65039; by <a href="https://www.supersonicrealtors.com">Supersonic Realtors</a></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
