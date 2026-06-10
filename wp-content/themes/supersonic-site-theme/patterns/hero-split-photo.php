<?php
/**
 * Title: Hero: Split Photo
 * Slug: supersonic-site-theme/hero-split-photo
 * Categories: supersonic-heroes
 * Keywords: hero, split, photo, kicker, call to action
 * Description: Split hero with a kicker chip, large H1, lead text, and two buttons on the left and a large photo on the right.
 */
?>
<!-- wp:group {"metadata":{"name":"Hero: Split Photo"},"align":"full","backgroundColor":"base","textColor":"contrast","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-contrast-color has-base-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|xl"}}}} -->
	<div class="wp-block-columns are-vertically-aligned-center">
		<!-- wp:column {"verticalAlignment":"center","width":"55%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:55%">
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
			<p class="has-body-font-size">Use this native-block pattern as a clean starting point for a page hero, service intro, or landing-page opener with a supporting photo.</p>
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
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","width":"45%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:45%">
			<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--medium)"}}} -->
			<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--medium);aspect-ratio:4/3;object-fit:cover"/></figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
