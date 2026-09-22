# Can a cheap model screen research intake? — 2026-09-15

**The question, plainly.** The research lane spent a full weekly token quota in ~24 hours (#2946).
Eric's second remedy was to route the work to cheaper models: *"I suspect most of our research was
primitive and does not require fable 5, or even opus... Haiku may be adequate for many of our
operations, in which case the savings is huge."* The largest single win available would be **intake
screening** — deciding which calendar events are worth a full session at all — because that is
where the volume is. This study tests whether a cheap model can make that call.

## The call

| Candidate | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| **LLM intake screening (any tier)** | **Don't build it** | Medium | A zero-token field comparison catches more real edges than either model tested, for no spend. | A rerun on ≥ 30 actionable events where a model beats `impact in {critical, high}` on recall at equal or lower session volume |
| **Haiku for the screening decision** | Don't | Medium | 2/5 actionable events caught; discards two Treasury auctions that produced real edges. | Same rerun, Haiku ≥ 4/5 recall |
| **Sonnet for the screening decision** | Don't — it is *worse*, at 2.5× the price | Medium | 1/5 caught. Agrees with Haiku on 15/18 items; the extra spend buys no extra discrimination. | Same rerun, Sonnet materially above Haiku |
| **`impact in {critical, high}` as the filter** | **Keep — it is already shipped** | Medium | Best recall of everything tested (3/5), zero tokens, and it is exactly the carve-out the research horizon already uses. | A cheap model beating it on recall at equal volume |
| **Haiku for stance-writing given evidence** | **Untested — do not infer from this** | n/a | This study tested screening from metadata only. The judgment task with instruments in hand is a different question. | A purpose-built stance replay, still unrun |

**The one-line version:** the models were not reading anything the `impact` field does not already
say — they just said it less reliably, and charged for it.

## Method

- **Ground truth.** All 653 banked research docs, classified by whether they reached a tradable
  stance. **5 did; 648 concluded "stand aside."** A 0.77% base rate.
- **Why a single agreement score would have been worthless.** At that base rate a model that
  always answers "stand aside" scores **99.2% agreement with Opus** while being useless. Scoring
  had to separate *recall on the 5* from *false positives on the rest*. The naive design would
  have passed Haiku with a number that measured nothing.
- **Eval set.** 30 events — all 5 actionable plus 25 stand-asides, stratified by impact and
  deliberately oversampling critical/high (6 critical, 10 high, 8 medium, 6 low), since that is
  where a wrong skip actually costs money. Seeded shuffle, reproducible.
- **Decontamination.** The calendar's `notes` fields are written *by* the research they would be
  predicting — one reads *"THE MEASURED FINDING, and it is a refusal."* All notes were stripped.
  Judges saw only `id`, `kind`, `title`, `date`, `impact`, `symbols`, and were instructed not to
  read any other file.
- **Judges.** Haiku on all 30; Sonnet on the 18-event subset holding all 5 actionable events, as a
  control on whether the task is learnable at all rather than a question of tier.

## What came back

Scored on the 18-event subset (all 5 actionable + 13 stand-asides) so every row is comparable:

| Screener | Caught | Sessions bought | Stand-asides skipped | Token cost |
|---|---|---|---|---|
| `impact in {critical, high}` | **3/5** | 10/18 (56%) | 6/13 | **none** |
| Haiku | 2/5 | 8/18 (44%) | 7/13 | paid |
| Sonnet | 1/5 | 7/18 (39%) | 7/13 | 2.5× Haiku |
| `impact == critical` | 1/5 | 4/18 (22%) | 10/13 | none |
| always-research | 5/5 | 18/18 (100%) | 0/13 | maximal |
| always-skip | 0/5 | 0/18 (0%) | 13/13 | none |

**Both models missed the same three**, and what they are matters:

- `treasury-10y-note-2026-09-09` and `treasury-30y-bond-2026-09-10` — both `high` impact, both
  dismissed as *"routine reopening auction"*. Both produced real edges. The free rule keeps them.
- `hammack-remarks-2026-09-03` — `low` impact, a single Fed speaker. Nothing catches this one,
  including the free rule. It was found by doing the research, not by screening for it.

Haiku and Sonnet agreed on 15/18. That agreement, plus Sonnet's *lower* recall, is the evidence
for the headline: both are applying the same shallow "is this a big-name catalyst" heuristic that
`impact` already encodes.

## Three things this does not say

- **It does not say Haiku cannot write research.** Screening from bare metadata is a prediction
  task; producing a stance from instrument output is a judgment task. The second is untested.
- **The error bars are wide.** Five positives. A 1-event swing moves recall 20 points. The result
  is strong enough to stop a build, not strong enough to close the question forever.
- **There is a temporal confound.** Four of the five actionable events are past-dated relative to
  the run (2026-09-15), because recent events are the ones that got real research. If anything
  that made the task *easier* — a screener could partly separate positives by date — and neither
  model exploited it, so it does not rescue the negative result.

**One ablation was planned and deliberately skipped.** A second variant with research-authored
title clauses truncated was to test whether leftover contamination *inflated* Haiku's score. Haiku
underperformed a free rule and Sonnet underperformed Haiku, so contamination cannot be what is
holding the models up; the ablation would have cost tokens to confirm a conclusion the data
already forecloses.

## What it changes

1. **Do not build LLM intake screening.** A REJECT with evidence, banked so the next session does
   not re-propose it. The savings it promised do not exist.
2. **The research horizon's high/critical carve-out is validated.** It is the best screening rule
   measured, and it already ships (#2971).
3. **`impact` is a weak but real signal, and the best cheap one available** — 3/5, not 5/5. Two of
   the five actionable events were `low` and `medium`, so any impact-keyed filter is a
   volume-control device, never a claim about where edges live.
4. **The remaining token savings have to come from volume, not tier** — which is where they came
   from: the dispatch ceiling (#2962) and the horizon (#2971) together took remaining-life pulses
   from 5,375 to 2,320 and capped any single tick at 6 sessions.

## Open, and worth running next

Whether Haiku can write a **stance** given the deterministic instrument output — the actual
delegation `docs/COMPUTE.md` contemplates. That test needs the instruments run per event and the
banked stance as ground truth, and it is the one that would settle Eric's question properly rather
than settling only its cheapest interpretation.

_Method, data and scorer: this session's scratch harness (seeded shuffle, 30-item set, 13 judge
runs). Paper-only, educational — no capital was deployed on any of this._
