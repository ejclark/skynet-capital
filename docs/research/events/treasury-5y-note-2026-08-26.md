# 5-Year Treasury Note auction — treasury-5y-note-2026-08-26

**Kind:** rates · **Date:** 2026-08-26 (confirmed, TSY: treasurydirect.gov upcoming auctions —
1:00pm ET, checked 2026-08-18) · **Impact:** medium
**Last assessed:** 2026-08-19

## At a glance

**TL;DR.** This is a routine monthly belly-of-the-curve supply event, not a standalone trade
thesis — the app carries no symbols against it. The last three 5-year auctions have tailed (sold
at a yield *higher* than the market expected, i.e. weaker demand than priced), driven mainly by
falling foreign (indirect) participation; if that streak continues on Aug 26 it nudges yields up
into the same session as the Jul-2026 PCE print, the Q2 GDP second estimate, and — after the
close — **NVDA's confirmed earnings**. The honest read: any rates signal this auction produces is
likely to be a minor, easily-overshadowed input on a very crowded macro day, not a market-moving
event on its own. Treat it as a background condition for sizing/timing NVDA-adjacent and other
long-duration tech positions that day, never as a trade in itself.

| Horizon | Call | Why |
|---|---|---|
| Today (Aug 19) | Stand aside | Pure information-gathering day; the auction is a week out and today's own 20Y auction result isn't posted yet. |
| This week (thru Aug 24) | Watch | Pre-auction concession (yield drift into supply) is the normal tell; no position is sized on a rates auction alone. |
| This month (thru Aug 26 + settlement) | Watch / flat the print | Confirmed same-day stack: 5Y auction (1:00pm ET) sits between the 8:30am PCE + GDP prints and NVDA's after-close report — don't isolate the auction's signal from that noise; don't let auction-day yield chop drive NVDA-adjacent share timing. |
| This quarter | Watch | Belly supply recurs monthly (next 5Y: Sep 23) — the tailing trend, not any one auction, is the thing worth tracking as a duration-sensitivity input for long-duration AI names elsewhere in the calendar. |

**Signals & conditions.**
- **Bearish-for-duration tell:** a fourth consecutive tail (stop-out yield > when-issued) with
  indirect bidders again well below the ~65.7% historical average → foreign demand weakness is
  becoming a trend, not noise; raises caution (not directional action) on long-duration tech names
  into the NVDA print later that day.
- **Benign tell:** auction stops through (stop-out < WI) or tails inside the ~0.6bp recent
  average with indirect bidders back near/above average → no incremental rates headwind that day;
  the session's risk is then cleanly NVDA/PCE, not auction-driven.
- **Compound-risk tell (structural, already true regardless of the auction result):** Aug 26 also
  carries PCE, GDP 2nd estimate, and the NVDA print — size and timing decisions that day should
  default to the most conservative applicable guard (see NVDA's own P0 guards in
  `nvda-aug-2026-print.md`), not to this auction's result in isolation.

## Initial research

**Question:** what does the 5-year note auction on 2026-08-26 tell us, and how should it change
behavior around the same-day NVDA print, PCE, and GDP release?

**Verdict in one line:** the recent 5-year auction trend is genuinely weak (a tailing streak, weak
foreign demand) but the auction itself is a second-order signal on a day dominated by two bigger
catalysts — read it as a caution modifier on long-duration tech exposure, not as an independent
trade.

**Method:** primary/near-primary sourcing on the most recent completed 5-year auction (Jul 27,
2026) via treasurydirect.gov results cross-referenced against two independent auction-tracking
write-ups (Newsquawk, BigGo Finance/Reuters-sourced) for the numeric detail a raw PDF couldn't be
parsed for in this pass; the upcoming Aug-26 auction's own size/CUSIP has not yet been formally
announced as of the 2026-08-18 check date (the 2Y/5Y/7Y cycle is typically announced ~1 week
ahead), so this research reasons from the announced *schedule* (confirmed) plus the *recent-size
pattern* (not yet confirmed for this specific auction). Fed-path context sourced via CME FedWatch
commentary as reported in financial press, checked 2026-08-19.

### Leg (a) — "the 5-year is in a genuine demand-weakness trend" → SUPPORTED

Most recent 5-year auction, **Jul 27, 2026** (treasurydirect.gov result; cross-checked via
Newsquawk and BigGo Finance, both 2026-08-19):

| Metric | Result | 6-auction average | Read |
|---|---|---|---|
| Size | $70B | — | |
| Stop-out (high) yield | 4.408% | — | |
| When-issued yield | 4.399% | — | |
| Tail | **+0.9bp** (tailed) | +0.6bp | weaker than recent norm |
| Bid-to-cover | 2.28x | 2.33x | below average |
| Indirect (foreign) | 59.2–59.25% | 65.6–65.7% | notably weak — the headline driver |
| Direct | 27.22% | 21.4% | domestic buyers partly offset the foreign gap |
| Primary dealers | 13.53% | 12.9% | slightly elevated dealer absorption |

Financial-press characterization (TFTC, 2026-07/08, reporting on the same print): "one of the
ugliest 5-year auctions in years," extending "a prolonged streak of tailing 5-year auctions,"
foreign demand at its lowest since July 2025, dealers absorbing the most since March. This is a
real, multi-auction trend, not a one-off — the leg is supported.

### Leg (b) — "this auction alone will move the tape" → REFUTED as stated / MIXED as a modifier

The 5-year is genuinely the most Fed-path-sensitive point on the coupon curve (belly of the curve
= near-term Fed-path expectations, as opposed to the 20Y/30Y term-premium story). But Aug 26 is
not a quiet day for this signal to operate in: it shares the calendar with PCE (08:30 ET, the
Fed's preferred inflation gauge) and Q2 GDP second estimate (08:30 ET) *before* the 1:00pm auction,
and NVDA's earnings *after* the close — already flagged in the calendar's own notes for all three
entries (`market-events-data.ts`: "Belly supply; lands the same day as the NVDA print + PCE — a
stacked-risk session" / "Stacks onto the NVDA print + PCE + 5Y auction — Aug 26 is the week's
compound-risk day"). A weak or strong auction result competes for attention with a
Fed-gauge inflation print earlier the same morning and a mega-cap earnings event after the close —
the auction's own signal is real but structurally likely to be a minor input in the day's total
information flow, not the headline. Graded MIXED: the underlying rates signal is real (leg a), but
"this auction moves markets" as an isolated claim is refuted by the calendar it lands in.

### Leg (c) — "the belly is especially Fed-path-sensitive into this auction" → SUPPORTED (premise corrected 2026-08-19)

**[Corrected 2026-08-19.** The original write of this leg asserted a "~85% CME probability of a 25bp
**cut** at the Sep-16 FOMC, dot-plot implying further cuts through year-end." That is **wrong** and
contradicts this repo's own FOMC ledger ([`fomc-2026-09-16.md`](fomc-2026-09-16.md)): the Sep-16
base case is a **hawkish hold (~60–70%)**, a **25bp hike live at ~30–40%**, and a **cut priced at
zero** — under a new chair (Warsh) whose July dissents wanted a *hike*, in an oil-shock-driven live
hike debate, not an easing cycle. The correction inverts the *direction* of the rate risk; the
leg's conclusion (the belly is the most Fed-path-sensitive coupon point, so the same-day PCE/GDP
adjacency dominates the auction) still holds.**]

Fed funds held at 3.50–3.75% through the Jul 2026 meeting (5th consecutive pause per financial
press, checked 2026-08-19); the Sep-16 FOMC (the meeting immediately following this auction) is
priced as a hawkish hold ~60–70% / 25bp **hike** live ~30–40% / **cut ~0%** (per the FOMC sibling,
CME FedWatch press-cited ~69% hold as of 2026-08-14). The belly is the coupon point most sensitive
to that path, so it reprices hardest on any surprise in the PCE/GDP prints landing hours before
this auction — but because the live path is hold-vs-*hike*, a hot PCE that morning pushes the belly
toward *higher* yields (a hike-repricing), not lower. That reinforces why the adjacency (leg b)
matters more than the auction in isolation. New Fed chair Warsh's first extended policy remarks land
at Jackson Hole on **Aug 28** (D+2 of this auction, D+2 of the NVDA print) — a second near-term
Fed-path catalyst worth tracking alongside this one, already a separate calendar entry.

### What plays the conditions support

**None directly** — this event carries no symbols and the house playbooks (S1/S2/E1/S3/S4/G1) are
symbol-keyed. Its role is as a **conditioning input**: if the tailing streak extends on Aug 26 with
weak indirect demand, that modestly raises caution (never a directional signal on its own) around
new long-duration tech share entries timed for that day — which is already the P0 guard territory
NVDA's own research doc (`nvda-aug-2026-print.md`) covers (no new share purchases in the dead zone,
flat unhedged positions by D-1). This doc does not introduce a new play; it is a receipt that the
guard is well-founded on the rates side too.

### Honest limits

The Aug-26 auction's own size/CUSIP is not yet formally announced (checked 2026-08-18) — the $70B
figure above is the *prior* auction's confirmed size, carried forward as a pattern, not a
confirmed number for this specific auction; re-verify against treasurydirect.gov before the
auction date. The auction result itself (this event's real content) will not exist until 1:00pm ET
on 2026-08-26 — everything here is pre-auction positioning context, not an outcome call. The
July-auction figures come from two independent secondary write-ups cross-referencing the primary
treasurydirect.gov release (the raw PDF result could not be parsed as text in this research pass);
figures agree closely across both sources but neither is the primary document itself. Fed-path
probabilities are point-in-time market pricing (mid-August 2026) and drift daily into the PCE/GDP
prints that land the same morning as this auction — by definition stale the moment new data
arrives. This event carries no `symbols`, so nothing here licenses a trade in any specific name;
per house policy, `confirmed` status only means the *date* is trustworthy, never that the
downstream stance is settled.

## Stance & kill switches

**Stance (confirmed-date event; no standalone play):** treat this as a **watch-only, context
event**. Do not size or time any position — NVDA-adjacent or otherwise — off this auction's
expected or actual result in isolation. Its only actionable role is as one more reason the existing
NVDA P0 guards (confirm date vs. IR, no new share entries in the dead zone, flat unhedged shares by
D-1, no first-hour entries) are well-founded on Aug 26 specifically, since a weak auction result
would add rates pressure on top of an already crowded macro/earnings day.

**Kill switches (what would change this stance):**
- If the Aug-26 auction result is unusually extreme in either direction (e.g., stops through with
  indirect bidders sharply above average, or tails >2x the recent +0.9bp with indirect demand
  making new multi-auction lows) **and** that coincides with a hot PCE print the same morning —
  escalate this from "background context" to an explicit same-day caution flag on long-duration
  tech names, worth a same-day pulse-check note even outside the normal cadence.
- If the size/CUSIP announcement (expected ~1 week before the auction) shows a size materially
  different from the $70B pattern (e.g., a supply increase), that changes the demand-absorption
  math and should be logged at the next pulse check regardless of cadence.
- Nothing here licenses any date-keyed *action* — this event's status is `confirmed` on the date
  only; the stance above stays observational per house policy (estimates/observations widen
  caution, never license entries).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D7 | Initial research banked. Prior (Jul 27, 2026) 5Y auction tailed +0.9bp on 59.2% indirect (vs 65.7% avg), bid-to-cover 2.28x (vs 2.33x avg) — a genuine multi-auction demand-weakness trend, per TFTC/Newsquawk/BigGo cross-check. Adjacency sweep: confirmed same-day stack already reflected in `market-events-data.ts` — PCE (08:30 ET) + GDP Q2 2nd estimate (08:30 ET) + this auction (1:00pm ET) + NVDA earnings (after close), all 2026-08-26; Jackson Hole (Warsh's first keynote) follows D+2 on 2026-08-28; Fed funds at 3.50–3.75% with ~85% CME-implied odds of a Sep-16 25bp cut as of mid-Aug 2026 (financial-press reporting, checked 2026-08-19) — no new dated events discovered beyond what the calendar already carries. | — (stance set) | 2026-08-21 |
| 2026-08-19 | D7 | **Correction (same-day, cross-check).** The initial row above and leg (c) stated a Sep-16 rate **cut** backdrop (~85% CME cut odds, dot-plot easing). That is **wrong** — per the repo's FOMC ledger ([`fomc-2026-09-16.md`](fomc-2026-09-16.md)) the Sep-16 read is hawkish-hold ~60–70% / **hike** ~30–40% live / **cut priced at zero** (oil-shock live-hike debate, hawkish June/July dots, chair Warsh's dissents wanting a hike). Root cause: the initial pass read a stale/pre-oil-shock FedWatch figure and did not cross-check the FOMC sibling. Leg (c) is corrected in-place with a visible marker; the belly-sensitivity finding and the watch-only guard stance **stand** — only the *direction* of the rate risk flips (hot PCE → belly toward higher yields / hike-repricing, not a cut). | Premise corrected; stance unchanged (watch-only guard) | 2026-08-21 |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
