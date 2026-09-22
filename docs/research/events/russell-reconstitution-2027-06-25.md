# FTSE Russell US indexes — June semi-annual reconstitution, implemented after the close — russell-reconstitution-2027-06-25

**Kind:** sector · **Date:** 2027-06-25 (estimate — EST: rule-derived from the owner's own ground rules, no 2027 calendar published yet. FTSE Russell, *Russell US Equity Indexes* construction and methodology, v7.2, August 2026, re-fetched direct 2026-09-06 (HTTP 200, 746,491 bytes) and text-extracted in-session. §4.2.3: "Reconstitution occurs on the fourth Friday in June and the second Friday in December"; Appendix F: Implementation = "4th Friday of June", "the day changes are made after the close of the market and become effective at the open on the Monday following". June 2027's fourth Friday is 06-25, effective at the open Mon 2027-06-28. Stays `estimate` because the 2027 calendar is not published until spring 2027, and this calendar's confirmed-tier prefixes have no member for an index owner) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2027-06-29","fomc-minutes-2027-06-30","sp-select-sector-secondary-reweight-2027-06-30"],"screenStreak":0,"blocked":[{"url":"https://www.lseg.com/en/ftse-russell/index-reconstitution","status":"404","at":"2026-09-06"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"429","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"200_JS_CHALLENGE","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside on June 2027, and watch 2026-12-11 instead.** The date is solid — two independent
clauses of FTSE Russell's own ground rules give **2027-06-25**, and this session *proved* they can never
disagree (36 of 36 Junes, 2005–2040). Everything else this event inherited is weaker than it looked.
**(1) It is not "the annual reconstitution" any more.** Beginning in 2026 the Russell US indexes
reconstitute **semi-annually — June *and* December** (§4.2.3, owner's page verbatim), and the first
December leg, **2026-12-11**, was not on this calendar at all. It is 96 days out, not 292, and it lands on
the same session as `cr-expiry-2026-12-11` and `government-funding-deadline-2026-12-11`. Proposed this
session. **(2) "The year's heaviest closing auction" is received wisdom, and the tape refuses the loose
version of it:** across 2006–2026 the recon session is the year's #1 IWM volume day in **0 of 21** years,
June's own heaviest in **2 of 21**, and out-volumes June quad-witching in **10 of 20** — a coin flip. Its
best rank ever (7th, 2016) is the **Brexit** result day. The strict version survives untested: the owner's
own figure is **$553.9bn** traded in June 2026's closing moments, an *auction* number that whole-day ETF
volume cannot see, and this session had no auction instrument. **(3) The index effect is visible and does
not survive its own placebo.** IWM-vs-SPY **D0→D+5 = −0.87%** against −0.06% unconditional (bootstrap
**p=4.8%**, n=11) — but running the identical test on the fourth Friday of all twelve months flags exactly
one month under p=0.05, which is what twelve tries produce by chance (Šidák ≈ **44%**), and p swings
**1.7% → 24.4%** on window length alone. A registered hypothesis, not an edge — and its short leg is
blocked house-wide. Date `estimate`, no house playbook is index-flow-keyed (re-grepped: zero hits);
nothing here licenses a position on any horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-292, `symbols: []`, no index-flow playbook exists, and the constituent list that defines this event's flow is not set until Rank Day **2027-04-30** — nothing about 2027-06-25 is knowable today | A house index-flow instrument being built and back-tested before **2027-06-25** — "nothing to size this with" stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Stand aside** | High | No Russell milestone falls in it; the nearest is the December rank day, **2026-10-30**, eight weeks out | FTSE Russell publishing a 2027 reconstitution calendar before **2026-09-13** — the ground rules say one comes "each spring", so an early publication would be a schedule change worth reading |
| This month | **Stand aside** | High | The next dated thing in this event's own chain is **2026-10-30** (December rank day), outside this window; the June 2027 chain does not start until **2027-04-30** | Any FTSE Russell methodology notice before **2026-10-06** changing the fourth-Friday/second-Friday rule or the semi-annual frequency — the whole date derivation below is then stale |
| This quarter | **Watch 2026-12-11, take no position** | Medium | The first December reconstitution in the family's history is the *only* observation that tells us what June 2027's turnover will be, and it prints inside this quarter — registered as `FT-russell-reconstitution-2027-06-25-1` | 2026-12-11's IWM whole-day volume ratio printing **below 1.20×** trailing-60d — the December leg does not register at the whole-day ETF level, and the two-forced-days premise this ledger carries into June 2027 needs re-pricing |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (rule-derived, no 2027 calendar published) — it widens caution about the 2027-06-25 close and licenses **no** date-keyed action.
- **Never trade the reconstitution.** No house playbook is index-flow- or calendar-keyed (zero grep hits), and the one measured shape has a short leg that is blocked house-wide.
- **The date is robust to the ambiguity in the rules.** §4.2.3 says "fourth Friday in June"; §9.3.1 says "fourth Friday in June (unless the last Friday occurs on the 29th or 30th, when reconstitution will occur on the Friday prior)". Enumerated 2005–2040: **0 disagreements in 36 years**.
- **The regime changed and the calendar had not caught up** — reconstitution is **semi-annual since 2026**. Every pre-2026 June base rate describes a June that carried a full year of drift alone.
- **The near-term watch is 2026-12-11**, not anything in June: first-ever December leg, 96 days out, on the same session as a government-funding deadline and a CR expiry.
- **The volume story is a coin flip, not a spike** — recon-day IWM at a **1.42×** median trailing-60d ratio (1.33× ex-Brexit); it beat June opex in 10 of 20 years.
- **The auction claim is untested here, not refuted** — $219.9bn (NYSE) + $334.0bn (Nasdaq) in June 2026's closing moments is the owner's own number, and no instrument in this repo measures auction notional.
- **Execution hygiene is the only real contact point**: the 2027-06-25 close is a mechanically forced auction, and 2027-06-28's open carries the reconstituted weights.
- Dated watch list: **2026-10-30** Dec rank day → **2026-11-13** Dec preliminary lists → **2026-12-11** Dec implementation (*the forward test*) → spring 2027 the 2027 calendar publishes → **2027-04-30** June rank day → **2027-05-21** June preliminary lists → **2027-06-04** query period ends → **2027-06-25 implementation** → effective at the open **2027-06-28**.

## Initial research

### The question

`russell-reconstitution-2027-06-25` reached this calendar as a proposal from the
[`sp-select-sector-secondary-reweight-2027-06-30`](sp-select-sector-secondary-reweight-2027-06-30.md)
adjacency sweep, which filed it because it lands inside that event's drift window and described it as
"the largest scheduled single-day forced-trade event in the US equity calendar" — while explicitly
flagging that framing as *"received wisdom this session did not measure."* Two questions follow. **Is the
date right, from the owner's own primary rather than a sibling's read?** And **does the received wisdom
survive being measured?**

**One-line verdict:** the date is right and now provably robust to a carve-out clause nobody had read —
but the framing around it is wrong twice over: reconstitution has been **semi-annual since 2026** and its
untracked December leg is the event actually worth watching, and the "heaviest day of the year" claim
fails on whole-day volume in every one of 21 years while its strict auction-level version remains
untested here.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow
instrument. Nothing below is taken from the proposing sibling on faith:

- **FTSE Russell ground rules** — *Russell US Equity Indexes* construction and methodology, **v7.2, August
  2026**, re-fetched direct (HTTP 200, **746,491 bytes**, 50 pages) and text-extracted **in-session** by
  inflating the PDF's 77 content streams and reading the text-showing operators. §4.2.3, §4.3.1, §9.3.1
  and Appendix F read in full.
- **FTSE Russell's own reconstitution page** — `lseg.com/en/ftse-russell/russell-reconstitution` (HTTP
  200, **228,333 bytes**), which extracted to **13,681 characters** of real content this session against
  the **838** a sibling got from the same URL on the same day. That difference is the origin of most of
  what is new here, and it is recorded rather than glossed: the page is client-rendered and its yield is
  not stable across fetches.
- **Yahoo daily bars** — IWM, SPY, IWB, `^VIX`, 2005-01-03 → 2026-09-04, fetched this session with
  backoff (`query1` returned **429** persistently and is recorded in `probe-ref`; `query2` succeeded after
  retry). Volume, raw closes and adjusted closes.
- **NYSE 2027 closures** — taken from this repo's existing entries
  ([`juneteenth-market-closure-2027-06-18`](juneteenth-market-closure-2027-06-18.md)) rather than
  re-fetched; the only June 2027 closure is 06-18, and 06-25 is a full session.
- **This repo** — `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped for
  `rebalanc|index effect|select sector|capping|secondary reweight|reconstitution|russell` → **zero hits**;
  the proposal file that carried this id read in full before anything was written; the proposing sibling's
  ledger read in full.

### Conviction legs, tested

1. **The date is correct, and it is now robust to a carve-out clause the proposing sibling did not read —
   SUPPORTED, and the robustness is proved rather than asserted.** The sibling derived 2027-06-25 from
   Appendix F's "4th Friday of June" alone. §9.3.1 states a different formulation for the same
   implementation date: changes implement on the *"third Friday of March, **fourth Friday in June (unless
   the last Friday occurs on the 29th or 30th, when reconstitution will occur on the Friday prior)**,
   third Friday in September and second Friday in December."* A carve-out that moves the date under a
   stated condition is exactly the kind of clause that quietly invalidates a rule-derived entry — so it
   was enumerated rather than reasoned about. Across **every June from 2005 to 2040 (36 years)** the two
   readings return the identical date in **36 cases and disagree in 0**. The reason is structural: June's
   last Friday falls on the 29th or 30th **iff** June has five Fridays, and a five-Friday June's
   *Friday-prior-to-last* **is** its fourth Friday. The carve-out is a no-op restatement for an
   alternative "last Friday" phrasing. June 2027 has four Fridays (06-04 / 06-11 / 06-18 / 06-25), so the
   condition does not even fire. **The sibling's date was right; it is now right for a reason.**

2. **Reconstitution is semi-annual, not annual — SUPPORTED, and it corrects this event's own inherited
   title.** The proposal called this "the **annual** June reconstitution". Ground rules §4.2.3, verbatim:
   *"Reconstitution occurs on the fourth Friday in June and the second Friday in December."* The owner's
   page states the change directly: *"Beginning in 2026, the Russell Indexes are reconstituted
   semi-annually, in June and December."* Appendix F carries two full schedule columns — June (Rank Day
   last business day of April, preliminary five weeks prior, lockdown three weeks after query) and
   December (Rank Day last business day of October, preliminary **four** weeks prior, lockdown two weeks
   after query). The canonical file's title is corrected accordingly. This is not cosmetic: **it is the
   premise under which every historical base rate in leg 4 and leg 5 was generated**, and those base rates
   all come from a regime where June carried twelve months of membership drift by itself.

3. **The first December reconstitution is 2026-12-11, it was untracked, and it collides with two `high`
   entries — SUPPORTED, and it is the most decision-relevant finding here.** Applying §4.2.3's
   second-Friday rule: December 2026's Fridays are 12-04 / **12-11** / 12-18 / 12-25. The owner states the
   date independently and verbatim — *"The newly reconstituted indexes take effect after the market close
   on December 11, 2026"* — along with rank day *"Friday, October 30"* (October 2026's last business day
   ✓) and preliminary lists *"beginning November 13"* (exactly 28 days = the four-week rule ✓). This
   calendar tracked **nothing** on that mechanic. What it *does* track on 2026-12-11 is
   [`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md) (**high**) and
   [`government-funding-deadline-2026-12-11`](government-funding-deadline-2026-12-11.md) (**high**), one
   session after [`cpi-2026-12-10`](cpi-2026-12-10.md) (high) and two after
   [`fomc-2026-12-09`](fomc-2026-12-09.md) (high). Proposed as
   `proposals/russell-reconstitution-2026-12-11.from-<this-id>.json` (`estimate`), together with the June
   2027 preliminary-list date (leg 8). **The collision cuts both ways and is stated as such**: it makes a
   *high* volume print on 2026-12-11 uninformative about reconstitution, so leg 9's forward test is framed
   on the low side only.

4. **"Reliably the year's heaviest closing auction" fails on whole-day volume in all 21 years —
   SUPPORTED (negative result), and it is the claim the proposing sibling asked someone to measure.**
   IWM and SPY daily bars, recon day = the fourth Friday of June, volume normalised to its own trailing-60
   session median:

   | Test | Result |
   |---|---|
   | Recon is the year's **#1** IWM volume session | **0 of 21** years (2006–2026) |
   | Recon's best year-rank ever | **7th of 252** — 2016-06-24, the **Brexit** referendum result day |
   | Recon is **June's own** heaviest IWM session | **2 of 21** (2016, 2019) |
   | Recon out-volumes June **quad-witching** (3rd Friday) | **10 of 20** — a coin flip |
   | Recon-day IWM volume ratio, 2016–2025 | mean 1.53× · **median 1.42×** · **1.33× median excluding Brexit** |

   **What this refutes and what it does not.** It refutes the loose reading — that the session is a
   visible market-wide volume outlier — decisively and in every year. It says **nothing** about the strict
   reading, because the flow is concentrated in the *closing auction* and whole-day consolidated ETF
   volume is the wrong instrument for auction notional. The owner's own figure for June 2026 is
   **$219.9bn on NYSE and $334.0bn on Nasdaq** traded "in the closing moments" — $553.9bn, plausibly the
   largest auction of the year, and unmeasurable with anything in this repo. **The honest verdict is that
   the received wisdom is about a quantity nobody here can see, and the quantity we can see does not
   support the paraphrase it usually travels as.**

5. **The index effect is visible on our tape and does not survive its own placebo — MIXED, and the
   placebo is the finding.** The published index-effect claim is that additions run up into
   implementation and reverse after. Tested at index level as IWM minus SPY on total-return closes, 11
   recon events 2016–2026, against an unconditional overlapping base rate from the same era
   (2015-06-01 → 2026-09-04, n=2,829):

   | Window | Recon mean | Recon median | Sign | Unconditional mean | One-sided bootstrap |
   |---|---|---|---|---|---|
   | D−5 → D0 (run-up) | **+0.62%** | +0.31% | 7/11 positive | −0.06% | **8.1%** |
   | D0 → D+5 (reversal) | **−0.87%** | −0.72% | 7/11 negative | −0.06% | **4.8%** |

   The shape is right and the reversal reaches nominal significance. **Two checks kill the claim of an
   edge.** *Window instability*: the same reversal test at k = 1 / 2 / 3 / 5 / 7 / 10 sessions gives
   p = 7.9% / 15.1% / 10.8% / **4.4%** / **1.7%** / 24.4% — a result that appears and vanishes on the
   choice of horizon is a result about the horizon. *The placebo*: run the identical D0→D+5 test on the
   **fourth Friday of every month**, where only June carries a reconstitution. June is indeed the most
   negative of the twelve (−0.87%, p=4.8%) — but flagging exactly one of twelve months under p=0.05 is
   precisely the yield of chance, and the Šidák-corrected probability of seeing *some* month this extreme
   is ≈ **44%**. July prints p=11.1% with no mechanism at all. **So the tape is consistent with the
   literature and cannot distinguish it from noise at n=11.** Registered as a forward test, not carried as
   a belief. Dropping the two crisis years (2016 Brexit, 2020 COVID) leaves it materially unchanged
   (n=9, −0.91%, p=5.1%), so the result is not an outlier artefact — it is simply underpowered.

6. **Even if leg 5 were real, it would be unactionable here — SUPPORTED, and it is why the call is a
   refusal rather than a small position.** The reversal is the significant leg, and capturing it requires
   being short IWM (or short IWM against long SPY). `docs/plans/trade-playbooks.md` states **"No shorting
   in the first cut."** The run-up leg, which is long-only, is the *weaker* of the two (p=8.1%) and would
   need a 5-day directional small-cap position sized off an n=11 result that its own placebo cannot
   distinguish from noise. **Confidence drives size, and this size is zero.**

7. **The first semi-annual June shows no detectable turnover dilution — SUPPORTED (negative result),
   n=1.** The natural prediction from leg 2 is that splitting reconstitution across two dates halves
   June's forced flow, so June 2026 — the first June under the new regime — should print a lower
   volume ratio than its annual-regime predecessors. It did not: **1.46×**, against a 2016–2025 mean of
   1.53× and an ex-Brexit mean of **1.39×**. It is slightly *above* the ex-Brexit average. One
   observation on a noisy instrument settles nothing, which is exactly why leg 9 registers the December
   leg rather than this one — but it does mean **no evidence yet supports discounting June 2027 for the
   regime change**, and any stance that assumed dilution has nothing to stand on.

8. **The June 2027 milestone chain derives cleanly and its conventions check against both published
   instances — SUPPORTED.** Appendix F gives the June schedule as Rank Day = last business day of April,
   Preliminary Information Released = five weeks prior to implementation, Query Period = two weeks
   following, Lock down = three weeks after query ends. The schedule is **internally consistent** (5 = 2 +
   3), which is itself a check on the reading. Applied to a 2027-06-25 implementation: rank day **Friday
   2027-04-30**, preliminary lists **Friday 2027-05-21**, query period ends **Friday 2027-06-04**, changes
   effective at the open **Monday 2027-06-28**. **The five-week convention is confirmed, not assumed** —
   against both instances the owner has published: June 2026 implemented 2026-06-26 with prelims
   "beginning on May 22", exactly **35 days**; December 2026 implements 2026-12-11 with prelims beginning
   2026-11-13, exactly **28 days** against a four-week rule. Two conventions, two instances, both exact.
   The preliminary date is proposed as its own entry
   (`proposals/russell-recon-preliminary-2027-05-21.from-<this-id>.json`, `low`) because it is the
   *information* event where 2027-06-25 is the *execution* event, and a calendar that tracks only the
   latter cannot see the former.

9. **The December leg is the one dated, scoreable test available before June 2027 — SUPPORTED, and it is
   registered.** Under the annual regime December's second Friday was an ordinary session — no
   reconstitution, no expiration, no quarter-end — and it printed IWM whole-day volume at a mean **1.14×**
   / median **1.08×** trailing-60d across 2016–2025, with a maximum of 1.57×. That is the before-picture.
   If the December reconstitution moves real flow, 2026-12-11 should print materially above it.
   Registered as `FT-russell-reconstitution-2027-06-25-1`, deliberately framed on the **low** side because
   of leg 3's confound: a high print could be the government-funding deadline, a low print cannot be
   anything but an absent reconstitution effect.

10. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` grepped this session for
    `rebalanc|index effect|select sector|capping|secondary reweight|reconstitution|russell`: **zero
    hits**. S1/G1 are earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings
    reaction-day fade (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a
    don't-trade-the-open execution rule. **The only contact point is execution hygiene** on the
    2027-06-25 closing auction and the 2027-06-28 open.

### What the conditions support

Nothing directional, on any horizon. Six outputs: **a proof where there was an assumption** (the §9.3.1
carve-out never changes the date — 36 of 36 Junes); **a corrected premise** (reconstitution is
semi-annual since 2026, and this event's own title said otherwise); **a near-term dated event the
calendar was missing** (2026-12-11, 96 days out, on a government-funding deadline); **a measured refusal
of received wisdom** (recon is the year's #1 volume session in 0 of 21 years, and beats June opex at a
coin flip); **a placebo that disarms a tempting result** (the index-effect reversal is the most negative
of twelve months, which is what twelve tries produce by chance); and **a null that removes a plausible
discount** (the first semi-annual June printed 1.46×, not below its annual-regime predecessors).

### Honest limits

**The instrument is wrong for the headline claim and this is the single biggest caveat.** Reconstitution
flow executes in the closing auction; IWM/SPY whole-day consolidated volume is a blunt proxy that
includes the entire session and every unrelated trade in it. Leg 4 therefore refutes a paraphrase, not
the owner's own $553.9bn figure, and a future session with auction-level data (NYSE/Nasdaq closing-auction
notional, or MOC imbalance prints) could reverse the emphasis entirely without contradicting a number
here. **IWM is an ETF tracking the Russell 2000, not the reconstitution itself** — the flow is in the
underlying names being added, deleted and migrated between the R1000 and R2000, and an index-level proxy
sees the *net* of two-sided flow that largely cancels. Leg 5's effect sizes are consequently a floor on
any single-name effect and say nothing about it. **Leg 5's statistics are overlapping-window bootstraps,
not independent draws**, n=11 events against 2,829 overlapping base-rate windows; the placebo itself
inherits that dependence, and I ran more than a dozen tests across two directions and six horizons before
reporting — the multiple-comparison problem is *mine*, not just the twelve months'. **Leg 7 is n=1.**
**Leg 1's proof is arithmetic about calendars, not about FTSE Russell's behaviour** — it shows the two
*published clauses* cannot disagree, not that the owner will never publish a 2027 calendar that departs
from both; the ground rules say a full calendar comes each spring, and until it does this entry is
rule-derived. **Leg 3's December date is read from a client-rendered page whose extraction yield varied
between two sessions on the same day** (838 vs 13,681 characters) — the date is corroborated by the
independent §4.2.3 rule and by the four-week arithmetic, but the page is not a stable source and a
re-fetch may not reproduce it. **Nothing here forecasts which names are added or deleted**; membership is
not determined until Rank Day 2027-04-30 and not public until 2027-05-21. Every trading-adjacent statement
carries this entry's `estimate` label; shorting is blocked house-wide and no house playbook is
index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived from the owner's ground rules; regime facts corroborated by
the owner's own page).** Treat 2027-06-25 as a **certain, mechanically forced, entirely unactionable flow
date** — and treat **2026-12-11 as the event actually worth a session's attention**. Four legs, all
measured rather than inherited. **(a) The date is the strongest part of this entry and the framing was the
weakest.** Two independent ground-rules clauses give 2027-06-25 and provably cannot disagree in any June
from 2005 to 2040; meanwhile the event arrived here titled "annual" when the owner moved to semi-annual
reconstitution in 2026, and its December leg — the first in the family's history — was not on this
calendar at all. **(b) The received wisdom that motivated the proposal does not survive the tape it can be
tested on.** The recon session is the year's #1 IWM volume day in 0 of 21 years and beats its own June
quad-witching at a coin flip; the strict auction-level claim ($553.9bn in June 2026's closing moments)
stands untested because nothing here measures auction notional, and that gap is named rather than
papered over. **(c) The one tempting result is disarmed by its own placebo.** The D0→D+5 IWM-vs-SPY
reversal is −0.87% at p=4.8%, the most negative of twelve months tested — which is exactly the yield of
twelve tries, Šidák ≈ 44%, and p ranges 1.7%–24.4% on horizon choice alone. Its capturing leg requires
shorting, blocked house-wide. **(d) The regime change has produced no measurable dilution yet.** June
2026, the first semi-annual June, printed 1.46× against an ex-Brexit annual-regime mean of 1.39×; anyone
discounting June 2027 for the split has n=1 pointing the other way. What is **not** settled, and is
carried forward as this event's central open question: **how the semi-annual split actually divides
turnover** — 2026-12-11 is the first observation, and it is registered rather than guessed. Carry forward
one correction that outlives this event: **Russell reconstitution is semi-annual as of 2026, and December's
second Friday is now a forced-flow date.**

**Kill switches:**

- **2026-12-11's IWM whole-day volume ratio prints below 1.20× trailing-60d** — the December leg does not
  register at the whole-day ETF level, the "two forced-flow dates" premise carried into June 2027 is
  wrong, and June 2027 should be re-priced as still carrying the full year's turnover. Registered as
  `FT-russell-reconstitution-2027-06-25-1`.
- **FTSE Russell publishes a 2027 reconstitution calendar naming a date other than 2027-06-25** — leg 1's
  36-of-36 proof covers the two published *clauses*, not a departure from both; the entry, its corridor
  position inside `sp-select-sector-secondary-reweight-2027-06-30`'s drift window, and the whole milestone
  chain in leg 8 all need recomputing. Re-check the owner's calendar page every pulse from spring 2027.
  Registered as `FT-russell-reconstitution-2027-06-25-2`.
- **An auction-level instrument (closing-auction notional or MOC imbalance) shows the recon session IS the
  year's largest auction** — leg 4's refusal is revealed as an artefact of the wrong instrument, the
  received wisdom stands in its strict form, and the execution-hygiene note becomes the headline rather
  than a footnote. This is the *expected* direction if such data ever arrives; leg 4 refutes a paraphrase,
  not the claim.
- **The index-effect reversal repeats in June 2027 and June 2028 with the same sign** — leg 5's placebo
  objection weakens with each out-of-sample print, and at n=13 the sheet is rebuilt on measured data
  rather than refused on power. Registered as `FT-russell-reconstitution-2027-06-25-3`.
- **FTSE Russell reverts to annual reconstitution, or changes the fourth-Friday / second-Friday rule** —
  legs 1, 2, 3 and 8 all rest on ground rules v7.2 (August 2026). Re-check the ground-rules PDF's version
  string at every pulse; a v7.3 that touches §4.2.3, §9.3.1 or Appendix F invalidates the derivation.
- **A house index-flow instrument gets built** — leg 10's "no playbook is index-flow-keyed" stops being a
  grep result and this sheet is rebuilt on house data.
- **A US macro print or tracked-name earnings date gets scheduled onto 2027-06-25 or 2027-06-28** — the
  corridor around the implementation close changes and the execution note needs re-sizing. Re-run the
  adjacency scan every pulse.

**Registered forward tests.** `FT-russell-reconstitution-2027-06-25-1`, `-2` and `-3` — see
[`forward-tests/russell-reconstitution-2027-06-25.md`](../forward-tests/russell-reconstitution-2027-06-25.md).
Observations, never templates.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-292 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-sp-select-sector-secondary-reweight-2027-06-30.json`, read in full first). probe-ref baseline set (no symbols, **VIX 14.53** at the 2026-09-04 close, band `medium:31+`, 3 adjacents, 3 blocked fetches). **Date proved, not assumed:** ground rules v7.2 §4.2.3 ("fourth Friday in June and the second Friday in December") and §9.3.1's carve-out ("unless the last Friday occurs on the 29th or 30th, when reconstitution will occur on the Friday prior") were enumerated over **every June 2005-2040: 36 agreements, 0 disagreements** — a five-Friday June's Friday-prior IS its fourth, so the carve-out is a no-op. **Title corrected:** reconstitution is **semi-annual since 2026** (§4.2.3; owner's page "Beginning in 2026… semi-annually, in June and December"), not annual as the proposal had it. **New dated adjacency FILED — the headline:** the **first December reconstitution in the family's history implements 2026-12-11** (owner's page verbatim; reproduced from the second-Friday rule; rank day 10-30 ✓, prelims 11-13 = exactly 4 weeks ✓) and was **untracked** — 96 days out, on the same session as `cr-expiry-2026-12-11` and `government-funding-deadline-2026-12-11` (both **high**), 1 day after CPI and 2 after FOMC. Proposed, with the June 2027 preliminary-list date **2027-05-21** (5-week convention confirmed exact against both published instances: 2026-05-22→06-26 = 35d, 2026-11-13→12-11 = 28d). **Received wisdom MEASURED and refused in its loose form:** the proposer flagged "the year's heaviest closing auction" as unmeasured — on IWM/SPY daily bars 2006-2026 recon is the year's **#1 IWM volume day in 0 of 21**, June's own heaviest in **2 of 21**, and beats June quad-witching **10 of 20**; median ratio **1.42×** (**1.33× ex-Brexit**; its best-ever rank, 7th in 2016, IS Brexit). The strict auction claim stands **untested** — the owner's own $219.9bn NYSE + $334.0bn Nasdaq "closing moments" figure is unmeasurable with any instrument here, and that is named as the biggest limit. **Tempting result disarmed by its own placebo:** IWM-vs-SPY **D0→D+5 = −0.87%** vs −0.06% unconditional (bootstrap **p=4.8%**, n=11, 7/11 negative; run-up D−5→D0 +0.62%, p=8.1%) — but the same test on the 4th Friday of all **twelve months** puts June extreme while flagging exactly one month at p<0.05, the yield of chance (**Šidák ≈44%**), and p swings **1.7%→24.4%** on horizon alone; robust to dropping 2016/2020 (n=9, −0.91%, p=5.1%) — underpowered, not artefactual. Its short leg is **blocked house-wide**. **Regime null:** the first semi-annual June (2026) printed **1.46×**, *above* the ex-Brexit annual mean 1.39× — no turnover dilution detectable, n=1. **Adjacency — peers:** none (`symbols: []`). **Macro:** corridor = consumer confidence 06-29, FOMC minutes 06-30, Select Sector secondary test 06-30, all `estimate`, all after implementation. **Vol:** baseline, no prior; VIX 14.53, IWM 296.01, SPY 770.19 (2026-09-04 closes). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `russell` → **zero hits**. Registered **FT-…-1** (2026-12-11 IWM volume ratio ≥1.33× vs the 1.14× Dec-2nd-Friday baseline; framed low-side because the funding-deadline collision confounds a high print), **FT-…-2** (the published 2027 calendar names 2027-06-25), **FT-…-3** (the D0→D+5 reversal does NOT repeat in June 2027). | — (stance set: stand aside on Today/week/month, **watch 2026-12-11** this quarter; the refusal rests on a measured 0-of-21 volume null, a placebo-disarmed index effect whose live leg needs blocked shorting, and zero playbook fit — with one open question, how the semi-annual split actually divides turnover) | 2026-09-27 (medium, ≥31d band: every 21d). Close-out by 2027-07-01 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-reconstitution-2027-06-25.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
