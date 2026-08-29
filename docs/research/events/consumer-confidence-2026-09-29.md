# Conference Board Consumer Confidence (Sep 2026) — consumer-confidence-2026-09-29

**Kind:** macro-print · **Date:** 2026-09-29 (confirmed, CB: conference-board.org/topics/consumer-confidence — "The next release is Tuesday, September 29th at 10 AM ET", fetched 2026-08-29) · **Impact:** medium
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.35,"daysBand":"medium:31+","adjacentIds":["chicago-pmi-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","mu-2026-09-29-print","treasury-7y-note-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** The Conference Board's September Consumer Confidence Index lands Tuesday 2026-09-29 at
10:00 ET — now **confirmed** off the Conference Board's own next-release line, upgraded from the
`estimate` this event was filed as. Nothing here is a trade. Three things make it worth *watching*
rather than acting on. First, the **reaction function has inverted since the August print**: Warsh's
2026-08-28 Jackson Hole speech pushed CME-implied odds of a September rate **hike** to 46% (from
35%), so a soft print no longer reads "cuts sooner → good for duration" the way this calendar's
sibling ledgers assumed in August — a weak-expectations print alongside sticky inflation reads
stagflationary, which hits stocks *and* bonds together. Second, **the headline is the wrong number
this cycle**: August's tiny -0.8 headline move hid a +6.8 jump in Present Situation offsetting a
-5.8 collapse in Expectations (to 68.2, through the ~70 line the predecessor ledger had named as a
kill switch). Third, **do not attribute 10:00 ET tape on 9/29 to this print** — JOLTS (confirmed)
releases at the identical minute, and MU reports after the close, so single-print attribution that
morning is unfalsifiable. Watch the components; size nothing into it.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-31) | Stand aside | High | Thirty-one days out, no September consensus published (none surfaced for August until days before release), and the print is second-tier for tape. | A September consensus and whisper appearing before **2026-09-19**, giving an actual surprise to frame rather than trend extrapolation |
| This week (through 2026-09-04) | Stand aside | High | The week's binding macro is the 2026-09-04 jobs report (confirmed) and the hike-vs-hold repricing off it — this print carries no near-term information. | A jobs print on **2026-09-04** so far off consensus that the September FOMC becomes a settled hike or a settled hold, which would change what the 9/29 confidence read is even asking |
| This month (into 2026-09-29) | Watch | Medium | Read the Expectations/Present-Situation split, not the headline; and treat the 10:00 ET tape as jointly caused by JOLTS (confirmed, same minute) rather than by this print. | Expectations printing back **above 80** on **2026-09-29** — out of the recession-signal zone it has held since Feb 2025 — which would retire the standing regime concern outright |
| This quarter | Stand aside on this print specifically | Medium | Its value is as a standing regime gauge feeding the Oct 27–28 FOMC (which has no SEP), not as a single-session catalyst; the 10-27 successor print is already tracked. | Two consecutive prints (Sep + Oct) with Expectations back above ~80 **by 2026-10-27**, killing the consumer-expectations-are-cracking read |

**Signals & conditions** — the buy/sell/hold triggers:

- Expectations Index below ~65 on **2026-09-29** (a second leg down from 68.2) → escalates from
  regime context to a recession-odds signal; tightens caution on AMZN/AAPL discretionary exposure,
  still does not license a directional position.
- Expectations Index back above 80 on **2026-09-29** → retires the standing regime concern; one
  print is not a turn, so wait for the 10-27 successor before easing anything.
- Present Situation Index giving back August's +6.8 (back below ~115) → the labor-differential
  improvement (+7.5%, best since Apr 2026) was noise, and the "current conditions are fine"
  half of the August print does not survive; reads through to the 2026-10-02 jobs report.
- CB 12-month inflation expectations rising again while the headline falls → the stagflationary
  combination, the one composition that hurts long-duration names on a *weak* consumer print under
  the post-Jackson-Hole reaction function.
- Any 9/29 10:00 ET move being attributed to this print in commentary → discount it; JOLTS
  (confirmed) prints the same minute. Attribution that morning is a story, not a measurement.

## Initial research

### The question

What should we expect from the September 2026 Conference Board Consumer Confidence print, how will
the market's reaction function treat it given the regime that has developed since the August
release, and which tracked names carry real sensitivity?

**One-line verdict:** the date is now primary-confirmed for 2026-09-29 10:00 ET; the level is
unknowable at D-31 (no consensus exists, structurally); the genuinely new information since the
August print is that the **rate-path reaction function has flipped from cut-risk to hike-risk**,
which means a weak print no longer carries the bullish-duration read the August ledger assumed —
and the print itself lands in a 10:00 ET collision with JOLTS that makes single-print attribution
worthless.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode
— no price instrument exists for this event kind, so `earnings-cycle.mjs`/`intraday-edges.mjs` were
correctly not run and there was no cache to bust). Primary source for the date and the August
figures is conference-board.org and the Conference Board's own wire-distributed release; press
(CNBC, PBS, Washington Post, Yahoo Finance, investinglive, Advisor Perspectives/dshart,
TradingEconomics) used for reaction narration and macro context, each claim dated. All readings are
as of the 2026-08-28 close unless stated.

One method note worth recording: Yahoo Finance's chart API returned HTTP 429 on every attempt this
session (five retries with backoff), and stooq's CSV endpoint is behind a JS challenge — so the VIX
reading below came from press quotation rather than a direct fetch, and was cross-checked
arithmetically (see leg 6). That is a degraded path, named rather than hidden.

### Conviction legs, tested

**1. The date is primary-confirmed — SUPPORTED, and this event's status changes because of it.**
conference-board.org's own consumer-confidence page carries the line **"The next release is
Tuesday, September 29th at 10 AM ET"** (fetched 2026-08-29, verbatim on a second targeted
extraction), alongside the standing cadence rule **"The Conference Board publishes the Consumer
Confidence Index® at 10 a.m. ET on the last Tuesday of every month"** (also present in the August
release text). September 2026's last Tuesday is the 29th (Tuesdays: 1, 8, 15, 22, 29; the 30th is a
Wednesday). This is the publisher's own forward-dated statement, which is exactly the primary source
the lane's `estimate → confirmed` limit requires — so the `market-events.ts` entry moves from
`NEWS:`/`estimate` to `CB:`/`confirmed` in this PR. Independently corroborated by search-result
aggregation naming the same date and time.

**2. The August print's headline hid its real story — SUPPORTED.** Released 2026-08-25: headline
**89.4**, down 0.8 from a downward-revised July **90.2**, missing a ~90.2–90.3 consensus (investing
.com shows forecast 90.3, previous 90.2; investinglive reported 90.2 expected). Underneath:
**Present Situation 121.2, up 6.8 — its first improvement in four months**, with the "jobs plentiful
minus jobs hard to get" differential up 4.8pp to **+7.5%**, the strongest since April 2026.
**Expectations 68.2, down 5.8**, deteriorating across all three forward components, and below the
80.0 recession-signal threshold it has sat under since February 2025. Dana Peterson (CB chief
economist): "Consumer confidence moderated slightly in August for a second consecutive month" —
which is true of the headline and materially understates the forward-looking leg. Write-in responses
cited prices, oil and gas costs, food and labor conditions. 61.3% of consumers still expect higher
interest rates over the next 12 months (down from 62% in July). The operational conclusion: **for
September, read the components first.** A repeat of this composition would again produce a boring
headline over a deteriorating core.

**3. The market's reaction function inverted after the August print — SUPPORTED, and this is the
most important finding in this doc.** The predecessor ledger's leg 6 reasoned that a weak confidence
read "supports the 'labor is cracking → cuts sooner' read that has been *bullish* for long-duration
names." That premise no longer holds. At Jackson Hole on **2026-08-28**, Fed chair Warsh said
inflation is still too high, that recent cooling reports "do not tell me that underlying trends have
meaningfully improved," and that the Fed "has more work to do" — signalling possible *hikes* (PBS,
Washington Post, CNBC, all 2026-08-28). CME-implied odds of a September rate **increase** rose to
**46% from 35%** the prior day; the 2-year yield rose 6.6bp to **4.29%**, a one-month high; DXY +0.4%
to 99.55. Context feeding the hawkish case: CPI 3.4%, headline PCE 3.7%, core PCE 3.3%, and three
FOMC members already dissenting for higher rates in July. Under this regime, the bearish
interpretation of a weak print is *not* offset by a rate-relief bid — a soft-expectations print
arriving with sticky inflation expectations is the stagflationary combination, which is precisely
the one historical case the predecessor doc found where a sentiment print *did* move tape (the March
2026 UMich collapse: equity sell-off **and** a yields spike).

**4. The corroborating sentiment survey agrees on weakness and disagrees on inflation
expectations — MIXED.** The University of Michigan's *final* August Consumer Sentiment read
(released 2026-08-28) came in at **51.7**, revised up from the 51.0 preliminary the August ledger
cited but still down 6.3% from July and far below the ~54.5 Reuters / ~55 Bloomberg consensus;
Current Conditions 51.9 (-5.3%), Expectations 51.5 (-7.0%), with expected business conditions down
11% short-run and 17% long-run. Critically, UMich's **year-ahead inflation expectations fell to 4.0%
from 4.2%**, while the Conference Board reported its own average and median 12-month inflation
expectations as "slightly more elevated" in August. The two surveys therefore point the *same* way
on the level of gloom and *opposite* ways on inflation expectations — so UMich is directional colour
on the mood and explicitly **not** a read-through on the CB inflation-expectations subcomponent,
which is the leg that matters most under leg 3's regime. The two indices also diverge structurally
in level (51.7 vs 89.4 — different base years and construction), so no cross-level inference is
made here.

**5. The September survey window straddles the FOMC, and mostly misses it — SUPPORTED (with an
inferred date).** The August release states "the cutoff date for the preliminary results was August
16," nine days before the 8/25 release. Applying the same lag to a 9/29 release puts the September
cutoff around **2026-09-16 to 2026-09-20**. The September FOMC decision lands **2026-09-16**
(confirmed) — at the very edge of that window. So if the Fed hikes, only the last day or two of
responses can reflect it: **the confidence hit (or relief) from a September hike lands in the
October 27 print, not this one.** What the September window *does* fully contain: the 9/4 jobs
report (confirmed), PPI 9/10 and CPI 9/11 (confirmed), the AAPL launch on 9/9 (see leg 7), and the
run-up in gasoline prices. What it does *not* contain: the 9/30 federal funding deadline
(`estimate`) and any actual shutdown, which is October-print information. The cutoff date is
inferred from August's, not published forward — flagged in limits.

**6. Volatility regime is calm and unchanged, which argues against a big reaction — SUPPORTED.**
VIX closed **14.35** on 2026-08-28 (-1.10%), against 14.51 on 8/27 and 15.21 on 8/26 — the same
calm 14–16 band the sibling ledgers have been recording all month, and comfortably inside the
material-screen's 3-point threshold. (The 14.35 figure is press-quoted; it reconciles exactly with
the independently-observed 8/27 close of 14.51 at the reported -1.10%, which is the cross-check
standing in for the failed direct fetch.) Tape at the 8/28 close: S&P 500 **7,711.76** (-0.25%),
Nasdaq **26,402.42** (-0.52%), Dow **53,559.99** (-0.02%), 10-year **4.72%**, WTI (Oct) **$83.37**.
A calm-vol, hawkish-repricing backdrop is one where the *rates* leg does the moving, not the equity
vol leg — consistent with leg 3.

**7. Tracked-name sensitivity — ranked, with mechanism.** `symbols: []`: this is market-wide. Within
the nine-name roster (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN), the ranking from the August
ledger holds, with one addition:
- **AAPL — the only name with a mechanism *inside* the September survey window.** Apple's "Surprise
  and shine" event is **2026-09-09** (confirmed by Apple's own invitations, 8/26), launching iPhone
  18 Pro / Pro Max and a first foldable "Ultra" reported near $2,000, with the Pro line reportedly
  **$200–350 more** than the iPhone 17 Pro. The CB survey asks about buying plans, and a
  headline-grabbing price increase inside the response window is exactly the kind of thing that
  shows up in discretionary-purchase intentions. This is a **watch item, not a thesis** — the CB
  buying-plans subindices are noisy, cover autos/homes/appliances more than phones, and one product
  launch is a weak input to a national survey. Pricing detail is leak-sourced, not Apple-confirmed.
- **AMZN** — e-commerce volumes track discretionary spend directly, and AMZN carries the
  fuel/logistics cost of the pump prices the survey's write-ins keep citing (national average
  **$4.04/gal**, +16c month-over-month even as Brent eased toward **$88** from the ~$93–94 mid-August
  level — crude relief has not reached the pump yet).
- **The other seven** (AI-infra/duration names) feel this only through the rate-path channel — and
  per leg 3 that channel's *sign has flipped*, which is a change to how they'd feel it, not to
  whether they do.

**8. This print moves markets less than CPI/jobs/FOMC — SUPPORTED, and 9/29 makes it worse.**
Nothing found contradicts the predecessor's leg 5 (employment reports and retail sales dominate
trader reaction; confidence prints matter as trend signals). On 9/29 specifically, the attribution
problem is acute: **JOLTS Job Openings (confirmed, BLS, 10:00 ET) prints in the same minute**, and
**MU reports after the close** (`estimate` date). Any same-morning narrative crediting this print
with a move is unfalsifiable — logged here so the close-out does not later mistake a JOLTS reaction
for a confidence reaction.

### What plays the conditions support

None. No house playbook is macro-keyed; this is a second-tier print in a calm-vol regime with an
attribution collision at its release minute. What travels forward: no AMZN/AAPL discretionary
exposure sized around 9/29 10:00 ET; read components not headline; and a standing note that under
the post-Jackson-Hole hike-risk regime, the *bullish-duration* reading of a weak consumer print
that this calendar carried through August is retired until the rate path resolves.

### Honest limits

- **No September consensus at D-31, and this is structural, not a search failure.** The predecessor
  ledger established at D-1 that fxstreet lists CB consensus as "n/a" under the Conference Board's
  own publication restrictions; the August consensus only surfaced within days of release.
  Everything about the *level* below is trend extrapolation, explicitly not a street number.
- The **September survey cutoff (~9/16–9/20) is inferred** from August's stated 8/16 cutoff, not
  published forward. Leg 5's "the FOMC mostly misses the window" conclusion depends on it.
- **VIX 14.35 is press-quoted, not directly fetched** (Yahoo 429'd five times; stooq JS-challenged).
  It reconciles arithmetically with the observed 8/27 close, but it is one source, and Yahoo's
  history page returned a mixed-year table this session that was discarded rather than used.
- iPhone 18 Pro **pricing is leak-sourced**; only the 9/9 event date is Apple-confirmed. Leg 7's
  AAPL mechanism weakens considerably if the price increase does not materialise.
- July's 90.8 was revised to 90.2 in the August release. **Any September "surprise" framing must net
  against the revised August figure**, not the 89.4 as first reported.
- No macro-print price instrument exists for this event kind, so nothing here is instrument-scored;
  it is sourced research only, as EVENT-RESEARCH.md prescribes for this mode.

## Stance & kill switches

**Stance (date confirmed — CB primary, fetched 2026-08-29).** Treat 2026-09-29 10:00 ET as a
medium-impact, second-tier macro print: regime information, not a trading event. No AMZN/AAPL
discretionary-adjacent entries sized around the release; no directional macro position on the print
itself; no attribution of that morning's tape to this print given the simultaneous JOLTS release
(confirmed). Base case (trend extrapolation only — no street consensus exists): a headline in the
high-80s, with the meaningful question being whether Expectations extends below 68.2 or the
August Present-Situation bounce (121.2) holds.

**The material change from the August ledger, recorded as a stance revision rather than a
continuation:** the "weak confidence → cuts sooner → bullish long-duration" transmission that
ledger relied on is **withdrawn**. With September hike odds at 46% post-Jackson-Hole, the relevant
downside composition is stagflationary (soft expectations + elevated inflation expectations), which
pressures equities and duration together. Receipt: the 2026-08-29 ledger row below.

**Kill switches:**

- **Expectations Index back above 80 on 2026-09-29** kills the standing recession-signal concern
  this series has carried since February 2025.
- **Expectations Index below ~65 on 2026-09-29** kills the "gradual drift" framing entirely and
  earns a dedicated reassessment ahead of cadence, feeding the Oct 27–28 FOMC context.
- **The September FOMC (2026-09-16, confirmed) resolving to a clear hold with hike odds collapsing**
  kills the inverted reaction function above and restores the August ledger's cut-path reading —
  re-derive leg 3 if that happens.
- **A published September consensus appearing before 2026-09-19** kills the "trend extrapolation
  only" caveat; re-run the surprise framing against the actual number.
- **AAPL's 9/9 launch shipping without the leaked price increase** kills leg 7's AAPL mechanism,
  leaving AMZN as the only direct discretionary read.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-31 | Initial research banked (above). **Date flipped `estimate` → `confirmed`** in `market-events.ts`: conference-board.org's own page states "The next release is Tuesday, September 29th at 10 AM ET" (fetched 2026-08-29, re-extracted verbatim) — primary source, `CB:` prefix, which is what the lane's no-self-confirm limit requires. Adjacency sweep — **Peers:** n/a (`symbols: []`). **Macro surprises:** August CB print 89.4 (miss vs ~90.2–90.3) with the story in the split (Present Situation 121.2, +6.8, first rise in 4 months, labour differential +7.5%; Expectations 68.2, -5.8, below the ~70 line the predecessor ledger named as a kill switch — it fired); UMich August *final* 51.7 (revised up from 51.0 prelim, -6.3% m/m), with year-ahead inflation expectations *falling* to 4.0% from 4.2% — opposite direction to CB's "slightly more elevated," so UMich is mood colour only, not an inflation-expectations read-through; Chicago PMI (Aug data, 8/28) collapsed to 47.1 vs ~58 consensus / 57.6 prior. **Volatility regime:** VIX 14.35 close 8/28 (-1.10%), vs 14.51 on 8/27 and 15.21 on 8/26 — same calm 14–16 band, no shift; direct fetch failed (Yahoo 429 ×5, stooq JS-challenged), figure is press-quoted and reconciles arithmetically with the 8/27 close. **Geopolitical:** Warsh's Jackson Hole keynote 8/28 — inflation "still too high", cooling reports "do not tell me that underlying trends have meaningfully improved", Fed "has more work to do"; CME September **hike** odds 46% (from 35%), 2y +6.6bp to 4.29%, DXY +0.4% to 99.55 — **this inverts the reaction function the August ledger assumed** (see Stance). Energy easing but not at the pump: Brent ~$88 (from ~$93–94 mid-Aug) on an Iran–Oman Hormuz revenue-sharing deal that does *not* guarantee reopening, attention rotating to Russia–Ukraine; national gasoline $4.04/gal, +16c m/m. **Event tape:** no September consensus or whisper at D-31 — structural (CB publication restrictions, per the predecessor's D-1 finding), not a search miss. Two corridor findings: JOLTS (confirmed, BLS) prints at the identical 10:00 ET minute on 9/29, making single-print attribution unfalsifiable; and the September survey cutoff (~9/16–20, inferred from August's stated 8/16 cutoff) means a 9/16 FOMC hike is mostly *outside* the response window — its confidence impact lands in the 10-27 print. **No new dated adjacency proposed:** all eight events inside the ±5d corridor are already tracked (trump-xi-summit-2026-09-24 `estimate`, treasury-7y-note-2026-09-24, jolts-2026-09-29, mu-2026-09-29-print `estimate`, chicago-pmi-2026-09-30 `estimate`, government-funding-deadline-2026-09-30 `estimate`, ism-manufacturing-2026-10-01 `estimate`, jobs-2026-10-02); the AAPL 9/9 launch is already on the calendar; the successor consumer-confidence-2026-10-27 already exists; UMich's September prints are dated but deliberately out of scope per `market-events-data.ts`'s own second-order-surveys note. | Stance set — and the August ledger's cut-path transmission explicitly **withdrawn** (hike-risk regime) | 2026-09-19 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
