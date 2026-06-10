<?php
/**
 * Title: Header: Mega
 * Slug: supersonic-site-theme/header-mega
 * Categories: supersonic-headers
 * Block Types: core/template-part/header
 * Keywords: header, navigation, navbar, menu, mega, dropdown, columns
 * Description: Sticky header whose primary menu opens a wide multi-column link panel (mega menu) on desktop and collapses to the animated hamburger overlay at the tablet boundary. Built from native navigation blocks only; column headings are inert group labels. Keep the navigation Overlay Menu set to "Mobile".
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-header supersonic-site-header--mega","backgroundColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|xs","bottom":"var:preset|spacing|xs"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-header supersonic-site-header--mega has-base-background-color has-background" style="padding-top:var(--wp--preset--spacing--xs);padding-bottom:var(--wp--preset--spacing--xs)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:group {"className":"supersonic-brand-lockup","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
		<div class="wp-block-group supersonic-brand-lockup">
			<!-- wp:site-logo {"width":140} /-->
			<!-- wp:site-title {"level":0} /-->
		</div>
		<!-- /wp:group -->

		<!-- wp:navigation {"overlayMenu":"mobile","overlayBackgroundColor":"contrast","overlayTextColor":"base","style":{"spacing":{"blockGap":"var:preset|spacing|l"}},"layout":{"type":"flex","justifyContent":"right","flexWrap":"wrap"}} -->
			<!-- wp:navigation-link {"label":"Home","url":"#"} /-->

			<!-- wp:navigation-submenu {"label":"Solutions","className":"supersonic-mega"} -->
				<!-- wp:navigation-submenu {"label":"By Industry"} -->
					<!-- wp:navigation-link {"label":"Healthcare","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Finance","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Retail","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Education","url":"#"} /-->
				<!-- /wp:navigation-submenu -->

				<!-- wp:navigation-submenu {"label":"By Team"} -->
					<!-- wp:navigation-link {"label":"Marketing","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Sales","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Engineering","url":"#"} /-->
				<!-- /wp:navigation-submenu -->

				<!-- wp:navigation-submenu {"label":"By Use Case"} -->
					<!-- wp:navigation-link {"label":"Automation","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Analytics","url":"#"} /-->
					<!-- wp:navigation-link {"label":"Collaboration","url":"#"} /-->
				<!-- /wp:navigation-submenu -->
			<!-- /wp:navigation-submenu -->

			<!-- wp:navigation-link {"label":"Pricing","url":"#"} /-->

			<!-- wp:navigation-link {"label":"Contact","url":"#"} /-->
		<!-- /wp:navigation -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
