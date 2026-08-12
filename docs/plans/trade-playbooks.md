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

*(Amended 2026-08-12 by the [eight-symbol sweep](../research/multi-symbol-sweep.md) — scope
column added; a red-team kill on a symbol means the playbook must not be enabled there.)*

| # | Playbook | Evidence | Scope | Status |
|---|---|---|---|---|
| **S1** | **Positioning bid** — long at D-20, flat at D-5 before an earnings print | +9.08% mean, 14/14 in the modern era, P=0.004 vs the era's own base rate | **NVDA only** — killed on 6 of 8 peers, inverted-insignificant on AVGO, and GOOG needs a different exit (see G1) | **first cut** |
| **S2** | **Never hold the print** — force flat by D-1 unless explicitly opted in | every print gap tested is a fat-tailed coin flip (±8–24% single-night tails); both "gap pays" objections died under attack | **universal** (all 9 symbols; on META label it bought insurance) | **first cut** |
| **E1** | **Don't trade the open** — defer non-urgent entries past 10:00 ET | first ~hour carries 28–34% of daily volatility at ~zero drift on all 9 symbols and QQQ itself | **universal** — but a *cost rule for non-urgent entries only*: on GOOG/AAPL the first hour carries most of the session's return | **first cut** (execution rule, not a strategy) |
| **G1** | **GOOG run-up hold** — long D-20, exit at the **close of D** (deliberate deviation from S1's D-5 exit; still never holds the print) | pooled 37/43 positive, p=0.0008 vs measured base (0.003–0.012 under base-rate uncertainty); excess + net-of-QQQ positive in all three eras | GOOG only; never stacked with other pre-print longs (shared seasonality) | proposed: **deploy small** |
| S3 | Fade the reaction-day open — short at open D+1, cover at close | NVDA −2.48%, 11/14 red; **generalizes as a mega-cap class effect**: MSFT 59/87 red, p=3.4e-4 (clears Bonferroni); GOOG p=0.0014; absent on semis + AAPL | NVDA, MSFT, GOOG (META/AMZN direction only) | blocked: needs shorting + Eric's sign-off |
| S4 | Overnight-only — hold close→open, flat intraday | **killed as a trade** — beats buy-and-hold nowhere at realistic costs (fails before costs on MSFT; value-destroying on GOOG/AAPL); survives only as "prefer close-side executions." Lone conditional: CRWV ex-print carry, kill at ~13bps/side realized | structure only (CRWV carry pending MOC/MOO + slippage data) | blocked: needs MOC/MOO |

**Shelved with registered forward-tests (zero size, predictions logged before outcomes):** the
semi late-week bid (MRVL/AVGO — the Aug/Sep 2026 prints are observation #1), AAPL post-print
drift (starts at the Oct print), mega-cap post-print digestion vs QQQ (needs a new overlap-aware
study first). Kill switches pre-stated in the sweep doc.

**Killed by the research, recorded so it is not re-proposed:** opening-range breakout, opening-range
fade, first-hour momentum/reversal, and any "trade the opening volatility" variant. All lose after
realistic costs, and the breakout's break-even flips sign across symbols (NVDA 5.1bps, QQQ 2.0,
MRVL −0.5) — the signature of noise, not edge. The sweep's [kill list](../research/multi-symbol-sweep.md#kill-list--recorded-so-they-are-never-re-proposed)
adds nine more (S1-beyond-NVDA, AVGO/META hold-the-print variants, AAPL late run-up, MSFT D-10
run-up, S4 daily round-trips, and others) — check it before proposing any earnings-window trade.

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

*(Restated 2026-08-12 with the sweep's evidence — each phrased so "yes" is one word.)*

1. **Shorting unlock.** The sweep's only Bonferroni-clean directional edge (mega-cap reaction-day
   fade — MSFT 59/87 red, p=3.4e-4, red-majority in all four eras) is inert without paper
   shorting. Build S3 behind a hard size cap on MSFT/GOOG first (NVDA already chartered) — yes?
2. **Date policy, now with teeth.** AVGO's 83–98-day cadence spread can place an estimated D-5
   entry *after* the real print. Require an IR-confirmed date before any date-keyed playbook acts,
   estimates permitted only for widening the S2 flat window — yes?
3. **Promote slice 5 (slippage instrumentation) + the MOC/MOO order-path widening ahead of
   slice 3.** It decides the CRWV overnight carry (kill line ~13bps/side), settles every S4
   verdict, and is the shared prerequisite for the options roadmap — yes?
4. **Enable G1** (GOOG long D-20 → close of D, small, paper) as a documented deviation from S1's
   exit shape — yes?
5. **Demote S1 to NVDA-only** in the playbook seam (it failed its controls on seven of eight
   peers) — yes?
6. **Fix the instrument before it runs again** (sequenced ahead of the next sweep, which becomes
   its test): EDGAR acceptance-timestamp handling for midday filings, the quarter-dedup, and the
   excluded-newest-print blind spot corrupted 2 of 8 event lists and hid the freshest
   out-of-sample point on 5 of 8 — yes?

## Decision log

_(none yet)_
