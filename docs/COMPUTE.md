# Compute routing — matching model + effort to task stakes ("no shortcuts")

`Orient` (`.claude/output-styles/orient.md`) routes the **technique**; this doc routes the **compute** —
which model and how much effort a task warrants — so stakes, not convenience, pick the tier. It is the
single source of truth the config-audit (`scripts/config-audit.mjs`) reads to enforce a floor on every
agent, and the reference a session consults when deciding whether to escalate the heavy part of a task.

## Mechanism (verified against code.claude.com docs, not memory)

- **Subagent frontmatter supports both dials.** `model` — `opus`/`sonnet`/`haiku`/`fable`/full-ID/`inherit`
  (default `inherit`); `effort` — `low`/`medium`/`high`/`xhigh`/`max`, overrides the session effort level,
  default inherits. Every roster agent declares `model`; the compute-routing change adds `effort`.
- **Resolution order:** `CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation param → frontmatter → inherit,
  checked against the org `availableModels` allowlist.
- **Main session is advisory only.** Model is set by `/model`, effort by `/effort` — user-controlled, the
  same ceiling `/config` has. Orient can *advise* raising them; it can't enforce them. (`ultracode` is a
  Claude Code setting — xhigh + workflow orchestration — not a model effort level.)
- **Delegation escalates compute.** A light main session can spawn a *heavier* subagent (model + effort in
  frontmatter or the invocation param), so heavy reasoning can be handed up-tier even from a cheap thread.
  This is the enforceable half of the guard: the floor lives on the agent, not on the fallible main session.

## Extensibility (why the floors survive roster changes)

- **Write floors in aliases, never pinned IDs.** `opus`/`sonnet`/`haiku`/`fable` auto-resolve to the
  latest recommended version and update over time. A new model release needs **zero** changes here. Pin a
  full ID (`claude-opus-5`) only to deliberately *freeze* a choice.
- **The effort ladder degrades gracefully.** Setting a level a model doesn't support falls back to the
  highest supported level at or below it. New effort levels extend the top; a floor referencing a
  not-yet-available level still resolves cleanly. So this table changes only when *our taste about
  task-classes* changes — not when the roster does.

## The assessment heuristic (Anthropic's own)

From `claude.com/blog/claude-model-and-effort-level-in-claude-code`:

- **Model ← capability / knowledge demand.** Haiku (simple, well-scoped) · Sonnet (precise/mechanical
  edits, in-context questions) · Opus (complex, ambiguous, interpretation) · Fable (genuinely hard —
  subtle bugs, unfamiliar domains, architecture, long multi-step; what smaller models can't do at any
  effort).
- **Effort ← thoroughness demand.** How many files to read, how much to verify, how far to go before
  checking in. Default `high`; raise where skipping a file / not running tests / not double-checking would
  bite; lower for straightforward work.
- **Diagnostic on failure:** lacked *knowledge* → upgrade **model**; lacked *thoroughness* → raise
  **effort**. Fix context and prompt first; then, with headroom, prefer more compute over less wherever it
  could change the outcome.

## Floors are quality-first, not cost-first

This repo runs with token headroom, so floors are set by **task fit, never by rate-limit or budget
economy**. When in doubt, **bias upward** — the only reason to route a task lower is that higher compute
wouldn't meaningfully change the outcome, never to conserve tokens. `medium` effort is reserved for work so
mechanical that thoroughness can't change the result; anything that reads code, writes code, or judges
anything defaults to `high` or above. (Should headroom ever disappear, that's a signal to raise it back,
not a reason to quietly lower these floors.)

**When burn pressures the budget, the lever is waste, not floors** (Eric, 2026-08-28). Rising token
burn routes to the waste-elimination playbook — [`docs/process/TOKEN-EFFICIENCY.md`](process/TOKEN-EFFICIENCY.md)
(cache discipline, fixed-context compression, no-op lane gates) — so the savings fund *higher*-tier
compute, never justify quietly lowering these floors.

**Tie-break — round up (Eric's call).** When a task sits between two tiers, take the higher one. Hitting
an API rate limit is an **accepted, adjustable cost**, not something to dodge by pre-emptively routing
lower — we round up and adjust per the data as it arrives. If limit-hits start costing flow, the lever is
the plan-tier upgrade (Eric's gate — spend), never timidity on compute. Both paths (upgrade-now vs
wait-for-the-throttle) share one trip-wire; rounding up just means we lean into quality first and let the
data pick the moment to spend.

## Eric does not set the dial — the system routes, and conservation is an explicit signal

(Eric, 2026-09-04: "I don't want to dictate the model/effort applied to workflows/agents. I'd
prefer we apply the config that delivers the best overall outcomes. If that requires Fable 5.1 at
ultracode effort, so be it. I get the sense that I use too beefy of an LLM and too much effort in
a way that is cost inefficient, so I anticipate we'll get more throughput by doing this, especially
if we fan out agent workflows. If we need to conserve tokens, it'll be an explicit action/signal.")

- **The system owns the dial, on every surface.** Agents, workflows, chores, and the lanes'
  `claude_args` carry the tier the *task class* warrants (the floor table below), never a tier
  chosen for economy. For the main session — the one dial only he can turn — Orient *advises* the
  tier out loud when the session's setting is wrong for the work in front of it, in either
  direction ("this batch is mechanical; Sonnet would do it as well for a fifth of the spend" is as
  legitimate as "this needs Fable"). He follows the advice rather than arbitrating it — the compute
  dial is a technique, and he directs by outcome.
- **Right-sizing is a throughput play, not a savings play.** A blanket-beefy session spends the
  same tokens on a rename as on an architecture call; routing by task class frees that spend for
  the fan-outs that actually need it. Expect more work per token-hour, not less compute.
- **Conservation is never inferred.** Rate-limit hits, a visible burn rate, or a hunch that a
  run is expensive are *not* signals to route lower. The only conserve-mode trigger is an explicit
  statement from Eric in the prompt, of the shape *"we need to conserve tokens to ensure we have
  tokens to develop until the reset on Tuesday."* Under that signal, and only then, cut in this
  order: waste first (`docs/process/TOKEN-EFFICIENCY.md`), then fan-out width (fewer parallel
  items, not cheaper ones), then effort, then model — and say which cut was made.
- **Cost-first defaults are bugs.** A default that exists "to be cheap" rather than because a
  higher tier wouldn't change the outcome contradicts this doc; `scripts/config-audit.mjs` checks
  agents against the floor table, and the same rubric applies to `docs/grind/*.instructions.md`
  front matter and workflow-script defaults even where no gate reads them yet.

## The floor table (task class → model + effort FLOOR)

Floors, not targets — an agent may exceed its floor, never fall below it. Aliases only.

| Task class | Model floor | Effort floor |
|---|---|---|
| Genuinely trivial, thoroughness-irrelevant (rename, one-line dep bump) | `sonnet` | `medium` |
| Mechanical code change with verification (decompose, dedupe, dead-code, spec backfill, dep review, build one piece) | `sonnet` | `high` |
| Complex / ambiguous / judgment (review, research-to-brief, art direction) | `opus` | `high` |
| High-stakes correctness or security (security review, adversarial, irreversible-class design) | `opus` | `xhigh` |
| Genuinely hard / unfamiliar / architecture / long multi-step, adversarial security, rigorous review of subtle diffs | `fable` | `xhigh`–`max` |

Two surfaces route by a *structural* signal rather than a named task class, and both are
best-outcome routing, not economy:

- **Moneypenny's feedback builds** (`scripts/moneypenny/model-tier.mjs`, Eric's 2026-08-31 call
  after measuring an 18.5-minute always-Opus run on a 3-criterion fix): the issue's own
  `skynet-spec` block picks the tier — no block, incomplete readiness, or >3 criteria → `opus`;
  ≤3 criteria, spec-complete → `sonnet`; exactly 1 criterion with zero open assumptions →
  `haiku`. Time is an outcome; under-resourcing a complex ask is the costly failure, so anything
  ambiguous escalates up, never down. The `haiku` band sits below this table's first row on
  purpose — a single-fact, zero-ambiguity edit is the one case where the lightest model changes
  nothing but wall-clock.
- **`/grind` steps** (`.claude/workflows/grind.js`): effort defaults by step kind — `script`
  (run a command, report its exit) at `low`, everything else at `high`; model defaults to
  `sonnet`, and a chore that needs more declares it in its front matter (the research chore runs
  `fable`/`high`). The two `docs/grind` chores that shipped at `low` were cost-first defaults and
  were raised the day this section was written.

## Honest limit

The assessment is a feature-based heuristic (stakes × unfamiliarity × surface), not an oracle — a model
judging "is this beyond me?" is the known self-assessment weakness. Floors shrink the shortcut gap; they
don't close it to zero. A too-weak main session may not recognize it should escalate at all. That residue
is what the self-correcting loop reclaims from feedback, the same way it reclaims codification loss.

## Roster floors — the machine-readable source the audit enforces

The config-audit parses the block below (agent · class · model floor · effort floor) and flags any agent
whose declared `model`/`effort` frontmatter falls below its floor, or is missing `effort` entirely. Adding
a model or effort level means editing this block — never touching the agents. Keep one row per roster
agent; a new agent needs a row here (that itself is a useful "did you think about its tier?" gate).

<!-- FLOOR-TABLE:START -->
| agent | class | model floor | effort floor |
|---|---|---|---|
| red-team | genuinely hard / adversarial | fable | xhigh |
| reviewer | genuinely hard / adversarial | fable | xhigh |
| render-alchemist | genuinely hard / unfamiliar | fable | xhigh |
| art-director | complex/judgment | opus | high |
| artifact-smith | complex/judgment | opus | high |
| linguist | complex/judgment | opus | high |
| piece-wright | mechanical code change | sonnet | high |
| decomposer | mechanical code change | sonnet | high |
| dep-warden | mechanical code change | sonnet | high |
| mortician | mechanical code change | sonnet | high |
| set-dresser | mechanical code change | sonnet | high |
| test-backfiller | mechanical code change | sonnet | high |
| ui-librarian | mechanical code change | sonnet | high |
<!-- FLOOR-TABLE:END -->
