# Plan: trade playbooks + the record of why

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude (proposing) · **Date:** 2026-08-11

## Intent & end-state

Two research studies landed on 2026-08-11 ([`nvda-earnings-cycle.md`](../research/nvda-earnings-cycle.md),
[`intraday-volatility.md`](../research/intraday-volatility.md)). Between them they produce four
tradeable candidates, one execution rule that improves every strategy we will ever run, and one
finding that kills a whole category. This plan turns those from prose into **playbooks** — named,
parameterised condition→action units a persona can hold, that record *why* they fired, and whose
effectiveness can be measured per-strategy rather than smeared into one P/L number.

When this is done: Sauron (and any persona) holds a *named playbook* rather than a hardcoded
`decide`; every order carries a structured record of which playbook fired and on what evidence;
and the metrics layer can answer "is the positioning-bid play actually working?" separately from
"is Sauron up?"

**Why now, and why in this order.** Eric's stated sequence is playbooks → browser trade UI →
covered puts/calls → long options. The research also surfaced that **two of the four candidate
strategies are blocked on the same thing** — the order path only sends `type: "market"`,
`time_in_force: "day"` (`src/alpaca/alpaca-trading-client.ts:95-96`). Widening it is the shared
prerequisite for MOC/MOO *and* for the options roadmap, which makes it the highest-leverage
piece of plumbing on the board, not a detour.

## Acceptance criteria (EARS)

- [ ] WHEN a persona decides, the system shall attribute each `OrderIntent` to a named playbook
      and the evidence that triggered it. — *verify: unit spec asserting `playbookId` + evidence
      survive the guard chain into the `DecisionRecord`*
- [ ] WHEN an order is placed by any path (autonomous, manual, smoke), the system shall persist a
      human-readable note alongside it. — *verify: spec covering all three entry points*
- [ ] WHEN the observatory shows a trade, it shall show the note and playbook that produced it.
      — *verify: screenshot, Eric's eye*
- [ ] WHEN a playbook's window is open, the system shall be able to state the condition in a form
      a test can assert against fixture bars. — *verify: `playbook.spec.ts` against recorded fixtures*
- [ ] WHEN a non-urgent entry is triggered before 10:00 ET, the system shall defer it. — *verify:
      spec with a clock fixture; the study's execution-cost finding*
- [ ] WHEN a position is open and an earnings print lands within N sessions, the system shall
      refuse to hold through it unless the playbook explicitly opts in. — *verify: spec*

## Constraints & non-goals

- **Paper only.** Every playbook is `SIM`-labelled and nothing implies otherwise.
- **No shorting in the first cut.** Two of the sharper findings (fade-the-open, post-print bleed)
  need a short position on the most violently gapping large-cap in the market. Long-only first.
- **No new order types in this plan** — widening the path is called out as a prerequisite and
  gets its own change; this plan is written so the long-only playbooks ship without it.
- **Not a backtest framework.** The two research scripts are deliberately offline, throwaway-able
  instruments. Do not grow them into a framework until a third study needs one.

## Pre-settled forks

- **Playbook granularity** → a playbook is `{id, thesis, window, entry, exit, sizing, evidence}`,
  small enough that its effectiveness is measurable alone. Not a full strategy DSL.
- **Where the note lives** → extend the existing seam, do not invent one. `OrderIntent.reason`
  (`src/domain/types.ts:63`) already carries free text through the guard chain into
  `DecisionRecord`, which the observatory already reads. Add a *structured* `playbookId` beside
  it rather than parsing prose out of `reason`.
- **Manual notes** → free text, optional, never required. A note that blocks a trade is a note
  nobody writes.
- **Which strategies make the first cut** → S1 (positioning bid) + S2 (never hold the print) only.
  They are long-only, need no new order type, and S2 is the safeguard that makes S1 honest.

## The playbooks, ranked

| # | Playbook | Evidence | Status |
|---|---|---|---|
| **S1** | **Positioning bid** — long at D-20, flat at D-5 before an earnings print | +9.08% mean, 14/14 in the modern era, P=0.004 vs the era's own base rate; NVDA-specific (peers ~50%) | **first cut** |
| **S2** | **Never hold the print** — force flat by D-1 unless explicitly opted in | removes a coin flip with a −6.4% p10; the gap is the whole move and it fades | **first cut** |
| **E1** | **Don't trade the open** — defer non-urgent entries past 10:00 ET | first 30m is 2.17× average range and the only segment with negative drift | **first cut** (execution rule, not a strategy) |
| S3 | Fade the reaction-day open — short at open D+1, cover at close | −2.48% mean, 11/14 red, P=0.015 | blocked: needs shorting + Eric's sign-off |
| S4 | Overnight-only — hold close→open, flat intraday | 87% of the return at 62% of the vol; beats buy-and-hold below ~3.5bps/side | blocked: needs MOC/MOO |

**Killed by the research, recorded so it is not re-proposed:** opening-range breakout, opening-range
fade, first-hour momentum/reversal, and any "trade the opening volatility" variant. All lose after
realistic costs, and the breakout's break-even flips sign across symbols (NVDA 5.1bps, QQQ 2.0,
MRVL −0.5) — the signature of noise, not edge.

## Slices

1. **Playbook seam** — `playbookId` + evidence on `OrderIntent`, threaded through guards into
   `DecisionRecord`. No behaviour change; pure plumbing. *Auto-merge on green.*
2. **Trade notes end-to-end** — notes on manual + smoke paths too, surfaced in the observatory.
   *Visual — waits for Eric's eye.*
3. **S1 + S2 as a real playbook** — the earnings calendar (SEC 8-K derived, same source as the
   study), the D-20/D-5 window, the hold-through-print refusal. *Auto-merge on green; live
   enablement is Eric's.*
4. **E1 execution rule** — defer non-urgent entries past 10:00 ET. Small, improves everything.
5. **Slippage instrumentation** — record expected-vs-realized on every fill. This is the input
   that decides S4, and it costs nothing but measurement on fills we are already taking.

## Autonomy envelope

- Default merge policy applies. Slices 1, 3, 4, 5 auto-merge on green; slice 2 is visual and waits.
- **Never widenable here:** flipping any playbook to `live`, and anything touching credentials or
  the order path's outward-facing behaviour.

## Open questions (Q&A queue)

1. **S3 (fade the open) is the statistically sharpest single finding in either study but requires
   shorting NVDA.** Paper-only, but "practice like we play" says treat it as real. Build it behind
   a hard size cap, or leave it on the shelf?
2. **The next NVDA print date is an estimate (~2026-08-26), not confirmed.** Should the playbook
   refuse to act on an unconfirmed date, or act on the estimate with a widened safety margin?
3. **Slice 5 (slippage) is the cheapest item and gates the highest-Sharpe strategy.** Worth
   promoting ahead of slice 3?

## Decision log

_(none yet)_
