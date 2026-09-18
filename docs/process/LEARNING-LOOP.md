# Learning loops — the anatomy of a bounded experiment

Eric, 2026-09-18, naming the shape of the eval pilot after the fact: *"There will be more learning
loops over time. I suspect each learning loop will be custom catered. This is an emerging data
structure, in which case must have a defined anatomy."* This doc is that anatomy — not a process to
follow once, a **type** every future instance conforms to, the same way [`ISSUES.md`](../ISSUES.md)
defines the anatomy of an issue rather than describing one issue.

## The shape

Five moves, repeating: **thin slice → pressure test → find the weakness → capture the lesson /
enhance the process → back-test.** A loop is "done" for now when the back-test closes clean; it
reopens the next time the domain needs re-validating, at whatever cadence that domain calls for.

## The anatomy — ten fields, six custom, four fixed

The first six are **custom-catered per instance** — they are the actual subject matter, different
every time. The last four are **fixed mechanism** — every instance reuses the same two artifacts
for capture, which is what makes this a *loop* (compounding across instances) rather than an ad hoc
one-off process reinvented each time.

| # | Field | What it answers | Custom or fixed |
|---|---|---|---|
| 1 | **Name** | A short slug identifying this instance. | Custom |
| 2 | **Domain** | The real question the loop exists to answer. | Custom |
| 3 | **Thin slice** | The smallest real trial that can surface a real weakness — never the full batch first. | Custom |
| 4 | **Pressure test** | The specific, named dimensions being measured, stated *before* running — a loop that decides what counts as a pass after seeing the result isn't testing anything. | Custom |
| 5 | **Ground truth / oracle** | What a result is compared against, and how that oracle was obtained. | Custom |
| 6 | **Cycle gate** | The explicit condition that must hold before scaling from thin slice to the full run. | Custom |
| 7 | **Owning issue** | The GitHub plan issue tracking the loop's state across cycles — one loop, one issue, reused every cycle. | Fixed |
| 8 | **Weakness capture** | A caught flaw is banked in `docs/LESSONS.md` via `/retro` — root cause, detection signal, prevention. Never only a chat message. | Fixed |
| 9 | **Process artifact** | The refined, reusable procedure lives in one versioned file (`docs/grind/*.instructions.md`, or the nearest equivalent for a non-grind domain) that the next cycle edits in place, never a fresh ad hoc prompt re-deriving what's already known. | Fixed |
| 10 | **Status** | Where the instance currently sits: `piloting` / `blocked-on-fix` / `scaling` / `closed`. Lives on the owning issue, not in this doc. | Fixed (location), custom (value) |

**Why 8 and 9 are fixed, not a choice per loop:** a lesson with nowhere durable to live gets
re-learned; a procedure re-typed from memory each cycle drifts and wastes tokens re-deriving what a
prior cycle already worked out — exactly the inefficiency Eric named as the reason to codify in the
first place. Every future domain reuses these same two mechanisms; only what goes *in* them differs.

## Worked example — the first instance

The research model-tier eval (#3264 slice 1, 2026-09-18) is the loop this anatomy was extracted
from, not designed in the abstract first. Field by field:

| Field | This instance |
|---|---|
| Name | `haiku-eval-replay` |
| Domain | Can Haiku/Sonnet do Layer 1 (data collection) research without quality loss vs. Opus? |
| Thin slice | 4 replays (2 events × 2 models), not the full 30-event sample |
| Pressure test | Stated in advance, from #2946's S5 spec: same stance reached · no invented position where Opus stood aside · a dated, checkable falsifier present |
| Ground truth / oracle | Each event's original first-commit content in `docs/research/events/*.md` — the Opus-era verdict before any pulse or close-out touched it |
| Cycle gate | Full 30-event batch blocked until the hindsight-leak methodology flaw (found by the pilot itself) is fixed — date-cutoff search or prospective testing, not yet chosen |
| Owning issue | #3264 |
| Weakness capture | `docs/LESSONS.md` — "A blind-replay eval design leaked hindsight through the search tool, not the corpus file it guarded against" |
| Process artifact | `docs/grind/haiku-eval-replay.instructions.md` |
| Status | `blocked-on-fix` (as of 2026-09-18) |

## Starting a new loop

1. Fill fields 1-6 before running anything — if the pressure test or the oracle can't be stated up
   front, the domain isn't ready for a loop yet; go research it first (see `orient.md`'s
   Complex-domain routing).
2. Open or reuse a plan issue (field 7) in the house capsule format (`docs/ISSUES.md`) — the loop's
   status lives there, in the `Status` table row, not duplicated into this doc.
3. Run the thin slice. When it surfaces a weakness (it usually will — that's what a thin slice is
   for), `/retro` it into `docs/LESSONS.md` before doing anything else with the finding.
4. Fold the fix into a `docs/grind/*.instructions.md` chore (or the nearest equivalent for a
   non-grind domain — a reusable spec file either way) so the next cycle starts ahead of this one,
   not from scratch.
5. Re-check the cycle gate. Still open → repeat from step 3 with a revised thin slice. Closed →
   scale, per whatever width the domain's full run actually needs.
