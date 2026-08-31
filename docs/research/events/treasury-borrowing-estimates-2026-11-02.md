# Treasury Marketable Borrowing Estimates (Q4 2026 / Q1 2027) — treasury-borrowing-estimates-2026-11-02

**Kind:** macro-print · **Date:** 2026-11-02 (confirmed, TSY: home.treasury.gov most-recent-quarterly-refunding-documents, fetched direct 2026-08-31) · **Impact:** low
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":15.29,"daysBand":"low:15+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","ism-services-2026-11-04","jobs-2026-11-06","meta-2026-10-28-print","midterm-elections-2026-11-03","pce-2026-10-29","sloos-2026-11-02","treasury-refunding-2026-11-04"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside on the release, and read it for one number rather than trading it. This is the
**quantity** half of refunding week — the aggregate dollar figure Treasury publishes at 15:00 ET on the
Monday, which the 11-04 statement then allocates across the curve. Measured this session on all
**15** releases since 2023, every date read off Treasury's own press release: **release day is nil.**
TLT closed 4/8 up at **+0.056%** on the eight releases that weren't sitting on an FOMC meeting-eve
(permutation p=**0.860**), SPY 6/8 at +0.201% (p=**0.704**), ^TNX 4/8 at +0.041% (p=**0.989**). Both
episodes market memory attributes to this release **fail on the tape**: on 2023-07-31, the
$1.007-trillion print that supposedly set off the bond rout, TLT closed **+0.24%** — the 21st
percentile of its own move distribution — and the selloff arrived 24–48h later with the Fitch
downgrade and the Wednesday coupon increase; on 2023-10-30, the downward revision that supposedly
sparked the rally, TLT closed **−0.45%**, the wrong direction, and the rally came on 11-01, an FOMC
day. The reason the number doesn't trade is structural: the headline revision is a **cash-balance
variable, not a deficit variable** — all five editions with a revision past ±$250B sit inside the two
debt-limit cycles, and Treasury itself decomposed the largest of them (2025-07-28) as +$453B headline
but only **+$60B** excluding the cash balance. What makes this edition worth reading anyway is the
**Jan–Mar 2027 estimate** it publishes for the first time: debt outstanding was **$40.078T** on
2026-08-27 against the **$41.1T** statutory limit — **$1.02T of headroom** — while debt grew **$2.794T**
over the trailing year (~$698B/quarter), which puts exhaustion inside that very quarter. The date is
now **confirmed** (Treasury's own page, fetched direct today), and confirmed does not mean tradeable:
this session's measurement is a refusal.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-63) | Stand aside | High | Sixty-three days out on a release whose content does not exist yet; the Oct–Dec 2026 anchor ($628B, end-Dec cash $850B) was set 2026-08-03 and nothing has revised it. | Treasury publishing an off-cycle borrowing revision, or a debt-limit event forcing extraordinary measures, before **2026-11-02** |
| This week | Stand aside | High | Nothing this week keys off this date; the Sep 1→4 macro cluster (ISM-mfg + JOLTS 9/1, ADP 9/2, ISM-svcs 9/3, jobs 9/4) owns the near tape. | A dated Treasury issuance-policy announcement inside the 09-01→09-07 week |
| This month | Watch, do not trade | Medium | The only dated Treasury item in September is the enlarged $4B/op long-end buyback starting **09-09**, whose own announcement-day move round-tripped inside 24 hours. | Long-end yields easing durably for multiple sessions after 09-09, which would make the buyback channel a bigger lever than the 08-19→08-20 round trip implies |
| This quarter | Stand aside on the print; read **one number** | Medium | Release day is measurably an ordinary session (TLT p=0.860, SPY p=0.704, ^TNX p=0.989 on the clean subset), and 11-02 is unattributable anyway — **13** tracked events sit within ±5 days. The information is in the document, not the tape. | The **2026-11-02** release attaching debt-limit language to its Jan–Mar 2027 cash-balance assumption, or revising Oct–Dec 2026 by more than ±$150B against the $628B set on 08-03 — either says the quiet regime broke |

**Signals & conditions** — the buy/sell/hold triggers:

- **The number to read first on 11-02:** the **Jan–Mar 2027** borrowing estimate and its end-March cash-balance assumption. That is the first quarter in which the $41.1T limit plausibly binds on current growth.
- **The sentence to check second:** whether the release carries *"assume enactment of a debt limit suspension or increase"* on its cash-balance footnote. That footnote appeared in exactly **4 of 15** editions since 2023, every one with the limit live or days from reinstating.
- **Oct–Dec 2026 revised by more than ±$150B** vs the $628B announced 08-03 → this ledger's small-revision base case is void and the stance gets re-derived, not patched.
- **Do not attribute any 11-02 move to this release.** ISM Manufacturing (`estimate`) and SLOOS (`confirmed`) share the day, the FOMC decided 10-28, four mega-cap prints land 10-28/10-29, and the midterms are the next morning.
- **Do not carry a Monday read into Wednesday.** The quantity surprise is Monday's; the composition and guidance surprise is [11-04](treasury-refunding-2026-11-04.md)'s, and that ledger owns it.
- **Watch (dated):** primary-dealer agenda **10-16** (est, proposed this PR) · FOMC **10-28** · **this, 11-02 15:00 ET** · SLOOS **11-02** · ISM-mfg **11-02** · midterms **11-03** · refunding **11-04 08:30** · jobs **11-06**.

## Initial research

**The question, plainly:** what does the Monday borrowing-estimate release actually decide, does it
move the tape, what is the consensus for the November 2026 edition, and which of our tracked names
carry sensitivity — around 2026-11-02?

**One-line verdict:** the release is a **measured non-event on the day**, the two famous episodes
attributed to it belong to other sessions entirely, and the reason is that its headline number is a
cash-balance variable rather than a deficit variable — so the honest call is stand aside on the price
and read the Jan–Mar 2027 estimate against a debt ceiling with $1.02T of headroom left.

### Method

Sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print
mode), plus a first-party measurement on Yahoo **dividend-adjusted** daily closes
(`scripts/research/market-data.mjs` → `bars()`; instrument caches busted before the run per the
cache-discipline rule). Instruments **TLT · IEF · ^TNX · SPY · QQQ · ^VIX**, window 2023-01-01 →
2026-08-31 (n=918 sessions). Event set: the **15** borrowing-estimate releases since 2023, each date
and each revision figure read off the Treasury press release itself. Significance by two-sided
permutation test (200,000 iterations) against random same-size draws from the same session pool.
Placebo columns T−2 … T+2 on every subset.

**Sourcing note, and it corrects a sibling's stated limit.** The
[`treasury-refunding-2026-11-04`](treasury-refunding-2026-11-04.md) ledger recorded that
home.treasury.gov timed out on four direct fetches and filed its date `estimate` on that basis. That
limit is a **tool artifact, not a network fact**: the harness's WebFetch times out on
home.treasury.gov (reproduced twice this session), but plain `curl` from Bash returns HTTP 200 on
every one of those URLs. Fetched directly today: the most-recent-refunding-documents page, the
financing-estimates index, and all **15** borrowing-estimate press releases. That fires the sibling's
own kill switch (*"home.treasury.gov becoming directly fetchable — resolves the gated-primary
limit"*) and is banked here for the whole lane.

### Conviction legs, tested

**1. What the release decides, and its date — SUPPORTED, from the primary.** Treasury's
most-recent-refunding-documents page states *"DOCUMENTS RELEASED at 3:00 PM Monday, august 3, 2026 /
Financing Estimates: 2026 - 3rd Quarter"* and, for that slot, *"(The next release is scheduled for
**November 2, 2026**)"*; the 08:30 Wednesday slot separately names November 4. The release publishes
the current quarter's privately-held net marketable borrowing estimate, its revision against the
prior quarter's figure, the assumed end-of-quarter cash balance, and the **first** estimate for the
following quarter. So on 11-02 the market gets a revision to Oct–Dec 2026 against the **$628B**
announced 08-03 (end-December cash assumption $850B), plus the opening Jan–Mar 2027 number.
**Entry promoted `estimate` → `confirmed` (`TSY:`) in this PR on that primary.**

**2. Release day is nil — SUPPORTED, and this is the session's central measurement.** All 15
releases, close-to-close:

| Instrument | All 15 (T+0) | Clean (8, no FOMC-eve) | FOMC-eve (7) | Unconditional |
|---|---|---|---|---|
| TLT | 7/15 up, −0.091% (p=0.703) | **4/8 up, +0.056%** (p=**0.860**) | 3/7 up, −0.260% (p=0.449) | 50.1% up, −0.003% |
| IEF | 7/15 up, −0.061% (p=0.531) | 4/8 up, −0.006% (p=0.924) | 3/7 up, −0.125% (p=0.429) | 50.6% up, +0.010% |
| ^TNX | 8/15 up, +0.189% (p=0.684) | **4/8 up, +0.041%** (p=**0.989**) | 4/7 up, +0.358% (p=0.561) | 49.8% up, +0.035% |
| SPY | 10/15 up, +0.175% (p=0.694) | **6/8 up, +0.201%** (p=**0.704**) | 4/7 up, +0.146% (p=0.855) | 56.6% up, +0.086% |
| QQQ | 10/15 up, +0.193% (p=0.809) | 5/8 up, +0.246% (p=0.765) | 5/7 up, +0.133% (p=0.973) | 56.8% up, +0.119% |
| ^VIX | 9/15 up, +1.187% (p=0.631) | 4/8 up, +1.650% (p=0.583) | 5/7 up, +0.657% (p=0.878) | 43.8% up, +0.256% |

No instrument, no subset, clears anything. The largest release-day TLT move in the whole set
(2023-05-01, −2.88%, 100th percentile) is the morning **First Republic was seized and sold to
JPMorgan** — not a supply session. Ten of the fifteen release days sit at or below the 70th
percentile of TLT's own |move| distribution.

**3. The Monday's confound is the Wednesday's, seen 48 hours earlier — SUPPORTED, and it
cross-validates the sibling.** Seven of the fifteen releases (2023-01-30 · 2023-05-01 · 2023-10-30 ·
2024-01-29 · 2024-04-29 · 2024-07-29 · 2025-07-28) fall on the **eve of a two-day FOMC meeting** — by
arithmetic the same seven quarters in which the sibling found the refunding *Wednesday* colliding
with an FOMC decision, since Monday+2 sessions is that Wednesday. The placebo columns make the
consequence visible: everything that looks like a bond bid sits at T+1/T+2 **and only on the eve
subset** — TLT T+1 eve 5/7 up at **+0.704%** (p=**0.039**), T+2 eve 6/7 at **+0.879%** (p=**0.010**),
^TNX T+2 eve 1/7 at **−1.503%** (p=**0.004**) — while the clean subset is flat across every column
(TLT T−2/−1/0/+1/+2 = −0.074 / −0.141 / **+0.056** / +0.180 / −0.037%). The T+2 clean figure,
**4/8 at −0.037%**, is the sibling's refunding-day number to three decimals, reproduced from a
different anchor and a separately-sourced date list. **2026-11-02 is not an FOMC eve** (the Fed
decides 10-28), so the clean subset governs it.

**4. Both canonical episodes belong to other sessions — SUPPORTED, and this is the correction worth
banking.** The two dates market memory attributes to this release:

- **2023-07-31**, the $1.007-trillion estimate (+$274B vs May): TLT closed **+0.24%**, the **21st
  percentile** of its own distribution. Nothing happened. TLT then fell **−1.64%** on 08-01 and the
  rout ran through 08-02 — the sessions carrying the **Fitch downgrade** (evening of 08-01) and the
  Wednesday statement that actually **raised coupon sizes**. The Monday number was known and ignored.
- **2023-10-30**, the −$76B downward revision to $776B, remembered as the trigger for the
  autumn bond rally: TLT closed **−0.45%**, ^TNX **+0.62%** — the wrong direction on "good" supply
  news. The rally landed on **11-01**, an FOMC decision day, and the sibling measures that session at
  TLT +2.17%, the 97th percentile.

So the release with the loudest reputation in this calendar has, on its two most-cited dates,
a 21st-percentile session and a wrong-signed one.

**5. The revision is a cash-balance variable, not a deficit variable — SUPPORTED, and it explains leg
2.** Every revision figure below is Treasury's own sentence (*"the borrowing estimate is $X billion
higher/lower than announced in <month>"*), read off the release:

| Release | Rev ($B) | Debt-limit state | Release | Rev ($B) | Debt-limit state |
|---|---|---|---|---|---|
| 2023-01-30 | **+353** | limit hit 01-19, EM live | 2025-02-03 | −9 | limit reinstated 01-02, EM live |
| 2023-05-01 | **+449** | standoff, X-date June | 2025-04-28 | **+391** | EM live, cash drawn to $406B |
| 2023-07-31 | **+274** | suspended 06-03; cash rebuild | 2025-07-28 | **+453** | raised 07-04; cash rebuild |
| 2023-10-30 | −76 | — | 2025-11-03 | −21 | — |
| 2024-01-29 | −55 | — | 2026-02-02 | −3 | — |
| 2024-04-29 | +41 | — | 2026-05-04 | +79 | — |
| 2024-07-29 | −106 | — | 2026-08-03 | +68 | — |
| 2024-10-28 | −19 | forward-flagged | | | |

**All five editions past ±$250B sit inside the two debt-limit cycles; none of the ten quiet ones
does.** The claim runs one way only — 2025-02-03 was a live-limit edition and revised just −$9B — but
it is enough to disqualify the revision as a fiscal-news variable. Treasury says as much itself: the
largest revision on the record, +$453B on 2025-07-28, was *"primarily due to the lower
beginning-of-quarter cash balance"*, and **excluding it the figure was +$60B**. Consistent with that,
the correlation between revision and same-day TLT return is r=**−0.480** on all 15 — right sign — but
**−0.229** once 2023-05-01 (the First Republic session) is dropped, and the big-revision subset
round-trips: TLT **−0.605%** at T+0 then **+0.836%** at T+1.

**6. What makes this edition non-boilerplate is the quarter it opens, not the quarter it closes —
SUPPORTED.** Total public debt outstanding was **$40.0775T** on 2026-08-27 (fiscaldata.treasury.gov
debt-to-the-penny, fetched today) against the **$41.1T** limit enacted 2025-07-04 — **$1.0225T** of
headroom. Measured on the same series, debt grew **$2.794T** over the trailing twelve months
(2025-08-27 → 2026-08-27), about **$698B** a quarter; the two most recent full quarters ran +$551B
and +$397B. On that range headroom is exhausted somewhere between **February and April 2027** — i.e.
inside or at the edge of the **Jan–Mar 2027** quarter whose first estimate this release publishes.
There is direct precedent for Treasury flagging it early: the **2024-10-28** edition, one quarter
before the January-2025 reinstatement, carried the softer *"constraints related to the debt limit"*
line, and the harder footnote — *"the end-of-<month> and end-of-<month> cash balances assume enactment
of a debt limit suspension or increase"* — appears in exactly **4 of 15** editions (2023-01-30,
2023-05-01, 2025-02-03, 2025-04-28), every one with the limit live. Whether that language attaches on
11-02 is the single most informative thing in the document, and it is scoreable from the document
alone.

**7. The fiscal backdrop is heavy but not new — SUPPORTED, and deliberately deflated.** FY2026 ran a
**$1.8T** deficit through its first ten months (CRFB, reading Treasury's Monthly Statement), and
Treasury has been running a historically large cash balance under Bessent ($950B assumed end-September
2026, $850B end-December). None of that is news on 11-02; it is the level the market has already
priced, which is exactly why the quarterly restatement of it doesn't trade. The one genuinely open
question the release touches is whether the ~$1T cash balance stays a policy target — Bessent has
floated funding buybacks from it — and that shows up first as a **change in the assumed
end-of-quarter balance**, not as a change in the borrowing number.

**8. Tracked-name sensitivity — ranked, with mechanism, and deflated further than the sibling's.**
`symbols: []` — market-wide, transmitted through the rate-duration channel. The standing house
ranking, carried unchanged from the sibling rates ledgers: **CRWV** (debt-financed datacenter build —
long-end yields hit both discount rate and literal cost of capital), then the high-multiple semis
**NVDA / AVGO / MRVL**, then **MSFT / GOOG / META** (mega-cap duration, fortress balance sheets mute
the financing leg), least **AAPL / AMZN**. Leg 2 says the channel does not open on this date for the
broad market at all (SPY clean p=0.704, QQQ p=0.765), so the ranking is what to consult *if* the
Jan–Mar 2027 number or the debt-limit footnote surprises — never a reason to position for the date.
And on 11-02 specifically it is unusable for attribution: four of those nine names print on
10-28/10-29, inside the same corridor.

### What the conditions support

Nothing directional. No house playbook is macro-keyed (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed).
What travels is one discipline this session banked and one it inherited. Inherited and confirmed:
**an event's reaction function must be computed against its collision set, not its date list** — the
sibling's finding, reproduced here from an anchor two sessions earlier. New: **check what the
"surprise" variable is actually made of before measuring a response to it.** The borrowing-estimate
revision looks like a fiscal surprise and reads like one in press coverage, but five of its five
large values are cash-balance mechanics from a debt-limit cycle. A reaction function fitted to it
would have been fitting the Treasury General Account.

### Honest limits

- **This null is weaker than the sibling's, and in the opposite direction from what the timing
  suggests.** The release lands at **15:00 ET, inside the session** — so T+0 close-to-close contains
  six and a half hours of unrelated trading before the news and one hour after it. That is the worst
  signal-to-noise window of any release on this calendar. A genuine last-hour repricing that held
  into the close would be diluted roughly 6:1 here and could easily be invisible. The measurement
  supports "no *large* release-day effect," never "no effect."
- **n=8 on the clean subset.** With TLT's daily σ of 0.895% over the window, eight observations have
  roughly 80% power against a mean effect near **±0.89%**. p=0.860 means not distinguishable, not zero.
- **Intraday data would settle this and was not used.** The honest next step for anyone who wants a
  real answer on this release is a 15:00→16:00 window on cash Treasuries or futures, not daily bars.
- **The FOMC meeting-day-1 list is search-sourced for 2023–2025**; 2026's dates are corroborated by
  this repo's own `fomc-2026-10-28` and `fomc-2026-12-09` entries.
- **The revision variable mixes cash-balance and cash-flow effects.** Only two of the fifteen releases
  (2025-07-28, 2026-08-03) publish the ex-cash-balance figure, so leg 5's decomposition rests on
  Treasury's own prose for the rest and a clean deficit-surprise series could not be built.
- **The debt-limit exhaustion window in leg 6 is this session's own extrapolation** from
  debt-to-the-penny growth, not a CBO or Treasury projection, and total debt outstanding grows faster
  than privately-held net marketable borrowing (it includes intragovernmental holdings). Treat
  "February–April 2027" as an order of magnitude, not a date.
- **The impact tier stays `low` and the measurement supports it** — unlike the sibling, which recorded
  a `medium`/`low` tension. Nothing in leg 2 argues for raising it, and the interesting content
  (leg 6) is a document to read, not a price to trade.
- **No forward-test on the tape.** 11-02 carries **13** tracked events within ±5 days; a price test
  there could not attribute its own result. Both tests below are scored from the primary document.

## Stance & kill switches

**Stance (`confirmed`-dated as of this session — and confirmed licenses attention, not an entry).**
Stand aside on 2026-11-02 as a price event. The refusal is measured: across the eight
borrowing-estimate releases since 2023 that were not FOMC meeting-eves, TLT closed 4/8 up at
**+0.056%** (permutation p=0.860), SPY 6/8 at +0.201% (p=0.704) and ^TNX 4/8 at +0.041% (p=0.989) —
all indistinguishable from ordinary sessions — and the two episodes commonly attributed to this
release (2023-07-31, 2023-10-30) were a 21st-percentile session and a wrong-signed one respectively.
**Read the document for two things:** the **Jan–Mar 2027** borrowing estimate with its end-March cash
assumption, and whether Treasury attaches its debt-limit footnote to that assumption — because debt
outstanding was $40.078T on 2026-08-27 against a $41.1T limit and grew $2.794T over the trailing
year. Base case (**and it is this ledger's own forecast, not dealer consensus, which does not
publish on the Monday**): a quiet edition — Oct–Dec 2026 revised inside ±$150B of the $628B set on
08-03, no debt-limit language — because every large revision in the sample came from a live
debt-limit cycle and none is live now. **Attribute no 11-02 move to this release**: ISM Manufacturing
and SLOOS share the day, four mega-cap prints and an FOMC precede it by days, and the midterms are the
next morning.

**Kill switches:**

- **Oct–Dec 2026 revised by more than ±$150B** against the $628B announced 2026-08-03 → the
  small-revision base case in leg 5 is void and this stance is re-derived from scratch, not patched.
- **Debt-limit language attached to the Jan–Mar 2027 cash-balance assumption** → leg 6's tail arrived
  early; the release becomes a debt-limit-cycle edition, the leg-5 regime mapping says revisions get
  large from here, and the rate-duration ranking in leg 8 becomes live into the 11-06 jobs print.
  Still not an entry.
- **A clean-subset release day producing a TLT move above the 90th percentile of its own
  distribution** → the nil finding in leg 2 breaks at its first out-of-sample test and the reaction
  function needs re-argument rather than a patch.
- **Intraday (15:00→16:00) measurement showing a real release-window effect** → the central limit
  above bites, the daily-bar null is revealed as underpowered rather than informative, and this
  ledger's method is the thing that was wrong.
- **Treasury moving the release off 2026-11-02** → the date is `confirmed` on Treasury's own
  scheduling line, so a move would break the primary; re-verify before any further assessment.

Forward tests registered in [`forward-tests.md`](../forward-tests.md): **FT-41** (the Oct–Dec 2026
revision lands inside ±$150B, scored 2026-11-03) and **FT-42** (no debt-limit language attaches to the
Jan–Mar 2027 assumption, scored 2026-11-03).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-63 | Initial research banked (above). **Date PROMOTED `estimate` → `confirmed` (`TSY:`)**: home.treasury.gov's most-recent-refunding-documents page, fetched direct today, reads *"DOCUMENTS RELEASED at 3:00 PM Monday, august 3, 2026 / Financing Estimates"* … *"(The next release is scheduled for **November 2, 2026**)"*. **Process finding for the whole lane:** the sibling [11-04 ledger](treasury-refunding-2026-11-04.md) filed `estimate` because home.treasury.gov timed out on four fetches — that is a **tool artifact, not a network fact**. WebFetch times out (reproduced twice today); plain `curl` returns HTTP 200 on every one of those URLs. Fetched directly: the refunding-documents page, the financing-estimates index, and **all 15** borrowing-estimate press releases. This fires that ledger's own *"home.treasury.gov becoming directly fetchable"* kill switch — its 11-04 entry is left untouched here per one-event-per-session, and its next pulse (due 09-21) should promote it. **Measurement (Yahoo dividend-adjusted closes, 2023-01-01→08-31, n=918, 200k-iteration two-sided permutation).** **(1) Release day is nil.** Clean subset (8 releases not on an FOMC meeting-eve): TLT **4/8 up, +0.056%, p=0.860**; SPY **6/8, +0.201%, p=0.704**; ^TNX **4/8, +0.041%, p=0.989**; IEF p=0.924; QQQ p=0.765; VIX p=0.583. All 15: TLT 7/15, −0.091%, p=0.703. **(2) The Monday's confound is the Wednesday's seen 48h earlier.** 7 of 15 releases sit on an FOMC meeting-eve (2023-01-30 · 05-01 · 10-30, 2024-01-29 · 04-29 · 07-29, 2025-07-28) — by arithmetic the same seven quarters the sibling found colliding on the Wednesday. All apparent bond bid lives at T+1/T+2 on that subset: TLT T+1 eve **5/7, +0.704%, p=0.039**; T+2 eve **6/7, +0.879%, p=0.010**; ^TNX T+2 eve 1/7, −1.503%, p=0.004. Clean subset flat every column (TLT −0.074/−0.141/**+0.056**/+0.180/−0.037). **The T+2 clean figure, 4/8 at −0.037%, reproduces the sibling's refunding-day number to three decimals from a different anchor** — the two studies cross-validate. **11-02 is not an FOMC eve** (Fed decides 10-28). **(3) Both canonical episodes fail.** 2023-07-31 ($1.007T, +$274B, "set off the bond rout"): TLT **+0.24%**, 21st pctile; the rout was 08-01/08-02 with Fitch and the coupon increase. 2023-10-30 (−$76B, "sparked the rally"): TLT **−0.45%**, wrong direction; the rally was 11-01, an FOMC day. **(4) The revision is a cash-balance variable.** Every figure read off the primary: all **5** editions past ±$250B (2023-01-30 +353 · 05-01 +449 · 07-31 +274 · 2025-04-28 +391 · 07-28 +453) sit in the two debt-limit cycles; none of the 10 quiet ones does. Treasury's own decomposition of the largest: +$453B headline, **+$60B ex-cash-balance**. Revision↔TLT r=−0.480 all-15 → **−0.229** dropping 2023-05-01 (First Republic seizure, TLT −2.88%, 100th pctile). Big-revision subset round-trips: T+0 −0.605% → T+1 +0.836%. **(5) What is live on 11-02 is the Jan–Mar 2027 estimate.** Debt outstanding **$40.0775T** on 2026-08-27 vs the **$41.1T** limit (fiscaldata debt-to-the-penny, fetched today) = **$1.0225T** headroom; trailing-12m growth **+$2.794T** (~$698B/qtr; last two full quarters +$551B / +$397B) → exhaustion ≈ Feb–Apr 2027. Marker to watch, mechanically checkable: the footnote *"cash balances assume enactment of a debt limit suspension or increase"* appears in exactly **4 of 15** editions, all limit-live; 2024-10-28 carried the softer *"constraints related to the debt limit"* one quarter before the Jan-2025 reinstatement. → registered **FT-41** (revision inside ±$150B) and **FT-42** (no debt-limit language), both scored from the document, since 11-02 is unattributable on the tape. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new; the Warsh 08-28 Jackson Hole repricing (Sep hike odds ~40%→~57%, 10y back above 4.7%) is carried from the [Jackson Hole close-out](jackson-hole-2026-08-28.md), not re-derived. **Volatility regime:** ^VIX **15.29**, ^TNX **4.75**, TLT **82.38**, SPY **766.30** (all 08-31 bars); VIX touched ~14.1 post-Warsh, a YTD low. **Geopolitical/policy:** carried — the 08-30 Larak Island strike re-escalated Hormuz (Brent >$90) and the Senate CR to Dec 11 is with the House; both feed the deficit/inflation backdrop. FY2026 deficit **$1.8T** through ten months (CRFB reading the Monthly Treasury Statement) — heavy but already priced, which is leg 7's point. **Event tape:** no consensus exists for a Monday quantity release; dealers publish estimates for the Wednesday's *sizes*, not the Monday's *total*. **Corridor:** **13** tracked events within ±5 days — FOMC 10-28, GOOG/META prints 10-28, AMZN/AAPL prints + GDP-adv + PCE 10-29, ISM-mfg + SLOOS + this 11-02, midterms 11-03, ISM-svcs + refunding 11-04, jobs 11-06 — the densest on the calendar, and the reason no price test is registered. **New dated adjacency found → proposed in this PR:** Treasury's **Primary Dealer Meeting Agenda, 2026-10-16 at 12:00 ET**, named on the same primary page (*"(The next release is scheduled for October 16, 2026)"*) and absent from this calendar — the earliest public tell on issuance-policy questions, i.e. the leading indicator for both 11-02 and 11-04. Filed `treasury-primary-dealer-agenda-2026-10-16`, `status: estimate` (`EST:`) per the sweep rule that a drive-by adjacency is never self-confirmed; its own initial research can promote it on the same primary. **Corrected in this PR:** the entry's `notes` claimed the Monday "has historically moved the tape less than the Wednesday statement it precedes" — unmeasured when written, and now measured: **both are nil** (Monday clean p=0.860, Wednesday clean p=0.905), so the comparative claim is dropped rather than reversed. | — (stance set) | 2026-09-30 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
