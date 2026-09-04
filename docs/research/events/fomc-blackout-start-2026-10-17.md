# FOMC communications blackout begins (through 2026-10-29) — fomc-blackout-start-2026-10-17

**Kind:** macro-print · **Date:** 2026-10-17 (confirmed, FED: federalreserve.gov "2025–2027 FOMC Trading and External Communications Blackout Calendar" PDF — rule text re-fetched and decompressed 2026-08-31, applied to the confirmed Oct 27–28 meeting) · **Impact:** medium
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"medium:31+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","import-export-prices-2026-10-16","opex-2026-10-16","ppi-2026-10-15"],"screenStreak":0} -->

## At a glance

**TL;DR.** This is the **inverse of the September blackout, and it should not inherit September's
rule.** From 12:00 a.m. ET Saturday **2026-10-17** through Thursday **2026-10-29** no FOMC
participant may speak — but unlike September, which trapped PPI and CPI *inside* the gate, every
top-tier October print lands in the **72 hours before** it (CPI + Beige Book 10-14, PPI 10-15,
import/export prices + monthly opex 10-16). So the window's middle — **10-19 → 10-26** — carries no
tracked event at all, and the danger sits at the two edges: a five-release pile-up at the front, and
the Oct 27–29 FOMC-plus-mega-cap cluster at the back that [`fomc-2026-10-28.md`](fomc-2026-10-28.md)
already owns. The blackout's own contribution is therefore one thing: a **deadline of the 2026-10-16
close** for anything that needed a Fed voice. Two further facts cut against copying September's
weight — this chair has *voluntarily* quieted the channel the gate closes ("a quieter Fed", forward
guidance has "overstayed its welcome", 2026-08-28), and the real load-bearing date in this corridor
is **2026-09-30**, the FY2027 funding deadline (`estimate`), because a lapse deletes CPI 10-14 and
sends the Fed into blackout with no October inflation read at all. Date is now **confirmed** (the
Fed's blackout PDF was re-fetched and parsed this session; the proposing sweep could not).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing to trade | High | D-47, no issuer, no printed number; the gate changes who may speak, not what anything is worth | An FOMC participant making on-record monetary-policy remarks on or after **2026-10-17**, which would mean the gate is not the constraint this doc rests on |
| This week | **No action here — the date that matters this week is 2026-09-30, not 10-17** | High | A funding lapse on **2026-10-01** would cancel CPI **10-14** (BLS killed the October 2025 CPI outright in the 2025 lapse), which reshapes this entire corridor before the gate ever falls | A CR enacted before **2026-09-30** covering through December — the lapse branch retires and this reverts to an ordinary technical |
| This month | **Finish Fed-dependent work by the 2026-10-16 close; do not pre-position for the window** | Medium | 10-16 is the last legal Fed-speak day, and it is also opex and import/export day — the last session where official interpretation and new price data can meet | A governor speech appearing on federalreserve.gov's calendar for **2026-10-15 → 10-16** (as of today it lists none), which would restore a scheduled interpretation channel at the edge |
| This quarter | **Do not inherit September's "no short vol across the window" rule** | Medium | September's rule priced unattended data *inside* the gate; October has none — the vol exposure is the **10-27 → 10-29** cluster, which is already its own doc's call | A dated tracked event appearing inside **2026-10-19 → 10-26**, which would restore the unattended-data configuration the September rule was built for |

**Signals & conditions** — the buy/sell/hold triggers:

- **Deadline, not a trade** — any position depending on a Fed voice clarifying hold-vs-hike resolves by the **2026-10-16** close.
- **Never** — treat the gate itself as an entry signal; it has no issuer and prints no number.
- **The branch to pre-decide** — government funding **2026-09-30** (`estimate`): a lapse deletes CPI **10-14**, likely PPI **10-15**, and the Fed enters blackout on no October inflation data.
- **Watch (dated)** — FOMC minutes **2026-10-07** (est) · CPI + Beige Book **2026-10-14** · PPI **2026-10-15** · import/export + opex + last legal Fed voice **2026-10-16** · gate falls **2026-10-17** · FOMC **2026-10-28** · gate lifts **2026-10-29** · midterms **2026-11-03** (est).
- **The channel that stays open** — an unscheduled WSJ/Timiraos-style story remains the documented mid-blackout conduit; gap risk, not a signal to fade.
- **Relevance kill** — hike odds back below ~40%, or cut odds off 0%, before **2026-10-17**: the two-sidedness that makes a lost interpretation channel matter goes away.

## Initial research

### The question, plainly

The communications blackout for the Oct 27–28 FOMC starts 2026-10-17. Its September sibling
([`fomc-blackout-start-2026-09-05.md`](fomc-blackout-start-2026-09-05.md)) concluded with an explicit
instruction — *"reuse the rule, don't re-derive it"* — for exactly this window. So the question is
narrow and testable: **does September's stance actually transfer to October, or does the October
corridor have a different shape that earns a different call?**

**One-line verdict:** it does **not** transfer. September's danger was top-tier data arriving inside
a gate with no official interpretation; October's corridor has the same gate but the data lands
*before* it, so the blackout's genuine contribution shrinks to a single scheduling deadline
(**2026-10-16**) while the actual risk migrates to the funding branch upstream (**2026-09-30**) and
the compound-variance cluster downstream (**10-27 → 10-29**). Date **confirmed**; no directional call.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
federalreserve.gov primary documents fetched and parsed directly today (2026-08-31), the repo's own
calendar queried for the corridor, press-cited rate odds carried with as-of dates. No price
instruments run: `symbols: []`, no issuer.

### Conviction legs, tested

1. **The date derives from a Fed primary source — flipped `estimate` → `confirmed`.** SUPPORTED.
   `fomc-blackout-period-calendar.pdf` was re-fetched today and its content streams inflated; the
   footnote states the policy verbatim: *"The blackout period will begin at 12:00 a.m. Eastern Time
   the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting.
   For example, if the Committee meeting starts on a Tuesday, the blackout period will begin at the
   start of the Saturday that falls ten days earlier, and if the meeting ends on a Wednesday, the
   blackout period will end at the end of Thursday."* The FOMC calendar, re-fetched the same session,
   lists **October 27–28, 2026** and marks it a non-SEP meeting. Oct 27 is a Tuesday and Oct 28 a
   Wednesday, so the source's own worked example applies with no judgment of mine: ten days earlier
   is **Saturday 2026-10-17**, and the end is the end of **Thursday 2026-10-29**. The calendar entry's
   standing note — *"needs the Fed blackout PDF re-fetched to promote to confirmed"* — is now closed.

2. **The corridor is the inverse of September's, and that is the finding.** SUPPORTED. Querying the
   repo's own calendar for 2026-10-10 → 2026-11-05 gives: **CPI 10-14** (confirmed), **Beige Book
   10-14** (proposed today, estimate), **PPI 10-15** (confirmed), **import/export prices 10-16**
   (confirmed), **monthly opex 10-16** (confirmed) — then **nothing at all** until **consumer
   confidence 10-27** (estimate), **FOMC 10-28** (confirmed), **GDP Q3 advance 10-29** (confirmed) and
   **PCE 10-29** (confirmed). September's window contained PPI (9/10), CPI (9/11) and two long-end
   auctions with the gate already down; October's contains, for eight sessions, none of our tracked
   events. The mechanism the September doc rested on — *surprises repriced with no official damping* —
   simply has nothing to act on between 10-19 and 10-26.

3. **The chair has already throttled the channel the gate closes.** MIXED, and it cuts against
   inheriting September's weight. Warsh's 2026-08-28 Jackson Hole keynote (federalreserve.gov primary,
   fetched today) states: *"A quieter Fed, more purposeful in its communications, is better able to
   meet its objectives"* and *"Oversharing policy deliberations and overcommitting to future decisions
   can lead markets, businesses, and households astray."* Press coverage frames this as his signature
   change — forward guidance has *"overstayed its welcome."* Two opposing implications, and the honest
   read keeps both: the blackout's marginal cost as **lost interpretation** is *lower* in October,
   because there is less routine interpretation to lose; but with guidance abolished, more news loads
   onto the **statement itself**, which is precisely what [`fomc-2026-10-28.md`](fomc-2026-10-28.md)
   already calls. Net: the September framing was calibrated to a channel that was worth ~20 points of
   hike odds on 2026-08-28 — but that was Jackson Hole, an annual set piece, not the routine governor
   speech the blackout actually suppresses. Extrapolating that one observation to October overstates it.

4. **The last legal Fed voice is Friday 2026-10-16, and the Board calendar lists nobody.**
   SUPPORTED, with the same caveat September carried. The gate falls at 12:00 a.m. ET Saturday 10-17,
   so Friday 10-16 is fully outside it. federalreserve.gov's October 2026 calendar, fetched today,
   lists for the whole 10-12 → 10-17 stretch only the **Beige Book on 10-14** and statistical
   releases — no governor speech, no Board event, with Columbus Day on 10-12 rescheduling the daily
   releases. So on today's schedule the last opportunity for a Fed voice to react to the CPI/PPI pair
   is a 48-hour window (10-14 close → 10-16 close) that nobody is currently scheduled to use.
   *Caveat:* Board speeches are added on short notice and regional-president appearances live on
   district sites, not the Board calendar — a snapshot, and the first thing the next pulse re-checks.

5. **The load-bearing date in this corridor is 2026-09-30, not 2026-10-17.** SUPPORTED. The tracked
   `government-funding-deadline-2026-09-30` entry (`estimate`) records the precedent plainly: BLS does
   not publish through a lapse and **cancelled the October 2025 CPI outright**, while private surveys
   (ISM) publish regardless. A 10-01 lapse therefore plausibly removes **jobs 10-02**, **CPI 10-14**
   and **PPI 10-15**. In that branch the Fed enters blackout on 10-17 with its last hard federal
   inflation read being **PCE 9-30** — a print the BEA's annual restatement has already made
   non-comparable year-over-year — and decides on 10-28 with neither fresh data nor any permitted
   voice. That is a materially worse configuration than anything September faced, and it is decided
   *before* this event's date. Because the deadline is `estimate`, it widens caution and licenses
   nothing; the honest response is a pre-decided branch, not a position.

6. **The Fed's own publications survive both the gate and a lapse — and one of them lands on CPI
   day.** SUPPORTED. Two Fed releases sit in this corridor and neither is Fed *speech*: the **FOMC
   minutes for the Sep 15–16 meeting on 10-07** and the **Beige Book on 10-14** (both read off
   federalreserve.gov's October calendar today; both proposed to the calendar in this PR as
   `estimate`). The minutes are the only structured evidence on how a coin-flip September actually
   resolved — worth more than usual precisely because leg 3's quieter Fed has withdrawn the usual
   substitute. The Beige Book lands 14:00 ET on CPI day, is the last thing the Fed publishes before
   the gate, and — because the Fed is self-funded and publishes through a shutdown — is the one
   inflation read that *gains* weight in the lapse branch. Neither is a trade; both are the reason
   "the Fed goes silent" is an overstatement of what 10-17 does.

7. **The election overlay is real but small, and mostly raises leak-aversion.** MIXED. The tracked
   `midterm-elections-2026-11-03` entry (`estimate`) sits five days after the gate lifts, so the
   Committee decides rates six days before a midterm with no ability to have pre-communicated. Two
   honest consequences and no third: the Committee is plausibly *more* leak-averse in this specific
   window, which weakens the mid-blackout press-story channel relative to its June-2022 precedent;
   and a maximally uninformative statement becomes somewhat likelier. I found no measured base rate
   for either — this is reasoning from the situation, flagged as such, and it is not sized.

8. **Our exposure is inherited, not direct.** SUPPORTED. `symbols: []`. Exposure runs entirely
   through [`fomc-2026-10-28.md`](fomc-2026-10-28.md)'s tiering, and that doc's finding governs here:
   on this chair a hawkish surprise priced into the **front end** (2y +8bp on 2026-08-28) rather than
   into equity volatility (S&P −0.13% to −0.25%; VIX closed **14.43**, a 2026 low). Nothing in a
   communications gate changes that transmission read.

### What plays the conditions support (date confirmed)

None directional. One rule, and one branch to pre-decide:

- **A deadline, not a trade.** Anything depending on a Fed voice clarifying hold-vs-hike has until the
  **2026-10-16** close. After that the only inputs are the data already printed and an unscheduled leak.
- **Pre-decide the lapse branch before 2026-09-30.** If funding lapses, treat the 10-28 FOMC as a
  decision taken on stale data and write down *then* what changes — deciding it under the gate, with
  no CPI and no Fed voice, is the worst time to be forming the view.

Explicitly **not** carried over from September: the "no short volatility across the window" rule. Its
premise was unattended top-tier data inside the gate; October has none. The vol exposure in this
quarter belongs to **10-27 → 10-29**, where it is already called.

### Honest limits

Leg 4 is a calendar snapshot — the Board adds speeches on short notice and does not list regional
presidents. Leg 5 rests on one lapse precedent (2025) and a policy entry that is itself `estimate`.
Leg 7 is situational reasoning with no measured base rate, and is not sized. On the date: I read the
PDF's **rule text and worked example**, not the shaded cells of its 2026 grid — the graphics layer
does not decode — but the worked example covers a Tuesday-start/Wednesday-end meeting, which is
exactly this configuration, so the derivation is the source's rather than mine; a press summary also
states 10-17 → 10-29 and is corroboration, not the basis. The "quietest corridor" claim in leg 2 is a
statement about **our nine-name calendar**, not about the tape — broad Q3 earnings season peaks in
exactly those sessions, and this book simply does not track those names. Rate-odds figures are
press-cited snapshots that drift daily (September ~51–58% hike, October ~58% in prediction markets,
cut 0%), checked 2026-08-31.

## Stance & kill switches

**Stance (date confirmed):** the October blackout is a **scheduling fact with one deadline
(2026-10-16), not a window to position around**. It does **not** inherit
[`fomc-blackout-start-2026-09-05.md`](fomc-blackout-start-2026-09-05.md)'s no-short-vol rule, because
the configuration that justified that rule — top-tier data trapped inside the gate — is absent here.
The corridor's genuine risks live outside this event: upstream at the **2026-09-30** funding deadline
(`estimate`, so caution only) and downstream in the **10-27 → 10-29** cluster already owned by
[`fomc-2026-10-28.md`](fomc-2026-10-28.md). No directional call and no size.

**Kill switches:**

- **Date kill:** federalreserve.gov publishing, or credible reporting showing, a blackout start other
  than 2026-10-17 for the Oct 27–28 meeting — or that meeting's date moving. Either breaks leg 1 and
  returns this entry to `estimate`. Score by **2026-10-17**.
- **Shape kill:** any dated tracked event landing inside **2026-10-19 → 10-26**. The corridor stops
  being empty, the unattended-data mechanism returns, and September's window rule becomes the right
  call after all. Re-check every pulse.
- **Channel kill:** any FOMC participant making on-record monetary-policy remarks on or after
  **2026-10-17**. The gate would be more porous than the rule implies and the "last voice is 10-16"
  framing would be wrong.
- **Branch kill:** a CR enacted before **2026-09-30** covering through December. The lapse branch
  retires, CPI 10-14 and PPI 10-15 are safe, and the "this week" call above loses its subject.
- **Relevance kill:** hike odds falling back below ~40%, or cut odds moving off 0%, before
  **2026-10-17** — either resolves the two-sidedness that makes a closed interpretation channel matter
  at all, and this reverts to the ordinary technical it usually is.

No forward test registered in [`forward-tests.md`](../forward-tests.md) at D-47 — the stance takes no
position sized to any of the above, and "finish by 10-16" is a scheduling rule rather than a scoreable
market prediction (the same reason its September sibling registered none).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-47 | Initial research banked (above). **Date flipped `estimate` → `confirmed`**: the Fed's blackout-calendar PDF was re-fetched and its streams inflated today (the proposing sweep did not re-fetch it), and its footnote states the rule verbatim; the Oct 27–28 meeting is a Tue-start/Wed-end meeting, the source's own worked example, giving **start 2026-10-17, end 2026-10-29**. **Headline finding: this corridor is the INVERSE of September's** — CPI + Beige Book 10-14, PPI 10-15, import/export + opex 10-16 all land *before* the gate, leaving **10-19 → 10-26 with no tracked event at all**, so September's "no short vol across the window" rule is explicitly NOT inherited. Adjacency sweep: **peers** — none; `symbols: []`, exposure inherited from [`fomc-2026-10-28.md`](fomc-2026-10-28.md) (front-end, not equity-vol, transmission on this chair). **Macro** — Warsh's 8/28 keynote left September hike odds ~51–58% and October ~58% in prediction markets, cut 0% (CNBC/Forbes/Polymarket, 8/28–8/30); no print since. **Volatility** — VIX **14.43** at the 8/28 close, a 2026 low, unchanged from the sibling docs' reading. **Geopolitical/policy** — the **2026-09-30** FY2027 funding deadline (`estimate`) is the corridor's real load-bearing date: a lapse cancels CPI 10-14 on the 2025 precedent and sends the Fed into blackout with no October inflation read. Midterms **11-03** (est) sit five days past the gate, raising leak-aversion inside it. **Event tape** — Warsh's stated "quieter Fed" / forward-guidance-retired program means the channel this gate closes is already throttled, which *weakens* the September framing rather than extending it; federalreserve.gov's October calendar lists no governor speech 10-12 → 10-17. **Two new dated adjacencies proposed to `market-events.ts` as `estimate`** (both off federalreserve.gov's October calendar, fetched today): **`fomc-minutes-2026-10-07`** and **`beige-book-2026-10-14`** — the only Fed publications in the corridor, both outside the gate, and the Beige Book survives a lapse where BLS does not. | — (stance set: one deadline at the 2026-10-16 close, a pre-decided lapse branch, and an explicit refusal to inherit September's window rule; no directional position) | 2026-09-21 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
