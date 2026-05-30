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
	<!-- wp:columns -->
	<div class="wp-block-columns">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:site-logo {"width":120} /-->

			<!-- wp:paragraph {"textColor":"contrast-subtle","fontSize":"small"} -->
			<p class="has-contrast-subtle-color has-text-color has-small-font-size">A short line describing the site or business. Edit this in the Footer: Simple pattern.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:paragraph {"fontSize":"small"} -->
			<p class="has-small-font-size"><strong>Explore</strong></p>
			<!-- /wp:paragraph -->

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
			<!-- wp:paragraph {"fontSize":"small"} -->
			<p class="has-small-font-size"><strong>Get in touch</strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"textColor":"contrast-subtle","fontSize":"small"} -->
			<p class="has-contrast-subtle-color has-text-color has-small-font-size">hello@example.com<br>(555) 555-5555</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:separator -->
	<hr class="wp-block-separator has-alpha-channel-opacity"/>
	<!-- /wp:separator -->

	<!-- wp:paragraph {"align":"center","textColor":"contrast-subtle","fontSize":"small"} -->
	<p class="has-text-align-center has-contrast-subtle-color has-text-color has-small-font-size">&copy; Your Company. Powered by Supersonic Site Theme.</p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
