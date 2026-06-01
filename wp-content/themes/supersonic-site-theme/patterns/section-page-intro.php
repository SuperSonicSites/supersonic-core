<?php
/**
 * Title: Section: Page Intro
 * Slug: supersonic-site-theme/section-page-intro
 * Categories: supersonic-intros
 * Keywords: intro, page title, h1
 * Description: A compact editable page intro with one H1 and a short lead paragraph.
 */
?>
<!-- wp:group {"metadata":{"name":"Section: Page Intro"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|section-medium","bottom":"var:preset|spacing|section-small"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--section-medium);padding-bottom:var(--wp--preset--spacing--section-small)">
	<!-- wp:group {"layout":{"type":"constrained","contentSize":"760px"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"textColor":"accent","fontSize":"small"} -->
		<p class="has-accent-color has-text-color has-small-font-size"><strong>Page label</strong></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":1,"fontSize":"heading-1"} -->
		<h1 class="wp-block-heading has-heading-1-font-size">Page title goes here</h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"fontSize":"large"} -->
		<p class="has-large-font-size">Add one concise paragraph that tells visitors what this page is for and why it matters.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
