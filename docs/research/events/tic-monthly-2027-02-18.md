# Treasury International Capital (TIC) monthly release (December 2026 data) — the February vintage, and why it is not the control it was filed as — tic-monthly-2027-02-18

**Kind:** macro-print · **Date:** 2027-02-18 (confirmed, TSY: home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, re-fetched direct 2026-09-09, promoted from estimate this session — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["case-shiller-hpi-2027-02-23","consumer-confidence-2027-02-23","fhfa-hpi-2027-02-23","japan-cpi-2027-02-19","opex-2027-02-19","presidents-day-market-closure-2027-02-15","vix-expiration-2027-02-17","washingtons-birthday-market-closure-2027-02-15"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This event was proposed as the clean "ordinary control" for the sibling series' revision
test, and it cannot be one — it is a February vintage, which is exactly the bucket that test excluded to
get its result.** That is this document's load-bearing output, and it turns a bookkeeping entry into the
one observation that adjudicates the exclusion. [`tic-monthly-2027-01-19`](tic-monthly-2027-01-19.md)
measured that Jan/Apr/Jul/Oct "revision editions" restate a monthly cell by **$5.01bn** against
**$1.67bn** for ordinary ones (t=+3.93) — but **only after dropping February/March vintages**; left in,
the same test is a flat null (**p=0.78**). Using a February vintage as the control for that test begs its
own question. **And the stated grounds for the exclusion do not survive reading the primary.** The
sibling attributed the Feb/Mar excess to the preliminary annual survey's benchmark feed; Treasury's own
**note (d)**, on the page both sessions fetched, says that convention is **pre-September-2011** — since
December 2011 the monthly data are revised per note (c), on the Jan/Apr/Jul/Oct editions. Sequencing
agrees: this February release publishes **2027-02-18, eight days *before*** the 2027-02-26 preliminary
survey, so the survey is not in it. And the sibling's Feb/Mar bucket is **one February and two Marches**,
with its own text disqualifying the February one as sitting across a documented series break — leaving
**n=2**. **On the tape, the second finding is a correction to my own kill switch, not to a sibling's.**
The scored session **2027-02-19 is monthly options expiration**, where 2027-01-19's was clean. Measured
rather than assumed, it resolves benign — opex sessions move the 10-year **3.51bp** against **4.02bp**
non-opex (**p=0.067**, n=140 vs 2,850), and 14 of 111 verifiable TIC next-sessions have already landed on
one. But the **February** bucket is the quietest in this whole series — **2.92bp (n=12)**, max **6.00bp**
in twelve years — so the 11bp threshold inherited from the sibling is far too loose here, and this
ledger sets its own at **8.7bp**. The all-sessions baseline (**3.993bp, n=2,990**) and the sibling's
signed-drift observation (**+1.23bp** on my n=111 against its +1.14bp on n=142) both reproduce
independently. Date `confirmed`; `symbols: []`, `low` tier, no macro-keyed playbook. Nothing here is a
trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-162) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed playbook, and this event's own bucket is the quietest measured anywhere in the series — **February TIC next-sessions run 2.92bp (n=12, 2015→2026) against 3.99bp for all sessions**, with a twelve-year maximum of **6.00bp**. There is no dispersion here to sell and none to buy | Any TIC release between now and **2027-02-18** whose next session moves the 10-year more than **8.7bp** — the February bucket's own 3σ (2.92 + 3×1.93). Five releases fall in that window, the first being **2026-09-16** |
| This week | **Stand aside; nothing about this print resolves inside 162 days** | High | The reference month begins **2026-12-01**, 83 days out, and closes **2026-12-31** — every content claim here is conditional on an input that does not exist. The corridor's live forks this week are CPI **2026-09-11** and the FOMC **2026-09-16** | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 15bp above 09-08's **5.25%** and 9bp above the 2026 high (5.31%, 08-17) — which would mean the long end is repricing term premium hard enough that foreign-demand prints get read live |
| This month | **Do not treat this date as the sibling's ordinary control — re-file it as the discriminator it actually is** | High | It is a **February** vintage, the bucket `FT-tic-monthly-2027-01-19-3` had to exclude to reach p<0.001 from a p=0.78 null. A control drawn from the excluded bucket tests nothing. Registered as **FT-tic-monthly-2027-02-18-3**, two-sided | The **2027-01-19** edition itself restating an overlapping monthly cell by a mean **above $15bn**, which would make the revision-edition effect large enough that a February control's classification stops mattering to the sign |
| This quarter | **Treat "the annual survey feeds the Feb/Mar vintages" as retired, not as mechanism — Treasury's own note (d) dates it to before September 2011** | Medium | Documentary, from the primary both sessions fetched, plus sequencing: the February monthly release precedes the preliminary survey by **eight days** in 2027 and by ~two weeks historically. Under the current regime the survey reaches the monthly series through note (c)'s Jan/Apr/Jul/Oct editions | A **2027-03-18** or **2027-02-18** edition restating a **closed calendar-year** total by more than **$60bn** — the largest any Jan/Apr/Jul/Oct edition managed in the sibling's panel ($54.8bn) — which would say the Feb/Mar excess is a live mechanism whatever its documented history |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), 16:00 ET publication after the cash close, six-week-old data. The date being `confirmed` changes none of that.
- **The proposal's premise is amended, and that is this document's output.** 2027-02-18 was filed as the *ordinary control* for the revision test. It is a **February** vintage — the excluded bucket. Re-filed as the **discriminator for the exclusion**, registered two-sided as **FT-tic-monthly-2027-02-18-3**.
- **The exclusion's stated mechanism is dated by the primary.** Note (d), verbatim: *"Before September 2011, revised data back to the previous June was usually released in March to include preliminary data from the annual survey… The May release usually included the final results."* Since December 2011, revisions follow note (c) — Jan/Apr/Jul/Oct.
- **Sequencing corroborates independently of the note.** The February monthly release is **2027-02-18**; the preliminary survey is **2027-02-26**. A survey published eight days later cannot be inside it.
- **The excluded bucket is thinner than it reads.** One February and two Marches. The sibling's own text disqualifies the February one (2024-02, $745.9bn) as sitting across footnote 9's documented series break — leaving **n=2 Marches** carrying a post-hoc exclusion that flips p=0.78 to p<0.001.
- **My scored session is contaminated where the sibling's was clean, and the contamination is measured.** **2027-02-19 is monthly opex.** Opex sessions: |Δ10Y| **3.51bp (n=140)** vs **4.02bp** non-opex, **t=−1.83, p=0.067** — quieter, not noisier. **14 of 111** verifiable TIC next-sessions have already landed on one (2018-02-16 and 2024-02-16 among them, at 3bp and 6bp).
- **The February bucket is the quietest in the series, so the inherited threshold is recalibrated.** **2.92bp (n=12)**, sd 1.93, **max 6.00bp** across 2015→2026; p=0.055 vs all sessions, **p=0.139** vs a mid-month control. Kill switch set at **8.7bp**, not the sibling's 11bp — **FT-tic-monthly-2027-02-18-2**.
- **Two independent reproductions, stated as reproductions.** All-sessions |Δ10Y| **3.993bp on n=2,990** (sibling: 3.99bp), and the signed next-session drift **+1.23bp on n=111** (sibling: +1.14bp on n=142). The sibling's arithmetic holds; only its Feb/Mar interpretation moves.
- **The date corroborates but does not discriminate, unlike January's.** 11th business day of February 2027 is **02-16** holiday-aware (+2) and **02-15** holiday-blind (+3) — **both in-window**. Said against the sibling's case, which had the one date that separates them. Registered **FT-tic-monthly-2027-02-18-1**.
- **A substrate flaw, found while building the baselines and recorded because this series reads these files.** CBOE's `VIX_History.csv` carries OHLC rows on **21 of 28** checked US equity-market closures (2026-09-07 Labor Day included), and Treasury's par curve carries rows on **4 of 13** Good Fridays, averaging **5.75bp** against 3.99bp. Phantom sessions, small in effect, real in kind.
- **The content call is withheld, deliberately and more firmly than the sibling's.** December 2026 has not begun — it starts in **83 days** and closes **2026-12-31**.
- **The structural gauge, next observation (registered).** Official bills vs bonds & notes, y/y against the **December 2025** baselines **$388.5bn** and **$3,489.1bn** — **FT-tic-monthly-2027-02-18-4**.

## Initial research

### The question

This event was created by a sibling's adjacency sweep with one job written into its proposal: be the
*ordinary control* against which `FT-tic-monthly-2027-01-19-3`'s revision-edition effect is measured. Is
it actually fit for that job — and does the exclusion that effect depends on hold up against the primary?

### One-line verdict

It is not fit for that job, because it is a **February** vintage and February is the bucket that test
excluded; the exclusion's stated mechanism — the annual survey's benchmark feed — is documented by
Treasury as **pre-September-2011** practice, so this date is better re-filed as the discriminator for the
exclusion itself than as a control for what the exclusion enabled.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-09, plain curl, HTTP 200): Treasury's TIC release-dates table and its full notes block
(111,181 bytes); the **TIC press-releases-by-topic** page, which carries the complete published
release-date history for data years **2003–2022** in text — the source this session used to build its
own release list rather than inherit one; Treasury's daily par yield curve CSVs for **2014–2026**
(3,172 sessions); the live `slt_table5.txt`; and CBOE's `VIX_History.csv` and `VIX3M_History.csv`. Every
statistic below was **recomputed from those files**; where a figure matches a sibling ledger it is an
independent reproduction and is stated as one. `probe-ref.blocked` is empty — no cited source failed.
One thing was *not* rebuilt and its absence is a stated limit, not a block: the archived press-notice
PDF panel behind the sibling's revision measurement (leg 7).

### Leg 1 — the date · **SUPPORTED**, promoted `estimate` → `confirmed`, with the corroboration honestly downgraded

Treasury's 2027 table puts February's row at **18** in the *Monthly* column, with **both Quarterly
columns empty** and **"26 – prelim."** standing in the separate *Annual — Foreign portfolio holdings of
U.S. securities at end-June* column. So this is a **single-cut monthly release**, and the annual survey
is a **different release eight days later**, not a component of this one. Reference month **December
2026** by the page's stated 1.5-month lag, under the header *"All data releases occur at 4 p.m.
Washington, D.C. time"*.

Mechanical corroboration, recomputed from scratch. The page's published rule is *"the 11th business day
plus 0 to 3 days."* February 2027 carries one federal holiday, Presidents' Day on **02-15**. With
5 U.S.C. 6103 holidays **excluded**, the 11th business day is **2027-02-16**, putting the published
**02-18** at offset **+2 business days** — inside the window.

**And here the honest reading cuts against the sibling's case, so it is stated first.** Computed
**without** excluding holidays, the 11th weekday of February 2027 is **2027-02-15**, offset **+3** — also
inside the window. Unlike [`tic-monthly-2027-01-19`](tic-monthly-2027-01-19.md), where two federal
holidays made **01-19** the single published date that *separates* the holiday-aware convention from the
holiday-blind one, **February 2027 discriminates nothing**. The rule corroborates the published date here
without testing anything, which is a weaker claim than the sibling's and is recorded as one.

Across all **24** published 2026 and 2027 dates the holiday-aware convention lands in-window **22** times
and hits **9** exactly, independently reproducing the sibling's count — with the same two signed misses
(**2026-01-15** at −1 bd, **2026-07-14** at −2 bd), both *early* publications in revision months.

Promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md) and the five TIC siblings: one
named Treasury primary plus independent mechanical corroboration. The `estimate` ground the proposal
cited was this lane's **no-self-confirm** limit — the entry was discovered by the
`tic-monthly-2027-01-19` sweep, not researched. That is cleared here. `confirmed` describes **the
published schedule and nothing else**; the same page carries the closure-revision notice.

### Leg 2 — is this event the control it was filed as? · **REFUTED**

The proposal is explicit about its purpose:

> *"2027-02-18 is the ORDINARY edition standing immediately after 2027-01-19's revision edition, so it is
> the control observation that test needs: the same diff run one month later, against a vintage the
> annual revision has already passed through."*

That reasoning classifies editions on **one** axis — revision-month (Jan/Apr/Jul/Oct) versus everything
else. But the test it is a control *for* runs on a **second** axis the proposal does not mention.
`FT-tic-monthly-2027-01-19-3`'s result exists only because **February and March vintages were removed**:

| Panel | revision-vintage mean \|revision\| | ordinary mean | p |
|---|---|---|---|
| Feb/Mar **excluded** (the registered result) | $5.01bn | $1.67bn | **p<0.001** |
| Feb/Mar **left in** (printed beside it) | $5.01bn | $4.46bn | **p=0.78** |

A February vintage is therefore not a member of the "ordinary" class that test uses. It is a member of
the class that was **taken out of the test to make the effect appear**. Scoring the effect against an
observation drawn from the excluded bucket cannot confirm it and cannot refute it — whatever the
February edition restates, the reading is already determined by which panel you accept.

**The correct job for this date is the opposite one, and it is a better job.** The exclusion is the
single most contestable choice in the sibling's document — its own limits section says so. A February
vintage measured under the current regime is precisely the observation that adjudicates it:

- If **2027-02-18 restates like an ordinary vintage** (near $1.67bn), the exclusion was never about
  February, and leg 3's effect is at best a March artifact and at worst manufactured.
- If **2027-02-18 restates like the Feb/Mar outliers** (an order of magnitude above the revision
  editions), February really is a distinct mechanism and the exclusion was sound.

Registered two-sided as **FT-tic-monthly-2027-02-18-3** so neither reading can be retrofitted.

### Leg 3 — what the exclusion was attributed to, read against the primary · **REFUTED as a current mechanism**

The sibling's grounds were *"footnote 9's series break and the annual-survey benchmark feed."* The
release-dates page carries the survey's own schedule and, in **note (d)**, its own history. Verbatim:

> *"(d) The monthly table showing Major Foreign Holders of U.S. Treasury Securities … Beginning December
> 2011, the data are based on the monthly Form SLT data, and revised as described in (c) above. **Before
> September 2011, revised data back to the previous June was usually released in March to include
> preliminary data from the annual survey of foreign holdings of U.S. securities at end-June of the
> previous year. The May release usually included the final results from that survey.**"*

Three things follow, and only the third is arguable.

1. **The March-carries-the-survey convention is explicitly dated to before September 2011.** The sibling's
   attribution describes a regime Treasury's own page says was replaced fifteen years ago. Since December
   2011, note (c) governs: *"The January, April, July, and October releases reflect revised data for the
   past year."* The survey's results reach the monthly series through **the revision editions**, which is
   the mechanism leg 3 was measuring in the first place.
2. **Sequencing corroborates it without needing the note.** The preliminary survey publishes on the
   **last business day of February** — **2027-02-26**, recomputed (02-28 is a Sunday), matching the
   page's own cell. The February monthly release is **2027-02-18**. A release cannot contain a survey
   published eight days after it. The same ordering holds historically: every February monthly release
   from 2004 to 2026 landed on the 15th–18th, always before month-end.
3. **The bucket is thinner than "Feb/Mar" makes it sound.** The sibling's three outliers are **2024-02
   ($745.9bn), 2025-03 ($127.9bn), 2026-03 ($68.5bn)** — one February and two Marches. Its own text
   disqualifies the February one, which *"sits on the 2021/2022 columns across the documented series
   break, so part of that $745.9bn is a definitional change and not a data revision."* Accept that
   caveat, as its author does, and a post-hoc exclusion that moves a test from **p=0.78** to **p<0.001**
   is carried by **two March vintages**.

**What this does and does not do.** It does not refute leg 3's arithmetic, which is not in dispute and
which this session did not rebuild (leg 7). It removes the *documented mechanism* the exclusion was
justified by, which matters exactly because the exclusion is post-hoc: an exclusion with a named current
mechanism is a modelling choice, and an exclusion without one is data-dependent. The honest status of
`FT-tic-monthly-2027-01-19-3` after this reading is **live but weaker than registered**, and its
falsifier stays untouched.

A live alternative is left standing rather than asserted: **March is a triple-release month** — the 2027
table reads `March | 18 | 18 | 31`, monthly plus quarterly plus gross external debt — where February is
single-cut. That is a difference between the two months this calendar can actually observe, and it is why
`tic-monthly-2027-03-18` is proposed here as the companion.

### Leg 4 — the tape, on a release list this session built itself · **SUPPORTED as a null**, with the sibling's numbers reproduced

The press-releases-by-topic page publishes the full release-date history for data years 2003–2022 as
text. Parsed, it yields **104** releases in the 16:00-ET era (from **2014-09-16**, the boundary Treasury's
own page documents) through **2023-02-15**; adding the eight published 2026 dates and two dates the
business-day rule fixes for 2024/2025 gives a **verifiable set of 112, scored on 111**. That is a
differently-sourced sample from the sibling's n=143 and it lands in the same place:

| Sample (\|Δ10Y\| on the session after a release) | n | mean | vs all sessions |
|---|---|---|---|
| **All sessions, 2014-09-16 → 2026-08-31** | **2,990** | **3.993bp** (sd 3.44) | — |
| This session's verifiable release set | 111 | 3.495bp | t=−1.43, **p=0.153** |
| Sibling's n=143 set (for comparison) | 143 | 3.51bp | p=0.087 |
| **February releases** | **12** | **2.917bp** (sd 1.93) | t=−1.92, **p=0.055** |
| February vs mid-month control (3.761bp, n=687) | 12 | 2.917bp | t=−1.48, **p=0.139** |

**The all-sessions baseline reproduces to the third decimal** — 3.993bp on n=2,990, against the sibling's
3.99bp. So does its signed-drift observation: **+1.225bp** on my 111 releases against **+0.072bp** for all
sessions, where the sibling reported +1.14bp on 142. Two independent builds of the release list, two
independent pulls of the par curve, the same answer. The sibling's refutation of the series' quiet-tape
claim stands, and my smaller sample makes it slightly weaker still (p=0.153 against its 0.087).

**The February bucket is the finding, and it is the tightest distribution this series has produced.**
Twelve February releases from 2015 through 2026 — nine read directly off the press archive, one off the
published 2026 table, two (2024-02-15, 2025-02-18) fixed by the business-day rule and flagged as
rule-derived — give **2.92bp**, sd **1.93**, and a **twelve-year maximum of 6.00bp**:

```
2015-02-19  4.0    2018-02-16  3.0    2021-02-17  1.0    2024-02-16  6.0
2016-02-17  3.0    2019-02-19  1.0    2022-02-16  2.0    2025-02-19  2.0
2017-02-16  6.0    2020-02-19  1.0    2023-02-16  5.0    2026-02-19  1.0
```

It clears neither baseline conventionally (p=0.055 against all sessions, **p=0.139** against the matched
mid-month control), so this is **not** a claim that February is special. It is a statement about
**dispersion**, and dispersion is what a kill switch is calibrated on.

### Leg 5 — my scored session is an opex day, and that is measured rather than waved through · **SUPPORTED**, benign

`FT-tic-monthly-2027-01-19-2` could say its setup was clean: only a VIX expiration on the scored session.
Mine cannot. **2027-02-18 is a Thursday and 2027-02-19 is the third Friday of February — monthly options
expiration**, tracked here as `opex-2027-02-19` at `medium` impact. Inheriting the sibling's 11bp
threshold onto a contaminated session without checking would have been the sloppy move.

Checked, on the same 2,990 sessions:

| Session class | n | mean \|Δ10Y\| |
|---|---|---|
| Monthly opex | 140 | **3.507bp** |
| Non-opex | 2,850 | **4.017bp** |
| Welch | | **t=−1.83, p=0.067** |

**Opex sessions are marginally *quieter* in the 10-year, not noisier** — which is what a rates ledger
should expect from an equity-derivatives event, and it is worth having measured rather than assumed. The
precedent is not novel either: **14 of the 111** verifiable TIC next-sessions have already landed on a
monthly opex, including **2018-02-16 (3.0bp)** and **2024-02-16 (6.0bp)**, both Februaries, both inside
the February bucket above.

So the contamination is real, named, and small. **What it changes is the threshold, in the other
direction from the worry.** The February bucket's own 3σ is **2.92 + 3×1.93 = 8.7bp**; the sibling's 11bp
was 3σ of a distribution with sd 3.61 that this event does not belong to. Set at 8.7bp, the test can
actually fail — at 11bp, on a bucket whose twelve-year maximum is 6.00bp, it could not.

### Leg 6 — the structural read and the content call · **MIXED**, both withheld and one baseline registered

The data tip has not moved: `slt_table5`'s latest column is still **June 2026** (the next release is
2026-09-16), and its decomposition is confirmed against the live file rather than inherited — official
bills **457.3 (Apr) → 396.2 (May) → 360.6 (Jun)**, June now below the year-ago 402.6.

For reference month **December 2026** the y/y comparison is against **December 2025**: official Treasury
bills **$388.5bn**, official bonds & notes **$3,489.1bn** (foreign official $3,877.7bn, grand total
$9,269.5bn) — read off the live file's `2025-12` column this session. Registered as
**FT-tic-monthly-2027-02-18-4**, the sequel to `FT-tic-monthly-2027-01-19-4` on a later month.

**The content call is withheld, and more firmly than the sibling withheld its own.** Its reference month
began in 53 days; mine begins in **83** and closes **2026-12-31**. The sibling's valuation model
(`valchg% = 0.0833 − 0.04138 × Δ10Y`, R² 0.9466) is not re-fit here — nothing new could enter it, and
re-publishing a map for a month that has not started would be ceremony. The first pulse landing after
2026-12-31 should register a band against a fixed Δ.

### Leg 7 — honest limits

- **The revision panel was not rebuilt, and that is the largest gap in this document.** Leg 2's
  re-classification and leg 3's mechanism argument are documentary and arithmetic; neither re-measures
  the $5.01bn / $1.67bn figures, which are taken from the sibling as reported. The press-notice
  filenames this session guessed (`ticpress2602.pdf` and three siblings under
  `home.treasury.gov/system/files/136/`) returned **404** — a wrong guess, **not a blocked fetch**, so
  `probe-ref.blocked` stays empty; the sibling reached the notices through their individual
  press-release pages. A future pulse should rebuild the panel and add the **February** vintages
  explicitly, which is the observation leg 2 says is missing.
- **Two of the twelve February releases are rule-derived, not published.** 2024-02-15 and 2025-02-18 come
  from the 11th-business-day rule, because the press archive stops at data year 2022 and the current
  page starts at 2026. Dropping both leaves n=10 at **2.90bp** — the bucket's shape does not depend on
  them, but they are not primary and are flagged as such.
- **The February bucket is n=12.** A 3σ threshold from twelve observations is a rule of thumb, not a
  distribution. It is set deliberately tighter than the sibling's precisely so it can fail.
- **A substrate flaw affecting every ledger in this series, found in passing.** CBOE's
  `VIX_History.csv` carries full OHLC rows on **21 of 28** checked US equity-market closures — 2026-09-07
  (Labor Day), 2026-02-16, 2025-11-27, 2024-07-04 among them — with values distinct from the
  neighbouring sessions, so they are not duplicates. Treasury's par curve carries rows on **4 of 13**
  Good Fridays (2015-04-03, 2021-04-02, 2023-04-07, 2026-04-03), days the cash bond market is shut by
  SIFMA recommendation, and those four average **5.75bp** against 3.99bp. At 4 rows in 2,990 the effect
  on any baseline here is immaterial; the *kind* of error is not, and it is recorded so the next session
  filters rather than rediscovers.
- **The date corroboration is weak here and is stated as weak.** February 2027 does not separate the
  holiday-aware convention from the holiday-blind one; both readings land in-window. The published table
  is the primary and the rule adds little.
- **The reference month does not exist yet.** Every December-2026 figure is a baseline, not a forecast,
  and nothing here keys an action to one.
- **Custodial mis-attribution.** Treasury's Table 5 note: securities in overseas custody accounts *"may
  not be attributed to the actual owners"*. The official/private and bills/coupons splits are more
  robust than any country line; no country-level claim is made.
- **No consensus, no whisper.** Searched, not asserted — TIC carries no sell-side forecast distribution,
  which is part of why a surprise cannot be priced.
- **`confirmed` covers the date and nothing else.** Not the occurrence, not the content, not the
  revision size. No house playbook is macro-keyed in any case.

## Stance & kill switches

**Stance (initial, 2026-09-09).** **Stand aside on every horizon; this document's output is a
re-classification of its own event and a recalibrated kill switch, not a position.** The date is
`confirmed` off Treasury's own February row — a **single-cut** monthly release, with the 2027-02-26
preliminary annual survey standing as a **separate release eight days later** — though the mechanical
corroboration is honestly weaker than the January sibling's, since February 2027 does not discriminate
the holiday-aware convention from the holiday-blind one. The substantive finding is that **this event is
not the control it was proposed as**: it is a **February** vintage, the bucket
`FT-tic-monthly-2027-01-19-3` excluded post-hoc to move its test from a flat null (p=0.78) to p<0.001, so
scoring that effect against it would beg the question. Re-filed as the **discriminator for the exclusion
itself**, two-sided. The exclusion's *stated* mechanism does not survive the primary: Treasury's **note
(d)** dates the survey-feeds-March convention to **before September 2011**, sequencing shows the February
release preceding the survey by eight days, and the excluded bucket is one February — disqualified by the
sibling's own series-break caveat — and **two Marches**. That leaves `FT-tic-monthly-2027-01-19-3` live
but weaker than registered; its arithmetic is not disputed and was not rebuilt here. On the tape, the
sibling's work **reproduces independently** on a release list this session built from the press archive
(all-sessions **3.993bp on n=2,990** against its 3.99bp; signed drift **+1.23bp on n=111** against its
+1.14bp on n=142; the quiet-tape claim fails again, at p=0.153). The one correction is to **my own**
test: the scored session **2027-02-19 is monthly opex**, measured as benign (opex **3.51bp** vs **4.02bp**
non-opex, p=0.067; 14 of 111 TIC next-sessions have already landed on one), but the **February bucket is
the quietest in the series at 2.92bp (n=12, max 6.00bp)**, so the inherited 11bp threshold is replaced by
**8.7bp** — a test that can actually fail. The content call is withheld: December 2026 begins in 83 days.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The release does not publish on 2027-02-18** (**FT-tic-monthly-2027-02-18-1**), whether from a
   Washington D.C. closure, a funding lapse or a schedule revision. Treasury's own notice is the
   mechanism. A release on 02-18 that *also* carries a quarterly or annual cut scores partial, never a
   clean pass — the published row promises a single cut.
2. **The February tape null breaks.** \|Δ10Y\| on **2027-02-19** exceeds **8.7bp**
   (**FT-tic-monthly-2027-02-18-2**) — the February bucket's own 3σ, not the sibling's 11bp. The scored
   session is a monthly opex, which is named in the test rather than hidden by it.
3. **February restates like an ordinary vintage.** The 2027-02-18 edition moves overlapping monthly cells
   by a mean **at or below $1.67bn** (**FT-tic-monthly-2027-02-18-3**), which says the Feb/Mar exclusion
   was never about February and leg 3's effect is a March artifact at best.
4. **February restates like the outliers.** The same edition moves a **closed calendar-year** total by
   more than **$60bn** — above the largest any revision edition managed in the sibling's panel ($54.8bn)
   — which says February is a live distinct mechanism whatever note (d)'s history, and vindicates the
   exclusion. Pre-stated in both directions so neither can be read as confirmation after the fact.
5. **The March companion contradicts the February reading.** `tic-monthly-2027-03-18`, proposed here,
   restates far more than this edition does — which would relocate the whole effect to March's
   triple-release structure and retire "Feb/Mar" as a category.
6. **The bill drawdown reverses.** Official **bonds & notes** fall faster in y/y percentage terms than
   official **bills** for reference month December 2026 (**FT-tic-monthly-2027-02-18-4**), measured
   against the December 2025 baselines **$388.5bn** and **$3,489.1bn**.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-162 | Initial research banked (above). **Canonical `<id>.json` written from the one existing proposal** (`from-tic-monthly-2027-01-19`), which it now shadows. **Date PROMOTED `estimate` → `confirmed` (`TSY:`)**: Treasury's 2027 February row reads **18 monthly** with both quarterly columns **empty** and **"26 – prelim."** in the *separate* annual-survey column — a single-cut release with the survey standing 8 days later, not inside it. Corroboration stated as **weaker than the January sibling's**: 11th bd is **02-16** holiday-aware (+2) and **02-15** holiday-blind (+3), **both in-window**, so February 2027 discriminates nothing. Convention scores **22/24 in-window, 9/24 exact** across 2026-27 with the same two signed misses (2026-01-15 −1bd, 2026-07-14 −2bd) — independently reproducing the sibling. **Finding 1 — this event is NOT the control it was proposed as (REFUTED).** The proposal filed it as the *ordinary* control for `FT-tic-monthly-2027-01-19-3`. It is a **February** vintage — precisely the bucket that test **excluded post-hoc** to move from a flat null (**$5.01bn vs $4.46bn, p=0.78**) to its registered result (**$5.01bn vs $1.67bn, p<0.001**). A control drawn from the excluded class cannot confirm or refute the effect. **Re-filed as the DISCRIMINATOR for the exclusion**, two-sided (**FT-…-3**). **Finding 2 — the exclusion's stated mechanism is dated by the primary (REFUTED as current).** The sibling attributed Feb/Mar to the annual survey's benchmark feed. Treasury's **note (d)**, verbatim from the page both sessions fetched: *"Before September 2011, revised data back to the previous June was usually released in March to include preliminary data from the annual survey… The May release usually included the final results."* Since **December 2011** the monthly data are revised per note (c) — Jan/Apr/Jul/Oct. Sequencing corroborates independently: the February monthly release is **2027-02-18**, the preliminary survey **2027-02-26** (last bd of February, 02-28 being a Sunday — recomputed, matching the published cell), and every February release 2004→2026 landed on the 15th–18th. And the bucket is thin: **one February and two Marches**, with the sibling's own text disqualifying the February one (2024-02, $745.9bn) as sitting across footnote 9's series break — leaving **n=2** carrying an exclusion that flips p=0.78 to p<0.001. `FT-tic-monthly-2027-01-19-3` is **live but weaker than registered**; its arithmetic is not disputed and was **not rebuilt here** (limit stated). A live alternative left standing, not asserted: **March is a triple-release month** (`March | 18 | 18 | 31`) where February is single-cut. **Finding 3 — the sibling's tape work reproduces on an independently built release list.** The **press-releases-by-topic** page publishes the full release-date history for data years **2003–2022** as text; parsed, it gives **104** releases in the 16:00-ET era through 2023-02-15, plus the 8 published 2026 dates and 2 rule-derived (2024-02-15, 2025-02-18) = **112, scored on 111**. All-sessions baseline **3.993bp, n=2,990, sd 3.44** — the sibling's 3.99bp **to the third decimal**. Release set **3.495bp, p=0.153** (its n=143 gave 3.51bp, p=0.087) — the quiet-tape claim fails again, slightly harder. Signed drift **+1.225bp vs +0.072bp** on n=111, reproducing its +1.14bp on n=142. **Finding 4 — the February bucket is the tightest distribution in this series.** n=12 (2015→2026), mean **2.917bp**, sd **1.93**, **twelve-year max 6.00bp**; p=0.055 vs all sessions and **p=0.139** vs a mid-month control (3.761bp, n=687) — so **not** a claim that February is special, a claim about **dispersion**. **Finding 5 — my scored session is contaminated where the sibling's was clean, and it is measured.** **2027-02-19 is monthly opex** (`opex-2027-02-19`, medium). Opex sessions: **3.507bp (n=140)** vs **4.017bp** non-opex (**t=−1.83, p=0.067**) — *quieter*, not noisier, as a rates ledger should expect from an equity-derivatives event. **14 of 111** TIC next-sessions have already landed on one, including **2018-02-16 (3.0bp)** and **2024-02-16 (6.0bp)**. **Threshold recalibrated in the other direction from the worry:** the sibling's **11bp** is 3σ of a distribution (sd 3.61) this event does not belong to and could never fail on a bucket whose max is 6.00bp; set at **8.7bp** = the February bucket's own 3σ. **Finding 6 — baselines registered, content withheld more firmly than the sibling's.** `slt_table5` tip still **June 2026**; April→June bills **457.3 → 396.2 → 360.6** confirmed against the live file. December 2025 y/y baselines read off the `2025-12` column: official bills **$388.5bn**, bonds & notes **$3,489.1bn** (official total $3,877.7bn, grand total $9,269.5bn) — **FT-…-4**. Reference month December 2026 begins in **83 days** (the sibling's began in 53), so the valuation model is **not re-fit** and nothing is registered from it. **Finding 7 — a substrate flaw in the files this whole series reads.** CBOE's `VIX_History.csv` carries full OHLC rows on **21 of 28** checked US equity-market closures (2026-09-07 Labor Day, 2026-02-16, 2025-11-27, 2024-07-04 …) with values distinct from neighbouring sessions, so not duplicates; Treasury's par curve carries rows on **4 of 13** Good Fridays (2015-04-03, 2021-04-02, 2023-04-07, 2026-04-03) — days the cash bond market is shut by SIFMA recommendation — averaging **5.75bp** vs 3.99bp. Immaterial at 4/2,990; recorded so the next session filters rather than rediscovers. **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* **8 tracked events within ±5 days**, the same count as 2027-01-19 but a worse corridor — Presidents' Day / Washington's Birthday closure 02-15 (two ids, one closure), VIX expiration 02-17, **opex 02-19**, Japan CPI 02-19, and a **three-print housing/confidence cluster on 02-23** (Case-Shiller, Conference Board confidence, FHFA HPI). The release opens a **4-session week** behind the Monday closure. *Vol:* **VIX 15.72**, VIX3M **18.39** (2026-09-08 CBOE cash closes — identical to the sibling's readings, same tape). 10Y **4.80%**, 30Y **5.25%**, 2Y **4.39%** (09-08 par curve). Baseline set; nothing to diff against yet. *Geopolitical/policy:* nothing dated touching this print; no FOMC blackout overlaps 02-18 on the tracked calendar. *Event tape:* no consensus distribution exists for TIC. **New dated adjacencies: TWO proposed.** (1) **`tic-monthly-2027-03-18`** — the March companion and the observation finding 2's live alternative needs, since 2 of the 3 Feb/Mar outliers are Marches and March is a **triple** release (11th bd 03-15, published 03-18 at offset **+3**, at the window's edge). (2) **`tic-annual-survey-final-2027-04-30`** — the final survey report, last business day of April 2027 (a Friday, offset **+0**), the other half of the prelim the sibling proposed and the release note (d) pairs with it. Declined on precedent, unchanged: the 2027-03-31 gross external debt cut (no press release) and the 2027-06-30 quarterly cut (outside the corridor). **Blocked fetches:** none — `probe-ref.blocked` is empty. One absence recorded and explicitly *not* counted as a block: four guessed press-notice PDF filenames under `home.treasury.gov/system/files/136/` returned **404**, a wrong guess rather than a failed cited source, so the sibling's revision panel was **not rebuilt** — the largest stated gap in this document. | — (stance set) | 2026-10-09 (`low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
