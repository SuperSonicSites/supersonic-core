<?php
/**
 * Title: Section: Google Reviews
 * Slug: supersonic-site-theme/section-reviews-google
 * Categories: supersonic-trust
 * Keywords: reviews, testimonials, google, stars, social proof
 * Description: Social-proof section with a centered heading and intro, a two-by-two grid of light review cards with reviewer name and star rating, and a centered reviews button.
 */

$supersonic_reviews = array(
	array( 'A concise customer review goes here.', 'Customer Name' ),
	array( 'A concise customer review goes here.', 'Customer Name' ),
	array( 'A concise customer review goes here.', 'Customer Name' ),
	array( 'A concise customer review goes here.', 'Customer Name' ),
);
?>
<!-- wp:group {"metadata":{"name":"Section: Google Reviews"},"align":"full","backgroundColor":"base","textColor":"contrast","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"},"blockGap":"var:preset|spacing|l"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-contrast-color has-base-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:group {"layout":{"type":"constrained","contentSize":"760px"}} -->
	<div class="wp-block-group">
		<!-- wp:heading {"textAlign":"center","fontSize":"heading-2"} -->
		<h2 class="wp-block-heading has-text-align-center has-heading-2-font-size">Trusted by customers like you</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","fontSize":"body"} -->
		<p class="has-text-align-center has-body-font-size">A short introduction that frames the reviews below and what customers value most.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

<?php foreach ( array_chunk( $supersonic_reviews, 2 ) as $supersonic_review_row ) : ?>
	<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|l"}}}} -->
	<div class="wp-block-columns">
	<?php foreach ( $supersonic_review_row as $supersonic_review ) : ?>
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"style":{"border":{"color":"var:preset|color|border","width":"1px","radius":"var(--wp--custom--radius--medium)"},"shadow":"var:preset|shadow|medium","spacing":{"blockGap":"0"}}} -->
			<div class="wp-block-group has-border-color" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:var(--wp--custom--radius--medium);box-shadow:var(--wp--preset--shadow--medium)">
			<!-- wp:group {"backgroundColor":"surface","textColor":"contrast","style":{"spacing":{"blockGap":"var:preset|spacing|m","padding":{"top":"var:preset|spacing|l","right":"var:preset|spacing|l","bottom":"var:preset|spacing|l","left":"var:preset|spacing|l"}}}} -->
			<div class="wp-block-group has-contrast-color has-surface-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--l);padding-right:var(--wp--preset--spacing--l);padding-bottom:var(--wp--preset--spacing--l);padding-left:var(--wp--preset--spacing--l)">
				<!-- wp:paragraph {"fontSize":"body"} -->
				<p class="has-body-font-size"><?php echo esc_html( $supersonic_review[0] ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|s"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
				<div class="wp-block-group">
					<!-- wp:image {"width":"48px","sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--pill)"}}} -->
					<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image" style="width:48px"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--pill);aspect-ratio:1;object-fit:cover"/></figure>
					<!-- /wp:image -->

					<!-- wp:group {"style":{"spacing":{"blockGap":"0"}}} -->
					<div class="wp-block-group">
						<!-- wp:paragraph {"fontSize":"body"} -->
						<p class="has-body-font-size"><strong><?php echo esc_html( $supersonic_review[1] ); ?></strong></p>
						<!-- /wp:paragraph -->

						<!-- wp:paragraph {"textColor":"rating","fontSize":"body"} -->
						<p class="has-rating-color has-text-color has-body-font-size">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
						<!-- /wp:paragraph -->
					</div>
					<!-- /wp:group -->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	<?php endforeach; ?>
	</div>
	<!-- /wp:columns -->
<?php endforeach; ?>

	<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
	<div class="wp-block-buttons">
		<!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#" target="_blank" rel="noreferrer noopener">Read More Google Reviews</a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
