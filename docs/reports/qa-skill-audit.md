# QA Skill & Workflow — Quality Audit

Audit of the Supersonic Quality Assurance skill and workflow surface.

- Date: 2026-05-31
- Scope: `.claude/skills/visual-qa/SKILL.md`, `.claude/workflows/visual-qa.js`,
  `.claude/commands/qa-review.md`, `QA_CHECKLIST.md`, `docs/pattern-qa-template.md`,
  `docs/workflows/theme-pattern-certification.md`, plus backing tools
  (`tools/staging-rest.mjs`, `tools/capture-screenshots.mjs`) and the `docs/reports/` format.

## Summary

The QA machinery is well-engineered: schema-validated JSON handoffs between stages,
`safeAgent` degradation, a code-enforced (not agent-trusted) target filter, model tiers
matched to task difficulty, an adversarial verify stage that defaults to false-positive,
leaked-page accounting, and a dry-run-by-default safety gate. Every npm script the
skill/workflow references exists, and the breakpoint/file-naming claims match
`capture-screenshots.mjs` (1440 / 768 / 390; `<label>-<bp>.png`).

The weaknesses were **governance alignment** (the autonomous live path outran the
framework's approval rules) and **documentation/format drift** (the docs moved faster than
the skill's hardcoded assumptions). All findings below have been addressed except where
noted as a standing recommendation.

## Findings & resolution

### High

**1. Live mode bypassed the framework's approval gate.** `{live:true}` fans out
`rest:qa-page:create --confirm` then `rest:qa-page:trash --confirm` across every pattern
with no per-run approval, contradicting `CLAUDE.md` and `theme-pattern-certification.md`,
which make live REST writes and cleanup a human-approval gate.
**Resolved (decision: document `{live:true}` as the approval).** `CLAUDE.md` and
`theme-pattern-certification.md` now state that invoking the workflow with `{live:true}`
*is* the explicit approval for its self-contained `qa-pattern-*` create→capture→trash
lifecycle; all other live REST writes still require separate approval.

### Medium

**2. Report-format drift broke scope discovery.** SKILL Step 0 and the discover agent
extracted open findings by reading the sections "Prioritized fix list" and "Remaining risks
/ verify visually on staging". The latest report (`0.1.13-visual-qa.md`) uses numbered
headings (`Findings By Severity`, `Remaining Risks / Verify Visually`) with **no**
"Prioritized fix list", so carry-forward was brittle.
**Resolved.** Canonical report headings are now defined in SKILL Step 4 and enforced in the
synthesis prompt; discovery (skill + workflow) falls back to the severity-ranked findings
list when canonical headings are absent.

**3. Skill showed PowerShell-only commands on a bash/Linux runtime.** SKILL.md used
```powershell``` blocks and `$env:WP_STAGING_URL`, invalid in this environment.
**Resolved.** Examples are now bash (`$WP_STAGING_URL`), with a one-line PowerShell note.

**4. Stale version pinned into generic checklists.** `QA_CHECKLIST.md` and
`theme-pattern-certification.md` hardcoded "0.1.5 batch" guidance; repo is at 0.1.13.
**Resolved.** Genericized to "large batch."

**5. Two divergent QA entry points, not cross-referenced.** `/qa-review` runs the combined
`QA_CHECKLIST.md` pass (visual + a11y + SEO + single-H1 + header-nav scoping); the
`visual-qa` skill/workflow is the multi-agent visual-only pass and drops a11y/SEO. Neither
pointed at the other, so a user could run one and silently skip the other's checks.
**Resolved.** `/qa-review` and SKILL Step 4 now cross-link and state each pass's coverage
boundary.

### Low / polish

**6. "Dry-run" was mislabeled as visual QA.** Dry-run reviews source only and cannot catch
overflow/stacking/cropping — the point of visual QA — yet wrote a `*-visual-qa-dryrun.md`
report. **Resolved.** Synthesis now titles dry-run output a "static/source-only pre-check,
not a visual QA pass."

**7. Selector guidance contradicted itself.** SKILL stressed tight per-section selectors;
the workflow hardcodes `--selector "main"`. **Resolved.** SKILL now documents the QA-page
exception (the pattern *is* the main content).

**8. Verify-stage cost.** One Opus agent per finding plus Opus synthesis is expensive at
fan-out scale. **Standing recommendation** (no change): consider Sonnet-verify with Opus
escalation only for borderline verdicts.

**9. Checklist duplication / drift risk.** Token-editability rules are restated in
`QA_CHECKLIST.md`, `pattern-qa-template.md`, `theme-pattern-certification.md`, and the
SKILL with slightly different wording — the same condition that produced finding #2.
**Standing recommendation** (no change): consolidate to one source of truth with references.

## Approval status

Pass-with-polish. Findings #1–#7 resolved in this change; #8 and #9 left as standing
recommendations.
