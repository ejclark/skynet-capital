# Japan Ku-area of Tokyo CPI (January 2027, preliminary), 08:30 JST — japan-cpi-tokyo-flash-2027-01-29

**Kind:** macro-print · **Date:** 2027-01-29 (estimate, EST: stat.go.jp/english/data/cpi/1582.html "Consumer Price Index — Schedule of Release", re-fetched raw direct 2026-09-05 (HTTP 200, 13,839 bytes) and re-parsed cell-by-cell by this session independently of the sibling sweep that proposed the entry; row 14 of the single 17-row table reads exactly `["December", "January 22, 2027", "January, 2027", "January 29, 2027", "2026 yearly average of Japan"]`. Filed estimate on three counts: the confirmed-prefix taxonomy has BLS:/BEA:/CENSUS: and no slot for Japan's Statistics Bureau, this lane may not self-confirm an event it discovered in-sweep, and the page's own stamp is still "Last Update : 23 January 2026") · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-2027-01-27","boj-summary-of-opinions-2027-02-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and take the one job the sibling ledgers explicitly left to this session:
putting a number on the vintage risk that has been holding their central finding at Medium.**
[japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md) found that the zero-parameter
rule `national_{m−1} + (Tokyo_m − Tokyo_{m−1})` predicts Japan's national core print far better than
persistence (**0.117pp vs 0.182pp** over 319 months), then named its own largest threat: e-Stat serves
one *revised* vintage, so nobody knows how much the Tokyo **preliminary** — which is exactly what this
event is — gets revised, and it worried the rule was doubly exposed because it "uses two Tokyo
observations where the level comparison uses one." Every number above replicates here from an
independent re-download. **The exposure claim does not.** The Statistics Bureau's own page states the
final (確報値) publishes on the nearest national release date on or after the preliminary — so when
the rule is computed, `T_{m−1}` is already **final** and only `T_m` is preliminary: **one noisy input,
the same as the level forecast.** The sibling's *conclusion* survives anyway, for a better reason, and
now it has a budget: because differencing shrinks the residual to 0.117pp, the same absolute noise
costs the rule proportionally more, and simulation puts the break-even at a revision standard
deviation of **≈0.16pp** on mean error (**≈0.11pp** on head-to-head win rate) against an irreducible
one-decimal rounding floor of **0.043pp**. Two things follow. **The rule never loses to the raw Tokyo
level at any revision size tested** — even at 0.40pp it scores 0.347 against the level's 0.410 — so
"the information is in the change, not the level" is unconditional; only the race against persistence
is revision-sensitive. And **January is the thinnest month in the matrix**: persistence is unusually
strong at January prints (0.166pp vs 0.182pp all-month), so this print's break-even falls to **≈0.12pp**
— of every month, ours is the one where the unmeasured revision matters most. **The measurement is now
scheduled and free**, because today's snapshot *is* a preliminary: e-Stat's Tokyo series ends at
**August 2026, core y/y +1.791%**, published 2026-08-28, and its final publishes **2026-09-18** — the
first direct revision reading, 13 days out, registered here. `symbols: []`, `impact: low`, no house
playbook is keyed to Japanese prices, and the date is **estimate**, which widens caution and licenses
nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no position exists that this release could touch | High | `symbols: []`, `impact: low`, no house playbook keyed to Japanese prices, and at D-146 there is nothing to size | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2027-01-29** that the tape attributes to a Japanese CPI headline — the "no channel" premise fails and this doc is rebuilt |
| This week | **Stand aside; no Japanese CPI release falls in it** | High | The primary schedule re-parsed today puts the next national print at **2026-09-18** and the next Tokyo flash at **2026-10-02** — nothing lands **2026-09-07 → 2026-09-11** | Any Statistics Bureau CPI release dated inside **2026-09-07 → 2026-09-11**, which would mean the schedule page this document rests on is wrong |
| This month | **Watch 2026-09-18 twice — it prints the first revision reading AND the first free rule test, at zero cost** | Medium | That release publishes Tokyo August's **final** against today's preliminary **+1.791%**, and the national August core the rule forecasts at **+1.892%** (persistence: +1.795%) — both settle from one print | Tokyo August core revising by **≥0.10pp** (registered **FT-japan-cpi-tokyo-flash-2027-01-29-1**), or the rule missing national August core by **more than 0.30pp** (registered **-2**) — either says the tolerance arithmetic below is built on sand |
| This quarter | **Carry the rule with its revision budget attached, not as an unqualified result** | Medium | The break-even revision sd is **≈0.16pp** all-month and **≈0.12pp** at January against a **0.043pp** rounding floor — a real margin, but a thin one at this print specifically, and still unmeasured | **\|national Jan-2027 core − (national Dec-2026 core + Tokyo Jan-2027 core − Tokyo Dec-2026 core)\| ≥ \|national Jan-2027 core − national Dec-2026 core\|** — registered as **FT-japan-cpi-tokyo-flash-2027-01-29-3**, score by 2027-02-20, base rate 15/27 Januaries |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to this release, to the 2027-01-29 Tokyo
  session or to the 2027-01-28 US session, in any branch. `impact: low`, `symbols: []`, date
  `estimate`.
- **The exposure correction, from the Bureau's own words.** stat.go.jp's Tokyo preliminary page
  states 確報値は…全国（速報値の公表日以降で直近の全国の公表日） — the final publishes on the
  nearest national release date on or after the preliminary. Applied to this print: Tokyo December's
  final lands **2027-01-22** with the national December print, *before* this preliminary on
  **2027-01-29**. So the rule's `T_{m−1}` is final and only `T_m` is preliminary — **one noisy Tokyo
  input, identical to the raw-level forecast's exposure**, not two.
- **The tolerance budget, simulated on the replicated series** (noise applied to the preliminary
  `T_m` only, 319 months 2000-01 → 2026-07, 200-400 reps per point). Rule MAE / rule head-to-head win
  vs persistence's flat **0.182pp**: sd **0.00** → **0.117 / 59%** · **0.05** → 0.131 / 55% · **0.10**
  → 0.149 / 51% · **0.15** → 0.175 / 46% · **0.20** → 0.206 / 41% · **0.40** → 0.347 / 28%.
  **MAE break-even ≈0.163pp; win-rate break-even ≈0.11pp.**
- **The floor the budget is measured against is 0.043pp.** Perturbing the published one-decimal index
  by ±0.05 and recomputing y/y gives a standard deviation of **0.0428pp** — quantization alone. The
  all-month budget is ~3.8× that floor; January's is ~2.8×.
- **The finding that survives any revision size: the level ranking never flips.** At every sd tested
  the rule stays ahead of the raw Tokyo level (0.347 vs 0.410 even at sd 0.40pp). Revision risk can
  cost the rule its win over *persistence*; it cannot restore the *level* forecast the two sibling
  ledgers already buried.
- **January is the thinnest month, which is this event's own result.** Persistence at January prints
  scores **0.166pp** (vs 0.182 all-month) and the rule **0.138pp**, winning **15/27 = 56%** of
  Januaries and **6/9 = 67%** since 2018. Because the cushion is smaller, January's MAE break-even
  falls to **≈0.12pp** and its win-rate break-even to **≈0.05pp** — barely above the rounding floor.
- **The measurement is scheduled, free, and starts in 13 days.** e-Stat's Tokyo table currently ends
  at **2026-08** (core index **102.3**, y/y **+1.791%**, all-items +1.992%) — that is the 2026-08-28
  preliminary, and the 2026-09-18 national release publishes its final. Every future pulse of this
  ledger should record the last Tokyo observation and diff the previous one; five pulses before this
  event yields five revision readings for zero marginal cost.
- **The corridor is unique in this calendar and it is an attribution hazard, not a channel.** Of the
  ten Japanese CPI events tracked, this is the **only one whose entire ±5-day window is a single
  event** — and that event is **fomc-2027-01-27** (`high`, meeting Jan 26-27, no SEP). The flash lands
  **28.5 hours** after the FOMC statement.
- **The clock.** 08:30 JST **2027-01-29** = **18:30 EST Thursday 2027-01-28** (US on EST; DST starts
  2027-03-14), so New York gets a full Friday session. **2027-01-31 is a Sunday**, so **Friday
  2027-01-29 is the last January trading session in both Tokyo and New York** — month-end flow is an
  available alternative story for anything that moves.
- **The BoJ sandwich.** The January **Outlook Report** board concludes **2027-01-22** (D-7, same day
  as the national December print); the next board is **2027-03-18** (D+48). This flash is therefore
  the **first Japanese CPI print of the new inter-meeting cycle** and the first of the three the March
  board will hold. The January **Summary of Opinions** publishes **2027-02-01** — three days after
  this flash, **proposed here** — and it records views expressed at the 01-21/22 meeting, so it
  cannot be a reaction to this print however it reads on the tape.
- **This release carries no supplementary headline.** Row 14's remark "2026 yearly average of Japan"
  attaches to the **2027-01-22 national** release by the remark-column rule (re-verified 6/6 here);
  Tokyo's own 2026 annual average was struck on **2026-12-25**. This is simply the first Tokyo
  observation of calendar 2027.
- **Watch (dated)** — national Aug CPI **2026-09-18** (est; the double free test — revision reading
  and rule test; BoJ decision same day) · Tokyo Sept flash **2026-10-02** (est) · national Sept
  **2026-10-23** (est; **untracked in this calendar**, inherited flag, not proposed here) · Tokyo Oct
  **2026-10-30** (est; BoJ same day) · national Oct **2026-11-20** (est) · Tokyo Nov **2026-11-27**
  (est) · national Nov **2026-12-18** (est; BoJ same day) · Tokyo Dec flash + 2026 Tokyo yearly
  average **2026-12-25** (est) · FOMC blackout start **2027-01-16** (derived) · **BoJ decision +
  Outlook Report + national Dec CPI + Japan 2026 annual average, all 2027-01-22** (est) · **FOMC
  2027-01-27** (est, `high`) · **this flash 2027-01-29** (est) · **BoJ Summary of Opinions
  2027-02-01** (est, **proposed here**) · national Jan **2027-02-19** (est) · Tokyo Feb
  **2027-02-26** (est) · BoJ **2027-03-18** (est) · national Feb **2027-03-19** (est) · Tokyo Mar
  flash + FY2026 Tokyo average **2027-03-26** (est) · food consumption-tax cut effective
  **2027-04-01** (est).

## Initial research

### The question, plainly

This event was proposed by the [japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md)
initial research, which found it untracked while walking the Bureau's schedule against the calendar,
and which needs it: this print is the `T_{m−1}` input without which that ledger's differenced rule
cannot be computed at all. Its date is already under test as
[FT-japan-cpi-tokyo-flash-2027-02-26-3](../forward-tests/japan-cpi-tokyo-flash-2027-02-26.md), so this
session **inherits rather than duplicates** that registration.

That leaves an obvious question and a much better one.

The obvious one — *is January a special month for the Tokyo flash?* — is already answered and the
answer is no. [japan-cpi-2027-02-19](japan-cpi-2027-02-19.md) ranked all twelve months by how far
national core y/y travels from its predecessor and found **January is rank 7 of 12 (0.166pp)**,
explicitly refuting its own New-Year-price-reset hypothesis; the month that breaks persistence is
April (0.366pp, rank 1). Re-testing that here would be a rerun, not research.

The better one is the question the sibling ledger wrote down and handed forward in as many words:
*"the largest threat is a vintage mismatch this session could not measure… this is the cheapest open
question and the next session should look for it first."* **This event is a Tokyo preliminary
release.** If any ledger owns the preliminary-vintage question, it is this one.

**One-line verdict: the vintage threat is real but it was the wrong shape — in real time the rule
carries exactly one preliminary observation, not two, and the honest version of the worry is a
tolerance budget of roughly 0.16pp of revision noise all-month and 0.12pp at January, which this
session could not measure directly but has now made free and automatic to measure from 2026-09-18
onward.**

The stance is unchanged and was never in doubt — stand aside, `impact: low`, `symbols: []`.

**Method:** sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), every
fetch made and parsed by this session on **2026-09-05**, independently of the sweep that proposed this
entry:

- **stat.go.jp "Schedule of Release"** (`/english/data/cpi/1582.html`, HTTP 200, 13,839 bytes) — its
  single 17-row table re-parsed cell-by-cell; row 14 reads `["December", "January 22, 2027",
  "January, 2027", "January 29, 2027", "2026 yearly average of Japan"]`.
- **stat.go.jp Tokyo preliminary release page** (`/data/cpi/sokuhou/tsuki/index-t.html`, HTTP 200,
  13,302 bytes, Shift-JIS) — the page for the current 中旬速報値, and the source of the 確報値
  publication rule that carries leg 2.
- **Japan Cabinet Office public-holiday CSV** (`www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv`,
  HTTP 200, 21,538 bytes, Shift-JIS) — all 17 of 2027's holidays; the January pair is **2027-01-01**
  and **2027-01-11**.
- **boj.or.jp "Monetary Policy Meetings"** (`/en/mopo/mpmsche_minu/`, HTTP 200, 41,959 bytes) — both
  year tables parsed row-by-row; the 2027 January row supplies leg 7 and the proposal.
- **e-Stat**, the Bureau's own portal: `Table 1-1 Subgroup Index for Japan, Monthly` and its Tokyo
  counterpart, downloaded as XLSX (`stat-search/file-download?statInfId=000040491314&fileKind=4` and
  `…317`) and parsed locally out of the OOXML — **679 national monthly observations 1970-01 → 2026-07**
  and **680 Tokyo 1970-01 → 2026-08**, 2025-base. Column `J` is the BoJ's core measure (all items less
  fresh food). Every CPI figure here is computed from those two files.
- **VIX** from CBOE's daily-history CSV (`cdn.cboe.com/api/global/us_indices/daily_prices`), close
  **14.53** on **2026-09-04**.

No instrument scripts: `symbols: []`, there is no issuer, and `earnings-cycle.mjs` /
`intraday-edges.mjs` have no macro mode. Adjacency computed against the live calendar with the same
±5-day window `event-material-decide.mjs` uses.

### Conviction legs, tested

1. **Both sibling ledgers' arithmetic replicates exactly on an independent re-download — SUPPORTED.**
   Series lengths match (679 national / 680 Tokyo, 2025-base) and so do the statistics, to three
   decimals. Tokyo level vs persistence at predicting national core y/y: all months 2000-01 → 2026-07
   (n=319) **0.250 vs 0.182pp**, Tokyo wins **114/319 = 36%**; 2018+ (n=103) **0.201 vs 0.231**,
   **54/103 = 52%**; **Januaries 2000-2026 (n=27) 0.273 vs 0.166, wins 9/27 = 33%**; Januaries 2018+
   (n=9) **0.205 vs 0.217, 4/9 = 44%** — the last two matching
   [japan-cpi-2027-02-19](japan-cpi-2027-02-19.md) exactly. The differenced rule
   `national_{m−1} + (Tokyo_m − Tokyo_{m−1})` scores **0.117pp** (2000+, wins 59%), **0.116pp**
   (2018+, 73%) and **0.159pp** (full 1971+, n=666, 55%), matching
   [japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md). The Tokyo-minus-national
   wedge recomputes to mean **−0.153pp**, sd **0.280pp**, lag-1 autocorrelation **0.835**. **Nothing
   below is a dispute about the data.**

2. **The rule is exposed to exactly ONE preliminary observation, not two — SUPPORTED, from the
   Bureau's own statement, and it corrects the sibling's stated mechanism.**
   [japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md) reasons that "the
   differenced rule uses two Tokyo observations where the level comparison uses one, so any revision
   noise bites it harder." The Tokyo preliminary page states the publication rule that settles this:
   確報値は…全国（速報値の公表日以降で直近の全国の公表日） — *the final value publishes on the
   nearest national release date on or after the preliminary's publication date.* Applied to the
   parsed schedule, the real-time information set at each computation is unambiguous:

   | Input | Published | Vintage at computation |
   |---|---|---|
   | national December 2026 core (`Y_{m−1}`) | 2027-01-22 | final |
   | Tokyo December 2026 core (`T_{m−1}`) | 2027-01-22 (final for the 2026-12-25 preliminary) | **final** |
   | Tokyo January 2027 core (`T_m`) — **this event** | 2027-01-29 | **preliminary** |

   The raw-level forecast uses `T_m` alone — also exactly one preliminary. **Equal exposure.** The
   same ordering holds one month later for the sibling's own print (Tokyo January's final publishes
   2027-02-19, before the Tokyo February preliminary on 2027-02-26), so this is the general case and
   not a January artefact.

3. **The sibling's conclusion survives anyway, for a different and better reason — SUPPORTED.** Equal
   exposure does not mean equal damage. Differencing removes the persistent wedge and shrinks the
   rule's residual to 0.117pp, so the *same absolute* noise is a far larger fraction of it. Adding
   i.i.d. N(0,σ) noise to the preliminary `T_m` only, over the 319 months from 2000 (200 reps per
   point, deterministic seed):

   | Revision sd σ | Tokyo level MAE | Persistence MAE | **Rule MAE** | Rule head-to-head wins |
   |---|---|---|---|---|
   | 0.00 | 0.250 | 0.182 | **0.117** | **59%** |
   | 0.05 | 0.255 | 0.182 | **0.131** | 55% |
   | 0.10 | 0.264 | 0.182 | **0.149** | 51% |
   | 0.15 | 0.279 | 0.182 | **0.175** | 46% |
   | 0.20 | 0.300 | 0.182 | **0.206** | 41% |
   | 0.30 | 0.349 | 0.182 | **0.274** | 34% |
   | 0.40 | 0.410 | 0.182 | **0.347** | 28% |

   Degradation is proportionally steeper for the rule (0.117 → 0.189, **+62%**, at σ=0.175) than for
   the level (0.250 → 0.290, **+16%**) — so the sibling's *worry* was right even though its *count*
   was wrong. **The honest restatement: the threat is not double exposure, it is a small residual.**

4. **The break-even is ≈0.16pp on mean error and ≈0.11pp on win rate — SUPPORTED, and this is the
   number the sibling ledger was missing.** Refining the sweep at 400 reps per point: the rule's MAE
   passes persistence's 0.182pp between σ=0.160 (**0.1803**) and σ=0.165 (**0.1842**), interpolating
   to **σ ≈ 0.163pp**. The stricter head-to-head criterion falls sooner — 50.9% at σ=0.100 and 49.8%
   at σ=0.110, interpolating to **σ ≈ 0.108pp**. Both are stated because they answer different
   questions: the first asks whether the rule is a better estimator on average, the second whether it
   is a better bet on any given month.

5. **The budget is measured against a rounding floor of 0.043pp — SUPPORTED.** The published index
   carries one decimal, so a y/y computed from two of them inherits quantization noise even with zero
   true revision. Perturbing both index legs by uniform ±0.05 and recomputing gives a y/y standard
   deviation of **0.0428pp**. So the all-month tolerance is **~3.8× the irreducible floor** — a real
   margin, and the right yardstick for judging whatever the 2026-09-18 reading turns out to be.

6. **The level ranking never flips, at any revision size tested — SUPPORTED, and it is the robust
   half of the finding.** At every σ in leg 3 the rule stays ahead of the raw Tokyo level, still
   0.347 against 0.410 at σ=0.40pp — nearly ten times the rounding floor and far past any plausible
   revision. **So "the flash's information is in its change, not its level" is unconditional.** Only
   the narrower claim — that the rule beats *doing nothing* — carries revision risk. That split
   matters because the two sibling ledgers' shared conclusion rests on the first claim, and this
   session cannot dislodge it however the revision reading lands.

7. **January is the thinnest month in the matrix, and that is this event's own result — SUPPORTED.**
   Persistence is *unusually strong* at January prints (**0.166pp** over 27 Januaries against 0.182pp
   all-month), so the rule's cushion is smaller there even though the rule still wins: **0.138pp,
   15/27 = 56%** of Januaries, and **0.147pp, 6/9 = 67%** since 2018. Running the same tolerance sweep
   on the 27 Januaries alone (800 reps): σ=0.05 → **0.144**, σ=0.10 → **0.158**, σ=0.15 → **0.181**
   against persistence's flat 0.166pp — **MAE break-even ≈0.12pp**, and the head-to-head win rate is
   already at 50% by **σ≈0.05pp**, barely above the rounding floor. This does *not* contradict
   [japan-cpi-2027-02-19](japan-cpi-2027-02-19.md)'s finding that January is dead-average for how far
   core y/y travels (rank 7 of 12): a month can be average in *movement* and still be a month where
   the stale print happens to have done unusually well. The consequence is narrow and worth stating
   plainly — **of every month, this print is the one where an unmeasured revision would matter most.**

8. **The revision itself is not measurable today, but it is now free and automatic from 2026-09-18 —
   SUPPORTED, and this is the session's most durable output.** Three routes were tried and all fail
   for the same reason: **no historical preliminary series exists at a stable machine-readable
   address.** e-Stat's Tokyo table is a single revised vintage; the current preliminary is published
   only as a PDF at a **fixed, overwritten path** (`/data/cpi/sokuhou/tsuki/pdf/kubu.pdf`, HTTP 200,
   387,620 bytes today); and e-Stat's own file list for the release carries 結果の概要 PDFs rather
   than a 中旬速報値 time-series table. What *is* available is the present snapshot — and it is a
   preliminary. National data ends **2026-07**, Tokyo ends **2026-08**, and by leg 2's publication rule
   that August observation (core index **102.3**, y/y **+1.791%**; all-items 102.4, +1.992%) is the
   **2026-08-28 preliminary**, whose final publishes **2026-09-18**. Registered as
   **FT-japan-cpi-tokyo-flash-2027-01-29-1**, and the protocol generalises: every pulse of this
   ledger records the last Tokyo observation and diffs the previous, yielding roughly five revision
   readings before this event ever fires.

9. **The rule's first free forecast is computable today and is stated rather than deferred —
   SUPPORTED.** National July 2026 core is **+1.795%**, Tokyo July **+1.693%**, Tokyo August
   **+1.791%**, so ΔTokyo = **+0.098pp** and the rule forecasts national August 2026 core at
   **+1.892%**, against persistence's **+1.795%** and the raw Tokyo level's **+1.791%**. The 2026-09-18
   release settles all three. Registered as **FT-japan-cpi-tokyo-flash-2027-01-29-2**. Note the two
   registrations are deliberately entangled: `T_m` here is itself the preliminary under test in
   FT-…-1, so a large revision would be a plausible cause of a forecast miss, and scoring them
   together decomposes the error instead of leaving it ambiguous.

10. **The date, weekday, holiday and remark checks all replicate — SUPPORTED.** Row 14 re-parses on a
    raw fetch today as `["December", "January 22, 2027", "January, 2027", "January 29, 2027", "2026
    yearly average of Japan"]`. Weekday-stamping all 30 release dates in the table gives **28 Fridays
    and 2 Tuesdays**, both Tuesdays being the March-2026 pair — **2027-01-29 is a Friday**, on
    convention. The Cabinet Office CSV lists 2027's January holidays as **2027-01-01** (元日) and
    **2027-01-11** (成人の日), leaving the release date clear and the whole 2027-01-22 → 2027-01-29
    window holiday-free. By the remark-column rule (「of Japan」→ the national column, 「of Ku-area
    of Tokyo」→ the Tokyo column), verified here at **6/6** on the table's six non-base-revision
    remarks, row 14's "2026 yearly average of Japan" belongs to the **2027-01-22 national** release —
    so **this flash carries no supplementary headline**, unlike the 2026-12-25 and 2027-03-26
    flashes. Tokyo's own 2026 annual average was already struck on 2026-12-25, making this simply the
    first Tokyo observation of calendar 2027.

11. **The corridor is the tightest and the most lopsided of any Japanese CPI event here —
    SUPPORTED.** Walking all ten tracked Japanese CPI events against the 224-event calendar with the
    ±5-day window `event-material-decide.mjs` uses, the neighbour counts are 8 · 13 · 13 · 5 · 2 ·
    **1** · 2 · 1 · 4 · 5. This event and the 2027-02-26 flash tie for the emptiest corridor at one
    neighbour each — but this one's single neighbour is **fomc-2027-01-27** (`high`, meeting Jan
    26-27, no SEP) while the sibling's is a `low` NERC workplan. **This is the only Japanese CPI print
    on the calendar whose entire ±5-day corridor is one high-impact event.** That is an attribution
    hazard to name, not a channel to trade.

12. **The clock, and a second month-end coincidence — SUPPORTED, arithmetic.** With the US on EST
    (DST begins 2027-03-14) and JST fixed at UTC+9:

    | Event | Local | UTC |
    |---|---|---|
    | FOMC statement | 14:00 EST 2027-01-27 | 2027-01-27 19:00 |
    | **This flash** | **08:30 JST 2027-01-29** | **2027-01-28 23:30** |
    | US equivalent | **18:30 EST Thursday 2027-01-28** | — |
    | Tokyo cash close | 15:00 JST 2027-01-29 | 2027-01-29 06:00 |
    | US cash open | 09:30 EST 2027-01-29 | 2027-01-29 14:30 |

    The flash lands **28.5 hours** after the FOMC statement, so the Tokyo session that first prices it
    is also the first full Tokyo session pricing the FOMC — two stories, one tape. And **2027-01-31 is
    a Sunday**, so **Friday 2027-01-29 is the last January trading session in both Tokyo and New
    York**, giving month-end flow as a third available explanation. Three candidate causes for any
    move that day is precisely why nothing here licenses a position.

13. **The BoJ sandwich, and the meeting arithmetic — SUPPORTED.** Parsing boj.or.jp's own schedule,
    the 2027 table's first row reads `["Jan. 21 (Thurs.), 22 (Fri.)", "Jan. 22 (Fri.)", "Feb. 1
    (Mon.)", "Mar. 24 (Wed.)"]` — the January MPM concludes **2027-01-22** and **does** carry an
    Outlook Report (the March and June 2027 rows read "-"). That decision is **164.5 hours / 6.85
    days** before this flash and shares its date with the national December print; the next board is
    **2027-03-18**, **1,155.5 hours / 48.15 days** after it. So this print is the **first Japanese CPI
    reading of the January→March inter-meeting cycle**, the first data against the fresh January
    Outlook projections, and the first of the three prints the March board will hold (this,
    national January on 2027-02-19, Tokyo February on 2027-02-26).

14. **An untracked dated adjacency in the corridor, proposed — SUPPORTED.** The same parse places the
    January MPM's **Summary of Opinions on 2027-02-01 (Mon.)**, three days after this flash and
    inside its ±5-day window. The calendar already tracks this document class for the March meeting
    (`boj-summary-of-opinions-2027-03-29`) and tracks the January decision itself
    (`boj-decision-2027-01-22`), so the January Summary was a gap in an otherwise complete pair. Proposed in this PR as
    `src/domain/market-events/boj-summary-of-opinions-2027-02-01.json`, `status: "estimate"`. **The
    trap it exists to name:** a Summary of Opinions records views expressed *at* the meeting, so this
    document is written 2027-01-21/22 and contains **no reaction to this flash** — a reader receiving
    both within three days will be tempted to read one as a response to the other, and it cannot be.
    The same row also dates the January **MPM Minutes to 2027-03-24**; the calendar tracks no BoJ
    minutes at all and that date is 54 days out, so it is **flagged and deliberately not proposed**.

15. **Realised Japanese inflation, re-derived rather than cited — SUPPORTED.** From the same e-Stat
    files, 2025-base, year-on-year core (less fresh food): national 2026 **+1.92 / +1.52 / +1.72 /
    +1.40 / +1.50 / +1.50 / +1.79** (Jan→Jul); Tokyo 2026 **+1.93 / +1.83 / +1.72 / +1.50 / +1.30 /
    +1.60 / +1.69 / +1.79** (Jan→Aug). The freshest Japanese reading anywhere remains **Tokyo August
    2026**, core **+1.79%**, all-items **+1.99%** — and per leg 8 it is a preliminary. The latest
    observable wedge is **Tokyo July minus national July = −0.10pp**, inside one sd of its 2000+ mean.
    **No projection of the January 2027 flash is made here** — five of the intervening months are
    unpublished and a number would be invention.

16. **No tracked symbol carries a channel to this release — SUPPORTED, inherited, unchanged.**
    `symbols: []`, `impact: low`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed. Nothing in
    legs 1-15 creates one; a better-calibrated forecast of a print no position touches is calibration.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size, in any branch. Four instructions for the next session:

- **Read-only, and cheaply.** At `impact: low` with `symbols: []` this event's whole value is
  calibration. A pulse should cost a schedule re-check and a data refresh.
- **Do the revision diff first — it is the cheapest thing on this ledger and it is now mechanical.**
  Re-download the Tokyo XLSX, read its **2026-08** core y/y, and subtract today's recorded
  **+1.791%**. That single number scores FT-…-1 and starts the series the sibling ledgers need.
- **Carry the rule *with* its budget, not as a bare result.** The right sentence to hand forward is
  "the rule beats persistence provided Tokyo preliminary revisions have a standard deviation under
  roughly 0.16pp (0.12pp at January prints), against a 0.043pp rounding floor" — not "the rule beats
  persistence." Quoting the first half alone is the error this ledger exists to prevent, exactly as
  the sibling's own framing warns.
- **Do not re-run the January-seasonality test.** [japan-cpi-2027-02-19](japan-cpi-2027-02-19.md)
  settled it (January is rank 7 of 12 for how far core y/y travels; April is rank 1). Leg 7's
  January result is about persistence being *strong* in January, which is a different claim, and it
  is already recorded here.

### Honest limits

**The revision size is still unmeasured, and this ledger bounds it rather than resolving it.** That
is the honest headline: leg 8 established that no historical preliminary series exists at a stable
address, so legs 3-7 are a **sensitivity analysis under an assumed noise model**, not a measurement.
The model itself is the first thing to doubt — real revisions are unlikely to be i.i.d. Gaussian and
independent of the level; if they are serially correlated, or correlated with the size of ΔTokyo, the
break-even could sit either side of 0.16pp, and the direction is not knowable from anything fetched.
The i.i.d. assumption was chosen because it is the neutral one, not because it is right.
**Leg 2's ordering proof rests on one sentence of the Bureau's own Japanese-language page**, quoted
above; it is unambiguous and consistent with the parsed schedule, but it is a single source and no
English restatement was found. **The e-Stat series remains a spliced one** — both the 2019
consumption-tax hike and the 2020-base → 2025-base change sit inside it, and the Bureau's own rule is
that rates of change are not recomputed across a base change, so every historical average here is a
real average over a spliced series rather than a stationary property. **Persistence is a weak
benchmark by construction**, and this ledger's entire tolerance argument is denominated in it;
beating persistence is not beating a professional forecaster, and no consensus, whisper or survey
estimate for this print exists in this document — a deliberate non-spend at D-146 on a `low`-impact
release with no tracked symbol. **The January sample is n=27 (n=9 post-2018)** and leg 7's claim that
January's cushion is thinnest is a small-sample statement about a 0.016pp difference in persistence's
MAE; it is stated as a caution, not a law. **The 08:30 JST release time is the Bureau's standing
convention and is still not read off any fetched page** — the weakest element of the header, inherited
unchanged, and leg 12's clock inherits that weakness, though a ±few-hour error would not change which
US session the release precedes. **The schedule page's own stamp remains "Last Update : 23 January
2026"**, ~19½ months stale at fetch, and the BoJ's 2027 schedule is published ~16 months ahead, which
is the most movable kind. And **no forecast of this flash itself is offered** — five intervening
months are unpublished.

**Access notes for the next session:** every sibling access finding held on independent re-fetch —
e-Stat XLSX via `stat-search/file-download?statInfId=<id>&fileKind=4` (ids `000040491314` national,
`000040491317` Tokyo) serves to a browser-UA curl and parses out of plain OOXML
(`xl/worksheets/sheet1.xml` + `xl/sharedStrings.xml`; column `B` is `YYYYMM`, `I` all items, `J` core,
`M` core-core, data from row 15); the Cabinet Office holiday CSV needs `iconv -f SHIFT_JIS`; CBOE's
CDN returned VIX first try. New this session: the Tokyo preliminary page is
`/data/cpi/sokuhou/tsuki/index-t.html` (Shift-JIS) and its PDF sits at a **fixed, overwritten** path
`/data/cpi/sokuhou/tsuki/pdf/kubu.pdf` — there is no dated archive, which is exactly why the
historical revision series does not exist. `/data/cpi/sokuhou/tsuki/index-k.html` and
`/english/data/cpi/1581.html` both 404. Byte counts matched the sibling sessions' exactly
(13,839 / 21,538 / 41,959), itself a small corroboration that none of the three pages moved.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** No position, no play, no size, in any branch
— `impact: low`, `symbols: []`, no house playbook keyed to Japanese prices. What this ledger takes are
three analytical positions, none of them positional.

First, **the vintage threat that has been holding the sibling finding at Medium was the wrong shape,
and the corrected version comes with a number.** The Bureau's own publication rule — the final
publishes on the nearest national release date on or after the preliminary — means the differenced
rule carries exactly **one** preliminary Tokyo observation at computation time, identical to the
raw-level forecast, not the two
[japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md) reasoned from. Its conclusion
survives anyway for a better reason: differencing shrinks the residual to 0.117pp, so the same
absolute noise costs the rule proportionally far more (+62% at σ=0.175 against the level's +16%).
Simulated on the replicated 319-month sample, the rule's mean error passes persistence's 0.182pp at a
revision standard deviation of **≈0.163pp**, and its head-to-head win rate passes 50% at **≈0.108pp**,
against an irreducible one-decimal rounding floor of **0.0428pp**. Stated at **Medium**: the
arithmetic is solid but the noise model is assumed, not measured.

Second, **one half of the sibling finding is unconditional and one half is not, and separating them is
the useful part.** At every revision size tested — out to σ=0.40pp, nearly ten times the rounding
floor — the rule stays ahead of the raw Tokyo level (0.347 vs 0.410). So *"the flash's information is
in its change, not its level"* cannot be undone by any plausible revision, and the two sibling
ledgers' shared burial of the level forecast stands. What is revision-sensitive is only the narrower
race against **persistence** — and **at January prints that margin is the thinnest in the matrix**,
because persistence is unusually strong there (0.166pp vs 0.182pp all-month), pulling the break-even
down to **≈0.12pp** and the win-rate break-even to **≈0.05pp**. Of all twelve months, this print is
the one where the unmeasured revision matters most.

Third, **the measurement is no longer a research question, it is a scheduled one.** No historical
preliminary series exists at a stable address — e-Stat serves one revised vintage and the Bureau
publishes the current preliminary only as an overwritten PDF at a fixed path — but today's snapshot
*is* a preliminary: Tokyo **August 2026**, core index **102.3**, y/y **+1.791%**, published 2026-08-28,
final due **2026-09-18**. Recording it converts an unanswerable question into a free diff every pulse,
roughly five readings before this event fires. The same release also settles the rule's first live
forecast, **+1.892%** for national August core against persistence's **+1.795%**.

**Kill switches:**

- **Revision kill (registered):** Tokyo August 2026 core y/y, as published in the 2026-09-18 national
  release, differing from today's preliminary **+1.791%** by **≥0.10pp**. Registered as
  **FT-japan-cpi-tokyo-flash-2027-01-29-1**, score by **2026-09-19**. A single reading of that size
  would sit inside the all-month budget but at the January break-even, and would move legs 3-7 from
  "comfortable margin" to "live risk" on one observation.
- **Rule-forecast kill (registered):** the rule missing the 2026-09-18 national August core print by
  **more than 0.30pp** — more than double its historical mean error. Registered as
  **FT-japan-cpi-tokyo-flash-2027-01-29-2**, score by **2026-09-19**. Deliberately entangled with the
  revision kill so a miss can be attributed rather than left ambiguous.
- **January-print kill (registered):** the rule landing **no closer** to the 2027-02-19 national
  January core print than the 2027-01-22 national December print does. Registered as
  **FT-japan-cpi-tokyo-flash-2027-01-29-3**, score by **2027-02-20**, base rate **15/27 = 56%** of
  Januaries and 6/9 since 2018 — honestly close to a coin flip, which is leg 7's point rather than an
  embarrassment.
- **Date kill (inherited, NOT duplicated):** this flash moving off Friday 2027-01-29 is already
  registered by the sibling as
  [FT-japan-cpi-tokyo-flash-2027-02-26-3](../forward-tests/japan-cpi-tokyo-flash-2027-02-26.md), score
  by 2027-01-30, on the same primary and the same parse this session replicated. Re-registering it
  here would be duplicate bookkeeping; this ledger watches it and defers scoring to that fragment.
- **Ordering kill:** any primary source showing Tokyo's 確報値 does **not** publish on the national
  release date preceding the next Tokyo preliminary — e.g. a month where the Tokyo final lands after
  the next flash. Leg 2's equal-exposure correction would fail and the sibling's double-exposure
  reading would be reinstated. Free to re-check from the same page every pulse.
- **Wedge-regime kill:** the Tokyo-minus-national core wedge exceeding **±0.6pp** (about twice its
  2000+ sd of 0.280pp) at any release between **2026-09-18** and **2027-01-29**. The whole mechanism
  rests on a slow-moving wedge (ρ₁ = 0.835); a jump breaks the sibling's mechanism and this ledger's
  tolerance arithmetic together. The **2027-04-01** food consumption-tax cut
  ([japan-food-tax-cut-2027-04-01](japan-food-tax-cut-2027-04-01.md), −1.19pp on core) lands well
  after this event and outside the window, but it is exactly the shock that would trip this switch if
  any regional pre-effect appeared.
- **Channel kill:** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 →
  2027-01-29** that the tape attributes to a Japanese CPI headline. Leg 16's "no channel" claim would
  be false. Re-check every pulse.
- **Corridor kill:** the FOMC moving off **2027-01-27**, or the BoJ moving the January MPM off
  **2027-01-21/22** — both dates are `estimate` and the Fed's own page calls every 2027 date tentative
  until the preceding meeting confirms it. Legs 11-13's corridor and clock arithmetic are re-derived,
  and the proposed 2027-02-01 Summary of Opinions moves with the meeting.
- **Holiday kill:** Japan's Cabinet Office republishing its 2027 list with a public holiday on or
  adjacent to **2027-01-29** — the one mechanism that has actually moved a release in this table. Free
  to re-check from the CSV every pulse.

Three forward tests registered in
[`forward-tests/japan-cpi-tokyo-flash-2027-01-29.md`](../forward-tests/japan-cpi-tokyo-flash-2027-01-29.md)
— **-1** (the Tokyo preliminary-to-final revision is under 0.10pp), **-2** (the rule's live forecast of
national August 2026 core) and **-3** (the rule beats persistence at this January print). The date test
is **inherited** from the sibling rather than duplicated. One dated adjacent event proposed as
`estimate` in the same PR from the BoJ's own schedule: `boj-summary-of-opinions-2027-02-01`.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-146 | Initial research banked (above). **This session took the job the siblings handed forward — the Tokyo preliminary-vintage threat — and found it was the wrong shape.** Both sibling ledgers replicate exactly on an independent re-download (679/680 obs, 2025-base): Tokyo level vs persistence 2000+ n=319 **0.250 vs 0.182**, wins 36%; Januaries n=27 **0.273 vs 0.166**, wins 33%; Jan 2018+ **4/9 = 44%**; the differenced rule **0.117 / 0.116 / 0.159pp** (2000+ / 2018+ / full 1971+), wedge mean **−0.153**, sd **0.280**, ρ₁ **0.835**. **Correction (leg 2):** stat.go.jp's Tokyo preliminary page states 確報値 publishes on the nearest national release date **on or after** the preliminary — so Tokyo December's final lands 2027-01-22, *before* this 2027-01-29 preliminary. The rule carries **one** preliminary observation at computation time, **not two** as [japan-cpi-tokyo-flash-2027-02-26](japan-cpi-tokyo-flash-2027-02-26.md) reasoned; exposure is **equal** to the raw-level forecast. **But its conclusion survives for a better reason (leg 3):** differencing shrinks the residual to 0.117pp, so identical noise costs the rule **+62%** at σ=0.175 against the level's **+16%**. **Tolerance budget (legs 4-5), simulated on the replicated series, noise on the preliminary T_m only:** rule MAE / win-rate at σ = 0.00 **0.117/59%** · 0.05 0.131/55% · 0.10 0.149/51% · 0.15 0.175/46% · 0.20 0.206/41% · 0.40 0.347/28%. **MAE break-even ≈0.163pp, win-rate break-even ≈0.108pp**, against a one-decimal **rounding floor of 0.0428pp** — ~3.8× the floor. **Robust half (leg 6): the rule never loses to the raw Tokyo level at any σ tested** (0.347 vs 0.410 at σ=0.40), so "information is in the change, not the level" is **unconditional**; only the persistence race is revision-sensitive. **This event's own result (leg 7): January is the thinnest month.** Persistence is unusually strong at January prints (**0.166pp** vs 0.182 all-month) so the rule's cushion shrinks — rule 0.138pp, **15/27 = 56%** of Januaries, 6/9 since 2018 — pulling the January MAE break-even to **≈0.12pp** and its win-rate break-even to **≈0.05pp**, barely above the rounding floor. Does not contradict [japan-cpi-2027-02-19](japan-cpi-2027-02-19.md)'s "January is rank 7 of 12 for movement"; strong persistence and average movement are different claims. **The measurement is now free (leg 8):** no historical preliminary series exists at a stable address — e-Stat serves one revised vintage, the current preliminary is only an **overwritten PDF at a fixed path** (`/data/cpi/sokuhou/tsuki/pdf/kubu.pdf`, 387,620 B), `/index-k.html` and `/english/1581.html` 404 — **but today's snapshot IS a preliminary**: Tokyo **2026-08**, core index **102.3**, y/y **+1.791%** (all-items 102.4, +1.992%), final due **2026-09-18**. Every future pulse diffs it. **First live forecast stated (leg 9):** national Jul core **+1.795**, Tokyo Jul **+1.693**, Tokyo Aug **+1.791** → ΔTokyo **+0.098** → rule forecasts national Aug core **+1.892%** vs persistence **+1.795%**. **Date re-verified independently (leg 10):** row 14 re-parses as `["December","January 22, 2027","January, 2027","January 29, 2027","2026 yearly average of Japan"]` (HTTP 200, 13,839 B); weekday stamp of all 30 dates = **28 Fri / 2 Tue** (both March 2026), **2027-01-29 is a Friday**; Cabinet Office CSV (21,538 B, Shift-JIS) gives 2027 January holidays **01-01** and **01-11**, so the whole 01-22 → 01-29 window is clear; remark-column rule re-verified **6/6** → "2026 yearly average of Japan" attaches to the **2027-01-22 national** release, so **this flash carries no supplementary headline** (Tokyo's own 2026 average was struck 2026-12-25). Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — national 2026 core y/y +1.92/+1.52/+1.72/+1.40/+1.50/+1.50/+1.79 (Jan→Jul), Tokyo +1.93/+1.83/+1.72/+1.50/+1.30/+1.60/+1.69/+1.79 (Jan→Aug); latest observable wedge **−0.10pp**; **no projection of this flash made** (5 intervening months unpublished). **Volatility** — VIX **14.53** (2026-09-04 close, CBOE CDN). **Geopolitical/policy** — 2027-04-01 food consumption-tax cut (−1.19pp on core) lands after this event, inherited not re-sourced. **Event tape (legs 11-13)** — walking all ten Japanese CPI events against the 224-event calendar at ±5d gives neighbour counts 8·13·13·5·2·**1**·2·1·4·5: **this is the only Japanese CPI print whose entire corridor is one high-impact event**, `fomc-2027-01-27` (meeting Jan 26-27, no SEP), **28.5h** before this flash = **18:30 EST Thu 2027-01-28**; **2027-01-31 is a Sunday so 2027-01-29 is the last January session in both Tokyo and NY** — three candidate stories for any move that day, which is why nothing is sized. BoJ (boj.or.jp, HTTP 200, 41,959 B, re-parsed): January **Outlook Report** board concludes **2027-01-22** (**164.5h / 6.85d** before, sharing its date with the national December print), next board **2027-03-18** (**1,155.5h / 48.15d** after) — this is the **first Japanese CPI print of the new inter-meeting cycle** and the first of three the March board holds. **One dated adjacency proposed as `estimate` (leg 14):** `boj-summary-of-opinions-2027-02-01` — the January MPM's Summary, three days after this flash, untracked while the March analogue is; it records views expressed **at** the 01-21/22 meeting and is **not** a reaction to this print, which is the trap it exists to name. Also **flagged, deliberately not proposed** — the January MPM Minutes **2027-03-24** (no BoJ minutes tracked at all, 54 days out) and, inherited, the national Sept-2026 print **2026-10-23**. **Own weaknesses:** the revision size is **bounded, not measured** — legs 3-7 are a sensitivity analysis under an **assumed i.i.d. Gaussian** noise model chosen for neutrality, and serially-correlated or level-dependent revisions could move the break-even either way; leg 2 rests on a single Japanese-language sentence with no English restatement found; both series splice the 2019 tax hike and the 2020→2025 base change; persistence is a weak benchmark and the whole budget is denominated in it; no consensus/whisper sourced (deliberate non-spend at D-146); January n=27 (n=9 post-2018) and leg 7 turns on a 0.016pp difference; the 08:30 JST time remains unsourced convention; the schedule page is unrefreshed since **2026-01-23** and the BoJ schedule is published ~16 months ahead. | — (stance set: stand aside completely, no position in any branch; **the vintage threat is one preliminary observation, not two, and its tolerance budget is ≈0.16pp all-month / ≈0.12pp at January against a 0.043pp rounding floor**, at **Medium** because the noise model is assumed rather than measured; three commitments — diff the Tokyo revision on **2026-09-18** and every pulse thereafter, carry the rule *with* its budget rather than as a bare result, and do not re-run the settled January-seasonality test) | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
