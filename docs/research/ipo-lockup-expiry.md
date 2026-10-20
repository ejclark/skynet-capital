# IPO lockup expiries, 2019–2026: the pullback was real once, and it is gone

**Kind:** event study (price, volume, EDGAR prospectuses) · **Date:** 2026-10-20 · **Symbols:** 355 US IPOs raising $100M+, unlocks 2019-08 → 2026-09 · **Impact:** medium
**Last assessed:** 2026-10-20

**Question (Eric, 2026-10-20, on [#5912](https://github.com/ejclark/skynet-capital/issues/5912)):**
_"Private shares are typically locked for around 3-6 months after IPO… the stock is likely to
experience pullback from the additional shares on the market… The pullback timing is likely close
in proximity to the lockout date expiration."_ This is slice 2, the study: how listings moved
against their sector around the day insiders' shares unlocked, and whether either trade the plan
names pays: puts into the date, or buying after the flush.

Reproduce: `node scripts/research/lockup-study.mjs` (about 15 minutes cold, seconds cached). Per-event rows:
[`ipo-lockup-expiry-events.json`](ipo-lockup-expiry-events.json). Paper only; educational.

```mermaid
xychart-beta
  title "Abnormal return vs sector ETF around the unlock (day 0 = first day insiders may sell)"
  x-axis "Trading days from the unlock" -10 --> 10
  y-axis "Cumulative abnormal return (%)" -5 --> 2
  line "Unlocks 2019–2021 (n=186)" [-0.89, -1.52, -1.79, -2.27, -2.20, -3.30, -2.90, -3.19, -3.34, -3.91 "2019–21: −3.9% by day −1", -3.51, -4.10, -4.28, -4.29, -4.37, -4.30, -4.18, -4.02, -4.20, -3.83, -3.45]
  line "Unlocks 2022–2026 (n=169)" [0.37, -0.19, -0.02, -0.50, -0.07, 0.05, 1.44, 1.12, -0.25, -0.41 "since 2022: −0.4%", -0.18, 0.17, 0.62, 0.73, 1.50, 1.16, 0.81, 0.13, 0.71, 0.67, 0.64]
```
_Mean cumulative abnormal return, days −10…+10, split by the year the lockup ended, from
`scripts/research/lockup-study.mjs`. The fall came before day 0, and only in 2019–2021._

## The call

| Trade shape | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| **Stand aside** (the headline) | **No position into or out of an unlock.** The playbook stays watch-only and logs every expiry | medium | The textbook 3-day drop does not replicate (−0.20%, t −0.4). The run-in fall (−2.3%) is a 2019–21 effect (−3.9%) that has been flat since 2022 (−0.4%) | **≥ 8 of the 11 live expiries** (XE 2026-10-20 … CSQR 2027-01-11) end D−10…D+10 below their sector ETF, mean ≤ −5%, scored by **2027-01-27** |
| Puts into the date (ATM/−10% debit spread, D−10 → D+3) | **Don't** | medium | Priced at 1.25× trailing realized vol: mean −1.4%, median −31% of the debit, 55% lose; confirmed dates −6.5%. The one cut that paid (2019–21 big unlocks, +33%) lost 5% since 2022 | The **2027-07-01** re-run: 2022+ confirmed-date spreads at 1.25× RV average ≥ +15% with t ≥ 2 |
| Run-in variant (same spread, exit D−1) | **Don't** | low | Post-hoc, shaped after seeing where the drift sits; still +0.4% on confirmed dates at 1.25× RV, median −31% | The **2027-07-01** re-run: 2022+ CAR[−10,−1] ≤ −3% with t ≤ −2 |
| Buy after the flush (enter close D+3) | **Don't** — the `anthropic-ipo.md` survivor loses its premise | medium | After a double-digit fall into D+3 (n=106) the next four weeks ran −1.5% vs sector (t −0.8): no rebound to buy | The **2027-07-01** re-run: flushed names' CAR[+4,+23] ≥ +4% with t ≥ 2 |
| Sell rich IV (call credit spread) | **Don't** — untestable here | low | No free implied-vol history to see if the date is overpriced | Put IV ≥ 1.5× realized on ≥ 6 of the 11 live expiries by **2027-01-11** |

**TL;DR.** Stand aside. Unlocks did drag stocks down about 4% against their sector in 2019–2021,
mostly in the two weeks *before* insiders could sell. Since 2022 that drag is gone, and no trade
shape paid once a realistic option price was charged. The watch-only playbook logs the live
expiries as the test.

**Signals & conditions:**

- **Buy signal:** no. Nothing in this study licenses a long, short or option position on an unlock.
- **Call:** wait until 2027-01-11
- The one cut to log (not trade): $500M+ raised **and** run-up ≥ 50%; −6.5% into D+3 (n=30), 2022+ n=11.
- Volume does replicate: +30% median on days 0..+2 (t 9.4). Supply arrives; price no longer cares.
- Entries key off `confirmed` dates only; an early-release lockup is an `estimate` and never one.

---

## 1. What was run

**The sample** is built the way the calendar is (slice 1), pointed backwards. EDGAR full-text
search returned 3,535 final prospectuses (form 424B4) filed 2019-01-01 → 2026-06-30 saying there
had been "no public market" for the stock. Each one was read by `lockup-math.mjs` for its date,
lock-up period, price and size.

| Step | Left | Dropped |
|---|---|---|
| 424B4 hits | 3,535 | 1,349 SPACs (SIC 6770), 194 with no ticker today |
| One per company, its earliest | 1,554 | |
| A real IPO raising $100M+ | 624 | 269 follow-ons/resales; 661 under $100M or size not read |
| Date and lock-up read | 493 | 131 |
| Yahoo history starting at the IPO | 402 | 81 with no history (delisted, acquired, renamed); 10 starting elsewhere |
| ≥ 72 sessions before, ≥ 23 after the unlock | **355** | 47 |

Lock-ups: 343 at 180 days, 12 at 120–365. Status by the calendar's own rule: 288 `confirmed`
(one stated period, no early-release clause), 67 `estimate`. Sectors: XBI 89, XLK 82, XLY 39,
XLI 36, XLF 34, XLV 34, IWM 16, others 25.

**Conventions.**

- **Day 0** is the first session insiders may sell: the first bar after the lock-up's last day.
- **CAR[a,b]** sums the stock's daily close-to-close return minus its benchmark's over days a..b.
  That is the Field & Hanka convention.
- **The benchmark** is the sector SPDR for the company's SIC code: XBI for drug developers, IWM
  where no sector fits. IWM for everything is the robustness check, and it changes no conclusion
  (all events, CAR[−1,+1] −0.18% vs IWM against −0.20% vs sector).
- **Run-up** is the close at day −11 against the IPO price.
- **Unlock size** is the shares outstanding after the IPO minus those sold, over those sold.
- **Realized vol** is the trailing 60 sessions, days −70…−11; its median was 71%.

## 2. Against the literature

| Claim | Prior | This sample | Verdict |
|---|---|---|---|
| 3-day abnormal return around expiry | −1.5% (Field & Hanka 2001), similar in Ofek & Richardson 2000 | **−0.20%**, t −0.39, 49% negative (n=355); confirmed −0.36% | **Does not replicate** |
| Volume jumps at expiry | +40% | **+30% median**, days 0..+2 over −40..−11; 65% of names up | **Replicates** |
| Larger for VC-backed names | yes | not measured (the prospectus parse does not read sponsor type) | open |
| Not information leaking before the date | Brav & Gompers 2003 | the drift sits *before* day 0 (CAR[−10,−1] −2.25%, t −2.84) | **Opposite shape**: in 2019–21 the market sold ahead of the date |

The only biotech cut near the prior is XBI names: −2.05% over three days (t −1.79, n=89). It is not
significant and its full window is −2.4% (t −1.0).

## 3. Where the drift sits, and when

| Window | All (n=355) | 2019–2021 (n=186) | 2022–2026 (n=169) |
|---|---|---|---|
| CAR[−10,−1], before any unlocked share trades | −2.25% (t −2.84) | **−3.9%** | **−0.4%** |
| CAR[−1,+1], the textbook three days | −0.20% (t −0.39) | | |
| CAR[0,+3], the first unlocked sessions | +0.34% (t 0.59) | | |
| CAR[−10,+3], the put trade's holding period | | −4.29% (t −3.34, 62% neg) | +0.73% (t 0.53, 47% neg) |
| CAR[−10,+10], the full window | −1.50% (t −1.33) | −3.45% (t −2.18) | +0.64% (t 0.40) |

The full path is the chart above. In 2019–21 the line falls steadily from day −10, bottoms around
day +4 at −4.4%, and recovers less than a point. Since 2022 it wanders within ±1.5% and ends above zero.

**Why the era matters more than any split.** The 2019–21 unlocks are the 2020–21 listing boom
landing in the late-2021 to 2022 growth sell-off. Recent IPOs are a higher-beta cohort than their
sector ETF, so some of the 2019–21 "lockup effect" is plausibly the cohort, not the unlock. The
study cannot separate the two. It can say that outside that cohort the effect is not there.

## 4. Splits (fixed before reading: run-up at 0 and 50%; unlock size in thirds)

| Split | n | CAR[−10,−1] | CAR[−10,+10] |
|---|---|---|---|
| Run-up < 0 (below the IPO price) | 150 | −1.65% (t −1.43) | −2.47% |
| Run-up 0–50% | 95 | −1.07% (t −1.03) | +2.34% |
| Run-up ≥ 50% | 110 | **−4.07%** (t −2.28) | −3.50% |
| Unlock < 3.5× the shares sold | 75 | −0.45% (t −0.30) | +3.16% |
| Unlock 3.5–7.6× | 75 | **−5.61%** (t −3.22) | −5.93% |
| Unlock ≥ 7.6× | 75 | −2.82% (t −2.21) | −2.40% |
| Unlock size not read | 130 | −1.01% | −1.12% |
| $500M+ raised | 96 | −3.83% (t −2.58) | −3.43% |
| Confirmed date | 288 | −1.96% (t −2.22) | −1.39% |
| Estimate (early-release / staged) | 67 | −3.49% (t −1.97) | −1.99% |

Run-up is the cleaner dial: the biggest run-ups fell most, as the literature says. Unlock size is
not monotonic (the middle third fell most), so it is no dial. Every split weakens the same way
by era. Big unlocks fell 4.96% into day −1 in 2019–21 (t −2.38) and 1.05% since 2022 (t −0.68).

## 5. The trade shapes

**Shape A, puts into the date.** Buy the at-the-money put and sell the one 10% lower at the close
of day −11; both expire at the close of day +3. Free history has no implied vol, so each spread is
priced at trailing realized vol (a floor: implied usually sits above realized into a known
catalyst) and again at 1.25× it.

| Group | n | At realized vol | At 1.25× realized |
|---|---|---|---|
| All | 354 | +7.0% mean, −24% median (t 1.17) | **−1.4% mean, −31% median**, 55% lose |
| Confirmed date | 287 | +1.5%, −39% median | **−6.5%, −43% median** |
| Run-up ≥ 50% | 110 | +24.5% (t 2.36) | +15.3% (t 1.60) |
| $500M+ and run-up ≥ 50% | 30 | +50.5% (t 2.34) | (2022+ only: n=11, +34% at RV, t 0.82) |
| Big unlocks, 2019–2021 | 34 | | +33.0% (t 1.89) |
| Big unlocks, 2022–2026 | 41 | | **−5.0%** (t −0.31) |

Every cut that paid is carried by 2019–21. At a realistic price the median spread loses about a third
of its debit. **Don't.**

**Run-in variant.** The same spread expiring at day −1, shaped after seeing that the drift lands
before day 0. At 1.25× realized vol it averages +3.1% (median −28%) and +0.4% on confirmed dates.
A post-hoc shape that still does not pay. **Don't.**

**Shape B, buy after the flush.** Enter at the close of day +3, the survivor in
[`anthropic-ipo.md`](anthropic-ipo.md) ("enter *after* supply clears").

| Group | n | CAR[+4,+13] | CAR[+4,+23] |
|---|---|---|---|
| Everyone | 355 | +0.10% | −0.28% |
| Double-digit flush (raw D−11 → D+3 ≤ −10%) | 106 | −0.39% | **−1.50%** (t −0.83) |
| Flush, confirmed date | 78 | +0.48% | −0.67% |

A flushed stock kept drifting with its sector or slightly below. There is no rebound to harvest.
**Don't.**

**Shape C, sell rich IV.** Untestable without implied-vol history. It stays a `don't` until slice
3's live reads show the date is overpriced.

## 6. What slice 3 builds from this

- **Watch-only, as planned, with no sizing path out of this study.** Thirty watch-only expiries
  (slice 4) can earn sizing only if they reverse the headline call above.
- **The six reads per verdict stay**, and three of them now carry a measured reason. Run-up is the
  one split with the literature's sign. Unlock size is logged but not trusted. Put IV against
  realized vol is the input this study could not see.
- **Flag the one cut worth watching**: $500M+ raised and run-up ≥ 50%. Every live calendar entry
  clears $500M, so the forward test reads this cut on every live expiry.
- **Date honesty holds**: an `estimate` (early-release) date had a larger run-in (−3.5%) because
  shares can unlock early, which is exactly why it may only widen caution.

## 7. Honest limits

- **Survivorship.** 81 listings with no Yahoo history (acquired, delisted, renamed) and 194 with no
  ticker today are missing; failures skew negative, so the sample flatters post-IPO returns.
- **Clustering.** 130 of 355 unlocks fall in 2021. t-statistics treat events as independent;
  overlapping windows in a sell-off are not, so 2019–21 significance is overstated.
- **Unlock size is a proxy.** 130 events have no readable share count. Shares sold by selling
  stockholders count as locked, and "substantially all" holders being locked is assumed.
- **No implied vol.** The option shapes are priced off realized vol; implied into a catalyst is
  usually higher, which makes every put result above an upper bound.
- **Sector ETFs are coarse** for a newly listed growth stock. IWM tells the same story, but neither
  isolates a "recent IPO" factor.

## 8. Two parser bugs this study found (fixed in the same PR)

- `lockup-math.mjs` read the offering size off "after th**is offering** 68,365,044 shares" (no word
  boundary on "is offering"), and missed the summary's "Common stock offered by us 9,250,000
  shares". Alector's $176M IPO read as $1.3B. Re-reading the 11 live calendar entries with the fix
  changed no size, impact or date.
- The first unlock-size reader took a dual-class summary's Class A line as the whole share count,
  reading CrowdStrike's 179M locked Class B shares as zero. It now takes the Total line or sums the classes.

## Forward test

The 11 live expiries on the calendar, all $500M+, scored at D+10 against their sector ETF:
XE 2026-10-20 · BXDC 2026-11-09 · CBRS 2026-11-09 (estimate) · QNT 2026-11-30 · INIO 2026-11-30 ·
EROC 2026-12-06 (estimate) · PBLS 2026-12-06 · SPCX 2026-12-08 (estimate) · DPC 2026-12-21 ·
BSP 2026-12-27 · CSQR 2027-01-11. The headline reverses if ≥ 8 end below their sector with mean
CAR[−10,+10] ≤ −5%. The 2027-07-01 re-run (`node scripts/research/lockup-study.mjs --until
2027-01-31`) adds every unlock through mid-2027 to the 2022+ half.
