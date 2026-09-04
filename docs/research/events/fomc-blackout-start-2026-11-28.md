# FOMC communications blackout begins (through 2026-12-10) — fomc-blackout-start-2026-11-28

**Kind:** macro-print · **Date:** 2026-11-28 (confirmed, FED: federalreserve.gov "FOMC Trading and External Communications Blackout Calendar" PDF — rule text re-fetched and decompressed 2026-08-31, applied to the confirmed Dec 8–9 FOMC) · **Impact:** medium
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"medium:31+","adjacentIds":["aws-reinvent-2026","beige-book-2026-11-25","georgia-senate-runoff-2026-12-01","pce-2026-11-25"],"screenStreak":0} -->

## At a glance

**TL;DR.** This gate is neither September's nor October's. **The finding is that the blackout
outlives the decision by a full session, and the November CPI lands in that overhang.** The Fed
decides 2026-12-09 with a dot plot, holds a presser at 14:30 — and then CPI prints 08:30 on
**2026-12-10** while no FOMC participant may say a word until **Friday 2026-12-11**. In each of
2021, 2022, 2023 and 2024 the Committee saw the November CPI *before* deciding; 2025 missed it only
because the shutdown delayed the print, so **2026 is the first unforced miss in six years** (all
dates verified against BLS release archives today). Payrolls **12-04** also land inside the gate,
though that is an ordinary configuration, not the novelty. The second live risk is fiscal: the House
CR runs to **2026-12-04** and the Senate's to **2026-12-11** — neither enacted — so whichever one
passes puts a funding cliff inside or on the edge of this window, and on the 2025 precedent a lapse
would delete jobs 12-04 and CPI 12-10 outright (`estimate`; widens caution, licenses nothing). Date
is now **confirmed** — the Fed's blackout PDF was re-fetched and its rule text parsed this session.
No directional call. The one thing this doc adds to the calendar is a **one-session extension**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing to trade | High | D-89, no issuer, no printed number; a gate changes who may speak, not what anything is worth | An FOMC participant making on-record monetary-policy remarks on or after **2026-11-28**, which would mean the gate is not the constraint this doc rests on |
| This week | **No action here — the dated thing that matters this week is 2026-09-30, not 11-28** | High | Both live CRs expire *inside* this gate's corridor (House **12-04**, Senate **12-11**), so the September funding fight sets whether December's last two data checks exist at all | Full-year FY2027 appropriations enacted, or an enacted CR expiring outside **2026-11-28 → 12-11** — the cliff leaves this corridor and the branch retires |
| This month | **Do not pre-position; let the 2026-09-16 dots decide whether this window is even two-sided** | Medium | A gate only matters while hold-vs-hike is live; September's SEP is the first hard read on that | The **2026-09-16** SEP resolving the branch either way — a median showing a 2026 hike, or cut odds moving off 0% |
| This quarter | **Extend the December flat-or-defined-risk window by one session: 12-09 → 12-11, not 12-09 → 12-10** | Medium | The gate is still up when CPI prints **12-10**, so a print that contradicts the dots has no official interpreter until **12-11** | BLS moving the November CPI to on or before **2026-12-09**, or any FOMC participant speaking on **2026-12-10** — either restores the interpretation channel inside the print |

**Signals & conditions** — the buy/sell/hold triggers:

- **Deadline, not a trade** — anything needing a Fed voice resolves by the **2026-11-25** close; the Board's November calendar lists no speeches at all, 11-26 is closed and 11-27 is a 1 p.m. half session.
- **The one rule this doc adds** — flat or defined-risk **2026-12-09 → 2026-12-11**, one session past [`fomc-2026-12-09.md`](fomc-2026-12-09.md)'s own 12-09 → 12-10 window.
- **Never** — treat the gate itself as an entry signal; it has no issuer and prints no number.
- **The branch to pre-decide** — the CR cliff (`estimate`): House **12-04** / Senate **12-11**, neither enacted as of 2026-08-29. A 12-04 lapse plausibly deletes **jobs 12-04** and **CPI 12-10** on the 2025 precedent.
- **Watch (dated)** — PCE + Beige Book **11-25** · half session **11-27** · gate falls **11-28** · jobs **12-04** · FOMC + dots **12-09** · CPI **12-10** · gate lifts end of **12-10** · first legal Fed voice **12-11** · PPI **12-15** · Dec-meeting minutes **12-30** (est).
- **Relevance kill** — hike odds back below ~40%, or cut odds off 0%, before **2026-11-28**: the two-sidedness that makes a closed interpretation channel matter goes away.

## Initial research

### The question, plainly

The blackout for the Dec 8–9 FOMC starts 2026-11-28. Its two siblings reached opposite conclusions —
[September](fomc-blackout-start-2026-09-05.md) called a no-short-vol window because top-tier data was
trapped inside the gate; [October](fomc-blackout-start-2026-10-17.md) explicitly refused to inherit
that rule because its corridor was empty. So the question is which shape December has, and whether
either existing rule transfers.

**One-line verdict:** neither. December's corridor is *fuller* than September's — it contains
payrolls, the decision itself and a CPI — but the exposure that fullness creates is already owned by
[`fomc-2026-12-09.md`](fomc-2026-12-09.md). What is genuinely this event's own is a scheduling
artifact nobody has priced: **the gate stays up for one full session after the decision, and the
November CPI lands in it.** Date **confirmed**; no directional call.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
federalreserve.gov and bls.gov primaries fetched and parsed directly today (2026-08-31), the repo's
own calendar queried for the corridor, a six-year base rate built by probing BLS's release archive by
URL, VIX read from CBOE's own history file. No price instruments run: `symbols: []`, no issuer.

### Conviction legs, tested

1. **The date derives from a Fed primary source — flipped `estimate` → `confirmed`.** SUPPORTED.
   `fomc-blackout-period-calendar.pdf` was re-fetched today and its content streams inflated; the
   footnote states the policy verbatim: *"The blackout period will begin at 12:00 a.m. Eastern Time
   the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting.
   For example, if the Committee meeting starts on a Tuesday, the blackout period will begin at the
   start of the Saturday that falls ten days earlier, and if the meeting ends on a Wednesday, the
   blackout period will end at the end of Thursday."* The FOMC calendar, re-fetched the same session,
   lists **December 8-9\*** with the asterisk footnoted *"Meeting associated with a Summary of
   Economic Projections."* Dec 8 2026 is a Tuesday and Dec 9 a Wednesday, so the source's own worked
   example applies with no judgment of mine: ten days earlier is **Saturday 2026-11-28**, and the end
   is the end of **Thursday 2026-12-10**. The calendar entry's standing note — that the date was
   arithmetic rather than a published row — is now closed.

2. **The gate outlives the decision by one session, and the November CPI lands in the overhang.**
   SUPPORTED — this is the doc's headline, and it is the reason this event is not a duplicate of
   [`fomc-2026-12-09.md`](fomc-2026-12-09.md). BLS's own release schedule, fetched today with a full
   browser header set (the page 403s to plain fetchers), lists **"November 2026 | Dec. 10, 2026"** for
   the CPI. The decision is 12-09 at 14:00 with a 14:30 presser; the gate runs to 23:59 on 12-10. So
   the sequence is: dots published → presser → **~18.5 hours** → a fresh inflation print that the dots
   never saw → **a full session in which no participant may respond** → first legal Fed voice Friday
   **2026-12-11**. That configuration is unusual, and the base rate is verified rather than
   remembered — each row's CPI date was confirmed by fetching the BLS archive URL that encodes it
   (e.g. `news.release/archives/cpi_12112024.htm` returns "2024 M11 Results"), and each blackout start
   is the leg-1 rule applied to the meeting's own Tuesday:

   | Year | Dec FOMC | Blackout start (derived) | Nov-data CPI | Seen before the decision? |
   |---|---|---|---|---|
   | 2021 | Dec 14–15 | Sat Dec 4 | Dec 10 | Yes (inside the gate, before the vote) |
   | 2022 | Dec 13–14 | Sat Dec 3 | Dec 13 | Yes (morning of day 1) |
   | 2023 | Dec 12–13 | Sat Dec 2 | Dec 12 | Yes (morning of day 1) |
   | 2024 | Dec 17–18 | Sat Dec 7 | Dec 11 | Yes |
   | 2025 | Dec 9–10 | Sat Nov 29 | Dec 18 | **No** — shutdown-delayed |
   | 2026 | Dec 8–9 | **Sat Nov 28** | **Dec 10** | **No** — ordinary scheduling |

   Four straight years where the Committee had the November CPI in hand; 2025 lost it to the lapse;
   **2026 is the first unforced miss in the sample.** The consequence is not directional — it is that
   the 12-09 presser is the *only* official commentary this cycle, and it is delivered before the
   data that could contradict it, with the rebuttal channel shut for a session.

3. **Payrolls print inside the gate — real, but this is the ordinary configuration, not the news.**
   SUPPORTED, and deliberately not weighted. BLS's schedule (same fetch) lists **"November 2026 |
   Dec. 04, 2026"** for the Employment Situation — inside 11-28 → 12-10, and the last labor input the
   December SEP gets. But the same archive probe shows this is common: 2023's jobs report (Dec 8)
   also landed inside its gate; 2021 (Dec 3), 2022 (Dec 2) and 2024 (Dec 6) each missed by a single
   day; 2025's (Dec 16) came after the meeting entirely. An uninterpreted payrolls print into a
   dot-plot meeting is a recurring feature of the December calendar, so it belongs in the record but
   earns no special caution of its own.

4. **The run-up is a holiday half-week, and the November Board calendar lists no speeches at all.**
   SUPPORTED, with the caveat every calendar snapshot carries. federalreserve.gov's November 2026
   calendar, fetched today, contains exactly three non-statistical items: **FOMC Minutes 11-18**
   (14:00, Oct 27–28 meeting), the **Beige Book 11-25** (14:00), and the Thanksgiving holiday notice
   for **11-26** — no governor speech, no Board event, no president. The two final SEP inputs both
   land on **11-25**: `pce-2026-11-25` (08:30, confirmed, high — the last PCE the December FOMC ever
   sees) and the Beige Book, with nothing scheduled to interpret either. Then 11-26 is closed and
   11-27 a 1 p.m. early close, so the practical deadline for a Fed voice is the **11-25 close**, two
   sessions earlier than the gate itself implies. *Caveat:* the November page was last updated
   2025-11-03 and the December page 2025-06-24; the Board adds speeches on short notice and regional
   presidents appear on district sites, not here. This is the first leg the next pulse re-checks.

5. **Whichever CR is enacted, its expiry lands inside or on the edge of this gate.** SUPPORTED, and
   it is the largest tail in the corridor. The tracked `government-funding-deadline-2026-09-30` entry
   (`estimate`) records that the **House CR runs to 2026-12-04** (passed 07-21, 220–205) and the
   **Senate's to 2026-12-11** (passed 08-08, 90–6), with neither enacted as of its 08-29 check;
   corroborated today against NACo's and House Appropriations' own summaries. Both candidate dates
   fall in this window's corridor: **12-04 is jobs day and sits inside the gate**, **12-11 is the day
   after it lifts and the day after CPI**. The 2025 precedent recorded in that same entry is that BLS
   does not publish through a lapse — it skipped an Employment Situation and cancelled the October
   CPI outright. So a lapse at a 12-04 expiry plausibly removes **jobs 12-04** *and* **CPI 12-10** —
   both remaining checks on the dot plot — while the Committee is barred from commenting on the
   vacuum. Because the deadline entry is `estimate` and no CR is enacted, this widens caution and
   licenses nothing; the honest response is a pre-decided branch, not a position.

6. **What the gate actually contains, end to end — this is not October's empty corridor.**
   SUPPORTED (repo calendar query, 2026-11-28 → 2026-12-10). Inside: **AWS re:Invent 11-30 → 12-04**
   (AMZN, confirmed, medium — a corporate catalyst with no Fed interaction), the **Georgia Senate
   runoff 12-01** (`estimate`, conditional, and its own research collapsed the probability to a
   two-name ballot that clears 50% by arithmetic), **jobs 12-04**, **FOMC + SEP 12-08/09**, **CPI
   12-10**. October's window had eight consecutive sessions with no tracked event in them; December's
   has the year's two biggest macro prints plus the decision. September's *shape* substantially
   returns — but its rule still does not transfer, for the reason in leg 7.

7. **September's blanket "no short vol across the window" does not transfer; the honest version is a
   one-session extension of the FOMC doc's rule.** MIXED — and this is where the doc earns its keep.
   September's rule covered 09-05 → 09-16 because PPI and CPI were trapped inside a gate with the
   decision at the end. Here the analogous exposure is *already called*:
   [`fomc-2026-12-09.md`](fomc-2026-12-09.md) states the deployable rule as **"flat or defined-risk
   across the Dec 9–10 double print."** Blanketing 11-28 → 12-10 would be thirteen days of refusal to
   buy one session of coverage that doc lacks — a bad trade in attention, and duplicated governance
   besides. So the marginal, non-duplicative contribution is narrow and specific: **move that
   window's right edge from 12-10 to 12-11**, because the gate keeps the damping channel closed
   through the 12-10 close and the first permitted official response is Friday 12-11. Everything else
   about December's volatility setup belongs to the FOMC doc, not this one.

8. **Our exposure is inherited, not direct.** SUPPORTED. `symbols: []`. The sensitivity ranking is
   [`fomc-2026-12-09.md`](fomc-2026-12-09.md)'s and is unchanged by a communications gate: on a
   hawkish surprise, long-duration tech sold and the front end up, with CRWV the highest-beta
   expression among tracked names. Regime read as of today: the target range has been held at
   **3.50–3.75%**, July minutes carried **three dissents favouring an immediate increase**, forward
   curves price a year-end funds rate near **~3.90%** and prediction markets ~**67.5%** for at least
   one 2026 hike (press and prediction-market snapshots, checked 2026-08-31, drifting daily). Since
   **12-09 is the last FOMC of 2026**, whatever hike probability survives the September and October
   meetings lands on the one decision whose data checks this gate disarranges. VIX closed **14.43** on
   2026-08-28 (CBOE `VIX_History.csv`, fetched today) — cheap, and unchanged from the sibling docs.

### What plays the conditions support (date confirmed)

None directional. One deadline, one one-session rule extension, one branch to pre-decide:

- **A deadline, not a trade.** Anything depending on a Fed voice resolves by the **2026-11-25**
  close — not 11-27, because nothing is scheduled to speak in the half-week between.
- **The extension.** Flat or defined-risk **12-09 → 12-11**, one session wider than
  [`fomc-2026-12-09.md`](fomc-2026-12-09.md)'s window, purely because the gate outlasts the decision.
- **Pre-decide the CR branch** before the enacted CR's expiry is known. If funding lapses at a 12-04
  expiry, treat the 12-09 dots as a decision taken on data that will not be checked — and write down
  *then* what changes, rather than forming the view mid-gate with no print and no Fed voice.

Explicitly **not** carried over: September's thirteen-day blanket no-short-vol window (its coverage
duplicates the FOMC doc), and October's "the corridor is empty" conclusion (it is plainly false here).

### Honest limits

Leg 4 is a calendar snapshot published a year in advance — speeches get added late and regional
presidents are not listed — so "no scheduled Fed voice" is a statement about today's schedule only.
On the date: I decoded the PDF's **rule text and worked example**, not the shaded cells of its 2026
grid (the graphics layer does not decode), but the worked example covers a Tuesday-start/Wednesday-end
meeting, which is exactly this configuration, so the derivation is the source's rather than mine.
Leg 5 rests on one lapse precedent (2025) and on two *unenacted* CRs whose dates can move in
conference. The leg-2 table is six years verified by archive-URL existence — it establishes that the
configuration is unusual, not how it resolves; n=6 supports no probability estimate, and I found no
study measuring what a post-decision CPI does inside a live blackout. Rate-odds and forward-curve
figures are press/prediction-market snapshots that drift daily. "Inside the gate" throughout is a
statement about **our** nine-name calendar, not the tape — December carries broad-market catalysts
this book does not track.

## Stance & kill switches

**Stance (date confirmed):** the December blackout is **neither September's refusal window nor
October's empty corridor**. Its own contribution is exactly three things: a **deadline at the
2026-11-25 close** (the last day anything is scheduled to speak, two sessions before the gate); a
**one-session extension** of [`fomc-2026-12-09.md`](fomc-2026-12-09.md)'s flat-or-defined-risk rule,
from 12-09 → 12-10 out to **2026-12-11**, because the November CPI prints 12-10 into a gate that is
still up; and a **pre-decided branch** for the funding cliff that both candidate CR end-dates put
inside or on the edge of this window (`estimate` — caution only, never an entry). No directional call
and no size. Everything about the December decision's own volatility remains that doc's call.

**Kill switches:**

- **Date kill:** federalreserve.gov publishing, or credible reporting showing, a blackout start other
  than 2026-11-28 for the Dec 8–9 meeting — or that meeting's date moving. Either breaks leg 1 and
  returns this entry to `estimate`. Score by **2026-11-28**.
- **Overhang kill (the headline):** BLS rescheduling the November CPI to on or before **2026-12-09**.
  The one-session extension loses its subject entirely and this reverts to October's reading. Re-check
  every pulse against bls.gov's CPI schedule.
- **Channel kill:** any FOMC participant making on-record monetary-policy remarks between
  **2026-11-28** and **2026-12-10**, other than the 12-09 statement and presser. The gate would be
  more porous than the rule implies and both the deadline and the extension would be wrong.
- **Branch kill:** full-year FY2027 appropriations enacted, or an enacted CR whose expiry falls
  outside **2026-11-28 → 2026-12-11**. The cliff leaves this corridor and leg 5 retires.
- **Vol-premise kill:** VIX above ~20 before **2026-12-09**. The extension rests on volatility being
  cheap into an unattended-print session; if it has already repriced, the window is priced rather than
  mispriced and a refusal-to-sell-vol rule has no premise.
- **Relevance kill:** hike odds falling back below ~40%, or cut odds moving off 0%, before
  **2026-11-28** — either resolves the two-sidedness that makes a closed interpretation channel matter
  at all, and this reverts to the ordinary technical it usually is.

No forward test registered in [`forward-tests.md`](../forward-tests.md) at D-89 — the stance takes no
position sized to any of the above, and both a scheduling deadline and a one-session widening of
another doc's refusal are rules rather than scoreable market predictions (the same reason both
sibling blackout docs registered none).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-89 | Initial research banked (above). **Date flipped `estimate` → `confirmed`**: the Fed's blackout-calendar PDF was re-fetched and inflated today, its footnote states the rule verbatim, and Dec 8–9 is the Tue-start/Wed-end case of the source's own worked example → **gate 2026-11-28 → end of 2026-12-10**; the FOMC calendar re-fetched the same session lists **December 8-9\*** (asterisk = SEP meeting). **Headline finding: the gate outlives the decision by one session and the November CPI lands in the overhang** — BLS primary gives CPI **12-10** (08:30) against a **12-09** decision, so the first legal Fed response to it is **12-11**. Verified base rate from BLS release archives: 2021 (CPI 12-10 / FOMC 12-14–15), 2022 (12-13 / 12-13–14), 2023 (12-12 / 12-12–13) and 2024 (12-11 / 12-17–18) all had the print **before** the vote; 2025 missed it only via shutdown delay (12-18 / 12-09–10); **2026 is the first unforced miss in the sample.** Adjacency sweep: **peers** — none, `symbols: []`, ranking inherited from [`fomc-2026-12-09.md`](fomc-2026-12-09.md) (hawkish → long-duration tech sold, front end up, CRWV highest beta). **Macro** — range held 3.50–3.75%, July minutes carried three dissents for an immediate hike, forward curves ~3.90% year-end, prediction markets ~67.5% for at least one 2026 hike (snapshots, 08-31); 12-09 is the last 2026 meeting, so the residual lands there. **Volatility** — VIX **14.43** at the 08-28 close (CBOE history file, fetched today), unchanged from the sibling docs. **Geopolitical/policy** — the CR cliff is the corridor's largest tail: House CR to **12-04**, Senate CR to **12-11**, neither enacted (repo entry checked 08-29, corroborated today), so whichever passes expires inside or on the edge of this gate, and a 12-04 lapse plausibly deletes **jobs 12-04 and CPI 12-10** on the 2025 precedent. **Event tape** — federalreserve.gov's November calendar lists **no speeches at all** (only minutes 11-18, Beige Book 11-25, Thanksgiving 11-26), so with 11-26 closed and 11-27 a half session the practical deadline is the **11-25 close**; jobs 12-04 inside the gate is real but ordinary (2023 did the same). **One new dated adjacency proposed to `market-events.ts` as `estimate`**: **`fomc-minutes-2026-12-30`** (14:00, minutes of the Dec 8–9 meeting), off federalreserve.gov's December 2026 calendar fetched today. | — (stance set: a deadline at the 2026-11-25 close, a **one-session extension** of the FOMC doc's flat-or-defined-risk window to **2026-12-11**, and a pre-decided CR branch; September's blanket window rule and October's empty-corridor read are both explicitly refused; no directional position) | 2026-09-21 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
