# Forward tests — labor-day-market-closure-2026-09-07

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-labor-day-market-closure-2026-09-07-1 | **The Labor Day vol rebound, measured with its own control** — implied vol is marked down into the pre-holiday Friday close and snaps back on reopen ([ledger leg 7](../events/labor-day-market-closure-2026-09-07.md)). Registered **2026-09-06 at D-1**, so it scores in two days rather than in a future quarter. Base rates from SPY/^VIX daily bars 1993-01-29 → 2026-09-04, instrument cache busted first: **Labor Day 82% (27/33)**, median ΔVIX **+0.680**; any Monday holiday **75% (120/161)**, **+0.590**; ordinary weekend **61% (935/1,529)**, **+0.240**; and mean ΔVIX on the pre-holiday Friday itself **−0.233**. **The prior is stated at registration and it is high, so a pass is weak and only a fail carries information** — 27 of 33 prior instances would have passed. It is registered anyway because this is the [presidents-day sibling's](../events/presidents-day-market-closure-2027-02-15.md) headline claim getting its first live scored instance, and because this session's control changes what it means: conditioned on Friday VIX < 15 (today: **14.53**), an **ordinary** weekend already reopens higher **68% (353/521)** against **50% (1,492/2,956)** for any session — most of the effect is the weekend, and only ~14pp is the extra holiday day | **^VIX closes above 14.53** (its 2026-09-04 close) on Tuesday **2026-09-08** | VIX closing **at or below 14.53** on 2026-09-08 — the live instance fails and the stance's short-vol-carry caution drops back to a historical base rate with no 2026 observation behind it. **Confound named before the fact, and it runs WITH the prediction, not against it:** 09-08 also carries the 3Y note, ~$304B of displaced bill supply, and the first pricing of two calendar days of weekend news — so a pass cannot be attributed to the holiday gap alone and is scored as an observation, never as a mechanism. **Void** (not scored) if NYSE trades on 2026-09-07 | 2026-09-09 | **PASS** — scored **2026-09-09 01:06 ET**, on time, from a cache-busted pull dated strictly after 2026-09-08 ET as the registered sampling-date guard requires (the first correctly-timed pull; five earlier sessions refused). `^VIX` **2026-09-08 close = 15.72** against the **14.53** line, **+1.19**. **Scored as an observation and never as a mechanism, exactly as registered** — the prior was 27/33 (82%), so this pass carries almost no information, and the session ran three named confounds (the $304B slate, Brent's Houthi-driven run from 96.28 to a 97.92 settle, and Canada's counter-tariffs effective that day). ΔVIX ranks **21st of 34 (62nd pctile)** — an ordinary rebound, not an outsized one. **And the hypothesis's OTHER half failed:** vol was marked **UP** into the pre-holiday Friday (ΔVIX **+0.21** on 2026-09-04, against the registered cohort mean of **−0.233**), putting 2026 in the weaker of the two branches measured below |
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

**Held a fourth time on a TIMEZONE — recorded 2026-09-09 00:01 UTC = 2026-09-08 20:01 ET. No row
above is edited.** The registered sampling-date guard scores the 09-08 `^VIX` close only from a pull
made on a calendar date **strictly after 2026-09-08 (ET)**. This session's wall clock is already
2026-09-09 in UTC — the date the dispatching workflow and `event-scan.mjs` both use — but **20:01 ET
on 2026-09-08** in the timezone the guard names. The guard therefore still bites, and it is held.

**Why it is held rather than reasoned around.** The 09-08 `^VIX` bar is, by every available marker,
settled: close **15.72**, `meta.regularMarketTime` **16:15:01 ET** = exactly its
`currentTradingPeriod.regular.end`, unchanged from the 16:53 ET reading four hours earlier. That is
precisely the argument the sampling-date guard was written to refuse. Three earlier guards each
picked a different *field*, each looked settled, and each would have scored this test **PASS** — the
direction the hypothesis predicts. A fourth override, justified by feed metadata, would reinstate the
exact failure mode the third correction removed, and it would again err toward agreeing with the
prediction. The cost of holding is one dispatch.

**A latent defect this exposes, named for the close-out and deliberately not patched here.** The
guard is timezone-qualified; the **Score by** column is not, anywhere in this system. FT-…-1's
score-by is **2026-09-09**, which under ET is met on time by the next dispatch and under UTC is
missed by one day. Nothing above is edited to resolve it — a registered test is not re-specified
after the fact — but the ambiguity is now on the record, and the concrete consequence is favourable:
a dispatch at **≈2026-09-09 20:00 ET** both clears the guard and postdates the 10Y auction print
(13:00 ET), so it can score **FT-…-1 and FT-…-2 together**.

**A fourth hazard class, and the first that runs in the SAFE direction: a bar can UN-populate.**
Every hazard logged above made a test look scorable **too early**. This one does the reverse. On a
cache-busted pull at 20:01 ET, `SPY`'s **2026-09-08** bar carries `open` **769.07** and `volume`
**43,496,831** but `close` and `adjclose` **`null`** — four hours after its own `regularMarketTime`
of **16:00:00 ET**, which equals its `currentTradingPeriod.regular.end` exactly. Because
`scripts/research/market-data.mjs` filters out any bar with a null close, `SPY` now **ends at
2026-09-04** in the adjusted series, and the settled **765.96** recorded in the 16:53 ET ledger row
is no longer reproducible from re-run data.

**Measured, and it is unprecedented.** Across the full adjusted history there is exactly **1 date of
8,458 since 1993-01-29** on which `^GSPC` carries a bar and `SPY` does not: **2026-09-08** itself. By
contrast the `^VIX` orphan list *shrank* as predicted — `^VIX`-with-no-`^GSPC` since 2000 is back to
**two** dates (2026-05-25, 2026-09-07), the live 09-08 entry having resolved on the close — and
`^GSPC`-with-no-`^VIX` remains **0 of 9,238**, so the cross-symbol guard's evidence base reproduces.

**Why it does not touch either test.** FT-…-1 keys on `^VIX` alone, which is populated and settled;
FT-…-2 keys on `auctions_query`, not on bars. The defect's only casualty is the equity-reopen ranking
in the 16:53 ET ledger row, which is corrected in the ledger's At-a-glance (with `^GSPC` substituted
and the SPY figures recomputed in SPY's own cohort), never in a registered row here. The general
lesson is worth more than the instance: a filtered bar series makes a **present-but-incomplete** bar
invisible, so "the symbol has no bar for date D" and "date D has not happened yet" are not the same
statement, and only the sampling-date rule distinguishes them without consulting the feed.

**Context for scoring FT-…-1, measured this session and pre-committed before it is scored.** Across
the 33 historical Labor Day reopens the vol rebound is close to **independent** of the session's
realized move: corr(ΔVIX, |Δ10Y|) = **+0.298** Pearson / **+0.196** Spearman, and
corr(ΔVIX, |Δ^GSPC|) = **−0.111** / **0.000**. 2026's live pairing — bottom-decile |Δ10Y| (2.20bp,
5th of 34) with above-median ΔVIX (+1.19, 21st of 34) — has **4 of 33** precedents (1996, 2000, 2011,
2020). So the combination is uncommon but not aberrant, and a pass tomorrow **cannot** be read as the
holiday gap forcing a rates repricing. The registered "scored as an observation, never as a
mechanism" clause governs, and the confound it named has strengthened rather than faded: Brent
**$98.61 (+1.67%)**, touching **$99** and **+8% month-to-date**, on Houthi drone and missile strikes
against Saudi Aramco assets and the 400kb/d Jazan refinery (CNBC/NBC, 2026-09-08).

**FT-…-2 re-verified live at 20:01 ET, and its anchor reproduces both ways.** A cache-busted
`auctions_query` (HTTP 200) still shows `91282CRF0` at **$39B**, announce-dated 2026-09-03, BTC
`null` — no re-announcement, resize or postponement, so the void clause has not fired. Trailing-12
10Y bid-to-cover recomputes to **2.451 / sd 0.103 / min 2.30** including the two $21B off-cycle taps
(2.35 = −0.98 sd, matching registration) and **2.502 / sd 0.096** excluding them (−1.59 sd). Noted
because it sharpens tomorrow's reading rather than changing it: **2.35 is the on-cycle cohort's
literal minimum**, so a print of exactly 2.35 **passes** the registered line while simultaneously
tying the tighter cohort's floor. Scoring follows the registered line as pre-committed on 2026-09-08.

**Held a FIFTH time, and the refusal was pre-committed 12 minutes before the guard would have cleared
— 2026-09-09 03:48 UTC = 2026-09-08 23:48 ET. No row above is edited.** The registered guard scores
the 09-08 `^VIX` close only from a pull made on a calendar date **strictly after 2026-09-08 (ET)**.
This session ran 12 minutes short of that boundary, holding a reading that **passes**: `^VIX` 09-08 =
**15.72**, now identical across three cache-busted pulls (16:53, 20:01, 23:48 ET), with
`meta.regularMarketTime` **16:15:01 ET** = exactly its `currentTradingPeriod.regular.end`.

**The option was to wait out the clock inside the session, and it is declined on the record, while
the outcome is still unscored.** A pull deliberately timed to cross a date boundary by minutes — made
while already holding a number that agrees with the hypothesis — satisfies the guard's letter and
defeats its purpose. Three guards have failed on this test, and **every one failed in the direction
that agreed with the prediction**, which is exactly why none of them looked wrong at the time. A
fourth move with that same signature would be indistinguishable from the first three, whatever its
justification.

**It also buys nothing, which is what makes the refusal cheap rather than principled-at-a-cost.**
FT-…-2 keys on the 09-09 10Y reopening, which prints ~13:00 ET on 2026-09-09 — roughly thirteen hours
after this session. The parent ledger's `## Outcome` cannot be written until both tests are scored, so
scoring FT-…-1 alone tonight would not advance the close-out by one dispatch; it would only split the
two scores and abandon the plan the 20:01 ET note put on the record ("a dispatch at ≈2026-09-09 20:00
ET both clears the guard AND postdates the 10Y print, so it can score **both**"). **Score by** is
2026-09-09, so the first correctly-timed pull remains an on-time one.

**The un-populating hazard has RESOLVED, and the correction is to my own predecessor note.** The
20:01 ET entry recorded `SPY`'s 2026-09-08 bar carrying `open` and `volume` but `close`/`adjclose`
**null**, measured as **1 date of 8,458** since 1993 on which `^GSPC` had a bar and `SPY` did not. At
23:48 ET that bar is populated — close and adjclose **765.96**, series length **8,459** — and
`^GSPC`-with-no-`SPY` is back to **0 of 8,459**. So it was a **fill lag of roughly four hours, not a
hole**, and the 16:53 ET ledger row's settled SPY figure is reproducible after all. **What survives is
the sharper half of the lesson:** a filtered bar series hides a present-but-incomplete bar in *both*
directions, and its state is not stable within a single day — so "the symbol has no bar for date D" is
a statement about **the pull**, never about D. Only the sampling-date rule distinguishes them without
consulting the feed, which is the second time that rule has been the one to survive.

**FT-…-2 re-verified live at 23:48 ET.** A cache-busted `auctions_query` (HTTP 200) still shows
`91282CRF0` at **$39B**, announce-dated 2026-09-03, `bid_to_cover_ratio` **`null`** — no
re-announcement, resize or postponement, so the void clause has not fired and the **2.35** line stands
exactly as pre-committed on 2026-09-08. The 09-08 session settled at exactly **$304B** as filed and
there is still **no 2026-09-07 auction row**.

**A third confound for FT-…-1, named before it is scored.** Registration named the $304B slate, the 3Y
note and two days of unpriced weekend news. Two more have since attached: the Houthi strikes on Saudi
facilities (Brent settled **97.92** on 09-08 by our own `BZ=F` bar — correcting the **98.61**
aggregator figure the 20:01 note took on trust — and reading **99.36** overnight into 09-09, an
in-progress bar and therefore not a reading), and **Canada's counter-tariffs on ~C$27.6B of US goods,
which took effect on 2026-09-08 itself** (`canada-counter-tariffs-effective-2026-09-08`, `estimate`,
proposed by the `jobs-2026-10-02` lane). Third-party session context matches our bars: Dow
**−1.18%**, S&P **−0.58% to 7,673.52**, Nasdaq **−0.32%** — a risk-off session driven by oil. The
registered "scored as an observation, never as a mechanism" clause is now carrying three named
alternative explanations, not one.

**FT-…-1 SCORED — 2026-09-09 01:06 ET. The guard cleared on the clock, not on an argument, and the
Outcome cell above is filled for the first time. No row above is edited.** The registered rule scores
the 09-08 `^VIX` close only from a pull made on a calendar date **strictly after 2026-09-08 (ET)**.
This pull is dated **2026-09-09 ET** — the first that qualifies. It returns `^VIX` 09-08 = **15.72**,
identical to the 16:53, 20:01 and 23:48 ET readings, with `meta.regularMarketTime` **16:15:01 ET** =
its `currentTradingPeriod.regular.end`. **15.72 > 14.53 → PASS.** Five consecutive sessions refused to
score this on numbers that were already passing; the sixth scored it on the same number, one guard
later. Nothing about the reading changed — only its provenance did, which was the whole point.

**The Cboe session-hours mechanism gets its cleanest out-of-sample confirmation here, in the one
window nobody had sampled.** Every prior pull was made *after* 03:00 ET, so the claim "`^VIX` carries
a same-day bar from 03:00 ET onward because Cboe global trading hours run 03:00–16:15 ET" had never
been checked from the other side. This pull is at **01:06 ET, before that open**, and `^VIX`'s last
bar is **2026-09-08** — no 09-09 bar exists. The mechanism predicted exactly that, and the phantom
list is unchanged: `^VIX`-with-no-`^GSPC` since 2000 is still **2** dates (2026-05-25, 2026-09-07, the
latter still carrying its bogus 15.30 close). `SPY`'s 09-08 bar remains populated at **765.96**
(n=8,459), so the un-populating episode stays resolved.

**The load-bearing finding, and it qualifies the pass rather than celebrating it: leg 7's mechanism
is a CONJUNCTION, and nobody had ever measured it as one.** The hypothesis text above says implied
vol "is marked down into the pre-holiday Friday close **and** snaps back on reopen." Every number
this ledger has quoted measures one half or the other in isolation — the 82% rebound rate, the
−0.233 mean Friday markdown — never both in the same year. Measured this session from cache-busted
`^VIX` bars, using `^GSPC` as the trading calendar so the 09-07 phantom cannot contaminate it
(n=33, 1993–2025):

| Leg of the mechanism | Base rate | Registered as |
|---|---|---|
| Rebound alone (ΔVIX > 0 on the Tuesday) | **27/33 (82%)**, median **+0.680** | quoted |
| Markdown alone (ΔVIX < 0 on the pre-holiday Friday) | **19/33 (58%)**, mean **−0.233** | quoted as a mean only |
| **Both, in the same year** | **18/33 (55%)** | **never measured** |

So the full claim the hypothesis makes holds **55% of the time**, not 82%. The 82% figure describes
the rebound half alone, and reading it as the mechanism's rate overstates it by 27 points.

**The conditional split is the more interesting half, and it runs in the mechanism's favour:**

| Pre-holiday Friday | n | Rebounded on reopen | Median ΔVIX |
|---|---|---|---|
| Vol marked **down** (ΔVIX < 0) | 19 | **18 (95%)** | +0.710 |
| Vol marked **up or flat** | 14 | **9 (64%)** | +0.535 |

Fisher exact two-tailed **p = 0.062** — suggestive at n=33, not significant, and stated as such. It is
internally coherent with the story the ledger tells (decay that was actually marked out is the decay
that gets paid back), and it splits the headline 82% into a 95% branch and a 64% branch.

**Which makes 2026's pass weaker than the raw number looks.** `^VIX` went 14.32 → **14.53** on Friday
2026-09-04: **+0.21**, the 24th of 34 pre-holiday Fridays, i.e. **no markdown at all**. 2026 therefore
sat in the **64% branch**, not the 95% one, and rebounded anyway — into a session already carrying an
oil shock, a $304B auction slate and a tariff step. The registered caution ("do not carry short vol
across the reopen") survives and is arguably better founded than before, because the conditional now
gives it a mechanism rather than a bare frequency. What does **not** survive is any reading of this
pass as the holiday gap doing the work: 2026 is a year where the gap was *not* pre-marked.

**FT-…-2 re-verified live at 01:06 ET and is the only test left open.** A cache-busted
`auctions_query` (HTTP 200) shows `91282CRF0` still **$39B**, announce-dated 2026-09-03,
`bid_to_cover_ratio` **`null`** — no re-announcement, resize or postponement, so the void clause has
not fired and the **2.35** line stands exactly as pre-committed on 2026-09-08. It prints ~13:00 ET
**today**. **Scoring FT-…-1 now was declined at 23:48 ET on the reasoning that it "buys nothing" —
that reasoning no longer holds and is corrected here.** With `closeOutWithinDays: 6` ageing this event
out after **2026-09-13**, banking one score halves what a missed dispatch would orphan, from two tests
to one. The 23:48 refusal was still right on its own terms (it declined to *engineer* a boundary
crossing); what changed is that the boundary passed on its own.
