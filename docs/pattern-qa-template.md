# Pattern QA Template

Use this template for each pattern review.

## Pattern

- Name:
- Slug:
- Type:
- Theme version:
- Review date:
- Reviewer:

## QA Page

- Used:
- Title:
- Slug:
- URL:
- Status:
- Cleanup approved:
- Cleanup completed:

## Registry

- Registry entry updated:
- Registry status:
- Certified theme version:
- Report path:

## Proof Summary

- Static proof:
- Staging proof:
- Visual proof:
- Interaction proof:
- Editor-control proof:
- Manual-only gaps:
- Fail-closed status if any proof is missing:

## Intent

Briefly describe where this pattern should be used and what job it does.

## Token Check

- Section spacing token:
- Typography presets:
- Color tokens:
- Layout width:
- Gutter behavior:
- Interior horizontal padding:
- Radius token:
- Shadow preset:
- Motion tokens, if applicable:

## Editor Control Contract

- Selected block:
- Promised controls:
- Owning block for each control:
- Expected proof:
- Pattern category contract:
- Section background color works:
- Section text color affects normal readable copy, or intentional child overrides are documented:
- Dark background plus light text remains readable:
- Light background plus dark text remains readable:
- Inline link color works, if inline links are present:
- Button color controls work separately from section text color, if buttons are present:
- Button labels inherit ancestor text color only when the button has no local text color:
- Group typography is not relied on where child text blocks own preset sizes:
- Text typography controls work at the intended text blocks:
- Left/center/right positioning works, if the pattern category promises it:
- Media replacement and crop/aspect behavior work, if media is present:
- Card-level controls remain local to cards, if cards are present:
- Controls that appear but are intentionally not part of the contract are documented:

## Editor Check

- Native blocks only:
- No Custom HTML block:
- Pattern appears in approved Supersonic category:
- Text is editable:
- Buttons are editable:
- Links are editable:
- Images/media are editable, if present:
- Section vertical padding preset can be changed:
- Color presets are available where relevant:
- Typography presets are available where relevant:
- Radius/shadow presets are available where relevant:
- Token edits avoid arbitrary custom values:
- Token edits preserve gutter/max-width behavior:
- Token edits do not introduce nested gutters or interior layout padding:
- Token edits preserve mobile stacking:
- No block validation errors after edit/undo:
- Header/footer template part remains a thin pattern mount, if applicable:
- Full page layout has exactly one editable H1, if applicable:
- Navigation CSS is scoped to `.supersonic-site-header`, if applicable:

## Screenshots

- Cache-busted URL:
- Selector:
- Desktop:
- Tablet:
- Mobile:

## QA Results

- No horizontal overflow:
- No text clipping:
- Mobile stacking works:
- Tablet layout works:
- Desktop layout works:
- Accessibility notes:
- SEO/content notes:
- Console errors:
- Horizontal overflow:
- Mobile nav interaction, if applicable:

## Status

- Approval status:
- Issues found:
- Fixes made:
- Remaining risk:
