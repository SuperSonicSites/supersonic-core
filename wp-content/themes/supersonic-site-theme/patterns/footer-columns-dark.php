<?php
/**
 * Title: Footer: Columns Dark
 * Slug: supersonic-site-theme/footer-columns-dark
 * Categories: supersonic-footers
 * Block Types: core/template-part/footer
 * Keywords: footer, dark, columns, hours, contact
 * Description: Dark four-column footer: logo, quick links, business hours, and contact details with accent headings, plus a legal strip with privacy link and credit line.
 */
?>
<!-- wp:group {"align":"full","className":"supersonic-site-footer","backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-small"},"blockGap":"var:preset|spacing|xl"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull supersonic-site-footer has-base-color has-contrast-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-small)">
	<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|xl"}}}} -->
	<div class="wp-block-columns">
		<!-- wp:column {"width":"25%"} -->
		<div class="wp-block-column" style="flex-basis:25%">
			<!-- wp:group {"className":"supersonic-brand-lockup","layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"top"}} -->
			<div class="wp-block-group supersonic-brand-lockup">
				<!-- wp:site-logo {"width":180} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"25%"} -->
		<div class="wp-block-column" style="flex-basis:25%">
			<!-- wp:heading {"level":2,"textColor":"accent","fontSize":"heading-3"} -->
			<h2 class="wp-block-heading has-accent-color has-text-color has-heading-3-font-size">Quick Links</h2>
			<!-- /wp:heading -->

			<!-- wp:navigation {"textColor":"base","overlayMenu":"never","fontSize":"body","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","orientation":"vertical"}} -->
				<!-- wp:navigation-link {"label":"Home","url":"#"} /-->
				<!-- wp:navigation-link {"label":"About","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Services","url":"#"} /-->
				<!-- wp:navigation-link {"label":"Contact","url":"#"} /-->
			<!-- /wp:navigation -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"25%"} -->
		<div class="wp-block-column" style="flex-basis:25%">
			<!-- wp:heading {"level":2,"textColor":"accent","fontSize":"heading-3"} -->
			<h2 class="wp-block-heading has-accent-color has-text-color has-heading-3-font-size">Business Hours</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"fontSize":"body"} -->
			<p class="has-body-font-size">Mon to Fri: 9AM to 5PM<br>Sat: CLOSED<br>Sun: CLOSED</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"25%"} -->
		<div class="wp-block-column" style="flex-basis:25%">
			<!-- wp:heading {"level":2,"textColor":"accent","fontSize":"heading-3"} -->
			<h2 class="wp-block-heading has-accent-color has-text-color has-heading-3-font-size">Contact</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"fontSize":"body","style":{"elements":{"link":{"color":{"text":"var:preset|color|accent"}}}}} -->
			<p class="has-link-color has-body-font-size"><a href="https://maps.google.com/" target="_blank" rel="noreferrer noopener">123 Main Street, Example City</a><br><a href="mailto:hello@example.com">hello@example.com</a><br><a href="tel:+15555555555">(555) 555-5555</a></p>
			<!-- /wp:paragraph -->

			<!-- wp:social-links {"iconColor":"base","iconColorValue":"#ffffff","className":"is-style-logos-only","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|s"}}}} -->
			<ul class="wp-block-social-links has-icon-color is-style-logos-only">
				<!-- wp:social-link {"url":"https://www.facebook.com/","service":"facebook"} /-->
			</ul>
			<!-- /wp:social-links -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:separator {"align":"wide","backgroundColor":"contrast-subtle"} -->
	<hr class="wp-block-separator alignwide has-text-color has-contrast-subtle-color has-alpha-channel-opacity has-contrast-subtle-background-color has-background"/>
	<!-- /wp:separator -->

	<!-- wp:group {"className":"supersonic-footer-legal","style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group supersonic-footer-legal">
		<!-- wp:paragraph {"fontSize":"small","style":{"elements":{"link":{"color":{"text":"var:preset|color|base"}}}}} -->
		<p class="has-link-color has-small-font-size">&copy; [supersonic_year] Example Company. All rights reserved. &nbsp; <a href="#">Privacy Policy</a></p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"fontSize":"small","style":{"elements":{"link":{"color":{"text":"var:preset|color|accent"}}}}} -->
		<p class="has-link-color has-small-font-size">Handcrafted with &#10084;&#65039; by <a href="https://www.supersonicsites.com" target="_blank" rel="noreferrer noopener">Supersonic Sites&reg;</a></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
