---
name: haiku-eval-replay
description: blind-replay one sampled event's initial research assessment at a given model tier, for the S5 Haiku/Sonnet adequacy eval (#2946, slice 1 of #3264)
effort: high
isolation: none
---

# Blind-replay one event's initial research assessment

**Calling convention:** the front matter above is the calling convention — generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' --item-source '<where the list came from>' docs/grind/haiku-eval-replay.instructions.md`
rather than transcribing these values by hand. `effort: high` because producing a stance is a
judgment call, not a mechanical edit (`docs/COMPUTE.md`). Model is set per grind call, not in this
file — the same chore runs once at `haiku`, once at `sonnet`, against the same item list, so the
comparison is apples-to-apples. `isolation: none` and no `outcomeCheck` — read-only, nothing is
edited or pushed, no branch or worktree needed. The deliverable is the
structured report back, not a commit.

**Codified from a 4-item pilot, 2026-09-18** (banked as a lesson: `docs/LESSONS.md`). Refine this
file in place as later batches surface more findings — the pilot already forced one real revision
(see "Known open problem" below); expect more.

## Goal

**Prospective use only (2026-09-18) — see the resolved contamination finding below.** Given one
*newly-dispatched, live* due event (never a historical id from the frozen
`docs/research/haiku-eval-sample-<date>.json` sample — that path is retired for this purpose),
independently produce an initial research stance for it at the specified model tier, in parallel
with the real dispatch's own assessment, **without** seeing that real assessment. The result gets
compared against the real dispatch's banked verdict by the calling session once both exist, not by
this chore — this chore only produces one side of the comparison.

## Steps

1. Read `docs/process/EVENT-RESEARCH.md`'s "`never-assessed` → initial research" section for the
   task shape: a stance per horizon, confidence, signals/conditions, and a falsifier.
2. Read `src/domain/market-events/<id>.json` for the raw calendar facts (kind, date, confirmed
   sources) — fair game, it's the calendar entry, not the analysis.
3. **Do not read** `docs/research/events/<id>.md` or anything under `docs/research/forward-tests/`
   for this event — that file already contains the banked verdict this replay is being compared
   against. If its content is seen anyway (e.g. surfaced by a search result), disregard it and do
   not let it influence the answer produced.
4. Do real research via WebSearch/WebFetch per the protocol's instrument list for the event's kind
   (earnings/symbol-keyed vs. macro-print/sector/geopolitical) — consensus expectation, reaction
   function to surprises, sensitivity of tracked names.
5. Produce an independent stance: a call (stand aside vs. a specific play), confidence
   (High/Medium/Low), and a falsifier — a specific, checkable condition that would prove the stance
   wrong.

Report back in this exact structure, nothing else:

```
STANCE: <one line — the call>
CONFIDENCE: <High/Medium/Low>
FALSIFIER: <one line — the specific checkable condition>
BRIEF_WHY: <2-3 sentences>
CONTAMINATION_NOTE: <one line — did search results surface information about this event's actual
  outcome that wouldn't have been knowable at the time of a real initial assessment? say so plainly
  even if uncertain, per step 6>
```

6. **Self-report on temporal contamination, always, even when uncertain.** Say so if search results
   surfaced the event's actual outcome, market reaction, or anything downstream of the event date —
   don't silently produce a clean-looking report if the research wasn't actually blind. The pilot's
   most useful finding came from an agent disclosing this unprompted; make it a required field so it
   doesn't depend on the agent thinking to volunteer it.

## Known open problem — read before running at scale

**Every sampled event is, by construction, in the past relative to today.** Live WebSearch does not
respect that boundary — a query about a historical macro print routinely surfaces news about what
actually happened, even when this chore's own corpus file is correctly avoided. The 2026-09-18
pilot caught this directly: one Sonnet replay self-disclosed seeing the real PCE outcome and the
Fed's subsequent hike; a parallel Haiku replay showed the same signature (hindsight-shaped framing)
without flagging it, until the `CONTAMINATION_NOTE` field above made it a required report.

This means a result reported here tests "does this model produce a reasonable-sounding judgment
with hindsight-adjacent search results available," not "would this model reach the same *initial*
call with only what was knowable at the time" — an easier task than the one #2946's S5 spec
actually wants measured, which inflates every stance-match score built from this chore's output.

**Resolved 2026-09-18 (#3264): prospective testing only, historical replay retired for this
purpose.** The date-cutoff fix is not buildable — `WebSearch` takes only `query` and domain
allow/block lists, no date-range or as-of parameter, so nothing constrains it to pre-event results.
**This chore no longer runs against the frozen historical sample.** The valid design is to run it
against newly-dispatched *live* due events going forward (no hindsight exists yet to leak, by
construction) — one data point per real dispatch, accrued over time rather than 30 at once. Do not
resurrect the 30-item historical batch under this chore's steps; it would reproduce the same leak
measured in the 2026-09-18 pilot (docs/LESSONS.md) no matter how many events are added.

## Guardrails

- Never write to `docs/research/events/<id>.md` or any file under `docs/research/forward-tests/` —
  this is a read-only comparison exercise, not a real dispatch, and must never be mistaken for one
  by a later session scanning the corpus.
- Stay efficient — this is a blind eval replay, not a production research doc. A pilot run
  completed in 6-13 tool calls per item; treat a run needing significantly more as worth a second
  look, not just a cost overrun.
- If the event's calendar JSON is missing or the event id doesn't resolve, report `status:
  "blocked"` rather than guessing at what the event was.
