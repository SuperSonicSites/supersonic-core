<?php
/**
 * Title: Header: Light CTA
 * Slug: supersonic-site-theme/header-light-cta
 * Categories: supersonic-headers
 * Block Types: core/template-part/header
 * Keywords: header, navigation, light, cta
 * Description: White sticky navbar with a left logo, right navigation, and a solid accent CTA button. Pairs with the Top Bar: Utility pattern above it.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-header","backgroundColor":"base","textColor":"contrast","style":{"spacing":{"padding":{"top":"var:preset|spacing|xs","bottom":"var:preset|spacing|xs"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-header has-contrast-color has-base-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--xs);padding-bottom:var(--wp--preset--spacing--xs)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:group {"className":"supersonic-brand-lockup","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
		<div class="wp-block-group supersonic-brand-lockup">
			<!-- wp:site-logo {"width":72} /-->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
		<div class="wp-block-group">
			<!-- wp:navigation {"textColor":"contrast","overlayMenu":"mobile","overlayBackgroundColor":"contrast","overlayTextColor":"base","style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","justifyContent":"right","flexWrap":"wrap"}} -->
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
