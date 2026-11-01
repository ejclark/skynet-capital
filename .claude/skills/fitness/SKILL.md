---
name: fitness
description: >-
  Write or audit one check so that it fails when the outcome fails, and so that a deliberate bug
  in it turns its spec red. Use when /retro picks a gate or a script as the prevention, when a
  contract in scripts/fitness.mjs is added or changed, when a [fitness] issue closes, when
  `node scripts/fitness-audit.mjs --bugs <held-out list> --candidate` names a target, or when
  asked "how would we know if this broke". Invokable as /fitness. Takes the check (a script and
  its spec) or the incident as the argument.
---

# Fitness — is this check any good?

A check that passes while the outcome fails is worse than no check: it buys silence. 13 of the
126 lessons in `docs/LESSONS.md` are a check that passed, stayed silent, or told no one while the
outcome failed. This is the procedure for one check, from intent to proof. The rubric it scores
against lives in [`rubric.md`](rubric.md) beside this file: open it at step 9, not before.

The script half is free and runs first: `node scripts/fitness-audit.mjs --bugs <file>` breaks the
check on purpose in a temporary copy and reports what its spec caught. Its file format is in its
header. Check `npm run work-gate` before any step that spends a model.

## The procedure

1. **One outcome line.** A declared intent ("the bots must trade during market hours", or a dated
   record under `docs/intents/`, whose Outcome and Check are the starting point) or an incident (the
   10-08 stall) becomes one EARS line (`/ears`): `WHILE <state>, the <system> shall <response>`.
   Write the outcome, never the proxy: "a merge reaches production", not "the deploy step is green".
   No real failure behind it means it is a hypothesis: say so, keep it advisory.
2. **Route it.** A production outcome is a contract in `scripts/fitness.mjs`. Code shape is an
   eye with a budget (`docs/COACHES.md`). `src` behaviour is a spec. Prose quality is a judged
   eval. Taste is the owner's labels first.
3. **Name what it reads, and the gap.** Beside the outcome line, write what the probe actually
   reads, then the gap in one sentence: the state of the world that passes while the outcome
   fails. If a past failure lives inside that gap, choose another read.
4. **Choose where and how often it runs.** It must run where it can see, independent of what it
   watches (a check inside the process dies with it). Classify it: atomic or holistic, triggered
   or continual, automated or manual. Measure the real clock's gaps, not the schedule's.
5. **Write a pure judge:** pass, fail or unknown; one failure mode; a stable key beside the
   free-text detail; cannot-read is unknown, never a pass.
6. **Seed it:** healthy, each real failure, each boundary, cannot read, malformed, and the
   "looks healthy but is not" case written down as a known gap. Test the probe through stub
   binaries that record their arguments (`tests/scripts/bots-start-stopped.spec.ts` has the house
   pattern): arguments, blind, malformed. Then one live read as a receipt. Never stop, restart or
   write to production to test a check.
7. **Break it on purpose.** A short, curated bug list, each bug naming the behaviour it breaks.
   **The list must include bugs written by a separate pass that has not seen the spec** (a
   call to the `evals-expert` agent in blind grader mode, given only the script and the outcome
   line): a spec graded on its author's list scored 39 of 40 on that list and 7 of 28 on fresh bugs. Run
   `node scripts/fitness-audit.mjs --bugs <file>`. A survivor gets a seed or a written reason; a
   NOT APPLIED gets rewritten, never dropped. Stop at judges and probe arguments.
8. **Replay on real history, on the real tick times** where history exists. Count fires, false
   closes and notifications. State detection and reset times.
9. **Wire the ending in code:** who hears, the corrector, its budget, the age at which an
   unknown reaches someone, a dated falsifier, how it retires. Score the check against
   [`rubric.md`](rubric.md); the score is one line.
10. **Attack it** through a separate pass: `evals-expert` in blind grader mode, which hands back
    states of the world that pass the check while the outcome fails, each as a seed. Add the seeds.
11. **Report** one audit row (outcome · reads · gap · bugs caught of total · score · falsifier)
    on the plan issue, and bank a lesson (`/retro`) if a real hole was found.

Rules: the author never grades alone, and never with a list the author wrote. A person is asked
only for labels or taste. Fresh bugs are the done line, never the list the spec was built on.

## Reps on record

| Rep | Target | Done means |
|---|---|---|
| 1 | Re-audit the six contracts in `scripts/fitness.mjs` and fix them in one pass | 35 or more of 40 held-out bugs caught; one comment per failure state on the real-tick replay (70 today). Done 2026-11-01: 29 of 30 blind, the survivor seeded; the replay opens one issue per failure state with 0 comments. The list is `tests/scripts/fixtures/fitness-heldout-bugs.json`, a regression list now: the next score needs a fresh blind pass |
| 2 | Decision cycles in market hours: the judge reads the per-bot decision journal and fires only on the stalled alert, held against the real session clock under node 24 (no second calendar). Seeds: the 10-08 shape, every bot's evaluation failing, a breaker-halted fleet, a stuck clock, a holiday, an early close, no stamp (unknown), a future timestamp | Red within 10 minutes plus the clock gap on the 10-08 replay; unknown, not silence, on a missing stamp. Done 2026-11-01: 28 of 30 blind across this contract's spec and `fitness.spec.ts` (15 of 30 on its own spec, all 14 aimed at the contract); the two survivors seeded. The list is `tests/scripts/fixtures/fitness-heldout-bugs-2.json`, a regression list now |
| 3 | Diagram legibility with the pinned Mermaid: an advisory ratchet at `ship.sh`, oracle is the owner's eyes on six borderline pictures | Waits: it costs his eyes |

The `evals-expert` agent runs this procedure on request, and nothing starts it on its own. An
autonomous trigger waits for three reps in this table: four gate-driven agents got one rep in 30
days for lack of a trigger, and a standing agent would idle the same way. Reopen after rep 3, or
when the audit names a target that waits 14 days with no rep (check by 2026-12-31).
