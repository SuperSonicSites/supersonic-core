<?php
/**
 * Title: Section: Icon List
 * Slug: supersonic-site-theme/section-icon-list
 * Categories: supersonic-cards
 * Keywords: icons, checklist, benefits
 * Description: A benefits list using editable text markers instead of custom icons.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Icon List"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-medium"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-medium)">
	<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":"var:preset|spacing|xl"}}} -->
	<div class="wp-block-columns are-vertically-aligned-top">
		<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
		<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
			<!-- wp:heading {"fontSize":"heading-2"} -->
			<h2 class="wp-block-heading has-heading-2-font-size">Built around the essentials</h2>
			<!-- /wp:heading -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"top"} -->
		<div class="wp-block-column is-vertically-aligned-top">
			<!-- wp:list {"ordered":true} -->
			<ol>
				<li><strong>Benefit title</strong><br>A short explanation of the benefit.</li>
				<li><strong>Benefit title</strong><br>A short explanation of the benefit.</li>
				<li><strong>Benefit title</strong><br>A short explanation of the benefit.</li>
			</ol>
			<!-- /wp:list -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
