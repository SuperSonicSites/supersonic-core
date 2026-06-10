<?php
/**
 * Title: Section: Service Cards (Image Top)
 * Slug: supersonic-site-theme/section-service-cards-image
 * Categories: supersonic-cards
 * Keywords: services, cards, images, grid
 * Description: A six-card services grid in two rows; each white card has a top image, an uppercase title, body copy, and a Learn more link.
 */

$supersonic_service_cards = array(
	array( 'Service title one', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
	array( 'Service title two', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
	array( 'Service title three', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
	array( 'Service title four', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
	array( 'Service title five', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
	array( 'Service title six', 'A short explanation of who this service is for and the outcome it supports.', '#' ),
);
?>
<!-- wp:group {"metadata":{"name":"Section: Service Cards (Image Top)"},"align":"full","backgroundColor":"base","textColor":"contrast","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"},"blockGap":"var:preset|spacing|xl"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-contrast-color has-base-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:heading {"textAlign":"center","fontSize":"heading-2"} -->
	<h2 class="wp-block-heading has-text-align-center has-heading-2-font-size">Our Services</h2>
	<!-- /wp:heading -->

<?php foreach ( array_chunk( $supersonic_service_cards, 3 ) as $supersonic_card_row ) : ?>
	<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|l"}}}} -->
	<div class="wp-block-columns">
	<?php foreach ( $supersonic_card_row as $supersonic_card ) : ?>
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"backgroundColor":"base","textColor":"contrast","style":{"border":{"radius":"var(--wp--custom--radius--medium)"},"shadow":"var:preset|shadow|medium","spacing":{"blockGap":"0"}}} -->
			<div class="wp-block-group has-contrast-color has-base-background-color has-text-color has-background" style="border-radius:var(--wp--custom--radius--medium);box-shadow:var(--wp--preset--shadow--medium)">
				<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"supersonic-pattern-image"} -->
				<figure class="wp-block-image size-large supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="aspect-ratio:3/2;object-fit:cover"/></figure>
				<!-- /wp:image -->

				<!-- wp:group {"backgroundColor":"base","textColor":"contrast","style":{"spacing":{"blockGap":"var:preset|spacing|s","padding":{"top":"var:preset|spacing|m","right":"var:preset|spacing|m","bottom":"var:preset|spacing|m","left":"var:preset|spacing|m"}}}} -->
				<div class="wp-block-group has-contrast-color has-base-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--m);padding-right:var(--wp--preset--spacing--m);padding-bottom:var(--wp--preset--spacing--m);padding-left:var(--wp--preset--spacing--m)">
					<!-- wp:heading {"level":3,"fontSize":"large","style":{"typography":{"textTransform":"uppercase"}}} -->
					<h3 class="wp-block-heading has-large-font-size" style="text-transform:uppercase"><?php echo esc_html( $supersonic_card[0] ); ?></h3>
					<!-- /wp:heading -->

					<!-- wp:paragraph {"fontSize":"body"} -->
					<p class="has-body-font-size"><?php echo esc_html( $supersonic_card[1] ); ?></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"fontSize":"body"} -->
					<p class="has-body-font-size"><a href="<?php echo esc_url( $supersonic_card[2] ); ?>"><strong>Learn more &rarr;</strong></a></p>
					<!-- /wp:paragraph -->
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
</div>
<!-- /wp:group -->
