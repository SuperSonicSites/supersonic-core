<?php
/**
 * Title: Hero: Simple
 * Slug: supersonic-site-theme/hero-simple
 * Categories: supersonic-heroes
 * Keywords: hero, intro, call to action
 * Description: A simple editable hero section with a headline, lead text, and two buttons.
 */
?>
<!-- wp:group {"metadata":{"name":"Hero: Simple"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-large","bottom":"var:preset|spacing|section-large"}}},"layout":{"type":"constrained","contentSize":"760px","justifyContent":"left"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-large);padding-bottom:var(--wp--preset--spacing--section-large)">
	<!-- wp:paragraph {"textColor":"accent","fontSize":"small"} -->
	<p class="has-accent-color has-text-color has-small-font-size"><strong>Editable starter section</strong></p>
	<!-- /wp:paragraph -->

	<!-- wp:heading {"level":1,"fontSize":"heading-1"} -->
	<h1 class="wp-block-heading has-heading-1-font-size">Build a clear homepage hero</h1>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"fontSize":"large"} -->
	<p class="has-large-font-size">Use this native-block pattern as a clean starting point for a page hero, service intro, or landing-page opener.</p>
	<!-- /wp:paragraph -->

	<!-- wp:buttons {"style":{"spacing":{"blockGap":"var:preset|spacing|s"}}} -->
	<div class="wp-block-buttons">
		<!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">Get started</a></div>
		<!-- /wp:button -->

		<!-- wp:button {"className":"is-style-outline"} -->
		<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#">See how it works</a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
