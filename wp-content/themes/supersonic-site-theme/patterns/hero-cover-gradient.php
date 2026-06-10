<?php
/**
 * Title: Hero: Cover Gradient
 * Slug: supersonic-site-theme/hero-cover-gradient
 * Categories: supersonic-heroes
 * Keywords: hero, cover, image, gradient, overlay
 * Description: Full-bleed photo hero with a base-to-transparent gradient overlay; kicker chip, H1, lead, and buttons sit on the readable side.
 */
?>
<!-- wp:cover {"useFeaturedImage":false,"dimRatio":100,"customGradient":null,"gradient":"fade-base-right","isUserOverlayColor":true,"minHeight":640,"minHeightUnit":"px","contentPosition":"center left","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull has-custom-content-position is-position-center-left" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium);min-height:640px">
	<img class="wp-block-cover__image-background" alt="" src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" data-object-fit="cover"/>
	<span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim wp-block-cover__gradient-background has-background-gradient has-fade-base-right-gradient-background"></span>
	<div class="wp-block-cover__inner-container">
		<!-- wp:group {"textColor":"contrast","layout":{"type":"constrained","contentSize":"760px","justifyContent":"left"}} -->
		<div class="wp-block-group has-contrast-color has-text-color">
			<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|m"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"}} -->
			<div class="wp-block-group">
				<!-- wp:paragraph {"backgroundColor":"accent","textColor":"accent-contrast","fontSize":"small","style":{"spacing":{"padding":{"top":"var:preset|spacing|2-xs","right":"var:preset|spacing|s","bottom":"var:preset|spacing|2-xs","left":"var:preset|spacing|s"}},"border":{"radius":"var(--wp--custom--radius--small)"}}} -->
				<p class="has-accent-contrast-color has-accent-background-color has-text-color has-background has-small-font-size" style="border-radius:var(--wp--custom--radius--small);padding-top:var(--wp--preset--spacing--2-xs);padding-right:var(--wp--preset--spacing--s);padding-bottom:var(--wp--preset--spacing--2-xs);padding-left:var(--wp--preset--spacing--s)"><strong>Editable kicker chip</strong></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->

			<!-- wp:heading {"level":1,"fontSize":"heading-1"} -->
			<h1 class="wp-block-heading has-heading-1-font-size">Build a clear homepage hero</h1>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"fontSize":"body"} -->
			<p class="has-body-font-size">Use this native-block pattern as a clean starting point for a page hero, service intro, or landing-page opener over a full-bleed photo.</p>
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
	</div>
</div>
<!-- /wp:cover -->
