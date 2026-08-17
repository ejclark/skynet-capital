# NVDA earnings print — nvda-2026-08-26-print

**Kind:** earnings · **Date:** 2026-08-26 (confirmed, IR: nvidianews.nvidia.com call notice) · **Impact:** critical
**Last assessed:** 2026-08-17

## At a glance

**TL;DR.** The beat is near-certain but the market stopped paying for it — NVDA has closed **down
after 6 of the last 8 prints** on beats. The real bar is the **~$94–95B revenue whisper plus a
~$100B+ Q3 guide**, not the ~$91.8B consensus. Options price **~7% implied vs ~2.8% average
realized**, so **long premium is the expensive side** — defined-risk structures over unhedged
gap-holds. Date **confirmed** (IR): Wed **2026-08-26**, after close.

| Horizon | Call | Why |
|---|---|---|
| Today | No new run-up entries | The S1 pre-print window has passed; the dead zone opens ~Aug 19 (D-5→D −0.77%, 50% win). |
| This week | Flat by D-1 (S2) | Any unhedged share position flat before the print; no first-hour entries (E1). |
| This month | Own it *after* the print | Cheapest entries of the cycle come post-print — reaction day 11/14 red; the D+1→D+6 dead week (FT-7) costs nothing to respect. |
| This quarter | Revenue intact, multiple at risk | AI-capex still expanding (revenue tailwind), but raises are now *punished* — the re-rating is sentiment about the cycle, not the beat. |

**Signals & conditions** — the buy/sell/hold triggers:

- **Don't buy the pop** — the single most reliably losing move of the era (11/14 reaction days red).
- **Sell-premium tilt** — implied > realized on ~75% of the last 16 prints; a defined-risk short-put-spread below the ~7% implied floor is the "conviction holds" expression that doesn't need the market to pay for the beat.
- **The whisper-breaker (small)** — only if the Q3 guide prints ~$100B+ does the five-quarter muted streak break up; a capped OTM call spread, never averaged up.
- **Never** — hold unhedged shares through the print for the gap (killed: p=0.486, 3 of last 5 gapped down); naked long premium into a 7%-implied / 2.8%-realized tape.
- **Watch (dated)** — whisper **$94–95B** · Q3 guide **$100B+** · print **Aug 26 AC** (+ PCE same morning) · Jackson Hole **Aug 28**.

## Initial research

Done in full before this calendar existed:
[`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md) (2026-08-15) — Eric's three-leg conviction
tested (data-center beat SUPPORTED · capex expansion SUPPORTED · "chronically underestimated"
half-refuted as a trading thesis: down 6 of the last 8 next-days on beats), fresh red-teamed
sweep, the gap-hold kill, and the ranked conviction-conditional playbook (P0 guards → P1 bull put
spread → P2 whisper-breaker hook → P3 patient post-print entry → P4 explicit don'ts).

## Stance & kill switches

Per the research doc (date **confirmed**, IR-sourced): the beat is near-certain but the market
has stopped paying for consensus-relative beats — the bar is the ~$94–95B whisper plus a ~$100B+
Q3 guide. Defined-risk structures over long premium or unhedged gap-holds; no new pre-print share
entries (S1 window passed; dead zone from ~Aug 19); flat-by-D-1 for unhedged shares per S2.
**Kill switches:** a pre-print break below the P1 short strike kills that structure early; a
guide-down print is the loss scenario the sizing already caps. FT-7 (post-print dead week)
registered in [`forward-tests.md`](../forward-tests.md), scores ~Sep 4.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-15 | D-11 | Initial research banked (doc above). Adjacency: MRVL print est. Aug 27 + AVGO est. Sep 3 (both already on this calendar); CPI Sep 11 lands post-print; no VIX regime shift noted at assessment time. | — (stance set) | 2026-08-17 (critical, 8–20d band: every 2d) |
| 2026-08-17 | D-9 | Both instruments re-run clean, cache busted (history through 8/14): modern-era D-20 run-up control still SURVIVES (14/14, p=0.0042); reaction-day fade still ugly (2023–26 win 21%). Adjacency: MRVL print **Thu 8/27 AMC now confirmed** (Marvell IR); AVGO Q3 print **announced Wed 9/2 AMC** (Broadcom PR via PRNewswire, 8/3) — the calendar's 9/3 estimate is a day late; both proposed same-PR. No macro prints since the 8/15 row (weekend). VIX closed 14.56 Fri 8/15 — 2026 low — but SKEW +6.6% m/m and Brent +6.0%/wk (tanker attacks, failed ceasefire): calm index, rising tail-hedge demand. No new NVDA-specific export-control action since 8/15 (standing regime: H200-to-China licensed w/ 25% tariff, H20 halted). Event tape (date **confirmed**): options price a ~7.0% move (~$15.74 on $225.30) vs ~2.8% avg realized last 4 prints — long premium priced rich, which *supports* the existing defined-risk stance; ~$91B guide / ~$94–95B whisper bar unchanged. S1 dead zone opens 8/19 as stated. | — | 2026-08-19 (critical, 8–20d band: every 2d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
