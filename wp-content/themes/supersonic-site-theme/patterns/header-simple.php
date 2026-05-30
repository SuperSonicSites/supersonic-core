<?php
/**
 * Title: Header: Simple
 * Slug: supersonic-site-theme/header-simple
 * Categories: supersonic-headers
 * Block Types: core/template-part/header
 * Keywords: header, navigation, navbar, menu
 * Description: Sticky header with a left logo link (home) and right-aligned navigation that collapses to an animated mobile overlay. The default Supersonic header layout.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-header","backgroundColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|xs","bottom":"var:preset|spacing|xs"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-header has-base-background-color has-background" style="padding-top:var(--wp--preset--spacing--xs);padding-bottom:var(--wp--preset--spacing--xs)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:site-logo {"width":140} /-->

		<!-- wp:navigation {"overlayMenu":"mobile","overlayBackgroundColor":"contrast","overlayTextColor":"base","style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","justifyContent":"right","flexWrap":"wrap"}} -->
			<!-- wp:navigation-link {"label":"Home","url":"#"} /-->

			<!-- wp:navigation-submenu {"label":"Services","url":"#"} -->
				<!-- wp:navigation-link {"label":"Overview","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Pricing","url":"#"} /-->
				<!-- wp:navigation-link {"label":"FAQ","url":"#"} /-->
			<!-- /wp:navigation-submenu -->

			<!-- wp:navigation-link {"label":"About","url":"#"} /-->

			<!-- wp:navigation-link {"label":"Contact","url":"#"} /-->
		<!-- /wp:navigation -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
