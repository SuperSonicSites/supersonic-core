# Agent Quality Standard

This standard applies to every repo-local agent skill and command in `.claude/`.
It keeps future work contract-first, evidence-backed, and safe around local user
changes.

## Core Behavior

- Discover repo facts before asking the user.
- Ask only when the answer is a real product, design, security, deployment, or
  approval tradeoff.
- Define the contract before changing files or staging content.
- Prove critical claims with static checks, browser checks, screenshots, report
  evidence, or a clearly labeled manual gap.
- Fail closed when proof is missing: use `needs-revision`, `blocked`, or
  `not-approved`, not `approved`.
- Preserve unrelated local work and stage only intentional changes.
- Keep Git as the source of truth.

## Delegation

An orchestrator may delegate execution to a focused coder sub-agent when the
contract is fully defined. Keep the split clean:

- The orchestrator owns judgment: the contract, the proof gates, and the final
  accept or reject decision.
- The coder receives only the contract plus the affected files, works in its own
  context, and returns a diff with proof.
- The orchestrator verifies the returned work against the proof gates before
  accepting it. Unverified delegated work is not proof.

Delegate only when the contract is precise enough that the coder needs no
further product, design, security, or approval judgment. Otherwise resolve the
contract first.

For Codex, `AGENTS.md` is the always-loaded delegation entry point. Codex should
act as the orchestrator unless a focused implementation sub-agent is explicitly
available. If no sub-agent is available, Codex must still keep the phases
separate: finish discovery and contract thinking, execute the contracted change,
then verify the diff against the proof gates before accepting it.

## New Skill Creation

Every new repo-local skill in `.claude/skills/<skill-name>/SKILL.md` must use
the same methodology as existing skills.

Required skill shape:

- YAML frontmatter contains only `name` and `description`.
- `description` starts with the trigger context, using clear "Use when..."
  language so the skill is selected at the right time.
- Body stays concise and procedural.
- The skill references `docs/agent-quality-standard.md`.
- The skill includes `## Discovery`, `## Contract`, `## Proof Gates`,
  `## Failure Policy`, and `## Report`.
- Scripts, references, and assets are added only when they make the skill more
  reliable or token-efficient.
- New scripts bundled with a skill are tested.
- Complex or high-risk skills are forward-tested when it is practical.

## Skill Methodology Template

Use this body shape for new repo-local skills:

```markdown
# [Skill Name]

Use this skill when...
Also follow `docs/agent-quality-standard.md`.

## Discovery

Inspect...

## Contract

Define...

## Proof Gates

- Prove...

## Failure Policy

Fail closed when...

## Report

Include...
```

## Command Shape

Repo-local commands in `.claude/commands/*.md` follow a lighter procedural shape
than skills:

- YAML frontmatter contains a non-empty `description`.
- The body is a short numbered procedure, not the skill section set.
- Each command references `docs/agent-quality-standard.md` and uses explicit
  `contract`, `proof`, and `fail closed` language.

Commands are validated for these terms; they do not require the skill
`Discovery / Contract / Proof Gates / Failure Policy / Report` headings.

## Discovery

Every task starts with the smallest useful discovery pass:

- read `CLAUDE.md`, `README.md`, and `SITE.md`
- read the matching repo-local skill in `.claude/skills/`
- read scoped `CLAUDE.md` files for affected theme or plugin areas
- inspect relevant source files, reports, registry entries, and package scripts
- check `git status --short` before editing

Do not ask the user for facts that the repo, staging read-only tools, or current
source can answer safely.

## Contract

Before acting, define what the work must make true.

For patterns, the contract must include a control contract card:

```text
Pattern:
Category:
Selected block:
Promised controls:
Owning block for each control:
Expected proof:
Manual-only gaps:
```

For non-pattern tasks, define scope, affected files, required approvals, checks,
and what evidence will make the task pass.

## Proof Gates

Use the cheapest proof that actually verifies the claim.

- Static proof: source inspection, validators, package checks, registry checks.
- Staging proof: read-only staging checks and cache-busted staging URLs.
- Visual proof: desktop, tablet, and mobile screenshots of the reviewed target.
- Interaction proof: hover, click, open/closed, keyboard, overlay, focus, or
  reduced-motion states when behavior is interactive.
- Report proof: a written `Proof Summary` in the QA or certification report.

For visual pattern QA, target the reviewed pattern under `main` whenever a QA
page is used. Do not approve screenshots that capture unrelated page chrome or
the wrong selector.

## Failure Policy

Fail closed when evidence is incomplete.

- Missing screenshots: `needs-revision`.
- Missing editor proof: `needs-revision` with the manual gap named.
- Missing interaction-state evidence for header/footer/nav/accordion/overlay
  behavior: `needs-revision`.
- Static validator failure: fix or keep status `not-approved`.
- Staging version mismatch: stop approval and report the mismatch.
- Live REST write without dry-run and approval: do not proceed.

Manual-only gaps are allowed in reports, but they do not silently become proof.
The report must say what was not verified and what remains recommended.

## Proof Summary

Use this section in every durable QA or certification report:

```text
## Proof Summary

- Static proof:
- Staging proof:
- Visual proof:
- Interaction proof:
- Editor-control proof:
- Tool proof:
- Manual-only gaps:
```

These six labels plus `Tool proof` are the single canonical Proof Summary structure.
Every review skill uses these exact labels (not renamed variants), so a parent review
can fold child reviews together without reconciling section names. `Tool proof` lists the
machine evidence and JSON artifact paths produced by measurement tools (for example
`npm run a11y:check`); use `n/a` when a section does not apply rather than dropping it.

## Report

Every durable QA or certification report must include:

- scope
- contract
- `Proof Summary`
- screenshots or evidence paths
- static checks run
- staging checks run, if relevant
- interaction checks run, if relevant
- issues found and fixes made
- manual-only gaps
- approval status

Use `approved` only when the contract is satisfied and proof exists. Use
`needs-revision` when the work may be visually promising but the evidence is not
complete.

## Review Finding Contract

Every review skill (`layout-review`, `copy-review`, `visual-qa`,
`accessibility-review`, `seo-auditor`) and the machine audits (`tools/a11y-audit.mjs`)
emit findings in ONE shape, defined by `data/review-finding.schema.json`. Before this
contract each review used its own fields and its own severity words, so a parent review
could not actually merge a child review's output. The shared shape makes findings
machine-mergeable.

### One severity scale

`blocker | major | minor | nit`. No other words.

- `blocker` = must fix before approval.
- `major` = fix before ship.
- `minor` = should fix.
- `nit` = optional polish.

Map external scales onto it. axe impact: `critical -> blocker`, `serious -> major`,
`moderate -> minor`, `minor -> nit`. The retired visual-qa scale:
`critical -> blocker`, `high -> major`, `medium -> minor`, `low -> nit`, `nit -> nit`.

### Tool proof, not judgment, for what tools can measure

Contrast, target size, labels, and focus order are no longer "manual-only gaps". Run
`npm run a11y:check -- --url <staging>`; it runs axe-core at all three viewports and emits
findings with `tool_proof` set. Findings with `tool_proof` are measured evidence, and a
review must prefer them over an eyeballed judgment for the same dimension.

### Bounded feedback loop (copy-review and layout-review)

The review->fix loop is a contract, not prose:

- Max 2 rounds. Round 1 scores and emits fixes; round 2 verifies the fixes. The
  synthesize handoff carries `round` and `escalated_upstream`.
- Recurring-blocker rule: if a finding with the same `rule_id` + `target` reappears after
  a fix, do NOT open round 3. Escalate the band to `blocked` and route the root cause
  upstream (`layout-architect` / `pattern-builder` / `seo-strategist`) with the evidence.
- `dismissed[]` is the authoritative do-not-re-flag set; round 2 must exclude those ids.

### Cross-skill merge (layout-review owns it)

Because all skills emit one finding shape, `layout-review` folds in
`accessibility-review`, `seo-auditor`, and `visual-qa` deterministically:

- Worst-severity-wins on the same `(rule_id, target)`: dedupe across skills, keep the max
  severity.
- A merged finding sets its parent dimension status (axe contrast -> COLOR; axe
  target-size/focus -> A11Y; seo H1/heading -> HEAD; thin content / `COVERAGE-*` -> the
  content dimension; visual-qa overflow/console -> the grid dimension). The existing
  worst-severity-wins band rule then computes the overall band.
