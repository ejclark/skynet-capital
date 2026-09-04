# NERC deadline to file mandatory reliability standards for computational load (FERC Docket RD26-7-000) — nerc-computational-load-standards-2026-12-31

**Kind:** sector · **Date:** 2026-12-31 (estimate — the deadline is now **documentary rather than press-reported**: NERC's own project page for **Project 2026-02 Computational Loads** was fetched direct 2026-09-04 (`nerc.com/standards/reliability-standards-under-development/2026-02-computational-loads`, HTTP 200 with a browser header set) and carries the three draft standards, the open comment period and the ballot windows that exist only to meet it. The **FERC order** itself is still not primary-read — `ferc.gov` returns 403 behind Cloudflare and `elibrary.ferc.gov` is an Angular SPA whose search API could not be reached headlessly — so the order's terms rest on three independent law-firm/trade reads that agree on docket, date and citation: Willkie Farr (2026-07-30, full text extracted, citing *Reliability Standard(s) Pertaining to Computational Load Integration*, **196 FERC ¶ 61,031 (2026)**), Troutman (2026-07-22) and POWER Magazine (2026-07-16). Checked 2026-09-04) · **Impact:** low
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{},"vix":14.21,"daysBand":"low:15+","adjacentIds":["fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The deadline is real and now primary-corroborated on the NERC side — and it is still
not a trade, because 12-31 is a *filing* date, not an effective date.** What NERC must hand FERC
by year-end are proposed standards; they take effect only after FERC approves them (2027 at the
earliest) and after an implementation-plan runway on top of that. So nothing is enforceable on
12-31 and nothing prices off it. The upgrade this session buys is different and better: the
**substance** is now visible in draft, on NERC's own site, and it is more consequential than the
date. Project 2026-02 has three brand-new standards out for comment — **CLO-001-1**
(interconnection, studies, modeling data), **CLO-002-1** (operational data and communications) and
**CLO-003-1** (protection coordination and disturbance monitoring) — plus **FAC-001-5 / FAC-002-5**
revisions, new Glossary terms (*Computational Load Entity · Owner · Operator*) and a Rules of
Procedure change that would make data centers **registered functional entities** in their own
right, directly exposed to FERC's civil penalty authority of **$1,584,648 per violation per day**.
The number that decides how much of the US fleet that reaches is the **applicability threshold**,
currently drafted at **≥50 MW connected load behind a ≥100 kV BPS connection** — *broader* than
ERCOT's already-approved 75 MW rule. It is under comment through **2026-09-18** and can move. That
threshold, not the deadline, is what this ledger tracks. And the cost question is already partly
answered next door: Texas approved the same class of ride-through obligation **5–0 on 2026-07-09**
(NOGRR282), where one secondary read puts compliance at **$0.5–1M per MW at some facilities** —
material to whoever owns the concrete, and rounding error against any name this book holds.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-118) | Stand aside | High | `symbols: []`, `estimate`, `low`, 118 days out, and no house playbook (S1/S2/E1/S3/S4 + G1) takes a regulatory trigger. There is no instrument to run and no name to size. | Nothing dated today; falsified only if a house playbook acquires a policy trigger |
| This week | Watch one dated thing: NERC's **initial ballot, 2026-09-09 → 09-18**, on CLO-001-1 / CLO-002-1 / CLO-003-1 | Medium-high | Primary (nerc.com, fetched 09-04): the ballot pool closed **09-03**, the 30-day comment period closes **8:00 p.m. ET 2026-09-18**, and the ballot runs inside it. This is the first place industry can push the ≥50 MW threshold. | The ballot window being re-posted to dates other than 09-09→09-18 on nerc.com **before 2026-09-11** → the schedule feeding 12-31 has already slipped at its first step |
| This month | Still no position; read the **posted comments** for what the ≥50 MW / ≥100 kV threshold gets pushed to | Medium | The draft threshold is broader than ERCOT's 75 MW, and Texas is the only jurisdiction with a costed precedent — so the loudest comment will be about scope. Whatever survives is the whole magnitude question. | NERC posting a **revised draft on or before 2026-10-31** that raises the threshold **above 75 MW** or drops it entirely → the national regime lands narrower than Texas and the sector-cost read here is too big |
| This quarter | Watch the chain **09-18 comment close → fall re-ballot → December Board adoption → 12-31 FERC filing**; carry it as a compliance-regime marker on the AI-infra sleeve, never a December trade | Medium | Three new standards, a new functional-entity class and a Rules of Procedure change in ~3 months is compressed, and NERC's own schedule already anticipates further ballots. Even met on time, the filing is the *start* of FERC review. | A **NERC filing at FERC on or before 2026-12-31 that is also self-effectuating** — i.e. any obligation binding on a computational-load owner before FERC approves it — would mean 12-31 is a compliance date, not a paperwork date, and this whole stance is mis-framed |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []`, `estimate`-dated, `low`
  impact, and the obligations land on facility owners/operators, not on the silicon names.
- **`estimate` here is split-grade.** The **NERC process** (project, standards, ballot windows) is
  primary-sourced from nerc.com today; the **FERC order** behind the 12-31 date is not, and
  `ferc.gov` has now failed a direct read twice. Do not read the strength of the first onto the second.
- **Watch (dated):** comment close + initial ballot **2026-09-09 → 09-18** (primary) · NERC Board
  adoption targeted **December 2026** (secondary) · FERC filing due **2026-12-31** (order-sourced,
  not primary-read) · Phase II work plan due **2027-03-01** (same sourcing, proposed to the
  calendar in this PR).
- **The one number to track is the applicability threshold**, drafted **≥50 MW / ≥100 kV**. Every
  cost estimate downstream is that threshold times the fleet it captures.
- **Escalate the impact tier** only if the filed standards carry a dated compliance obligation
  landing inside a quarter this book trades — a filing deadline never does.
- **Cross-ledger note, not a trigger:** the Texas track is the leading indicator for this one and
  it is dated *earlier* — [ercot-data-center-audit-filing-2026-12-10](ercot-data-center-audit-filing-2026-12-10.md)
  and [puct-batch-zero-report-open-meeting-2026-12-17](puct-batch-zero-report-open-meeting-2026-12-17.md)
  sit 21 and 14 days ahead of 12-31, and FERC's own record cites ERCOT's ride-through and dynamic-
  modeling work as the template. Same theme at the state level:
  [georgia-psc-data-center-cost-shift-2026-12-31](georgia-psc-data-center-cost-shift-2026-12-31.md).

## Initial research

### The question, plainly

The [gastech-2026-09-14](gastech-2026-09-14.md) research found this deadline while establishing
that the conference itself has no price channel, and filed it as a dated federal marker on this
calendar's data-center-power theme. So: **is the FERC order real and correctly dated, does NERC
actually have machinery capable of meeting 2026-12-31, what would the standards require, and does
any of it reach a book holding NVDA / MRVL / AVGO / CRWV / MSFT / GOOG / META / AAPL / AMZN plus
the AI-energy sleeve?**

**One-line verdict.** Real, and materially better-sourced than the calendar entry claimed — NERC's
own project page carries the drafts and the ballot calendar — but the tradeable content is zero on
12-31 by construction: it is a filing deadline whose output only becomes enforceable after a FERC
approval that does not exist yet. The value is a dated watch-chain on one number (the applicability
threshold) that decides how much of the US data-center fleet enters a penalty-backed reliability
regime, not a position.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(sector kind — no price or options instrument exists for it, and `symbols: []` leaves nothing to
run). Regulators' own sites attempted first: `nerc.com` reached (HTTP 200 with a full browser
header set; it 403s a plain fetcher), `ferc.gov` refused (403, Cloudflare interstitial),
`elibrary.ferc.gov` served its SPA shell but no reachable search API. Law-firm client alerts were
then used for the order's terms, with the Willkie memo's PDF streams inflated in-session so its
text and footnotes could be read rather than summarised. All fetches 2026-09-04.

### Legs tested

1. **"FERC ordered NERC to file computational-load standards by 2026-12-31."** **SUPPORTED, on
   three independent secondary reads that agree on every checkable field.** Willkie Farr
   (2026-07-30): "by December 31, 2026, NERC must file new or modified Reliability Standards to
   address reliability risks associated with the integration of large computational loads into the
   Bulk-Power System, finalize any associated NERC Glossary changes, and develop revisions to its
   Rules of Procedure, including registration criteria for computational-load entities," citing
   **196 FERC ¶ 61,031 (2026)**, Docket **RD26-7-000**, issued **2026-07-16**. Troutman
   (2026-07-22) and POWER Magazine (2026-07-16) state the same docket, date and deliverables. What
   is still missing is a primary read: `ferc.gov` has now 403'd on two separate sessions, so the
   entry stays `NEWS:`/`estimate`. **The order set no substantive requirements at all** — Willkie:
   "FERC did not prescribe any substantive requirements for the Reliability Standards, such as a
   specific size threshold or registration criteria, leaving these issues up to NERC's discretion."
   That is the single most important fact about 12-31: FERC bought a date, not a rule.
2. **"NERC has real machinery pointed at that date."** **SUPPORTED, and this is the session's
   provenance upgrade — primary, from nerc.com fetched today.** **Project 2026-02 Computational
   Loads** (Phase I) shows, verbatim: a **30-day formal comment period open through 8:00 p.m.
   Eastern, Friday, September 18, 2026**; **ballot pools formed through 8:00 p.m. Eastern, Thursday,
   September 3, 2026**; and **initial ballots conducted September 9–18, 2026**, covering
   **CLO-001-1 – Computational Load Interconnection, Studies, & Modeling Data**, **CLO-002-1 –
   Computational Load Operational Data and Communications**, **CLO-003-1 – Computational Load
   Protection Coordination & Disturbance Monitoring**, **FAC-001-5** and **FAC-002-5**, each with
   an implementation plan. Its Important Dates read SAR accepted and drafting team appointed
   **2026-03-18**, drafting authorized **2026-05-20**, initial posting authorized **2026-08-19**.
   The project's own background text names the Glossary terms under development — *Computational
   Load Entity*, *Computational Load Owner*, *Computational Load Operator* — as aligning "with
   revisions soon to be developed to the NERC Rules of Procedure Appendix 5B: Statement of
   Compliance Registry Criteria," and hands Phase II (MOD / TOP / IRO / COM families) to a
   follow-up SAR. So the 12-31 filing is not aspirational; it is the terminus of a process already
   at formal-posting stage.
3. **"12-31 is a date on which something becomes enforceable."** **REFUTED, and this is the whole
   trade answer.** A NERC filing under FPA §215 is a *proposal*: FERC must approve a standard
   before it is mandatory, and an approved standard then runs its implementation plan before
   obligations attach. Willkie's own read of the industry consequence is future-conditional
   throughout — registration "would impose compliance obligations," facilities "may need to
   reassess protection settings," and its Key Takeaway asks stakeholders to "treat the remainder
   of 2026 as a window to interface with regulators." One secondary summary puts FERC approval and
   the start of CLO/CLOP registration in **2027**. Nothing lands on 12-31 but paper.
4. **"The obligations, once real, are large enough to reach a tracked name."** **REFUTED for the
   silicon names, MIXED for the sleeve, and unquantified at the national level.** Three measurements,
   in descending confidence. **(a) Penalty exposure is trivial at these market caps:** FERC's civil
   penalty authority is **$1,584,648 per violation per day** (Willkie, citing 16 U.S.C. § 825o-1(b)
   and the 2025 inflation adjustment) — a real number for a mid-size operator, immaterial against
   hyperscaler capex. **(b) Capex exposure is real but lands on the wrong balance sheet:** the
   nearest costed precedent is Texas, where the PUCT approved **NOGRR282** ride-through requirements
   **5–0 on 2026-07-09** for computational loads **≥75 MW** with at least half the load through
   power electronics, inserting Nodal Operating Guide §2.6.4 (frequency) and §2.14 (voltage), and
   one secondary read puts compliance at **$0.5–1M per MW at some facilities**. Call that
   $150–300M on a 300 MW campus — meaningful to a colo owner or a developer's financing model, and
   0.2–0.3% of a single hyperscaler's annual capex. **(c) The transmission channel to silicon is
   absent:** nothing here changes GPU demand, interconnect content or a foundry schedule. The
   plausible-but-undated risk is *timing* — Willkie: "large-load projects may face more detailed
   technical review earlier in development" — which would slow buildout at the margin. Undated and
   unquantified is not a position.
5. **"The applicability threshold is settled."** **REFUTED — and it is the number worth tracking.**
   One secondary read (2026-07-27, updated 08-05) states the draft registration criterion as a
   "Computational Load Site of ≥ 50 MW total connected load, supplied through electrical equipment
   connected to the BPS at ≥ 100 kV." That is **broader than ERCOT's 75 MW**, it sits in a draft
   under comment through **09-18**, and FERC explicitly declined to set one — so it is the single
   most contestable number in the package and the most consequential, since it multiplies against
   the whole US fleet. Honest limit: this figure is **single-source secondary**; the primary
   confirmation is `clo-001-1-draft-1-clean.pdf` on nerc.com, which this session located by name in
   the project page's document list but did not extract. **Next pulse should pull that PDF.**
6. **"The scale of the underlying problem is documented, not asserted."** **SUPPORTED.** NERC has
   an incident record, not a forecast: a **July 2024 Virginia** event lost approximately **1,500 MW
   of data-center load across 60 points and 25 substations** after a transmission-line fault, and
   ERCOT — whose system peak is roughly half PJM's — has seen **more than 25 incidents losing
   100–450 MW** of computational load (Willkie, citing NERC's own incident review of 2025-01-08 and
   ERCOT's 2026-06 comments). NERC escalated to a **Level 2 alert 2025-09-09** and a **Level 3
   alert 2026-05-04** — the rare tier. Load context: data centers were ~**4.4% of US electricity in
   2023** heading to **6.7–12% by 2028** (LBNL), i.e. **176 TWh → 325–580 TWh** (DOE). The
   reliability concern is a measured behaviour — loads dropping off on voltage dips — not a
   projection, which is why the regime is arriving regardless of how the threshold lands.

### What the conditions support

Nothing to buy or sell. Three things to *do*, all documentary:

- **Pull `clo-001-1-draft-1-clean.pdf` from nerc.com on the next pulse** and read the applicability
  section directly, replacing leg 5's single secondary source with a primary one.
- **Read the posted comments after 09-18** for the threshold fight — that is where the magnitude of
  the eventual regime gets set, and it is the only genuinely uncertain thing on the path to 12-31.
- **Let the Texas ledgers lead this one.** [ercot-data-center-audit-filing-2026-12-10](ercot-data-center-audit-filing-2026-12-10.md)
  and [puct-batch-zero-report-open-meeting-2026-12-17](puct-batch-zero-report-open-meeting-2026-12-17.md)
  are dated ahead of 12-31 and cover the jurisdiction that already implemented this class of rule;
  what Texas learns about ride-through cost is the best available forecast of the national bill.

### Honest limits

- **No primary FERC read, two sessions running.** Everything about the order — the date, the
  deliverables, the citation — is secondary, however well-corroborated. `ferc.gov` 403s and
  eLibrary is unreachable headlessly; a browser-driven fetch was attempted this session and was not
  available. Until one succeeds, `estimate` is the honest status regardless of how many law firms
  agree.
- **The ≥50 MW / ≥100 kV threshold is single-source.** Named as the load-bearing number *and* as
  the weakest-sourced one in the same breath, deliberately.
- **The $0.5–1M/MW compliance figure is one secondary read, hedged in its own wording ("at some
  facilities")** — almost certainly a retrofit worst case rather than a fleet average. It is used
  here only to bound an order of magnitude, never as a cost estimate.
- **No instrument was run and none exists.** `symbols: []`; there is no price series for a filing
  deadline, and any December power-complex move is unattributable in a corridor that also carries
  [fomc-minutes-2026-12-30](fomc-minutes-2026-12-30.md) the day before and
  [china-retaliation-suspension-expiry-2026-12-31](china-retaliation-suspension-expiry-2026-12-31.md)
  and [georgia-psc-data-center-cost-shift-2026-12-31](georgia-psc-data-center-cost-shift-2026-12-31.md)
  on the same date. Evaluate this event on filings, never on price.
- **One dated adjacency was found and deliberately not proposed to the calendar:** the **09-18**
  comment/ballot close. It is a procedural date 14 days out with no price channel, and adding it
  would spend a full research session on a milestone this ledger's own falsifier already covers.
  The **2027-03-01** Phase II work-plan deadline *is* proposed in this PR — same shape as this
  entry, and the successor federal instrument on the theme.

## Stance & kill switches

**Stance (the event is `estimate`; nothing here licenses a date-keyed entry).** Stand aside on the
date and track one number. 2026-12-31 is a filing deadline with no enforceable consequence and no
price channel; it stays `low` impact and `symbols: []`. What earns continued tracking is that the
draft package would create a new class of NERC-registered entity — data centers — with direct,
penalty-backed reliability obligations, and the **≥50 MW / ≥100 kV** applicability threshold now
under comment decides how much of the US fleet that captures. The Texas precedent (NOGRR282,
approved 5–0 on 2026-07-09, ≥75 MW) is both the template FERC's record points at and the only
costed data point available; the ledgers tracking it are dated ahead of this one and should lead it.

**Kill switches.**

- **The stance's core claim dies** if any obligation in the 12-31 filing binds a computational-load
  owner *before* FERC approval — that would make 12-31 a compliance date, not paperwork, and the
  impact tier is wrong.
- **The "no price channel" call dies** if a tracked name (most plausibly CRWV, or a hyperscaler in
  a 10-Q risk factor) quantifies computational-load reliability compliance as a capex or schedule
  item **on or before 2027-03-01** — at that point there is an earnings channel and this is no
  longer a marker.
- **The date itself dies** if NERC posts a revised Project 2026-02 schedule pushing Board adoption
  out of December 2026, or files a request for extension at FERC, **on or before 2026-12-15**.
- **Leg 5 dies on its own evidence** the moment `clo-001-1-draft-1-clean.pdf` is read: if the
  primary draft carries a threshold other than ≥50 MW / ≥100 kV, that correction lands in the next
  ledger row and the "broader than ERCOT" framing goes with it.

**Registered forward tests** (both scored off one document — whatever NERC files at FERC — on
2027-01-15):

- **FT-nerc-computational-load-standards-2026-12-31-1** — NERC meets 12-31 **at full scope**: all
  three CLO standards Board-adopted in December 2026 and filed by 2026-12-31.
- **FT-nerc-computational-load-standards-2026-12-31-2** — the **≥50 MW / ≥100 kV** applicability
  threshold survives industry comment into the filed package, at that level or stricter.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D-118 | **Initial research.** Sourced-web only; `symbols: []`, no instrument exists. **Provenance upgraded on the NERC side:** `nerc.com` Project 2026-02 page fetched direct (HTTP 200, browser headers) — three draft standards **CLO-001-1 / CLO-002-1 / CLO-003-1** plus **FAC-001-5 / FAC-002-5**, comment period open through **8:00 p.m. ET 2026-09-18**, ballot pool closed **09-03**, **initial ballots 09-09→09-18**, new Glossary terms tied to **RoP Appendix 5B** registry criteria, Phase II handed to a follow-up SAR. **FERC side still not primary** — `ferc.gov` 403 (Cloudflare) and `elibrary.ferc.gov` SPA unreachable headlessly, second consecutive failure; order terms rest on Willkie 07-30 (PDF text extracted in-session; **196 FERC ¶ 61,031**), Troutman 07-22, POWER 07-16, all agreeing. **Key finding: FERC set a date, not a rule** — no size threshold or registration criteria prescribed. **Adjacency sweep:** peers n/a (`symbols: []`); macro — VIX **14.21** (CBOE delayed, 12:26 ET), a quiet regime; geopolitical/policy — Texas is the dated precedent, **PUCT approved NOGRR282 5–0 on 2026-07-09** (≥75 MW ride-through, NOG §2.6.4/§2.14), one secondary read costing compliance at **$0.5–1M/MW at some facilities**; event tape — draft applicability **≥50 MW / ≥100 kV**, *broader* than ERCOT, single-source secondary and the number to verify next. Incident base: **~1,500 MW lost, Virginia July 2024**, 60 points/25 substations; ERCOT **>25 events at 100–450 MW**; NERC **Level 3 alert 2026-05-04**. Corridor adjacents on/near the date: `fomc-minutes-2026-12-30`, `china-retaliation-suspension-expiry-2026-12-31`, `georgia-psc-data-center-cost-shift-2026-12-31` — December price moves in the power complex are unattributable. **Proposed to `market-events.ts` this PR:** `nerc-computational-load-phase-ii-workplan-2027-03-01` (`estimate`, `NEWS:`). **Not proposed, with reasons:** the 09-18 comment/ballot close (procedural, 14 days out, covered by this doc's own falsifier). | **Stance set:** stand aside on the date, track the applicability threshold. `low` impact affirmed — 12-31 is a filing deadline, not an effective date. Registered **FT-nerc-computational-load-standards-2026-12-31-1** (files at full scope by 12-31) and **-2** (≥50 MW / ≥100 kV threshold survives comment), both score-by **2027-01-15**. | 2026-10-04 (`low:15+` → 30d) — **first task: pull `clo-001-1-draft-1-clean.pdf` from nerc.com and read the applicability section primary** |
