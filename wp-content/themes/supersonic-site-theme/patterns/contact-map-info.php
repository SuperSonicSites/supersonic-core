<?php
/**
 * Title: Contact: Map + Info
 * Slug: supersonic-site-theme/contact-map-info
 * Categories: supersonic-conversion
 * Keywords: contact, map, address
 * Description: A contact section with a map placeholder, phone, email, address, and directions button.
 */
?>
<!-- wp:group {"metadata":{"name":"Contact: Map + Info"},"align":"full","backgroundColor":"surface","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-surface-background-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"stretch","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-stretch">
		<!-- wp:column {"verticalAlignment":"stretch"} -->
		<div class="wp-block-column is-vertically-aligned-stretch">
			<!-- wp:group {"backgroundColor":"muted","style":{"border":{"radius":"var(--wp--custom--radius--large)"},"dimensions":{"minHeight":"460px"},"spacing":{"padding":{"top":"var:preset|spacing|xl","right":"var:preset|spacing|xl","bottom":"var:preset|spacing|xl","left":"var:preset|spacing|xl"}}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center","verticalAlignment":"center"}} -->
			<div class="wp-block-group has-muted-background-color has-background" style="border-radius:var(--wp--custom--radius--large);min-height:460px;padding-top:var(--wp--preset--spacing--xl);padding-right:var(--wp--preset--spacing--xl);padding-bottom:var(--wp--preset--spacing--xl);padding-left:var(--wp--preset--spacing--xl)">
				<!-- wp:paragraph {"align":"center","textColor":"contrast-subtle","fontSize":"large"} -->
				<p class="has-text-align-center has-contrast-subtle-color has-text-color has-large-font-size">Replace with approved map embed or image</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center"} -->
		<div class="wp-block-column is-vertically-aligned-center">
			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Visit or contact us</h2>
			<!-- /wp:heading -->
			<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
			<p class="has-contrast-subtle-color has-text-color">Add the location, hours, and best contact method for the business.</p>
			<!-- /wp:paragraph -->
			<!-- wp:separator -->
			<hr class="wp-block-separator has-alpha-channel-opacity"/>
			<!-- /wp:separator -->
			<!-- wp:paragraph -->
			<p><strong>Address</strong><br>123 Example Street<br>City, Region</p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph -->
			<p><strong>Phone</strong><br><a href="tel:+15555555555">(555) 555-5555</a></p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph -->
			<p><strong>Email</strong><br><a href="mailto:hello@example.com">hello@example.com</a></p>
			<!-- /wp:paragraph -->
			<!-- wp:buttons -->
			<div class="wp-block-buttons">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">Get directions</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
