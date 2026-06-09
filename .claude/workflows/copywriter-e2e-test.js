export const meta = {
  name: 'copywriter-e2e-test',
  description: 'End-to-end regression test for the copywriter on a mock business: SEO brief, draft page metadata, service-page layout, copy deck, then a real validator gate plus adversarial review. Writes only to tmp/copywriter-e2e/. Pass args {business, niche, geography, service_page, intake} to test a different mock business; omit args to run the built-in dog-grooming mock.',
  phases: [
    { title: 'SEO', detail: 'seo-strategist drafts a brief for one mock service page (Opus)' },
    { title: 'Page', detail: 'record the draft page + SEO metadata, simulated, no live write (Haiku)' },
    { title: 'Layout', detail: 'layout-architect composes the service page from seeded patterns (Sonnet)' },
    { title: 'Write', detail: 'copywriter drafts the copy deck on Sonnet 4.6 (Opus voice-spec anchored)' },
    { title: 'QA', detail: 'mechanical gate via the real validate-copy functions (Sonnet)' },
    { title: 'Review', detail: 'copy-review grades on Opus; flagged money-page slots rewritten on Opus' }
  ]
}

const DEFAULT_MOCK = {
  business: 'Aurora Mobile Dog Grooming',
  niche: 'Mobile dog grooming',
  geography: 'Boulder, Colorado, United States',
  service_page: 'Mobile Dog Grooming',
  intake: {
    client: { name: 'Aurora Mobile Dog Grooming', businessType: 'Mobile pet grooming service', locationOrServiceArea: 'Boulder, Colorado and surrounding area', primaryOffer: 'At-home mobile dog grooming in a self-contained van' },
    goals: { primaryConversion: 'Book a grooming appointment', secondaryConversions: ['Call for a quote', 'View service areas'] },
    audience: { primaryAudience: 'Boulder dog owners with busy schedules or anxious pets', problems: ['no time to drive to a groomer', 'dog gets stressed at busy salons', 'large or elderly dog is hard to transport'], decisionTriggers: ['convenience of at-home service', 'gentle one-on-one handling', 'clear flat pricing'] },
    brand: { voice: ['warm', 'trustworthy', 'professional', 'clear'], writingStyle: "Plain, reassuring language. Lead with the dog owner's peace of mind and concrete benefits.", phrasesToAvoid: ['pawsome', 'fur-tastic', 'best-in-class', 'world-class'] }
  }
}

const MOCK = (args && args.business && args.service_page && args.intake) ? args : DEFAULT_MOCK

const BRIEF_SCHEMA = {
  type: 'object',
  required: ['page_id','page_title','url_slug','archetype','search_intent','primary_keyword','secondary_keywords','lsi_terms','seo_title','meta_description','target_word_count','outline','internal_links','schema'],
  properties: {
    page_id: { type: 'string' }, page_title: { type: 'string' }, url_slug: { type: 'string' },
    archetype: { type: 'string' }, search_intent: { type: 'string' },
    primary_keyword: { type: 'object', required: ['term','volume','seo_difficulty','source'], properties: { term: { type: 'string' }, volume: { type: 'integer' }, seo_difficulty: { type: 'integer' }, source: { type: 'string' } } },
    secondary_keywords: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, volume: { type: 'integer' }, seo_difficulty: { type: 'integer' } } } },
    lsi_terms: { type: 'array', items: { type: 'string' } },
    seo_title: { type: 'string' }, meta_description: { type: 'string' }, target_word_count: { type: 'integer' },
    outline: { type: 'object', required: ['h1','sections'], properties: { h1: { type: 'string' }, sections: { type: 'array', items: { type: 'object', required: ['h2'], properties: { h2: { type: 'string' }, h3: { type: 'array', items: { type: 'string' } }, talking_points: { type: 'array', items: { type: 'string' } }, lsi_focus: { type: 'array', items: { type: 'string' } } } } } } },
    internal_links: { type: 'array', items: { type: 'object', required: ['target_slug','anchor_text'], properties: { target_slug: { type: 'string' }, anchor_text: { type: 'string' } } } },
    schema: { type: 'object', required: ['type','emitted_by'], properties: { type: { type: 'string' }, emitted_by: { type: 'string' }, required_fields: { type: 'object' } } }
  }
}

const PAGE_SCHEMA = {
  type: 'object',
  required: ['slug','title','seo_title','meta_description','status','schema_type'],
  properties: { slug: { type: 'string' }, title: { type: 'string' }, seo_title: { type: 'string' }, meta_description: { type: 'string' }, status: { type: 'string' }, schema_type: { type: 'string' }, note: { type: 'string' } }
}

const MANIFEST_SCHEMA = {
  type: 'object', required: ['version','compositions'],
  properties: {
    version: { type: 'integer' },
    compositions: { type: 'array', items: { type: 'object', required: ['page_id','url_slug','patterns'], properties: {
      page_id: { type: 'string' }, url_slug: { type: 'string' }, archetype: { type: 'string' },
      patterns: { type: 'array', items: { type: 'object', required: ['position','slug'], properties: { position: { type: 'integer' }, slug: { type: 'string' }, instances: { type: 'integer' }, role_on_page: { type: 'string' } } } }
    } } }
  }
}

const LAYOUT_SCHEMA = {
  type: 'object', required: ['manifest','blueprint_summary','patterns_used'],
  properties: { manifest: MANIFEST_SCHEMA, blueprint_summary: { type: 'string' }, patterns_used: { type: 'array', items: { type: 'string' } } }
}

const DECK_SCHEMA = {
  type: 'object', required: ['site','source','pages'],
  properties: {
    site: { type: 'object', required: ['niche','geography'], properties: { niche: { type: 'string' }, geography: { type: 'string' }, notes: { type: 'string' } } },
    source: { type: 'object', required: ['briefs','intake'], properties: { briefs: { type: 'string' }, intake: { type: 'string' }, compositions: { type: 'string' }, generatedBy: { type: 'string' } } },
    pages: { type: 'array', items: { type: 'object', required: ['page_id','url_slug','slots'], properties: {
      page_id: { type: 'string' }, url_slug: { type: 'string' }, word_count_target: { type: 'integer' },
      locked_headings: { type: 'object', properties: { h1: { type: 'string' }, sections: { type: 'array', items: { type: 'object', properties: { h2: { type: 'string' }, h3: { type: 'array', items: { type: 'string' } } } } } } },
      slots: { type: 'array', items: { type: 'object', required: ['id','role','text'], properties: { id: { type: 'string' }, role: { type: 'string' }, text: { type: 'string' }, pattern_slug: { type: 'string' }, slot_ref: { type: 'string' }, max_chars: { type: 'integer' }, min_chars: { type: 'integer' }, max_words: { type: 'integer' }, sibling_group: { type: 'string' }, section_ref: { type: 'string' } } } }
    } } }
  }
}

const QA_MECH_SCHEMA = {
  type: 'object', required: ['passed','fail_lines'],
  properties: { passed: { type: 'boolean' }, exit_code: { type: 'integer' }, fail_lines: { type: 'array', items: { type: 'string' } }, raw_output: { type: 'string' } }
}

const QA_REVIEW_SCHEMA = {
  type: 'object', required: ['verdict','summary','findings'],
  properties: {
    verdict: { type: 'string' }, summary: { type: 'string' },
    brief_fit: { type: 'string' }, voice_fit: { type: 'string' }, archetype_fit: { type: 'string' }, metadata_ok: { type: 'boolean' },
    findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string' }, area: { type: 'string' }, issue: { type: 'string' }, evidence: { type: 'string' } } } }
  }
}

const VERIFIER = [
  "import { readFile } from 'node:fs/promises';",
  "import { checkCopyDoc, checkDeckAgainstRegistry, checkCompositionsDoc } from '../../tools/validate-copy.mjs';",
  "const read = async (u) => JSON.parse(await readFile(u, 'utf8'));",
  "const deck = await read(new URL('./copy-deck.json', import.meta.url));",
  "const manifest = await read(new URL('./page-compositions.json', import.meta.url));",
  "const intake = await read(new URL('./site-intake.json', import.meta.url));",
  "const registry = await read(new URL('../../data/pattern-certifications.json', import.meta.url));",
  "const registryBySlug = new Map();",
  "for (const e of (registry.patterns || [])) {",
  "  if (!e || !e.slug || !Array.isArray(e.copy_slots)) continue;",
  "  const m = new Map();",
  "  for (const s of e.copy_slots) if (s && s.id) m.set(s.id, s);",
  "  registryBySlug.set(e.slug, m);",
  "}",
  "const DEFAULTS = ['best-in-class','cutting-edge','game-changing','next-level','revolutionary','unlock your potential','tailored solutions'];",
  "const extra = (intake.brand && Array.isArray(intake.brand.phrasesToAvoid)) ? intake.brand.phrasesToAvoid : [];",
  "const phrases = Array.from(new Set([...DEFAULTS, ...extra]));",
  "const issues = [",
  "  ...checkCopyDoc(deck, { phrasesToAvoid: phrases }),",
  "  ...checkDeckAgainstRegistry(deck, registryBySlug),",
  "  ...checkCompositionsDoc(manifest)",
  "];",
  "if (issues.length === 0) { console.log('COPYCHECK PASS'); }",
  "else { console.log('COPYCHECK FAIL (' + issues.length + ')'); for (const i of issues) console.log(' - ' + i); process.exitCode = 1; }"
].join('\n')

phase('SEO')
const seoPrompt = 'You are the Supersonic seo-strategist running a PIPELINE TEST for a MOCK business. Do NOT call any MCP. Read .claude/skills/seo-strategist/SKILL.md, BRAND.md, docs/layout-standard.md (Page Archetypes), and data/seo-briefs.schema.json to match the house contract.\n\nMOCK BUSINESS:\n' + JSON.stringify(MOCK, null, 2) + '\n\nProduce ONE SEO brief for the single SERVICE page (archetype "service", commercial intent). Rules:\n- One primary keyword (local service plus city), 2 secondary, and 3 to 5 LSI terms.\n- This is a mock with no live Ubersuggest, so set illustrative volume and seo_difficulty and set primary_keyword.source EXACTLY to "MOCK (illustrative; Ubersuggest supplies real metrics in a live run)". Do NOT present mock numbers as real.\n- Author seo_title (60 chars or fewer) and meta_description (160 chars or fewer).\n- url_slug: lowercase, hyphen-separated, 5 words or fewer, mapped to the primary keyword.\n- outline: one H1 plus 4 to 6 H2 sections, each with talking_points and lsi_focus. The writer fills body copy from these. Give enough sections to support the target_word_count.\n- 2 internal_links with descriptive anchors.\n- schema: a Service plan, emitted_by "plugin".\nReturn ONLY the brief object. Write no files.'
const brief = await agent(seoPrompt, { schema: BRIEF_SCHEMA, model: 'opus', label: 'seo:strategist', phase: 'SEO' })

phase('Page')
const pagePrompt = 'You are recording the draft "page" that would be created in WordPress with its SEO metadata, as the create-page step of the pipeline test. This is a SIMULATION: do NOT make any live REST or WordPress write. From the brief below, produce the draft page record: slug, title, the seo_title and meta_description owned by seo-strategist, status set EXACTLY to "draft (staging-only, simulated; live create is approval-gated)", and schema_type.\n\nBRIEF:\n' + JSON.stringify(brief, null, 2) + '\n\nReturn ONLY the page record. Write no files.'
const page = await agent(pagePrompt, { schema: PAGE_SCHEMA, model: 'haiku', label: 'page:metadata', phase: 'Page' })

phase('Layout')
const layoutPrompt = 'You are the Supersonic layout-architect composing the SERVICE page for the pipeline test. Read .claude/skills/layout-architect/SKILL.md, docs/layout-standard.md (the Service archetype order and the Block-Spec guide), and data/pattern-certifications.json.\n\nHARD CONSTRAINT: compose using ONLY these approved patterns, which have copy_slots budgets seeded in the registry so the writer can resolve real caps: supersonic-site-theme/section-page-intro, supersonic-site-theme/section-text-image, supersonic-site-theme/section-service-cards, supersonic-site-theme/section-feature-grid, supersonic-site-theme/section-process-steps, supersonic-site-theme/section-faq-rankmath, supersonic-site-theme/cta-band, supersonic-site-theme/hero-simple. Pick a sensible SERVICE-page subset and order that gives the page enough depth for the brief target_word_count (for example: section-page-intro owns the H1, then a section-text-image explainer, a section-process-steps how-it-works, a section-service-cards or section-feature-grid row of 3, a section-faq-rankmath block of 3, and a cta-band). Exactly one pattern owns the H1.\n\nBRIEF:\n' + JSON.stringify(brief, null, 2) + '\n\nReturn: manifest (a page-compositions doc: version 1, one composition with page_id, url_slug, archetype "service", and an ordered patterns[] of position, slug, and instances for any repeatable card or FAQ pattern); blueprint_summary (a few lines: section order to the job each does, and the H1 owner); patterns_used (the slugs). Return ONLY the object. Write no files.'
const layout = await agent(layoutPrompt, { schema: LAYOUT_SCHEMA, model: 'sonnet', label: 'layout:architect', phase: 'Layout' })

phase('Write')
const writePrompt = 'You are the Supersonic copywriter (Phase 8) writing body copy for the SERVICE page in the pipeline test. This page has commercial intent (a money page); per the skill Model Policy you DRAFT on Sonnet 4.6 (the Opus voice spec anchors the voice), and copy-review later flags any money-page slots for a targeted Opus rewrite. Read .claude/skills/copywriter/SKILL.md, BRAND.md (voice and Mechanical Copy Rules), and data/pattern-certifications.json (the copy_slots budgets).\n\nINPUTS:\nBRIEF: ' + JSON.stringify(brief) + '\nMANIFEST: ' + JSON.stringify(layout.manifest) + '\nMOCK INTAKE (voice and phrasesToAvoid): ' + JSON.stringify(MOCK.intake) + '\n\nFor EACH pattern in the manifest, look up its copy_slots in data/pattern-certifications.json. Instantiate each repeatable slot to the pattern instances count. For every slot, write text that:\n- is grounded in the brief talking_points and the mock intake (audience problems, decision triggers, primaryConversion) and weaves the LSI and secondary keywords naturally;\n- carries pattern_slug and slot_ref and the EXACT max_chars, max_words, and sibling_group denormalized from that registry copy_slot (do NOT invent caps);\n- stays a few characters UNDER each max_chars;\n- for any sibling_group (such as card bodies) keeps all members within 1.25x of each other in character length;\n- obeys the Mechanical Copy Rules: NO em or en dashes, no smart or curly quotes, no ellipsis character. Straight apostrophes and quotes ARE required for natural English (write "the dog\'s coat", not "the dog coat"); only the curly forms are banned. Use none of the phrasesToAvoid (brand list plus framework defaults);\n- never writes the H1 or H2 heading text as a slot (put the brief H1 and section H2s in locked_headings only).\nSet site to the mock niche and geography; set source to briefs "(mock)", intake "(mock)", compositions "(mock)", generatedBy "copywriter"; set word_count_target from the brief. Return ONLY the copy-deck object. Write no files.'
let deck = await agent(writePrompt, { schema: DECK_SCHEMA, model: 'sonnet', label: 'copywriter:write', phase: 'Write' })

phase('QA')
const qaMechPrompt = (d) => 'You are the mechanical QA gate for the pipeline test. Validate the copy-deck with the REAL framework validator functions, never touching canonical repo files.\nSteps:\n1. Create the directory tmp/copywriter-e2e (mkdir -p).\n2. Write these files with the Write tool, each containing exactly the JSON or source given:\n   - tmp/copywriter-e2e/copy-deck.json = the DECK JSON below.\n   - tmp/copywriter-e2e/page-compositions.json = the MANIFEST JSON below.\n   - tmp/copywriter-e2e/site-intake.json = the INTAKE JSON below.\n   - tmp/copywriter-e2e/verify.mjs = the VERIFIER source below, verbatim.\n3. Run: node tmp/copywriter-e2e/verify.mjs   (capture stdout and the exit code).\n4. Return passed=true ONLY if stdout contains "COPYCHECK PASS" and the exit code is 0; otherwise passed=false and fail_lines = the lines printed after "COPYCHECK FAIL". Put the full stdout in raw_output.\nDo NOT modify any file outside tmp/copywriter-e2e/.\n\nDECK:\n' + JSON.stringify(d) + '\n\nMANIFEST:\n' + JSON.stringify(layout.manifest) + '\n\nINTAKE:\n' + JSON.stringify(MOCK.intake) + '\n\nVERIFIER (write verbatim to tmp/copywriter-e2e/verify.mjs):\n' + VERIFIER
let qa = await agent(qaMechPrompt(deck), { schema: QA_MECH_SCHEMA, model: 'sonnet', label: 'qa:copy-check', phase: 'QA' })

let fixes = 0
while (!qa.passed && fixes < 2) {
  const fixPrompt = 'The copy-deck below FAILED validation in the pipeline test. Fix ONLY the listed failures and return the FULL corrected deck. Keep all passing slots unchanged. Honor the same rules: exact registry caps (matched by pattern_slug and slot_ref against data/pattern-certifications.json), no em or en dashes, no smart or curly quotes (but straight apostrophes ARE allowed and required for natural English), no phrases-to-avoid, every slot a few characters under max_chars, and sibling_group members within 1.25x of each other.\n\nFAILURES:\n' + JSON.stringify(qa.fail_lines, null, 2) + '\n\nCURRENT DECK:\n' + JSON.stringify(deck) + '\n\nReturn ONLY the corrected copy-deck object.'
  deck = await agent(fixPrompt, { schema: DECK_SCHEMA, model: 'sonnet', label: 'copywriter:fix-' + (fixes + 1), phase: 'Write' })
  qa = await agent(qaMechPrompt(deck), { schema: QA_MECH_SCHEMA, model: 'sonnet', label: 'qa:recheck-' + (fixes + 1), phase: 'QA' })
  fixes++
}

phase('Review')
// copy-review: an INDEPENDENT Opus QA reviewer that returns a band + slot-level findings.
const reviewPrompt = (d, q) => 'You are the Supersonic copy-review skill: an INDEPENDENT QA reviewer (own context, Opus). Read .claude/skills/copy-review/SKILL.md and BRAND.md, then grade the copy deck against the brand voice and the SEO brief and fold in the mechanical QA result.\n\nBRIEF: ' + JSON.stringify(brief) + '\nMANIFEST: ' + JSON.stringify(layout.manifest) + '\nDECK: ' + JSON.stringify(d) + '\nMECHANICAL QA: ' + JSON.stringify(q) + '\nMOCK INTAKE (every factual claim must trace here): ' + JSON.stringify(MOCK.intake) + '\n\nScore voice fidelity, persuasion/conversion, brief coverage, claim grounding, readability, and ownership integrity. This single SERVICE page has commercial intent, so EVERY slot is a money-page slot. An unsupported factual claim or an ownership violation (an SEO title/meta/slug/schema/heading written as an editable slot) is a BLOCKER. Set verdict to "pass", "needs-revision", or "blocked" with a 2 to 3 sentence summary. TRY HARD to find at least one real defect (a weak or off-voice line, a thin section, a missed talking point, a dropped apostrophe, or a claim not in the mock intake). For each finding set area to the offending slot id, plus severity, issue, and evidence. Return ONLY the object.'
let review = await agent(reviewPrompt(deck, qa), { schema: QA_REVIEW_SCHEMA, model: 'opus', label: 'copy-review', phase: 'Review' })

// Apply copy-review findings: rewrite ONLY the flagged slots on OPUS (money page), re-run the mechanical gate, re-review. Cap 2 rounds.
let revisions = 0
while (review.verdict && review.verdict !== 'pass' && Array.isArray(review.findings) && review.findings.length > 0 && revisions < 2) {
  const reviewFixPrompt = 'You are the Supersonic copywriter applying copy-review findings. This is a money page, so rewrite the flagged slots on Opus. Fix ONLY the slots named in the findings (match by the slot id in each finding "area"); keep every other slot byte-identical. Honor the EXACT registry caps (match pattern_slug + slot_ref against data/pattern-certifications.json), the Mechanical Copy Rules (no em or en dashes, no smart or curly quotes; straight apostrophes ARE required for natural English), none of the phrases-to-avoid, every slot a few characters under max_chars, and sibling_group members within 1.25x of each other. Ground every claim in the mock intake.\n\nCOPY-REVIEW FINDINGS:\n' + JSON.stringify(review.findings, null, 2) + '\n\nCURRENT DECK:\n' + JSON.stringify(deck) + '\n\nMOCK INTAKE:\n' + JSON.stringify(MOCK.intake) + '\n\nReturn ONLY the corrected copy-deck object.'
  deck = await agent(reviewFixPrompt, { schema: DECK_SCHEMA, model: 'opus', label: 'copywriter:review-fix-' + (revisions + 1), phase: 'Write' })
  qa = await agent(qaMechPrompt(deck), { schema: QA_MECH_SCHEMA, model: 'sonnet', label: 'qa:recheck-after-review-' + (revisions + 1), phase: 'QA' })
  review = await agent(reviewPrompt(deck, qa), { schema: QA_REVIEW_SCHEMA, model: 'opus', label: 'copy-review-' + (revisions + 1), phase: 'Review' })
  revisions++
}

log('Pipeline complete: copy:check passed=' + qa.passed + ' after ' + fixes + ' mech fix(es); copy-review verdict=' + review.verdict + ' after ' + revisions + ' review revision(s)')
return { business: MOCK.business, service_page: MOCK.service_page, artifacts_dir: 'tmp/copywriter-e2e/', mech_fix_iterations: fixes, review_revisions: revisions, brief, page, layout, deck, qa, review }
