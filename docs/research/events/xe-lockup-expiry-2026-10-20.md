# XE IPO lockup ended early — X-Energy, 2026-09-01 — xe-lockup-expiry-2026-10-20

**Kind:** lockup-expiry · **Date:** 2026-09-01 (confirmed, SEC: 8-K Item 7.01 filed 2026-06-04 + 10-Q filed 2026-08-13; the calendar's discovered date was 2026-10-20) · **Impact:** medium
**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"XE":10.755},"vix":17.72,"daysBand":"medium:0+","adjacentIds":["adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","fomc-blackout-start-2026-09-05","hammack-remarks-2026-09-03","ism-manufacturing-2026-09-01","ism-services-2026-09-03","jackson-hole-2026-08-28","jobs-2026-09-04","jolts-2026-09-01","opec-plus-meeting-2026-09-06","sp-rebalance-proforma-2026-09-04","treasury-7y-note-2026-08-27","treasury-coupon-announcement-2026-09-03","vmware-explore-2026-08-31","waller-economic-outlook-2026-09-03"],"adjacentStrongIds":["ism-manufacturing-2026-09-01","ism-services-2026-09-03","jackson-hole-2026-08-28","jobs-2026-09-04"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** The unlock this entry was filed for **already happened**: the calendar read "180 days after
the prospectus = 2026-10-20" (confirmed), but X-Energy told investors in an 8-K on 2026-06-04 that its
lock-up ends **2026-09-01** — the prospectus shortens it to ten trading days before a blackout when the
180th day falls inside one, and it did. So there is no unlock today, and nothing to position around:
the supply (up to ~341M shares against ~51M that were free to trade) was released seven weeks ago.
XE is $10.76, **-53% from its $23.00 IPO price** and -42% since the unlock day, a drop that tracks the
nuclear-energy group (OKLO -31%, SMR -39% over the same span) more than it stands apart. Stand aside;
the next dated catalyst is the Q3 print, an **estimate** of 2026-11-12.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Stand aside | High | No unlock event exists on 2026-10-20; the real one passed 2026-09-01 | An SEC filing showing a further staged release dated on or after 2026-10-20 |
| This week | Stand aside | Medium | No catalyst; 5-day move was -15% into a sector drawdown, on rising volume, not a setup | A close above $13.71 (the 2026-10-09 close) by 2026-10-30 — capitulation over |
| This month | Stand aside | Medium | Options price ~82% IV flat across expiries with no event kink, and the supply is already out, so no pullback edge to sell | A Form 4/144 wave from 10% holders filed before the 2026-11-12 print |
| This quarter | Stand aside | Low | Q3 print (estimate, 2026-11-12) and sector tape dominate; no house playbook has an XE edge | A closed forward test (FT-xe-lockup-expiry-2026-10-20-1) scoring XE ahead of peers into the print |

**Call:** wait until 2026-11-12

**Signals & conditions** — the buy/sell/hold triggers:

- **Buy signal:** no — the lockup study's pullback is behind the stock; a -53% name in a sector slump is a falling knife, not a licensed entry.
- **Date label:** the unlock is `confirmed` (company 8-K); the Q3 print date 2026-11-12 is `estimate` (NEWS: earningswhispers.com), so nothing is date-keyed until the company confirms it.
- **Watch:** Form 4/Form 144 filings from 10% holders — none appeared after 2026-06-16 as of the 2026-10-20 EDGAR fetch.
- **Re-open if:** the 8-K's 2026-09-01 date is contradicted by a later filing (a stub of locked shares, a second tranche).

## Initial research

### The question, plainly

Does the 2026-10-20 IPO-lockup expiry for X-Energy (XE) create a tradeable supply pullback, and how
should it be positioned? The entry was filed by `scripts/research/lockup-discovery.mjs` from the
424B4's "180 days after the date of this prospectus" wording.

### One-line verdict

There is no 2026-10-20 event: the lock-up ended 2026-09-01 under the prospectus's blackout clause,
confirmed by the issuer — so the real question is what the unlock *did*, and the answer is "a
sector-sized slide, not a clean lockup pullback".

### Method

Read the 424B4 (SEC, fetched 2026-10-20), then searched the issuer's own filings for any amendment,
and found one (8-K 2026-06-04, Item 7.01 "Expected Early Lock-Up Release Date"; 10-Q 2026-08-13).
Prices and volume from Yahoo daily bars (fetched 2026-10-20, XE's last bar is intraday); implied vol
from Cboe's delayed chain (as of 2026-10-20 11:27 ET). `earnings-cycle.mjs` is not applicable — XE has
only two prints, both after the IPO.

### Leg 1 — the date: REFUTED as filed, SUPPORTED as corrected

- **The 424B4's clause** (Risk Factors, "Shares eligible for future sale"): "if (1) at least 120 days
  have elapsed since the date of this prospectus and (2) such lock-up period is scheduled to end
  during or within five trading days prior to a broadly applicable period during which trading in our
  securities would not be permitted … such lock-up period will end ten trading days prior to the
  commencement of such blackout period." It also lets J.P. Morgan release holders early, with pro rata
  rights for others.
- **The issuer applied it:** 8-K filed 2026-06-04 — "The Restricted Period is scheduled to end on
  October 20, 2026, which falls within the Company's quarterly blackout period. Therefore … the
  Restricted Period will end on September 1, 2026." The 10-Q of 2026-08-13 repeats "until September 1,
  2026".
- **Why discovery missed it:** `lockup-math.mjs` flags an early release only on `earnings|closing
  price|early release|released early|earlier of|staggered|tranche`. This clause says none of those,
  and the sentence is not even a lock-up *period* sentence, so the entry came out `confirmed` with the
  wrong date. Filed as bug #5920.

### Leg 2 — supply: SUPPORTED as large, and spent

- **Float at the IPO:** 44,254,659 Class A shares sold, plus a 6,638,198-share option (exercise not
  verified) — about 51M. **Outstanding after the offering:** 273.4M Class A + 118.9M Class B
  (exchangeable into Class A with XERC units) = ~392M. Roughly **13% was free to trade; up to ~341M
  (~87%) was locked**, about 6.7x the float.
- **In days of volume:** against a 60-day average of ~6.4M shares/day, the whole locked block is ~53
  days of volume if it all came to market — an upper bound, since most holders are long-term and
  exchange mechanics are staged.
- **What came out:** unlock-day volume was 9.8M shares (2.0x the prior 20-day average), the price
  flat on the day (-0.2%, QQQ -1.3%, OKLO -5.0%, SMR -0.6%). No Form 4 or Form 144 has been filed since
  2026-06-16 (EDGAR submissions list, fetched 2026-10-20), so reported insider selling is nil; 13G
  filings (passive holders) continued through 2026-09-04.

### Leg 3 — price: MIXED against the literature

- The literature's pullback is larger after a big run-up; XE ran the other way. IPO $23.00 → day-one
  close $29.20 (high $37.10 on 2026-04-28) → $18.41 at the unlock → **$10.76 now (-53% vs IPO)**.
- Across the unlock window: 2026-08-31 → 2026-09-15 XE **-18.5%** against QQQ -1.7%, OKLO -11.3%, SMR
  -9.1% — worse than the peers by ~7-9 points, i.e. a small supply effect on top of the group move.
  2026-08-31 → 2026-10-20: XE **-41.7%**, OKLO -31.1%, SMR -38.8%, QQQ +0.6% — in line with the group.
- Last 5 sessions: -15.4%, on volume climbing to 9.1M (1.4x the 60-day average) — a sector
  leg down, not a dated-event reaction.

### Leg 4 — options: SUPPORTED that nothing is priced

- XE's 30-day implied vol is **82.5%** (Cboe) against 90% realized over 60 days and 65% over 20.
  ATM IV sits at 79-88% on every expiry with no kink around any date; the spot-relative straddle to
  2026-11-13 is 17.0% and to 2026-12-18 is 26.5%. Put and call IVs at equal delta sit within a few
  points, wide spreads (bid 0.10 / ask 0.40 at $9.00-10.50 puts) make the skew unreadable, and open interest is
  thin (largest is 37K on 2027-01-15).
- The implication: no event premium to sell, no cheap protection to buy; any XE option is a
  directional-volatility bet on the sector, not a lockup play.

### What plays the conditions support

None. The lockup playbook (#5912) has nothing to trade here: the date passed, the price move is sector-led, options
carry no event premium. The price was not extreme *relative to the group*, so no relative-value pair either.

### Honest limits

- XE's 2026-09-01 date is the issuer's own; I did not find an SEC filing contradicting it.
- Whether the greenshoe was exercised, the exact Class B exchange schedule, and what holders did
  after 2026-09-01 are not visible (Form 144 filings are absent, but not every holder is a filer).
- Yahoo's last bar for 2026-10-20 and Cboe's chain are intraday.
- The sector comparison is two names (OKLO, SMR); it is a read, not a factor model.

## Stance & kill switches

**Stance (confirmed date: 2026-09-01; no position, none licensed).** Stand aside. The unlock passed,
the stock has fallen with its group, and an XE-specific edge would need either a fresh dated catalyst
or a pre-registered test that holds. The only forward-looking item is the Q3 print, an `estimate`
(2026-11-12, NEWS: earningswhispers.com) — it widens caution, it licenses nothing.

**Kill switches.**

- **The "date passed" read** dies if a later XE filing states a further release or a staged tranche
  dated on or after 2026-10-20.
- **The "stand aside" call** dies on a close above $13.71 by 2026-10-30 (the level before the last
  leg down) or a Form 4/144 wave before the 2026-11-12 print.
- **The "XE is the only mis-dated entry" read** dies if a later lockup 424B4 carries the same
  blackout clause (all 10 others checked 2026-10-20: none does).

Registered: `FT-xe-lockup-expiry-2026-10-20-1`
([`../forward-tests/xe-lockup-expiry-2026-10-20.md`](../forward-tests/xe-lockup-expiry-2026-10-20.md)).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-10-20 | D+49 (real date 2026-09-01); D0 (as filed) | Initial research. Lock-up ended 2026-09-01 per issuer 8-K; calendar date corrected in `xe-lockup-expiry-2026-10-20.json`. XE $10.76 (-53% vs IPO), VIX 17.72 (up from 14.84 on 2026-10-09). Peers OKLO/SMR -31%/-39% since the unlock. Adjacency: Q3 print 2026-11-12 (estimate, 22 days out, inside the horizon but **not proposed** — a symbol earnings print the calendar derives itself). Process: checked the other 10 lockup 424B4s on the calendar for the blackout clause — none carries it (INIO/CSQR's "blackout" mentions are unrelated), so XE is the only mis-dated entry today. | — (initial) | none — event passed; the forward test scores 2026-11-13 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse. The adjacency
sweep runs in every row; a dated adjacent event inside the horizon gets a proposal file.

## Outcome

**Assessed 2026-10-20** (the event passed 2026-09-01; this initial research is also its close-out,
scored from Yahoo daily bars fetched 2026-10-20, not from memory).

- **Unlock day:** 2026-09-01 close $18.41 (-0.2%), volume 9.78M (about 2.0x the 20-day average).
- **Window:** XE -18.5% to 2026-09-15 vs QQQ -1.7%, OKLO -11.3%, SMR -9.1%; -41.7% to 2026-10-20 vs
  OKLO -31.1%, SMR -38.8%, QQQ +0.6%.
- **Read:** a modest XE-specific supply effect (~7-9 pts over the first two weeks) on top of a
  sector slide; no tradeable pullback was ever on the table for a calendar built on 2026-10-20.

**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"XE":10.755},"vix":17.72,"daysBand":"medium:0+","adjacentIds":["adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","fomc-blackout-start-2026-09-05","hammack-remarks-2026-09-03","ism-manufacturing-2026-09-01","ism-services-2026-09-03","jackson-hole-2026-08-28","jobs-2026-09-04","jolts-2026-09-01","opec-plus-meeting-2026-09-06","sp-rebalance-proforma-2026-09-04","treasury-7y-note-2026-08-27","treasury-coupon-announcement-2026-09-03","vmware-explore-2026-08-31","waller-economic-outlook-2026-09-03"],"adjacentStrongIds":["ism-manufacturing-2026-09-01","ism-services-2026-09-03","jackson-hole-2026-08-28","jobs-2026-09-04"],"screenStreak":0,"blocked":[]} -->
