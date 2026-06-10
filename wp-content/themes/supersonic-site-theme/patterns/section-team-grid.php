<?php
/**
 * Title: Section: Team Grid
 * Slug: supersonic-site-theme/section-team-grid
 * Categories: supersonic-trust
 * Keywords: team, people, staff, grid
 * Description: A three-person team grid with photo, name, role, and a one-line bio for trust building.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Team Grid"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:heading {"textAlign":"center","fontSize":"heading-2"} -->
	<h2 class="wp-block-heading has-text-align-center has-heading-2-font-size">Meet the team</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center"} -->
	<p class="has-text-align-center">Introduce the people behind the work in one steady sentence.</p>
	<!-- /wp:paragraph -->

	<!-- wp:columns {"isStackedOnMobile":false,"style":{"spacing":{"blockGap":"var:preset|spacing|m","margin":{"top":"var:preset|spacing|l"}}}} -->
	<div class="wp-block-columns is-not-stacked-on-mobile" style="margin-top:var(--wp--preset--spacing--l)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"textColor":"contrast","backgroundColor":"surface","style":{"border":{"radius":"var(--wp--custom--radius--medium)"},"spacing":{"padding":{"top":"var:preset|spacing|l","right":"var:preset|spacing|l","bottom":"var:preset|spacing|l","left":"var:preset|spacing|l"}}}} -->
			<div class="wp-block-group has-contrast-color has-surface-background-color has-text-color has-background" style="border-radius:var(--wp--custom--radius--medium);padding-top:var(--wp--preset--spacing--l);padding-right:var(--wp--preset--spacing--l);padding-bottom:var(--wp--preset--spacing--l);padding-left:var(--wp--preset--spacing--l)">
				<!-- wp:image {"aspectRatio":"1","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--medium)"}}} -->
				<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--medium);aspect-ratio:1;object-fit:cover"/></figure>
				<!-- /wp:image -->

				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading">Person Name</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"accent-ink","fontSize":"small"} -->
				<p class="has-accent-ink-color has-text-color has-small-font-size">Role or title</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
				<p class="has-contrast-subtle-color has-text-color">One line on what this person owns for clients.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"textColor":"contrast","backgroundColor":"surface","style":{"border":{"radius":"var(--wp--custom--radius--medium)"},"spacing":{"padding":{"top":"var:preset|spacing|l","right":"var:preset|spacing|l","bottom":"var:preset|spacing|l","left":"var:preset|spacing|l"}}}} -->
			<div class="wp-block-group has-contrast-color has-surface-background-color has-text-color has-background" style="border-radius:var(--wp--custom--radius--medium);padding-top:var(--wp--preset--spacing--l);padding-right:var(--wp--preset--spacing--l);padding-bottom:var(--wp--preset--spacing--l);padding-left:var(--wp--preset--spacing--l)">
				<!-- wp:image {"aspectRatio":"1","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--medium)"}}} -->
				<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--medium);aspect-ratio:1;object-fit:cover"/></figure>
				<!-- /wp:image -->

				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading">Person Name</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"accent-ink","fontSize":"small"} -->
				<p class="has-accent-ink-color has-text-color has-small-font-size">Role or title</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
				<p class="has-contrast-subtle-color has-text-color">One line on what this person owns for clients.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"textColor":"contrast","backgroundColor":"surface","style":{"border":{"radius":"var(--wp--custom--radius--medium)"},"spacing":{"padding":{"top":"var:preset|spacing|l","right":"var:preset|spacing|l","bottom":"var:preset|spacing|l","left":"var:preset|spacing|l"}}}} -->
			<div class="wp-block-group has-contrast-color has-surface-background-color has-text-color has-background" style="border-radius:var(--wp--custom--radius--medium);padding-top:var(--wp--preset--spacing--l);padding-right:var(--wp--preset--spacing--l);padding-bottom:var(--wp--preset--spacing--l);padding-left:var(--wp--preset--spacing--l)">
				<!-- wp:image {"aspectRatio":"1","scale":"cover","sizeSlug":"large","className":"supersonic-pattern-image","style":{"border":{"radius":"var(--wp--custom--radius--medium)"}}} -->
				<figure class="wp-block-image size-large has-custom-border supersonic-pattern-image"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/pattern-placeholder.svg' ) ); ?>" alt="" style="border-radius:var(--wp--custom--radius--medium);aspect-ratio:1;object-fit:cover"/></figure>
				<!-- /wp:image -->

				<!-- wp:heading {"level":3} -->
				<h3 class="wp-block-heading">Person Name</h3>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"textColor":"accent-ink","fontSize":"small"} -->
				<p class="has-accent-ink-color has-text-color has-small-font-size">Role or title</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"contrast-subtle"} -->
				<p class="has-contrast-subtle-color has-text-color">One line on what this person owns for clients.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
