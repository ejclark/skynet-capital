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

## The floor table (task class → model + effort FLOOR)

Floors, not targets — an agent may exceed its floor, never fall below it. Aliases only.

| Task class | Model floor | Effort floor |
|---|---|---|
| Genuinely trivial, thoroughness-irrelevant (rename, one-line dep bump) | `sonnet` | `medium` |
| Mechanical code change with verification (decompose, dedupe, dead-code, spec backfill, dep review, build one piece) | `sonnet` | `high` |
| Complex / ambiguous / judgment (review, research-to-brief, art direction) | `opus` | `high` |
| High-stakes correctness or security (security review, adversarial, irreversible-class design) | `opus` | `xhigh` |
| Genuinely hard / unfamiliar / architecture / long multi-step, adversarial security, rigorous review of subtle diffs | `fable` | `xhigh`–`max` |

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
