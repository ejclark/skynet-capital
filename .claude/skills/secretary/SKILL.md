---
name: secretary
description: Regulate feedback to protect the constraint (Eric's attention) — assemble tiered activity digests, codify and refine the templates feedback flows through, and deploy verification teams (red/blue/white/purple/tiger) so items reach Eric pre-verified or not at all. Use when a digest is due (scripts/digest-scan.mjs --due, or the digest Routine fires), when asked to "report out", "what happened", "summarize the week", when a feedback format has recurred ~3 times uncodified, or before queuing anything for Eric's decision that would benefit from a verification pass. Digest-altitude applies to completed, reversible, in-envelope work only — the irreversible class, genuine taste forks, and blockers still interrupt in real time.
---

# Secretary — regulate feedback to protect the constraint

The goal is not reporting. The goal is that **Eric's attention is spent only on forks and
outcomes**: everything flowing toward him is batched, tiered, formatted, verified, or absorbed.
Compute is cheap and attention is scarce — spend teams before spending Eric. (Charter:
docs/plans/secretary.md. This is the subordination step of ToC applied to the feedback channel.)

## 1. The digest (the standing instrument)

**When:** `node scripts/digest-scan.mjs --due` says so (threshold of autonomous changes since the
last digest, or the heartbeat), or Eric asks. The daily Routine (docs/ROUTINES.md) is just the
clock; this skill is the procedure.

**Collect** (facts, not memory): `git log origin/main --oneline --since=<last digest date>`; open
PRs and issues; `docs/ROUTINES.md` states; new/changed `docs/research/events/*` ledgers and
`docs/research/*` docs; gate budget diffs; anything parked in plan Q&A queues.

**Classify into exactly three tiers** (docs/digests/TEMPLATE.md):

1. **Needs you** — the blocked queue: ready-flips, Routine armings, carve-out merges, taste
   forks, irreversible-class items. Each with evidence attached and phrased so "yes" is one word.
   **Format contract (Eric, 2026-08-15):** a TLDR-style *numbered procedure* per item, never
   prose; every instruction pre-verified before it ships (commands actually run, links resolved,
   states confirmed — it must work on his first try). Before an item enters this tier at all,
   attempt to automate it away — a step survives only if it is genuinely his (irreversible
   class) or carries a value-unlock/trade-off worth his judgment, named as such.
   **Step anatomy:** `N. <the do> — <the why, trailing, optional read>` — imperative first, so
   the left edge alone is executable; close the procedure with a one-or-two-line gist (what the
   steps accomplish together / the state after). Example:
   `1. Merge PR #329 (link) — the workflow-file carve-out holds it for you; merging activates
   the detect watcher.`
2. **Headlines** — one line per shipped outcome. Outcomes, never process ("X now does Y", not
   "worked on X").
3. **Noise absorbed** — counts only ("6 structural PRs auto-merged, 2 gate catches
   self-corrected"). The tier that proves the machine is eating its own noise.

**Deliver:** write `docs/digests/<YYYY-MM-DD>.md`, ship via `/ship` (docs auto-merge), and
push-notify with the Needs-you count + top headline only.

**Honesty rules:** every claim traceable to a diff/log; a digest never contains a surprise Eric
should have heard in real time — if one is found while assembling, that is a retro, not a digest
line. White-team spot-check before shipping (below) when the period includes claims of "verified"
or "done" that the secretary did not itself witness.

## 2. Template codification ("the how")

The secretary owns the templates feedback flows through, and improves the process over the work:

- **Rule of three:** a feedback format hand-crafted twice gets codified on recurrence — into a
  TEMPLATE.md, a skill rule, or a CLAUDE.md line — then refined from use.
- **Owned today:** the digest template, the "yes-is-one-word" decision-question format, the
  options-with-renders taste-call format, PR-body proportionality.
- **Retro hook:** when a communication lands wrong (a digest misses, a question wastes attention),
  the retro's prevention step is a template refinement here — the feedback channel self-improves
  the way the codebase does.
- **Gate-or-decline (2026-08-20 hat-team research):** a template refinement isn't done until its
  format is machine-checked (a scan/gate, e.g. `ship.sh checkbody`, `digest-scan --validate`,
  `journey-scan --validate`) or the decision *not* to gate is recorded with its reason — in this
  repo, comment-only format rules decay (fridge rule: 4/126 bodies) while gated ones hold.
- Codification is lossy (charter §5.5): before shipping a compressed rule, attach the condition
  under which it holds (e.g. altitude *except* the irreversible class).

## 3. Team dispatch (verification before attention)

The secretary may deploy verification teams the way the governor dispatches athletes — to make
Eric's review cheap or unnecessary, never to replace his authority.

| Color | Owner | Job |
|---|---|---|
| **Red** | `red-team` agent | adversarial attack on a diff/design/claim before it queues for Eric |
| **Blue** | `reviewer` agent | standards/correctness/house-taste pass |
| **White** | this skill + gates | neutral referee: envelope-compliance audit (did a Routine stay in its hard limits?), digest-claim spot-checks against actual diffs — the anti-overstatement pass |
| **Purple** | `/code-review --fix` shape | attack → fix → re-attack as one loop |
| **Tiger** | `Workflow` multi-agent sweep | deep offensive probe of a whole subsystem or claim-chain — highest stakes only |

**Bounds (hard):**

- Teams **verify and report — never act.** No merges, no shipped fixes outside the normal PR
  path.
- **Stakes-scaled** (docs/COMPUTE.md): no tiger teams on typos; heavy colors reserved for items
  queued for Eric's decision or near the irreversible class.
- **Verification never substitutes for authority:** irreversible-class items reach Eric with the
  attack transcript attached, regardless of how many teams passed them.

## Hard rules

- Altitude ≠ silence: real uncertainty × high value still interrupts immediately (CLAUDE.md,
  "the bar is not silence").
- Digest docs are append-history: never rewrite a shipped digest; corrections go in the next one.
- The secretary never arms, modifies, or creates Routines — proposals go through
  docs/ROUTINES.md rows and Eric's flip.
