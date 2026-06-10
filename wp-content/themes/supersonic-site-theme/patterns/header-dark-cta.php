<?php
/**
 * Title: Header: Dark CTA
 * Slug: supersonic-site-theme/header-dark-cta
 * Categories: supersonic-headers
 * Block Types: core/template-part/header
 * Keywords: header, navigation, dark, phone, cta
 * Description: Dark sticky header with a left logo, a visible phone link, right navigation, and a solid CTA button. Collapses to the animated mobile overlay.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-header","backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|xs","bottom":"var:preset|spacing|xs"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-header has-base-color has-contrast-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--xs);padding-bottom:var(--wp--preset--spacing--xs)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:group {"className":"supersonic-brand-lockup","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
		<div class="wp-block-group supersonic-brand-lockup">
			<!-- wp:site-logo {"width":72} /-->
		</div>
		<!-- /wp:group -->

		<!-- wp:paragraph {"fontSize":"body","style":{"elements":{"link":{"color":{"text":"var:preset|color|base"}}}}} -->
		<p class="has-link-color has-body-font-size"><a href="tel:+15555555555">(555) 555-5555</a></p>
		<!-- /wp:paragraph -->

		<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
		<div class="wp-block-group">
			<!-- wp:navigation {"textColor":"base","overlayMenu":"mobile","overlayBackgroundColor":"contrast","overlayTextColor":"base","style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","justifyContent":"right","flexWrap":"wrap"}} -->
				<!-- wp:navigation-link {"label":"Home","url":"#"} /-->
				<!-- wp:navigation-link {"label":"About","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Services","url":"#"} /-->
				<!-- wp:navigation-link {"label":"FAQ","url":"#"} /-->
			<!-- /wp:navigation -->

			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">Contact</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
