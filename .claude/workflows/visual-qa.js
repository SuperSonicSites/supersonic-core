export const meta = {
  name: 'visual-qa',
  description: 'Repo-agnostic visual QA: discover scope, create a temp QA page per pattern, capture 3 breakpoints, review, trash the page, adversarially verify, synthesize a report. Implements .claude/skills/visual-qa/SKILL.md.',
  whenToUse: 'Run after a theme/pattern change to QA the current release on staging. Works on any site cloned from supersonic-core — discovers version, theme, targets, and staging at runtime. Defaults to a safe DRY-RUN (source-only, no staging writes). Pass args {live:true} to create/capture/trash temporary qa-pattern pages, and {targets:["hero-simple",...]} to restrict scope.',
  phases: [
    { title: 'Discover', detail: 'version, latest report, theme patterns, staging up', model: 'haiku' },
    { title: 'Review', detail: 'per pattern: create QA page, capture 3 breakpoints, review, trash page', model: 'sonnet' },
    { title: 'Verify', detail: 'one agent per finding: refute against source', model: 'opus' },
    { title: 'Synthesize', detail: 'dedupe, prioritize, write the report', model: 'opus' },
  ],
}

// ---- Handoff contract (schemas) -------------------------------------------

const DISCOVER_SCHEMA = {
  type: 'object',
  required: ['version', 'themeDir', 'themeSlug', 'stagingReady', 'targets'],
  properties: {
    version: { type: 'string' },
    themeDir: { type: 'string' },
    themeSlug: { type: 'string', description: 'theme folder name, e.g. supersonic-site-theme' },
    latestReport: { type: 'string' },
    stagingReady: { type: 'boolean' },
    stagingNote: { type: 'string' },
    knownOpenFindings: { type: 'array', items: { type: 'string' } },
    targets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'patternSlug', 'file'],
        properties: {
          name: { type: 'string', description: 'short pattern name, e.g. hero-simple' },
          patternSlug: { type: 'string', description: 'full registered slug, e.g. supersonic-site-theme/hero-simple' },
          file: { type: 'string', description: 'path to the pattern .php' },
        },
      },
    },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['target', 'pageLifecycle', 'screenshots', 'findings'],
  properties: {
    target: { type: 'string' },
    pageLifecycle: {
      type: 'object',
      required: ['created', 'trashed'],
      properties: {
        created: { type: 'boolean' },
        pageId: { type: ['number', 'string', 'null'] },
        url: { type: 'string' },
        trashed: { type: 'boolean' },
        note: { type: 'string', description: 'any lifecycle problem, e.g. create failed, trash failed' },
      },
    },
    screenshots: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'severity', 'breakpoint', 'evidence', 'suspectedSource'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'nit'] },
          breakpoint: { type: 'string', enum: ['desktop', 'tablet', 'mobile', 'all'] },
          evidence: { type: 'string' },
          suspectedSource: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['id', 'verdict', 'reasoning', 'sourceConfirmed'],
  properties: {
    id: { type: 'string' },
    verdict: { type: 'string', enum: ['real', 'false-positive'] },
    reasoning: { type: 'string' },
    sourceConfirmed: { type: 'boolean' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object',
  required: ['reportPath', 'summary', 'counts', 'approval'],
  properties: {
    reportPath: { type: 'string' },
    summary: { type: 'string' },
    counts: {
      type: 'object',
      properties: {
        critical: { type: 'number' }, high: { type: 'number' },
        medium: { type: 'number' }, low: { type: 'number' }, nit: { type: 'number' },
      },
    },
    coverage: { type: 'string', description: 'how many targets got real per-pattern captures vs blocked' },
    approval: { type: 'string', enum: ['pass', 'pass-with-polish', 'fail'] },
  },
}

// args can arrive as an object OR as a JSON string (the runtime does not always
// parse it). Normalize to an object so flags are read reliably.
let opts = args
if (typeof opts === 'string') {
  try { opts = JSON.parse(opts) } catch { opts = {} }
}
if (!opts || typeof opts !== 'object') opts = {}

// SAFETY DEFAULT: live staging writes happen ONLY when the caller explicitly
// opts in with live === true. If args does not propagate, we stay in dry-run
// and never create/trash pages — preventing an accidental full live run.
const goLive = opts.live === true
const dryRunOnly = !goLive
const restrictTo = Array.isArray(opts.targets) ? opts.targets : null
// Dry-runs must never clobber the canonical release report.
const reportSuffix = dryRunOnly ? '-visual-qa-dryrun' : '-visual-qa'

// Wrap agent() so a single StructuredOutput miss degrades to null instead of
// failing the whole workflow. Callers filter nulls.
async function safeAgent(prompt, opts) {
  try {
    return await agent(prompt, opts)
  } catch (e) {
    log(`agent failed (${opts && opts.label ? opts.label : 'unlabeled'}): ${String(e && e.message || e).slice(0, 160)}`)
    return null
  }
}

// Every schema-bound prompt ends with this so agents reliably emit the tool call.
const FINAL = '\n\nIMPORTANT: your FINAL action must be the StructuredOutput tool call containing the JSON. Do not end with a plain-text message — call StructuredOutput exactly once as your last step.'

// ---- Stage 1: Discover (Haiku) --------------------------------------------

phase('Discover')
const scope = await agent(
  `You are the discovery stage of the visual-qa SOP (.claude/skills/visual-qa/SKILL.md). Repo-agnostic — discover everything, hardcode nothing. IMPORTANT: do not write any scratch files into the repo (no discovery.json, no file lists). Return JSON only.

Do this:
1. Read the "version" field from package.json.
2. Find the latest QA report: the highest-versioned file matching docs/reports/*qa*.md. Read its "Prioritized fix list" and "Remaining risks / verify visually on staging" sections; list those item titles in knownOpenFindings. Set latestReport to its path (or "").
3. Find the theme by glob: the wp-content/themes/*/ dir that contains a patterns/ folder. themeSlug is that folder name; themeDir is its path. Glob patterns/*.php for the pattern list.
4. Confirm staging: run \`npm run rest:check\` (exit 0 + HTTP 200 = ready). Run \`npm run rest:certify\` and note whether the active theme version matches package.json; put that in stagingNote.
5. Build the FULL targets list (all patterns in the theme). The caller filters this list in code afterward, so always return every pattern. For each: name (file basename without .php), patternSlug ("<themeSlug>/<name>"), file (the .php path). The registered slug is always "<themeSlug>/<name>" for theme patterns.

Return the discovery JSON.${FINAL}`,
  { schema: DISCOVER_SCHEMA, model: 'haiku', phase: 'Discover', label: 'discover-scope' }
)

if (!scope || !scope.stagingReady) {
  log('Staging not reachable or discovery failed — aborting. Check WP_STAGING_URL/.env and rerun.')
  return { aborted: true, scope }
}
if (!scope.targets || scope.targets.length === 0) {
  log('No QA targets discovered — nothing to review.')
  return { aborted: true, scope }
}

// Enforce the target restriction IN CODE — never trust the discovery agent to honor it.
let targets = scope.targets
if (restrictTo) {
  targets = targets.filter((t) => restrictTo.includes(t.name) || restrictTo.includes(t.patternSlug))
  if (targets.length === 0) {
    log(`Restriction ${JSON.stringify(restrictTo)} matched none of the ${scope.targets.length} discovered patterns — aborting.`)
    return { aborted: true, restrictTo, discovered: scope.targets.map((t) => t.name) }
  }
}
log(`v${scope.version}, theme ${scope.themeSlug}, ${targets.length} of ${scope.targets.length} pattern(s). ${dryRunOnly ? 'DRY-RUN (default): no staging pages will be written.' : 'LIVE: each target gets a temp QA page (created, captured, trashed).'} ${scope.stagingNote || ''}`)

const reviewFolder = `${scope.version}-visual-qa`

// ---- Stages 2+3: Review (Sonnet) -> Verify (Opus), pipelined --------------
// The whole QA-page lifecycle (create -> capture -> review -> trash) lives in
// ONE agent per target so the page is always trashed, even if a step fails.

const perTarget = await pipeline(
  targets,
  // Stage 2: lifecycle + review — Sonnet
  (t) => safeAgent(
    `You are a review agent in the visual-qa SOP. Target pattern: "${t.name}" (slug ${t.patternSlug}, source ${t.file}).

Goal: capture this ONE pattern in isolation on staging, review it at 3 breakpoints, and ALWAYS clean up the temp page afterward.

${dryRunOnly
  ? `DRY-RUN MODE: do NOT create or trash pages. Instead run \`npm run rest:qa-page:dry-run -- --pattern ${t.patternSlug}\` to show the payload, set pageLifecycle.created=false and trashed=false with note "dry-run", screenshots=[], and review the pattern from SOURCE ONLY (${t.file} + theme.json + DESIGN_SYSTEM.md). Flag source-grounded issues; do not invent visual ones.`
  : `LIFECYCLE (follow in order; you MUST run the trash step at the end even if an earlier step fails):
1. CREATE a temp staging QA page rendering only this pattern:
   npm run rest:qa-page:create -- --pattern ${t.patternSlug} --confirm
   Parse the JSON result for "id" and "link" (it may say "reused" if the page already existed — that is fine). Record id and url in pageLifecycle. If create fails, set created=false, note the error, skip capture, and still attempt nothing to trash.
2. CAPTURE all three breakpoints in one run (desktop 1440 / tablet 768 / mobile 390 are automatic):
   npm run screenshot -- --url "<link from step 1>" --selector "main" --label "${t.name}" --out "screenshots/after/${reviewFolder}"
   If it errors with a Playwright error, run \`npm install\` once and retry. The QA page renders the pattern as the main content plus theme header/footer; review the pattern, noting chrome only if it interferes.
3. READ each captured PNG.
4. REVIEW against QA_CHECKLIST.md (Screenshot Review + Token Editability) and DESIGN_SYSTEM.md: token-based spacing (one section spacing token), no horizontal overflow, 5% gutter + 1440px max width, typography scale, readability, alignment, hierarchy, image cropping, CTA visibility, mobile stacking, tablet layout, approved shadow presets only (soft/medium), consistency with the design system. Cross-check against these known-open items if relevant: ${JSON.stringify(scope.knownOpenFindings || [])}.
5. TRASH the temp page to clean up (REQUIRED):
   npm run rest:qa-page:trash -- --id <id from step 1> --confirm
   Set pageLifecycle.trashed=true on success; if it fails, trashed=false with the error in note.`}

For each issue give it a stable id "${t.name}-N", a severity, the breakpoint, concrete evidence (what you saw in which screenshot, or "source-only" in dry-run), and suspectedSource (pattern file + line/token). If clean, return an empty findings array. Do not write scratch files into the repo.

Return the review JSON (include screenshot paths and the pageLifecycle object).${FINAL}`,
    { schema: REVIEW_SCHEMA, model: 'sonnet', phase: 'Review', label: `review:${t.name}` }
  ),
  // Stage 3: verify each finding — Opus
  (review, t) => {
    if (!review || !review.findings || review.findings.length === 0) {
      return { target: t.name, lifecycle: review?.pageLifecycle, screenshots: review?.screenshots || [], verified: [] }
    }
    return parallel(
      review.findings.map((f) => () =>
        safeAgent(
          `You are an adversarial verifier in the visual-qa SOP. Try to REFUTE this finding by reading the actual source. Default to "false-positive" if the source does not clearly support it.

Finding ${f.id}: ${f.title}
Severity claimed: ${f.severity} | Breakpoint: ${f.breakpoint}
Evidence: ${f.evidence}
Suspected source: ${f.suspectedSource}

Open the pattern file (${t.file}) and any token definitions in theme.json / DESIGN_SYSTEM.md you need. Decide: real defect grounded in source, or false positive (intentional placeholder, correct token, screenshot artifact, etc.)? Set sourceConfirmed true only if you actually opened the source and it supports the verdict.${FINAL}`,
          { schema: VERDICT_SCHEMA, model: 'opus', phase: 'Verify', label: `verify:${f.id}` }
        ).then((v) => ({ ...f, ...(v || { verdict: 'false-positive', reasoning: 'verifier returned null', sourceConfirmed: false }) }))
      )
    ).then((verified) => ({ target: t.name, lifecycle: review.pageLifecycle, screenshots: review.screenshots, verified: verified.filter(Boolean) }))
  }
)

const clean = perTarget.filter(Boolean)
const allVerified = clean.flatMap((r) => r.verified.map((f) => ({ ...f, target: r.target })))
const real = allVerified.filter((f) => f.verdict === 'real')
const dismissed = allVerified.filter((f) => f.verdict === 'false-positive')
const allShots = clean.flatMap((r) => r.screenshots)

// Coverage + lifecycle hygiene accounting.
const captured = clean.filter((r) => r.lifecycle && r.lifecycle.created && (r.screenshots || []).length > 0)
const leakedPages = clean.filter((r) => r.lifecycle && r.lifecycle.created && !r.lifecycle.trashed)
log(`Reviewed ${clean.length} target(s): ${captured.length} with real captures, ${real.length} confirmed finding(s), ${dismissed.length} dismissed.`)
if (leakedPages.length > 0) {
  log(`WARNING: ${leakedPages.length} QA page(s) may not have been trashed: ${leakedPages.map((r) => `${r.target}(id ${r.lifecycle.pageId})`).join(', ')}. Run \`npm run rest:pages\` and trash leftovers with \`npm run rest:qa-page:trash -- --id <id> --confirm\`.`)
}

// ---- Stage 4: Synthesize (Opus) ------------------------------------------

phase('Synthesize')
const result = await safeAgent(
  `You are the synthesis stage of the visual-qa SOP. Write the release QA report.

Context:
- version: ${scope.version}
- theme: ${scope.themeSlug} (${scope.themeDir})
- staging note: ${scope.stagingNote || 'n/a'}
- mode: ${dryRunOnly ? 'DRY-RUN (source-only, no pages created)' : 'live (temp QA page per pattern, created + trashed)'}
- targets: ${scope.targets.length}; with real captures: ${captured.length}
- QA pages possibly not trashed: ${JSON.stringify(leakedPages.map((r) => ({ target: r.target, pageId: r.lifecycle?.pageId })))}
- screenshots captured: ${JSON.stringify(allShots)}
- CONFIRMED findings (verdict=real): ${JSON.stringify(real)}
- DISMISSED (verdict=false-positive — list as "considered and dismissed" so future runs do not re-flag): ${JSON.stringify(dismissed)}

Write a markdown report to docs/reports/${scope.version}${reportSuffix}.md, matching the format of the latest existing report in docs/reports/ (read one for structure).${dryRunOnly ? ' This is a DRY-RUN report — title it clearly as a dry-run/source-only preview and do NOT overwrite the canonical release report.' : ''} Include: scope reviewed, active theme/plugin version on staging, method (this workflow + model tiers + the create/capture/trash page lifecycle), screenshots captured (paths), coverage (targets captured vs blocked), a prioritized fix list by severity, a "considered and dismissed" section, remaining risks / verify-visually items, any QA pages that need manual cleanup, and an approval status (pass / pass-with-polish / fail). Use the project's own report style; do not invent findings beyond those provided. Do not write scratch files into the repo other than the report itself.

Then return the synthesis JSON.${FINAL}`,
  { schema: SYNTH_SCHEMA, model: 'opus', phase: 'Synthesize', label: 'synthesize-report' }
)

log(`Report: ${result?.reportPath || 'docs/reports/' + scope.version + reportSuffix + '.md'} — ${result?.approval || 'see report'}`)
return {
  version: scope.version,
  targets: scope.targets.length,
  captured: captured.length,
  confirmed: real.length,
  dismissed: dismissed.length,
  leakedPages: leakedPages.map((r) => ({ target: r.target, pageId: r.lifecycle?.pageId })),
  report: result,
}
