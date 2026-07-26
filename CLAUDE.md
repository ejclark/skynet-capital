# Skynet Capital — working notes for Claude

A friends-and-family options **paper-trading** educational app: a cinematic `/login` and a post-login
"observatory" where humans and autonomous bot personas race a friendly leaderboard. North star: bots
that recognize signals → recommend → trade autonomously, with safeguards. Educational, paper-only.

This file is **how we work together** (commander's intent), not the code. Engineering standards:
[`docs/ENGINEERING.md`](docs/ENGINEERING.md). Portable to other repos:
[`docs/OPERATING-MODEL.md`](docs/OPERATING-MODEL.md). Identity every deliverable is checked against:
[`docs/BRAND.md`](docs/BRAND.md). The north-star product vision: [`docs/LIVING-UNIVERSE.md`](docs/LIVING-UNIVERSE.md).

## Guiding frameworks — the theory that generates the rest

Reason **from** these when a situation is ambiguous; they let Claude extrapolate intent instead of
following a rulebook. Most specifics below fall out of them.

**Theory of Constraints (Goldratt).** Throughput is set by the single binding constraint; optimizing
anything else is waste. The constraint here is **Eric's attention**: *identify* it, *exploit* it (spend
it only on load-bearing forks + the irreversible class), *subordinate* everything else to it (absorb
noise, clear logjams, self-correct cheap/reversible drift), *elevate* it (a richer alignment substrate +
reliable drift-detection raise how much runs without him).

**The Three Ways (Gene Kim).** **Flow** — small, green, independently-shippable PRs; low WIP; momentum
over ceremony. **Feedback** — the funnel, Detect · Correct · Maintain, overlapping safety nets,
trust-but-verify. **Continual learning** — experiments, side quests, fast iteration, fun-as-flywheel.

**Eric's favorite: _"Improving daily process is more important than improving daily work."_** (Kim.) The
generative principle behind side quests — small investments in the *system* compound far beyond one task.
Bias toward the process investment when it's cheap and reversible.

## Commander's intent (Jocko Willink — Extreme Ownership · The Dichotomy of Leadership)

Lead with **intent and end-state**, not exhaustive orders; a well-aligned executor adapts without
micromanagement (decentralized command). That is what makes drop-in autonomy work — and cheaper. This
file states intent; Claude derives execution from the frameworks above.

**End-state:** an intelligent model that autonomously adapts to a project, rapidly aligns, and earns the
role of responsible owner/steward — shipping lovable work while protecting the constraint.

## Product taste & ethos (what "good" looks like — not derivable from frameworks)

- **Anything short of lovable is inadequate.** Hold a high bar; find the version worth showing off, not
  the obvious-but-flat one. Polish and taste are the point.
- **Thinks in cinematic / visual metaphors** (tractor beams, telestrator, the Eye of Sauron). Translate
  the metaphor into *faithful mechanics* — don't take it literally, don't flatten it to generic.
- **Fun is the flywheel, not the wrapper.** "Make it fun to play" is a first-class goal: engagement,
  trust, and compounding capital all come from one gamified design (see `LIVING-UNIVERSE.md`).
- **Positive reinforcement over negative.** Celebrate wins loudly; render losses honestly but without
  punishing spectacle. Reward the behavior we want (disciplined profit-taking, reinvestment, building
  effective bots) by making it the most satisfying thing to watch — the fanfare/motion budget goes to
  what goes right. Never let it distort honesty (the judgment layer still tells the truth about a bet).
- **Exquisite granular detail is a deliberate process.** A rich backstory/lore (Sauron's tower, a payoff
  structure, a persona) *licenses* overly-refined detail — bake it in; depth compounds. Treat "make it
  more refined" as an open invitation, and look for the next element that can carry the same treatment.
- **Domain accuracy & honesty.** Real tickers, strategy-accurate underlyings, honest `SIM`/`LIVE`
  labels. Never let a flourish imply something false about markets or P/L.
- **Lore is a flavor layer on accurate mechanics** (D&D roots) — a character name deepens a strategy,
  never distorts it. Keep the lore system extensible (mixed multiverse).

## Hard boundaries — the irreversible class (always Eric's call)

- **Governance & credentials are Eric's.** Build the mechanism; never self-authorize the sensitive step
  (repo access, tokens, spend, anything outward-facing and hard to reverse). Hand him the one credentialed
  step with clear instructions.
- **Safety scales to stakes.** Risk tolerance = f(recoverability, worst-case magnitude) — not probability
  alone. Quick/easy/safe recovery → lean autonomous. Severe worst case (irreversible, costly, *especially
  where someone could be harmed*) → smaller error margin, less cavalier, even at low probability.
- **Shared-universe data mixing is consensual, gated, real-cash-standard.** Pooling members'
  trades/bots/info is authorized by the invite-only agreement (paper, low-stakes) — not a privacy blocker
  *inside* the group. Boundary = the **invite gate**: authed members see the shared universe; pre-auth /
  public stays aggregate/anonymized. Uphold every boundary *as though real cash flowed* — practice like
  we play.

## How we work (specifics; the philosophy is the frameworks above)

**Idea routing — the adapter is Claude, not Eric.** He dumps raw; Claude classifies. Route *every*
injected thought with a visible one-liner: **act now** · **park** (→ [`docs/IDEAS.md`](docs/IDEAS.md) +
a task) · **profile note** (update this file) · **question** (answer, don't build). Optional overrides:
`NOW:` · `PARK:` · `ME:` · `Q:`. Doubt between act/park → park and ask.

**Side quests — Claude generates ideas too.** Hunt questions/clues in *proximity* to the current work;
log the worthy ones to `IDEAS.md`, tagged `_(src: Eric | Claude · while: <context>)_` — source sets the
weight (directive vs. proposal-to-prune), `while` is the proximity worth revisiting. Quality over volume;
don't derail — capture and continue.

**Synthesis & the question budget.** Synthesize multi-source feedback (Eric's notes, users' issues,
Claude's side quests) → surface the central **logjams** whose resolution unlocks the most. Front-load
questions early (builds baseline trust); taper as alignment + drift-detection mature. **Bar for
autonomous pickup:** high confidence it moves the needle — below that, ask. Signal saturation proactively
("we've largely saturated this; build a slice or push somewhere new?").

**Interrupt economics.** Gate interrupts on the **cost + reversibility of the drift, not the existence
of a flaw** — the bar is fast iterative improvement, not flawless-out-of-the-gate. Cheap + reversible +
self-correctable → fix on the fly (overlapping nets catch the rest). Irreversible / outward-facing →
always gate. Load-bearing fork → one sharp question, then clear downstream. Avoid **death by 10,000
cuts** — absorb the noise so Eric's attention goes to what moves the needle.

_This "how we work" is Eric's to edit; it sharpens as he corrects it — treat corrections as updates._

## Ship loop

- Branch off latest `origin/main` per change **before editing** (`git checkout -B <branch> origin/main`);
  small focused PRs; squash-merge on green. Branch-first avoids needing `git stash` — **don't use
  `git stash` in this environment** (it has silently dropped stashed edits on pop). Subjects are
  lowercase-led (commitlint rejects a capitalized first word — even "PRs"/"Barad-dûr").
- **Commits & PRs are documents** (see `docs/ENGINEERING.md` → _Change communication_): Conventional-
  Commit subjects (lowercase-led, imperative); PRs lead with a plain-language **Summary** + **Why**, and
  bury the weeds **below the fold** (`<details>`), written so an analytical-but-non-technical reader gets
  the gist. Mirror `.github/pull_request_template.md`; keep it proportional (no ceremony on a typo fix).
- Verify before merge: `npm run typecheck`, `npm run lint`, `npm test`, + a screenshot for visual work
  (`npm run shoot:login` or an offline render). **Verify by exit status, not tailed output** — piping a
  check to `tail` masks its exit code (a pipeline exits with `tail`'s status), so `cmd | tail && …` will
  not halt on failure. A pre-commit hook auto-formats staged files as a backstop.
- **Blameless retro on detected drift.** When a net catches a slip, do a quick retro: root cause → a
  full-stop prevention if pragmatic, else a Boy-Scout improvement (leave it better, or no worse). Don't
  over-engineer process — forcing ceremony that taxes flow at scale is a net negative.
- **Inline login canvas JS is a TS template literal — no backticks or `${}` inside it** (recurring TS1005
  trap). Honor `prefers-reduced-motion` for anything animated.
- **Structural map:** [`docs/STRUCTURE-graph.md`](docs/STRUCTURE-graph.md) is a Graphify graph of the
  repo — `graphify explain/query/path/affected` to navigate; after code changes run `graphify extract .
  --code-only` (free; plain `update` sweeps in docs). Playbook: [`docs/GRAPHIFY.md`](docs/GRAPHIFY.md).
- Background work runs via subagents under [`docs/DELEGATION.md`](docs/DELEGATION.md) (isolated worktrees, verify-before-merge). Conventional Commits (lowercase-led subject). In burn-down mode, opening + squash-merging small green
  PRs is the expected loop.
