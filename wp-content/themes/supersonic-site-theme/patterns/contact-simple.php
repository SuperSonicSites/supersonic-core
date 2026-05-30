<?php
/**
 * Title: Contact: Simple
 * Slug: supersonic-site-theme/contact-simple
 * Categories: supersonic-conversion
 * Keywords: contact, phone, email
 * Description: A simple contact section with email, phone, and address placeholders.
 */
?>
<!-- wp:group {"metadata":{"name":"Contact: Simple"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns">
		<!-- wp:column {"width":"45%"} -->
		<div class="wp-block-column" style="flex-basis:45%">
			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Contact us</h2>
			<!-- /wp:heading -->
			<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
			<p class="has-contrast-subtle-color has-text-color">Use this section for clear contact details and one simple invitation.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group">
				<!-- wp:paragraph -->
				<p><strong>Email</strong><br><a href="mailto:hello@example.com">hello@example.com</a></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><strong>Phone</strong><br><a href="tel:+15555555555">(555) 555-5555</a></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph -->
				<p><strong>Address</strong><br>123 Example Street<br>City, Region</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
