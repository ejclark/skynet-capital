# The coaching staff — detect-and-correct loops against slop

> Anything below that touches GitHub issue/PR orchestration now operates under **Moneypenny's**
> mandate — see [`docs/MONEYPENNY.md`](MONEYPENNY.md). The dispatch policy and roles below are
> unchanged; she is the address Eric directs orchestration asks to, and she routes to these
> mechanisms rather than replacing them.

AI builds fast; unregulated speed compounds into slop. We run quality like a football staff — three
seats with distinct jobs:

- **Head coach (orchestrator).** Decides what runs when: WIP limits, dispatch, merge tempo, and the
  don't-collide-with-feature-work rule. The policy is codified as the **`/governor`** drill
  (`.claude/skills/governor/SKILL.md`): one dispatch cycle — WIP check → gate-named target → collision
  check → cheap-tier athlete → PR with auto-merge per the merge-policy table. Judgment calls (what may
  auto-merge, recruiting new athletes) remain Eric + Claude in-session; scheduling the cycle is earned
  by reps, not assumed.
- **Defensive coordinator.** Protects the standard: breaks down complexity and organizes the pieces.
  Owns the detect-and-correct units below (gates, ratchets, drills, athletes). Defense keeps entropy
  from scoring.
- **Offensive coordinator.** Scales up systems where a **constraint** binds (Theory of Constraints:
  *elevate*). Owns capability plays: the single-runner pipeline (GHA-minutes constraint), the local
  verify gate (review-trust constraint), Babylon MCP (domain-knowledge constraint), the local dev loop
  (iteration-speed constraint). Offense moves the ceiling; each play is triggered by a *measured*
  constraint, never speculation — same discipline as run-scale infra.

## The defensive unit — one quality dimension per loop

- **Eye (fitness function):** an executable eval that measures the dimension and enforces a committed,
  **ratchet-down-only budget** in CI. Prose audits drift; evals don't.
- **Drill (skill):** the repeatable corrective procedure, invokable as a slash command by a human or
  loaded by an agent. One safe, behavior-preserving move per PR.
- **Athlete (agent):** a scoped background worker that runs eye → drill → small green PR, off the
  critical path.

Slop accumulates precisely in the dimensions no defensive loop watches. Growing this roster *is* the
quality strategy (audit: `docs/ENGINEERING-AUDIT-2026-07.md`).

## The codification ladder — how work becomes delegable

Work descends this ladder as its contract gets written; each rung frees the head coach's attention:

1. **Manual** — done ad hoc in-session; judgment throughout.
2. **Skill** — the procedure is codified (a drill, e.g. `/decompose`, `/dedupe`); a human or Claude invokes it.
3. **Gated** — the trigger is mechanized (`--candidate` names the target); no one picks the work.
4. **Agent** — the full contract (trigger, procedure, verification, output) is written; a background athlete runs it end to end.

**The rule of three applies to agents:** do it manually once; codify the skill on the second recurrence; promote to an agent on the third. Speculative roster-building is premature abstraction — the roster recruits itself from demonstrated repetition. A subagent is what a piece of work becomes when its contract is complete. What cannot yet be contracted — taste, the yay/nay on a scene, which constraint matters next — stays with the head coach. **Model tier follows contract completeness:** rung-4 work runs on cheaper/faster models; judgment-incomplete work keeps the judgment tier — the floors are `docs/COMPUTE.md`'s table. Every toil-killer is the same loop (measure → judge → one bounded move → ratchet); defense's move is subtraction, offense's is substitution.

## Resource cost is a fitness dimension

The constraint isn't only Eric's attention — it's every **finite resource** a run consumes: tokens,
GitHub API budget (esp. the scarce 5k/hr GraphQL bucket), GHA minutes, wall-clock. Treat waste in
these the way defense treats slop: measure it, and convert the recurring cost into a one-time one.

**Codify the loop into a script/codemod.** A model-in-the-loop procedure costs tokens (and often API
calls) *every* time; a script is a one-time build cost, then **~free per run forever** — and it can't
drift back to the expensive habit the way a prose instruction can. This is the self-healing flywheel:
each codified loop lowers the marginal cost of the next unit of work, so throughput compounds while
cost falls. Sound architecture + proper tooling + clean config make the next script cheaper to build,
compounding it further.

Worked example (the one that motivated this): landing a PR via the GitHub **MCP** spends **GraphQL**
by the thousands (one create+auto-merge+read cycle measured ~6,000 points; status-*polling* is worse),
while the same outcome over `git` + repo-scoped **REST** runs on your machine and the plentiful 15k/hr
**core** bucket. The fix was codified as `scripts/ship.sh` + the `/ship` skill: verify locally → push →
open over REST → **stop** (the pipeline arms auto-merge after integration tests) → **trust the webhook, never poll**. Reach for the script;
grow the roster of scripts as recurring costs surface. When a finite resource starts binding, that's a
*measured* constraint the offensive coordinator elevates — never optimize a resource speculatively.

## Resource cost, mechanized (2026-09-04)

The dimension above was named in doctrine for a while before it had an eye behind it — three
incidents in one evening (docs/LESSONS.md: a stale-ref detour, a cache key fixed in the wrong job,
then the fix for that) each needed Eric to read a live Actions log and say something, because
nothing in the system watched CI wall-clock the way `incident-scan.mjs` watches unlearned
incidents or `dead-scan.mjs` watches unused code. `scripts/ci-install-duration-scan.mjs` /
`ci-install-duration-budget.json` (advisory, `tests/arch/ci-install-duration.spec.ts`) closes that
gap the same shape as every other gate here: sample the `verify` job's install-step durations over
recent runs, ratchet a budget down as real green data accumulates. The budget starts loose
(600s) deliberately — the cache fix it's watching for is itself unverified as this is written; it
tightens for real once a few post-fix runs prove the number, per the grandfather-then-shrink
doctrine below, not by guessing at a target today.

## Adopting a convention creates conformance debt — grandfather, then shrink

First separate the two kinds of convention, because they create very different debt:

- **Retroactive-judging** (a lint rule, a design token, a naming standard) — instantly makes the
  *existing* corpus non-conforming. Do **not** big-bang-rewrite history: **grandfather the existing
  violations, conform all NEW work, ratchet the budget down as files are touched** — exactly how the
  arch/clone/spec-gap gates already work. The debt is real but paid down incrementally, never in a
  churn-heavy sweep.
- **Forward-additive** (EARS — a *new artifact* you start producing: formal requirement statements) —
  creates ~**no back-catalog debt**, because there was nothing of that kind before to be non-conforming.
  You don't grandfather anything; you just start doing it on new work. Beware the category error of
  "conforming" things the convention doesn't even govern — EARS judges *requirements*, not the existing
  *specs* (verifications) or shipped plans, so those need no retrofit at all.

"Adopt EARS" was ~5 files precisely because it's forward-additive — not because 80 files were
grandfathered. Diagnose which kind you're adopting before you reach for a sweep.

## A gate is a momentum breaker unless it protects a constraint (2026-09-06)

Eric, after one thread hit the 300-line file cap three times, the cognitive-complexity cap twice
and commitlint's body line length once — all on a data-only refactor that caught zero defects:
*"process like the 300-line cap may be a smell now… a possible case to completely deprecate these
[possibly now antiquated] safety layers… That removes a momentum breaker which allows for
compounding momentum."* Two facts settled it. First, the 2026-08-29 call already demoted every
**debt-class** gate (arch, dupe, dead, clone, spec-gap, doc-rot) from blocking to advisory; file
size and cognitive complexity are the same class — the arch coach owns them with a grandfather
list and the decomposer athlete — yet they still hard-gated inside `biome check`, so the dimension
was enforced twice, once post-merge by the athlete and once mid-flow on the author. Second, the
tells of a gate that has outlived its convention: **carve-outs accumulate** (five per-file
`noExcessiveLinesPerFile` overrides, three inline complexity ignores), it **fires unevenly**
(the 2,779-line `authenticator.ts` never tripped it), and it **teaches evasion** (#1361 moved
rationale into docstrings to dodge it). Two PRs the same morning, converging from two threads:
#1722 (issue #1713) turned the line cap off and made `arch-scan` the **single** size cap, counted
in code lines, still advisory; this note's PR takes `noExcessiveCognitiveComplexity` to a
**warning** — visible in every lint run, never red. (The same PR also switched off commitlint's
`body-max-line-length`; Eric reversed that within the hour — the conventional-commit rules are
a contract the release tooling and every reader of `git log` depend on, not a taste gate, and
a 101-char body line is the author's to wrap. Restored in the follow-up PR. The lesson for the
classification below: "debt-class" is a property of what the gate *measures* — file size and
complexity are shape, a commit's format is an interface.) The classification rule for the next
one: a blocking gate must
protect a *constraint* (correctness, security, the envelope, Eric's attention — the fridge rule's
format checks stay) or a *contract another lane depends on* (the placement gates of #1449/#1717).
A gate that protects taste or debt is advisory with a ratchet and an athlete, never a red
mid-flow. Demoting a gate is not lowering the bar; the athlete still chips the debt, off the
critical path.

**Worked example, both kinds at once (2026-09-04):** the event-research lane's forward-test ids
(then one shared `docs/research/forward-tests.md`; since #1449 one fragment per event under
`docs/research/forward-tests/`) were a shared, globally-incrementing bare number computed by
reading the file's live tip — a real race across concurrent sessions, caught once already (two PRs
both registering `FT-25`, resolved by hand). The fix is forward-additive on the id *scheme*
(`.github/prompts/event-research.md` now namespaces new ids to the session's own assigned event,
`FT-<event-id>-<n>`, which can't collide because it never reads a file every sibling is also
reading) but retroactive-judging on the *mechanical check behind it*: `forward-test-id-scan.mjs`
found the already-known `FT-25` collision fixed, and also found **seven** more pre-existing id
collisions this fix did not cause and wasn't scoped to repair. `forward-test-id-budget.json` starts
at that measured `7`, not a fabricated `0` — the honest number, ratcheted down as those rows get
renumbered, exactly as `clone-budget.json` starts non-zero rather than claiming clean.

**Second instance — the code-map freshness check (2026-09-30, #4074).** The last blocking piece of
the doc-rot coach, "structural graph freshness", failed any PR once `main` ran 50 commits past the
`docs/STRUCTURE-graph.md` snapshot — an ambient property of `main`, not of the diff, and `main` now
moves ~50 commits a day, so 3 of one session's 5 PRs carried an unrelated ~1,000-line refresh
(#3830, #3984, #4070). Its "correctness, not hygiene" claim didn't survive a read: blast-radius
queries (`graphify affected`) read the live, git-ignored `graphify-out/`, never the committed
snapshot, so a stale map is navigation debt. Demoted to advisory (still printed on every `npm test`).
The same read found the measurement broken: `graph:refresh` stamps the PR branch's sha, which
squash-merge drops, so on `main` the check read UNKNOWN; it now measures from the commit that landed
the snapshot. Falsifier: the map ≥ 500 commits behind and unrefreshed by 2026-10-31 → give the
refresh an owner (a scheduled refresh is envelope-class, Eric's call), not a red.

**Corollary — know who the convention is for.** EARS is a *developer* convention: it lives in
dev-facing intake (the PR template, plans, the `/ears` drill). User-facing intake (the issue
templates, the `/feedback` form) stays **plain-language** for non-technical friends & family — triage
translates their report into EARS acceptance criteria (via `/ears`) *before* it becomes buildable work.
A convention that taxes the wrong audience is slop wearing a suit.

## Detection lag is the metric that finds the gaps in the system itself

Every coach above watches the *code*. One watches **us**: the learning Coach
(`scripts/incident-scan.mjs` → `/retro` → `docs/LESSONS.md`). Its dimension is **detection lag** —
the time between the earliest moment a failure *could* have been noticed and the moment it actually
was. Lag of seconds (a spec goes red) means the nets are working. Lag of days means an entire class
of failure is currently invisible, and *that* is the finding — always bigger than the bug that
revealed it.

**The correct half of that coach is Moneypenny's repair lane** (added 2026-08-22 as "CI Medic",
renamed #912, after a feedback build died in a bash step and stayed silent until Eric read the
Actions tab by hand — docs/LESSONS.md). A failed run on `main` wakes
`.github/workflows/moneypenny-repair.yml`, which files ONE capsule issue carrying the failing job,
step and log tail, then dispatches a repair session whose terminal state is a PR or a
`needs-eric` comment. Four loop guards keep a self-healing lane from feeding itself: it ignores its
own failures, acts only on default-branch runs, files once per failure signature (recurrences
comment), and goes silent on any signature already escalated. The signature is the workflow plus the
job name with a matrix leg's values stripped (#3913): keying on the leg made one failing job file 19
issues, so the leg is now a row in the body and never part of the key. Workflow-file repairs may be
opened but never auto-merged — that carve-out is unchanged.


Two rules fall out, both paid for the hard way (see the ledger):

- **When you change a shared system, enumerate every actor that crosses it.** Branch protection has
  more consumers than pull requests (semantic-release pushes to `main`); npm's `prepare` has more
  callers than developers (the Dockerfile's `npm ci`, which runs *before* `COPY . .`). Both deploy
  outages were the same move: a correct change to a shared thing, with the consumer list never
  enumerated. The second name on that list is usually the bug.
- **Prefer shortening detection lag over preventing the specific bug.** Fixing one instance buys one
  instance; a signal that surfaces the whole class buys every future one. The outage that motivated
  this Coach was invisible for four merges *because nothing watched a red `main`* — the missing
  watcher was the real defect, and it is now the eye.

**Put the watcher on a path you already walk — never add a poller.** The tempting way to watch a red
`main` is a scheduled workflow: a cron that wakes up and *asks*. That spends GHA minutes and API
budget on a question, which is exactly the pattern `scripts/ship.sh` exists to delete — a monitor
built that way is the resource-cost smell wearing a safety vest. Instead, hang the check on traffic
that already flows. Every change here ships through `ship.sh open`, so the incident eye runs there:
one REST call on the core bucket, at the one moment the answer changes a decision (don't stack a
change on a broken `main`). Detection lag collapses to "the next time we ship" for zero recurring
cost. Generalize it: **a monitor that needs its own schedule is usually a monitor attached to the
wrong event.** Find the existing checkpoint first.

**Isolate before you attribute.** When a system sums many contributions into one observable — a
shader's colour, a layout's final position, a number assembled from several terms — the most recent
edit is the most *available* explanation and usually the wrong one. Prove which path produces the
symptom by zeroing the suspect and re-observing; if it survives, every further tweak to that suspect
is waste. This is the same failure as the enumerate-every-actor rule in a different medium: both are
reasoning about a system from a local edit rather than from its real inputs. The ledger records
three instances in a single session, each costing a full iteration.

A failure is also the cheapest map of an unguarded region: while standing in it, log the adjacent
"what else is exposed this way?" threads to `docs/IDEAS.md` as side quests. That is the learning
flywheel — each incident buys both a prevention and a set of leads.

## Sourcing rule

**Adopt what's generic; craft what's bound to our gates.** Generic craftsmanship (code review, security
review, simplification) is solved — use the bundled skills. Anything that leans on our mechanics
(arch-grandfather, dupe-budget, Graphify, the design system) must be crafted here. Community skills are a
supply-chain decision: read them fully before adopting.

## Defensive roster

**A `✅ live` row is a claim with evidence, never an aspiration:** the eye has a caller (`npm test`
through `tests/arch/*.spec.ts`, a workflow, or a skill step) *and* a spec, or the row says
`partial` and names what is missing. Checked 2026-09-26: every ✅ script had two or more callers
except `config-audit.mjs`, which the secretary ran by hand and nothing else did; it gained its
caller and row with #3769 slice 2. The rule is zpratt/lousy-agents' "Partial beats false Shipped"
(its capability matrix counts a thing shipped only with release notes *and* tests), adopted after
the #3754 platter promise showed what a prose-only status costs.

| Coach | Eye (eval + budget) | Drill (skill) | Athlete (agent) | Status |
|---|---|---|---|---|
| **Agent surface** (a skill whose frontmatter name is not its directory, an agent without a description or `Use when`, a hook wired to an event Claude Code does not fire — each silent at runtime) | `scripts/agent-surface-scan.mjs` + `tests/arch/agent-surface.spec.ts` (advisory in `npm test`; `npm run agent-surface:scan`; hook events read from `docs/vendor/claude-code/hooks.md`, never memory; no vendored doc → UNKNOWN, exit 2) | fix the file; `/charter` for an agent, the skill's own `Use when` for a skill | none (recruit on recurrence #3) | ✅ live |
| **Config/capability drift** (capabilities nothing routes to, owner claims that contradict CLAUDE.md, recurring corrections that want a template) | `scripts/config-audit.mjs` + `tests/arch/config-audit.spec.ts` (advisory in `npm test`; proposals only, writes nothing; `npm run config:audit`; the secretary digest carries its four sections) | a human approves each proposal from the digest (`/secretary`) | none — proposals are a human's by construction | ✅ live |
| **Size** (god files) | `scripts/arch-scan.mjs` + `arch-grandfather.json` (flat exceptions list, not a numbered budget — 2026-08-26, see the script's own header) + `tests/arch/god-file.spec.ts`. Since #1713 it is the codebase's only size cap and counts **code lines** (`scripts/code-lines.mjs`): 300 across `src`, `app/src`, `scripts`, 500 in `tests` — Biome's `noExcessiveLinesPerFile` is off, having charged full price for `//` lines while collapsing template literals to one | `/decompose` | `decomposer` | ✅ live |
| **Duplication** (pasted helpers) | `scripts/dupe-scan.mjs` + `dupe-budget.json` + `tests/arch/dupe.spec.ts` | `/dedupe` | `ui-librarian` | ✅ live |
| **Clones** (pasted blocks, renamed identifiers) | `scripts/clone-scan.mjs` (jscpd, adopted) + `.jscpd.json` + `clone-budget.json` + `tests/arch/clone.spec.ts` | `/dedupe` judgment | `ui-librarian` could extend later | ✅ live |
| **Dead code** (unused files/exports/types) | `scripts/dead-scan.mjs` (knip, adopted) + `dead-budget.json` + `tests/arch/dead.spec.ts` | `/bury` (judge: un-export / delete / justify-ignore) | `mortician` (recruited on recurrence #3, per the rule of three; preloads `/bury`) | ✅ live |
| **Dep-graph** (cycles/orphans/layering) | `scripts/dep-graph-scan.mjs` (dependency-cruiser, adopted) + `.dependency-cruiser.cjs` + `dep-graph-budget.json` + `tests/arch/dep-graph.spec.ts` | judge: break cycle / wire-or-delete orphan / restore layer direction (`/decompose` when a cycle wants a split) | none yet (recruit on recurrence #3) | ✅ live |
| **Spec gap** (src files no spec imports) | `scripts/spec-gap-scan.mjs` + `spec-gap-budget.json` + `tests/arch/spec-gap.spec.ts` (rstest has no line coverage yet — eye upgrades when it ships) | `/backfill` (BDD specs per ENGINEERING.md) | `test-backfiller` (preloads `/backfill`) | ✅ live |
| **Unlearned incidents** (detection lag) | `scripts/incident-scan.mjs` + `incident-budget.json` + `tests/arch/lessons.spec.ts` (offline half: ledger integrity; remote half: failed `main` runs with no lesson) | `/retro` | **Moneypenny (repair)** — `.github/workflows/moneypenny-repair.yml` + `scripts/moneypenny/repair.mjs` (event-driven, not dispatched by the governor; formerly "CI Medic") | ✅ live |
| **CI install duration** (verify job's dependency-install wall-clock) | `scripts/ci-install-duration-scan.mjs` + `ci-install-duration-budget.json` + `tests/arch/ci-install-duration.spec.ts` (median over recent successful runs, no-op offline) | check for a missing `Cache restored` line, fix the cache scope/key, then ratchet | none yet (recruit on recurrence #3) | ✅ live |
| **Forward-test id collisions** (two `docs/research/forward-tests/*.md` rows sharing one `FT-...` id — the event-research lane's concurrent-sessions race) | `scripts/forward-test-id-scan.mjs` + `forward-test-id-budget.json` + `tests/arch/forward-test-id.spec.ts` (pure text-file check, no token/network, always runnable); its `--contract` mode is the BLOCKING placement gate (`tests/arch/forward-tests-fragments.spec.ts`: one fragment per event, no rows in the index — #1449) | renumber the colliding row, then ratchet; new registrations use `.github/prompts/event-research.md`'s event-namespaced `FT-<event-id>-<n>` scheme so this never fires on a fresh id again | none yet (recruit on recurrence #3) | ✅ live |
| **Journey coverage** (a living screen no member journey step visits at phone width; a screen the code has that `docs/members/triage.json` never judged) | `scripts/crawl/coverage.mjs --json` + `scripts/crawl/coverage-budget.mjs` + `journey-coverage-budget.json` + `tests/arch/journey-coverage.spec.ts` — the unjudged half BLOCKS (triage is the contract other lanes read); the gap count is advisory, ratchet-down | add a phone journey step that visits the screen, or re-judge it in triage, then `--update` | none yet (recruit on recurrence #3) | ✅ live |
| **Doc rot** (docs that no longer describe reality: dead file refs, missing npm scripts, stale structural map) | `scripts/doc-rot-scan.mjs` + `doc-rot-budget.json` + `tests/arch/doc-rot.spec.ts` (semantic-claim rot stays with the config-audit — honestly out of a deterministic eye's reach) | fix doc to match reality, then ratchet | none yet (recruit on recurrence #3) | ✅ live |
| **Comment bloat** (narration comments — bare issue/PR refs, "used by X", "added for Y" — that `docs/ENGINEERING.md` → *WHY earns its place* rules out; git blame/the PR already carry that history) | `scripts/comment-bloat-scan.mjs` + `comment-bloat-budget.json` + `tests/arch/comment-bloat.spec.ts` (flags candidates only — WHY-vs-narration judgment stays with review, same honesty limit as doc-rot's semantic half) | `/code-review`/`/simplify` checklist: keep only if non-obvious WHY, else delete, then ratchet | none yet (recruit on recurrence #3) | ✅ live |
| **Mermaid skill drift** (the /mermaid skill telling sessions less than github.com draws: cards still calling GitHub's version unknown or deferring features at or below the pin, syntax-table encodings the card's "Emphasis without hue" section never names with no recorded decision, registered diagram types with no card) | `scripts/mermaid-skill-scan.mjs` + `mermaid-skill-budget.json` + `.claude/skills/mermaid/encodings-ledger.json` + `tests/arch/mermaid-skill.spec.ts` (lexicon-based for encodings — a row named without any encoding term is honestly out of reach; widen the lexicon on a miss) | reword to the pin / name it in the emphasis section or record a ledger decision / write the card, then ratchet | none yet (recruit on recurrence #3) | ✅ live |
| **Workflow structure** (duplicate keys, dangling step/needs refs) | `scripts/workflow-lint.mjs` + `tests/arch/workflows.spec.ts` | fix the file, diff it against the last-good version | Moneypenny's repair lane files it when a run reports zero jobs | ✅ live |
| **PR merge conflicts** (a PR goes `CONFLICTING` against `main` with no CI signal at all) | `moneypenny.mjs`'s (formerly `postmaster.mjs`) push-driven audit (#909) — `gh pr list`'s `mergeable` field, one-ping-per-PR via `conflict-flagged` | judge disjoint-vs-same-logic; merge `main` in and push a resolved merge commit, or `needs-eric` | Moneypenny detects + dispatches; her repair lane's `workflow_dispatch` entry point repairs it (`.github/prompts/moneypenny-conflict-repair.md`) | ✅ live |
| **Inline-JS defects** (`<script>` syntax) | extract + `node --check` per page — *not built* | — | — | ⬜ queued |
| Code review | *(adopted)* | `/code-review` | — | ✅ bundled |
| Security review | *(adopted)* | `/security-review` | — | ✅ bundled |
| Simplification | *(adopted)* | `/simplify` | — | ✅ bundled |

## Special teams — situational units

Not every play is a down-in/down-out defensive loop. Special teams are situational crews with their own playbooks, run occasionally:

- **dep-warden** — reviews dependency-update PRs: reads changelogs, runs the suite, merges patch/minor on green, escalates majors. Built: `.claude/agents/dep-warden.md`.
- **Layout-resize audit** — a phone rotation (load, scroll, resize with no reload) on every
  rail-bearing `/app/*` route, checking whether anything inside `.rail` leaks past its own box or
  into `.stage`. Catches a class a per-width screenshot sweep structurally cannot: CSS that
  resolves correctly on every fresh load and only breaks across a resize (docs/LESSONS.md,
  2026-09-06 — the Research calendar's `aspect-ratio` + grid-track interaction). Deliberately not
  a gate: Eric's call (2026-09-06) was that catching this "all the time" isn't worth the per-PR
  cost, but a periodic sweep is. `npm run scan:layout-resize` (human report) / `-- --json` (a
  `/grind` fan-out's input, if a sweep ever turns up several instances at once); `--strict` exits
  1, for a future promotion to the defensive roster if repeated sweeps keep finding real bugs
  (the rule of three, same as any other eye). Built: `scripts/layout-resize-scan.mjs`.
- **Migrations** — one-shot tool/platform upgrades (e.g. Biome 2.x): run the migrator, triage fallout with judgment, land as one PR.
- **Incident response** — rollback drills, post-deploy failure handling (the pipeline's smoke → rollback is the mechanized first responder).
- **Release verification** — periodic prod screenshot/probe beyond the smoke test.
- **Config audit digest** — rides the secretary digest Routine (docs/ROUTINES.md): the digest's
  session runs `node scripts/config-audit.mjs` and folds any non-empty section into the digest's
  Needs-you tier. Deliberately claude.ai-side, not a periodic GitHub Actions workflow: the audit's
  most interesting check (recurring-intent clustering) reads `data/duel-log.jsonl`, which is
  `.gitignore`d machine-local session history a GHA runner's fresh checkout can never see — a
  workflow would silently run three of four checks forever. (Honest limit: a fresh Routine session
  without that history degrades the same way — the script returns the other checks and claims
  nothing false — so the clustering check only bites in sessions on a long-lived checkout.) Still
  evidence-triggered and human-gated: the script writes nothing, opens nothing, and the digest
  cannot escalate a finding past its notification — Eric decides what (if anything) to act on,
  same as running it by hand. It held its own daily Routine until 2026-08-19; that trigger fired
  into checkout-less sessions and never once ran the script (docs/ROUTINES.md, Retired), so the
  clock was folded into the digest's.
- **Doctrine digest** (issue #2287, PR 8) — rides the secretary digest Routine, same shape as the
  config-audit ride-along above: the digest's session runs `node scripts/doctrine-scan.mjs --due`
  and folds any due dossier into the Needs-you tier. Not a code-quality gate (the defensive roster
  above is about this codebase's own structure; this is about a persona's TRADING doctrine — its
  stated rules, checked against the tape) — `scripts/doctrine-scan.mjs` reads `docs/BOTS-<PERSONA>.md`
  dossiers' append-only "Adaptation ledger" tables and flags a `Next check` date that's passed with
  no row appended to resolve it, mirroring `forward-test-pending.mjs`'s due/unscored detection for
  the market-event research register, one persona-doctrine register instead of one per event.
  `doctrine-budget.json` + `--candidate`/`--update` give it the same ratchet shape as the
  code-quality eyes above, but it stays advisory (no `tests/arch/*.spec.ts` wires it in — a stale
  doctrine ledger is Eric's judgment call to act on, never a blocked merge). Evidence-triggered and
  human-gated, same as config-audit: the script writes nothing, opens nothing, and the digest cannot
  escalate a finding past its notification.

Dead-code, duplication, size — those stay regular defense: same eye/drill/ratchet shape every down.

## The scaling test — two axes, opposite defaults

Every decision gets asked *"does this scale?"* — but the answer depends on which axis, and the two run
**opposite** directions:

- **Build-scale (code · architecture · process): design as if thousands contribute.** Solo-with-agents
  effectively *is* a large team — many parallel hands, high commit velocity, no shared memory between
  sessions. So the eval question "would 10,000 engineers trip over this?" applies today: cohesion, no
  junk drawers, single-sourced helpers, machine-checkable conventions. Organized, high-quality code is
  what scales the *ability to build*.
- **Run-scale (infrastructure · platform): design for the real load — 5–10 people.** Here the enterprise
  reflex is the smell: microservices, k8s, caching tiers, queues for ten friends is slop wearing a suit.
  One Fly app + smoke + rollback is *correct* at this load. Infra earns complexity only when **measured**
  load demands it — never speculatively.

One line: **scale the ability to build, not the machinery to serve.** Confusing the axes is the classic
failure in both directions (spaghetti that can't grow ↔ a cluster for ten users).

## Smell catalog — what the eyes look for (and what stays judgment)

Every smell is either **mechanizable** (→ becomes/extends an eval) or **judgment** (→ lives in a drill's
checklist). Route new smells accordingly; a smell that stays prose in someone's head protects nothing.

| Smell | Kind | Where it's handled |
|---|---|---|
| God file (size) | mechanized | `arch-scan` |
| Exact duplication (same symbol, N files) | mechanized | `dupe-scan` |
| **Junk drawer** (`utils.ts`/`helpers.ts`/`common.ts`/`misc.ts` — cohesion by what it *isn't*) | mechanized | `arch-scan` (junk-drawer check) |
| Near-duplication ("something similar exists") | judgment | `/dedupe` drill — **rule of three:** abstract on the third occurrence, not the second; premature abstraction couples things that merely look alike |
| Sanity checks bleeding downstream (re-validating what a boundary should guarantee) | judgment | review checklist — fix the *boundary* (zod at the edges, audit C3), don't scatter guards |
| Design-system drift (pasted tokens/styles) | mechanized (coarse) | `dupe-scan` today; richer token-diff eval later |

## Atomic design — the decompose grammar

Decomposition needs a *target shape*, not just "smaller." We use atomic design:

- **Atoms** — one job, no siblings' knowledge: `escapeHtml`, `chip()`, a shader, a payoff function.
- **Molecules** — a few atoms with one purpose: a card, a nav, the Eye (shader + lids + gaze).
- **Organisms** — molecules composing a surface: a dashboard view, the tower scene, the login stage.

**Atoms are the default floor.** Go sub-atomic only when a concrete need calls (a second consumer wants
half the atom) — never speculatively. Over-splitting is the mirror-image slop: a thousand two-line files
with the complexity moved into the wiring.

## How the loop runs (and stays orderly)

- Every eye enforces in CI through the ordinary test job — a Coach's dimension cannot silently regress.
- Budgets **only ratchet down** (`--update` after a correction lands), so every win is permanent.
- `--candidate` makes each eye name its own highest-leverage target, machine-readable — no human picks.
- **WIP limit: one open structural PR per Coach.** The unit is an **open PR awaiting merge, not a
  concurrent dispatch** — `/governor` already fans every coach's athlete out in parallel isolated
  worktrees and lands them as one cycle PR (feast mode goes further: multiple fenced seams per
  dispatch, one platter PR). The limit protects two things, and both of them are *landing*-time
  hazards: (1) the next `--candidate` is recomputed from fresh `main`, so a target is never
  re-derived against a stale tree; (2) each coach's `--update` rewrites one shared, ratchet-down
  budget file, so it must run **once per landed wave** — two worktrees racing it silently lose a
  ratchet. So a batch of N independent targets for the same Coach (e.g. `/grind` fanning
  `/decompose` across two arch-scan hits) is in bounds when **one file belongs to exactly one item**
  and the wave lands as **one PR** with **one** `--update` after it. Docs-only chores (`doc-rot`,
  `comment-bloat`) have no Coach and touch no `src/**` seam — this rule was never scoped to them.
- **`/governor`'s normal cycle vs. feast mode vs. `/grind` on a Coach's own athlete — one rule, not
  two half-agreeing docs** (`docs/grind/README.md`'s own "when to reach for this" section points
  here rather than restating a narrower version). Pick by whether the target list is known up front
  and whether dynamic re-triggering is needed:
  - Routine, one-target-at-a-time burn-down → `/governor`'s normal cycle, or
    [`docs/grind/governor.instructions.md`](grind/governor.instructions.md) — the same cycle's
    dispatch steps as a chore, one item per coach, which is the shape the 2026-10-03 sunset review
    below settled on. Either way the gate picks the target and the wave lands as one cycle PR.
  - The target list isn't fully known up front, or new targets should unblock reactively as fenced
    seams land within one sitting → `/governor` feast mode — its "every athlete completion is a
    mini-cycle trigger" re-checks the fence ledger for newly-unblocked work, something a static item
    list cannot do.
  - A known, fixed batch of targets for one athlete's own chore, no dynamic re-triggering needed →
    `/grind` fanning that athlete's skill (`/bury` and `/backfill` carry their own calling
    conventions; `/decompose` and `/dedupe` are equally fannable). Land the wave the
    *same shape* feast mode's own platter step already uses — merge each item's verified branch into
    one wave branch, verify the union once, open one PR, auto-merge normally per the merge-policy
    table below — **never** via `scripts/ship.sh platter`, a different mechanism reserved for the
    irreversible class (it never auto-merges, by design — see its own header comment). The two share
    a name and nothing else; don't conflate them.
  - No coach/athlete involved at all (research, doc-rot, comment-bloat) → `/grind`, its primary and
    uncontested case.
- Adding a Coach = one eval + one budget + one CI spec + one skill (+ optionally one agent). Use
  `skill-creator` and mirror an existing pair so the roster stays uniform.

## Sunset review — the first one, 2026-10-03 (#3939 slice 3)

Machinery earns its place or loses it, and the only honest way to tell is to count. The rule
`/charter` already holds for a *new* agent — never trust an unchecked usage claim, in either
direction — pointed at the roster that already exists. Eric's trigger (2026-09-28): *"a lot of the
orchestration we setup before… should be scrutinised and considered for being consolidated /
decommissioned / replaced by better more ootb systems as we scale."*

**Method, so the next pass reproduces it rather than re-deriving it.** Window 2026-09-03 → 2026-10-03
(30 days), measured against GitHub and git, never estimated:

| Question | How it was counted |
|---|---|
| Did an athlete run? | every PR in the window whose head branch matches that athlete's prefix glob, then the PR's author and body read to tell a dispatch from a human's own refactor |
| Did a cycle run? | PRs on `refactor/governed-cycle-*` |
| Did the correction land? | `git log --since=<window start> -- <that coach's budget file>` — a ratchet is the only durable trace a rep leaves |
| Is there work to do? | each eye's own `--candidate` |

**What it found.** One rep in 30 days across all four athletes, zero cycles — and not one budget
moved. Meanwhile every gate names a live target: 76 duplicate symbols, 135 dead exports, 31 untested
files, the top size target 1,020 code lines over cap. So the roster is not idle because the codebase
is clean, and the thing that stopped was never the drills.

| Piece | Reps, 30d | Call | Conf. | Why | What proves it wrong |
|---|---|---|---|---|---|
| `/governor`'s dispatch steps (3–4) | 0 cycles | **consolidate** into [`docs/grind/governor.instructions.md`](grind/governor.instructions.md) | high | A chore expresses WIP 1 and the collision check with no new grind code, and *one item per coach* makes the ratchet fence structural instead of prose | The chore needs a rule `grind.js` cannot carry → keep the dispatch layer. Tested when writing it: it did not |
| `/governor`'s merge-policy table + feast mode | cited from `CLAUDE.md` | **keep** | high | Policy, not dispatch; nothing else holds the auto-merge carve-outs | — |
| `decomposer` · `ui-librarian` · `mortician` · `test-backfiller` | 1 · 0 · 0 · 0 | **merge** — the chore reads each drill's own skill spec, so the agent file is a second copy of a loop that already lives in one place | med-high | Four wrappers, one rep between them; the skills and gates they drive all stay | A drill turns out to need an agent-only capability the chore cannot reach → keep the wrapper |
| The four eyes and the four drills | gates run every `npm test` | **keep, untouched** | high | These are the capability. The review found the *trigger* missing, never the correction | — |
| `/charter` | this review is its first sunset pass | **keep, and give it a sunset mode** | high | Usage proved measurable four different ways above, which was the falsifier for adding the mode | A later pass cannot measure an agent → the mode defaults to keep, never to retire on silence |

**The next constraint, which this review surfaced rather than fixed.** Consolidating one idle layer
into another does not answer why neither ran. Nothing schedules, nudges or surfaces debt work, so it
happens when a human thinks of it — once, in 30 days. That is filed with its number as
[#4527](https://github.com/ejclark/skynet-capital/issues/4527) (`bottleneck`), for the research chore
to price the candidates: the digest clock that already exists, a standing issue per coach in the ready
queue, a scheduled workflow, or a native GitHub feature. Exactly ToC's own corollary — elevate one
constraint and the next binds.

**Still pending, and deliberately not done here.** The `merge` verdicts above are *recorded, not yet
executed*: deleting the four agent files and adding sunset mode to `/charter` are both writes under
`.claude/`, a Claude Code protected directory an unattended lane cannot write to at all (probed
2026-10-03, refused; `docs/grind/README.md` → *Known limitations* says to route it to an interactive
session). Until [#4526](https://github.com/ejclark/skynet-capital/issues/4526) lands, the four agent
files still exist and still work — the roster table above is accurate as written, and `/governor`
remains invokable exactly as before. Nothing is removed by a doc.

### The board half, 2026-10-05 (#3939 slice 4)

Same review, the other piece of machinery #3939 put on trial: the Orchestration board's Status
column, which the plan suspected GitHub Projects' built-in workflows already maintain natively
("keep the core; subtract what Projects does natively"). **Verdict: subtract nothing.** The reasoning
lives next to the code it governs — `statusForIssue()` in
[`scripts/moneypenny/projects.mjs`](../scripts/moneypenny/projects.mjs) — because that is where the
next session has the same idea.

| Candidate | Call | Conf. | Why | What proves it wrong |
|---|---|---|---|---|
| Built-in "Item closed → Done" replacing our `closed → Done` | **skip** | high | `projects-reconcile.mjs` (#4393) landed after the plan was written and made that line the authority for four callers — the sweep, the backfill, `issues.mjs`'s preview, `issue-lint.mjs`. The sweep already heals a dropped close event, which is all the built-in covered | The sweep is retired → the close line has one caller again, and the built-in is worth pricing |
| Built-in "Item reopened" | **skip** | high | It writes one fixed value; our rule derives Backlog / Ready / Blocked / In Progress from the labels a reopened issue still carries | Reopens stop carrying meaningful labels → a fixed value is honest |
| Built-in "Auto-add to project" replacing the `item-add` path | **skip** | med-high | Its filter runs on creation and cannot express `isBacklogCandidate` for a `ci-failure` label applied afterwards; the add-or-find path (#3954) is still needed by both sweeps regardless | `ci-failure` moves to filing-time → the filter can express it |
| Any built-in workflow, as a mechanism | **skip** | high | GraphQL exposes `ProjectV2.workflows` read-only plus `deleteProjectV2Workflow` — no create/update/enable mutation (introspected live 2026-10-05). Enabling one is a UI click: unversioned, unspecced, unreadable from CI | GitHub ships an enable mutation → re-price every row above |

**The method, since it differs from the coach half.** No usage counting was possible: this lane's App
token cannot see a personal-account project at all (`projects-setup.yml`'s header says why), so the
schema was introspected directly and the behavioural question answered from the repo's own incident
record — on 2026-10-01 closed cards sat in In Progress until #4393 built the sweep, which a live
"Item closed → Done" would have moved on its own close event. The live `workflows{enabled}` read is
the falsifier, not the evidence, and the one-line probe to run it is in `projects.mjs`'s block.

**The general lesson, which is why this is written down at all.** A plan's *"replace it with the
off-the-shelf thing"* row needs a fourth question beside call, confidence and falsifier: **can we set
and read the off-the-shelf thing from here?** A native feature that only a human can toggle in a UI
is not a smaller system than a pure function with a spec — it is the same system with its
configuration moved somewhere nothing can assert on it. Count that cost before counting the lines
saved.
