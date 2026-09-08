# Forward tests — labor-day-market-closure-2026-09-07

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-labor-day-market-closure-2026-09-07-1 | **The Labor Day vol rebound, measured with its own control** — implied vol is marked down into the pre-holiday Friday close and snaps back on reopen ([ledger leg 7](../events/labor-day-market-closure-2026-09-07.md)). Registered **2026-09-06 at D-1**, so it scores in two days rather than in a future quarter. Base rates from SPY/^VIX daily bars 1993-01-29 → 2026-09-04, instrument cache busted first: **Labor Day 82% (27/33)**, median ΔVIX **+0.680**; any Monday holiday **75% (120/161)**, **+0.590**; ordinary weekend **61% (935/1,529)**, **+0.240**; and mean ΔVIX on the pre-holiday Friday itself **−0.233**. **The prior is stated at registration and it is high, so a pass is weak and only a fail carries information** — 27 of 33 prior instances would have passed. It is registered anyway because this is the [presidents-day sibling's](../events/presidents-day-market-closure-2027-02-15.md) headline claim getting its first live scored instance, and because this session's control changes what it means: conditioned on Friday VIX < 15 (today: **14.53**), an **ordinary** weekend already reopens higher **68% (353/521)** against **50% (1,492/2,956)** for any session — most of the effect is the weekend, and only ~14pp is the extra holiday day | **^VIX closes above 14.53** (its 2026-09-04 close) on Tuesday **2026-09-08** | VIX closing **at or below 14.53** on 2026-09-08 — the live instance fails and the stance's short-vol-carry caution drops back to a historical base rate with no 2026 observation behind it. **Confound named before the fact, and it runs WITH the prediction, not against it:** 09-08 also carries the 3Y note, ~$304B of displaced bill supply, and the first pricing of two calendar days of weekend news — so a pass cannot be attributed to the holiday gap alone and is scored as an observation, never as a mechanism. **Void** (not scored) if NYSE trades on 2026-09-07 | 2026-09-09 | _open_ |
| FT-labor-day-market-closure-2026-09-07-2 | **The compression null — stacking the September coupon block into four sessions does not strain its own demand** ([ledger leg 4](../events/labor-day-market-closure-2026-09-07.md)). The calendar entry was filed on the reading that ~$304B auctioning in one session with only Tuesday 09-08 standing between the weekend and the 10Y reopening is a stress structure. Measured this session from `api.fiscaldata.treasury.gov` `auctions_query` (fetched 2026-09-06), with each September auction's bid-to-cover taken as an **excess over its own trailing-12 same-tenor auctions** so era and size are controlled: across the **5** prior compressed Septembers (2009, 2010, 2015, 2020, 2021 — the years Labor Day fell on Sep 6 or 7) the excess runs **10Y +0.183 / 3Y −0.024 / 30Y +0.126** against **+0.031 / −0.003 / +0.036** for the 12 normal Septembers. Never worse in any tenor — and the 10Y gap is **entirely 2009 (+0.394) and 2010 (+0.369)**; excluding them leaves **+0.050 vs +0.031**, indistinguishable. **The honest reading is "no effect detected at n=5," not "compression helps,"** and the prediction below is therefore a null registered as a null | The **2026-09-09** 10-Year reopening (`91282CRF0`, $39B) prints **bid-to-cover at or above 2.35**, scored from a cache-busted re-fetch of `auctions_query`. Anchor: trailing-12 10Y mean **2.451**, sd **0.098**, min **2.30** (through 2026-08-12); 2.35 is ~1.0 sd below the mean and above only one of the last twelve | A print **below 2.35** → the first compressed instance to show the degradation the seeding thesis predicts; leg 4's "no effect detected" acquires a counter-instance and the stance is re-argued rather than patched. **Attribution is required, not assumed:** the same auction sits between PPI (09-10) and CPI (09-11) inside the FOMC blackout with 09-16 hike odds ~58–65%, so a weak print is scored with the concurrent `^TNX`/`^VIX` tape recorded alongside it and is credited to the compression only if it is separable. **Void** (not scored) if Treasury re-announces, resizes or postpones the 09-09 reopening. Scoring either way licenses nothing: `symbols: []`, no rates-keyed house playbook (grep 0/0), no position taken | 2026-09-10 | _open_ |

**Rules.** Score from re-run instrument data — `scripts/research/market-data.mjs` bars for `^VIX`
(cache busted first) and a fresh `auctions_query` fetch for the auction result — never from memory
of the tape. One observation is not a promotion. Editing a registered prediction after the fact is
falsification. The parent event is `estimate`; both tests are observations, never a licence to act.

**Scoring hazard — found 2026-09-08, recorded before either row is scored. No row above is edited.**
`^VIX` carries a **populated** daily bar for **2026-09-07**, a session on which the market was shut:
open 15.02, high 15.32, low 14.99, close **15.30**. That bar is a feed artifact, not a session.
Measured this session from a cache-busted pull: across the **33 Labor Days 1993–2025** `^VIX` has no
usable bar at all (the row is absent, or present with null OHLC, which `scripts/research/market-data.mjs`
filters out); and since 2000 exactly **two** dates carry a populated `^VIX` bar with no `^GSPC` bar —
**2026-05-25** (Memorial Day) and **2026-09-07** (Labor Day), both 2026 Monday closures, both
narrow-range against their neighbours (0.34 and 0.33 points). **2026-07-03**, observed Independence
Day, still returns the correct null row, so this is not "every holiday" — it is a new and partial
defect. `SPY`, `^GSPC` and `^TNX` all correctly end at **2026-09-04**.

**Why it matters here:** FT-…-1 scores the **2026-09-08** close against 14.53 and nothing else. A
scorer that takes the last `^VIX` bar would read **15.30**, which is above 14.53, and pass the test a
day early on a session that never happened. Select the bar whose date is exactly `2026-09-08`; if no
such bar exists, the test is unscorable that day, never inferred from a neighbour.

**The guard above is INSUFFICIENT — corrected 2026-09-08 07:44 ET, before either row is scored. No
row above is edited.** Pulled cache-busted at 07:44 ET, `^VIX` already carries a **2026-09-08** bar:
open 15.56, close **15.74**, with `meta.regularMarketTime` = **07:28 ET**. It is an **in-progress**
bar, not a close — the cash equity session had not opened. The date-equality rule written above
would therefore have scored FT-…-1 a **PASS today** (15.74 > 14.53), a full trading day early, on a
number that has not settled.

**The mechanism, which also replaces yesterday's "new and partial defect" reading.** Yahoo reports
`^VIX` on Cboe's clock: `exchangeTimezoneName` `America/Chicago`, and its `currentTradingPeriod.regular`
runs **03:00 → 16:15 ET** (global trading hours). `^GSPC` runs **09:30 → 16:00 ET**. So on any pull
after 03:00 ET, `^VIX` carries a same-day bar hours before an equity bar exists — one session-hours
asymmetry that explains the live 09-08 bar and the populated 09-07 holiday bar together, rather than
two unrelated feed faults.

**Replacement guard — cross-symbol, and verified before adoption.** Score the `^VIX` **2026-09-08**
bar only once **`^GSPC` also carries a `2026-09-08` bar**; until then the test is unscorable, never
inferred. This is safe in both directions: across the full history there are **0 dates (of 9,237)**
where `^GSPC` has a bar and `^VIX` does not, so the cross-check can never block a legitimately
scorable day — while it removes both hazards at once (the 09-07 phantom and any in-progress bar).
Dates carrying a populated `^VIX` bar with no `^GSPC` bar now number **three**: 2026-05-25,
2026-09-07, and 2026-09-08 (live, and expected to resolve on today's close).

**The cross-symbol guard is ALSO INSUFFICIENT — corrected 2026-09-08 10:15 ET, four hours after it was
written, before either row is scored. No row above is edited.** `^GSPC`'s regular session opens at
09:30 ET, so from 09:30 onward it carries a `2026-09-08` bar of its own — an **in-progress** one. The
cross-check therefore went TRUE at the opening bell, six hours before any close, and a pull at
10:08 ET would have scored FT-…-1 a **PASS** on `^VIX` = 15.69. Presence of a `^GSPC` bar proves the
equity session has *started*, never that it has *ended*; the previous note mistook one for the other.

**Measured, not argued.** Three cache-busted pulls inside ~5 minutes this session returned three
different values for the same "close":

| Pull (ET) | `^VIX` 2026-09-08 close | `^GSPC` 2026-09-08 close |
|---|---|---|
| ~10:06 | 15.69 | 7682.32 |
| ~10:09 | 15.65 | 7680.91 |
| 10:11 | **15.50** | **7677.93** |

`meta.currentTradingPeriod.regular` ends **16:15 ET** for `^VIX` and **16:00 ET** for `^GSPC`, and the
`^VIX` quote stamp lagged the wall clock by ~15 minutes (09:56 ET on a 10:11 ET pull) — so even the
symbols' own end-of-session markers do not agree with each other, and none had been reached.

**Why three guards in a row failed the same way — the honesty point.** Each guard picked a different
*field* (last bar; bar dated 09-08; bar dated 09-08 with an `^GSPC` sibling) and each would have
scored FT-…-1 **PASS** — the same direction the hypothesis predicts. A scoring bug that agrees with
your prediction produces no surprise to investigate, which is exactly why it survived two corrections.

**Replacement guard — a sampling-date rule, needing no feed metadata.** Score the `2026-09-08` `^VIX`
close only from a pull made on a **calendar date strictly after 2026-09-08** (ET). A bar dated before
the pull's own session date cannot still be accumulating, so this holds regardless of session hours,
feed clocks, holiday phantoms or quote lag — the three things that defeated the earlier guards. It
costs nothing here: FT-…-1's **Score by** is **2026-09-09**, so the first correctly-timed pull is also
an on-time one. The earlier guards are retained above rather than deleted, because the sequence is the
finding. **If a same-day pull is ever unavoidable, it is unscorable** — never inferred from a
neighbour, never taken from an in-progress bar.

**The sampling-date guard held, and the drift shows why it mattered — 2026-09-08 13:52 ET. No row above
is edited.** A fourth cache-busted pull returned `^VIX` 09-08 = **15.28**, a fifth distinct value for the
same "close":

| Pull (ET) | `^VIX` 2026-09-08 "close" | Distance above the 14.53 kill line |
|---|---|---|
| 07:44 | 15.74 | +1.21 |
| ~10:06 / ~10:09 / 10:11 | 15.69 / 15.65 / 15.50 | +1.16 / +1.12 / +0.97 |
| 13:52 | **15.28** | **+0.75** |

The drift is monotone **downward** and has closed **38%** of the gap to the threshold in six hours. This
upgrades the earlier note from "the reads were early" to "the reads were early **and travelling toward
the line that decides the test**" — the direction that could actually change the answer. The guard is
unchanged and was obeyed: this pull is dated 2026-09-08, so FT-…-1 remains **unscorable today**. Score
by **2026-09-09** is unaffected.

**FT-…-2 — the anchor cohort is ambiguous, and it is pre-committed HERE, before the print. No row above
is edited.** The 09-09 10Y reopening prints ~13:00 ET tomorrow. Two different trailing-12 anchors for it
are on the record and **both reproduce exactly** from a fresh `auctions_query` pull (HTTP 200) — the
difference is a cohort definition nobody had named:

| Trailing-12 cohort (through 2026-08-12) | Mean | sd | Min | Where 2.35 sits |
|---|---|---|---|---|
| **All 10Y auctions**, incl. the $21B off-cycle taps — *matches the registered anchor* | **2.451** | 0.103 | 2.30 | **−0.98 sd**, below 1 of 12 |
| **$39B+ on-cycle only**, excluding the taps — *matches the 07:44 ledger row's read* | 2.502 | 0.096 | **2.35** | −1.59 sd, equal to the cohort minimum |

The taps in the window are 2026-07-23 (2.30), 2026-01-22 (2.38), 2025-07-24 (2.41). Since the 09-09
auction is a **$39B on-cycle reopening**, the tighter cohort is the better comparison — which makes the
registered kill **harder to trigger** than registration stated, not easier.

**The pre-commitment, made while the outcome is still unknown:** FT-…-2 scores on the **literal
registered line — bid-to-cover ≥ 2.35 passes, below 2.35 fails.** The registered threshold is not moved,
narrowed or reinterpreted; the cohort question governs only *how extreme* a fail reads in the write-up
(−1.0 sd against all 10Y, −1.6 sd and a cohort-minimum against on-cycle peers). Fixing this after seeing
the print would be choosing the yardstick to fit the result, which is the same failure mode as the three
scoring guards above — each of which looked fine precisely because it agreed with the hypothesis.

**Neither test is scored by the 2026-09-08 3Y note, and the substitution was available and declined.**
The 3Y (`91282CRL7`, $58B) stopped at **2.72** inside the same $304B compressed session — **+0.064 over
its own trailing-12 mean of 2.656** (sd 0.083, z +0.77), above 10 of the last 12, with indirect at
**61.7% vs 64.6%** trailing-12 (**−2.8pp**, the one soft spot). That is real live evidence for [ledger
leg 4](../events/labor-day-market-closure-2026-09-07.md)'s compression null, and it is recorded there as
such — but FT-…-2 names the **10Y reopening**, and a forward test is scored on the instrument it
registered or not at all.

**The session settled, the guard held, and the drift alarm was itself wrong — 2026-09-08 16:53 ET,
post-close. FT-…-1 is STILL NOT SCORED. No row above is edited.** A sixth cache-busted pull returns
`^VIX` 2026-09-08 = **15.72**, and this one is settled rather than accumulating:

| Pull (ET) | `^VIX` 09-08 value | `meta.regularMarketTime` (`^VIX`) | Settled? |
|---|---|---|---|
| 07:44 | 15.74 | 07:28 ET | no — 8.8 h before `regular.end` |
| ~10:06 / ~10:09 / 10:11 | 15.69 / 15.65 / 15.50 | ~09:56 ET | no |
| 13:52 | 15.28 | (intraday) | no |
| **16:53** | **15.72** | **16:15:01 ET** = exactly `currentTradingPeriod.regular.end` | **yes** |

Two pulls 90 s apart returned identical values for `^VIX` (15.72) and `^GSPC` (7673.52); `^GSPC`'s own
stamp reads 16:20:01 ET against a 16:00 ET session end.

**The 13:52 note's reading is falsified, and the correction matters more than the confirmation.** That
note upgraded the hazard to "the reads were early **and travelling toward the line that decides the
test**," measuring a monotone 38% closure of the gap to 14.53. The settle shows the full path was
15.74 → 15.69 → 15.65 → 15.50 → 15.28 → **15.72** — a **round trip**, not a trend. The intraday
sequence was noise sampled four times, and reading a direction into it was the same class of error as
the three guards: a story built on a number that had not finished moving. What survives is the guard's
*rationale* (an unsettled bar is not a close); what dies is its *alarm* (the answer was never
travelling).

**Why the test is still not scored, when the number is now settled.** The registered guard is a
**sampling-date** rule: score the 09-08 close only from a pull dated strictly after 2026-09-08 (ET).
This pull is dated 2026-09-08, so the test is unscorable today — and 15.72 is above 14.53, which is
precisely why the rule is obeyed rather than reinterpreted. Three guards have already failed here, and
every one of them failed in the direction that **agreed with the hypothesis**; a fourth reinterpretation
made at 16:53 ET, on the same day, while the reading passes, would be indistinguishable from that
pattern from the outside. It costs nothing: **Score by** is **2026-09-09**, so the first correctly-timed
pull is still an on-time one.

**A candidate replacement guard, evidenced today but NOT adopted for FT-…-1.** Two checks composed:
(a) the symbol's `meta.regularMarketTime` is at or past its own `currentTradingPeriod.regular.end`, and
(b) `^GSPC` carries a bar for the same date. Today's six pulls separate cleanly on (a) — every
in-progress read fails it, the 16:53 read is the first to pass. (a) alone would **not** have caught the
2026-09-07 holiday phantom, which is a completed bar on a closed equity session and would carry its own
end-of-session stamp — that hazard is (b)'s job, and (b) alone went TRUE at the 09:30 opening bell.
Together they cover both. **This is reasoned for the phantom half and measured for the in-progress
half** — the 09-07 stamp was never captured before the fact, so that leg is an inference, labelled as
one. It is banked for a future event, not used here: FT-…-1 scores tomorrow under the guard it
registered, which doubles as the composed criterion's first out-of-sample check.

**FT-…-2 is live, not void — re-verified from the primary.** A cache-busted `auctions_query` (HTTP 200)
at 16:53 ET shows the 09-09 10Y reopening `91282CRF0` still **$39B**, announce-dated 2026-09-03, with
`bid_to_cover_ratio` `null` — it prints ~13:00 ET on 2026-09-09. No re-announcement, resize or
postponement, so the void clause has not fired and the 2.35 line stands exactly as pre-committed.
