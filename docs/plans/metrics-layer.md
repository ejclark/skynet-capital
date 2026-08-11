# Plan: the metrics layer — measured stats, and the achievements that turn them into gameplay

**Status:** draft <!-- awaiting Eric's refinement pass + ready flip -->
**Author:** Claude (proposing) · **Date:** 2026-08-11

## Intent & end-state

Eric's claim, and it is the right one: **measuring stats is the prerequisite to abstracting actions
into gameplay.** A ceremony cannot fire, a renown point cannot be awarded, and a ladder cannot rank
anyone until something is *measured*. Everything the game design wants — renown, seasons, called-it,
landmark leveling, the city that reacts — bottoms out in a number nobody currently computes.

So this plan builds two layers, and the second is the bridge Eric is pointing at:

1. **The stat layer** — one pure module that computes a *family* of measures per participant over a
   window, from durable history. Not a grab-bag: one template, applied uniformly.
2. **The achievement layer** — the thing that makes a stat *playable*. A stat is a number; gameplay
   needs a **discrete event** ("first to double", "longest green streak", "biggest single day"). This
   layer watches stats cross thresholds and emits events onto the ceremony channel that already
   exists (`CeremonyChannel`, shipped in the history plan's slice 4). That is the abstraction from
   action → measurement → event → gameplay, end to end.

End-state: multi-axis ladders (percentage *and* raw dollars, deliberately different games), a
per-strategy effectiveness readout for anything the system can attribute, and a stream of achievement
events the sim-city layer can celebrate — with every unmeasurable claim left honestly unmade.

## The measurement tiers (what is possible with what data)

This ordering is the plan's spine: **ship what today's data honestly supports, and don't fake the rest.**

| Tier | Needs | Unlocks | Status |
|---|---|---|---|
| **0 — account stats** | durable `EquitySample` history only (already recording) | return %, return $, max drawdown, best/worst day, green streak, doubling — for *every* participant | buildable now |
| **1 — bot strategy stats** | tier 0 + the persona id every bot order already carries | per-strategy effectiveness for bots: attempts, win rate, avg %, total $, consistency | buildable now |
| **2 — human strategy stats** | a play-tagging surface + closed round-trip records | "how well does Eric run the wheel", per-play win rate, "which plays worked" | **out of scope** — see non-goals |

Tier 2 is where Eric's wheel example lives, and it is honestly blocked twice over: the order path is
equity-market-orders-only (no options), and human trades carry no strategy attribution. Tiers 0 and 1
are not a consolation prize — they are the multi-axis ladder and the bot-vs-bot comparison the game
needs first, and they need no new data at all.

## Acceptance criteria (EARS)

**Slice 1 — the stat family (pure, no rendering)**
- [ ] WHEN given a participant's samples and a window, the stat module shall return the family:
      `returnPct`, `returnAbs`, `maxDrawdownPct`, `bestDayPct`, `worstDayPct`, `greenStreakDays`,
      `sampleCount`, and a `partial` flag when history is younger than the window. — *verify: spec*
- [ ] IF a participant has fewer than two samples in the window, THEN every derived measure shall be
      `null` rather than 0 — an unmeasurable stat must never render as a real value. — *verify: spec*
- [ ] WHEN a window is requested, day boundaries shall be computed in **US market time**, not UTC —
      "best day" that splits a session in half is a wrong number, not a rounding difference.
      — *verify: spec with a sample set spanning a UTC midnight mid-session*

**Slice 2 — multi-axis ladders**
- [ ] WHEN the leaderboard ranks by **percentage**, it shall rank on return-since-first-sample and
      exclude participants below a minimum-stake floor, labeling the floor visibly. — *verify: spec —
      a $50 account up 20% does not outrank a $50k account up 3%*
- [ ] WHEN the leaderboard ranks by **raw dollars**, it shall rank on absolute return over the same
      window, with no floor. — *verify: spec*
- [ ] WHEN a participant's history is too short for the selected axis, they shall render in an honest
      "still accruing" state rather than at rank last. — *verify: spec*

**Slice 3 — per-strategy effectiveness (bots)**
- [ ] WHEN a persona has closed round trips in the window, the strategy readout shall show attempts,
      win rate, average return %, total $, and best single — computed from that persona's own account
      history. — *verify: spec*
- [ ] WHEN two personas are compared, the readout shall use the identical metric family, so the
      comparison is like-for-like. — *verify: spec*

**Slice 4 — achievements: stats become events**
- [ ] WHEN a stat crosses an achievement threshold, an achievement event shall be emitted on the
      ceremony channel, carrying an id stable across recomputation so it fires **once**. — *verify:
      spec — recomputing over the same history emits no duplicate*
- [ ] WHEN history is replayed from the start, achievements shall be derived in chronological order
      with their **historical** timestamps, not the replay time. — *verify: spec*
- [ ] IF an achievement's underlying stat later reverses (a streak breaks, equity falls back under
      2×), THEN the achievement shall remain awarded — it records that a thing *happened*, not that it
      is still true. — *verify: spec*

**Slice 5 — the readout surface**
- [ ] WHEN a participant profile renders, it shall show the stat family with honest seams for
      unmeasurable entries. — *verify: spec + offline render*
- [ ] WHEN the offline fixture set is used, the stats shall be deterministic across runs. — *verify:
      spec — two boots render identical numbers*

## Constraints & non-goals

- **Honesty first.** `null` renders as a seam, never as `0`, `—`, or `0.00%`. A partial window says so.
  No stat is displayed whose inputs the system does not actually have.
- **Pure and injectable-clock.** The stat and achievement layers take samples + a clock and return
  values; no I/O, no `Date.now()` inside. This is what makes them testable and replayable.
- **Additive to storage.** Achievements are *derived*, not a new persisted store — recomputable from
  history. (A fired-ledger only becomes necessary if we later need cross-restart dedupe of *delivery*;
  the ids make that a later, additive file.)
- **Arch budgets:** `leaderboard-view.ts` (93/94) and `compare-view.ts` (164/165) are at their caps —
  new panels land as new modules those views only compose.
- **Non-goal: tier 2 / human strategy attribution.** Needs the play-tagging surface, which is the same
  write surface as THE-GAME.md's Sunday Council thesis. Worth building — as its own plan, not folded
  into this one.
- **Non-goal: options-strategy stats (the wheel).** Unmeasurable until the options order path exists.
- **Non-goal: renown scoring.** Renown is a *weighting* of these stats and sits behind Eric's five
  open forks in THE-GAME.md. This plan deliberately produces the inputs and stops.
- **Non-goal: ceremony visuals.** Slice 4 emits events; what they look like is Eric's taste call.

## Pre-settled forks (proposed — veto at refinement)

- **Window basis** → rolling windows (`1d`, `7d`, `30d`, `season`, `all`) computed from samples, with
  `partial` when history is shorter. Not calendar-quarter-locked; seasons can layer on later.
- **The percentage baseline** → **first recorded sample**, labeled "since first sample". It is not the
  true seed for anyone who predates sampling, and the label says so rather than implying otherwise.
- **Minimum-stake floor** → the percentage ladder requires an equity floor to rank; below it, a
  participant appears but is marked unranked. Prevents the $50-account exploit without excluding anyone
  from the board.
- **Achievement id** → `type:participantId:periodKey`, compare-only and derived — the same shape that
  worked for transitions, so recomputation is idempotent by construction.
- **Achievements are awarded, not held** → they record an event, and never un-fire. This is the
  positive-reinforcement bias: celebrate the moment it happened.
- **Where stats live** → `src/observatory/participant-stats.ts` (family) and
  `src/observatory/achievements.ts` (thresholds → events). Both pure; views compose them.

## Autonomy envelope

- Slices 1–4 (pure logic, specs, event emission): auto-merge on green.
- Slice 5 (rendered readout): visual — offline render posted for Eric's eye before merge.
- Nothing here touches credentials, spend, or the irreversible class.

## Refinement questions for Eric

1. **The achievement set.** Proposed opening list: *first to double*, *longest green streak*, *biggest
   single-day gain*, *deepest drawdown survived* (a comeback award), *first blood* (first realized
   profit). Which of these earn their place, and what's missing that you'd actually want to see fire?
2. **Minimum-stake floor for the percentage ladder** — a fixed dollar figure, or a percentage of the
   median account? (I lean fixed: legible, and explainable in one line to a new player.)
3. **Does a losing streak get an award?** The brand says positive-reinforcement bias and "render losses
   honestly but without punishing spectacle." My read is *no negative achievements*, but a "survived a
   30% drawdown" comeback award turns the same data into something worth celebrating. Agree?

## Open questions (Q&A queue)

_(empty — refinement owns getting these to zero before ready)_

## Decision log

_(empty until execution)_
