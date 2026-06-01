<?php
/**
 * Title: Hero: Centered
 * Slug: supersonic-site-theme/hero-centered
 * Categories: supersonic-heroes
 * Keywords: hero, centered, call to action
 * Description: A centered page hero with editable headline, lead text, and two buttons.
 */
?>
<!-- wp:group {"metadata":{"name":"Hero: Centered"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-large","bottom":"var:preset|spacing|section-large"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-large);padding-bottom:var(--wp--preset--spacing--section-large)">
	<!-- wp:group {"layout":{"type":"constrained","contentSize":"760px"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"align":"center","textColor":"accent","fontSize":"small"} -->
		<p class="has-text-align-center has-accent-color has-text-color has-small-font-size"><strong>Starter page hero</strong></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"textAlign":"center","level":1,"fontSize":"display"} -->
		<h1 class="wp-block-heading has-text-align-center has-display-font-size">A focused headline for the page</h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size">Use this when the page needs one clear promise, one supporting idea, and a direct next step.</p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":"var:preset|spacing|s"}}} -->
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
</div>
<!-- /wp:group -->
