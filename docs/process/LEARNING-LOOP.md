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

## The anatomy — thirteen fields, nine custom, four fixed

The first nine are **custom-catered per instance** — they are the actual subject matter, different
every time. The last four are **fixed mechanism** — every instance reuses the same artifacts for
capture and scheduling, which is what makes this a *loop* (compounding across instances) rather than
an ad hoc one-off process reinvented each time.

| # | Field | What it answers | Custom or fixed |
|---|---|---|---|
| 1 | **Name** | A short slug identifying this instance — the `Loop` cell in the list below. | Custom |
| 2 | **Aim** | The real question, stated as a number that moves: what is measured, in which direction, by when. "Does X work?" is a domain, not an aim. | Custom |
| 3 | **Baseline** | That number measured *now*, before the first run — without it no result can say "better". | Custom |
| 4 | **Prediction** | What you expect the thin slice to show, written before it runs. A result that surprises you is the lesson; one you never predicted can't. | Custom |
| 5 | **Thin slice** | The smallest real trial that can surface a real weakness — never the full batch first. | Custom |
| 6 | **Pressure test** | The specific, named dimensions being measured, stated *before* running — a loop that decides what counts as a pass after seeing the result isn't testing anything. | Custom |
| 7 | **Ground truth / oracle** | What a result is compared against, how that oracle was obtained, and how it was itself checked before being trusted. | Custom |
| 8 | **Cycle gate** | The explicit condition that must hold before scaling from thin slice to the full run. | Custom |
| 9 | **Kill rule** | The dated observation that ends or pivots the loop — `closed` is not the only way out, and a loop with no way to die runs on as ceremony. | Custom |
| 10 | **Owning issue** | The GitHub plan issue tracking the loop's state across cycles — one loop, one issue, reused every cycle. Its state block holds the current status. | Fixed |
| 11 | **Next check** | A date the next result will be visible, kept in the list below, where the daily digest flags it once it arrives. | Fixed (location), custom (date) |
| 12 | **Weakness capture** | A caught flaw is banked in `docs/LESSONS.md` via `/retro` — root cause, detection signal, prevention. Never only a chat message. | Fixed |
| 13 | **Process artifact** | The refined, reusable procedure lives in one versioned file (`docs/grind/*.instructions.md`, or the nearest equivalent for a non-grind domain) that the next cycle edits in place, never a fresh ad hoc prompt re-deriving what's already known. | Fixed |

**Why 11–13 are fixed, not a choice per loop:** a check with no date is never made; a lesson with
nowhere durable to live gets re-learned; a procedure re-typed from memory each cycle drifts and
wastes tokens re-deriving what a prior cycle already worked out — exactly the inefficiency Eric
named as the reason to codify in the first place. Every future domain reuses these same mechanisms;
only what goes *in* them differs.

**State** is not a field of the template — it lives on the owning issue and in the list's `State`
column: `piloting` · `running` · `blocked-on-fix` · `scaling`, or ended as `closed` · `killed` ·
`pivoted` (the pivot is a new row) · `replaced`.

**The double-loop question, asked at every close or kill:** *was the aim, the cycle gate or the
oracle itself wrong?* Single-loop learning fixes the run; this asks whether the run was pointed at
the right thing (Argyris). Answer it in the owning issue's log line, one sentence.

## Worked example — the first instance

The research model-tier eval (#3264 slice 1, 2026-09-18) is the loop this anatomy was extracted
from, not designed in the abstract first. Field by field:

| Field | This instance |
|---|---|
| Name | `haiku-eval-replay` |
| Aim | Can Haiku/Sonnet do Layer 1 (data collection) research without quality loss vs. Opus? — written before this template asked for a number; today it would read "same stance on ≥ N of 30 events" |
| Baseline | *(not recorded — the gap this field now closes)* |
| Prediction | *(not recorded)* |
| Thin slice | 4 replays (2 events × 2 models), not the full 30-event sample |
| Pressure test | Stated in advance, from #2946's S5 spec: same stance reached · no invented position where Opus stood aside · a dated, checkable falsifier present |
| Ground truth / oracle | Each event's original first-commit content in `docs/research/events/*.md` — the Opus-era verdict before any pulse or close-out touched it |
| Cycle gate | Full 30-event batch blocked until the hindsight-leak methodology flaw (found by the pilot itself) is fixed — date-cutoff search or prospective testing |
| Kill rule | *(not recorded)* — in effect it fired on 2026-09-18: the blind replay could not be made leak-free, so the loop pivoted to prospective-only testing (#3300) |
| Owning issue | #3264 |
| Weakness capture | `docs/LESSONS.md` — "A blind-replay eval design leaked hindsight through the search tool, not the corpus file it guarded against" |
| Process artifact | `docs/grind/haiku-eval-replay.instructions.md` |
| Next check | none — ended; no prospective results exist yet to check |
| State | `pivoted` (#3300, 2026-09-18) — was `blocked-on-fix`, which went stale when the loop quietly stopped. That staleness is why fields 4, 9 and 11 exist |

## Starting a new loop

1. Fill fields 1–9 before running anything — if the aim, baseline, prediction, pressure test,
   oracle or kill rule can't be stated up front, the domain isn't ready for a loop yet; go research
   it first (see `orient.md`'s Complex-domain routing).
2. Open or reuse a plan issue (field 10) in the house capsule format (`docs/ISSUES.md`) — the
   loop's status lives in its state block. Add a row to the list below with a dated `Next check`.
3. Run the thin slice. When it surfaces a weakness (it usually will — that's what a thin slice is
   for), `/retro` it into `docs/LESSONS.md` before doing anything else with the finding.
4. Fold the fix into a `docs/grind/*.instructions.md` chore (or the nearest equivalent for a
   non-grind domain — a reusable spec file either way) so the next cycle starts ahead of this one,
   not from scratch.
5. Re-check the cycle gate. Still open → repeat from step 3 with a revised thin slice. Closed →
   scale, per whatever width the domain's full run actually needs. Either way, move the row's
   `Next check` forward. Kill rule fired → set the row's State to `killed` or `pivoted`, and answer
   the double-loop question.

## Loops running now

One row per loop. The daily digest (`node scripts/doctrine-scan.mjs --due`, run by the
secretary-digest Routine) lists any row whose **Next check** date has arrived while its **State**
is still live, under Needs-you. Settle a check by doing it, then moving the date forward — or by
ending the loop (`closed` · `killed` · `pivoted` · `replaced`). A cell that isn't a date is never
flagged, so point it at the loop's own scanner when one already exists rather than double-flag, or
name the event that triggers the check. A row is never deleted — an ended loop keeps its row with an
ended State (same rule as `docs/READERS.md`). Keep the column names: `scripts/loop-list-decide.mjs`
finds columns by header. Seeded by #4060; filled from #3955's audit by #4059.

| Loop | The question | Owning issue | State | Next check |
|---|---|---|---|---|
| Bot doctrine checks | Does each bot's written doctrine still match its code? | #2287 | running | its dossier ledger (`docs/BOTS-SAURON.md`), flagged by the same scan |
| Mobile-first bet | Is expanding a curated phone view faster than retrofitting a desktop one? | `CLAUDE.md` → Mobile-first | running | 2026-10-31 — wrong if the next three phone-first surfaces each needed a desktop re-layout PR |
| Research scorecard | Do high-confidence forward-test calls pass more often than medium ones? (If not, confidence is not telling us anything about size.) `npm run research:scorecard` | #4061 | running | 2026-10-31 — re-run and post on #4061; baseline 2026-09-30: high 16 of 25 decided pass, medium 21 of 33, both 64% |
| Did the fix hold? | Do gate-type LESSONS preventions recur less than doctrine-only ones? `npm run lessons:held` | #4062 | running | 2026-10-21 — re-run and post on #4062; baseline 2026-09-30: gate or script 6 of 55 recurred (11%), doctrine 0 of 9, ledger-only 2 of 7 (29%) |
| Bottleneck before/after | Does each `bottleneck` fix move the number it named? `npm run bottleneck:baseline` | #4063 | running | 2026-10-21 — re-run; recount #3926 for its After line; baseline 2026-09-30: 1 of 40 carry a Before number (#3926: 63 "Failed again" comments in 7 days, 4 fixes stuck 21–25 days) |
| Readiness rubric | Do items the rubric flags deliver worse than unflagged ones? | #4056 | running | 2026-10-31 — kill everything but the parked check if flagged and unflagged land within 5pp |
| Handoffs, not lanes, bind delivery | Is ownership of each handoff the limit, rather than build capacity? | #4056 | running | 2026-10-31 — wrong if ready items wait >24h median for a free lane while the ready queue is non-empty |
| Ready blocks only on parking | Does refusing ready-while-parked stop parked builds without refusing real ones? | #4056 | running | 2026-10-31 — wrong if any lane claims a parked item, or the guard refuses >2 legitimate claims |
| Format stays out of ready | Do mermaid, fold, lint-clean, paths or non-goals still predict nothing about delivery? `npm run delivery:score` | #4056 | running | 2026-11-15 — wrong if a cohort readied after 2026-10-01 shows a ≥10pp gap on any of them over ≥30 items |
| Slices as sub-issues | Do split parents deliver with fewer follow-up fixes than unsplit ≥4-PR plans? | #4056 | running | 2026-10-31 — wrong if they show no lower follow-up-fix rate, or ≥2 of the first 5 split plans needed a re-plan |
| Only the last slice closes | Does a parent stay open while a sub-issue is open? | #4056 | running | 2026-10-31 — sweep closed plans; wrong if one stayed closed with an open sub-issue past one push tick |
| No deploy probe yet | Does skipping a post-deploy outcome probe and member notifications still cost nothing? | #4056 | running | 2026-11-15 — wrong if ≥5 genuine 7-day reworks were deploy-only faults, or member filings resume at ≥2/week |
| Priority only with a reader | Do lanes read the priority Eric sets? | #4056 | running | 2026-10-31 — wrong if `npm run rank` ships as the first reader and Eric's hand-set Priority is still unseen by lanes |
| No age-based closing | Are old entries still wanted, so an age expiry would bury them? | #4056 | running | 2026-11-15 — wrong (age expiry OK, IDEAS.md only) if the 30-oldest probe finds <10% still wanted and none re-dictated; 2026-09-30 sweep: 14 retired, 16 parked, none expired by age alone |
| Lane work leaves Needs-you | Does the digest's Needs-you hold only decisions Eric alone can make? | #4056 | running | 2026-10-15 — wrong if that day's digest lists retro, repair or code-applied needs-eric items under Needs-you |
| Issue-centric orchestration | Do #3818's dated falsifiers hold? | #3818 | running | 2026-10-10 — first falsifier; the second is 2026-10-31 |
| Research kill list | Does each killed hypothesis stay dead? (`docs/research/multi-symbol-sweep.md`) | #3955 | running | on each sweep Eric names tickers for — a kill reopens only on its stated condition |
| Capability adoption | Does a full-adoption pass cost what we predicted? (#3748, #3769 differed 13× in tokens) | #3769 | running | before the next run — write its predicted token cost first |
| Member studies | Do simulated members find what a real member struggled with, without seeing it — and anything structural he missed? (`docs/members/study/README.md`) | #4943 | graded — waiting on Eric | on Eric's answer to the readout (scale to Trade · revise · stop); first round 2026-10-09: recall 12 of 12, 66 structural, fixed-build control failed (`docs/members/study/profile-2026-10/readout.md`) |
| Bot readiness evals | Does each bot pass its fixed scenario set? (`src/evals/`) | README phase 6 | blocked-on-fix | when the evals are live-verified — the bot learning loop's own plan owns it |
| Haiku eval replay | Can Haiku/Sonnet do Layer 1 research as well as Opus? | #3264 | pivoted (#3300) | none — ended; worked example above |
