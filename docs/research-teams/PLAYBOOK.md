# Research team playbook — adversarial fan-out for research and solution-building

Extends [`../TECHNIQUES.md`](../TECHNIQUES.md)'s research discipline into a reusable multi-agent
methodology (Eric, 2026-09-04: don't-assume + reputable-source discipline, red/blue/purple/tiger/
yellow fan-out "as makes sense," a learning loop to hone each team's results over time, and
battle-testing candidate solutions before committing when there's no clear path). Read the relevant
section when a task actually needs it — this is reference, not a checklist to run every time.

## Don't make assumptions

- **Code over memory.** Verify against the actual current file, not your recollection of writing it
  — even (especially) within the same session. Concrete cost of skipping this: the four
  `docs/grind/*.instructions.md` files shipped in #1315 with a real isolation-guidance bug (`docs/
  grind/fix-doc-rot.instructions.md` recommended *no* worktree isolation specifically to avoid a
  race, when isolation is what prevents one) — caught only because the file was re-read fresh
  against `grind.js`'s actual scheduling semantics before first real use, not assumed correct
  because it had just been written. `../TECHNIQUES.md`'s "Tool documentation is the authority"
  section says this for *external* tools; it applies at least as much to this repo's own code.
- **Reputable sources, and the discipline to tell them apart.** `../TECHNIQUES.md`'s "Source
  hygiene" section already says prefer primary sources, label authority
  (`[official]`/`[research]`/`[practitioner opinion]`), and distrust confidently-worded summaries.
  Red flags worth naming explicitly when evaluating an external source:
  - No named author, no date, no citations to anything checkable.
  - Confident claims with no mechanism given — a number with no methodology is not evidence.
  - Contradicts a primary source (the vendor's own docs, the actual paper) without explaining why.
  - SEO/content-farm structure: broad claims first, thin specifics, optimized for a keyword rather
    than answering the actual question.
  - A single source presented as consensus — cross-check anything load-bearing against a second,
    independent source before treating it as settled.
  - Financial or promotional interest in the claim, undisclosed (a vendor's page "reviewing" its
    own product category).
  - Outdated information presented as current — check the date against how fast the domain moves.

## When multi-team fan-out earns its cost

`../TECHNIQUES.md` already carries a load-bearing caveat: *"more critics ≈ majority voting... N
independent critics rarely beat simple self-consistency at equal cost; multi-round debate wanders
off the question... not orchestrated debate machinery."* That caveat is about **N identical
critics** — the same role, the same prompt, just copies voting. It does not contradict the
red/blue/purple/tiger/yellow pattern below, which assigns each agent a **distinct objective**
(attack vs. defend vs. reconcile vs. threat-model vs. build) — closer to `workflow-authoring`'s
"perspective-diverse verify" (*"diversity catches failure modes redundancy can't"*) than to N-copy
voting. The distinction matters: don't reach for 5 differentiated roles where 3 identical critics
would do, and don't reach for 3 identical critics where the task genuinely has 5 different failure
modes to catch.

Price it with the same rigor formula `../TECHNIQUES.md` already uses (reversibility × blast-radius
× uncertainty): a quick correctness check on a small diff wants one well-scoped review, not a
five-role production. Full team fan-out earns its cost when the underlying decision is genuinely
uncertain, touches enough surface that one perspective will miss real failure modes, and the cost of
being wrong (shipping something unsafe, or silently discarding something good) is real — e.g. this
repo's own grind-improvement research (#1315, #1316), which had to survey every gate in the repo,
tell apart genuinely-safe batch chores from plausible-looking-but-wrong ones, and check against
`envelope.json` before recommending anything be automated.

## The team-role library

Honesty about provenance: **red and blue team are established security terms** (attacker /
defender). **Purple team**, in the security literature, usually means facilitating live
collaboration between red and blue rather than a separate synthesis step — this repo's usage
(reconcile red's and blue's independent verdicts into one ranked list) is an adaptation, not the
canonical definition. **Tiger team** originates in aerospace/systems engineering (Apollo-era) as an
elite team assembled for a specific hard problem, not necessarily adversarial — this repo's usage
(a dedicated blast-radius/threat-model pass) borrows the name for its "assembled for one hard
question" flavor. **Yellow team**, where it appears in security team-color taxonomies (alongside
green), usually means builders/architects — this repo's usage (build-feasibility, drafting the real
artifact) matches that reasonably well. Use these names for their *shape*, not as a claim they're
all equally standardized — say so if a future adaptation drifts further from the source term.

Reusable per-role objective (adapt the specifics per task; keep the objective fixed):

- **Discover** (N parallel, one per angle/source) — find candidates/evidence from genuinely
  different vantage points (this repo's own gates, git/PR history, the skills/agents roster, prior
  written-down ideas, live sibling-session activity — see "Mining live signal" below). Each angle
  should be blind to what the others find.
- **Red** — attack every candidate the discovery phase surfaced. Default to skepticism; a finding
  that survives genuine attack is the only kind that should. Steelman the opposition even for a
  "strong" verdict — a candidate with no stated weakness got insufficient scrutiny, not a clean bill
  of health.
- **Blue** — build the strongest real case for the same candidates, independently (don't show it
  red's output first, or blue just rebuts red instead of making its own case). Ground claims in
  live verification (re-run the check, don't trust the raw evidence's stated count), not restated
  assertion.
- **Purple** — reconcile red and blue into one ranked list. A red objection that blue's case didn't
  address should pull a candidate down; a red objection blue's spec concretely answers shouldn't. Say
  which happened, per candidate — a reconciliation with no visible reasoning is just a coin flip
  wearing a lab coat.
- **Tiger** — thread the survivors through this repo's actual hard constraints (`envelope.json`,
  the irreversible class, blast radius if the recommendation is wrong at scale) rather than
  re-litigating red/blue's arguments. Downgrade anything that fails this check even if red and blue
  both liked it.
- **Yellow** — build the concrete, ready-to-use artifact for whatever survives, grounded in the
  actual current API/tool (not a remembered or assumed one — see "Don't make assumptions" above),
  and report friction hit while doing so as feedback on the tool itself.

## Battle-testing candidate solutions (not just findings)

When building something and there's no clear path, generalize the same team structure to
**competing solution designs** instead of research candidates: generate 2–3 genuinely different
approaches (not variations on one idea), then run red/tiger (or the full chain, if stakes warrant
it) against each design rather than against a single default. This is `workflow-authoring`'s "judge
panel" pattern (*"generate N independent attempts from different angles... synthesize from the
winner while grafting the best ideas from runners-up... beats one-attempt-iterated when the
solution space is wide"*) — reach for it specifically when the *right approach* is the actual
uncertainty, not just whether one particular approach is correct.

## Mining live signal, not just static docs

A research pass into this repo's own process/tooling should pull from **live, in-flight activity**
— other sessions' recent PRs and issue comments — not only `docs/IDEAS.md`/`docs/LESSONS.md` and
static gate output. Concrete example: this playbook exists partly because pulling PR #1309's body
(a sibling session's fix for issue #1028, "a build session can complete with zero visible outcome")
surfaced a real gap in `/grind` itself that no static doc mentioned — see the lesson below. Check
`ListAgents`/`list_sessions` for concurrently-running sessions touching the same repo, and read a
sample of their recent PR bodies/issue comments before concluding a research pass is thorough.

## Lessons — append-only, like `docs/LESSONS.md`, but scoped to *running research well*

Each real research/team-fan-out run should add what it learned about the *mechanics* here — not
findings about the codebase (those go in `docs/IDEAS.md`/an issue), but what would make the next
research pass sharper. This is the actual "hone the skillsets over time" mechanism: there's no
persistent memory across separate `Workflow` invocations, so the honing has to live in this checked-
in doc, which every future pass's prompts should be written from.

- **2026-09-04 — verify the harness's actual concurrency semantics before writing "run
  sequentially"/"run isolated" guidance into an artifact.** The doc-rot instructions.md file
  initially recommended `isolation: false` reasoning it would avoid a race, when it does the
  opposite (concurrent agents without a fresh worktree share one working directory and collide on
  `git checkout`). Fix: state the *mechanism*, not just the recommended setting, in any
  calling-convention note — a wrong setting with its reasoning spelled out gets caught on re-read;
  a bare setting doesn't.
- **2026-09-04 — a mechanically-enforced "did this actually happen" check beats trusting a
  structured-output schema's self-report.** `/grind`'s `RESULT_SCHEMA` requires `{status, summary}`
  from every step, but nothing verifies a `status:"done"` step actually pushed a branch or made the
  claimed change — the same failure class issue #1028 named and PR #1309 fixed for the feedback-
  triage lane (a session completing with zero visible outcome, because nothing checked GitHub's own
  state). Fixed the same day, the same way #1309 did it — check the world, not the claim: a step
  reports the branch it pushed in an optional `branch` field, `{prev.<field>}` substitution exposes
  it to the next step, and every checked-in instructions.md chains
  `git ls-remote --exit-code --heads origin {prev.branch}` after itself, so a `done` with no branch
  on origin fails closed (`docs/grind/README.md` → "Verify the outcome mechanically"). The
  transferable lesson: when one lane fixes a failure class, grep the other lanes for the same
  shape before calling the fix done.
- **2026-09-04 — differentiated-role fan-out (this playbook) is not the same failure mode
  `../TECHNIQUES.md` warns about, but say so explicitly or the caveat reads as a blanket objection.**
  Recorded above under "When multi-team fan-out earns its cost" so the next reader doesn't have to
  re-derive the distinction.
