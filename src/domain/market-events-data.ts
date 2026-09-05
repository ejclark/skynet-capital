/**
 * The curated forward market-event table — the data half of market-events.ts (types + query
 * functions live there; this file is nothing but the hand-maintained literal so the calendar can
 * grow with coverage without inflating the logic module's line budget). The MarketEvent shape
 * itself (EventKind/EventStatus/ImpactTier/the MarketEvent interface) lives one leaf further down,
 * in market-events-types.ts, and is imported + re-exported below — split out so the type
 * definitions and this hand-maintained table can each stay clear of Biome's per-file line budget.
 *
 * WHY A CHECKED-IN TABLE (same doctrine as earnings-calendar.ts): event dates change rarely, must
 * be reviewable in a diff (a wrong date silently corrupts every window and every assessment keyed
 * to it), and the trading path must never fetch the network to decide. Past dates age out safely
 * because every query in market-events.ts ignores them.
 *
 * WHO READS THIS: scripts/event-scan.mjs (the assessment scanner — it extracts the MARKET_EVENTS
 * literal below by matching the exported declaration line as a marker string, so keep that line's
 * exact `export const` + type-annotation + opening-bracket shape intact, AND keep the literal
 * itself — every element, inline — physically in this file: the scanner reads this file's raw
 * text and evaluates the bracket-balanced literal standalone, so it cannot resolve identifiers
 * from anywhere else; the drift gate in tests/arch/event-scan.spec.ts goes red if extraction and
 * the real re-export from market-events.ts ever disagree), plus every value-consumer of
 * MARKET_EVENTS, which all import it through market-events.ts (the re-export), never from here
 * directly.
 *
 * ORDER IS PART OF THE CONTRACT — add your entry in `(date, id)` position, never at the end.
 * `node scripts/event-scan.mjs --validate` fails a PR that breaks it and names the offending id;
 * `node scripts/sort-market-events.mjs` fixes the whole file. This is a merge fix, not tidiness
 * (#1341): appending put every concurrent research lane at the same anchor line, which is the one
 * case plain git cannot merge — 22 of 47 PRs touching this file were flagged conflicted at a median
 * 13.4 h to merge against 1 min unflagged (#1324). Date-ordered entries land at different anchors
 * and merge clean under GitHub's own server-side merge, which never runs a custom merge driver.
 * Same-date pairs still collide and fall back to scripts/merge-market-events.mjs, which resolves
 * them locally at whole-entry granularity — the two halves are designed to compose.
 *
 * DATE POLICY (inherited from earnings-calendar.ts / docs/plans/trade-playbooks.md): an
 * `estimate` may only WIDEN caution; date-keyed action requires `confirmed`. Research is not
 * action — estimate events still get researched — but every trading-adjacent statement written
 * about an event must carry its confirmed/estimate label honestly.
 *
 * SOURCE PREFIXES (the audit trail of HOW a date is known, extending IR:/CAL: from the earnings
 * calendar). `confirmed` requires a trusted prefix; `estimate` requires an honest one:
 *   confirmed — `IR:` company primary source · `CAL:` automated aggregator cross-ref ·
 *               `BLS:` bls.gov release schedule · `FED:` federalreserve.gov FOMC calendar ·
 *               `PJM:` pjm.com auction schedule · `SEC:` an SEC filing ·
 *               `TSY:` treasury.gov / treasurydirect.gov auction schedule ·
 *               `OCC:` options-expiration calendar (theocc.com / Cboe; 3rd-Friday standard) ·
 *               `BEA:` bea.gov release schedule (GDP, PCE) · `CENSUS:` census.gov schedule
 *               (retail sales, durable goods) · `ISM:` ismworld.org PMI calendar ·
 *               `CB:` conference-board.org consumer-confidence schedule
 *   estimate  — `EST:` cadence/reasoning estimate · `NEWS:` press-reported, not primary-verified
 * The scanner's `--validate` mode enforces this mapping.
 *
 * This file is the LEAF of the pair for market-events.ts: it owns the MARKET_EVENTS instances and
 * imports the MarketEvent shape from market-events-types.ts (a leaf below it). market-events.ts
 * imports (and re-exports) down into this file, and this file re-exports the shape unchanged —
 * one-directional all the way down (market-events.ts → market-events-data.ts →
 * market-events-types.ts), no cycle.
 */
import type { ImpactTier, MarketEvent } from "./market-events-types.js";

export type { ImpactTier, MarketEvent };

/**
 * Hand-curated non-earnings events. Earnings NEVER go here — they are derived from
 * UPCOMING_PRINTS so print dates keep exactly one source of truth (and confirm-print-dates.ts
 * keeps working unchanged). Seeded 2026-08-15; BLS/FED dates hand-verified against the primary
 * schedules that day (the aggregator check that day had the Dec CPI date WRONG — Dec 18 vs the
 * real Dec 10 — which is the whole case for the prefix discipline).
 */
export const MARKET_EVENTS: readonly MarketEvent[] = [
  {
    id: "treasury-20y-bond-2026-08-19",
    kind: "rates",
    title: "20-Year Treasury Bond auction",
    date: "2026-08-19",
    status: "confirmed",
    source:
      "TSY: treasurydirect.gov auction schedule — 1:00pm ET, announced 08-13, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Long-end supply. A weak bid-to-cover / tail lifts the 20–30Y and hits long-duration tech (CRWV highest-beta, NVDA). The pre-auction concession is the Aug-18 bond sell-off.",
  },
  {
    id: "texas-puct-audit-2026-08-20",
    kind: "sector",
    title: "Texas PUCT audit meetings begin (Vistra watch item)",
    date: "2026-08-20",
    status: "estimate",
    source: "EST: docs/research/ai-energy-constraint.md dashboard — confirm vs puct.texas.gov",
    impact: "low",
    symbols: [],
    notes: "Second half of VST's Tier-2 entry condition alongside the Dec PJM auction.",
  },
  {
    id: "treasury-30y-tips-2026-08-20",
    kind: "rates",
    title: "30-Year TIPS auction",
    date: "2026-08-20",
    status: "confirmed",
    source:
      "TSY: treasurydirect.gov auction schedule — 1:00pm ET, announced 08-13, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Long-end real-yield supply the day after the 20Y — the second leg of this week's duration test.",
  },
  {
    id: "opex-2026-08-21",
    kind: "opex",
    title: "Monthly options expiration (August)",
    date: "2026-08-21",
    status: "confirmed",
    source: "OCC: theocc.com expiration calendar — 3rd-Friday standard, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes:
      "Standard monthly expiration. Pin/gamma effects into the close; single-name weeklies settle too.",
  },
  {
    id: "consumer-confidence-2026-08-25",
    kind: "macro-print",
    title: "Conference Board Consumer Confidence (Aug 2026)",
    date: "2026-08-25",
    status: "confirmed",
    source: "CB: conference-board.org — 10:00 ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes:
      "The expectations + inflation-expectations subcomponents are the parts rate desks react to.",
  },
  {
    id: "gdp-q2-2026-second-2026-08-26",
    kind: "macro-print",
    title: "GDP — 2nd estimate, Q2 2026 (+ corporate profits)",
    date: "2026-08-26",
    status: "confirmed",
    source: "BEA: bea.gov/news/schedule — 08:30 ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes:
      "Stacks onto the NVDA print + PCE + 5Y auction — Aug 26 is the week's compound-risk day.",
  },
  {
    id: "pce-2026-08-26",
    kind: "macro-print",
    title: "PCE / Personal Income & Outlays (Jul 2026 data)",
    date: "2026-08-26",
    status: "confirmed",
    source: "BEA: bea.gov/news/schedule — 08:30 ET, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes: "The Fed's own inflation gauge — and it lands ON the NVDA print day. Compound-risk.",
  },
  {
    id: "treasury-5y-note-2026-08-26",
    kind: "rates",
    title: "5-Year Treasury Note auction",
    date: "2026-08-26",
    status: "confirmed",
    source: "TSY: treasurydirect.gov upcoming auctions — announced, 1:00pm ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Belly supply; lands the same day as the NVDA print + PCE — a stacked-risk session.",
  },
  {
    id: "treasury-7y-note-2026-08-27",
    kind: "rates",
    title: "7-Year Treasury Note auction",
    date: "2026-08-27",
    status: "confirmed",
    source: "TSY: treasurydirect.gov upcoming auctions — announced, 1:00pm ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "End-of-August belly supply; the 7Y is the historically wobbliest of the coupon block.",
  },
  {
    id: "jackson-hole-2026-08-28",
    kind: "macro-print",
    title: "Jackson Hole — Fed chair Warsh's first keynote (symposium Aug 27–29)",
    date: "2026-08-28",
    status: "confirmed",
    source:
      'FED: federalreserve.gov/newsevents/speech/warsh20260828a.htm — "In Our Time", Jackson Hole, 2026-08-28, checked 2026-08-29',
    impact: "high",
    symbols: [],
    notes:
      "First extended policy framing from the new chair; lands D+1 of MRVL's print, D+2 of NVDA's.",
  },
  {
    id: "vmware-explore-2026-08-31",
    kind: "product-launch",
    title: "VMware Explore 2026 (Las Vegas) — Aug 31–Sep 3",
    date: "2026-08-31",
    status: "estimate",
    source:
      "EST: investors.broadcom.com news release + vmware.com/explore/us both state Aug 31–Sep 3 2026 at the Venetian, with Ram Velaga (president, Infrastructure Software Group) opening the Monday plenary — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-09-01",
    impact: "medium",
    symbols: ["AVGO"],
    notes:
      "Broadcom's own infrastructure-software conference, and it straddles the 2026-09-02 AVGO print — day 1 (2026-08-31) carried the announcement wave (VMware AI Factory, VMware Private AI Cloud, AgentMinder/vDefend/Avi for agentic AI, VCF-validated third-party models), day 4 lands D+1. That matters because infrastructure software is one of the four numbers the avgo-2026-09-02-print ledger watches: the segment missed in June ($7.18B vs StreetAccount $7.32B) and is where the actively-exploited vCenter CVE-2026-59310 sits. Product announcements cannot change a Q3 that already closed — they bear on the forward software narrative only, and AVGO closed +0.42% on the announcement day. Date is day 1 of the window per house convention (same as crwv-fully-connected-2026-09-29). Discovered during the avgo-2026-09-02-print pulse-check adjacency sweep (2026-09-01).",
  },
  {
    id: "ism-manufacturing-2026-09-01",
    kind: "macro-print",
    title: "ISM Manufacturing PMI (Aug 2026)",
    date: "2026-09-01",
    status: "confirmed",
    source: "ISM: ismworld.org ROB calendar — 10:00 ET (1st business day), checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Prices-paid + new-orders reprice the Fed-cut path and 10Y real yields — the discount rate on long-duration tech.",
  },
  {
    id: "jolts-2026-09-01",
    kind: "macro-print",
    title: "JOLTS Job Openings (Jul 2026)",
    date: "2026-09-01",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/2026/09_sched_list.htm — 10:00 ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Labor-market slack read the Fed weights for the cut trajectory.",
  },
  {
    id: "adp-employment-2026-09-02",
    kind: "macro-print",
    title: "ADP National Employment Report (Aug 2026 data)",
    date: "2026-09-02",
    status: "confirmed",
    source:
      "IR: mediacenter.adp.com published 'ADP National Employment Report: Private-Sector Employment Increased by 38,000 Jobs in August' with a 2026-09-02 dateline at 08:15 ET (PRNewswire 302867661) — ADP does not pre-announce, so the release itself is the primary confirmation; flipped from estimate at close-out, fetched 2026-09-03",
    impact: "medium",
    symbols: [],
    notes:
      "Two sessions ahead of BLS payrolls (9/4); private-sector proxy the market leans on pre-NFP, though the ADP-to-NFP correlation runs loose (July ADP printed +44k vs BLS's -23k the same cycle). PASSED and scored: +38,000 vs a 47-48k consensus, the slowest since January, with education/health (+45k) alone exceeding the whole print and large employers supplying +34k of it. The tape traded the soft read DOVISHLY -- Sep-16 hike odds 68.2% to 60.2-64.2%, a 20-month-high 10y round-tripped to unchanged, small caps led -- which refuted the beat-side asymmetry the ledger had installed after Jackson Hole. Close-out: docs/research/events/adp-employment-2026-09-02.md.",
  },
  {
    id: "beige-book-2026-09-02",
    kind: "macro-print",
    title: "Fed Beige Book (pre-FOMC edition)",
    date: "2026-09-02",
    status: "estimate",
    source:
      "EST: federalreserve.gov Beige Book schedule lists 2026-09-02 (14:00 ET) as the next of the eight 2026 editions — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-08-30",
    impact: "medium",
    symbols: [],
    notes:
      "The last qualitative labor/inflation read the FOMC publishes before the Sep-16 decision, landing two days ahead of BLS payrolls (9/4). Matters more than usual this cycle: Warsh's 2026-08-28 keynote characterised labor as 'quite stable' at full employment with the last payroll print at −23k, so district-level hiring anecdotes are one of the few things that can corroborate or contradict that framing before the blackout. Discovered during the jobs-2026-09-04 pulse-check adjacency sweep, independently rediscovered during the ism-services-2026-09-03 sweep (2026-08-30) — same event, one entry.",
  },
  {
    id: "challenger-job-cuts-2026-09-03",
    kind: "macro-print",
    title: "Challenger Job-Cut Report (Aug 2026)",
    date: "2026-09-03",
    status: "confirmed",
    source:
      "IR: the publisher's own August 2026 Job Cut Announcement Report (challengergray.com PDF) carries the header 'FOR RELEASE AT 5:30 A.M. ET, THURSDAY, SEPTEMBER 3, 2026' and a 'CHICAGO, September 3, 2026' dateline — the release itself is the primary confirmation, promoted from the prior EST: calendar reading at close-out 2026-09-04 on a passed event (an audit-trail correction; it licenses nothing)",
    impact: "low",
    symbols: [],
    notes:
      "Announced-layoffs proxy, the session before BLS payrolls (9/4) and a sibling of the tracked ADP print (9/2) — it supplies the industry and geographic layoff detail weekly claims do not. Filed `low`, not `medium` like ADP, to respect this file's standing note that second-order labor surveys are noisier than the prints tracked here; weekly jobless claims stay deliberately omitted. Matters this cycle only because Warsh's 2026-08-28 keynote characterised the labor market as stable at full employment and pinned the hawkish case on inflation — announced job cuts are one of the few reads that can contradict the low-firing half of that framing before the 9/5 blackout. (The quoted 'low fire, low hire' phrasing this note previously carried is Powell-era 2025 language, not in the 8/28 remarks; corrected 2026-08-31 during this event's initial research.) Discovered during the jobs-2026-09-04 pulse-check adjacency sweep. SCORED 2026-09-04: printed 52,881 (−38% y/y, lowest August since 2022) and drew no attributable market reaction on a +1.2% session that every wrap credited to Waller and ISM Services — the `low` tier is now verified on the tape, not just argued. The September edition is deliberately NOT seeded; see the ledger's close-out for the condition (an official-data vacuum) that would reverse that.",
  },
  {
    id: "fed-waller-outlook-2026-09-03",
    kind: "macro-print",
    title: "Fed Governor Waller — Economic Outlook (Reuters NEXT newsmaker interview)",
    date: "2026-09-03",
    status: "estimate",
    source:
      "EST: federalreserve.gov/newsevents/2026-september.htm lists 'Governor Christopher J. Waller presents on the Economic Outlook at the Reuters NEXT Newsmaker Interview (virtual), 8:30 a.m.' (fetched direct 2026-09-01) — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-09-01",
    impact: "medium",
    symbols: [],
    notes:
      "DUPLICATE, CLOSED OUT 2026-09-04: this entry and `waller-economic-outlook-2026-09-03` are the SAME event — same speaker, same 2026-09-03 08:30 ET slot, same Reuters NEXT venue, same federalreserve.gov page, same 2026-09-01 fetch date, and the Board archive carries exactly one Waller speech that day (federalreserve.gov/newsevents/speech/waller20260903a.htm, re-fetched 2026-09-04). Two sibling pulse sessions found the slot seven minutes apart on 2026-09-01 and each coined its own slug; the canonical one merged that night (#1065) and was researched (#1083) and closed out 2026-09-03, while this one merged 2026-09-04 16:03 UTC (#1068) — injecting an already-past, already-scored event into the calendar as brand new. ALL SCORING LIVES AT docs/research/events/waller-economic-outlook-2026-09-03.md and is deliberately not duplicated; docs/research/events/fed-waller-outlook-2026-09-03.md carries the identity proof, the git timeline, and the one thing the canonical close-out could not see (the 9/4 payroll print scoring Waller's own dated reaction function). Treat the two ids as ONE event in any future adjacency sweep. Kept rather than deleted so the collision stays on the record; both are past, so a duplicate costs nothing forward. PROCESS DEFECT worth a guard: `event-scan.mjs --validate` enforces unique ids and nothing enforces unique events, and this lane's `research/<event-id>` dedupe key is derived from the id, so it inherits the blind spot — same class as the FT-25 collision (docs/LESSONS.md, 2026-09-04). Original note, kept verbatim: 'Not a print — the last scheduled Board-level Fed appearance before the 09-05 communications blackout, landing 08:30 ET the session before BLS payrolls (9/4). The calendar tracks the blackout gate (`fomc-blackout-start-2026-09-05`) but tracked no speech inside the window it closes, which is the gap this fills: on 2026-08-28 a single Fed speech (Warsh at Jackson Hole) moved September hike odds ~35% -> ~57% in one session, so a governor framing the labour market 24 hours ahead of the payroll print is a live input, not diary furniture. Governor Barr also speaks 9/1 09:05 ET (Economic Outlook and Financial Inclusion), a narrower financial-inclusion venue and not tracked separately. Discovered during the jobs-2026-09-04 pulse-check adjacency sweep.'",
  },
  {
    id: "hammack-remarks-2026-09-03",
    kind: "macro-print",
    title: "Cleveland Fed's Hammack — remarks (July hike dissenter)",
    date: "2026-09-03",
    status: "confirmed",
    source:
      "FED: clevelandfed.org/president-and-ceo -> 'Speaking engagements' -> 2026 lists 'President Beth Hammack Gives Opening Remarks at the Connecting Communities Webinar, \"When Every Dollar Counts: Worker Perspectives on the Economy\"' — September 3, 2026, 3:00 pm EDT — linking the fedcommunities.org registration page, which now reads 'This event has passed' (virtual, 3:00-4:00 pm EDT, hosted by the Atlanta/Chicago/Cleveland Feds, special remarks by Goolsbee and Hammack). Fetched direct with a browser User-Agent, HTTP 200, 2026-09-03. CONFIRMED AT CLOSE-OUT, CORRECTING THIS ENTRY'S PRIOR CLAIM that the date was 'unconfirmable at the primary': the Cleveland Fed DOES publish a forward speaking calendar. It lives on /president-and-ceo inside a collapsed accordion (expandedByDefault false) — NOT on /collections/speeches or /news-and-events, where the 'President's upcoming events' box really is only a subscribe promo. METHOD FOR FUTURE RESERVE BANK SPEAKER DATES: check /president-and-ceo and expand 'Speaking engagements'; the speeches collection is a post-hoc archive and will never carry a forward date. Originally filed NEWS: zerohedge.com 'Key Events This Week' (2026-08-29), whose day AND 3:00 PM time both proved exactly right (FT-46, PASS).",
    impact: "low",
    symbols: [],
    notes:
      "CLOSED OUT 2026-09-03: the `low` tier was right and the event passed inert — no wire reported a word she said, and the day's ~13pp of September-hike repricing (~67% -> 54.6% 'in minutes' -> ~50.3-50.4%) belongs entirely to Waller at 08:30, ~6.5 hours before her slot. The venue, unknown when this was filed, turned out to be a Federal Reserve community-development webinar (Connecting Communities), which is the format argument below confirmed on substance — though 'pre-recorded' itself stayed single-source and was never corroborated. Full scoring: docs/research/events/hammack-remarks-2026-09-03.md. Filed `low` deliberately, and not because a voting regional president who dissented for a hike is unimportant. Two independent reasons, the first mechanical: the remarks are reported PRE-RECORDED and slotted 15:00 ET, so they cannot react to Challenger (07:30), Waller (08:30), ISM Services (10:00) that morning or payrolls on 9/4 — information content is bounded near zero by FORMAT, not by a judgement about her views. Second, her position is on the record twice over: she dissented +25bp at the 7/29 FOMC alongside Kashkari and Logan, and said live on CNBC from Jackson Hole on 2026-08-27 'I believe now is the time to act' (correcting this note's earlier 2026-08-10 attribution, which was not her latest word — fixed 2026-09-01 during this event's initial research). Her marginal information content into a September hike already priced 62–66% (CME FedWatch, 8/31) is near zero — the opposite of the same-day 08:30 Waller slot, whose speaker had been silent 52 days with a published framework the current data leaves undetermined. That contrast is the tiering rule: a speaker's information content is a function of how uncertain their position is and whether the format lets them react, not their seniority. Cross-current worth knowing: her own bank's SoFIE release (2026-08-10) has CEO 12-month CPI expectations at 3.3%, DOWN from 3.7% in Q2 — evidence against the 'inflationary mindset' argument she rests her hawkish case on. Discovered during the waller-economic-outlook-2026-09-03 initial-research adjacency sweep (2026-09-01).",
  },
  {
    id: "ism-services-2026-09-03",
    kind: "macro-print",
    title: "ISM Services PMI (Aug 2026)",
    date: "2026-09-03",
    status: "confirmed",
    source: "ISM: ismworld.org ROB calendar — 10:00 ET (3rd business day), checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Services is ~70% of the economy; its prices component is the single biggest non-CPI rate-path mover in this set.",
  },
  {
    id: "treasury-coupon-announcement-2026-09-03",
    kind: "rates",
    title: "Treasury September coupon-block announcement (3Y / 10Y / 30Y sizes)",
    date: "2026-09-03",
    status: "estimate",
    source:
      "EST: api.fiscaldata.treasury.gov upcoming_auctions, fetched direct 2026-09-02, carries announcemt_date 2026-09-03 for all three September coupons — 3-Year CUSIP 91282CRL7 (auction 09-08), 9-Year 11-Month reopening CUSIP 91282CRF0 (auction 09-09) and 29-Year 11-Month reopening CUSIP 912810UW6 (auction 09-10) — with offering_amt still null on each; the ~11:00 ET slot is Treasury's standing coupon-announcement convention and is NOT separately sourced. Primary-sourced on the date, filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep",
    impact: "medium",
    symbols: [],
    notes:
      "The moment the September coupon block stops being an unknown quantity: this is when the reopening sizes are published, and the treasury-10y-note-2026-09-09 ledger has flagged the missing size in every row since 2026-08-19 without a dated event to attach it to. Load-bearing this cycle because the supply half and the demand half of the auction setup have diverged — the 10Y sits at 4.79% (H.15, 09-01), ~11bp above where the Aug-12 note it reopens actually stopped (4.683%, $42B, bid-to-cover 2.53, indirect 76.73%, primary-verified via fiscaldata auctions_query) — so a size above the $42B run-rate would turn a demand test into a supply test, and a size at or below it removes the supply leg entirely. Lands the morning before payrolls (09-04) and two days before the Fed blackout (09-05). Discovered during the treasury-10y-note-2026-09-09 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "waller-economic-outlook-2026-09-03",
    kind: "macro-print",
    title: "Governor Waller — economic outlook (Reuters NEXT newsmaker interview)",
    date: "2026-09-03",
    status: "estimate",
    source:
      'EST: federalreserve.gov/newsevents/2026-september.htm lists "Speech by Governor Christopher J. Waller — Economic Outlook, Reuters NEXT Newsmaker Interview (Virtual)" at 8:30 a.m. ET on September 3 (fetched direct 2026-09-01) — primary-sourced but filed estimate per the event-research lane\'s no-self-confirm limit, and Board speaking slots are added and pulled on short notice',
    impact: "medium",
    symbols: [],
    notes:
      "The last scheduled Board voice before the 9/5 communications blackout, and the direct falsifier of fomc-blackout-start-2026-09-05's 2026-08-30 reading that Warsh's 8/28 keynote might be the final Board-level Fed-speak of this cycle — that ledger's own 'this week' horizon named a governor speech appearing on the 9/1–9/4 calendar as what would prove it wrong. Load-bearing because it lands the morning before payrolls (9/4) with Sep hike odds at ~66% on CME FedWatch (Forbes, 11:40 ET 2026-08-31) and a fresh oil shock in the inflation channel, so it is the last scheduled chance for official interpretation of an outlook the market has repriced ~30 points in four sessions. Q&A format, not prepared remarks alone, which historically widens the range of what gets said. Discovered during the fomc-blackout-start-2026-09-05 pulse-check adjacency sweep (2026-09-01).",
  },
  {
    id: "jobs-2026-09-04",
    kind: "macro-print",
    title: "Employment Situation (Aug 2026 data)",
    date: "2026-09-04",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/empsit.htm — 08:30 ET, checked 2026-08-17",
    impact: "high",
    symbols: [],
    notes:
      "The July −23k print moved Sep hike odds harder than any 2026 CPI; opens the pre-FOMC corridor.",
  },
  {
    id: "sp-rebalance-proforma-2026-09-04",
    kind: "sector",
    title: "S&P DJI September quarterly rebalance — pro-forma files released",
    date: "2026-09-04",
    status: "estimate",
    source:
      "NEWS: spglobal.com S&P Equity Indices Policies & Practices methodology — float-adjusted pro-forma files release after the close on the first Friday, two weeks before the third-Friday effective date; press summaries put the September 2026 files at 09-04, checked 2026-09-01. Not fetched from a dated S&P DJI announcement page, so it stays estimate",
    impact: "low",
    symbols: [],
    notes:
      "The watch item the opex-2026-09-18 ledger flagged on 2026-08-29 as unsourceable and deliberately did not add; sourced to the S&P DJI methodology on 2026-09-01 and filed as an estimate. This is the ANNOUNCEMENT, not the flow: the share/float rebalance itself is effective at the close of 2026-09-18 — the same closing auction as the triple witching's single-stock options — and this release is when passive managers first see what they must buy and sell there. So it is the earliest dated read on how large that 09-18 market-on-close imbalance will be. Low impact, market-structure only: it changes execution timing on high-open-interest names, never direction, and no house playbook (S1/S2/E1/S3/S4/G1) is opex- or rebalance-keyed.",
  },
  {
    id: "fomc-blackout-start-2026-09-05",
    kind: "macro-print",
    title: "FOMC communications blackout begins (through 2026-09-17)",
    date: "2026-09-05",
    status: "confirmed",
    source:
      "FED: federalreserve.gov '2025-2027 FOMC Trading and External Communications Blackout Calendar' PDF, text layer parsed directly 2026-08-30 — its footnote states the policy verbatim ('begin at 12:00 a.m. Eastern Time the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting', with a worked example for a Tuesday-start/Wednesday-end meeting), which applied to the confirmed Sep 15-16 meeting gives start 2026-09-05, end 2026-09-17",
    impact: "medium",
    symbols: [],
    notes:
      "Not a print — a gate on who may speak. Once it starts, no FOMC participant can move September hike odds, so the 09-10 PPI and 09-11 CPI prints (and the 09-09 10Y / 09-10 30Y auctions) land with no official interpretation behind them; 09-04 jobs day is the LAST legal Fed-speak day, since the gate falls at midnight ET entering Saturday 09-05. Ordinarily a minor technical; load-bearing this cycle because a single Fed speech (Warsh at Jackson Hole, 2026-08-28) moved Sep hike odds ~35% -> ~57% in one session, making 'when does Fed-speak stop' a real input. Discovered during the fomc-2026-09-16 pulse-check adjacency sweep and filed `estimate` because the Fed's own blackout-calendar PDF did not parse on that fetch; promoted to `confirmed` on 2026-08-30 when the initial-research session decompressed that PDF's text layer and read the rule from the primary source.",
  },
  {
    id: "opec-plus-meeting-2026-09-06",
    kind: "geopolitical",
    title: "OPEC+ ministerial meeting (October quotas)",
    date: "2026-09-06",
    status: "estimate",
    source:
      "EST: opec.org press release 2026-08-02 states verbatim 'The next meeting will be held on 6 September 2026' — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "The calendar's first energy-supply entry, and it closes a real gap: three ledgers (cpi-2026-09-11, ism-services-2026-09-03, ism-manufacturing-2026-09-01) name crude as the transmission channel into their inflation subcomponents, yet no dated event on the supply side of that channel was tracked. The 2026-08-02 meeting completed the rollback of ~3.5 mb/d of 2023 voluntary cuts with a final +188 kb/d for September, and the group signalled quotas held steady for the rest of 2026 — so the base case is a non-event and `medium` reflects that, not the consequence if the signal breaks. What makes this instance live: it is the first ministerial since the 2026-08-30 US strike on Larak Island re-escalated the Strait of Hormuz, and it lands inside the Sep 1 -> Sep 16 pre-FOMC corridor, three days after ISM Services and two days after payrolls. Discovered during the ism-services-2026-09-03 pulse-check adjacency sweep (2026-08-31).",
  },
  {
    id: "treasury-3y-note-2026-09-08",
    kind: "rates",
    title: "3-Year Treasury Note auction",
    date: "2026-09-08",
    status: "estimate",
    source:
      "EST: two Treasury primaries agree — treasurydirect.gov TA_WS/securities/upcoming and fiscaldata.treasury.gov upcoming_auctions both list the 3-Year, CUSIP 91282CRL7, announce 2026-09-03, auction 2026-09-08, issue 2026-09-15 (offering amount still null on both); filed estimate per the event-research lane's no-self-confirm limit, re-checked 2026-09-03 at 00:32 ET — i.e. BEFORE that day's ~11:00 ET formal announcement, which is when offering_amt first populates and treasurydirect's `announced` feed still ends at the 08-20 batch. Treasury's 2026-08-05 refunding statement (sb0590) guides to unchanged nominal coupon sizes 'for at least the next several quarters', so $58B is the strong prior. Previously re-checked 2026-09-01 after both endpoints were unreachable/stale on 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "Front-end supply opening the September coupon block (3Y 09-08 → 10Y 09-09 → 30Y 09-10). Newly relevant because Warsh's 2026-08-28 keynote pushed the hawkish repricing almost entirely into the front end (2Y +6-9bp, Sep hike odds ~35%->56-59%) while the long end held — this is the first coupon auction to price that risk. Discovered during the treasury-20y-bond-2026-09-15 pulse-check adjacency sweep.",
  },
  {
    id: "aapl-iphone-18-launch-2026-09-09",
    kind: "product-launch",
    title: "Apple September event — iPhone 18 line",
    date: "2026-09-09",
    status: "confirmed",
    source:
      'IR: apple.com/apple-events/ — "Watch a special Apple Event on 9/9 at 10 a.m. PT"; Apple sent press invitations 2026-08-26, primary fetched 2026-08-30',
    impact: "medium",
    symbols: ["AAPL"],
    notes:
      "Rumored $100–200 price increases + a ~$2,000 foldable; FQ1 guide is the pricing event. Date flipped estimate -> confirmed on Apple's own events page during the aapl-2026-10-29-print pulse of 2026-08-30 — the prior NEWS: source was Gurman-via-MacRumors/9to5Mac/Forbes, which the invitation has now superseded; the product claims above remain rumor and are NOT confirmed by the date flip.",
  },
  {
    id: "eia-steo-2026-09-09",
    kind: "macro-print",
    title: "EIA Short-Term Energy Outlook (September 2026)",
    date: "2026-09-09",
    status: "estimate",
    source:
      "EST: eia.gov/outlooks/steo/ states verbatim 'Next Release Date: September 9, 2026' on the August-2026 STEO landing page, fetched 2026-09-02 — primary-sourced, but this calendar defines no `confirmed` prefix for the EIA (fourth instance of that schema gap, after a state utility commission, a state election authority and a federal court docket), so it stays estimate on prefix grounds, not date doubt",
    impact: "low",
    symbols: [],
    notes:
      "The monthly publication that puts an official number on the variable opec-plus-meeting-2026-09-06's stance now hinges on: not the quota, but how many Gulf barrels are physically stranded behind the Strait of Hormuz. The August-2026 STEO (released 2026-08-11) is the primary behind that ledger's magnitude leg — Hormuz crude+liquids transits averaged 4.9 mb/d in 2Q26 against 21.6 mb/d in 4Q25 pre-conflict, Mideast production shut-ins averaged 5.5 mb/d in July, and it assumed flows 'remain severely constrained through August, with flows slowly increasing in September'. This edition scores that September assumption and republishes the shut-in estimate, which is what makes it worth a calendar slot. Filed `low` deliberately, on the same reasoning as opec-jmmc-68th-2026-10-04: a forecast publication sets no policy and moves no equity tape, and this one lands on a crowded day (Apple's iPhone event, the 10Y auction, the buyback-size increase) that will drown it. Watch the level too: that same STEO forecast Brent averaging $87/b in 2026 and $78/b in 4Q26, and spot was already ~$95 on 2026-09-02 — secondary write-ups quoting a '$96' EIA forecast do not match the primary and were discarded. Discovered during the opec-plus-meeting-2026-09-06 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "treasury-10y-note-2026-09-09",
    kind: "rates",
    title: "10-Year Treasury Note auction (reopening)",
    date: "2026-09-09",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes: "The benchmark. A weak 10Y lifts the whole curve and pressures long-duration tech.",
  },
  {
    id: "treasury-buyback-increase-2026-09-09",
    kind: "rates",
    title: "Treasury long-end buyback size increase takes effect ($4B/op, 10-30Y)",
    date: "2026-09-09",
    status: "confirmed",
    source:
      "TSY: home.treasury.gov/news/press-releases/sb0607 (dated August 19, 2026) states verbatim that the current maximum size of $2 billion per operation 'will be at least $4 billion per operation', for 'the 10-year to 20-year sector and the 20-year to 30-year sector', and that the change 'is effective September 9, 2026 and will be in effect for the remainder of this refunding quarter (through November 4, 2026)' — fetched direct via plain curl (HTTP 200) 2026-09-02. Promoted from estimate on that primary: WebFetch times out on home.treasury.gov but curl returns 200, the same tool artifact already recorded on treasury-borrowing-estimates-2026-11-02, checked 2026-09-02",
    impact: "medium",
    symbols: [],
    notes:
      "Bessent's 2026-08-19 announcement doubles nominal long-end liquidity-support buyback operations (10-20Y and 20-30Y sectors) from a $2B to a $4B/operation minimum, effective this date through the refunding quarter's close (2026-11-04) — a fiscal-liquidity support for long-end demand technicals landing the day before the 30Y reopening (09-10). Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep; not previously a dated calendar entry. Promoted estimate -> confirmed on the directly-fetched primary during this event's own 2026-09-02 pulse check, which is exactly the kill switch its ledger registered ('the treasury.gov primary becoming directly fetchable'). CONFIRMED HERE MEANS THE DATE AND SIZES, NOT AN EFFECT: the release's own next sentence, 'An updated tentative Treasury buyback schedule will be released at a later date', is still unfulfilled 16 days on (re-checked at the primary 2026-09-04: the posted PDF's masthead still reads 'For Publication August 5, 2026' and both long-end rows still cap at $2B), which is why treasury-buyback-10y20y-2026-09-10 (est) still carries the superseded $2B cap. AND THIS DATE IS AN ELIGIBILITY DATE, NOT AN OPERATION: the schedule lists no long-end buyback on 09-09 itself — that day's only operation is a $12.5B cash-management buyback in the 1Mo-2Y sector (announced 09-08) — so the first test of the $4B floor is the 10-20Y operation on 09-10, and the 09-09 operation announcement (preliminary CUSIP list 11:00am ET) is the first place a hard number can appear. The program's only market test to date faded inside a day (10Y -6bp on 08-19, fully round-tripped +5bp by 08-20, and ~4.77% by 09-01 — above where it sat pre-announcement). No house playbook is rates-keyed; this stays context for the Sep 1 -> Sep 16 corridor.",
  },
  {
    id: "ecb-decision-2026-09-10",
    kind: "macro-print",
    title: "ECB Governing Council monetary-policy decision + press conference (Berlin)",
    date: "2026-09-10",
    status: "estimate",
    source:
      "EST: ecb.europa.eu Governing Council monetary-policy meeting calendar (press/calendars/mgcgc), fetched direct 2026-09-05 — the September 2026 entries read verbatim 'Governing Council of the ECB: monetary policy meeting hosted by the Deutsche Bundesbank in Berlin, Germany' on 09-09 (Day 1) and 09-10 (Day 2), the 09-10 row adding 'followed by press conference'. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit and because this calendar carries no confirmed source prefix for a non-Fed central bank, checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "THE FIRST NON-FED CENTRAL BANK THIS CALENDAR TRACKS, and it earns the slot on placement, not on policy: the decision (~08:15 ET) and press conference (~08:45 ET) land roughly four hours before treasury-30y-bond-2026-09-10's 1:00pm ET close, on the same date, so the Bund tape that morning is a live input into the 30Y's when-issued level. Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep (2026-09-05) while checking why that ledger's long-end story kept reading as domestic: the week of 09-04 was a SYNCHRONIZED GLOBAL long-end move, not a US one — 10Y Bund 3.37% (highest since 2011), UK 30Y gilt highest since 1998, 10Y JGB above 3% for the first time since 1996 (Investing.com global macro outlook, week of 2026-09-04), alongside US 10Y ~4.78%. A weekly macro preview dating this decision to '~Sep 7' is refuted by the ECB primary above; 09-07 is a Monday and the Governing Council meets 09-09/09-10. Tiered `medium` deliberately and NO PRICE CHANNEL IS CLAIMED: no house playbook is rates-keyed, no tracked symbol carries euro-rates exposure, and the US 30Y auction's own drivers (fiscal supply, official-sector demand, oil) dominate a Bund spillover — what the entry buys is that a 09-10 long-end move is no longer automatically attributable to the auction. Estimate widens caution only; it licenses no date-keyed action. Two further collisions on 09-10 make attribution that day already hard: ppi-2026-09-10 (08:30 ET) and treasury-buyback-10y20y-2026-09-10 (1:40pm ET).",
  },
  {
    id: "ppi-2026-09-10",
    kind: "macro-print",
    title: "PPI release (Aug 2026 data)",
    date: "2026-09-10",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/ppi.htm — 08:30 ET, checked 2026-08-17",
    impact: "medium",
    symbols: [],
    notes:
      "Morning before CPI in the same pre-FOMC window — the whipsaw setup for CPI positioning.",
  },
  {
    id: "treasury-30y-bond-2026-09-10",
    kind: "rates",
    title: "30-Year Treasury Bond auction (reopening)",
    date: "2026-09-10",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Long-end supply the day after the 10Y and the day before CPI (09-11) — a compound rate week.",
  },
  {
    id: "treasury-buyback-10y20y-2026-09-10",
    kind: "rates",
    title: "Treasury liquidity-support buyback operation (10-20Y nominal, 1:40pm ET)",
    date: "2026-09-10",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (Q3 2026 refunding, published 2026-08-05), PDF text layer read directly 2026-09-03 (plain curl, HTTP 200, 125,547 bytes) — row reads verbatim announce 9/9/2026, operation 9/10/2026 1:40 pm - 2:00 pm, settle 9/11/2026, Liquidity Support, Nominal Coupons 10Y to 20Y, maturity range 09/11/2036 - 09/10/2046, min $0, max $2 billion. Stays estimate on three counts: a tentative schedule is tentative by construction, its $2B cap predates press release sb0607, and the confirming primary is the 09-09 operation announcement rather than this document, checked 2026-09-03",
    impact: "medium",
    symbols: [],
    notes:
      "Lands 40 minutes after the 30Y reopening closes on the SAME day (auction 1:00pm ET, buyback 1:40pm ET) and is the first long-end liquidity-support operation on or after sb0607's 09-09 effective date — so its cap should step from the scheduled $2B to the announced $4B/operation minimum, though Treasury has not yet published the updated schedule. Note the sector is 10-20Y, NOT the 20-30Y bucket the reopened bond sits in; the next 20-30Y operation is treasury-buyback-20y30y-2026-09-24. The schedule's own maturity range for this operation, read off the PDF text layer 2026-09-02, is 09/11/2036 - 09/10/2046, so the bond being auctioned that morning (CUSIP 912810UW6, maturing 2056) is NOT eligible for it — the same-day support is adjacent-sector in the literal sense, not a bid for this CUSIP. UPDATED 2026-09-03 by this event's own pulse check, on a direct fetch of the schedule PDF: sb0607's promised updated buyback schedule is STILL UNPUBLISHED 15 days on — the posted schedule's masthead reads 'For Publication August 5, 2026' and the 09-10 row still says max $2 billion, so the 09-09 operation announcement remains the only path to a hard number. Two scale facts from the same document argue the step-up is normalization, not stimulus: the 1Mo-2Y, 3-5Y, 5-7Y and 7-10Y liquidity operations ALREADY carry $4B caps (only the two long-end buckets sat at $2B), and a $12.5B cash-management buyback runs 09-09, one day prior and ~3x the entire long-end increase. And the $4B is a floor, not a point estimate: Bessent told CNBC on 2026-08-20 that buybacks 'could be more than the 4 billion per issue', conditioned on market conditions. Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep.",
  },
  {
    id: "treasury-coupon-announcement-2026-09-10",
    kind: "rates",
    title: "Treasury coupon announcement (20Y reopening + 10Y TIPS reopening sizes)",
    date: "2026-09-10",
    status: "estimate",
    source:
      "EST: treasurydirect.gov TA_WS/securities/upcoming, fetched direct 2026-09-04 (its own updatedTimestamp reads 2026-09-04), carries announcementDate 2026-09-10 for both remaining September coupons — the 19-Year 11-Month bond reopening, CUSIP 912810UX4 (auction 09-15), and the 9-Year 10-Month TIPS reopening, CUSIP 91282CRE3 (auction 09-17) — with offeringAmount still empty on each. The date is corroborated by treasury.gov's tentative auction schedule, which the treasury-20y-bond-2026-09-15 entry quotes verbatim as 'Announcement Thursday, September 10, 2026'. The ~11:00 ET slot is Treasury's standing coupon-announcement convention and is NOT separately sourced. Primary-sourced on the date, filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep",
    impact: "medium",
    symbols: [],
    notes:
      "The exact sibling of treasury-coupon-announcement-2026-09-03, which the calendar already tracks, for the half of the September block that announcement did not cover. It is when the 20Y reopening size stops being unknown — and treasury-20y-bond-2026-09-15 already names 2026-09-10 in its own notes as the date it is waiting on, with no dated event to attach it to, which is precisely the gap the 09-03 entry was created to close. Load-bearing because 09-10 is already the most crowded session of the corridor (PPI 08:30 · 30Y reopening auction 13:00 · 10-20Y buyback operation 13:40) and the 20Y's concession window is compressed into 09-10/09-11 by CPI landing the next morning; a size above the run-rate would turn the 09-15 sale into a supply test on the session before the FOMC. The 2026-08-05 refunding statement's guidance — nominal coupon and FRN sizes held 'for at least the next several quarters' — is the prior, and the 09-03 announcement honoured it on all three coupons ($58B / $39B / $22B), so a change here would be the second chance to break month-old published guidance in a week. Note TIPS sizes are NOT covered by that nominal-coupon guidance and are set separately. Discovered during the treasury-3y-note-2026-09-08 pulse-check adjacency sweep (2026-09-05).",
  },
  {
    id: "cpi-2026-09-11",
    kind: "macro-print",
    title: "CPI release (Aug 2026 data)",
    date: "2026-09-11",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
    notes: "Rate-path input; AI-infra names trade as long-duration assets on it.",
  },
  {
    id: "mts-august-2026-09-11",
    kind: "macro-print",
    title: "Monthly Treasury Statement (Aug 2026 data) — the monthly deficit print",
    date: "2026-09-11",
    status: "confirmed",
    source:
      "TSY: two independent Treasury primaries, both PDFs downloaded from fiscaldata.treasury.gov/static-data/published-reports/mts/ and text-extracted 2026-09-03. The July 2026 edition (MonthlyTreasuryStatement_202607.pdf, p.39) reads verbatim 'The release date for the August 2026 Statement will be 2:00 p.m. EST September 11, 2026' ('EST' is Treasury's own typo; September is EDT). The November 2025 edition carries the full annual table — 'Listed below are the scheduled release dates for the Monthly Treasury Statement. The Statement is released at 2:00 p.m.' — with 'August 2026 / September 11, 2026'. Promoted from estimate by this event's own initial-research session on those primaries. Two corrections to the estimate as originally filed: the July edition was scheduled for August 12, not August 13 (both PDFs agree), and August 13 is the 9th August workday, not the 8th — the arithmetic was wrong although the derived answer was not. The 8th-workday rule itself is exact: computed against the published 2024 and 2026 calendars it reproduces 20 of 20 release dates with zero mismatches. Checked 2026-09-03",
    impact: "medium",
    symbols: [],
    notes:
      "The primary monthly measurement of the one variable this calendar's long-end ledgers keep naming as the driver and never dating. treasury-30y-bond-2026-09-10's initial research attributes the Aug-13 predecessor auction's 25-year-high clearing yield to fiscal supply, citing a $432B July deficit; CRFB's framing of that auction is investors 'demand[ing] higher compensation to finance our growing national debt'. That number has a release date and this calendar did not carry it. Placement is why it earns a slot rather than a footnote: it lands the day AFTER the 30-year reopening and ON cpi-2026-09-11, so the term-premium story's fiscal leg and its inflation leg print into the same session, one day after the auction that prices both — and inside the fomc-blackout-start-2026-09-05 window, so no Fed participant can respond to either. Tiered `medium`, not `high`, deliberately: the MTS is a backward-looking accounting statement with a well-telegraphed CBO Monthly Budget Review preview usually out days earlier, so it rarely moves the tape by itself; what it does is confirm or break the deficit trajectory the long end is pricing. Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep (2026-09-03). The 'rarely moves the tape' claim was UNMEASURED when written and is now measured (initial research, 2026-09-03): 56 releases 2022-2026 give TLT p=0.249, SPY p=0.689, ^TNX p=0.839 on the day, and the 35 releases with intraday bars give a 1:30pm-to-close window of TLT -0.038% p=0.413 and SPY +0.004% p=0.946, with SPY's release-window dispersion BELOW its all-day base. The medium tier survives on the second half of the sentence, not the first.",
  },
  {
    id: "sp-rebalance-proforma-capped-2026-09-11",
    kind: "sector",
    title:
      "S&P DJI September quarterly rebalance — capped / alternatively weighted pro-forma files released",
    date: "2026-09-11",
    status: "estimate",
    source:
      "NEWS: spglobal.com S&P Equity Indices Policies & Practices (March 2026 version) — pro-forma files for capped and alternatively weighted indices release after the close on the second Friday, one week before the third-Friday effective date, putting the September 2026 files at 09-11; the direct PDF fetch returned HTTP 403 on 2026-09-04 and again on 2026-09-04's initial research, so the rule was read from search-indexed text of that document rather than the document itself, and this stays estimate. CORROBORATED PRIMARY, but for the reference close rather than the file release: SEC EDGAR, Select Sector SPDR Trust Form 497 filed 2026-01-31 (fetched direct 2026-09-04), states the Select Sector Indices rebalance 'at the closing prices of the second Friday of March, June, September and December' with changes effective after the market close on the third Friday — which dates the 2026-09-11 close as the reference-price date and the 2026-09-18 close as effective. That is an SEC:-grade primary for the MECHANISM date; the entry as TITLED dates the pro-forma file release, which no primary confirms, so status stays estimate rather than being promoted on an adjacent fact",
    impact: "low",
    symbols: [],
    notes:
      "Its own initial research (2026-09-04) sharpened what this date IS: not merely a file drop but the REFERENCE CLOSE that sizes the capped trade, SEC-filed (see source) — and it falls on CPI day, so a large 09-11 surprise mechanically resizes the 09-18 market-on-close rather than only moving the tape. Cap headroom computed that day from vendor ETF holdings says the capped half is small this quarter: XLK's over-4.8% cohort ~42.0% against a 50% trigger (no cap binds), XLC's ~55.2% (binds, trim ~0.72pp ~ $161M) — versus the June 2024 XLK rebalance that forced ~$11B of AAPL selling when the same rule bound. Proposed by the sp-rebalance-proforma-2026-09-04 initial research (2026-09-04) as the completing half of the September pro-forma pair, NOT a standalone trade date. The full sequence: float-adjusted (FMC) files after the close 09-04, the share/IWF freeze period beginning after the close on Tue 09-08, capped/alternatively-weighted files after the close 09-11, and the whole rebalance effective at the 09-18 close (prior to the 09-21 open) in the same closing auction as the triple witching. So this is the FINAL dated read on the size of that market-on-close imbalance before it prints. Deliberately tiered BELOW its 09-04 sibling: capped and alternatively weighted indices carry a fraction of the tracking assets, and the day is dominated by CPI 09-11 and UMich prelim 09-11 either way. Estimate status and low impact: it widens caution about the 09-18 close and licenses nothing — market structure only, never direction, and no house playbook is rebalance-keyed. The 09-08 freeze is dated too but deliberately NOT filed: it is a data cut-off with no observable publication.",
  },
  {
    id: "umich-sentiment-prelim-2026-09-11",
    kind: "macro-print",
    title: "University of Michigan consumer sentiment — preliminary (Sep 2026)",
    date: "2026-09-11",
    status: "confirmed",
    source:
      'UMICH: sca.isr.umich.edu states verbatim "Next data release: Friday, September 11, 2026 for Preliminary September data at 10am ET" (fetched direct 2026-09-04, read back verbatim-only on a second pass); corroborated by the Surveys of Consumers\' own 2026 release-dates document (data.sca.isr.umich.edu/fetchdoc.php?docid=79628), whose PDF text layer lists "September 11 September Prelim" and "September 25 September Final"',
    impact: "medium",
    symbols: [],
    notes:
      "The leading consumer read this calendar quotes most often and had no entry for: retail-sales-2026-09-16 has cited UMich at every pulse since D-18 (51 in early August, from 55.2, vs a 54.5 expectation) as the sentiment half of its dollars-up/units-flat read, and the prelim lands five days ahead of that print inside the same corridor. Discovered during the retail-sales-2026-09-16 pulse-check adjacency sweep; promoted to confirmed by its own initial research, which fetched the publisher's next-release line (with a time) direct. Retiered low → medium (docs/research/events/treasury-20y-bond-2026-09-15.md, same-day discovery): the year-ahead INFLATION-EXPECTATIONS subcomponent, not the headline, is the live question this session — Waller's 2026-09-03 speech made his September hold explicitly conditional ('if inflation comes in hot, I would consider a rate hike') the same week Brent touched $99.38 intraday and ISM Services Prices printed 72.6 (highest since August 2022, respondents naming Iran and fuel); this survey is the cleanest same-day read on whether that shock is de-anchoring households. It also lands ON cpi-2026-09-11 and mts-august-2026-09-11, two sessions before treasury-20y-bond-2026-09-15 and three before fomc-2026-09-16, inside the 2026-09-05 blackout — so the expectations read, CPI and the deficit print all hit one session no Fed participant may respond to. That expectations-component claim is UNMEASURED here — a close-out or a future initial research should measure it rather than inherit it.",
  },
  {
    id: "buyback-blackout-start-2026-09-12",
    kind: "sector",
    title: "Corporate buyback blackout window begins closing (pre-Q3-earnings)",
    date: "2026-09-12",
    status: "estimate",
    source:
      'NEWS: Citadel Securities Global Market Intelligence note by Scott Rubner, published 2026-08-31, states that more than $1.1 trillion of announced buyback authorizations entered an open window in August and that the window "begins closing around September 12" as companies enter pre-earnings blackout periods. Read via advisoranalyst.com 2026-09-04 — citadelsecurities.com returns HTTP 403 (Cloudflare interstitial) to both WebFetch and a browser-UA curl, so the desk primary was not directly fetchable; corroborated across two independent search paths. Filed estimate on two counts beyond the fetch: the source itself says "around", and issuer blackouts are per-company policy rather than a market-wide dated rule',
    impact: "low",
    symbols: [],
    notes:
      "Not a print — a gate on a FLOW, and the corporate sibling of fomc-blackout-start-2026-09-05's gate on speech. It matters only because of what it sits in front of: the opex-2026-09-18 ledger's corridor previously ran 09-16 (FOMC + VIX settlement) → 09-18 (the witching), and this entry opens it four sessions earlier, because the buyback bid is the FIRST of two mechanical stabilizers to fade. The second is dealer long gamma, and the same note is the source for its size — $6.2T of notional expiring 09-18 alone, ~23% of total US options exposure, ~$9.6T rolling off into it, September on pace to surpass June's record $7.7T triple-witching. Two bids fading into one window is a different configuration from one, which is the whole reason this gets a slot. THE DATE IS SOFT AND SHOULD STAY SOFT: there is no market-wide buyback-blackout date to confirm against — SEC Rule 10b-18 is a safe harbour, not a calendar — so no primary source can ever promote this to `confirmed` as written; a future pulse should either re-derive it from the tracked names' own reported blackout policies or retire the entry rather than pretend precision. `low` is deliberate: a fading bid changes the tape's shock absorption, not its direction, and no house playbook (S1/S2/E1/S3/S4/G1) is opex-, rebalance- or buyback-keyed. Kind `sector` is the closest fit the enum offers for a market-structure flow gate; the imperfect fit is named, not fixed from this lane — the same call apple-eu-dma-terms-2026-10-01 made. Discovered during the opex-2026-09-18 pulse-check adjacency sweep (2026-09-04).",
  },
  {
    id: "g20-energy-abundance-ministerial-houston-2026-09-14",
    kind: "geopolitical",
    title: "G20 Energy Abundance Ministerial — Houston, Texas (US presidency)",
    date: "2026-09-14",
    status: "estimate",
    source:
      'EST: g20.org/events-calendar/ lists "Energy Abundance Ministerial (Houston, Texas) / September 14 – September 16, 2026", and g20.org/location/ independently writes "the perfect location for the G20\'s Energy Abundance Ministerial in September 2026". Both fetched direct 2026-09-04 at HTTP 200 with a full browser header set (a plain fetcher gets 403 from this host). No Department of Energy release naming the dates was located this pass and no time of day is published. Filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep, and because CONFIRMED_PREFIX has no slot for a diplomatic calendar. Day 1 of the three-day window per house convention. Checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS THIS CALENDAR'S ONLY OBSERVABLE LEADING INDICATOR ON A LIVE QUESTION, not for a price channel — there is none, and low is affirmed. The question is whether a US-hosted G20 sectoral ministerial reaches consensus or splits, because the host year has now produced both in a single week: the Innovation Ministerial (Chapel Hill, 09-01/02) concluded with a CONSENSUS statement across 20 nations and the African Union with no dissent recorded (whitehouse.gov, 2026-09-02 — the Carolina Principles for Emerging Technologies, AI Prosperity Objectives, AI Prosperity Compact), while the FMCBG (Asheville, 08-31/09-01) produced NO communique and a public China dissent from paragraphs 4, 10, 11 and 13 of the US chair's statement. Houston is the last such ministerial before g20-trade-ministerial-milwaukee-2026-09-30, whose own stance turns on which of those two Milwaukee resembles; without a calendar row the tell goes unobserved before that event's next pulse on 2026-10-04. Secondary reason it is the one worth filing over Sherpa III (DC, 10-01/02) and the Foreign Ministers' Meeting (Atlanta, 10-30/31), both deliberately left un-proposed: its subject is the only remaining ministerial theme this calendar already tracks elsewhere (eia-steo-2026-09-09, opec-jmmc-68th-2026-10-04, opec-plus-meeting-2026-09-06, and the ERCOT/PJM data-center entries). The chair's own Trade-and-Energy framing is on g20.org/working-groups/: the Energy Abundance Working Group invites members to commit to \"energy security, abundance, addition, and affordability\", each nation choosing its own energy mix. ATTRIBUTION IS ALREADY IMPOSSIBLE: day 3 (09-16) is the FOMC decision, and the window also carries opex 09-18. Discovered during the g20-trade-ministerial-milwaukee-2026-09-30 initial research (2026-09-04); recorded but not proposed by the g20-fmcbg-bangkok-2026-10-15 research the same day. UPDATED 2026-09-04 by this event's own initial research, which ANSWERED the consensus-vs-split question this row was filed to observe, without waiting for the meeting. Per the G20 Research Group's energy-ministerial document index, the energy track produced a document titled Communique in 2015, 2016, 2018, 2019, 2020 and 2021 (Naples) and NOT ONCE SINCE: Bali 2022 chair's summary, Goa 2023 'Outcome Document and Chair's Summary' (paragraphs 1-20 and 28-29 plus the hydrogen annex agreed by all, paragraphs 21-27 issued under the chair's responsibility alone), Foz do Iguacu 2024 outcome document plus chair's statement, Umhlanga 2025 chair's summary. Base case for Houston is therefore Asheville-shaped, not Chapel Hill-shaped. What is genuinely new is the POLARITY: for four years the holdouts were producers resisting phase-down language, whereas in 2026 the HOST holds that position (DOE's own standing category label is 'Advancing Energy Addition, Not Subtraction'), so a dissent would likely come from European members rather than China — a different read for g20-miami-2026-12-14's fracture leg than Asheville's 19-vs-1. TWO FINDINGS THAT AFFIRM LOW RATHER THAN SOFTEN IT. (1) At D-10 no lead agency has publicly claimed the meeting: energy.gov/newsroom contains ZERO occurrences of 'G20' through its 2026-09-03 releases, and g20.org/media/ contains ZERO occurrences of the word 'energy' while listing Commerce's Innovation press-registration advisory (2026-08-14, D-18), Treasury's Asheville credentialing (2026-08-05, D-26) and State's Atlanta media logistics (2026-07-21, D-101). That is evidence of non-publication, not of non-planning; D-3 (2026-09-11) is the checkable downgrade threshold. (2) The only US energy instrument actually in motion is DOE's own and it needs no ministerial — the 2026-09-02 fact sheet on Venezuela claims 65bn bbl of proven reserves under US-majority control, $7bn of Chevron investment over five years, 600,000 b/d, Junin 5, more than 1 mb/d by 2031 and 1 GW of GE Vernova capacity within 24 months, built on the licence campaign Secretary Wright announced at Miraflores on 2026-02-11. Same structure the Milwaukee ledger found on trade: the unilateral agency instrument precedes and outranks the multilateral text. symbols: [] is correct and impact stays low. Researched in docs/research/events/g20-energy-abundance-ministerial-houston-2026-09-14.md.",
  },
  {
    id: "gastech-2026-09-14",
    kind: "sector",
    title: "Gastech 2026 — Exhibition & Conference, BITEC Bangkok (gas / LNG / hydrogen)",
    date: "2026-09-14",
    status: "estimate",
    source:
      'EST: gastechevent.com\'s own event header reads "Exhibition & Conference 14 - 17 September 2026" at "BITEC - BANGKOK, THAILAND", with published hall hours for each of the four days (09:00-18:00 on Sep 14, 09:00-19:00 on Sep 15, 09:00-18:00 on Sep 16, 09:00-14:00 on Sep 17); the conferences page states ~8,000 delegates, 800 speakers and 200 sessions across 15 programmes. Fetched direct 2026-09-04. Filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep, and because CONFIRMED_PREFIX has no slot for a commercial conference organiser (aws-reinvent-2026 carries IR: only because the organiser is a tracked issuer). Day 1 of the four-day window per house convention. Checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS A NAMED ATTRIBUTION CONFOUND, NOT A CHANNEL — no price channel is claimed and low is affirmed. Gastech is the sector's largest annual gas/LNG/hydrogen gathering and it runs on EXACTLY the same three days as g20-energy-abundance-ministerial-houston-2026-09-14 (09-14/16), twelve time zones away, which means any gas or LNG headline in that window has a second and larger origin and must be sourced before it is attributed to Houston. The Bangkok business day (09:00-18:00 ICT, UTC+7) maps to roughly 22:00 ET the prior evening through 07:00 ET, so its news breaks before the US cash open — the same timing discount the g20-fmcbg-bangkok-2026-10-15 ledger records for that city. WHAT IT IS NOT: evidence that Houston loses its principals. The Strategic Conference's confirmed government speakers are Thailand's prime minister, its finance and energy ministers, the secretaries-general of the International Energy Forum and the Gas Exporting Countries Forum, and the energy ministers of Egypt, Nigeria, Singapore, Oman, Libya, Papua New Guinea, Senegal, Bangladesh, Ghana, Mauritania and Timor-Leste — NONE of which are G20 members. No symbol this calendar tracks carries exposure; the nearest dated energy events with an actual price channel remain opec-plus-meeting-2026-09-06 and eia-steo-2026-09-09. Discovered during the g20-energy-abundance-ministerial-houston-2026-09-14 initial research (2026-09-04).",
  },
  {
    id: "treasury-20y-bond-2026-09-15",
    kind: "rates",
    title: "20-Year Treasury Bond auction (reopening)",
    date: "2026-09-15",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative auction schedule PDF, text layer read directly 2026-09-01 — row reads verbatim '20-Year BOND R / Announcement Thursday, September 10, 2026 / Auction Tuesday, September 15, 2026 / Settlement Friday, September 18, 2026', 1:00pm ET",
    impact: "high",
    symbols: [],
    notes:
      "Long-end supply the day before the Sep-16 FOMC — the auction that drew today's concession, reopened. Formal size/when-issued announcement is 2026-09-10, the same day as the 30Y reopening auction and the 10-20Y buyback operation and one day before CPI, which compresses the concession window into 09-10/09-11. Settles 09-18, quarterly OpEx day. An aggregator dating this sale to 09-17 was logged unresolved on 2026-08-29 and is refuted by the primary schedule above: 09-17 is the 10Y TIPS auction date.",
  },
  {
    id: "fomc-2026-09-16",
    kind: "macro-print",
    title: "FOMC decision (meeting Sep 15–16, SEP + dot plot)",
    date: "2026-09-16",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "import-export-prices-2026-09-16",
    kind: "macro-print",
    title: "U.S. Import and Export Price Indexes (Aug 2026 data)",
    date: "2026-09-16",
    status: "confirmed",
    source:
      'BLS: bls.gov/schedule/news_release/ximpim.htm ("August 2026 | Sep. 16, 2026 | 08:30 AM") + bls.gov/schedule/2026/09_sched.htm ("U.S. Import and Export Price Indexes / August 2026 / 08:30 AM", Wednesday the 16th), both fetched direct 2026-08-31',
    impact: "low",
    symbols: [],
    notes:
      "The print the 10-16 sibling nominated as the likely 'highest since 2022' import-inflation headline — downgraded by this event's own research to a COIN FLIP on a single index tick. Crossing 5.0% nonfuel y/y needs level 136.29 (+0.361% m/m) against a trailing three-month pace of +0.371%; published 136.3 prints 5.01% and 136.2 prints 4.93%, and the m/m path is decelerating inside that average. Central read +4.9% to +5.2%. Two other reasons to read it: the June–July fuel drag is modelled to end here (fuel m/m ~ +1.0% from a -0.1% prior-month Brent average, R^2 0.71), so all-imports y/y likely re-accelerates to ~6.2-6.6% rather than converging with nonfuel; and this is the LAST release in the series the FY2027 funding branch cannot touch, publishing two weeks before the 09-30 deadline. Lands 08:30 ET on FOMC decision morning (fomc-2026-09-16) alongside retail-sales-2026-09-16, so any move is unattributable — which is why the tier test defers to 10-16. Low tier: these indexes deflate GDP net trade, not PCE. Discovered during the import-export-prices-2026-10-16 initial research; date flipped estimate -> confirmed by its own session 2026-08-31.",
  },
  {
    id: "retail-sales-2026-09-16",
    kind: "macro-print",
    title: "Retail Sales — advance monthly (Aug 2026)",
    date: "2026-09-16",
    status: "confirmed",
    source: "CENSUS: census.gov/retail/release_schedule.html — 08:30 ET, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Hot consumer → yields up → duration pressure; soft → supportive. Lands the day of the Sep-16 FOMC.",
  },
  {
    id: "vix-expiration-2026-09-16",
    kind: "opex",
    title: "VIX futures & options September expiration (SOQ settlement)",
    date: "2026-09-16",
    status: "confirmed",
    source:
      "OCC: cboe.com/tradable-products/vix/vix-futures/ market-data table lists contract VX/U6 expiring 09/16/2026, and cboe.com/us/futures/market_statistics/settlement carries that same VX/U6 expiration's daily settlements for 09-02 and 09-03 — both fetched direct 2026-09-04. Deterministic cross-check: Wed 09-16 is exactly 30 days before the 2026-10-16 SPX expiration (October's third Friday), and Cboe's next listing applies the rule unchanged (VX/V6 -> 2026-10-21, 30 days before 2026-11-20). Flipped from NEWS:/estimate (macroption, 2026-09-01) by this event's own initial research, which is the sanctioned place to confirm a date the discovering sweep correctly declined to self-confirm",
    impact: "low",
    symbols: [],
    notes:
      "Proposed by the opex-2026-09-18 pulse (2026-09-01) as a same-corridor microstructure adjacency, NOT a standalone trade date. VIX contracts AM-settle to a Special Opening Quotation (VRO) built from opening-auction trade prices of a SINGLE SPX/SPXW expiration exactly 30 days out — here the 2026-10-16 series — so the volatility complex's own expiration lands on the MORNING of the fomc-2026-09-16 decision day, alongside retail-sales-2026-09-16 and import-export-prices-2026-09-16, and two sessions before the September triple witching. Why it belongs on the calendar at all: it means the week's vol-hedging unwind is staged (VIX 09-16 open, then SPX/index SET at the 09-18 open, then single-stock options + the S&P quarterly rebalance MOC at the 09-18 close), so 'the gamma rolls off Friday' understates how early the cushion starts leaving. Two facts from the 2026-09-04 initial research: the expiring contract stops trading 09:00 ET, ~4.5 hours BEFORE the 14:00 ET decision, so FOMC-day vol exposure cannot live in it; and the corridor is already paid for in the term structure (VX/U6 16.1381 vs VIX cash 14.32 on 09-03). Impact stays LOW even now the date is confirmed: it widens caution about the 09-16→09-18 corridor, supports one execution guard (nothing trades the 09-16 opening auction), and licenses nothing.",
  },
  {
    id: "treasury-10y-tips-2026-09-17",
    kind: "rates",
    title: "10-Year TIPS auction (reopening)",
    date: "2026-09-17",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes:
      "Real-yield supply the day after the FOMC; the breakeven reaction reads inflation expectations.",
  },
  {
    id: "unsc-iran-panel-mandate-vote-2026-09-17",
    kind: "geopolitical",
    title: "UN Security Council vote — renewal of the Iran sanctions panel-of-experts mandate",
    date: "2026-09-17",
    status: "estimate",
    source:
      'NEWS: Reuters, carried by spokesman.com 2026-09-01, reports that France — holding the Security Council presidency for September — has called the vote, with French UN ambassador Jerome Bonnafont quoted verbatim that "the Council will finally have to vote on renewing the mandate of the … panel of experts on Iran"; diplomats cited in the same piece put the vote on September 17, and the article states the panel mandate "is due to expire on Sept. 26". A wire-reported diplomatic date with no primary UN document read this session, so filed estimate/NEWS: rather than confirmed; checked 2026-09-04',
    impact: "medium",
    symbols: [],
    notes:
      "Closes a real gap on the supply side of the channel that is currently setting this calendar's inflation risk. The calendar tracks oil supply (opec-plus-meeting-2026-09-06, opec-jmmc-68th-2026-10-04, eia-steo-2026-09-09, gastech-2026-09-14) but carries no entry on the Iran-sanctions track, even though the Strait of Hormuz conflict is what took Brent from ~$87 on 2026-08-26 to $99.38 intraday on 2026-09-03 after Iran struck Jordan, Bahrain and Kuwait in retaliation for US strikes. THE BASE CASE IS PROCEDURAL and `medium` reflects that, not the consequence if the signal breaks — the same framing the OPEC+ entry uses. What would make it break: a veto fight or a lapsed mandate becomes a dated escalation marker in a channel with no other dated markers, and it lands the day AFTER the Sep-16 FOMC and the day the communications blackout lifts, so any market effect reaches a tape with no policy interpretation available. NOTE THE TWO DIFFERENT DATES: 09-17 is the reported vote, 09-26 is the mandate's own expiry — a vote that slips still leaves a hard deadline inside the same month, and the expiry falls during the UN General Assembly leaders' week. Discovered during the jobs-2026-09-04 pulse-check adjacency sweep (2026-09-04), whose ledger records the energy escalation that motivated the search. A later pulse should read the UN Security Council programme of work for September 2026 direct and promote or correct the 09-17 date on that primary. AMENDED 2026-09-04 by this event's own initial research (docs/research/events/unsc-iran-panel-mandate-vote-2026-09-17.md); status UNCHANGED at estimate/NEWS:. THE DATE DID NOT UPGRADE and probably cannot: press.un.org's 2026-09-01 French-presidency programme-of-work press conference confirms the ITEM ('renewal of the Panel of Experts established pursuant to resolution 1929 (2010)') but names NO date, un.org's September programme-of-work PDF path 404s, and securitycouncilreport.org serves a Cloudflare JavaScript challenge to this lane on both the monthly-forecast and What's-in-Blue paths. CONFIRMED_PREFIX also has no UN/diplomatic slot — the eleventh ledger to bank that gap. WHAT DID UPGRADE IS THE OTHER DATE: main.un.org/securitycouncil/en/sanctions/1737/panel-of-experts/work-and-mandate, read direct 2026-09-04, states verbatim 'The Panel comprises up to eight experts. Its current mandate ends on 26 September 2026' — so 09-26 is UN-primary and is proposed as its own entry (unsc-iran-panel-mandate-expiry-2026-09-26). THE RESEARCH REFRAMED THE EVENT DOWNWARD ON CONSEQUENCE, NOT ON WATCHABILITY. Mechanism: snapback nullified resolution 2231's sunset clauses in September 2025, so the reactivated measures (1696/1737/1747/1803/1835/1929) have NO expiry — a veto lifts nothing, and the 1737 Committee is a standing subsidiary organ that outlives the Panel either way. A lapse is a loss of eyes, not of teeth. Three primary reads suggest the Panel has not functioned since 2015: the 1737 Committee page says 'The Chair of the Committee has not yet been elected by the Security Council' eleven months after snapback; the Panel's Reports page lists four documents ending at S/2015/401 (2 June 2015); and its mandate requires a final report 'no later than 30 days prior to the termination of its mandate' (due ~2026-08-27, not published as of 2026-09-04). Precedent that prices the outcome: Russia vetoed renewal of the DPRK 1718 Panel on 2024-03-28 (China abstaining), the mandate ended 2024-04-30, the sanctions survived untouched and monitoring migrated outside the UN to the MSMT. NO PRICE CHANNEL, MEASURED RATHER THAN ASSERTED: the far larger snapback of September 2025 coincided with Iran's HIGHEST 2025 export month (~63.8m bbl, ~2.13 mb/d, 87.35% to China), and Brent's trailing-60-session daily absolute move now runs a 2.01% median / 3.89% p75 against a 2y 1.32%/2.45% — the live Hormuz conflict has ~1.5x'd crude's own volatility, so any vote-day signal is smaller than the ambient noise. Meanwhile XLE's trailing-60 distribution (0.88%/1.40%) is indistinguishable from its 2y (0.83%/1.44%), VIX is 14.03 at a three-month low and ITA 225.33 at a three-month low (-9.9%/21d): the Iran premium is entirely in the barrel and none of it is in this calendar's equity book. Impact stays medium and symbols: [] is correct.",
  },
  {
    id: "opex-2026-09-18",
    kind: "opex",
    title: "Quarterly options expiration — triple witching (September)",
    date: "2026-09-18",
    status: "confirmed",
    source: "OCC: theocc.com expiration calendar — quarterly triple-witching, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Index futures + index options + stock options expire together — the year's heaviest-volume, highest-pin sessions.",
  },
  {
    id: "treasury-2y-note-2026-09-22",
    kind: "rates",
    title: "2-Year Treasury Note auction",
    date: "2026-09-22",
    status: "confirmed",
    source:
      "TSY: home.treasury.gov Tentative-Auction-Schedule.pdf lists \"2-Year NOTE / Announcement Thursday, September 17, 2026 / Auction Tuesday, September 22, 2026 / Settlement Wednesday, September 30, 2026\" — 1:00pm ET. Filed estimate on 2026-09-02 by the 5Y sibling's adjacency sweep on the lane's no-self-confirm rule (never on date doubt); upgraded to confirmed 2026-09-02 by this event's own initial-research session, which re-fetched and text-extracted the same primary PDF independently. TSY: is an authorized confirmed prefix above, already carried by every sibling auction on this identical schedule (3Y 9/8, 10Y 9/9, 30Y 9/10, 20Y 9/15, TIPS 9/17, 5Y 9/23, 7Y 9/24), checked 2026-09-02",
    impact: "medium",
    symbols: [],
    notes:
      "Opens the end-of-month 2Y/5Y/7Y block, the day before the 5Y. Shortest and most Fed-path-sensitive coupon tenor — its stop is the first read on post-FOMC front-end demand that the 5Y then inherits.",
  },
  {
    id: "unga-81-general-debate-2026-09-22",
    kind: "geopolitical",
    title: "UN General Assembly 81st session — high-level general debate (leaders' week)",
    date: "2026-09-22",
    status: "estimate",
    source:
      "EST: un.org/en/ga/81/meetings/ states the 81st session's general debate runs 'from 22 September to 26 September, and on 28 September 2026', with dated high-level meetings on 09-23 (right to development; climate action and just transition), 09-24 (sea level rise), 09-25 (pandemic prevention) and 09-28 (Durban Declaration anniversary), fetched direct 2026-09-04. That is a UN primary, but CONFIRMED_PREFIX in scripts/event-scan-validation.mjs carries no UN or diplomatic slot and the event-research lane's no-self-confirm limit applies to an event discovered in-sweep — so filed estimate/EST:, checked 2026-09-04",
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS THE ATTENTION CORRIDOR, NOT A CATALYST — discovered during the unsc-iran-panel-mandate-expiry-2026-09-26 initial research (2026-09-04), which needed the dates to establish that the 09-26 mandate expiry falls on a UN WORKING SATURDAY: a general-debate day with heads of state at UN HQ and US markets closed. Low impact and symbols: [] are the honest filing — leaders' week has no measured reaction function in this calendar and no price channel is claimed. What it IS good for: it dates the window in which Hormuz or Iran diplomacy would surface at principals level, and it explains why headlines in 09-22 to 09-28 reach the tape through gaps rather than through sessions. The measured version of that gap channel is in the expiry ledger: WTI's absolute weekend gap runs a 1.55% median over the last 14 weekends against a 0.53% two-year median (~2.9x), while SPY's 0.32% sits BELOW its own two-year 0.35% — the reopen risk is entirely in crude, none of it in the index. The date is the debate's OPENING; the window runs through 09-28.",
  },
  {
    id: "meta-connect-2026-09-23",
    kind: "product-launch",
    title: "Meta Connect 2026 (Menlo Park + livestream) — Sep 23–24, Zuckerberg keynote day 1",
    date: "2026-09-23",
    status: "confirmed",
    source:
      "IR: meta.com/connect states September 23-24, with the Zuckerberg keynote on the opening day (its wording: join Founder and CEO Mark Zuckerberg as he shares how Meta is building a future for everyone) and a Developer state of the union on day 2 — re-fetched direct 2026-09-04 by this event's own initial research, which is the independent second look the lane's no-self-confirm limit requires; filed estimate off the same primary on 2026-09-01 when the discovering sweep could not also confirm it",
    impact: "medium",
    symbols: ["META"],
    notes:
      "Meta's own developer/product conference, and the ONLY company-controlled news venue between now and the est. 2026-10-28 print — which is the whole reason it is tracked. Zuckerberg teased new smart glasses alongside the date announcement; agenda is VR/wearables/metaverse/AI. Tiered `medium` deliberately: this is a product venue, not a numbers venue — it sets no guidance and touches neither of the two things the 10-28 print will actually be judged on (capex discipline and the ~$10B Q3 legal accrual from the 2026-08-26 state-AG settlement). The date is the first day per house convention; the keynote is day 1, so window measurement centers on 09-23 itself. The keynote is an evening slot (~4pm PT), so it falls AFTER the US close and the tape reaction lands 09-24 — the same day as trump-xi-summit-2026-09-24, treasury-7y-note-2026-09-24, treasury-buyback-20y30y-2026-09-24 and scoos-2026-09-24, so no META move in the window is cleanly attributable to the conference. Discovered during the meta-2026-10-28-print pulse-check adjacency sweep (item 5, event-specific tape). Confirmation is a calendar fact, not an edge: initial research measured seven Connect keynotes (2019-2025) at -0.85% mean excess vs QQQ over D-1 to D+1, win 2/7, 0.85 SE from a 1,928-window base rate — no footprint — and no META playbook survives anyway (S1 refuted, gap-capture killed). See docs/research/events/meta-connect-2026-09-23.md and meta-2026-10-28-print.md.",
  },
  {
    id: "treasury-5y-note-2026-09-23",
    kind: "rates",
    title: "5-Year Treasury Note auction",
    date: "2026-09-23",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "End-of-month belly supply block (with the 2Y/7Y, large in aggregate).",
  },
  {
    id: "scoos-2026-09-24",
    kind: "macro-print",
    title: "Senior Credit Officer Opinion Survey on Dealer Financing Terms (SCOOS)",
    date: "2026-09-24",
    status: "confirmed",
    source:
      "FED: federalreserve.gov/newsevents/2026-september.htm carries one SCOOS row under Statistical Releases — 2:00 p.m., release date 24 (raw HTML parsed, fetched direct 2026-09-01); corroborated by four prior editions all releasing on a late-month Thursday at 2:00 p.m. per their own Board calendar pages (2025-09-25, 2025-12-18, 2026-03-26, 2026-06-25). Flipped estimate -> confirmed by this event's own initial research 2026-09-01, which is the condition the no-self-confirm limit names",
    impact: "low",
    symbols: [],
    notes:
      "READ IT, DO NOT TRADE IT — and `low` is now MEASURED, not asserted: across the last four releases IAI's (broker-dealers) close-to-close excess vs SPY ran +0.30 / -1.10 / +0.90 / -2.15% with no sign consistency, and post-release SPX afternoons sat at the 48th/64th/70th/89th percentile of 243 ordinary afternoons. What earns it a row is the READ, and the initial research (2026-09-01) corrected this note's own first draft twice. (1) Warsh's 2026-08-28 'hard pressed to describe broad financial conditions as restrictive' quote is verbatim correct, but the sentence before it shows his evidence base is the SLOOS (banks: C&I standards 'on the easier end of their historical range') plus market prices (spreads 'near the low ends of their historical ranges') — he never cites SCOOS. SCOOS measures the THIRD conduit, dealer financing, so it is the leg his claim rests on by omission, not a scorecard on it. (2) The response window closes BEFORE he spoke: September editions were conducted Aug 16-29 (2022), 14-28 (2023), 13-26 (2024), 12-25 (2025), all ending a Monday, so 2026 is ~Aug 11-24 — four days pre-keynote and ~30 days stale at publication, blind to the 09-16 decision, the hike repricing, the summit and opex. The baseline to diff is the JUNE 2026 edition (released 06-25, conducted May 12-26), not March: disputes rising (net ~1/5 across nearly all counterparty types vs March's 'unchanged'), hedge-fund negotiating intensity ~1/3 vs 1/5, and net ~1/5 of dealers TIGHTENING private-credit CLO warehouse terms citing 'a deterioration in the credit quality of underlying collateral and increased uncertainty about collateral valuation' — tightening inside the leverage conduit while spreads sat at range lows. The one direct AI channel on record is the Dec-2025 special questions (two-thirds of dealers saw hedge-fund demand for AI-focused stocks rise vs other sectors over two years, with terms unchanged); special questions rotate, so September's topic is unknowable until 14:00. Nothing on 09-24 is attributable: the 7Y auction settles ~13:01 ET and the estimate-dated Trump-Xi summit shares the date. Sibling of sloos-2026-11-02 (banks) as this is to dealers; the lapse-immunity claim now has a receipt — the Dec-2025 edition was conducted Nov 4-17 2025 and released 2025-12-18, straight through the lapse that killed October CPI and the October payrolls. Discovered during the beige-book-2026-09-02 pulse check (2026-09-01); researched in docs/research/events/scoos-2026-09-24.md.",
  },
  {
    id: "treasury-7y-note-2026-09-24",
    kind: "rates",
    title: "7-Year Treasury Note auction",
    date: "2026-09-24",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Closes the September coupon calendar.",
  },
  {
    id: "treasury-buyback-20y30y-2026-09-24",
    kind: "rates",
    title: "Treasury liquidity-support buyback operation (20-30Y nominal, 1:40pm ET)",
    date: "2026-09-24",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (Q3 2026 refunding, published 2026-08-05), PDF text layer read directly 2026-09-02 — row reads announce 9/23/2026, operation 9/24/2026 1:40 pm - 2:00 pm, settle 9/25/2026, Liquidity Support, Nominal Coupons 20Y to 30Y, maturity range 09/25/2046 - 09/24/2056, min $0, max $2 billion. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, and because the $2B cap predates press release sb0607, checked 2026-09-02",
    impact: "medium",
    symbols: [],
    notes:
      "The first 20-30Y-sector buyback after sb0607's 09-09 step-up to a $4B/operation minimum, so the published $2B cap should roughly double — Treasury has not republished the schedule; the preliminary cap and eligible-CUSIP list post at least one business day prior (09-23) and the final list at ~11:00am ET on operation day. CORRECTED 2026-09-02 by this event's own initial research: its maturity range (09/25/2046 - 09/24/2056) does cover the bond sold at treasury-30y-bond-2026-09-10 (CUSIP 912810UW6, matures 2056-08-15), but range is not eligibility — TreasuryDirect's buyback FAQ excludes on-the-run securities and any 'not past their first coupon payment date', and that bond is both (reopened 09-10, first coupon 2027-02-15). The 08-18 20-30Y operation's eligible list proves the rule: it ran 912810RV2 (2047-02-15) through 912810UR7 (2056-02-15) and omitted the May- and Aug-2056 issues. So NO scheduled operation supports the reopened long bond on current rules. Second correction: the cap is a ceiling, not a purchase — on 2026-03-19, same sector, dealers offered $36.0B and Treasury accepted $205M (10% of the then-$2B cap), acceptance being a relative-value price test. Shares 09-24 with treasury-7y-note-2026-09-24 (1:00pm ET), the Trump-Xi summit (est) and scoos-2026-09-24 (14:00), so nothing that afternoon is cleanly attributable. Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "trump-xi-summit-2026-09-24",
    kind: "geopolitical",
    title: "Trump–Xi summit (Washington) — trade, export-control, AI-governance agenda",
    date: "2026-09-24",
    status: "estimate",
    source:
      "NEWS: Atlantic Council/CSIS Trump-Xi 2026 Summit coverage + techtimes semiconductor-tariff reporting, checked 2026-08-28",
    impact: "high",
    symbols: [],
    notes:
      "Second in-person Trump-Xi meeting of 2026 (after the May Beijing visit); reported agenda includes AI governance, export controls, and the trade architecture after the Kuala Lumpur truce's Nov-10 tariff-suspension deadline. China semiconductor Section 301 tariffs already run near 70% combined exposure, with a further ~7.5% overcapacity layer reportedly being prepared ahead of the summit — surfaced via AVGO's 2026-08-28 pulse-check adjacency sweep (export-control/supply-chain exposure); most sensitive semis names (AVGO, NVDA, MRVL, AMD) carry it as sector risk, not an AVGO-only event.",
  },
  {
    id: "durable-goods-2026-09-25",
    kind: "macro-print",
    title: "Advance Durable Goods Orders (Aug 2026 data)",
    date: "2026-09-25",
    status: "confirmed",
    source:
      "CENSUS: two primaries fetched direct 2026-09-01 — census.gov/manufacturing/m3/release_schedule.html lists 'August 2026 | 9/25/2026 | 8:30 a.m.', and the current edition's own release PDF (census.gov/manufacturing/m3/adv/pdf/durgd.pdf, July data, CB 26-134) states 'The Advance Report on durable goods for August is scheduled for release on September 25, 2026, at 8:30 a.m. EDT'. Flipped estimate -> confirmed by this event's own initial research 2026-09-01, which is the condition the no-self-confirm limit names",
    impact: "medium",
    symbols: [],
    notes:
      "READ THE CORE, IGNORE THE HEADLINE, NEVER TRADE THE MORNING — and the initial research (2026-09-01) corrected this note's own first draft on both of its load-bearing claims. (1) THIS IS NOT AN AI-ORDER-FLOW PROXY: the release's own explanatory notes state 'Figures on new and unfilled orders exclude data for semiconductor manufacturing', because large semiconductor makers do not respond to the voluntary M3 order questions — so the 'computers and electronic products' NEW ORDERS line the first draft pointed at is semiconductor-free by construction. Shipments still include semis; new orders do not. (2) THE 2025-LAPSE PRECEDENT FOR THIS EXACT SERIES IS NOW CHECKED, and it is delay, not deletion, same as Census retail sales and unlike BLS: Census's own schedule shows the Sep-2025 advance slipping to 2025-11-26 and the Oct-2025 advance from 2025-11-26 to 2025-12-23 (~27-29 days), with the cadence not fully normal again until the Apr/May-2026 data releases. So THIS edition is unconditionally safe (five days before the deadline) and the exposed one is the successor durable-goods-2026-10-27, which on that precedent would slip past the 10-28 FOMC. The signal split is measured: across 2026 reference months the headline's dispersion is 10.9x the ex-transportation core's (sigma 3.74 vs 0.34) and its mean absolute forecast miss 7.5x (3.30pp vs 0.44pp), while the core printed positive 7/7. And the release morning does not move the tape: across 12 sourced releases the open gap ranks at the 46th (SPY) / 45th (QQQ) percentile of ordinary overnight gaps, 6/12 and 5/12 above median. Lands D+1 of scoos-2026-09-24 and shares its week with the 7Y auction, the estimate-dated Trump-Xi summit, Dallas Fed 09-28, and the JOLTS/consumer-confidence/MU/CRWV cluster on 09-29. Discovered during the scoos-2026-09-24 initial research (2026-09-01) off Census's own 2026 indicator calendar; researched in docs/research/events/durable-goods-2026-09-25.md.",
  },
  {
    id: "umich-sentiment-final-2026-09-25",
    kind: "macro-print",
    title: "University of Michigan consumer sentiment — final (Sep 2026)",
    date: "2026-09-25",
    status: "confirmed",
    source:
      'UMICH: the 2026 release-dates document of the Surveys of Consumers (data.sca.isr.umich.edu/fetchdoc.php?docid=79628) lists "September 25 September Final" in its PDF text layer, decompressed direct 2026-09-04 by this event\'s own initial research. NO CLOCK TIME is stated anywhere in that document and the apex host sca.isr.umich.edu did not resolve that day, so 10:00 ET remains customary rather than sourced — the date is primary-confirmed, the time is not',
    impact: "low",
    symbols: [],
    notes:
      "Earns an entry rather than being a routine revision because of the collection rule in the same schedule document: final-release interviews run through the Monday before release (2026-09-21), making this the first UMich reading that can contain the 2026-09-16 FOMC decision — which the 09-11 preliminary structurally cannot (its interviews close 09-07). So the number that carries information is the prelim→final revision, not the level. Discovered during umich-sentiment-prelim-2026-09-11 initial research, which filed it estimate and deferred promotion here; promoted to confirmed by its own initial research off the publisher's schedule document (the crwv-fully-connected-2026-09-29 precedent).",
  },
  {
    id: "unsc-iran-panel-mandate-expiry-2026-09-26",
    kind: "geopolitical",
    title: "Iran sanctions panel-of-experts mandate expires",
    date: "2026-09-26",
    status: "estimate",
    source:
      "EST: main.un.org/securitycouncil/en/sanctions/1737/panel-of-experts/work-and-mandate, fetched direct 2026-09-04 with a full browser header set, states verbatim 'The Panel comprises up to eight experts. Its current mandate ends on 26 September 2026'. That is a UN primary, but CONFIRMED_PREFIX in scripts/event-scan-validation.mjs carries no UN or diplomatic slot, and the event-research lane's no-self-confirm limit applies to an event discovered in-sweep — so filed estimate/EST: rather than confirmed, checked 2026-09-04",
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS THE HARD DEADLINE BEHIND unsc-iran-panel-mandate-vote-2026-09-17, which is the soft one. The vote date is wire-reported (Reuters, diplomats) and can slip; this date is on the UN's own page and cannot. Filed LOW rather than medium deliberately, on the same reasoning the sibling ledger reaches: what expires is a monitoring body, not a measure — snapback nullified resolution 2231's sunset clauses, so the reactivated sanctions have no expiry and nothing lapses here except the Panel's mandate to look. The DPRK precedent is the scored version of exactly this: Russia's 2024-03-28 veto ended the 1718 Panel on 2024-04-30 and the DPRK sanctions were untouched. TWO SCHEDULING FACTS THAT MATTER MORE THAN THE DATE ITSELF: 09-26 falls on a SATURDAY, so the nearest sessions are Friday 09-25 (durable-goods-2026-09-25, umich-sentiment-final-2026-09-25) and Monday 09-28 (dallas-fed-mfg-2026-09-28); and it falls during the UN General Assembly leaders' week, which is where the Council's attention and its principals will be. No tracked symbol is keyed; symbols: [] and no price channel is claimed — the channel with a measured price relationship in this theatre is the Strait of Hormuz transit count, not the Council's document record. Discovered during the unsc-iran-panel-mandate-vote-2026-09-17 initial research (2026-09-04). AMENDED 2026-09-04 by this event's own initial research (docs/research/events/unsc-iran-panel-mandate-expiry-2026-09-26.md); status UNCHANGED at estimate/EST: and date UNCHANGED at 09-26, now for a better reason. TWO UN PRIMARIES DISAGREE BY ONE DAY: the committee web page says the mandate 'ends on 26 September 2026', but the Secretariat's own reference document 'Security Council Reporting and mandate cycles' (DPPA/SCAD/SCSB reference no. 160, review date 2026-07-31, linked from main.un.org/securitycouncil/en/content/programme-work, read direct 2026-09-04) carries the row 'Non-proliferation (Iran): Sanctions: Panel of Experts mandate | For an initial period of one year (27 September 2026)', citing resolution 1929 (2010) para. 29 and resolution 2231 (2015) paras. 11 and 12 — the 27th being the one-year anniversary of the re-application that took effect 'on 27 September at 8 p.m. Eastern Daylight Time' in 2025. 09-26 is a Saturday and 09-27 a Sunday, so the market-relevant window (Friday 09-25 close to Monday 09-28 open) is identical either way; 09-26 is kept because it is what both the committee page and Reuters state. THREE FURTHER READS FROM THE SAME CYCLE DOCUMENT: the Panel's final report was due 28 August 2026 with no delivery recorded and the Reports page still ends at S/2015/401 (2 June 2015), so the deadline is already missed rather than forecast; the 1737 COMMITTEE by contrast filed its 90-day reports on 12 March 2026 and 9 June 2026, so the committee works even though the panel does not exist; and this is the NEXT sanctions-panel mandate to expire of any UN regime (Sudan 2026-10-12, Haiti 2026-11-17, Yemen 2026-12-15, South Sudan 2027-07-01, DRC 2027-08-01, Libya 2027-08-15). THE CORRIDOR MATTERS MORE THAN THE DATE: 21 tracked events sit within 5 days, and trump-xi-summit-2026-09-24 (estimate, high) is the one with a channel to Iranian export volumes, since US secondary sanctions on Chinese buyers are the binding enforcement and UN monitoring is not. Impact stays low and symbols: [] is correct.",
  },
  {
    id: "dallas-fed-mfg-2026-09-28",
    kind: "macro-print",
    title: "Dallas Fed Texas Manufacturing Outlook Survey (Sep 2026 data)",
    date: "2026-09-28",
    status: "estimate",
    source:
      "NEWS: fxstreet.com economic-calendar entry for the Dallas Fed Manufacturing Business Index lists the next release at 2026-09-28 14:30 UTC (10:30 ET); consistent with the series' observed last-Monday-of-month cadence (Apr 27, May 26, Jun 29, Jul 27, Aug 31 — all Mondays), checked 2026-09-01. The dallasfed.org primary returned HTTP 403 and was not fetchable",
    impact: "low",
    symbols: [],
    notes:
      "The second regional manufacturing analog to the national ISM print, and it exists to remove a selection bias this calendar had just created. `chicago-pmi-2026-09-30` was added on 2026-08-29 because its Aug-data reading collapsed to 47.1 — the bearish regional surprise. Two days later the Dallas survey printed the opposite: general business activity 11.6 from 1.3 (highest since Jan 2025), production 16.1 from 10.1, new orders 22.0 from 6.4, with prices paid still rising. Tracking only the analog that missed low would leave the calendar structurally primed to see soft manufacturing signals and not firm ones. Filed `low`, not `medium` like Chicago: Dallas is a single-state survey that leads the national print by a full month rather than by two business days, so it is context, not a leading indicator of the next ISM. Filed `estimate`/`NEWS:` — the publisher's own page is 403-blocked and this lane never self-promotes an adjacency to confirmed. Discovered during the ism-manufacturing-2026-09-01 pulse-check adjacency sweep.",
  },
  {
    id: "consumer-confidence-2026-09-29",
    kind: "macro-print",
    title: "Conference Board Consumer Confidence Index (Sep 2026)",
    date: "2026-09-29",
    status: "confirmed",
    source:
      'CB: conference-board.org/topics/consumer-confidence — the page states verbatim "The next release is Tuesday, September 29th at 10 AM ET", fetched 2026-08-29 (the explicit primary line the 2026-08-25 predecessor recorded as unfetchable behind Data Central)',
    impact: "medium",
    symbols: [],
    notes:
      "The leading consumer read feeding retail sales and the goods side of PCE. The calendar carried no consumer-confidence entry beyond the passed 08-25 print, despite August's deterioration (the CB index printed below consensus; UMich fell to 51 from 55.2) being the freshest consumer signal in the window. Discovered during the retail-sales-2026-09-16 pulse-check adjacency sweep.",
  },
  {
    id: "crwv-fully-connected-2026-09-29",
    kind: "product-launch",
    title: "CoreWeave Fully Connected 2026 (Moscone South, SF) — Sep 29–Oct 1",
    date: "2026-09-29",
    status: "confirmed",
    source:
      "IR: coreweave.com/fully-connected-2026 states Sep 29–Oct 1 2026, Moscone South (747 Howard St, SF), keynotes Intrator/Salanki/Goldberg + NVIDIA's Ian Buck + Fei-Fei Li; independently corroborated by the venue operator's own calendar, moscone.com/events/coreweave-fully-connected-2026 — both fetched 2026-08-31",
    impact: "medium",
    symbols: ["CRWV"],
    notes:
      "CoreWeave's own customer/product conference, ~6 weeks before the est. 2026-11-10 Q3 print — the one company-controlled news venue inside the pre-print window. Discovered during the crwv-2026-11-10-print pulse-check adjacency sweep and filed `estimate` there (this lane never self-confirms an event in the PR that discovers it); flipped to `confirmed` by the initial research 2026-08-31 on the company primary plus the venue-operator corroboration. The date is the first day of the Sep 29–Oct 1 window per house convention, but the published agenda puts the OPENING KEYNOTE on day 2, Wed 2026-09-30 10:00-11:30 ET — any window measurement centers there, not on 09-29 (day 1 is expo/BattleBots). That keynote day is the corridor's most macro-loaded session (PCE + GDP 3rd estimate + the FY27 funding deadline + Chicago PMI), with the MU print and JOLTS/consumer confidence on 09-29 and ISM Manufacturing 10-01 / jobs 10-02 after, so no CRWV move in the window is attributable to the conference. Confirmed status licenses nothing on its own: no CRWV playbook survives (S1 killed). See docs/research/events/crwv-fully-connected-2026-09-29.md.",
  },
  {
    id: "jolts-2026-09-29",
    kind: "macro-print",
    title: "JOLTS Job Openings (Aug 2026)",
    date: "2026-09-29",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/2026/09_sched_list.htm — 10:00 ET, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Second JOLTS in the window; fast turnaround per BLS's own schedule.",
  },
  {
    id: "adp-employment-2026-09-30",
    kind: "macro-print",
    title: "ADP National Employment Report (Sep 2026 data)",
    date: "2026-09-30",
    status: "confirmed",
    source:
      "IR: ADP's own August release (mediacenter.adp.com / PRNewswire 302867661, dateline 2026-09-02) states verbatim \"The September 2026 ADP National Employment Report will be released on September 30, 2026 at 8:15 a.m. ET\", fetched direct 2026-09-03; independently corroborated by FRED's release calendar rid=194, which lists 2026-09-30 at 07:15 CT (= 08:15 ET). Promoted from estimate by the adp-employment-2026-09-30 initial research — the no-self-confirm limit binds the sweep that proposed the entry, not a later independent session",
    impact: "medium",
    symbols: [],
    notes:
      "Two sessions ahead of BLS payrolls (10/2), the same pre-NFP slot the 09-02 edition held; the ADP-to-NFP correlation stays loose (Aug ADP +38k vs a 47-48k consensus, while the same cycle's July BLS print was -23k). WHY THIS EDITION IS DIFFERENT: September is ADP's annual preliminary QCEW re-benchmark print — the 2025-10-01 edition's own release states the rebenchmarking 'resulted in a reduction of 43,000 jobs' and revised the prior month from +54,000 to -3,000 — so its headline is a restatement, not a hiring signal. BLS published Q1-2026 QCEW + the preliminary CES benchmark on 08-28 (nonfarm -79k, private -178k) and ADP's 09-02 release carries no benchmark language, so the adjustment is pending. CORRECTION (2026-09-03): the original note's second tracking reason — a private labor read surviving a BLS blackout on the FY2027 funding deadline — is DEAD. The House adopted the Senate CR 370-48 on 09-01 and the president signed the Continuing Appropriations and Extensions Act, 2027 on 09-02, funding through 12-11; jobs 10-02 and CPI 10-14 print normally, and the live cliff moved to cr-expiry-2026-12-11. The medium tier now rests on the pre-NFP-private-read ground alone. Also corrected: ADP DOES pre-announce this edition, in the body of the prior release. Discovered in ADP's own release while closing out adp-employment-2026-09-02.",
  },
  {
    id: "chicago-pmi-2026-09-30",
    kind: "macro-print",
    title: "Chicago PMI / Chicago Business Barometer (Sep 2026 data)",
    date: "2026-09-30",
    status: "estimate",
    source:
      "NEWS: mnimarkets.com Chicago Business Barometer publication calendar — 09:45 ET, checked 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "The closest-timed regional analog to ISM Manufacturing, released the last business day of the month — two business days ahead of the national print. Added because its Aug-data reading (2026-08-28) collapsed to 47.1 against a ~58 consensus and a 57.6 prior, the biggest single macro surprise of that week and one this calendar could not see coming because the series was untracked. Discovered during the ism-manufacturing-2026-09-01 pulse-check adjacency sweep. Filed as `estimate`/`NEWS:` rather than confirmed: MNI is the series' own publisher, but this lane proposes adjacencies as estimates and never self-promotes them to confirmed.",
  },
  {
    id: "g20-trade-ministerial-milwaukee-2026-09-30",
    kind: "geopolitical",
    title: "G20 Trade Ministerial — Milwaukee, Wisconsin (US presidency)",
    date: "2026-09-30",
    status: "estimate",
    source:
      'EST: SOURCE UPGRADED 2026-09-04 by this event\'s own initial research — the hosting agency\'s own release exists after all. ustr.gov\'s press release of 2026-05-19 reads verbatim "Ambassador Jamieson Greer will host the G20 Trade Ministerial in Milwaukee, Wisconsin from Wednesday, September 30 to Thursday, October 1", which supersedes this line\'s original "no separate USTR release was located this pass". Corroborated twice on g20.org, both fetched direct 2026-09-04 at HTTP 200 with a full browser header set (a plain fetcher gets 403 from this host): the events calendar lists "Trade Ministerial (Milwaukee, Wisconsin) / September 30 – October 1, 2026", and the /location/ page independently writes "(September 30 – October 1)". Still no time of day published for either session. STATUS STAYS ESTIMATE, on the schema and not on doubt: CONFIRMED_PREFIX in scripts/event-scan-validation.mjs is IR|CAL|BLS|FED|PJM|SEC|TSY|OCC|BEA|CENSUS|ISM|CB|UMICH and has no slot for USTR or for any diplomatic calendar — the fifth ledger to bank that gap and the first where the hosting agency itself published the date. Adding a USTR: prefix is recommended as its own PR; it is outside this lane\'s ceiling. Day 1 of the two-day window per house convention. Checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED BECAUSE THE TRADE TRACK IS CLOSER TO A PRICE CHANNEL THAN THE FINANCE TRACK IS. The G20 dispute this year is 'cheap exports' and global imbalances — China dissented from exactly those paragraphs (4, 10, 11, 13) of the US chair's statement at Asheville on 2026-09-01 — but the finance track debates that in the abstract, while the trade track is where it would become tariff or procurement language, staffed by USTR rather than Treasury. It lands 15 days before g20-fmcbg-bangkok-2026-10-15 and 41 days before the two-sided 2026-11-10 expiry (China's MOFCOM/GAC Announcement No. 70 export-control suspension AND, per USTR's 2025-11-26 release, 178 US Section 301 product exclusions extended 'until November 10, 2026'). NO PRICE CHANNEL IS CLAIMED and impact is LOW: no G20 ministerial of any track has a measured US-equity effect in this calendar's research, and day 1 collides with government-funding-deadline-2026-09-30 plus the 09-30 gdp/adp/chicago-pmi cluster, so attribution off it is already impossible. Read it for whether the 19-vs-1 split of Asheville reappears in a trade text. Discovered during the g20-fmcbg-bangkok-2026-10-15 initial research (2026-09-04) off the host calendar, which also dates Sherpa III (DC, 10-01/02) and the Foreign Ministers' Meeting (Atlanta, 10-30/31) — both deliberately left un-proposed there. UPDATED 2026-09-04 by this event's own initial research, which found the price channel this note said was not claimed — and confirmed it does not run through the meeting. Greer's own release names the agenda: \"ending forced labor, updating the Most-Favored Nation (MFN) Principle, denouncing weaponization of trade in food, and addressing structural excess capacity and production\". That last phrase is VERBATIM the title of Section 301 investigations USTR initiated 2026-03-11 (91 FR 12886, dockets USTR-2026-0067/0068) into 16 economies — China, the EU, Singapore, Switzerland, Norway, Indonesia, Malaysia, Cambodia, Thailand, Korea, Vietnam, Taiwan, Bangladesh, Mexico, Japan, India — SEVEN of them fellow G20 members, with an illustrative sector list naming semiconductors, electronics, robotics, batteries and solar modules. That docket blew its own 2026-07-24 target: no determination, proposed remedy or tariff annex is published, and USTR's case page still ends at the 2026-05-08 hearing transcript. The statutory ceiling is 2027-03-11 (19 U.S.C. 2414(a)(2)(B), 12 months from initiation). IMPACT STAYS LOW ANYWAY, because a Section 301 remedy is delivered as a Federal Register Notice of Action rather than a communiqué — USTR demonstrated exactly that on the sibling forced-labor case (10% and 12.5% over MFN across 60 economies, effective 12:01 a.m. EDT 2026-07-24), acting unilaterally on agenda item #1 two months before convening the discussion of it. symbols: [] is correct: the sector exposure belongs to the determination, which has no date, not to the meeting. Researched in docs/research/events/g20-trade-ministerial-milwaukee-2026-09-30.md.",
  },
  {
    id: "gdp-q2-2026-third-2026-09-30",
    kind: "macro-print",
    title: "GDP — 3rd estimate, Q2 2026 (+ corporate profits, industries, state GDP)",
    date: "2026-09-30",
    status: "confirmed",
    source: "BEA: bea.gov/news/schedule — 08:30 ET, checked 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "The last revision to the +1.5% Q2 base that the 10-29 Q3 advance estimate gets measured against — which is the whole reason it is tracked; a revision here shifts the acceleration story before any Q3 number exists. Lands ON the FY2027 funding deadline, so in the lapse branch it is the last federal GDP release published before the blackout (BEA cancelled the Q3 advance estimate outright in the 2025 lapse). Marked `confirmed` on BEA's own schedule page fetched 2026-08-29 — the same primary and check date as the 10-29 and PCE entries, not an inferred cadence. Discovered during the gdp-q3-2026-advance-2026-10-29 initial research.",
  },
  {
    id: "government-funding-deadline-2026-09-30",
    kind: "geopolitical",
    title: "FY2027 federal funding deadline — shutdown begins 2026-10-01 absent a CR",
    date: "2026-09-30",
    status: "estimate",
    source:
      "NEWS: RESOLVED — AVERTED. H.R. 6500 (Continuing Appropriations and Extensions Act, 2027) was signed 2026-09-02 as PL 119-103, funding agencies through 2026-12-11, so no lapse begins 10-01. Three primaries read direct 2026-09-05: clerk.house.gov/Votes/2026286 (House concurred in the Senate amendments 2026-09-01 14:03 ET, 370-48, R 193-19 / D 176-29), whitehouse.gov's signing statement ('provides fiscal year 2027 appropriations to Federal agencies through December 11, 2026'), and govinfo BILLS-119hr6500eas Section 106 ('December 11, 2026'). congress.gov returned HTTP 403 on direct fetch, so the bill-status page is NOT among them. Stays `estimate` on two independent grounds and NOT because the date is doubted — the date was always statutory: this lane never self-confirms, and no `confirmed` prefix above covers enacted federal legislation or a White House signing statement (a fifth standing schema gap alongside the four the apple-eu-dma-terms-2026-10-01 note enumerates). Prior sourcing, superseded: Conference Board policy backgrounder + CRFB FY2027 appropriations tracker (both 2026-08-12), checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "Not a print — a dated policy checkpoint that gates whether the federal prints around it exist. ISM (10-01) is a private survey and publishes through a lapse; BLS does not — in the 2025 lapse it skipped the October Employment Situation and cancelled the October CPI outright. So an un-averted lapse removes the 10-02 payrolls and leaves the 10-01 ISM as the corridor's only hard macro read into an Oct 27-28 FOMC with no SEP. Kind `geopolitical` is the closest fit the enum offers for a domestic policy checkpoint (it is scoped to dated checkpoints like a summit or a tariff deadline); the imperfect fit is named, not fixed from this lane. THE CLIFF THIS SETS UP LANDS IN THE DECEMBER BLACKOUT (fomc-blackout-start-2026-11-28 initial research, 2026-08-31): the House CR expires 12-04 and the Senate's 12-11, so whichever is enacted expires INSIDE that gate (12-04 is jobs day) or on the day it lifts, and on this same 2025 precedent a 12-04 lapse plausibly deletes both jobs-2026-12-04 and cpi-2026-12-10 — the only two checks on a dot plot the Fed cannot speak about. RESOLVED 2026-09-05 by this event's own D-25 pulse (docs/research/events/government-funding-deadline-2026-09-30.md) — READ THE PARAGRAPH ABOVE AS HISTORY, NOT AS A LIVE PREMISE. The CR was enacted 2026-09-02 (PL 119-103, through 12-11), so there is no 10-01 lapse: jobs-2026-10-02 and cpi-2026-10-14 PRINT NORMALLY, the 2025 BLS-deletion precedent does not apply to October 2026, and fomc-2026-10-28 meets with a full dataset — its compounding drops from three blindfolds to two (no SEP, no forward guidance; data restored the third). Any downstream doc still premised on an October data blackout is stale as of 09-02. The 09-17 10Y TIPS auction's index-contingency exposure likewise retires for this cycle. The follow-on cliff this note said to 'file one once that is known' WAS filed, twice, by sibling sweeps on 2026-09-02 once the House adopted the Senate's Dec 11 date: cr-expiry-2026-12-11 and government-funding-deadline-2026-12-11 track the same fact and are a known duplicate. This pulse owns neither and does not consolidate them, but recommends cr-expiry-2026-12-11 as the survivor — it carries the substantive initial research (the lame-duck base-rate refusal, the blackout-gate placement, the December CPS interview-week analysis) while its twin is a thinner sweep-discovery note. DO NOT INHERIT THIS ENTRY'S AVERSION BASE CASE INTO DECEMBER: the incentive that produced this outcome was funding past the midterms, which is precisely what 12-11 expires into. Discovered during the ism-manufacturing-2026-10-01 initial research.",
  },
  {
    id: "pce-2026-09-30",
    kind: "macro-print",
    title: "PCE / Personal Income & Outlays (Aug 2026 data) + BEA annual update",
    date: "2026-09-30",
    status: "confirmed",
    source:
      'BEA: bea.gov/news/schedule — 08:30 ET, lists verbatim "September 30, 8:30 AM (News): Personal Income and Outlays, August 2026", and bea.gov/news/2026/personal-income-and-outlays-july-2026 carries "Next release: September 30, 2026, at 8:30 a.m. EDT", both fetched 2026-08-29',
    impact: "high",
    symbols: [],
    notes:
      "Three things land on one morning: the August PCE data, the BEA's 2026 annual update of the National Economic Accounts (new deflators for portfolio management, legal services and computer software, restating 2021Q1–2026Q1 — sourced range -10 to -30bp on core y/y: JPMorgan ~-10bp, Goldman ~-20bp, UBS decomposition -20 to -30bp), and the FY2027 funding deadline. Because the restatement spans the y/y's own year-ago base, the core figure printed here is NOT comparable to July's published 3.3%. It is also the LAST PCE the 10-28 FOMC sees (pce-2026-10-29 publishes the morning after that statement) and it publishes 08:30 ET BEFORE any 10-01 lapse, so it survives a shutdown that would delete jobs-2026-10-02 and cpi-2026-10-14. It is likewise the last clean read on the gap Warsh flagged at Jackson Hole on 2026-08-28 — 12-month PCE 3.7% against a 6-month run rate of 4.1% — so the m/m and the 6-month annualized are the informative lines here, not the y/y (which the restatement has broken anyway). Discovered during the pce-2026-10-29 initial research; status flipped estimate -> confirmed during its own initial research (2026-08-29) on the primary fetched that day.",
  },
  {
    id: "sp-select-sector-secondary-reweight-2026-09-30",
    kind: "sector",
    title:
      "Select Sector indices — conditional quarter-end secondary reweighting (24%/4.8%/50% breach test)",
    date: "2026-09-30",
    status: "estimate",
    source:
      "EST: rule-derived, not a scheduled publication. SEC EDGAR, Select Sector SPDR Trust Form 497 filed 2026-01-31 (fetched direct 2026-09-04): 'if, on the second to last business day of March, June, September, or December a company has a weight greater than 24% or the sum of the companies with weights greater than 4.8% exceeds 50%, a secondary reweighting will be triggered with the reweighting effective date being after the close of the last business day of the month.' September 2026's last business day is Wed 09-30 and the second-to-last is Tue 09-29, so the test is 09-29 and the trade, IF triggered, clears at the 09-30 close. Filed estimate because the trigger is CONDITIONAL — most quarters it does not fire, and no primary source can pre-confirm that it will",
    impact: "low",
    symbols: [],
    notes:
      "A BACKSTOP, not a base case — the only reason it is on the calendar is that it is the one other dated afternoon in this quarter where a forced index trade can appear without an announcement to warn of it. Discovered during the sp-rebalance-proforma-capped-2026-09-11 initial research (2026-09-04), which computed current cap headroom from vendor ETF holdings: XLK's over-4.8% cohort ~42.0% against the 50% trigger, XLC's ~55.2%. XLC's breach is what makes the mechanism live at all — but the 09-18 rebalance RE-CAPS everything, so a 09-29 trigger would require the cohort to drift back over 50% in the ~7 sessions after that reset, which is unlikely straight out of a rebalance. Two honest caveats carried from that research: those are ETF holdings weights on stale dates (XLK 2026-08-07, XLC 2026-08-28), not index float-market-cap weights, and Morningstar describes a '23/4.5/50' sector capping methodology that does not reconcile with the SEC filing's 24/4.8/50 — the SEC filing is preferred as primary and the conflict is named, not averaged. Low impact and estimate status: it widens caution about the 09-29/09-30 closes and licenses nothing, and no house playbook (S1/S2/E1/S3/S4/G1) is index-flow-keyed. Kind `sector` is the closest fit the enum offers for a market-structure flow event; the imperfect fit is named, not fixed from this lane.",
  },
  {
    id: "apple-eu-dma-terms-2026-10-01",
    kind: "sector",
    title: "Apple EU DMA business terms take effect (Core Technology Commission)",
    date: "2026-10-01",
    status: "confirmed",
    source:
      "IR: apple.com/newsroom/2026/08/apple-announces-changes-for-apps-in-the-european-union/ states verbatim 'Developers can sign the new terms today, and changes will go into effect on October 1' (published 2026-08-18), and developer.apple.com/support/apps-in-the-eu/ states 'The primary updates, which go into effect on October 1, 2026, include:' against an Apple Developer Program License Agreement revised 2026-08-18 — both fetched direct 2026-09-02",
    impact: "low",
    symbols: ["AAPL"],
    notes:
      "PROMOTED estimate -> confirmed during this event's initial research (2026-09-02, docs/research/events/apple-eu-dma-terms-2026-10-01.md): two independent Apple primary pages were fetched that session, and `IR:` is exactly the 'company primary source' prefix the table above defines, so none of the four standing schema gaps (federal court / state utility commission / state election authority / EIA) applies here. It was filed estimate on discovery only because the sweep that found it may not self-confirm. Terms, from the primary: App Store IAP commission 30% -> 26% (15% for Small Business / Mini Apps / Video Partner programs and post-year-one auto-renewables); alternative in-app payment 20% (10%); a NEW 15% (10%) Store Services Commission on out-of-app link-outs within a 7-day window; the per-install Core Technology Fee becomes a flat 5% Core Technology Commission on alternative marketplaces, Web Distribution and that same link-out window; the Initial Acquisition Fee and Store Services Fee are eliminated; marketplace/Web Distribution eligibility widens (no EU legal entity required, seven alternative criteria). This is a NEGOTIATED SETTLEMENT Apple announced, not an imposition -- Apple's own wording is that the changes 'resolve Apple's disagreements with the Commission over business terms and alternative distribution'. The information event was therefore 2026-08-18, not this date: AAPL closed +1.45% vs QQQ -1.69% that session (+3.15% excess) with press attributing it to the CTF being scrapped. `low` is arithmetically correct, not a shrug -- the EU is ~7% of global App Store revenue (Apple to analysts, 2024) and the 30->26 cut is a 13.3% relative reduction on the standard-rate slice only, bounding the concession at <=0.93% of global App Store revenue before the CTC/Store-Services offsets, against Services revenue of $30.7B in FQ3-2026. It is a thesis input to the FQ1 guide (est. 10-29), never a date-keyed action; `confirmed` removes date doubt without creating a reason to act. The settlement does NOT retire Apple's EU overhang: the EUR 500M anti-steering fine is on appeal at the General Court (filed 2025-07-07) and interoperability specification proceedings DMA.100203/100204 remain live. Kind `sector` is the closest fit the enum offers for a regulatory effective-date (it is scoped to export-control deadlines and dockets); the imperfect fit is named, not fixed from this lane -- the same call the FY2027-funding entry made with `geopolitical`. Note it lands the same day as ism-manufacturing-2026-10-01 and one day after government-funding-deadline-2026-09-30's cliff, which is why the effective date is unmeasurable as well as uninformative. Discovered during the aapl-iphone-18-launch-2026-09-09 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "ism-manufacturing-2026-10-01",
    kind: "macro-print",
    title: "ISM Manufacturing PMI (Sep 2026 data)",
    date: "2026-10-01",
    status: "confirmed",
    source:
      "ISM: the August-data ISM Manufacturing report (PRNewswire 302865127, dateline 2026-09-01 10:00 ET) names its own successor verbatim — \"The next ISM(R) Manufacturing PMI(R) Report featuring September 2026 data will be released at 10:00 a.m. ET on Thursday, October 1, 2026.\" Promoted estimate -> confirmed on that line, the same promotion path the ism-services-2026-10-05 entry took on its own sibling report (FT-47, scored PASS 2026-09-04); the date had been rule-derived from the first-business-day cadence and the report's own line agrees exactly. Independently corroborated by Kalshi's KXISMPMI-26SEP strike ladder, whose settlement close_time is 2026-10-01T13:59:00Z = 09:59 ET, one minute before the stated release. ismworld.org's ROB calendar page remains SSO-gated (302s to ecommerce.ismworld.org/SSO/Login.aspx, re-checked today), so the primary is ISM's authorized wire distribution rather than ismworld.org itself — the standing limit on every ISM entry in this calendar, checked 2026-09-05",
    impact: "high",
    symbols: [],
    notes:
      "The national print the Chicago Business Barometer leads by two business days, and the first manufacturing read of Q4. The calendar tracked the 09-01 release and then nothing until CPI 10-14, so the follow-through the 09-30 Chicago print exists to probe was untracked. Discovered during the chicago-pmi-2026-09-30 initial research. PROMOTED estimate -> confirmed on 2026-09-05 during this event's pulse check, which also RETIRES A STANDING CLAIM this ledger carried: its initial research recorded that promotion was structurally impossible from this lane because ismworld.org is SSO-gated. That was wrong — the gated page is not the only ISM primary, since every ISM report names its own successor's date and time in its own release text, and the services sibling had already proven the path four days earlier. The confirmed date removes date doubt without creating a reason to act: `symbols: []` and no house playbook is macro-keyed, so this stays read-it-do-not-trade-it.",
  },
  {
    id: "treasury-coupon-announcement-2026-10-01",
    kind: "rates",
    title: "Treasury coupon announcement (3Y / 10Y reopening / 30Y reopening sizes)",
    date: "2026-10-01",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — three rows announce that day, `3-Year NOTE` (auction Tuesday, October 06, 2026), `10-Year NOTE R` (auction Wednesday, October 07, 2026) and `30-Year BOND R` (auction Thursday, October 08, 2026), all settling Thursday, October 15, 2026. Sizes corroborated by press release sb0590 (2026-08-05 quarterly refunding statement, fetched direct the same session), whose Oct-26 anticipated-size row reads 69 58 70 44 39 13 22 30 across the 2Y/3Y/5Y/7Y/10Y/20Y/30Y/FRN headers — i.e. 3-Year $58B, 10-Year $39B, 30-Year $22B. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep. The ~11:00 ET slot is Treasury's standing coupon-announcement convention and is NOT separately sourced",
    impact: "medium",
    symbols: [],
    notes:
      "THE FREE INTERMEDIATE FALSIFIER for the whole published-guidance chain, and the reason it earns a slot two weeks ahead of treasury-coupon-announcement-2026-10-15: this announcement prints four of the numbers in the SAME sb0590 Oct-26 table row that the 10-15 announcement reads its 20-Year from. If 3Y/10Y/30Y come in at 58/39/22 the row is corroborated for its own month before 10-15 ever reads it; if any of them prints off-grid the row is wrong and every 'supply is settled in writing' line in this calendar's rates ledgers gets re-derived rather than patched — at zero cost, since no position is taken either way. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. Lands the same morning as ism-manufacturing-2026-10-01 and apple-eu-dma-terms-2026-10-01 and one day before jobs-2026-10-02, so no intraday attribution to an ~11:00 ET announcement is defensible — the measurable is the sizes, never the reaction. Note the three auctions it sets up (10-06, 10-07, 10-08) are themselves untracked; this entry does not file them. Discovered during the treasury-coupon-announcement-2026-10-15 initial-research adjacency sweep (2026-09-05).",
  },
  {
    id: "jobs-2026-10-02",
    kind: "macro-print",
    title: "Employment Situation (Sep 2026 data)",
    date: "2026-10-02",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/empsit.htm — 08:30 ET, checked 2026-08-17",
    impact: "high",
    symbols: [],
    notes:
      "Last major payroll input between the Sep dots and the Oct 27–28 vote (no SEP at that meeting).",
  },
  {
    id: "opec-jmmc-68th-2026-10-04",
    kind: "geopolitical",
    title: "68th OPEC+ Joint Ministerial Monitoring Committee (JMMC)",
    date: "2026-10-04",
    status: "estimate",
    source:
      "EST: opec.org press release 2026-08-02 (67th JMMC) states verbatim 'The next meeting of the JMMC (68th) is scheduled for 4 October 2026' — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-08-31",
    impact: "low",
    symbols: [],
    notes:
      "The successor checkpoint to opec-plus-meeting-2026-09-06, and deliberately filed `low`: the JMMC monitors DoC conformity and compensation and RECOMMENDS — it does not set quotas, which is the seven/eight-country group's job. What makes it worth tracking anyway is the 2027 baseline fight: third-party Maximum-Sustainable-Capacity audits commissioned across Jan-Sep 2026 set the 2027 baselines from which every quota derives, Iraq is pushing for a higher individual number, and Kazakhstan carries the alliance's largest cumulative compensation burden — the JMMC is where conformity and compensation get aired in public before the group decides. Discovered during the opec-plus-meeting-2026-09-06 initial research (2026-08-31).",
  },
  {
    id: "ism-services-2026-10-05",
    kind: "macro-print",
    title: "ISM Services PMI (Sep 2026 data)",
    date: "2026-10-05",
    status: "confirmed",
    source:
      "ISM: the August-data ISM Services report (PRNewswire 302868046, dateline 2026-09-03 10:00 ET) names its own successor verbatim — \"The next ISM(R) Services PMI(R) Report featuring September 2026 data will be released at 10:00 a.m. ET on Monday, October 5, 2026.\" Promoted estimate -> confirmed on that line, which is ISM's own release text and the promotion path this entry pre-registered (forward test FT-47, scored PASS 2026-09-04); the date had been rule-derived from the third-business-day cadence, and the report's own line agrees exactly. ismworld.org's ROB calendar page remains SSO-gated (302s to ecommerce.ismworld.org/SSO/Login.aspx), so the primary is ISM's authorized wire distribution rather than ismworld.org itself — the standing limit on every ISM entry in this calendar, checked 2026-09-04",
    impact: "high",
    symbols: [],
    notes:
      'FILLS A HOLE IN THE TRACKED SERIES: the calendar carried 09-03, 11-04 and 12-03 but not October, while its manufacturing sibling ism-manufacturing-2026-10-01 was tracked — so the one Q4 services read before the 10-28 FOMC was invisible. It also CORRECTS A DATE: the ism-services-2026-11-04 ledger names the October print as "10-06" in both its signal list and its kill switches, which is the fourth business day and would only be right under the January exception; that ledger is append-only and was not edited. READ IT, DO NOT TRADE IT, on the same measured grounds as its siblings — the 11-04 initial research found release-day moves in TLT/^TNX/SPY/QQQ/XLF/IWM statistically nil across all eight 2026 releases, and the 12-03 research added that the 10:00 ET release HOUR is quieter than an ordinary hour in four of five instruments. Cheap falsifier, dated: each report names its successor, so the 2026-09-03 release\'s own "next report" line adjudicates this date within 24 hours of filing (forward test FT-47) and is also what would promote it to confirmed. THAT FALSIFIER RESOLVED: the 2026-09-03 report named "Monday, October 5, 2026" verbatim, FT-47 scored PASS on 2026-09-04, and this entry was promoted to confirmed on it — which also leaves the same cadence rule dating ism-services-2026-12-03 standing rather than under doubt. Discovered during the ism-services-2026-12-03 initial research (2026-09-02).',
  },
  {
    id: "mrvl-investor-day-2026-10-06",
    kind: "product-launch",
    title: "MRVL Investor Day (NYC)",
    date: "2026-10-06",
    status: "confirmed",
    source: "IR: investor.marvell.com PR 2026-08-03 — Investor Day Tue Oct 6, checked 2026-08-17",
    impact: "medium",
    symbols: ["MRVL"],
    notes:
      "Company-set; MRVL investor days have filed Item-2.02 8-Ks — the filing class that corrupted the instrument's event list.",
  },
  {
    id: "treasury-3y-note-2026-10-06",
    kind: "rates",
    title: "3-Year Treasury Note auction (new issue)",
    date: "2026-10-06",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes), row reads verbatim `3-Year NOTE / Announcement Thursday, October 01, 2026 / Auction Tuesday, October 06, 2026 / Settlement Thursday, October 15, 2026` — no `R` marker, i.e. a new issue, which matches every 3-Year auction in fiscaldata's `auctions_query` back to 2022 (each month is its own CUSIP). Size corroborated in advance by press release sb0590 (2026-08-05), whose Oct-26 anticipated-size row puts the 3-Year at $58 billion. 1:00pm ET is Treasury's standing coupon-auction convention and is NOT separately sourced. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep — the confirming primary is the 2026-10-01 announcement itself",
    impact: "medium",
    symbols: [],
    notes:
      "The largest single leg of the October coupon block ($58B of $119B) and the front-end one, so it is the first auction to price whatever the 2026-09-16 FOMC did. Its CUSIP is the one field of the 10-01 announcement that CANNOT be predicted in advance — the 3-Year is a fresh security every month, unlike the 10Y/30Y reopenings that share this block. Size base rate re-derived 2026-09-05 from `auctions_query`: $58B for 29 consecutive completed auctions since 2024-04-09, ending a nine-month +$2B/month ramp. Read it, do not trade it: `symbols: []`, the date is `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. Discovered during the treasury-coupon-announcement-2026-10-01 initial research (2026-09-05), which is the sweep the treasury-coupon-announcement-2026-10-15 entry asked for when it named these three auctions and declined to file them.",
  },
  {
    id: "treasury-buyback-2y3y-2026-10-06",
    kind: "rates",
    title: "Treasury liquidity-support buyback operation (2-3Y nominal, 1:40pm ET)",
    date: "2026-10-06",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (August 2026 refunding, published 2026-08-05), PDF text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 125,547 bytes) — the row reads verbatim announce 10/5/2026, operation 10/6/2026 1:40 pm - 2:00 pm, settle 10/7/2026, Liquidity Support, Nominal Coupons 2Y to 3Y, maturity range 10/07/2028 - 10/06/2029, min $0, max $4 billion. Stays estimate on two counts: a tentative schedule is tentative by construction, and the confirming primary is the 10-05 operation announcement rather than this document, checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "It shares its date AND its tenor with treasury-3y-note-2026-10-06, running 1:40-2:00pm ET — forty minutes after that auction's 1:00pm competitive close. That combination corrects a claim the September sibling ledger (treasury-3y-note-2026-09-08) carried in every row: 'the buyback lever does not reach this tenor.' True for September, false for this date. Two details. The $4B cap is the STANDING liquidity-support cap for short nominal buckets, NOT the figure press release sb0607 (2026-08-19) doubled — that raised the 10-20Y and 20-30Y caps which this same schedule still shows at $2B, so unlike treasury-buyback-10y20y-2026-10-15 this row's cap is current rather than superseded. And the maturity range 10/07/2028 - 10/06/2029 INCLUDES the September 3-Year's 2029-09-15 maturity while EXCLUDING the 10-06 issue's own 2029-10-15, so the operation can bid for the note this auction displaces but never for the auction's own security; Treasury's footnotes put the preliminary eligible-CUSIP list at 11:00am ET on 10-05 and the final list at 11:00am ET on 10-06, i.e. two hours before bidders commit. READ IT, DO NOT TRADE IT, and specifically do not read it as auction support: measured 2026-09-05 from fiscaldata's buybacks_operations dataset, buyback operations landed on a 3-Year auction date 10 times in the 29-auction constant-$58B era, and fill rates track the BUCKET rather than the auction day (10Y-20Y fills its cap 25/25 regardless; the 2Y-3Y bucket runs a 60% mean fill over 9 ops, and of the two variance-carrying buckets that ever shared a 3Y auction day, 2Y-3Y filled 100% on 2025-03-11 while 7Y-10Y filled 11% against a 10% mean on 2024-09-10 — one observation each way, no significance test applied). That n=1-each-way split is registered as FT-treasury-3y-note-2026-10-06-2. Discovered during the treasury-3y-note-2026-10-06 initial research (2026-09-05); the same schedule's 10-02 (10-20Y) and 10-08 (20-30Y) operations were seen and deliberately not filed here — the 10-08 one lands on the 30-Year bond auction's own day and belongs to that event's sweep.",
  },
  {
    id: "fomc-minutes-2026-10-07",
    kind: "macro-print",
    title: "FOMC minutes (Sep 15–16 meeting)",
    date: "2026-10-07",
    status: "estimate",
    source:
      "EST: federalreserve.gov/newsevents/2026-october.htm lists 'FOMC Minutes' at 2:00 p.m. on October 7 for the September 15-16 meeting (fetched direct 2026-08-31). Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "The richest read on this Committee's reaction function available before the 10-28 decision, and the ONLY one that arrives outside the 10-17 blackout. Matters more than an ordinary minutes release because Warsh has withdrawn the usual substitute: his 2026-08-28 Jackson Hole keynote argued for 'a quieter Fed' and said forward guidance has overstayed its welcome, so the vote split and the dissent language here are close to the only structured evidence on how a coin-flip September resolved. Read it, do not trade it — minutes are three weeks stale by publication. Discovered during the fomc-blackout-start-2026-10-17 initial research.",
  },
  {
    id: "treasury-10y-note-2026-10-07",
    kind: "rates",
    title: "10-Year Treasury Note auction (second reopening)",
    date: "2026-10-07",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes), row reads verbatim `10-Year NOTE R / Announcement Thursday, October 01, 2026 / Auction Wednesday, October 07, 2026 / Settlement Thursday, October 15, 2026`. Size corroborated in advance by press release sb0590 (2026-08-05), whose Oct-26 anticipated-size row puts the 10-Year at $39 billion. 1:00pm ET is Treasury's standing coupon-auction convention and is NOT separately sourced. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep",
    impact: "medium",
    symbols: [],
    notes:
      "PREDICTED CUSIP 91282CRF0, term `9-Year 10-Month` — the second and final reopening of the August 2026 10-Year new issue (sold 2026-08-12 at $42B; first reopening 2026-09-09 at $39B, CUSIP confirmed live on treasurydirect's upcoming feed 2026-09-05). That is an inference from a cycle, not a fetched field: measured 2026-09-05 from `auctions_query`, every one of the 18 completed 10-Year new-issue cycles back to 2022-01 was reopened exactly twice, in the two following months, with no exceptions. Filed as a prediction rather than a fact BECAUSE it is checkable at the 10-01 announcement — see FT-treasury-coupon-announcement-2026-10-01-1. Completing this auction makes 91282CRF0 a $120B security (42 + 39 + 39). Size base rate: $39B for 20 consecutive completed 10-Year reopenings since 2024-03-12. Read it, do not trade it: `symbols: []`, date is `estimate`. Discovered during the treasury-coupon-announcement-2026-10-01 initial research (2026-09-05).",
  },
  {
    id: "ecb-account-2026-10-08",
    kind: "macro-print",
    title: "ECB account of the 2026-09-09/10 monetary-policy meeting",
    date: "2026-10-08",
    status: "estimate",
    source:
      "EST: ecb.europa.eu monetary-policy accounts index (press/accounts), fetched direct 2026-09-05 — states the rule verbatim, 'The accounts are typically published four weeks after the meetings', and names the next release as 8 October 2026. Corroborated by the rule's own arithmetic on the prior edition: the account of the 22-23 July 2026 meeting published 2026-08-27 (ecb.europa.eu/press/accounts/2026/html/ecb.mg260827, fetched the same session). Filed estimate on two counts — the ECB's own word is 'typically', and CONFIRMED_PREFIX carries no slot for a non-Fed central bank's schedule, the same gap ecb-decision-2026-09-10 records. Checked 2026-09-05",
    impact: "low",
    symbols: [],
    notes:
      "The account is where the 09-10 decision's ARGUMENT becomes public — the vote is not published, so this is the only structured evidence on how close the Governing Council was and on what conditions. Tiered `low` deliberately: this book holds nothing with a euro-rates channel (`symbols: []`, no house playbook is rates-keyed), and the July edition moved nothing. Its one real use is the terminal-rate question ecb-decision-2026-09-10 registers as FT-ecb-decision-2026-09-10-2 — whether the 2.50% peak was near-unanimous or contested is visible only here, ahead of the 10-29 decision. Note the collision: it lands the day after fomc-minutes-2026-10-07, so two central-bank records publish back-to-back. Discovered during the ecb-decision-2026-09-10 initial research (2026-09-05). READ IT, DO NOT TRADE IT — an account is four weeks stale by construction, and this one is stale about a decision that was ~99% priced before it happened. AMENDED 2026-09-05 by this event's own initial research (docs/research/events/ecb-account-2026-10-08.md); status, date and impact UNCHANGED, purpose NARROWED. THE 'READ IT, DO NOT TRADE IT' LINE IS NOW MEASURED RATHER THAN ASSERTED: across the 13 accounts published 2025-26 (dates off the ECB's own 2025/2026 indexes, Yahoo adjusted bars, cache busted), mean close-to-close absolute move on the publication day was Euro Stoxx 50 0.87% vs a 0.75% all-days baseline (1.15x, n=417), DAX 0.78% vs 0.81% (0.97x) and EUR/USD 0.36% vs 0.33% (1.10x), with 1 of 13 reaching 2x baseline — and that one (2025-04-03, STOXX50E -3.59%) is the session after the US reciprocal-tariff announcement (SPX -4.84%, VIX +39.6% to 30.02), while the most recent (2026-08-27) produced 2026's largest euro-minus-US residual off NVDA +8.74% post-earnings, not off the account. A companion cut refuted the intuitive contrast and is kept: 2026-only, ECB DECISION days ran ~1.6x baseline, but 2025+2026 collapses that to 1.08x/0.99x/1.17x. TWO CORRECTIONS TO THIS NOTE'S OWN FRAMING. (1) 'the vote is not published, so this is the only structured evidence on how close the Governing Council was' is half-right: the 2026-03-05 account read in full is uniformly collective ('Members broadly agreed', 'It was argued that', 'Several concerns were raised') with NO vote count and NO names, so it yields an adjective, not a count. (2) It is not the last word before 10-29 either — the ECB quiet period is 'the seven days before a scheduled meeting' (explainer, fetched 2026-09-05), so 13 days of unrestricted Governing Council speech follow the account before the gate falls, which is why ecb-quiet-period-start-2026-10-21 is proposed in the same PR. DATE LEG QUANTIFIED: publication minus meeting Day 2 across those 13 editions is 9 at exactly four weeks and 4 at exactly five, zero anything else — the ECB's 'typically' is a ~31% one-week-slip risk with no other dispersion, registered as FT-ecb-account-2026-10-08-2 against the index's stated 'Next release: 8 October 2026'.",
  },
  {
    id: "treasury-30y-bond-2026-10-08",
    kind: "rates",
    title: "30-Year Treasury Bond auction (second reopening)",
    date: "2026-10-08",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes), row reads verbatim `30-Year BOND R / Announcement Thursday, October 01, 2026 / Auction Thursday, October 08, 2026 / Settlement Thursday, October 15, 2026`. Size corroborated in advance by press release sb0590 (2026-08-05), whose Oct-26 anticipated-size row puts the 30-Year at $22 billion. 1:00pm ET is Treasury's standing coupon-auction convention and is NOT separately sourced. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep",
    impact: "medium",
    symbols: [],
    notes:
      "PREDICTED CUSIP 912810UW6, term `29-Year 10-Month` — the second and final reopening of the August 2026 30-Year new issue (sold 2026-08-13 at $25B; first reopening 2026-09-10 at $22B, CUSIP confirmed live on treasurydirect's upcoming feed 2026-09-05). An inference from a cycle, not a fetched field: measured 2026-09-05 from `auctions_query`, all 15 completed 30-Year new-issue cycles back to 2022-11 were reopened exactly twice, in the two following months, no exceptions. Checkable at the 10-01 announcement — see FT-treasury-coupon-announcement-2026-10-01-1. Completing this auction makes 912810UW6 a $69B security (25 + 22 + 22). Size base rate: $22B for 20 consecutive completed 30-Year reopenings since 2024-03-13. THE LONG-END LEG, so it is the one of the three that sells into the doubled liquidity-support buyback bid `sb0607` (2026-08-19) put in place through 2026-11-04. Read it, do not trade it: `symbols: []`, date is `estimate`. Discovered during the treasury-coupon-announcement-2026-10-01 initial research (2026-09-05).",
  },
  {
    id: "treasury-buyback-20y30y-2026-10-08",
    kind: "rates",
    title: "Treasury liquidity-support buyback operation (20-30Y nominal, 1:40pm ET)",
    date: "2026-10-08",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (August 2026 Quarterly Refunding, published 2026-08-05), PDF text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 125,547 bytes) — row reads announce 10/7/2026, operation 10/8/2026 1:40 pm - 2:00 pm, settle 10/9/2026, Liquidity Support, Nominal Coupons 20Y to 30Y, maturity range 10/09/2046 - 10/08/2056, min $0, max $2 billion. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, and because the $2B cap predates press release sb0607 (2026-08-19), whose promised replacement schedule is still unpublished 17 days on — the re-fetched PDF is byte-identical to the 2026-09-03 pull. Checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "IT SHARES ITS DAY WITH treasury-30y-bond-2026-10-08, AND IT STILL CANNOT BID FOR THAT BOND. This is the trap the September pair did not set: on 09-10 the same-day operation was 10-20Y and the maturity range alone excluded CUSIP 912810UW6, but this operation's range (10/09/2046 - 10/08/2056) DOES cover it (matures 2056-08-15), so a reader stopping at the range concludes the opposite of the truth. TreasuryDirect's buyback FAQ excludes on-the-run securities and any not past their first coupon payment date; 912810UW6 fails both on 10-08 (still on-the-run through that morning's reopening, first coupon 2027-02-15). Measured corroboration from fiscaldata's buybacks_security_details across ALL 20 nominal 20Y-30Y operations on record (2025-04-02 to 2026-08-18): on-the-run 30Y eligible 0/20, first-off-the-run 0/20, second-off-the-run 20/20 — and the pattern is the coupon clause rather than recency, since on 2026-08-18 912810UU0 (first coupon 2026-11-15) failed the coupon clause alone while 912810UR7 (first coupon 2026-08-15) cleared both and topped the list. PREDICTED top of this operation's preliminary list: 912810UR7 (2056-02-15), since 912810UU0's first coupon is still unpaid on 10-08 — registered as FT-treasury-30y-bond-2026-10-08-2, scoring off the preliminary eligible-CUSIP list published 11:00am ET 2026-10-07 (the final list posts 11:00am ET on operation day). Cap is a ceiling, not a purchase: on 2026-08-18 the $2B filled from just three issues maturing 2048-2051 against $19.87B offered across 36 eligible CUSIPs, and on 2026-03-19 the same sector accepted $205M against $36.0B offered. Read it, do not trade it: symbols: [], date is estimate. Discovered during the treasury-30y-bond-2026-10-08 initial research (2026-09-05).",
  },
  {
    id: "imf-world-bank-annual-meetings-2026-10-12",
    kind: "geopolitical",
    title: "IMF / World Bank Group Annual Meetings — Bangkok (Oct 12-18)",
    date: "2026-10-12",
    status: "estimate",
    source:
      "EST: worldbank.org's 2026 Annual Meetings page, fetched direct 2026-09-04, states \"The 2026 Annual Meetings of the International Monetary Fund and the World Bank Group will take place from Monday, October 12 to Sunday, October 18 in Bangkok, Thailand\", listing the Development Committee on October 15, the plenary on October 16 and the IMFC plenary on October 17; the venue (Queen Sirikit National Convention Center) and the host award trace to IMF press release 23/122 (2023-04-19). Filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, and because CONFIRMED_PREFIX has no slot for a multilateral body's own schedule — the same gap apec-leaders-shenzhen-2026-11-18 records. Day 1 of the week per house convention. Checked 2026-09-04",
    impact: "low",
    symbols: [],
    notes:
      "THE CONTAINER, NOT A CATALYST. g20.org's own calendar says g20-fmcbg-bangkok-2026-10-15 is held 'on the margins of' this week, so this entry is what dates that meeting and the whole 10-12/18 diplomatic corridor. Filed LOW with NO price channel claimed: its one publication with any macro-read value is the IMF's autumn World Economic Outlook forecast round, whose 2026 release date neither worldbank.org nor imf.org had published as of 2026-09-04 — so the WEO is deliberately NOT filed as its own event, and a later pulse should add it once dated. Attribution off this week is hopeless in any case: cpi-2026-10-14 and beige-book-2026-10-14, then ppi-2026-10-15 and retail-sales-2026-10-15 at 08:30 ET, then opex-2026-10-16, import-export-prices-2026-10-16 and treasury-primary-dealer-agenda-2026-10-16, with fomc-blackout-start-2026-10-17 closing it. No symbol this calendar tracks carries exposure. Discovered during the g20-fmcbg-bangkok-2026-10-15 initial research (2026-09-04). ITS OWN INITIAL RESEARCH (2026-09-04) MEASURED THE 'NO PRICE CHANNEL' CLAIM ON THE ONE CHANNEL THAT EXISTS — the IMF flagships — and both recent instances miss DIRECTIONALLY, not merely in size. On 2025-10-14 (Annual Meetings 10/13-19) the Global Financial Stability Report called the S&P 500 and global equities about 10% overvalued and named a repricing of investor AI expectations as the top risk — the most on-thesis document this book could receive from a multilateral; SPX closed 6,644.31 that day (-0.16% from 6,654.72), ended the meetings week +0.14% at 6,664.01, and was +2.22% at 6,791.69 by 10-24. The week's only vol event, VIX 20.64 -> 25.31 on 10-16, was the Zions ~$50M C&I charge-off and the Western Alliance borrower-fraud allegation (S&P Regional Banks index -6.3%), not the IMF. On 2026-04-14 (Spring Meetings 04/13-19) the World Economic Outlook CUT 2026 global growth 0.2pp to 3.1% under the title 'Global Economy in the Shadow of War'; SPX closed +1.18% at 6,967.38 and ran +4.54% across the week (6,816.89 on 04-10 -> 7,126.06 on 04-17) with VIX falling 19.23 -> 17.48. Marrakech 2023, the one prior away-year, is recorded as UNUSABLE as a third sample: it opens two days after 2023-10-07. Three further findings. (1) NO EXPOSURE, PROVEN NOT ASSERTED: none of the ten names in earnings-calendar.ts prints inside 10/12-18; the nearest is MSFT on 10-27. (2) NO GOVERNANCE CLOCK: the 16th General Review of Quotas moved no voting shares and the 17th is pushed to 2028, so the IMFC plenary (10/17) is a posture read on the US 'mission creep' agenda (Bessent, April 2025), not an event with a timeline. (3) THE WEO/GFSR LAUNCH DATE IS STILL DELIBERATELY NOT FILED: meetings.imf.org's own meetings index carries no 2026-annual entry at all, worldbank.org lists no press events, and imfconnect's tentative-schedule PDF did not resolve; the customary Tuesday-of-week pattern implies 2026-10-13, one day before cpi-2026-10-14, but that is a pattern inference and filing it under an EST: prefix would put a guess into the audit trail. imf.org itself returned HTTP 403 to every fetch including curl with a full browser header set — unlike g20.org, it is not a solved fetch; the dates rest on worldbank.org, imfconnect.org and the World Bank mirror of PR 23/122, which also supplies the two-years-DC-then-away rotation rule and that Bangkok last hosted in 1991. Ledger: docs/research/events/imf-world-bank-annual-meetings-2026-10-12.md.",
  },
  {
    id: "beige-book-2026-10-14",
    kind: "macro-print",
    title: "Fed Beige Book (pre-FOMC edition)",
    date: "2026-10-14",
    status: "confirmed",
    source:
      "FED: two independent federalreserve.gov primaries fetched direct 2026-08-31 — newsevents/2026-october.htm lists 'Beige Book' at 2:00 p.m. on October 14, and the Board's Beige Book schedule page (monetarypolicy/publications/beige-book-default.htm) lists Oct 14 as the seventh of eight 2026 editions (Jan 14, Mar 4, Apr 15, Jun 3, Jul 15, Sep 2, Oct 14, Nov 25). Promoted estimate -> confirmed 2026-08-31 by its own initial-research session, which held both primaries itself; the no-self-confirm limit binds the proposing sweep, not the researching session, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "THE LAST THING THE FED ITSELF PUBLISHES BEFORE THE 10-17 BLACKOUT, and it lands 14:00 ET on CPI day (cpi-2026-10-14, 08:30 ET) — but its own initial research found the session ranking is NOT a tie: CPI is confirmed/high at 08:30 and this is a qualitative 14:00 report with no consensus number, so 10-14 is a CPI session with a Beige Book in it. THE CUTOFF IS THE OTHER HALF: every edition states a collection cutoff ~9 days before release (July 2026 edition collected on or before Jul 6; Oct 2025 edition on or before Oct 6), so this one closes its books ~10-05 and cannot contain one word about the CPI printing that same morning. It is a Fed publication rather than Fed speech, so unlike a governor speech it is unaffected by Warsh's move to a quieter Fed. In the lapse branch it gains weight rather than losing it: the Fed is self-funded and PUBLISHED THE OCT-2025 BEIGE BOOK ON SCHEDULE 2025-10-15 DURING the Oct 1-Nov 12 2025 shutdown, while BLS deleted the October 2025 CPI outright — so a 10-01 lapse could leave this district-anecdote read as the only fresh federal evidence the 10-28 FOMC sees (calibrated down: the 2025 edition yielded exactly one shutdown line). Read the twelve District reports, not the national summary — Boston Fed CPP 2025-11-06 and Cleveland Fed EC 2024-08 both locate the forecasting content in District dispersion. Same series as beige-book-2026-09-02; one entry per edition. Discovered during the fomc-blackout-start-2026-10-17 initial research.",
  },
  {
    id: "cpi-2026-10-14",
    kind: "macro-print",
    title: "CPI release (Sep 2026 data)",
    date: "2026-10-14",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "ssa-cola-2027-2026-10-14",
    kind: "macro-print",
    title: "SSA announces the 2027 Social Security COLA (from Q3 CPI-W)",
    date: "2026-10-14",
    status: "estimate",
    source:
      'NEWS: Yahoo Finance 2026-08-04 states verbatim "the SSA will announce the 2027 Social Security COLA on Oct. 14, based on third-quarter CPI-W inflation data"; The Senior Citizens League 2026-08-12 independently repeats "October 14th, 2026" alongside its 3.6% projection — press-reported, ssa.gov not primary-verified, and this lane proposes a discovered adjacency as estimate rather than self-confirming it. Re-checked 2026-09-04 by this event\'s own initial-research session: ssa.gov returned HTTP 403 on /cola/, /oact/cola/cpiw.html and /blog/en/, so the upgrade to confirmed still has no primary SSA statement to rest on — BLS\'s CPI schedule confirms the INPUT date, not the announcement; checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "Not an independent release: the COLA is arithmetic on the Q3 CPI-W average (Jul/Aug/Sep vs the year-ago quarter), so it is computed FROM cpi-2026-10-14's own data and lands the same morning. Filed low impact for that reason — it moves no rate expectation (the Fed keys on core CPI/PCE, not CPI-W) and adds no surprise the CPI print does not already carry. It is registered because it gives that print a property no other CPI on this calendar has: a STATUTORY tether. In the 2025 lapse BLS recalled furloughed staff to publish the September CPI on 2025-10-24 (delayed from 10-15) precisely so SSA could meet its benefit-payment deadline — BLS's own statement, 'This release allows the Social Security Administration to meet statutory deadlines.' That is why a FY2027 funding lapse (government-funding-deadline-2026-09-30) would DELAY the 10-14 CPI rather than delete it, unlike jobs-2026-10-02. Discovered during the cpi-2026-10-14 D-44 pulse; TSCL projected 3.6% on 2026-08-12 off a July CPI-W of 3.4%. AMENDED 2026-09-04 by this event's initial research: that tether is SPENT for this cycle — H.R. 6500 was signed 2026-09-02 as PL 119-103, funding agencies through 2026-12-11, so the 10-01 cliff is gone and nothing is left to insure against before 10-14 (the December CPI prints 12-10, the day before the next cliff). Same session recomputed the COLA off BLS index levels: it is the index-weighted average of the three Q3 CPI-W y/y rates, July 2026 is locked at exactly +3.400%, so 3.6% requires Aug and Sep y/y at ~3.70% — base case 3.4%, upside 3.5%.",
  },
  {
    id: "g20-fmcbg-bangkok-2026-10-15",
    kind: "geopolitical",
    title:
      "G20 Finance Ministers and Central Bank Governors — Bangkok (US presidency, 3rd meeting)",
    date: "2026-10-15",
    status: "estimate",
    source:
      'EST: THREE INDEPENDENT PRIMARIES AGREE (upgraded by this event\'s own initial research, 2026-09-04). (1) g20.org/events-calendar/ - the host government\'s own calendar - lists "Finance Ministers and Central Bank Governors Meeting (Bangkok, Thailand) / October 15, 2026" and adds "On the margins of the 2026 Annual Meetings of the International Monetary Fund and the World Bank Group." Fetched direct at HTTP 200 with a full browser header set (UA + Accept + Accept-Language + Accept-Encoding), where every prior sibling recorded 403 from a plain fetcher - that fetch is now solved, not blocked. (2) treasury.gov press release sb0398 (2026-02-19, "Secretary Bessent Announces 2026 G20 Finance Track Agenda") lists verbatim "October 15 (Bangkok, Thailand): Finance ministers and central bank governors meeting" as the fourth and last entry of the US host year. (3) worldbank.org\'s 2026 Annual Meetings page states the meetings run "from Monday, October 12 to Sunday, October 18 in Bangkok, Thailand", with the Development Committee on October 15, the plenary on October 16 and the IMFC plenary on October 17. STAYS ESTIMATE ON A SCHEMA GAP, NOT ON DOUBT: CONFIRMED_PREFIX documents TSY: as a treasury.gov AUCTION schedule and has no slot for a diplomatic calendar of any kind, so even a host-secretariat primary cannot be cited as confirmed - the same gap us-china-tariff-truce-expiry-2026-11-10, china-retaliation-suspension-expiry-2026-12-31 and g20-miami-2026-12-14 each record. Checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "The last finance-track checkpoint before the 12-14 Miami leaders' summit, and the venue where a US-China finance-level signal would surface first. Filed LOW deliberately: the finance track has no measured price channel, and its most recent meeting demonstrated why it is a read rather than a trade — the chair's statement from Asheville (2026-08-31/09-01, treasury.gov sb0620) was agreed by all members present EXCEPT China, which objected to paragraphs 4, 10, 11 and 13 (energy-trade disruption and supply chains, global imbalances and macro-policy coordination, the sovereign-debt architecture). Read it for whether that dissent widens or closes ahead of Miami. Lands one day after cpi-2026-10-14 and the day before opex-2026-10-16 and treasury-primary-dealer-agenda-2026-10-16, so attribution off this date is near-impossible. Discovered during the g20-miami-2026-12-14 initial research (2026-09-04). ITS OWN INITIAL RESEARCH (2026-09-04) MEASURED THE 'NO PRICE CHANNEL' CLAIM instead of asserting it: Asheville was the maximally newsworthy version of this event type — no communique agreed, China dissenting in public — and the tape shrugged, SPX 7,711.76 (08-28) -> 7,686.14 -> 7,631.47 (09-01, -0.71%) -> 7,666.60 -> 7,747.71 (09-03, a high), net +0.47%, VIX 14.43 -> 16.34 -> 14.32, the pop fully retraced in two sessions; and 09-01 also carried ISM manufacturing, so even that one down day is not cleanly the G20's. The only counter-case in the modern era, the 2016 'Shanghai Accord', contains no accord in the communique — Reuters found 'few if any major investment houses believe that there was a formal accord' while markets were 'happy to play as if there was'. Two structural discounts on the venue: the officials who own the live 2026-11-10 expiries sit in MOFCOM (Announcement No. 70) and the Vice Premier's office (the Bessent-He Lifeng truce channel), not in an FMCBG; and the Bangkok business day (09:00-18:00 ICT, UTC+7) maps to 22:00 ET Wednesday through 07:00 ET Thursday, so the meeting is over before the US cash open and before the 08:30 ET PPI + advance-retail-sales double print on the same date. Ledger: docs/research/events/g20-fmcbg-bangkok-2026-10-15.md.",
  },
  {
    id: "ppi-2026-10-15",
    kind: "macro-print",
    title: "PPI release (Sep 2026 data)",
    date: "2026-10-15",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/ppi.htm — 08:30 ET, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "The CPI/PPI whipsaw pair the calendar already tracks for 09-10/09-11, but REVERSED — here PPI lands the morning AFTER CPI, so it scores the CPI reaction rather than setting up for it, and both land inside the two-week run-up to the 10-28 FOMC. Discovered during the cpi-2026-10-14 pulse-check adjacency sweep, read off the BLS PPI schedule page directly. Filed `confirmed` rather than the adjacency sweep's usual `estimate` because the date came from the BLS primary schedule, which is exactly what the `BLS:` prefix means and what `--validate` requires of it (the same page seeded ppi-2026-09-10).",
  },
  {
    id: "retail-sales-2026-10-15",
    kind: "macro-print",
    title: "Retail Sales — advance monthly (Sep 2026)",
    date: "2026-10-15",
    status: "confirmed",
    source:
      'CENSUS: census.gov/retail/release_schedule.html lists the Advance Monthly Retail Trade Report for September 2026 data on "September 16, 2026" -> next entry "October 15, 2026", 08:30 ET, fetched direct 2026-09-01',
    impact: "high",
    symbols: [],
    notes:
      "The successor print, and the one that publishes the REVISION to the 09-16 advance estimate — which retail-sales-2026-09-16's own honest-limits section says any 'surprise' framing must net against, and which the calendar could not point at because no retail-sales entry existed beyond 09-16. Also the first clean read after August's record pump prices (AAA: most expensive August on record, above $4/gal every day) wash out of the headline; the series is seasonally adjusted but explicitly NOT price-adjusted, per Census Table 1's own footnote. Discovered during the retail-sales-2026-09-16 pulse-check adjacency sweep. Filed `confirmed` rather than the sweep's usual `estimate` because the date came from the Census primary release schedule — the same page and `CENSUS:` prefix that seeded the 09-16 entry (cf. the ppi-2026-10-15 precedent, 2026-08-31).",
  },
  {
    id: "treasury-buyback-10y20y-2026-10-15",
    kind: "rates",
    title: "Treasury liquidity-support buyback operation (10-20Y nominal, 1:40pm ET)",
    date: "2026-10-15",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (August 2026 refunding, published 2026-08-05), PDF text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 125,547 bytes) — the row reads verbatim announce 10/14/2026, operation 10/15/2026 1:40 pm - 2:00 pm, settle 10/16/2026, Liquidity Support, Nominal Coupons 10Y to 20Y, maturity range 10/16/2036 - 10/15/2046, min $0, max $2 billion. Stays estimate on three counts: a tentative schedule is tentative by construction, its $2B cap is SUPERSEDED (see notes), and the confirming primary is the 10-14 operation announcement rather than this document, checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "THE PUBLISHED CAP ON THIS ROW IS STALE AND SHOULD NOT BE QUOTED. Press release sb0607 (2026-08-19, fetched direct 2026-09-05) states verbatim that Treasury is 'increasing, by at least double, the size of liquidity support buyback operations for longer-dated nominal coupon securities (the 10-year to 20-year sector and the 20-year to 30-year sector). The current maximum size of $2 billion per operation will be at least $4 billion per operation. This change is effective September 9, 2026 and will be in effect for the remainder of this refunding quarter (through November 4, 2026).' The buyback schedule PDF fetched 2026-09-05 was byte-identical in size to the 09-03 fetch recorded by treasury-buyback-10y20y-2026-09-10 — i.e. unrevised — and still carries $2B for every post-09-09 10-20Y and 20-30Y row including this one; sb0607 itself says 'An updated tentative Treasury buyback schedule will be released at a later date.' So the operative cap here is at least $4B, and anyone reading the schedule alone gets a superseded number. Why it earns a slot: it shares its date with treasury-coupon-announcement-2026-10-15 (~11:00 ET) plus ppi-2026-10-15 and retail-sales-2026-10-15 at 08:30, which is what makes that announcement's own tape effect unmeasurable, and it is one of the last operations under the doubled regime before the 11-04 refunding resets it. Read-it-do-not-trade-it: `symbols: []`, no house playbook is macro-keyed, and a $0-4B liquidity-support operation is a demand-side mechanic, not a price signal. Discovered during the treasury-coupon-announcement-2026-10-15 initial-research adjacency sweep (2026-09-05); the 10-21 TIPS 1Y-10Y and 10-27 20-30Y operations on the same schedule sit outside that event's corridor and are deliberately NOT filed here.",
  },
  {
    id: "treasury-coupon-announcement-2026-10-15",
    kind: "rates",
    title: "Treasury coupon announcement (20Y reopening + 5Y TIPS new-issue sizes)",
    date: "2026-10-15",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — TWO rows announce that day, corrected by this event's own initial research from the single 20Y row this entry originally recorded: `20-Year BOND R` with announcement Thursday, October 15, 2026, auction Wednesday, October 21, 2026, settlement Friday, October 23, 2026 (the trailing R is Treasury's own reopening marker), and `5-Year TIPS T` with the same announcement date, auction Thursday, October 22, 2026, settlement Friday, October 30, 2026 (the T is the TIPS marker and the absence of an R makes it a NEW ISSUE — corroborated by fiscaldata, where the October 5-Year TIPS slot has been a new issue in all seven years it has existed, 2019-2025, with the reopening landing each December). Corroborated on both sizes by press release sb0590 (2026-08-05 quarterly refunding statement, fetched direct the same session): its anticipated-auction-size table carries an Oct-26 row reading 69 58 70 44 39 13 22 30 across the 2Y/3Y/5Y/7Y/10Y/20Y/30Y/FRN headers — i.e. the 20-Year at $13 billion — and its TIPS FINANCING paragraph reads verbatim 'the October 5-year TIPS new issue auction size at $26 billion'. NOTE the FRN column reads 30, not the 28 this entry and the 09-10 sibling both originally transcribed (the third month of each refunding quarter carries the FRN new issue at $30B against $28B reopenings, visible in the table's own Jul-26 row); the 20-Year figure is unaffected. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep. The ~11:00 ET slot is Treasury's standing coupon-announcement convention and is NOT separately sourced",
    impact: "medium",
    symbols: [],
    notes:
      "The successor to treasury-coupon-announcement-2026-09-10, and the LAST coupon announcement whose size the current published guidance covers — which is the whole reason it earns a slot. sb0590's anticipated-size table stops at Oct-26 and its TIPS paragraph covers only the August-to-October quarter, so 10-15 is the final announcement that can be read off a document rather than forecast; the 2026-11-04 refunding sets whatever follows, and the 2026-11-12 announcement (20-Year BOND new issue, per the same tentative schedule) is the first in this cycle whose size no current Treasury primary publishes. That expiry is the point: the 09-10 initial research found announcements are scheduled nil ONLY while the guidance holds, so the dates worth tracking are the guidance's own edges. This entry is also the dated home for forward test FT-treasury-coupon-announcement-2026-09-10-1, which predicts the 20Y reopening prints $13B here and scores 2026-10-16 — the same gap the 09-03 and 09-10 entries were created to close, where a rates ledger named a date it was waiting on with no calendar row to attach it to. Base rate at filing, from fiscaldata auctions_query: the 20Y grid has run $16B new issue / $13B reopening for 37 consecutive auctions since 2023-08-23, zero deviations. Session context is crowded but not by this: CPI lands 10-14, PPI and retail sales the same morning as this announcement, and the FOMC blackout opens 10-17. Discovered during the treasury-coupon-announcement-2026-09-10 initial-research adjacency sweep (2026-09-05). ITS OWN INITIAL RESEARCH (2026-09-05) FOUND THE SECOND SECURITY AND RE-WEIGHTED THE EVENT: the 5-Year TIPS new issue above shares this announcement, which no doc in this calendar had noticed, and the two legs are NOT symmetric. The 20Y leg is a document agreeing with a 37-consecutive-auction base rate, so it carries no information and is already owned by FT-treasury-coupon-announcement-2026-09-10-1 (deliberately not re-registered). The 5Y TIPS leg is the opposite: that October slot has risen five straight years (2019 $17B, 2020 $17B, 2021 $19B, 2022 $21B, 2023 $22B, 2024 $24B, 2025 $26B, all fiscaldata) and sb0590 guides it FLAT at $26B — the first place in the coupon complex where written guidance contradicts a live run-rate, corroborated by the July 10Y TIPS new issue also holding flat at $21B in 2026. That leg is registered as FT-treasury-coupon-announcement-2026-10-15-1, scoreable 2026-10-16. Ledger: docs/research/events/treasury-coupon-announcement-2026-10-15.md.",
  },
  {
    id: "import-export-prices-2026-10-16",
    kind: "macro-print",
    title: "U.S. Import and Export Price Indexes (Sep 2026 data)",
    date: "2026-10-16",
    status: "confirmed",
    source:
      'BLS: bls.gov/schedule/news_release/ximpim.htm ("September 2026 | Oct. 16, 2026 | 08:30 AM") + bls.gov/schedule/2026/10_sched.htm (U.S. Import and Export Price Indexes / September 2026 / 08:30 AM on Friday the 16th) — two independent primary views, both fetched direct 2026-08-31 (the pages 403 to browser headers alone and need Referer: bls.gov/ with Sec-Fetch-Site: same-origin)',
    impact: "low",
    symbols: [],
    notes:
      "THE LAST CLEAN 12-MONTH READ in this series before the base-month hole (BLS permanently suppressed 864 of 1,625 indexes for the October 2025 reference month; this print's Sep-2025 base exists, import-export-prices-2026-11-17's does not). Filed estimate on 2026-08-31 by the sibling sweep that discovered it; promoted to confirmed the same day by its own initial-research session with both BLS primaries in hand. THE Y/Y RISES EVEN IF PASS-THROUGH STOPS: the nonfuel base declines across the comparison (EIUIREXFUELS Jul-2025 130.0 -> Aug 129.8 -> Sep 129.8), so a flat Aug-Sep 2026 still prints +4.62% against July's published +4.46%. The m/m is the evidence; the y/y is partly artifact. A 10-01 LAPSE DELAYS THIS PRINT, IT DOES NOT DELETE IT - the collection window sets destroy-vs-delay, and BLS's MXP notice says September 2025 data was collected on schedule and merely delayed 47 days (Oct 17 -> Dec 3), unlike the October reference month which was cancelled. Lands 08:30 ET on monthly opex (opex-2026-10-16), the morning after ppi-2026-10-15, and is the last BLS price release the 10-28 FOMC sees (pce-2026-10-29 publishes after the statement) and the last before the blackout begins 10-17 - none of which is a transmission channel, so the low tier is correct and was re-checked, not assumed: these indexes deflate GDP net trade, not PCE.",
  },
  {
    id: "opex-2026-10-16",
    kind: "opex",
    title: "Monthly options expiration (October)",
    date: "2026-10-16",
    status: "confirmed",
    source: "OCC: theocc.com expiration calendar — 3rd-Friday standard, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Standard monthly expiration.",
  },
  {
    id: "treasury-primary-dealer-agenda-2026-10-16",
    kind: "macro-print",
    title: "Treasury Primary Dealer Meeting Agenda (Q4 2026 refunding)",
    date: "2026-10-16",
    status: "confirmed",
    source:
      "TSY: home.treasury.gov most-recent-quarterly-refunding-documents shows the Primary Dealer Meeting Agenda released at 12:00 PM Friday, July 17, 2026 and states '(The next release is scheduled for October 16, 2026)' — fetched direct via plain curl (HTTP 200) 2026-08-31. Promoted from estimate by this event's own initial research on that primary, which also derived and validated the release rule on all 15 editions since 2023: the agenda drops the Friday 19 days before the refunding Wednesday, and 2026-11-04 minus 19 is 2026-10-16, checked 2026-08-31",
    impact: "low",
    symbols: [],
    notes:
      "READ IT, DO NOT TRADE IT — and the 'earliest public tell on issuance policy ... the leading indicator' framing this note used to carry is CORRECTED BY THIS EVENT'S OWN INITIAL RESEARCH (2026-08-31): the agenda CONFIRMS issuance changes Treasury has already put in a prior refunding statement, and has never yet front-run one. Exactly 1 of the 15 agendas since 2023 names a coupon-size increase (2023-07-14, ahead of the one refunding that actually raised sizes) and it opens by quoting the May 2023 statement that had already pre-announced it; the 2025-10-17 agenda, 19 days before the 2025-11-05 statement that added 'begun to preliminarily consider future increases' (TLT -1.09%), asked only about forecasts, the 20-year settlement period and SOMA. So: confirming 1/1, early-warning 0/1. Release day is NIL on this event's own measurement (all 15 releases, dates derived from the W-19 rule): TLT 7/15 up at -0.027% (permutation p=0.907) vs an unconditional 50.1%/-0.003%, SPY 8/15 at +0.176% (p=0.473) vs 56.7%/+0.086%, flat placebos either side, and every outsized session owned by a named non-agenda event. Attribution is impossible anyway - 10-16 is a monthly-opex Friday sharing the date with import-export-prices-2026-10-16, one day after ppi-2026-10-15 and two after cpi-2026-10-14. Read it for exactly one thing: whether the Discussion Topics name an INCREASE in nominal coupon auction sizes, which would make FT-39 live 19 days before the 11-04 statement. Same rule fixes the rest of the chain: dealer responses due Mon 10-26, Treasury/dealer meetings Thu-Fri 10-29/10-30, treasury-borrowing-estimates-2026-11-02 (confirmed), treasury-refunding-2026-11-04 (est). Discovered during the treasury-borrowing-estimates-2026-11-02 initial research; date flipped estimate -> confirmed by its own initial research 2026-08-31.",
  },
  {
    id: "fomc-blackout-start-2026-10-17",
    kind: "macro-print",
    title: "FOMC communications blackout begins (through 2026-10-29)",
    date: "2026-10-17",
    status: "confirmed",
    source:
      "FED: federalreserve.gov/monetarypolicy/files/fomc-blackout-period-calendar.pdf ('2025-2027 FOMC Trading and External Communications Blackout Calendar') re-fetched and its text layer decompressed direct 2026-08-31 — the footnote states the rule verbatim: blackouts 'begin at 12:00 a.m. Eastern Time the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting', with a worked example for a Tuesday-start/Wednesday-end meeting. The Oct 27-28 meeting is exactly that shape and is confirmed on the FOMC calendar (re-fetched 2026-08-31), so the source's own example gives start 2026-10-17 and end 2026-10-29, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "Not a print — a gate on who may speak. The gate falls at midnight ET entering Saturday 10-17, which makes Friday 10-16 the last morning on which official interpretation and new price data can meet: CPI 10-14, PPI 10-15 and import-export-prices-2026-10-16 all land in the final 72 hours before it, and monthly opex is the same session. INVERSE OF THE SEPTEMBER WINDOW: fomc-blackout-start-2026-09-05 trapped PPI and CPI INSIDE the gate; here every top-tier print lands BEFORE it, so the corridor 10-19 -> 10-26 carries no tracked event at all and the risk sits at the two edges. Promoted estimate -> confirmed 2026-08-31 by its own initial-research session, which re-fetched the blackout PDF the proposing sweep could not. Discovered during the import-export-prices-2026-10-16 initial research.",
  },
  {
    id: "ecb-quiet-period-start-2026-10-21",
    kind: "macro-print",
    title: "ECB quiet period begins (through the 2026-10-29 decision)",
    date: "2026-10-21",
    status: "estimate",
    source:
      "EST: ecb.europa.eu 'Guiding principles for external communication for high-level officials of the ECB' (ecb/our-values/transparency/html/eb-communications-guidelines), fetched direct 2026-09-05 — the BINDING text behind the explainer, stating that speeches and public remarks 'given in the seven days prior to each scheduled monetary policy meeting of the Governing Council, should not be such as to influence expectations about forthcoming monetary policy decisions', and that members 'will not meet with nor talk to the media, market participants or other outside interests on monetary policy matters during that period'. Applied to the 28-29 October 2026 meeting (ecb.europa.eu press/calendars/mgcgc, re-fetched 2026-09-05: 'Frankfurt (Day 1)' 28/10/2026), the seven days prior to the MEETING give 2026-10-21 -> 10-27. SOURCE UPGRADED 2026-09-05 by this event's own initial research, which replaced the explainer with the guiding principles and thereby CLOSED the Day-1-vs-decision-day ambiguity this line previously recorded: the rule's unit is the meeting, so Day 1 (28/10) is the anchor, not the decision day. Stays estimate on two remaining counts: the ECB publishes NO dated quiet-period calendar (unlike the Fed's blackout PDF, which is why fomc-blackout-start-* entries carry FED:), and CONFIRMED_PREFIX has no slot for a non-Fed central bank. Checked 2026-09-05",
    impact: "low",
    symbols: [],
    notes:
      "The ECB analogue of the fomc-blackout-start-* entries this calendar already tracks, and it exists to date the CLOSE of one specific window rather than to be watched on its own. Discovered during the ecb-account-2026-10-08 initial research (2026-09-05), whose leg 5 needed it: the account of the 09-09/10 meeting publishes 2026-10-08, and the honest reason that account is NOT the best pre-decision evidence is that 13 days of unrestricted Governing Council speech follow it before this gate falls. So the pair 10-08 -> 10-21 is the interval in which anything the account says can be superseded on the record by a live speaker. NO PRICE CHANNEL AND NONE CLAIMED: symbols: [], no house playbook is rates-keyed, and the parent ledger measures the far more prominent ECB events (13 accounts, 13 decisions, 2025-26) at 0.97x-1.17x an ordinary day for the Euro Stoxx 50, the DAX and EUR/USD alike — a speech gate on a bank whose DECISIONS do not reliably move these instruments at daily resolution is a calendar landmark, not a catalyst. Its one asymmetry worth a line: a quiet period removes the offset, so a euro-area surprise landing inside 10-21 -> 10-29 meets no official interpretation, the same edge-risk framing fomc-blackout-start-2026-10-17 uses four days earlier. AMENDED 2026-09-05 by this event's own initial research (docs/research/events/ecb-quiet-period-start-2026-10-21.md); date, status and impact UNCHANGED, THREE FRAMINGS CORRECTED. (1) 'The ECB analogue of the fomc-blackout-start-* entries' overstates it: the guiding principles gate comment 'on monetary policy matters', NOT public appearances, and the ECB's own weekly speaking calendar lists Chief Economist Philip Lane giving a keynote on 2026-09-04, day three of the quiet period running for the 09-09/10 meeting. The gate is topic-scoped; the diary keeps running. (2) THE ASYMMETRY ABOVE IS REFUTED BY MEASUREMENT, not merely unproven: across the 13 scheduled meetings since 2025 (Day-1 dates verbatim from the ECB's 2025/2026 accounts indexes, Yahoo adjusted bars, cache busted), the seven days before Day 1 ran mean close-to-close |ret| of 0.73% vs a 0.75% all-days baseline on the Euro Stoxx 50 (0.97x, n=64) and 0.80% vs 0.81% on the DAX (0.99x); trimming the two largest windows gives 0.69x/0.68x, with 0 of 54 trimmed Euro Stoxx 50 sessions reaching 2x baseline against 10.9% of ordinary days — a THINNER tail, not a fatter one, and the two big windows were exogenous shocks (the April-2025 tariff tape and one unattributed 2025-Q1 window). The US side is likewise null: S&P 500 0.83x, VIX 0.89x trimmed. Registered as FT-ecb-quiet-period-start-2026-10-21-1. Counterweight kept: Gnan & Rieder (JIMF 130, 102744, confidential data 2008-2021) find blackout breaches happen regularly and move markets up to 2x the median inter-meeting speech reaction — INTRADAY, which a daily-close measurement cannot see. (3) The surviving asymmetry is narrow and dated: the euro area bank lending survey publishes 27/10/2026 10:00 CET, INSIDE the gate on its last day, filed as ecb-bank-lending-survey-2026-10-27 in the same PR — the gate stops speech, not publication. Practical output: with fomc-blackout-start-2026-10-17 running 10-17 -> 10-29, 2026-10-20 is Q4's last session on which either the Fed or the ECB may speak freely (the December pair overlaps only 12-09 -> 12-10). Ledger: docs/research/events/ecb-quiet-period-start-2026-10-21.md.",
  },
  {
    id: "treasury-20y-bond-2026-10-21",
    kind: "rates",
    title: "20-Year Treasury Bond auction (reopening)",
    date: "2026-10-21",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — row reads verbatim `20-Year BOND R / Announcement Thursday, October 15, 2026 / Auction Wednesday, October 21, 2026 / Settlement Friday, October 23, 2026`, 1:00pm ET by Treasury's standing coupon-auction convention (the time is NOT separately sourced). Size corroborated in advance by press release sb0590 (2026-08-05), whose Oct-26 anticipated-size row puts the 20-Year at $13 billion. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep — the confirming primary is the 2026-10-15 announcement itself. NOTE this diverges from the sibling entries treasury-20y-bond-2026-09-15 and treasury-10y-tips-2026-09-17, which are filed `confirmed`/`TSY:` off the same document; the divergence is deliberate and named rather than silently inherited",
    impact: "medium",
    symbols: [],
    notes:
      "The second reopening of CUSIP 912810UX4, sold as a new issue 2026-08-19 at $16B (high yield 5.204%, bid-to-cover 2.53, fiscaldata) and first reopened 09-15 — the standard three-month 20Y cycle, confirmed on the predecessor 912810UV8 (new 2026-05-20 $16B, reopened 06-16 and 07-22 at $13B each). ITS SUPPLY LEG IS SETTLED BEFORE IT OPENS, which is the point: $13B is published in sb0590 and gets restated on 10-15, so a soft sale here is evidence about DEMAND or policy, never about issuance. Two structural notes. It sells inside the doubled long-end buyback regime — sb0607 (2026-08-19) raised 10-20Y and 20-30Y liquidity-support caps from $2B to at least $4B per operation, in force through the 11-04 refunding — and it sells four sessions after the FOMC blackout opens 10-17 and a week before fomc-2026-10-28, so unlike its 09-15 sibling (which sold the day before an FOMC and is tiered `high` for it) it carries no next-day policy compound; `medium` is deliberate on that difference. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Discovered during the treasury-coupon-announcement-2026-10-15 initial-research adjacency sweep (2026-09-05), which found this sale had no calendar row despite the announcement that sizes it having one.",
  },
  {
    id: "treasury-5y-tips-2026-10-22",
    kind: "rates",
    title: "5-Year TIPS auction (new issue)",
    date: "2026-10-22",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — row reads verbatim `5-Year TIPS T / Announcement Thursday, October 15, 2026 / Auction Thursday, October 22, 2026 / Settlement Friday, October 30, 2026`, 1:00pm ET by Treasury's standing coupon-auction convention (the time is NOT separately sourced). The T is Treasury's TIPS marker and the ABSENCE of an R makes this a new issue, corroborated independently on fiscaldata, where the October 5-Year TIPS slot has been a new issue in all seven years it has existed (2019-2025) with the reopening landing each December. Size corroborated in advance by press release sb0590 (2026-08-05), whose TIPS FINANCING paragraph reads verbatim 'the October 5-year TIPS new issue auction size at $26 billion'. Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep",
    impact: "medium",
    symbols: [],
    notes:
      "THE LEG THIS CALENDAR HAD MISSED ENTIRELY — no doc had noticed a 5-Year TIPS new issue shares the 10-15 announcement, because that event's title named only the 20Y. It is also the more informative of the two sizes: the October 5Y TIPS slot has risen FIVE STRAIGHT YEARS (2019 $17B, 2020 $17B flat, 2021 $19B, 2022 $21B, 2023 $22B, 2024 $24B, 2025 $26B — all fiscaldata via inflation_index_security) and sb0590 guides it FLAT at $26B, so this is the one place in the coupon complex where written guidance contradicts a live run-rate. Corroborating a complex-wide halt rather than a one-off: the July 10Y TIPS new issue also held flat at $21B in 2026 after rising every year from 2021. Forward test FT-treasury-coupon-announcement-2026-10-15-1 predicts the $26B print and scores 2026-10-16, so this auction is the confirmation, not the test. Base rate for the reopening that follows in December, if wanted: TIPS reopenings print a tenor-specific constant below their own CUSIP's new issue — $2B at 5Y (15/16 since 2019; the one exception a $25M off-cycle add-on to 912828ZJ2 on 2020-07-10, i.e. 15/15 on scheduled reopenings) and 10Y, but $1B at 30Y, so the widely-quoted '$2B below' is NOT a universal TIPS rule. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook is rates-keyed; the breakeven reaction reads inflation expectations at the five-year point (5Y breakeven ~2.37% on 09-04, up 11bp over five weeks, 2026 range 2.16-2.72). Sells six sessions before fomc-2026-10-28 and five days after the blackout opens. Discovered during the treasury-coupon-announcement-2026-10-15 initial-research adjacency sweep (2026-09-05).",
  },
  {
    id: "treasury-2y-note-2026-10-26",
    kind: "rates",
    title: "2-Year Treasury Note auction (new issue)",
    date: "2026-10-26",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — row reads verbatim `2-Year NOTE / Announcement Thursday, October 22, 2026 / Auction Monday, October 26, 2026 / Settlement Monday, November 02, 2026`, 1:00pm ET by Treasury's standing coupon-auction convention (the time is NOT separately sourced). The absence of an R makes it a new issue; the 2Y has not been reopened on the tracked record, though ONE row (2026-01-26) carries `reopening: Yes` on fiscaldata with internally inconsistent metadata on Treasury's own results release (R_20260126_3.pdf: `Original CUSIP 91282CPV7`, `Original Issue Date January 31, 2023`, `Maturity January 31, 2028` — a five-year profile), read as a metadata defect rather than a policy fact, checked 2026-09-05. STAYS ESTIMATE, and the reason is now a consistency call rather than the no-self-confirm rule, which an independent session discharges: a tentative schedule is tentative by construction and this sale is 47 days from its own announcement, where the same-day October siblings off this identical PDF (treasury-20y-bond-2026-10-21, treasury-5y-tips-2026-10-22) both chose estimate. The confirming primary is the 2026-10-22 announcement itself",
    impact: "medium",
    symbols: [],
    notes:
      "The front-end auction that sells TWO SESSIONS BEFORE fomc-2026-10-28, inside the blackout that opens 10-17. The 2Y is the tenor that actually carries policy-rate risk: on 2026-09-04 it moved +8bp to an intraday 4.416%, the highest since January 2025, on a payroll beat, while the 20Y moved 0bp. SIZE CAUTION DISCHARGED 2026-09-05 by this event's own initial research: sb0590 (2026-08-05) was read as text direct, its anticipated-size header is `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN` and the Oct-26 row is `69 58 70 44 39 13 22 30`, so the 2-Year is COLUMN 1 and the FRN column 8 — the FRN-column transcription error cannot reach the $69B figure, which the release also guides flat ('Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters') and 29 consecutive $69B auctions corroborate. THE MEASURED FINDING THAT EARNS THIS ROW ITS LEDGER: the 2Y auction session is a real front-end event this calendar had never measured — across all 44 nominal 2Y auctions since 2023-01 against 920 par-curve sessions, the 2Y CMT closes -4.70bp on auction days (t=-4.60) vs 0.00bp all-session, and -6.07bp away from FOMC weeks (t=-4.91, n=27) vs +0.19bp on 579 comparable non-auction sessions; confined to D+0, surviving weekday/month-position/outlier/split-half controls, and TENOR-SPECIFIC (10Y only -0.95bp, so 2Y-minus-10Y prints -3.75bp at t=-6.47). That is the OPPOSITE of treasury-20y-bond-2026-10-21's measured result, where auction days are quieter than ordinary and bid-to-cover has no significant price link; here bid-to-cover does link (corr -0.388, t=-2.73). AND THIS SALE IS THE EXCEPTION SLOT: all seven prior pre-FOMC 2Y auctions sold at exactly D-2 and averaged -2.43bp (median -1bp, four of seven at 0 or -1), because FOMC-eve pins the front end generally (D-2 non-auction sessions run mean |move| 2.86bp vs 4.55bp) and not because demand is worse (b/c 2.673 pre vs 2.661 far). Stated as unproven: n=7, permutation p=0.167. Practical output is a reading instruction, not a trade — a flat 2Y on 10-26 is the expected tape, not a failed sale. GRADE THE PRINT ON DEALER TAKEDOWN, NOT INDIRECT SHARE: indirect and direct are near-perfect substitutes (corr -0.866, t=-11.23) so their sum is half as noisy and ROSE 85.5%->88.2% across the same 2025-04 break where indirect fell 66.4%->58.1%; dealer takedown is the only bucket that is not a reclassification, 2025-04+ p25 10.2 / median 11.2 / p75 12.3. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Discovered during the treasury-20y-bond-2026-10-21 initial-research adjacency sweep (2026-09-05), which found it five days after that auction and unlisted; the 5Y 10-27 and 7Y 10-29 rows of the same schedule were outside THAT sweep's corridor and are added by this event's own sweep, inside which they sit at D+1 and D+3. Ledger: docs/research/events/treasury-2y-note-2026-10-26.md.",
  },
  {
    id: "consumer-confidence-2026-10-27",
    kind: "macro-print",
    title: "Conference Board Consumer Confidence Index (Oct 2026)",
    date: "2026-10-27",
    status: "estimate",
    source:
      "EST: the Conference Board's own page states it publishes at 10:00 ET on the last Tuesday of every month (fetched 2026-08-29, where it names 09-29 explicitly but not October); 2026-10-27 is that Tuesday — cadence-derived, not a fetched primary line for this date, checked 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "Matters disproportionately in one branch: the Conference Board is a PRIVATE publisher and survives a lapse in federal appropriations, where BLS does not. If FY2027 funding lapses on 2026-09-30, the 10-02 payrolls and 10-14 CPI are deleted permanently (2025 precedent) and this print lands inside that blackout, the day before an FOMC carrying no SEP — one of the few forward-looking consumer reads still being published. In the averted branch it is an ordinary second-tier print. Discovered during the consumer-confidence-2026-09-29 initial research.",
  },
  {
    id: "durable-goods-2026-10-27",
    kind: "macro-print",
    title: "Advance Durable Goods Orders (Sep 2026 data)",
    date: "2026-10-27",
    status: "estimate",
    source:
      "EST: census.gov/manufacturing/m3/release_schedule.html lists 'September 2026 | 10/27/2026 | 8:30 a.m.' and census.gov/economic-indicators/calendar-listview.html carries the same date and time (both fetched direct 2026-09-01). Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, checked 2026-09-01",
    impact: "medium",
    symbols: [],
    notes:
      "The successor edition, and the one the funding branch actually threatens. It prints 08:30 on the FIRST MORNING of the Oct 27-28 FOMC meeting — the last capex read the committee sees before a decision that carries no SEP and no forward guidance — which is the whole reason it earns its own row rather than being tracked inside the 09-25 doc. In the lapse branch it may not exist on that date at all: on the 2025 precedent for this exact series, Census DELAYED rather than deleted, ~27-29 days (Oct-2025 advance 2025-11-26 -> 2025-12-23), which lands this edition in late November, after the vote. Same shape as retail-sales-2026-11-17's exposure and the opposite of BLS, which cancelled the October 2025 CPI outright. Deliberately filed `estimate` even though the date came off the Census primary: this lane never self-confirms an event in the PR that discovers it, and its own initial research is the place to flip it. Discovered during the durable-goods-2026-09-25 initial research (2026-09-01).",
  },
  {
    id: "ecb-bank-lending-survey-2026-10-27",
    kind: "macro-print",
    title: "Euro area bank lending survey (Q3 2026)",
    date: "2026-10-27",
    status: "estimate",
    source:
      "EST: ecb.europa.eu release calendar for the Euro area Bank Lending Survey (press/calendars/statscal/mfm/html/stpbls), fetched direct 2026-09-05 — the entry reads verbatim '27/10/2026 10:00 CET', 'Euro area Bank Lending Survey (Dataset: BLS)', 'Reference period: Q3 2026 / Q4 2026', 'Includes press release'. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit on an event discovered in-sweep, and because CONFIRMED_PREFIX has no slot for a non-Fed central bank, checked 2026-09-05",
    impact: "low",
    symbols: [],
    notes:
      "The one euro-area policy input that publishes INSIDE the ECB quiet period, and the reason ecb-quiet-period-start-2026-10-21 is more than a landmark. The quiet period runs 2026-10-21 -> 10-27 (the seven days before the 28/10 Day 1) and gates SPEECH, not PUBLICATION — so this survey, a standing Governing Council input, lands 10:00 CET on the gate's last day, one day before the meeting, with no official permitted to interpret it. That is the narrow, dated version of the asymmetry the quiet-period entry was filed asserting loosely; its parent ledger measures the broad version at 0.69x an ordinary day and refutes it. CLOCK: the EU falls back 2026-10-25 and the US not until 2026-11-01, so 10:00 CET = 05:00 ET, before the US cash open. NO PRICE CHANNEL AND NONE CLAIMED: symbols: [], no house playbook is rates-keyed, and this book's exposure to euro policy is second-order via dollar translation and global term premium, both owned by the FOMC entries. Discovered during the ecb-quiet-period-start-2026-10-21 initial research (2026-09-05). AMENDED 2026-09-05 by this event's own initial research (docs/research/events/ecb-bank-lending-survey-2026-10-27.md); date, status and impact UNCHANGED, THE REASON FOR THE ENTRY CORRECTED IN THREE PLACES, and the date STRENGTHENED. (0) The date now derives a second, independent way: all 14 realized BLS releases since Q1 2023 (each date read off its own pr<YYMMDD> press-release slug and cross-checked on the ECB all-releases index) published EXACTLY ONE CALENDAR DAY BEFORE DAY 1 of the Governing Council monetary-policy meeting — 2023-05-02/07-25/10-24, 2024-01-23/04-09/07-16/10-15, 2025-01-28/04-15/07-22/10-28, 2026-02-03/04-28/07-21. The survey is meeting-anchored by design, and Day 1 is 28/10/2026. Stays estimate on the no-self-confirm limit and the CONFIRMED_PREFIX gap. (1) 'THE ONE euro-area policy input that publishes INSIDE the quiet period' IS REFUTED BY COUNT, off the same primary: parsing the ECB statistical calendars index direct (plain curl, HTTP 200, 114,879 bytes) gives EIGHT releases inside 10-21 -> 10-27 — EDP deficit/debt 21/10 13:00, government debt securities 23/10 (Tentative), quarterly deficit/debt 23/10, annual government finance statistics 26/10 (Tentative), SAFE 26/10 10:00, and THREE AT 10:00 CET ON 27/10 ITSELF: this survey, the MFI national balance sheet (BSI) and monetary developments/M3 (BSI). 'The gate stops speech, not publication' is a property of the ENTIRE ECB statistical calendar, not a feature of this event — and the same-minute collision means NO 10-27 EURO MOVE IS ATTRIBUTABLE TO THE BLS. M3 is proposed as its own entry (ecb-monetary-developments-2026-10-27); the other six are deliberately not filed. (2) 'WITH NO OFFICIAL PERMITTED TO INTERPRET IT' IS WRONG IN BOTH DIRECTIONS. The BLS has NEVER carried an interpreter in any quarter: the October 2025 release (ECB primary) is a data release with a media-contact name and no named official, no attributed quote and no press conference — so the quiet period removes nothing that would otherwise exist. And the interpretation is not absent but TWO DAYS LATE: Lagarde cited the bank lending survey by name at the 2025-10-30 press conference, two days after the 2025-10-28 release (control: the 2025-12-18 statement, following no BLS round, cites the hard MIR/BSI series instead and does not name the survey). (3) THE RELEASE DAY IS MEASURED NULL ON THE INSTRUMENT MOST EXPOSED TO IT. Across those 14 releases, mean close-to-close |ret| vs an all-days baseline (2023-01-01 -> 2026-09-04, Yahoo adjusted bars, instrument cache busted): euro bank equities EXV1.DE 0.89% vs 0.95% (0.94x), Euro Stoxx 50 1.04x, DAX 0.86x, EUR/USD 0.74x, VIX 0.87x, S&P 500 0.83x — and against a like-for-like control of OTHER quiet-window days the release adds nothing at all (0.98x on both euro equity instruments). 2x sessions: EXV1.DE 1 of 14 vs 10.5% of ordinary days; VIX and S&P 0 of 14. The single 2x observation (EXV1.DE +3.08%, 2025-04-15) belongs to the April-2025 tariff tape. Registered as FT-ecb-bank-lending-survey-2026-10-27-1. WHY IT IS NULL: the October 2025 round was conducted 19 Sep -> 7 Oct for a 10-28 release, so the reference quarter closed four weeks before publication and the freshest response was ~3 weeks old, while the hard MFI loan counts publish monthly through the quarter anyway; and no pre-release numeric consensus is published for this series (sell-side coverage is reaction-side). Counterweight kept: ING/Capital Economics described the Q1 2026 round as tightening 'more aggressively than expected', and that release day ran EXV1.DE +0.86%, BELOW its own baseline. kind: 'macro-print' is a loose fit — no consensus, no surprise axis, a qualitative survey of a closed quarter — but is not worth changing; impact stays low and symbols: [] is correct. Ledger: docs/research/events/ecb-bank-lending-survey-2026-10-27.md.",
  },
  {
    id: "ecb-monetary-developments-2026-10-27",
    kind: "macro-print",
    title: "Euro area monetary developments — M3 and MFI loans (Sep 2026)",
    date: "2026-10-27",
    status: "estimate",
    source:
      'EST: ecb.europa.eu statistical calendars index (press/calendars/statscal), fetched direct 2026-09-05 (plain curl, HTTP 200, 114,879 bytes) and parsed from its own text layer — the row reads verbatim "27/10/2026 10:00 CET", "Monetary developments in the euro area (Dataset: BSI)", "Reference period: Sep-2026", "Includes press release". Cadence corroborated on the published series: the October 2025 reference month released 2025-11-27, i.e. end of the following month, which puts Sep-2026 at end-October. Primary-sourced, but filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep, and because CONFIRMED_PREFIX has no slot for a non-Fed central bank, checked 2026-09-05',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED BECAUSE IT MAKES 2026-10-27 UNATTRIBUTABLE, not for a price channel — there is none and low is affirmed. This publishes at the SAME 10:00 CET MINUTE as ecb-bank-lending-survey-2026-10-27, as does the MFI national balance sheet (BSI, Sep-2026); three ECB releases share that slot, all inside the 10-21 -> 10-27 quiet period. So no euro move at 05:00 ET on 10-27 can be read off 'the bank lending survey' — the attribution is undecidable between three releases, which is the finding that demoted its sibling's reason for existing. WHY THIS ONE AND NOT THE OTHER SIX IN-WINDOW RELEASES: it is the only one carrying HARDER AND NEWER DATA THAN THE SURVEY IT COLLIDES WITH. The BLS is a qualitative net-percentage survey of banks about a quarter that closed four weeks earlier (the Oct-2025 round was conducted 19 Sep -> 7 Oct for a 10-28 release); this is the actual September count of M3 and of MFI loans to firms and households. It is also the series the ECB's own monetary policy statement quotes: the 2025-12-18 statement reads verbatim 'Bank lending to firms grew by 2.9 per cent on a yearly basis in October'. The other six were deliberately left unfiled — two are ECB-marked Tentative, four are government-finance statistics with no channel to this book, and filing them would spend six research sessions re-establishing a null already measured once. NO PRICE CHANNEL AND NONE CLAIMED: symbols: [], no house playbook is rates-keyed, and this book's exposure to euro policy is second-order via dollar translation and global term premium, both owned by the FOMC entries. The measured context its sibling establishes: across 14 BLS release days euro bank equities (EXV1.DE) ran 0.94x an ordinary session and 0.98x their own quiet-window neighbours — an initial research session here should start from that null rather than re-derive it. CORRIDOR: 05:00 ET on FOMC Day 1, ahead of durable goods 08:30 ET and consumer confidence 10:00 ET the same morning, with the ECB's own decision 10-29. Discovered during the ecb-bank-lending-survey-2026-10-27 initial research (2026-09-05). Ledger: docs/research/events/ecb-bank-lending-survey-2026-10-27.md.",
  },
  {
    id: "treasury-5y-note-2026-10-27",
    kind: "rates",
    title: "5-Year Treasury Note auction (new issue)",
    date: "2026-10-27",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — row reads verbatim `5-Year NOTE / Announcement Thursday, October 22, 2026 / Auction Tuesday, October 27, 2026 / Settlement Monday, November 02, 2026`, 1:00pm ET by Treasury's standing coupon-auction convention (the time is NOT separately sourced). The absence of an R makes it a new issue. Size corroborated in advance by press release sb0590 (2026-08-05), read as text direct 2026-09-05, whose Oct-26 anticipated-size row reads 70 in the 5-Year column (header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN`, row `69 58 70 44 39 13 22 30`). Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep — the confirming primary is the 2026-10-22 announcement itself",
    impact: "medium",
    symbols: [],
    notes:
      "The belly leg of the same 10-22 announcement that sizes treasury-2y-note-2026-10-26, selling the day AFTER it and the day BEFORE fomc-2026-10-28 — i.e. inside the compound window 10-27 -> 10-29, sharing its date with consumer-confidence-2026-10-27, durable-goods-2026-10-27 and ecb-bank-lending-survey-2026-10-27. It is the tenor carrying this calendar's SOFT-FOREIGN-DEMAND read: treasury-5y-note-2026-09-23's ledger records indirect at 61.5% against a ~65.7% norm, the finding treasury-2y-note-2026-09-22 then showed does NOT generalize to the front end. NOTE BEFORE REUSING THAT FRAMING: the 2Y's own 2026-10-26 initial research measures indirect and direct shares as near-perfect substitutes on that tenor (corr -0.866, t=-11.23, n=44), so an indirect-share verdict on this sale needs the same substitution check before it is read as a demand claim — the residual that is not a reclassification is dealer takedown. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Discovered during the treasury-2y-note-2026-10-26 initial-research adjacency sweep (2026-09-05), at D+1 inside that event's five-day corridor; the 20Y sweep that filed the 2Y saw this row in the same fetch and correctly left it, being outside ITS corridor.",
  },
  {
    id: "fomc-2026-10-28",
    kind: "macro-print",
    title: "FOMC decision (meeting Oct 27–28)",
    date: "2026-10-28",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
    notes: "Lands ON the GOOG/META print date and a day before AMZN/AAPL — a compound-risk day.",
  },
  {
    id: "ecb-decision-2026-10-29",
    kind: "macro-print",
    title: "ECB Governing Council monetary-policy decision + press conference (Frankfurt)",
    date: "2026-10-29",
    status: "estimate",
    source:
      "EST: ecb.europa.eu Governing Council monetary-policy meeting calendar (press/calendars/mgcgc), fetched direct 2026-09-05 — the October 2026 entries read verbatim 'Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 1)' on 28/10/2026 and 'Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 2), followed by press conference' on 29/10/2026. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit and because CONFIRMED_PREFIX has no slot for a non-Fed central bank, the same gap ecb-decision-2026-09-10 records. Checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "The first venue where the 09-10 meeting's live question gets tested. That question is NOT the rate — a 25bp hike to 2.50% on 09-10 was ~98.9% priced with all 65 Reuters-poll economists agreeing — but the TERMINAL: futures priced ~100% odds of a 3.00% deposit rate by June 2027 (two more hikes) on 2026-09-04, while ~91% of economists had 2.50% standing through year-end. A hike here resolves that ~50bp gap toward the market strip. NO PRICE CHANNEL IS CLAIMED, same as the September entry: `symbols: []`, no house playbook is rates-keyed, and euro policy reaches this book only second-order via dollar translation and global term premium, both already owned by the FOMC entries. Note the stack — it lands the day after fomc-2026-10-28 and shares the date with gdp-q3-2026-advance-2026-10-29 and pce-2026-10-29, so attribution on 10-29 is already hard. CLOCK CORRECTION (ecb-decision-2026-10-29 initial research, 2026-09-05): this note previously read 'an 08:15 ET euro presser precedes two US prints', which is wrong on both counts. The EU falls back 2026-10-25 and the US not until 2026-11-01, so the ECB's standing 14:15/14:45 CET slots land at 09:15/09:45 ET on this date — the decision arrives 45 minutes AFTER the 08:30 ET GDP and PCE prints, and the press conference begins 15 minutes AFTER the US cash open, making the euro leg a contaminant of the 09:45-10:30 ET tape rather than an explanation of it. That research also found the October meeting is priced as a skip (no staff projections outside March/June/September/December, and the October flash HICP not until 2026-11-04), so the terminal question resolves at ecb-decision-2026-12-17, not here. Discovered during the ecb-decision-2026-09-10 initial research (2026-09-05). Estimate widens caution only; it licenses no date-keyed action.",
  },
  {
    id: "gdp-q3-2026-advance-2026-10-29",
    kind: "macro-print",
    title: "GDP — advance estimate, Q3 2026",
    date: "2026-10-29",
    status: "confirmed",
    source: "BEA: bea.gov/news/schedule — 08:30 ET, checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "The first read on Q3 growth, and the third federal release stacked into the Oct 27–29 compound-risk window (this + PCE the same morning, on top of the 10-28 FOMC and the five estimated mega-cap prints). BEA is a federal agency: in the funding-lapse branch this release dies with the 10-02 payrolls and 10-14 CPI, which is exactly why the surviving PRIVATE reads that week — the Conference Board print on 10-27, ISM, ADP, UMich — get promoted. Discovered during the consumer-confidence-2026-10-27 initial research.",
  },
  {
    id: "pce-2026-10-29",
    kind: "macro-print",
    title: "PCE / Personal Income & Outlays (Sep 2026 data)",
    date: "2026-10-29",
    status: "confirmed",
    source:
      'BEA: bea.gov/news/schedule — "Personal Income and Outlays, September 2026", 08:30 ET, re-verified 2026-08-29',
    impact: "high",
    symbols: [],
    notes:
      "The Fed's own inflation gauge, landing the morning AFTER the 10-28 statement rather than before it — the committee decides without it. Federal, so it is exposed to a 10-01 funding lapse; the pce-2026-10-29 initial research corrected what that exposure actually is (2025 precedent: a September-reference PCE was DELAYED five weeks, 10-31 to 12-05, not deleted, while the advance GDP estimate sharing its slot was cancelled outright). Discovered during the consumer-confidence-2026-10-27 initial research.",
  },
  {
    id: "treasury-7y-note-2026-10-29",
    kind: "rates",
    title: "7-Year Treasury Note auction (new issue)",
    date: "2026-10-29",
    status: "estimate",
    source:
      "EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, text layer decompressed direct 2026-09-05 (plain curl, HTTP 200, 17,195 bytes) — row reads verbatim `7-Year NOTE / Announcement Thursday, October 22, 2026 / Auction Thursday, October 29, 2026 / Settlement Monday, November 02, 2026`, 1:00pm ET by Treasury's standing coupon-auction convention (the time is NOT separately sourced). The absence of an R makes it a new issue. Size corroborated in advance by press release sb0590 (2026-08-05), read as text direct 2026-09-05, whose Oct-26 anticipated-size row reads 44 in the 7-Year column (header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN`, row `69 58 70 44 39 13 22 30`). Stays estimate on two counts: a tentative schedule is tentative by construction, and this lane may not self-confirm an event it discovered in-sweep — the confirming primary is the 2026-10-22 announcement itself",
    impact: "medium",
    symbols: [],
    notes:
      "The last leg of the 10-22 announcement block (2Y 10-26, 5Y 10-27, this 7Y 10-29), and the only one selling AFTER the FOMC rather than before it — which is what separates it from its two siblings and makes it the block's cleanest post-decision demand read, the same role treasury-2y-note-2026-09-22 played in September when the sequencing ran the other way. IT LANDS ON THE MOST CONTESTED DATE OF THE QUARTER: gdp-q3-2026-advance-2026-10-29 and pce-2026-10-29 both print 08:30 ET, ecb-decision-2026-10-29 lands 09:15 ET with its press conference at 09:45 (the EU falls back 10-25 and the US not until 11-01), and this auction prices at 13:00 — so ANY same-day yield move on 10-29 has at least four candidate causes before the auction is one of them, and attribution to the sale should not be attempted at daily resolution. Read-it-do-not-trade-it: `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Discovered during the treasury-2y-note-2026-10-26 initial-research adjacency sweep (2026-09-05), at D+3 inside that event's five-day corridor. Deliberately NOT added in the same sweep: the 2-Year FRN of 2026-10-28, on the same announcement and inside the same corridor, because a floating-rate note carries no duration or policy-path read (the rule treasury-2y-note-2026-09-22 set) — flagged for whoever revisits it that the FRN prices 13:00 ET on FOMC decision day, one hour before the 14:00 statement.",
  },
  {
    id: "ism-manufacturing-2026-11-02",
    kind: "macro-print",
    title: "ISM Manufacturing PMI (Oct 2026 data)",
    date: "2026-11-02",
    status: "estimate",
    source:
      "EST: ISM publishes the Manufacturing PMI at 10:00 ET on the first business day of the month (the cadence the confirmed 2026-09-01 entry follows); 2026-11-02 is a Monday — ismworld.org's own ROB calendar is login-gated (302 to ecommerce.ismworld.org/SSO), so this is derived exactly as the 2026-10-01 sibling was and not re-verified against it, checked 2026-08-31",
    impact: "high",
    symbols: [],
    notes:
      "The first manufacturing read after the 10-28 FOMC and the last hard macro print before the 11-03 midterms (est) — and it beats sloos-2026-11-02 to the same day's tape by four hours, which is part of why that survey has no window to be the story. Prices-paid + new-orders reprice the Fed-cut path and 10Y real yields, the discount rate on long-duration tech. Discovered during the sloos-2026-11-02 initial research: the corridor sweep found the 09-01 and 10-01 entries tracked and the 11-02 slot empty.",
  },
  {
    id: "sloos-2026-11-02",
    kind: "macro-print",
    title: "Senior Loan Officer Opinion Survey on Bank Lending Practices (SLOOS)",
    date: "2026-11-02",
    status: "confirmed",
    source:
      "FED: two federalreserve.gov primaries fetched direct 2026-08-31 — newsevents/2026-november.htm lists 'Senior Loan Officer Opinion Survey on Bank Lending Practices (SLOOS)' at 2:00 p.m. on November 2, and data/sloos.htm states the convention verbatim, 'The Federal Reserve generally conducts the survey quarterly, timing it so that results are available for the January/February, April/May, August, and October/November meetings of the Federal Open Market Committee' — all three 2026 editions obeyed it (02-02, 05-04, 08-03, each the Monday after an FOMC), checked 2026-08-31",
    impact: "low",
    symbols: [],
    notes:
      "READ IT, DO NOT TRADE IT — and the refusal is now MEASURED on the instrument that should carry it (see the ledger): KRE's close-to-close excess vs SPY on all three 2026 releases was +1.29% / -0.82% / -0.11%, the 73rd / 55th / 9th percentile of KRE's own 2026 |excess| distribution (median 0.75%, p90 2.09%, n=164), no sign consistency, and no session wrap names SLOOS as a driver. What earns it a calendar row is TIMING, NOT POWER: the survey's response window closes ~2026-10-02 (derived from the July edition's published sent 06-17 / due 07-02 / released 08-03 dates), so this edition is the first structured read on how a 09-16 hike transmits into bank credit standards — and is already ~4 weeks stale relative to the 10-28 meeting whose Monday it follows. Read it for exactly two things: the C&I standards-and-demand line, and the special questions' level-vs-history read (July 2026: standards at the TIGHTER end of their post-2005 range for every category except C&I). Its signal is buried by construction — ism-manufacturing-2026-11-02 (est) leads it by four hours the same morning and midterm-elections-2026-11-03 (est) owns the next day; that election, not this, is the window's positioning date. Like the Beige Book it is Fed-funded and publishes through an appropriations lapse where BLS data does not. Discovered during the fomc-minutes-2026-11-18 initial research; date flipped estimate -> confirmed by its own initial research 2026-08-31.",
  },
  {
    id: "treasury-borrowing-estimates-2026-11-02",
    kind: "macro-print",
    title: "Treasury Marketable Borrowing Estimates (Q4 2026 / Q1 2027)",
    date: "2026-11-02",
    status: "confirmed",
    source:
      "TSY: home.treasury.gov most-recent-quarterly-refunding-documents names the 15:00 ET Monday Financing Estimates slot and states '(The next release is scheduled for November 2, 2026)', with the 08:30 Wednesday slot separately naming November 4 — fetched direct 2026-08-31. Promoted from estimate on that primary: WebFetch times out on home.treasury.gov but plain curl returns 200, so the sibling ledger's 'gated primary' was a tool artifact, not a network fact, checked 2026-08-31",
    impact: "low",
    symbols: [],
    notes:
      "The QUANTITY half of the refunding pair: this Monday release carries the aggregate dollar borrowing number plus the FIRST estimate for the following quarter, and treasury-refunding-2026-11-04 (est) allocates it across the curve 48 hours later. Filed LOW on this event's own measurement (all 15 releases since 2023, every date read off the Treasury press release): release day is NIL — on the 8 releases not sitting on an FOMC meeting-eve, TLT closed 4/8 up at +0.056% (permutation p=0.860), SPY 6/8 at +0.201% (p=0.704), ^TNX 4/8 at +0.041% (p=0.989). Both episodes market memory attributes to this release fail on the tape: 2023-07-31 ($1.007T) closed TLT +0.24%, 21st percentile; 2023-10-30 (-$76B) closed TLT -0.45%, the wrong direction. The headline revision is a cash-balance variable, not a deficit variable — all 5 editions past +/-$250B sit inside a debt-limit cycle. READ IT, DO NOT TRADE IT, and read it for the Jan-Mar 2027 estimate: debt outstanding was $40.078T on 2026-08-27 against the $41.1T limit. Attribution is impossible anyway — 13 tracked events sit within +/-5 days. Discovered during the treasury-refunding-2026-11-04 initial research (2026-08-31); measured and promoted by its own initial research the same day.",
  },
  {
    id: "midterm-elections-2026-11-03",
    kind: "geopolitical",
    title: "US midterm elections — House, one third of the Senate, 36 governorships",
    date: "2026-11-03",
    status: "estimate",
    source:
      "NEWS: contemporaneous coverage of the Collins-Murray CR deal (NBC/CBS/PBS/WaPo/The Hill, early Aug 2026), which is explicitly built to fund the government past the midterms; the date itself is statutory (first Tuesday after the first Monday in November of an even year = 2026-11-03, a Tuesday) but no primary source was fetched, checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "Not a print — a dated policy checkpoint, and the causal driver behind the FY2027 funding timeline: the Senate CR runs to Dec 11 precisely so the full-year fight lands in a lame-duck session shaped by this result. Filed `estimate` per the event-research lane's no-self-confirm limit even though the date is statutory — the honest reading is date-certain, outcome-unknown. Discovered during the government-funding-deadline-2026-09-30 initial research; the CR's own expiry (Dec 4 or Dec 11) is a second dated checkpoint left un-proposed until the chambers reconcile which.",
  },
  {
    id: "adp-employment-2026-11-04",
    kind: "macro-print",
    title: "ADP National Employment Report (Oct 2026 data)",
    date: "2026-11-04",
    status: "estimate",
    source:
      "EST: FRED's release calendar rid=194 lists an ADP National Employment Report on 2026-11-04 at 07:15 CT (= 08:15 ET), fetched direct 2026-09-03, and the date is the Wednesday two sessions before the BLS-confirmed 11-06 payrolls Friday — the slot this series always occupies. Filed estimate because a FRED forward calendar is a projection and ADP has not itself named the date; ADP's own confirmation arrives in the body of the 09-30 release, checked 2026-09-03",
    impact: "medium",
    symbols: [],
    notes:
      "The successor edition, keeping the tracked ADP series continuous past 09-30. Ordinary by construction — the annual QCEW re-benchmark lands in the September print (and the full benchmark in the following February's), so this one should read as a plain private-payrolls measurement against a restated base; the adp-employment-2026-11-04 initial research MEASURED that claim on the one prior cycle rather than asserting it (the equivalent post-re-benchmark edition, 2025-11-05, carries no QCEW/benchmark language and revised its prior month by only 3k, -32k to -29k). WHAT ACTUALLY DISTINGUISHES THIS EDITION (2026-09-03): it prints at 08:15 ET the MORNING AFTER the 11-03 midterms, 15 minutes before the 11-04 Treasury refunding announcement and 105 minutes before ISM Services, two sessions before confirmed BLS payrolls on 11-06 — so no 11-04 tape move is attributable to it. The one same-structure precedent is exact and the same calendar date: on 2020-11-04, with the presidential result undetermined, ADP missed a 600k consensus by 39% (+365k) while futures were 'broadly unchanged following the data release' (CNBC) and the session closed S&P +2.20% / VIX -5.98 / 10y -11.4bp. Bounding it the other way, ADP's best-case day — 2025-11-05, sole labor read during the record shutdown, a beat — was S&P +0.37%. SECOND FINDING: FRED rid=194's full-year list runs Sep 2, Sep 30, Nov 4, Dec 2, so there is NO October release at all; this is the only ADP read on October that will exist, and its month-over-month delta spans a 35-day publication gap. FRED also carries 12-02, now filed as this event's own one-successor proposal. Discovered during the adp-employment-2026-09-30 initial research; assessed 2026-09-03.",
  },
  {
    id: "ism-services-2026-11-04",
    kind: "macro-print",
    title: "ISM Services PMI (Oct 2026 data)",
    date: "2026-11-04",
    status: "estimate",
    source:
      "EST: ISM publishes the Services PMI at 10:00 ET on the third business day of the month (the cadence the confirmed 2026-09-03 entry follows); November 2026's first three business days are Mon 11-02, Tue 11-03, Wed 11-04 — Election Day is not a market or federal holiday. ismworld.org's ROB calendar was re-fetched direct 2026-08-31 and still 302s to ecommerce.ismworld.org/SSO/Login.aspx, and no aggregator convergence was obtained for this specific date, so this is a rule-derived date and nothing more, checked 2026-08-31",
    impact: "high",
    symbols: [],
    notes:
      "The first services read after the 11-03 midterms and the first national activity data published AFTER the vote — the mirror of ism-manufacturing-2026-11-02 (est), which is the last one published before it. READ IT, DO NOT TRADE IT — and the 'services prices are the single biggest non-CPI rate-path mover in this set' claim this note used to assert is RETIRED AS UNMEASURED by this event's own initial research (2026-08-31). Measured on dividend-adjusted closes across all 8 of 2026's services releases: TLT 3/8 up at a mean +0.020% (unconditional -0.012%), ^TNX 4/8 at -0.009%, SPY with no release-day move above the 76th percentile of its own 2026 |move| distribution, and QQQ/XLF/IWM likewise nil; Spearman(Prices, TLT) -0.132 is the right sign but far short of the ~0.74 critical value at n=8, and ranks BELOW the headline's ordering. The claim's most-cited receipt inverts too: on 2026-08-05 the 10Y closed 4.617, DOWN from 4.627, against press narration of '+9bps to ~4.17%'. That is a finding about the RELEASE, not about services inflation's importance to the Fed. What actually distinguishes this date is treasury-refunding-2026-11-04 (est) at 08:30 ET, 90 minutes ahead of the 10:00 print — the same collision that contaminated the 08-05 and 02-04 releases, so no bond move that morning is attributable to this survey. Discovered during the ism-manufacturing-2026-11-02 initial research (2026-08-31): the corridor sweep found the manufacturing slot tracked for 11-02 and the services slot two days later empty.",
  },
  {
    id: "treasury-refunding-2026-11-04",
    kind: "macro-print",
    title: "Treasury Quarterly Refunding Announcement (Nov 2026)",
    date: "2026-11-04",
    status: "estimate",
    source:
      "EST: Treasury holds its quarterly refunding on the first Wednesday of February, May, August and November, releasing the policy statement, TBAC report and auction/buyback schedules at 08:30 ET; home.treasury.gov's own pages put the August 2026 refunding documents at 08:30 a.m. on 2026-08-05 and name the next release 2026-11-04, and the buyback release (home.treasury.gov/news/press-releases/sb0607) states more information on future buyback sizes comes 'at the next Quarterly Refunding, scheduled for November 4, 2026', with the marketable borrowing estimates and TBAC materials on 2026-11-02. Reached via search rather than a directly-fetched primary — home.treasury.gov timed out twice on direct fetch this session — so this is filed estimate and nothing more, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "Closes a structural gap: this calendar tracks 13 Treasury auctions and buybacks but not the announcement that SETS their sizes and schedules. It lands 08:30 ET on 2026-11-04, 90 minutes ahead of ism-services-2026-11-04 (est), and it is the reason no bond move that morning can be attributed to the ISM print — the ISM services release is the third business day and the refunding is the first Wednesday, so in 2026 they collide on 02-04, 08-05 and 11-04. That matters retroactively: the 08-05 session whose yield move the ism-services-2026-09-03 ledger attributed to ISM's 70.3 Prices reading had this announcement 90 minutes earlier (and the 10Y actually closed DOWN that day). This edition is the first refunding after the 11-03 midterms, setting coupon sizes and buyback schedules into a post-election fiscal picture, with the borrowing estimates two days earlier on 11-02. Filed medium: refunding announcements move the long end through supply rather than through the policy path, and no house playbook is macro-keyed. Discovered during the ism-services-2026-11-04 initial research (2026-08-31).",
  },
  {
    id: "jobs-2026-11-06",
    kind: "macro-print",
    title: "Employment Situation (Oct 2026 data)",
    date: "2026-11-06",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/empsit.htm — 08:30 ET, checked 2026-08-17",
    impact: "high",
    symbols: [],
    notes: "Four days before the Nov 10 CPI + est. CRWV print compound day.",
  },
  {
    id: "cpi-2026-11-10",
    kind: "macro-print",
    title: "CPI release (Oct 2026 data)",
    date: "2026-11-10",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "us-china-tariff-truce-expiry-2026-11-10",
    kind: "geopolitical",
    title: "US–China tariff truce expires — Kuala Lumpur suspension of the additional 24% duty",
    date: "2026-11-10",
    status: "estimate",
    source:
      "NEWS: whitehouse.gov presidential action of 2025-11-04 (Executive Order 14358, 'Modifying Reciprocal Tariff Rates Consistent with the Economic and Trade Arrangement Between the United States and the People's Republic of China') suspends the heightened EO-14257 duties in favour of a flat additional 10% until, verbatim, '12:01 a.m. eastern standard time on November 10, 2026' — fetched direct 2026-09-04. STAYS ESTIMATE FOR A SCHEMA REASON, NOT DATE DOUBT — do not spend another session trying to promote it: the expiry language is primary and verbatim, but event-scan-validation.mjs's CONFIRMED_PREFIX admits only IR|CAL|BLS|FED|PJM|SEC|TSY|OCC|BEA|CENSUS|ISM|CB and has no slot for a White House presidential action or a Federal Register citation. Adding a WH:/FR: prefix is a schema change, not this lane's call (same reasoning georgia-senate-runoff-2026-12-01 records for a state election authority)",
    impact: "high",
    symbols: [],
    notes:
      "THE HEADLINE MECHANISM IS DEAD AND THE RISK HAS INVERTED (initial research, 2026-09-04). This entry was filed hours earlier asserting that absent renewal the additional 24% 'Liberation Day' rate returns on top of the 10% floor. It cannot: the Supreme Court held on 2026-02-20 that IEEPA does not authorize tariffs (Learning Resources v. Trump, 24-1287, 6-3), the same-day 'Ending Certain Tariff Actions' order terminated the IEEPA duties including EO 14257 — the rate EO 14358 suspends — and CBP stopped collection 2026-02-24. The wall was rebuilt on other authorities with no Nov-10 hook (Sec. 122 10% from 02-24, expired by its 150-day cap 12:01 EDT 07-24; USTR Sec. 301 forced-labor duties 10-12.5% on ~60 economies effective the same minute, China at 12.5% stacking to ~37.5% aggregate 301). WHAT STILL EXPIRES 11/10 IS CHINA'S HALF: MOFCOM/GAC Announcement No. 70 of 2025-11-07 suspended the six 2025-10-09 export-control announcements — No. 61's 0.1% extraterritorial rule and the rare-earth FDPR, plus a delayed Ho/Er/Tm/Eu/Yb wave — until 2026-11-10, unaffected by a US court. So the exposure is rare-earth-dependent supply chains (semis, autos, robotics, aerospace, defense; ~69% of 2025 mine output, up to ~90% of processing), not tariff-sensitive importers. Structural wrinkle: the natural extension venue, APEC Shenzhen, is 2026-11-18/19 — eight days AFTER the deadline. Lands 08:30-adjacent to cpi-2026-11-10 and the est. CRWV print, so nothing that day is cleanly attributable. Estimate widens caution only — no date-keyed action. Discovered during the trump-xi-summit-2026-09-24 pulse-check adjacency sweep (2026-09-04); ledger: docs/research/events/us-china-tariff-truce-expiry-2026-11-10.md.",
  },
  {
    id: "mts-october-2026-11-12",
    kind: "macro-print",
    title: "Monthly Treasury Statement (Oct 2026 data) — first month of FY2027",
    date: "2026-11-12",
    status: "confirmed",
    source:
      "TSY: fiscaldata.treasury.gov — the November 2025 MTS (MonthlyTreasuryStatement_202511.pdf, p.40) was downloaded and text-extracted directly by this event's own initial-research session on 2026-09-05, and carries the full annual table — 'Listed below are the scheduled release dates for the Monthly Treasury Statement. The Statement is released at 2:00 p.m.' — with 'October 2026 / November 12, 2026'. PROMOTED from estimate 2026-09-05: the entry's original estimate grounds were this lane's no-self-confirm limit, and that is cleared — the discovery was the mts-august-2026-09-11 pulse's, the primary has now been re-fetched independently, and TSY: is an authorized confirmed-tier prefix. Two corroborations: the 8th-federal-workday rule (verified 20 of 20 against the published 2024 and 2026 calendars) computes 2026-11-12 exactly once Veterans Day, Wed 2026-11-11, is excluded; and Treasury's services/calendar/release API carries a dataset (015-BFS-2014Q1-13) whose only three forward releases are 2026-09-11, 2026-11-12 and 2026-12-10 — matching the published table row for row including its September gap — at timestamps decoding to 14:00 ET on both sides of the DST boundary. That dataset id could not be resolved to a name (static-data/datasets.json 503s, the calendar endpoint ignores id filters), so it is a fingerprint corroboration, not a second named primary. Treasury's own 'subject to change' caveat applies equally to every already-confirmed Treasury date in this calendar. Checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "THE CALENDAR CARRIED EXACTLY ONE MTS AND THIS IS THE ONLY DATED NEXT ONE. The September-2026 accounting month has NO scheduled release date in Treasury's own table — footnote (1), 'Release date subject to completion of year-end reporting requirements' — because it is the fiscal-year-end statement, so the series skips from 09-11 to 11-12 as far as any primary will commit. That gap is why this entry matters rather than being a routine next-in-series: it is the next dated read on the deficit trajectory the long-end ledgers keep pricing and never dating. It is also THE SCORING DATE for FT-51, the market-impact null mts-august-2026-09-11 registered — deliberately scored here rather than on its own event because 2026-09-11 collides with CPI at 08:30 and UMich prelim at 10:00, while 11-12 is clean of every tracked event (cpi-2026-11-10 and ppi-2026-11-13 sit either side of it, not on it). Its own initial research (2026-09-05) found the reason it is worth reading: October 2026 and October 2025 BOTH carry two benefit-payment batches (Nov 1 is a Sunday in 2026, was a Saturday in 2025, so each year pulls the next month's military/VA/SSI/Medicare-drug batch back into October), making this the first calendar-clean y/y deficit comparison in a year — the artifact that made the August print unreadable is absent. Base case ~$320B, band $280-365B, against $284.35B in Oct-2025; model-derived, licensing nothing. Tiered medium to match its sibling; the measured evidence there is that this release does not move the tape (56 releases: TLT p=0.249, SPY p=0.689; 35 intraday release windows: TLT p=0.413, SPY p=0.946). Discovered during the mts-august-2026-09-11 pulse-check adjacency sweep (2026-09-05), researched and promoted to confirmed the same day by its own session.",
  },
  {
    id: "ppi-2026-11-13",
    kind: "macro-print",
    title: "PPI release (Oct 2026 data)",
    date: "2026-11-13",
    status: "confirmed",
    source:
      'BLS: bls.gov/schedule/news_release/ppi.htm ("October 2026 | Nov. 13, 2026 | 08:30 AM") + bls.gov/schedule/2026/11_sched.htm (Producer Price Index / October 2026 / 08:30 AM on Friday the 13th) — two independent primary views, both fetched direct 2026-08-31 (the pages 403 to plain fetchers and need a full browser header set)',
    impact: "medium",
    symbols: [],
    notes:
      "Fills the gap in the tracked PPI series (09-10, 10-15, [this], 12-15) — discovered during the ppi-2026-12-15 initial research, where it is the LAST wholesale print before that one and so the base its trend read extrapolates from. Filed estimate then per the no-self-confirm limit; promoted to confirmed by its own initial-research session on 2026-08-31 with both BLS primaries in hand. EXISTENCE RISK IS THE HEADLINE: this is the OCTOBER reference month, and BLS's own lapse page shows the October-2025 PPI news release (scheduled Fri 2025-11-14) was CANCELED outright — its data folded into the November release, which itself slipped Dec 11 -> 2026-01-14. Of the four PPI prints tracked here, this is the only slot whose 2025 analogue was deleted rather than delayed. Also the LAST PPI the 12-09 FOMC sees, and it feeds pce-2026-11-25 (Oct data) before that vote.",
  },
  {
    id: "import-export-prices-2026-11-17",
    kind: "macro-print",
    title: "U.S. Import and Export Price Indexes (Oct 2026 data)",
    date: "2026-11-17",
    status: "confirmed",
    source:
      'BLS: bls.gov/schedule/news_release/ximpim.htm ("October 2026 | Nov. 17, 2026 | 08:30 AM") + bls.gov/schedule/2026/11_sched.htm (U.S. Import and Export Price Indexes / October 2026 / 08:30 AM on Tuesday the 17th) — two independent primary views, both fetched direct 2026-08-31 (the pages 403 to plain fetchers and need a full browser header set)',
    impact: "low",
    symbols: [],
    notes:
      "The tariff pass-through gauge for the October data cycle. Filed estimate on 2026-08-31 by the ppi-2026-11-13 sweep that discovered it; promoted to confirmed the same day by its own initial-research session with both BLS primaries in hand. THE HEADLINE 12-MONTH NUMBER LIKELY CANNOT PRINT: BLS permanently suppressed 864 of 1,625 indexes for the October 2025 reference month after the 2025 lapse, including the all-goods import and export indexes (MXP shutdown notice; verified in the public API - EIUIR runs 2025-M09 140.8 -> 2025-M11 141.2 with no M10), and this is the release whose 12-month comparison needs that month. Its neighbours 10-16 and 12-17 are unaffected. Impact stays LOW on purpose and was checked, not assumed: these indexes deflate GDP net trade, NOT PCE, so there is no channel into the 12-09 FOMC - the ppi-2026-11-13 'understated tier' flag does not transfer here. What it does carry is the cleanest duty-exclusive pass-through read the calendar has: BLS excludes tariffs from these prices, so the +4.5% nonfuel y/y (Jul 2026, highest since Jun 2022) says exporters are NOT absorbing.",
  },
  {
    id: "retail-sales-2026-11-17",
    kind: "macro-print",
    title: "Retail Sales — advance monthly (Oct 2026)",
    date: "2026-11-17",
    status: "confirmed",
    source:
      'CENSUS: census.gov/retail/release_schedule.html lists the Advance Monthly Retail Trade Report for October 2026 data on "November 17, 2026", 08:30 ET, fetched direct 2026-09-01',
    impact: "high",
    symbols: [],
    notes:
      "The print that publishes the REVISION to the 10-15 advance estimate, and the one whose own reference month carries Amazon's fall Prime event — the nonstore distortion that made July's -2.2% drop and August's bounce unreadable as demand. NO AMAZON PRIMARY ANNOUNCES 2026 FALL-EVENT DATES: aggregators name Oct 7-8, which is exactly the 2025 pair, so no separate event entry was filed and the distortion is tracked here instead (Prime Day 2026 itself ran June 23-26, per Amazon's press center). ALSO THE FIRST RETAIL PRINT AFTER THE 10-28 FOMC, and the one most exposed if a 2026-09-30 appropriations lapse occurs: Census DELAYS rather than deletes (Sep-2025 advance slipped 2025-10-16 -> 2025-11-25; Oct-2025 advance 2025-11-14 -> 2025-12-16, and the backlog cleared only at the 2026-05-14 release), so in that branch this slot is where the October reference month would land late rather than vanish. Discovered during the retail-sales-2026-10-15 initial research. Filed `confirmed` rather than the sweep's usual `estimate` because the date came from the Census primary release schedule fetched that session — the same page and `CENSUS:` prefix that seeded the 09-16 and 10-15 entries. CORRECTION (2026-09-01 initial research, docs/research/events/retail-sales-2026-11-17.md): the fall-Prime premise above is REFUTED at the data. Census Table 2 shows nonstore m/m +0.3% in Oct 2024 (PBDD Oct 8-9) and +1.8% in Oct 2025 (PBDD Oct 7-8) against a no-event Sep 2024 of +1.7%, and BOTH event Octobers decelerated at the headline vs their own September (+0.4% vs +0.8%; +0.0%* vs +0.1%*) — the event has run first-half-October every year since 2022, so the seasonal factors absorb it. Only a CHANGE in the event's dates or scale would distort. The appropriations read above is also narrower than stated: both live CR candidates (House Dec 4, Senate Dec 11) expire AFTER this print, so only a total funding failure by 2026-09-30 reaches it.",
  },
  {
    id: "apec-leaders-shenzhen-2026-11-18",
    kind: "geopolitical",
    title: "APEC Economic Leaders' Meeting (33rd) — Shenzhen, China",
    date: "2026-11-18",
    status: "estimate",
    source:
      "NEWS: apec.org's own 2025 press release 'China Unveils APEC 2026 Theme and Priorities in Shenzhen' plus english.www.gov.cn and sz.gov.cn (both dated 2025-12) name Nov 18-19 2026 in Shenzhen, Guangdong for the 33rd Economic Leaders' Meeting; Treasury Sec. Bessent named it as a venue for China trade talks in May-2026 Reuters remarks. Filed estimate: the date is multiply and near-primary sourced, but this calendar has no confirmed prefix for a multilateral body's own schedule (same schema gap us-china-tariff-truce-expiry-2026-11-10 records), and leader attendance — Trump's especially — is not established. Checked 2026-09-04",
    impact: "medium",
    symbols: [],
    notes:
      "LOAD-BEARING BECAUSE OF WHERE IT SITS: eight days AFTER us-china-tariff-truce-expiry-2026-11-10, so the natural leader-level venue for extending the Kuala Lumpur arrangement lands past the clock it would extend. Of the three venues Bessent named in May 2026 while saying the administration was 'not in a hurry' to extend (the September Washington summit, this, and a December G20 in Florida), two post-date the deadline — which is why the trump-xi-summit-2026-09-24 meeting carries more weight than a routine state visit would. Day 1 of the two-day window per house convention. Estimate widens caution only. Discovered during the us-china-tariff-truce-expiry-2026-11-10 initial research (2026-09-04).",
  },
  {
    id: "fomc-minutes-2026-11-18",
    kind: "macro-print",
    title: "FOMC minutes (Oct 27-28 meeting)",
    date: "2026-11-18",
    status: "confirmed",
    source:
      "FED: two federalreserve.gov primaries fetched direct 2026-08-31 by the fomc-minutes-2026-11-18 initial research (an independent session from the sweep that proposed it, so no self-confirm) — newsevents/2026-november.htm lists 'FOMC Minutes Meeting of October 27-28' at 2:00 p.m. on November 18, and monetarypolicy/fomccalendars.htm states the convention verbatim, 'The minutes of regularly scheduled meetings are released three weeks after the date of the policy decision', which all five published 2026 meetings obey (Jul 28-29 -> Aug 19). Oct 28 + 21 days = Wednesday Nov 18: the published row and the published rule agree, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "READ IT, DO NOT TRADE IT — and that refusal is now MEASURED, not asserted (see the ledger): both minutes releases under this chair moved the tape under a third of a percent (S&P -0.28% on 2026-07-08, +0.21% on 2026-08-19 despite explicitly hawkish content, that session driven by Treasury's buyback doubling), while Warsh's single 08-28 speech moved September hike odds ~35-36% -> ~58-60%. What earns it a calendar slot is SCARCITY, NOT POWER: it is the last Committee-authored document before the 12-08/09 SEP meeting, and federalreserve.gov's November calendar lists NO speeches at all with the blackout starting 11-28, so the record between it and the December dots is this, the Beige Book, and silence. Unusually stale even for minutes — the three-week gap contains the 11-03 midterms, cpi-2026-11-10 and ppi-2026-11-13. Read it for exactly three things: the October vote split, the dissent count, and whether the dissent language hardens from July's 9-3 (most dissents against a new chair since 1970). The window's positioning date is opex-2026-11-20, not this. Discovered during the beige-book-2026-11-25 initial research, off the November calendar page that dated that edition.",
  },
  {
    id: "opex-2026-11-20",
    kind: "opex",
    title: "Monthly options expiration (November)",
    date: "2026-11-20",
    status: "confirmed",
    source: "OCC: theocc.com expiration calendar — 3rd-Friday standard, checked 2026-08-18",
    impact: "medium",
    symbols: [],
    notes: "Standard monthly expiration.",
  },
  {
    id: "beige-book-2026-11-25",
    kind: "macro-print",
    title: "Fed Beige Book (pre-FOMC edition)",
    date: "2026-11-25",
    status: "confirmed",
    source:
      "FED: two independent federalreserve.gov primaries fetched direct 2026-08-31 — newsevents/2026-november.htm lists 'Beige Book' at 2:00 p.m. on November 25, and the Board's Beige Book schedule page (monetarypolicy/publications/beige-book-default.htm) lists Nov 25 as the eighth and last of the 2026 editions (Jan 14, Mar 4, Apr 15, Jun 3, Jul 15, Sep 2, Oct 14, Nov 25). Promoted estimate -> confirmed 2026-08-31 by its own initial-research session, which held both primaries itself; the no-self-confirm limit binds the proposing sweep, not the researching session, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "THE LAST BEIGE BOOK OF 2026 AND THE LAST ONE THE YEAR'S FINAL DOT PLOT SEES — the Board's FOMC calendar asterisks Dec 8-9 as SEP-associated while Oct 27-28 carries none. ITS CUTOFF INVERTS THE OCTOBER READ: the ~9-day collection convention now has a third data point in the exact analogue slot (Nov-2025 edition, Dallas-prepared 'on information collected on or before November 17, 2025', published 11-26), so this one closes books ~11-16 — AFTER the 11-03 midterms, AFTER cpi-2026-11-10 and ppi-2026-11-13, where the October edition's ~10-05 cutoff preceded everything that mattered. It is therefore the first federal district-level read that can carry post-election anecdote. READ THE DISTRICT REPORTS, NOT THE NATIONAL SUMMARY, and read them for AI-capex/data-center/power-cost language specifically: Nov-2025 already had Cleveland reporting 'a boost from AI data centers' and St. Louis on AI curbing entry-level hiring, and Jul-2026 names data centers as a manufacturing/construction growth driver. STILL NOT TRADABLE: it is second billing on its own morning to pce-2026-11-25 (08:30 ET, confirmed, high, the last PCE the December FOMC ever sees), and the corridor behind it is airtight — market closed 11-26, 1:00 p.m. early close 11-27, blackout from 11-28 through 12-10, and the November Board calendar lists no speeches at all, so the first authoritative interpretation is the 12-09 presser. Same series as beige-book-2026-09-02 and beige-book-2026-10-14; one entry per edition. Discovered during the beige-book-2026-10-14 initial research, off the same Board schedule page that dated it.",
  },
  {
    id: "pce-2026-11-25",
    kind: "macro-print",
    title: "PCE / Personal Income & Outlays (Oct 2026 data)",
    date: "2026-11-25",
    status: "confirmed",
    source:
      "BEA: bea.gov/news/schedule lists verbatim \"November 25, 8:30 AM — Personal Income and Outlays, October 2026\" (re-fetched 2026-08-29) — PROMOTED estimate→confirmed by the pce-2026-11-25 initial research: the `estimate` label came from this lane's ADJACENCY rule (a *discovered* event is proposed as an estimate, never confirmed), which governs discovery during a pulse, not an event's own never-assessed research; precedent aws-reinvent-2026, promoted by the same lane on a primary. checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "The last PCE the 12-09 FOMC sees — BEA's own schedule puts the next release on 12-23, fourteen days after the meeting — and the ONLY Q4 month the year's final SEP will observe (SEP inflation is Q4/Q4). Lands three days before the 11-28 blackout, in a week where 11-26 is closed and 11-27 is a 1:00pm ET half session, so it is priced with no official interpretation until the 12-09 presser. Third reading on the post-annual-update series (the methodology change lands 09-30). Shares its 08:30 ET slot with the Q3 GDP second estimate. It is also the OCTOBER reference month, which the pce-2026-10-29 research identifies as the genuinely compromised release in a funding-lapse branch — one month later than this calendar's inherited framing assumed. 2025 precedent is exact: because BLS never produced the full October CPI, BEA published October PCE with the price index INTERPOLATED — 'an average of BLS' September and November CPI data' — folded into a combined Oct+Nov release on 2026-01-22, nine weeks late. A number that exists but is partly synthetic, feeding the gauge Warsh reaffirmed as the 2% target on 2026-08-28. Discovered during the pce-2026-10-29 initial research; assessed 2026-08-29.",
  },
  {
    id: "fomc-blackout-start-2026-11-28",
    kind: "macro-print",
    title: "FOMC communications blackout begins (through 2026-12-10)",
    date: "2026-11-28",
    status: "confirmed",
    source:
      "FED: federalreserve.gov/monetarypolicy/files/fomc-blackout-period-calendar.pdf — PDF re-fetched and its content streams inflated 2026-08-31; its footnote states the policy verbatim ('the blackout period will begin at 12:00 a.m. Eastern Time the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting... if the Committee meeting starts on a Tuesday, the blackout period will begin at the start of the Saturday that falls ten days earlier, and if the meeting ends on a Wednesday, the blackout period will end at the end of Thursday'). The FOMC calendar re-fetched the same session lists 'December 8-9*' (asterisk = SEP meeting); Dec 8 2026 is a Tuesday and Dec 9 a Wednesday, so the source's own worked example gives Saturday 2026-11-28 through Thursday 2026-12-10 with no inference of ours. PROMOTED estimate->confirmed by the fomc-blackout-start-2026-11-28 initial research, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "THE GATE THAT OUTLIVES THE DECISION BY A FULL SESSION — the finding its own research banked, and the reason it is not a duplicate of fomc-2026-12-09. The Fed decides 12-09 (14:00 statement, 14:30 presser) but the gate runs to 23:59 on 12-10, and cpi-2026-12-10 prints at 08:30 that morning, so the November CPI the dot plot never saw arrives ~18.5 hours after the presser with no participant permitted to respond until Friday 12-11. Verified against BLS release archives, this is unusual: 2021 (CPI 12-10 / FOMC 12-14-15), 2022 (12-13 / 12-13-14), 2023 (12-12 / 12-12-13) and 2024 (12-11 / 12-17-18) all had the print before the vote, and 2025 missed it only because the shutdown pushed it to 12-18 — 2026 is the first UNFORCED miss in six years. jobs-2026-12-04 also lands inside the gate, but that is ordinary (2023 did the same). Front edge: pce-2026-11-25 (08:30, confirmed, high) and beige-book-2026-11-25 (14:00, confirmed) both land 11-25 with NO Fed speech scheduled in November at all, then 11-26 closed and a 1:00 p.m. close 11-27 (nyse.com), so the practical deadline for a Fed voice is the 11-25 close. Watch the CR cliff: the House CR expires 12-04 and the Senate's 12-11 (neither enacted), so whichever passes expires inside or on the edge of this gate — see government-funding-deadline-2026-09-30. Discovered during the beige-book-2026-11-25 initial research.",
  },
  {
    id: "aws-reinvent-2026",
    kind: "sector",
    title: "AWS re:Invent 2026 (Las Vegas)",
    date: "2026-11-30",
    status: "confirmed",
    source: "IR: aws.amazon.com/events/reinvent — Nov 30–Dec 4 Las Vegas, checked 2026-08-19",
    impact: "medium",
    symbols: ["AMZN"],
    notes:
      "AWS is the whole AMZN thesis right now ($496B backlog); natural catalyst window ~4wks post-print.",
  },
  {
    id: "georgia-senate-runoff-2026-12-01",
    kind: "geopolitical",
    title: "Georgia (and Mississippi) US Senate general runoff — conditional on no 50% winner",
    date: "2026-12-01",
    status: "estimate",
    source:
      "NEWS: georgia.gov's own election-calendar event page names 'Election Day - General Election Runoff' on Tuesday 2026-12-01 and states the 50%+1 rule (fetched 2026-08-29); O.C.G.A. § 21-2-501 sets the runoff on the 28th day after the general and reaches federal offices (2026-11-03 + 28 = 2026-12-01), read via Justia/FindLaw search summaries since Justia 403'd on fetch. Mississippi's coincident 12-01 runoff rests on secondary summaries (Ballotpedia/Wikipedia) plus SB2144 (2024), which moved MS runoffs from three weeks to four — the legislature's own server failed TLS verification on fetch, checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "CONDITIONAL — this fires only if no Senate candidate clears 50% on 2026-11-03. The date is now PRIMARY-sourced (georgia.gov), so `estimate` here means conditionality, not date doubt; it also cannot be promoted because this calendar has no confirmed source prefix for a state election authority (a schema change, not this lane's call). PROBABILITY COLLAPSED, TIER UNCHANGED (georgia-senate-runoff-2026-12-01 initial research, 2026-08-29): Georgia runoffs are produced by a third name on the ballot (Libertarians took 2.3% in 2020, 2.1% in 2022), and the Libertarian Party of Georgia lost automatic ballot access on its 2024 vote share then submitted a few hundred of ~72,000 required signatures by the 2026-07-07 deadline — the November ballot is Ossoff (D) vs Collins (R), two names, so somebody clears 50% by arithmetic (polling agrees independently: 56-43 Fox, 50-43 InsiderAdvantage 08-18). The surviving branch is MISSISSIPPI, not Georgia — three names (Hyde-Smith (R) / Colom (D) / Pinkins (I)) with the leader at 44% — but it is Solid R / Safe R at all three handicappers, so a runoff there delays a near-foregone seat rather than holding Senate control open. `impact: high` is kept deliberately because the tier measures consequence-if-fired, never likelihood. Remaining Georgia tail: a certified write-in (notice of intent due 2026-09-08, O.C.G.A. § 21-2-133) plus a razor margin. Louisiana no longer applies: closed party primaries from 2026, plurality general. Discovered during the midterm-elections-2026-11-03 initial research.",
  },
  {
    id: "ism-manufacturing-2026-12-01",
    kind: "macro-print",
    title: "ISM Manufacturing PMI (Nov 2026 data)",
    date: "2026-12-01",
    status: "estimate",
    source:
      "EST: ISM publishes the Manufacturing PMI at 10:00 ET on the first business day of the month (the cadence the confirmed 2026-09-01 entry follows, and the same derivation the 2026-10-01 and 2026-11-02 siblings carry); December 2026's first business day is Tuesday 12-01, with no federal holiday in the window. ismworld.org's ROB calendar was re-fetched direct 2026-09-02 and still 302s to ecommerce.ismworld.org/SSO/Login.aspx, so this is a rule-derived date and nothing more, checked 2026-09-02",
    impact: "high",
    symbols: [],
    notes:
      "Opens the December compound corridor: the first hard activity read of the month, three days ahead of jobs-2026-12-04 and eight ahead of the fomc-2026-12-09 SEP/dot-plot meeting. Prices-paid is the leg that matters into a hawkish regime — the 2026-09-01 edition printed activity cooling (54.6 vs 55.2 est, employment 51.2 vs 53.0 est) with Prices stuck at 71.1, the stagflation-shaped mix that makes a soft labor print un-buyable. Discovered during the jobs-2026-12-04 pulse (2026-09-02): the corridor sweep found this print's entire pre-payroll lead-in untracked while the calendar carries the Sep/Oct/Nov ISM slots.",
  },
  {
    id: "adp-employment-2026-12-02",
    kind: "macro-print",
    title: "ADP National Employment Report (Nov 2026 data)",
    date: "2026-12-02",
    status: "estimate",
    source:
      "EST: FRED's release calendar rid=194 lists an ADP National Employment Report on 2026-12-02 at 07:15 CT (= 08:15 ET), re-fetched direct in full-year view 2026-09-03; the date satisfies both cadence rules the series follows — the first Wednesday of December, and two sessions before the BLS-confirmed 12-04 payrolls Friday. Filed estimate because a FRED forward calendar is a projection and ADP has not itself named the date; ADP's own naming arrives in the body of the 11-04 release, the same promotion path verified on two prior editions (the 2026-08 release named 09-30; the 2025-10 release named 2025-12-03), checked 2026-09-03",
    impact: "medium",
    symbols: [],
    notes:
      "The successor edition, keeping the tracked ADP series continuous past 11-04 — held to ONE successor, the same restraint the 09-02 and 09-30 editions applied, and ADP's weekly NER Pulse is again deliberately not tracked. Unlike 11-04 this one lands on a clean morning, but inside the year's densest policy corridor: one week before the 12-09 FOMC (the SEP + dot-plot meeting), nine days before the FY2027 CR expires on 12-11, and two sessions before the 12-04 payrolls print it previews. It also lands inside the 11-28→12-10 FOMC blackout that fomc-blackout-start-2026-11-28 tracks, so no participant may respond to it. It is the first ADP read whose reference month is fully post-midterm. Discovered during the adp-employment-2026-11-04 initial research.",
  },
  {
    id: "ism-services-2026-12-03",
    kind: "macro-print",
    title: "ISM Services PMI (Nov 2026 data)",
    date: "2026-12-03",
    status: "estimate",
    source:
      "EST: ISM publishes the Services PMI at 10:00 ET on the third business day of the month (the cadence the confirmed 2026-09-03 entry follows, and the same derivation the 2026-11-04 sibling carries); December 2026's first three business days are Tue 12-01, Wed 12-02 and Thu 12-03. ismworld.org's ROB calendar was re-fetched direct 2026-09-02 and still 302s to ecommerce.ismworld.org/SSO/Login.aspx, so this is a rule-derived date and nothing more, checked 2026-09-02",
    impact: "high",
    symbols: [],
    notes:
      "Lands 10:00 ET the day BEFORE jobs-2026-12-04 — the last activity read before the payroll that feeds the 12-09 dots, and it carries its own employment index. READ IT, DO NOT TRADE IT: the ism-services-2026-11-04 initial research measured all 8 of 2026's services releases and found release-day moves in TLT/^TNX/SPY/QQQ/XLF/IWM statistically nil, and this event's own research added that the 10:00 ET release HOUR is quieter than an ordinary hour in four of five instruments (hourly bars, n=167 sessions). WHY IT STILL MATTERS, which is the finding its own ledger banked: every federal November-reference price print lands AFTER the 12-09 vote (CPI 12-10, PPI 12-15, import/export 12-17, PCE 12-23), and this is the only 2026 services print inside an FOMC blackout (11-28→12-10) — so ISM mfg Prices Paid 12-01, this print's Prices index, and average hourly earnings on 12-04 are the Committee's entire November-data price picture. Informational, never tradable. Discovered during the jobs-2026-12-04 pulse (2026-09-02) alongside its manufacturing sibling; the earlier attribution of the eight-release measurement to the 09-03 ledger was wrong and is corrected here.",
  },
  {
    id: "jobs-2026-12-04",
    kind: "macro-print",
    title: "Employment Situation (Nov 2026 data)",
    date: "2026-12-04",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/empsit.htm — 08:30 ET, checked 2026-08-17",
    impact: "high",
    symbols: [],
    notes: "First leg of the Dec 4→9→10 compound window (jobs → FOMC+dots → CPI).",
  },
  {
    id: "ecb-quiet-period-start-2026-12-09",
    kind: "macro-print",
    title: "ECB quiet period begins (through the 2026-12-17 decision)",
    date: "2026-12-09",
    status: "estimate",
    source:
      "EST: ecb.europa.eu/ecb-and-you/explainers/tell-me/html/what-is-the_quiet_period.en.html, re-fetched direct 2026-09-05, states the rule verbatim — Governing Council members 'and their alternates' observe a quiet period in which they 'avoid making comments that could influence expectations about monetary policy decisions' in 'the seven days before a scheduled meeting' on this issue, with interviews and conference speeches restricted. Applied to the 16-17 December 2026 meeting (ecb.europa.eu press/calendars/mgcgc, re-fetched 2026-09-05: 'Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 1)' 16/12/2026), seven days before Day 1 gives start 2026-12-09. Filed estimate on the same three counts as ecb-quiet-period-start-2026-10-21: the ECB publishes NO dated quiet-period calendar (unlike the Fed's blackout PDF, which is why fomc-blackout-start-* entries carry FED:), the explainer does not state whether the seven days count from Day 1 or the decision day (Day 1 taken as the earlier, more conservative reading), and CONFIRMED_PREFIX has no slot for a non-Fed central bank. Checked 2026-09-05",
    impact: "low",
    symbols: [],
    notes:
      "The December analogue of ecb-quiet-period-start-2026-10-21, and it dates a deadline rather than a catalyst: the last unrestricted Governing Council commentary before the 12-17 decision comes on 2026-12-08. That matters more in December than in October because ecb-decision-2026-12-17 is where the euro cycle's ~50bp terminal disagreement actually resolves — it is the horizon-extending projection round (December rounds add a year: the 2025-12-18 statement's path spans 2025-2028 against June 2026's 2026-2028, so 12-17 publishes a first-ever 2029 HICP cell) and the only meeting in this calendar's window carrying a projection round, a fresh flash HICP (Nov flash 2026-12-01) and the full November HICP at 17/12/2026 12:00 CET, 2h15m before the 14:15 CET decision. Note the collision worth a line: this gate falls on the SAME DAY as fomc-2026-12-09, so the euro speech window closes on the US decision date. NO PRICE CHANNEL AND NONE CLAIMED: symbols: [], no house playbook is rates-keyed, and ecb-account-2026-10-08's own measurement puts 13 ECB accounts and 13 ECB decisions (2025-26) at 0.97x-1.17x an ordinary day for the Euro Stoxx 50, the DAX and EUR/USD alike. Its one asymmetry, inherited: a quiet period removes the official offset, so a euro-area surprise landing inside 12-09 -> 12-17 meets no interpretation on the record. Discovered during the ecb-decision-2026-12-17 initial research (2026-09-05). Estimate widens caution only; it licenses no date-keyed action. Ledger: docs/research/events/ecb-decision-2026-12-17.md.",
  },
  {
    id: "fomc-2026-12-09",
    kind: "macro-print",
    title: "FOMC decision (meeting Dec 8–9, SEP + dot plot)",
    date: "2026-12-09",
    status: "confirmed",
    source: "FED: federalreserve.gov FOMC calendar — statement 14:00 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "cpi-2026-12-10",
    kind: "macro-print",
    title: "CPI release (Nov 2026 data)",
    date: "2026-12-10",
    status: "confirmed",
    source: "BLS: bls.gov/schedule/news_release/cpi.htm — 08:30 ET, checked 2026-08-15",
    impact: "high",
    symbols: [],
  },
  {
    id: "ercot-data-center-audit-filing-2026-12-10",
    kind: "sector",
    title: "ERCOT Batch Zero data-center audit filing (target) — Texas interconnection pause",
    date: "2026-12-10",
    status: "estimate",
    source:
      "NEWS: Utility Dive, 'ERCOT aims to complete Texas governor's data center audit by December' — ERCOT SVP of regulatory policy and general counsel Chad Seely at a PUCT open meeting on 2026-08-20, quoted verbatim: 'Our goal is to head toward a December 10 filing'. A stated internal goal, not a regulatory deadline — confirmed against the primary this event's initial research reached: Abbott's 2026-08-03 directive at gov.texas.gov orders the audit completed 'before any data center project moves forward' but names NO completion date, and ERCOT's own estimate of the verification process is 'several months, but less than nine months' from August. What lands on 12-10 is now specified: two reports (Batch Zero Eligibility Verification + Community Impact Review) into PUCT Docket 59220, taken up at the 2026-12-17 PUCT open meeting. Still estimate: no PUCT primary was reachable (interchange.puc.texas.gov and puc.texas.gov both failed TLS validation on 2026-09-02, after 503s on 08-19 and a TLS failure on 08-24), so the docket number is newsletter-sourced and no filing states the 12-10 date. ERCOT market notices at ercot.com WERE reached, checked 2026-09-02",
    impact: "medium",
    symbols: [],
    notes:
      "The date that actually gates the Texas data-center pause, which is currently the only dated, quantified DOWNWARD revision to AI-driven load growth on this calendar. On 2026-08-03 Governor Abbott ordered PUCT and ERCOT to run a 'comprehensive verification and audit of all data centers advancing through ERCOT's interconnection process' before any additional data center may proceed, concluding that non-complying projects 'must be denied'; ERCOT holds ~474 GW of interconnection requests (~90% data centers, >5x its record peak demand), with ~300 projects of 75 MW or larger inside the Batch Zero process. The August-2026 EIA STEO priced the consequence immediately, cutting its Texas 2027 electricity-load-growth forecast from 14% to 6% in a single month. Why it matters to this book: docs/research/ai-energy-constraint.md names ERCOT and PJM as the only two deregulated markets where the AI-power windfall accrues, and its frontier map assumes load growth is the binding input. CORRECTED by this event's initial research (2026-09-02): this filing is NOT 'the checkpoint at which the queue reopens or stays shut' as first filed — it is NECESSARY BUT NOT SUFFICIENT. The audit must complete before any data center advances, but the Batch Zero STUDY that actually classifies and energizes loads has already lost its 2027-04-09 deadline (Seely, 2026-08-20: 'We will not have the study done by April 9, 2027 ... we're still working on what that new timeline might be'), so no branch reopens the ERCOT queue in 2026. ERCOT has also missed both dated milestones set under this audit — the 08-07 classification deadline (M-A080326-01) and the 08-31 conditional classifications the PUCT itself ordered on 08-20 (M-A080326-03, 'ERCOT requires additional time'). Tiered `medium`, not `high`: it is a filing against a self-set goal with no statutory deadline, easily slipped, and it reprices no tracked name directly (`symbols: []` — the channel to CRWV is siting and narrative, not revenue). Sits two days after the December STEO (12-08) and on CPI day (12-10). Discovered during the eia-steo-2026-09-09 initial research (2026-09-02). DOCKET CORRECTION (puct-batch-zero-report-open-meeting-2026-12-17 initial research, 2026-09-02): the 'Docket 59220' this entry's source carries is WRONG — 59220 is the Crusoe/FGE Goodnight 1/Ensign net-metering case, ordered 2026-07-23 (525.5 MW curtailment obligation behind a 265.5 MW wind farm, the first SB 6 test case). ERCOT's Batch Zero filings run under 59142, where it filed three good-cause exceptions on 2026-08-10 and where interchange document 59142_20_1620380.PDF ('ERCOT Large Load Batch Study Update') sits; the December reports most plausibly land there. The error came from a single newsletter, which is itself a reason to keep the 12-17 agenda item at estimate grade.",
  },
  {
    id: "g20-sherpa-iv-miami-2026-12-10",
    kind: "geopolitical",
    title: "G20 Sherpa Meeting IV — Miami (final pre-summit drafting session)",
    date: "2026-12-10",
    status: "estimate",
    source:
      'EST: g20.org/events-calendar/ — the US host government\'s own G20 events calendar, a state.gov-run .gov site — lists "Sherpa Meeting IV (Miami, Florida) / December 10 - December 12, 2026" immediately above "Leaders\' Summit (Miami, Florida) / December 14 - December 15, 2026". Fetched direct 2026-09-04 with a full browser header set (the page 403s to a plain fetcher, which is why the g20-miami-2026-12-14 initial research could not read it). Primary-sourced, but filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep AND because CONFIRMED_PREFIX has no slot for a host-government diplomatic calendar. Checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "THE LAST OBSERVABLE TELL ON WHETHER THE DORAL SUMMIT HAS CONTENT — NOT, AS THIS NOTE ORIGINALLY CLAIMED, THE EARLIEST (corrected by its own initial research, 2026-09-04). Sherpas finalize the leaders' declaration text; this is the final such session before g20-miami-2026-12-14, in the same city, four days ahead of it. But the same host calendar dates Sherpa Meeting III (Washington, 2026-10-01/02) and the Foreign Ministers' Meeting (Atlanta, 2026-10-30/31), both earlier points at which the state of the leaders' text — and any Chinese objection of the kind that forced the Asheville chair's statement (2026-08-31/09-01, China alone dissenting from paragraphs 4, 10, 11 and 13) — is observable. This entry's distinctive property is finality, not primacy; its low-band cadence puts the ledger's next pulse at 2026-10-04, two days after Sherpa III, so the earlier tell is covered without a calendar entry of its own. Filed LOW deliberately, and the no-price-channel claim is now MEASURED rather than asserted: S&P close-to-close across four dated sherpa windows (Mewat 2023-09-03/07, Rio 2024-11-12/17, Sherpa I 2025-12-15/16, Sherpa II 2026-06-29/30) ran 5 of 11 sessions above their own year's median and 1 of 11 above p90 — an ordinary session, eleven times over. Attribution off these dates is impossible anyway: the window's only market sessions are 12-10 (cpi-2026-12-10, the day after fomc-2026-12-09) and 12-11 (government-funding-deadline-2026-12-11 / cr-expiry-2026-12-11), with 12-12 a Saturday, so no price forward test is registrable here at all. Read it as a document tell, never as a trade. Ledger: docs/research/events/g20-sherpa-iv-miami-2026-12-10.md. Discovered during the g20-summit-doral-2026-12-14 duplicate-resolution pass (2026-09-04).",
  },
  {
    id: "cr-expiry-2026-12-11",
    kind: "geopolitical",
    title: "Continuing-resolution expiry — FY2027 funding lapses absent further action",
    date: "2026-12-11",
    status: "estimate",
    source:
      "NEWS: the House adopted the Senate stopgap 370-48 on 2026-09-01, funding agencies through December 11 (Roll Call 2026-09-01 'The House easily cleared a stopgap spending bill Tuesday that would keep federal agencies funded through Dec. 11'; UPI, Breaking Defense, Washington Post concur on date and count; Senate passed 90-6 on 2026-08-08). congress.gov returned HTTP 403 on fetch, so there is no bill-level primary, and the bill was NOT yet signed at time of check — the president was reported 'expected to sign it in short order'. Estimate on both counts, checked 2026-09-02",
    impact: "high",
    symbols: [],
    notes:
      "The second dated checkpoint the midterm-elections-2026-11-03 entry deliberately left un-proposed 'until the chambers reconcile which' of Dec 4 (House) or Dec 11 (Senate) — 2026-09-01 reconciled it to the Senate's Dec 11, so it is proposed now. Placement is the whole point, and this entry's initial research (2026-09-02) CORRECTED the original note's read of it twice. It lands TWO DAYS AFTER the 12-09 FOMC and ONE DAY AFTER cpi-2026-12-10, but it is NOT inside the blackout gate: fomc-blackout-start-2026-11-28 decoded the Board's own PDF and the gate runs 11-28 00:00 through 12-10 23:59, so 12-11 is the FIRST session in thirteen days on which a Fed official may speak — the first official response to a CPI the dot plot never saw, landing on the day funding expires at midnight. Nor would a lapse begin in that session: funding runs THROUGH 12-11 (a Friday), so a lapse starts 00:00 Saturday 12-12, the first exposed market session is Monday 12-14, and day 7 is triple-witching opex-2026-12-18. Second correction: the original note's 'Senate control unresolved into the vote' framing is weaker than stated — georgia-senate-runoff-2026-12-01's own research measured that branch as near-dead on ballot arithmetic (a two-name Georgia ballot clears 50%), leaving Mississippi, which is Safe R at all three handicappers. It sits 10 days after that conditional runoff and 35 days after jobs-2026-11-06 — far enough that the October reference month this calendar's BLS prints measure is not exposed to it, which is the reason the jobs-2026-11-06 pulse that discovered it recorded the exposure as retired for November and live for December. The lapse itself remains conditional and un-forecast here; the government-funding-deadline-2026-09-30 ledger owns the base rates (S&P median 0.0% during 22 funding gaps since 1976; the durable cost is informational, not price). WHAT THE INITIAL RESEARCH ADDED (docs/research/events/cr-expiry-2026-12-11.md, 2026-09-02): it DECLINES to inherit the 09-30 sibling's aversion base case, because that case rested on an incentive to fund past the midterms and this date is what that incentive bought — the pattern for a lame-duck deadline after a chamber changes hands runs the other way (Government Executive 2026-08-06; the one configuration match, 2018-12-21, ran 35 days). Action is unchanged — stand aside, symbols: [] — and the exposure is again informational, but one reference month forward: a lapse from 12-12 puts the December CPS interview week (12-13 to 12-19 unshifted) inside it, unless BLS's documented November/December holiday shift moves interviewing to 12-06 to 12-12 and completes it first. DUPLICATE FLAGGED, NOT FIXED: government-funding-deadline-2026-12-11 tracks this same fact, filed the same day by the jobs-2026-10-02 sweep; consolidating the two is proposed follow-up work, deliberately left to a session that owns both entries. Discovered during the jobs-2026-11-06 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "government-funding-deadline-2026-12-11",
    kind: "geopolitical",
    title: "CR expiry — FY2027 funding lapses 2026-12-12 absent new appropriations",
    date: "2026-12-11",
    status: "estimate",
    source:
      "NEWS: the House adopted the Senate-passed CR 370-48 on 2026-09-01, funding the government through Dec 11 and sending it to the President (Roll Call / The Hill / Washington Post / ABC / Breaking Defense / Washington Times, all 2026-09-01; Senate leg passed 08-08, 90-6). Presidential signature NOT verified — checked 2026-09-02",
    impact: "high",
    symbols: [],
    notes:
      "The follow-on cliff government-funding-deadline-2026-09-30 deliberately left unfiled: its note says verbatim that no entry was filed 'because the date is conditional on which CR is enacted; file one once that is known.' The House adopting the SENATE's Dec 11 version on 2026-09-01 is that resolution — so the Dec 4 branch is dead and jobs-2026-12-04 sits INSIDE the funded window, not on the cliff. Filed `estimate`, not `confirmed`, for two independent reasons: this lane never self-confirms an event in the PR that discovers it, and the presidential signature could not be verified this session (a search hit titled 'Trump signs continuing resolution' surfaced undated, described a signing 'just after midnight Thursday' when 09-01 was a Tuesday, and is most likely the 2025 analogue — discarded). Why it is tracked at `high`: on the same 2025 precedent that drives its 09-30 sibling, BLS DELETES rather than delays in a lapse. jobs-2026-12-04 and cpi-2026-12-10 both print BEFORE this date and are safe either way; the exposed tracked event is pce-2026-12-23, whose own research already notes it 'sits OUTSIDE the funded corridor' and whose 2025 analogue was cancelled outright, plus every January release. Discovered during the jobs-2026-10-02 pulse-check adjacency sweep (2026-09-02).",
  },
  {
    id: "g20-miami-2026-12-14",
    kind: "geopolitical",
    title: "G20 Leaders' Summit (21st) — Trump National Doral, Miami",
    date: "2026-12-14",
    status: "estimate",
    source:
      "NEWS: treasury.gov press release sb0398 (2026-02-19), fetched direct 2026-09-04, states verbatim \"The United States' G20 host year will culminate with President Trump's Leaders' Summit on December 14-15, at Trump National Doral in Miami, Florida\" — a US-host-government primary, corroborated by CBS News on the venue announcement, the g20.org events calendar, City of Doral and Wikipedia '2026 G20 Miami summit'; State Dept confirms the US hosting year via its first G20 Sherpa meeting (2025-12). Treasury Sec. Bessent named 'a December G20 in Florida' as one of three venues for China trade talks in May-2026 remarks. STAYS ESTIMATE ON A SCHEMA GAP, NOT ON DOUBT (upgraded rationale, 2026-09-04 initial research): CONFIRMED_PREFIX documents TSY: as a treasury.gov AUCTION schedule, so no honest confirmed prefix exists for a host-government diplomatic calendar — the same gap us-china-tariff-truce-expiry-2026-11-10 and china-retaliation-suspension-expiry-2026-12-31 record. g20.org/location and the state.gov Atlanta foreign-ministers release both returned HTTP 403 to a plain fetcher and were not read direct. HOST-PRIMARY NOW READ (2026-09-04, duplicate-resolution pass): g20.org/events-calendar/ retrieved 200 with a full browser header set and lists verbatim \"Leaders' Summit (Miami, Florida) / December 14 - December 15, 2026\" — the host government's own calendar, independent of treasury.gov sb0398 and agreeing with it. The label still cannot move: no CONFIRMED_PREFIX slot exists for a diplomatic calendar. Xi's attendance remains reported-as-scheduled, never confirmed. Checked 2026-09-04",
    impact: "medium",
    symbols: [],
    notes:
      "THE LAST PRE-DEADLINE VENUE, AND THE REASON THE 12/31 LEG READS DIFFERENTLY FROM THE 11/10 ONE. It sits 17 days before china-retaliation-suspension-expiry-2026-12-31 and 34 days after us-china-tariff-truce-expiry-2026-11-10 — so for the December leg all three venues Bessent named (trump-xi-summit-2026-09-24, apec-leaders-shenzhen-2026-11-18, this) fall before the clock they would extend, the inverse of the November leg's problem where two of three land after it. Reporting as of 2026-09-02 describes Trump and Xi as scheduled to meet in Washington in September, Shenzhen in November and here in December; that ladder is what makes a lapse-by-inattention on 12/31 unlikely and keeps that event a watch rather than a hedge. Day 1 of the two-day window per house convention. Estimate widens caution only. Discovered during the china-retaliation-suspension-expiry-2026-12-31 initial research (2026-09-04). ITS OWN INITIAL RESEARCH (2026-09-04) ADDS TWO THINGS. First, a G20 summit has NO price channel of its own — the only two in the modern sample that moved US equities did so through a Trump-Xi bilateral on the sidelines (Buenos Aires 2018-12-01: S&P +1% on 12-03, then fully round-tripped 12-04 on the 'Tariff Man' walk-back, Dow -799; Osaka 2019-06-29: S&P +0.77% to a record 2,964.33 on 07-01), so the base rate is n=2 for the bilateral and n=0 for the summit. Second, the DATE IS THE HAZARD: ten tracked events sit within +/-5 days (fomc-2026-12-09, cpi-2026-12-10, ercot-data-center-audit-filing-2026-12-10, government-funding-deadline-2026-12-11, cr-expiry-2026-12-11, ppi-2026-12-15, pjm-capacity-auction-2026-12, import-export-prices-2026-12-17, puct-batch-zero-report-open-meeting-2026-12-17, opex-2026-12-18), plus AVGO's Q4 FY26 print listed by aggregators at 2026-12-10 and NOT carried in earnings-calendar.ts — so never attribute a 12-14/15 tape move to this summit. Multilateral side is fracturing (China dissented from four paragraphs of the US chair's own Asheville statement 2026-09-01; South Africa disinvited, Poland added; Putin 'may or may not attend'), which lowers the odds of the joint deliverable that is the sole mechanism by which this could move prices. Ledger: docs/research/events/g20-miami-2026-12-14.md. DUPLICATE RESOLVED INTO THIS ENTRY (2026-09-04): the same summit was filed twice on the same day by two initial-research sessions that discovered it independently — this entry (from china-retaliation-suspension-expiry-2026-12-31) and g20-summit-doral-2026-12-14 (from apec-leaders-shenzhen-2026-11-18). event-scan-validation.mjs checks for duplicate IDS, not duplicate EVENTS, so nothing caught it. This id survives on three counts: it already carries the merged ledger and a closed tracking issue, its date rests on a treasury.gov primary rather than Wikipedia, and it matches the host's own branding ('G20 Miami 2026'). The retired entry's one non-overlapping fact is preserved here: SCMP (2026-09-02) ties Trump's APEC Shenzhen attendance to whether Xi agrees to come to Doral — a quid pro quo pointing from this summit BACK to apec-leaders-shenzhen-2026-11-18, not forward.",
  },
  {
    id: "pjm-capacity-auction-2026-12",
    kind: "sector",
    title: "PJM capacity auction window closes",
    date: "2026-12-15",
    status: "estimate",
    source: "EST: docs/research/ai-energy-constraint.md watch list — confirm vs pjm.com",
    impact: "medium",
    symbols: [],
    notes: "AI-datacenter power-cost signal (the energy-constraint watch list's dated indicator).",
  },
  {
    id: "ppi-2026-12-15",
    kind: "macro-print",
    title: "PPI release (Nov 2026 data)",
    date: "2026-12-15",
    status: "confirmed",
    source:
      'BLS: bls.gov/schedule/news_release/ppi.htm ("November 2026 | Dec. 15, 2026 | 08:30 AM") and bls.gov/schedule/2026/12_sched.htm ("Producer Price Index / November 2026 / 08:30 AM" on the 15th) — two independent BLS schedule views, both fetched direct 2026-08-31 with a UA header (both 403 to plain fetchers). Flipped from estimate by the ppi-2026-12-15 initial research, checked 2026-08-31',
    impact: "medium",
    symbols: [],
    notes:
      "The first inflation print AFTER cpi-2026-12-10, and — with BEA's next Personal Income and Outlays not until 12-23 — the only other inflation read the market gets between the 12-09 FOMC and year-end. Its real job is as a PCE nowcast, not a CPI tell: PPI's portfolio-management, health-care and airfare lines feed the 12-23 core PCE directly, and the next FOMC after 12-09 is not until 2027-01-26/27 (FED calendar), so this print lands in a 43-day policy vacuum. Discovered during the cpi-2026-12-10 pulse-check adjacency sweep and filed estimate then; its own research session re-fetched the BLS primary and confirmed it.",
  },
  {
    id: "retail-sales-2026-12-16",
    kind: "macro-print",
    title: "Retail Sales — advance monthly (Nov 2026)",
    date: "2026-12-16",
    status: "confirmed",
    source:
      'CENSUS: census.gov/retail/release_schedule.html lists the Advance Monthly Retail Trade Report for November 2026 data on "December 16, 2026", 08:30 ET, fetched direct 2026-09-01',
    impact: "high",
    symbols: [],
    notes:
      "The print that publishes the REVISION to the 11-17 advance estimate, and the FIRST AND ONLY Census read on the Thanksgiving/Black Friday/Cyber Monday weekend (2026-11-26/27/30) — which the 11-17 print does NOT contain, a misread its ledger flags explicitly. Also the first retail print that sits BEYOND BOTH LIVE CR EXPIRY CANDIDATES (House Dec 4, Senate Dec 11), so the appropriations risk the 09-16/10-15 ledgers made their dominant variable migrates to this slot rather than to 11-17. Lands one week after the 12-09 FOMC + SEP. Discovered during the retail-sales-2026-11-17 initial research, read off the next row of the same Census release schedule. Filed `confirmed` rather than the adjacency sweep's usual `estimate` because the date came from the Census primary release schedule — the same page and `CENSUS:` prefix that seeded the 09-16, 10-15 and 11-17 entries.",
  },
  {
    id: "ecb-decision-2026-12-17",
    kind: "macro-print",
    title: "ECB Governing Council monetary-policy decision + press conference (Frankfurt)",
    date: "2026-12-17",
    status: "estimate",
    source:
      "EST: ecb.europa.eu Governing Council monetary-policy meeting calendar (press/calendars/mgcgc), fetched direct 2026-09-05 — the December 2026 entries read verbatim 'Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 1)' on 16/12/2026 and 'Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 2), followed by press conference' on 17/12/2026. Primary-sourced, but filed estimate per the event-research lane's no-self-confirm limit and because CONFIRMED_PREFIX has no slot for a non-Fed central bank, the same gap ecb-decision-2026-09-10 records. Checked 2026-09-05",
    impact: "medium",
    symbols: [],
    notes:
      "The meeting where the euro cycle's ~50bp terminal disagreement actually resolves, and the already-registered scoring date for FT-ecb-decision-2026-09-10-2 (deposit rate above 2.50% after this decision = the futures strip beat the Reuters poll) — which until now named a date this calendar did not track. It is the next meeting AFTER 10-29 to carry staff projections, since those run March/June/September/December only; ecb-decision-2026-10-29's initial research found that gap is exactly why October is priced as a skip rather than a step (~50/50 for a December move to 2.75%, press-cited 2026-09-05). NO PRICE CHANNEL IS CLAIMED, same as the September and October entries: `symbols: []`, no house playbook is rates-keyed, and euro policy reaches this book only second-order via dollar translation and global term premium, both already owned by the FOMC entries. Note the stack — it shares the date with import-export-prices-2026-12-17 and lands one day before December triple witching (opex-2026-12-18) and eight days after fomc-2026-12-09. Discovered during the ecb-decision-2026-10-29 initial research (2026-09-05). Estimate widens caution only; it licenses no date-keyed action.",
  },
  {
    id: "import-export-prices-2026-12-17",
    kind: "macro-print",
    title: "U.S. Import and Export Price Indexes (Nov 2026 data)",
    date: "2026-12-17",
    status: "estimate",
    source:
      'EST: bls.gov/schedule/2026/12_sched.htm lists "U.S. Import and Export Price Indexes / November 2026 / 08:30 AM" on Thursday the 17th (fetched direct 2026-08-31). Primary-sourced, but filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep, checked 2026-08-31',
    impact: "low",
    symbols: [],
    notes:
      "The tariff pass-through gauge, and the third inflation read of the same corridor — two days after ppi-2026-12-15 and the morning before December triple witching (opex-2026-12-18). Low impact on its own; tracked because it closes the Dec 15→18 inflation-into-expiry corridor. Discovered during the ppi-2026-12-15 initial research.",
  },
  {
    id: "puct-batch-zero-report-open-meeting-2026-12-17",
    kind: "sector",
    title: "PUCT open meeting — ERCOT Batch Zero audit reports taken up",
    date: "2026-12-17",
    status: "estimate",
    source:
      "NEWS: Global Data Center Hub places a 'PUCT open meeting presentation' of ERCOT's two Batch Zero audit reports on 2026-12-17, corroborated in shape by Utility Dive's account of ERCOT SVP/GC Chad Seely at the 2026-08-20 PUCT open meeting describing delivery 'a week prior to the PUCT's December open meeting'. THE MEETING DATE IS NOW CORROBORATED (this event's initial research, 2026-09-02): ercot.com/committees/puct lists 'Dec 17, 2026' and ercot.com/calendar/12172026-PUCT-Meeting gives 9:30 AM, Travis Building Commissioners Hearing Room 7-100 — on a verified every-other-Thursday cadence (Nov 05, Nov 19, Dec 03, Dec 17), and it is the last PUCT meeting of 2026 (next 2027-01-14). THE AGENDA ITEM IS NOT: it rests on one newsletter, whose 'Docket 59220' attribution that research REFUTED (59220 is the Crusoe/FGE Goodnight 1/Ensign net-metering case ordered 2026-07-23; ERCOT's Batch Zero filings run under 59142). Still estimate, and still no PUCT primary — www.puc.texas.gov, interchange.puc.texas.gov and ftp.puc.texas.gov all failed TLS chain validation, the fourth consecutive session unable to reach one (503s 2026-08-19, TLS 2026-08-24, TLS 2026-09-02). ERCOT's own calendar and market-notice archive WERE reached, checked 2026-09-02",
    impact: "low",
    symbols: [],
    notes:
      "The venue where ERCOT's 2026-12-10 filing actually gets taken up — proposed by the ercot-data-center-audit-filing-2026-12-10 initial research (2026-09-02) because that ledger's central finding is that the 12-10 filing is NECESSARY BUT NOT SUFFICIENT: Governor Abbott's 2026-08-03 directive (gov.texas.gov, primary) bars data centers from advancing until the audit completes but sets no deadline, while the Batch Zero STUDY that actually energizes loads has already lost its 2027-04-09 deadline on ERCOT's own record. So 12-10 delivers two reports (Batch Zero Eligibility Verification + Community Impact Review) and this meeting is the first moment a body with authority responds to them. Tiered `low`, not `medium`: no order is expected here, `symbols: []`, and a low tier keeps the cadence cheap (every 30d until D-15). Filed rather than carried as a watch trigger — unlike the Georgia PSC hearings, which were sub-steps of their own docket BEFORE its tracked date — because this is a different body acting on the tracked event's output AFTER it, in a week clean of the 12-10 corridor (FOMC 12-09, CPI 12-10, CR expiry 12-11, PPI + PJM auction 12-15) where a reaction is at least legible. The 2027-04-09 study deadline is deliberately NOT filed: ERCOT has said it will not be met. AMENDED by this event's own initial research (2026-09-02), which kept the `low` tier but corrected two of the claims above. (1) 'No order is expected here' is too strong: the PUCT GRANTED all three of ERCOT's good-cause exceptions from its 2026-08-20 open meeting, so this venue orders when a filing ASKS for something — the tell is whether the 12-10 filing requests relief (most plausibly a replacement for the abandoned 2027-04-09 study timeline), which would make 12-17 a decision date and reopen the tier. (2) The week is NOT clean: the +/-5d corridor holds ppi-2026-12-15, pjm-capacity-auction-2026-12, import-export-prices-2026-12-17 (same morning, 08:30 ET) and opex-2026-12-18 triple witching the next session, and the meeting opens 10:30 ET mid-session — cleaner than the 12-10 corridor, but evaluate on filings, never on price. Structural addition: 12-17 is the LAST PUCT meeting of 2026, so any slip costs 28 days (next meeting 2027-01-14).",
  },
  {
    id: "opex-2026-12-18",
    kind: "opex",
    title: "Quarterly options expiration — triple witching (December)",
    date: "2026-12-18",
    status: "confirmed",
    source: "OCC: theocc.com expiration calendar — quarterly triple-witching, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes: "Year-end triple witching — expiries stack with index rebalancing and tax-loss flows.",
  },
  {
    id: "pce-2026-12-23",
    kind: "macro-print",
    title: "PCE / Personal Income & Outlays (Nov 2026 data)",
    date: "2026-12-23",
    status: "confirmed",
    source:
      'BEA: bea.gov/news/schedule re-fetched direct 2026-08-31 as RAW HTML and tag-stripped in-session, which yields the line the previous pass could not see — "December 23 | 8:30 AM | Personal Income and Outlays, November 2026" verbatim, alongside "GDP (Third Estimate), Industries, Corporate Profits, State GDP, and State Personal Income, 3rd Quarter 2026" in the same 8:30 slot. The earlier EST: label came from a TRUNCATED parse of this same page, not from a missing source; this entry\'s own note set the bar ("confirm against a clean bea.gov/news/schedule line") and that bar is now met. Flipped from estimate by the pce-2026-12-23 initial research, checked 2026-08-31',
    impact: "high",
    symbols: [],
    notes:
      "The gap in an already-tracked series — PCE runs 08-26 -> 09-30 -> 10-29 -> 11-25 and then stopped. It matters here because it is the LAST inflation read of 2026 and the fourth to land after the 12-09 vote: the Dec 8-9 Committee set both its decision and its dots without cpi-2026-12-10 (which printed the next morning), and by the time fomc-minutes-2026-12-30 publishes, the tape has also absorbed ppi-2026-12-15, import-export-prices-2026-12-17, opex-2026-12-18 and this print. Next FOMC after 12-09 is not until 2027-01-26/27 (FED calendar), so this is the last inflation data point of a 48-day policy vacuum. EXISTENCE RISK IS THE HEADLINE (pce-2026-12-23 initial research, 2026-08-31): the 2025 analogue of this exact release was CANCELED — BEA's own release page states the Oct+Nov 2025 report 'replaces releases originally scheduled for November 26 and December 19, 2025' — and published combined on 2026-01-22, 34 days late. And unlike pce-2026-11-25, this print sits OUTSIDE the funded corridor: the House CR expires 12-04 and the Senate's 12-11, both before this date. Second structural note: 12-23 is the last full session before a 1:00pm ET close 12-24 and a closed 12-25 (nyse.com), the same holiday trap as 11-25 — and the measured Christmas-week PCE slot (+0.59% / +0.17% / +1.09% close-to-close) is matched by +0.88% in 2025 when there was no print at all, so a green session here is the null, not a signal.",
  },
  {
    id: "fomc-minutes-2026-12-30",
    kind: "macro-print",
    title: "FOMC minutes (Dec 8-9 meeting)",
    date: "2026-12-30",
    status: "confirmed",
    source:
      "FED: two federalreserve.gov primaries re-fetched direct 2026-08-31 — newsevents/2026-december.htm lists 'FOMC Minutes' at 2:00 p.m. on December 30, and monetarypolicy/fomccalendars.htm states the convention verbatim ('The minutes of regularly scheduled meetings are released three weeks after the date of the policy decision'), with Dec 9 + 21 days = Wednesday 2026-12-30 and all five published 2026 meetings obeying the rule (Jul 28-29 -> Aug 19). The prior estimate note's caveat — the December page's 2025-06-24 last-update stamp — was tested and DISPROVED this session: the August 2026 page carries the same June-2025 stamp while naming 'Chairman Kevin Warsh', a title he did not hold on that date, so the stamp tracks the page skeleton and not its contents. PROMOTED estimate->confirmed by the fomc-minutes-2026-12-30 initial research, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "The minutes of the year's final SEP meeting, and the only structured account of a vote taken WITHOUT the November CPI — cpi-2026-12-10 printed the morning after the decision (see fomc-blackout-start-2026-11-28). That makes the dissent language and any discussion of the missing inflation read worth more than a usual set of minutes, and it lands in the 43-day policy vacuum before the 2027-01-26/27 FOMC that ppi-2026-12-15's research named. Read it, do not trade it — minutes are three weeks stale by publication. Same series as fomc-minutes-2026-10-07 and fomc-minutes-2026-11-18; one entry per meeting. Discovered during the fomc-blackout-start-2026-11-28 initial research, off the December Board calendar fetched that session.",
  },
  {
    id: "china-retaliation-suspension-expiry-2026-12-31",
    kind: "geopolitical",
    title:
      "China's market-based tariff-exclusion process for US imports expires (Kuala Lumpur leg 2)",
    date: "2026-12-31",
    status: "estimate",
    source:
      "NEWS: whitehouse.gov fact sheet of 2025-11 ('President Donald J. Trump Strikes Deal on Economic and Trade Relations with China'), fetched direct and read clause-by-clause 2026-09-04, attaches December 31 2026 to EXACTLY ONE commitment, verbatim: 'China will further extend the expiration of its market-based tariff exclusion process for imports from the United States and exclusions will remain valid until December 31, 2026.' Its retaliatory-tariff, non-tariff-countermeasure and rare-earth clauses carry no end-date at all. Filed estimate: the commitment is US-side reporting of a Chinese action, and no MOFCOM/State Council primary was read. Checked 2026-09-04",
    impact: "medium",
    symbols: [],
    notes:
      "SCOPE CORRECTED BY ITS OWN INITIAL RESEARCH (2026-09-04) — the id and the original title assert a retaliatory-tariff/countermeasure snapback on this date, and there is none. China's State Council Tariff Commission on 2025-11-05 REMOVED (not suspended) the 10-15% March-2025 retaliatory tariffs on ~740 US agricultural commodity lines effective 2025-11-10; a removal has no expiry clock. Every countermeasure that DOES carry a clock runs to 2026-11-10 — the 24% reciprocal countertariff, the April-4-2025 unreliable-entity listings (the March-4 listings were removed outright), and MOFCOM/GAC Announcement No. 70's suspension of the six 2025-10-09 export-control announcements — i.e. they belong to us-china-tariff-truce-expiry-2026-11-10, not here. So this is that cliff's 51-day TAIL on its narrowest leg, not a second cliff. What is genuinely on this clock is China's standing tariff-relief channel for US goods, expiring mid-way through the unfinished $30bn 'reciprocal tariff reduction' agreed in principle at the 2026-05-13/15 Trump state visit to China (USTR dockets 2026-0430/0431; Skadden reads the vehicle as a bilateral Trade Council, NOT this exclusion process — a timing collision, not an established mechanism). GEOMETRY INVERTS VS 11/10: all three venues Bessent named in May 2026 fall BEFORE this deadline — trump-xi-summit-2026-09-24, apec-leaders-shenzhen-2026-11-18, and g20-miami-2026-12-14 — so the after-the-deadline renewal problem the 11/10 entry flags does not apply here. No symbol this calendar tracks carries the exposure; it is agricultural, and that complex had already run 10-17% in the month to 2026-09-03 on at least three drivers (China buying, Black Sea port damage, NW Corn Belt drought), so the ag tape is not a read on this date. Lands in a holiday-thinned session alongside georgia-psc-data-center-cost-shift-2026-12-31 and one day after fomc-minutes-2026-12-30. Estimate widens caution only. Discovered during the us-china-tariff-truce-expiry-2026-11-10 initial research (2026-09-04); ledger: docs/research/events/china-retaliation-suspension-expiry-2026-12-31.md.",
  },
  {
    id: "georgia-psc-data-center-cost-shift-2026-12-31",
    kind: "sector",
    title: "Georgia PSC data-center cost-shift investigation — findings due",
    date: "2026-12-31",
    status: "estimate",
    source:
      "NEWS: the proceeding is PSC Docket 57171, 'RTP Revenue Credit and Allocation Methodology' (psc.ga.gov docket + commission-calendar pages, fetched 2026-08-29): status Open, opened 2026-06-02, hearings 2026-09-01 / 10-15 / 11-12. The DATE tracked here — findings due 2026-12-31 — is press-reported only (WABE; The Current 2026-07-08; GovTech 2026-07-10), never seen in a fetched PSC scheduling order, and no filings were listed on the docket page; the unanimous vote to investigate is reported 2026-07-07 by most outlets (Rough Draft Atlanta's 'Tuesday, July 8' is internally inconsistent — July 7 is the Tuesday and the PSC's administrative-session day). Stays estimate: the date is press-sourced AND this calendar has no confirmed prefix for a state utility commission, checked 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "Georgia's instance of the AI data-center backlash the midterm-elections-2026-11-03 research named as the real political channel to this book's AI-infra sleeve — and unlike a campaign theme it has a regulator, a proceeding and a deadline. PSC staff put the potential shift at up to 11% per month on the average residential bill by 2028; Commissioner Hubbard cites ~$1B in fuel costs data centers pay nothing toward and ~$118M of firm gas transportation at issue in 2027. Context: the PSC certified 9,985 MW of new generation on 2025-12-19 (~80% expected to serve data centers) and base rates are frozen through 2028. Same shape as the tracked texas-puct-audit-2026-08-20 entry — a state regulator's dated proceeding as an AI-energy watch item. Discovered during the georgia-senate-runoff-2026-12-01 initial research. Initial research 2026-08-29 (docs/research/events/) found the dollar figures are a rate-CLASS reallocation, revenue-neutral to Georgia Power/Southern (base rates frozen through 2028; the freeze excludes pass-through fuel, the bucket in dispute) and far too small to reach hyperscaler capex — no earnings channel, a precedent channel. The structural catalyst is that 12-31 findings reach the current 3R-2D commission while remedies fall to the one seated January 2027, decided by the 2026-11-03 PSC elections in Districts 3 and 5.",
  },
  {
    id: "nerc-computational-load-standards-2026-12-31",
    kind: "sector",
    title:
      "NERC deadline to file mandatory reliability standards for computational load (FERC Docket RD26-7-000)",
    date: "2026-12-31",
    status: "estimate",
    source:
      'NEWS: FERC\'s order of 2026-07-16 in Docket No. RD26-7-000 directs NERC to file one or more new or modified mandatory reliability standards governing "computational load" — defined in the order as "load comprised of power demand from information technology equipment, such as servers, storage, and networking hardware" — by December 31, 2026, following the large-load orders of FERC\'s 2026-06-18 open meeting. PROVENANCE UPGRADED 2026-09-04 (this event\'s initial research), on the NERC side only: nerc.com\'s own Project 2026-02 Computational Loads page was fetched DIRECT (HTTP 200 with a full browser header set; it 403s a plain fetcher) and carries the machinery that exists solely to meet this deadline — draft standards CLO-001-1, CLO-002-1, CLO-003-1 plus FAC-001-5/FAC-002-5, a 30-day formal comment period open through "8:00 p.m. Eastern, Friday, September 18, 2026", ballot pools formed through 2026-09-03, and initial ballots "September 9 - 18, 2026". The FERC ORDER itself is still not primary-read: ferc.gov returns HTTP 403 behind a Cloudflare interstitial to both a plain fetcher and a full browser header set (second consecutive session), and elibrary.ferc.gov serves an Angular SPA whose search API could not be reached headlessly. Its terms therefore rest on three independent secondary reads that agree on every checkable field — Willkie Farr client alert 2026-07-30 (PDF streams inflated in-session, citing Reliability Standard(s) Pertaining to Computational Load Integration, 196 FERC para 61,031 (2026)), Troutman 2026-07-22, and POWER Magazine 2026-07-16 — so this stays NEWS: rather than FED:. Discovered during the gastech-2026-09-14 initial research, checked 2026-09-04',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS A DATED FEDERAL MARKER ON THIS CALENDAR'S EXISTING DATA-CENTER-POWER THEME, not for a price channel — there is none on the date itself, which is why low is affirmed rather than raised. The theme is already tracked at the state and RTO level by ercot-data-center-audit-filing-2026-12-10, georgia-psc-data-center-cost-shift-2026-12-31, puct-batch-zero-report-open-meeting-2026-12-17 and the PJM capacity-auction entries; this is the nationwide federal instrument on the same question, and it is the first one with a deadline. WHAT THE DATE IS: a FILING deadline, not an order — NERC submits proposed standards to FERC, which then reviews them, so 12-31 starts a process rather than concluding one. Swett's stated rationale, quoted by POWER Magazine: 'Certain large loads like data centers and crypto mining operations that NERC calls computational load have the potential to change their demand almost instantly. And this rapid fluctuation causes voltage stability issues that threaten grid reliability', and 'we must ensure that the critical work of winning the AI race does not threaten reliability in our country.' WHAT IT IS NOT: evidence of a channel to any symbol this calendar keys. No hyperscaler capex, interconnection queue position or utility rate base changes on this date. Discovered during the gastech-2026-09-14 initial research (2026-09-04) because FERC Chairman Laura Swett is a confirmed Gastech 2026 speaker — the conference has no price channel, but the instrument she carries is dated and independent of it, the same 'unilateral agency instrument outranks the multilateral text' structure the g20-energy-abundance-ministerial-houston-2026-09-14 and g20-trade-ministerial-milwaukee-2026-09-30 ledgers found on their own tracks. A later pulse should read the order direct at ferc.gov before this date is leaned on harder than a marker. INITIAL RESEARCH 2026-09-04 (docs/research/events/nerc-computational-load-standards-2026-12-31.md) affirmed low and stand-aside, and found that the tradeable content of the date is zero BY CONSTRUCTION — a NERC filing under FPA section 215 is a proposal, enforceable only after FERC approves it (2027 at the earliest) and after an implementation-plan runway on top. What the session did upgrade is the substance: the draft package would create a new class of NERC-registered functional entity (Glossary terms Computational Load Entity/Owner/Operator, tied to Rules of Procedure Appendix 5B registry criteria), directly exposed to FERC civil penalties of $1,584,648 per violation per day. The one number that matters is the APPLICABILITY THRESHOLD, reported in draft at 'Computational Load Site of >= 50 MW total connected load, supplied through electrical equipment connected to the BPS at >= 100 kV' — BROADER than ERCOT's already-approved 75 MW rule (NOGRR282, PUCT-approved 5-0 on 2026-07-09, NOG sections 2.6.4 and 2.14), where one secondary read costs compliance at $0.5-1M per MW at some facilities. That >= 50 MW figure is single-source secondary; the primary is clo-001-1-draft-1-clean.pdf on nerc.com, located by name but not extracted, and the next pulse's first task. Incident base behind the whole regime: ~1,500 MW of data-center load lost across 60 points and 25 substations in Virginia, July 2024; ERCOT more than 25 events at 100-450 MW; NERC Level 2 alert 2025-09-09 and Level 3 alert 2026-05-04. Registered FT-nerc-computational-load-standards-2026-12-31-1 (files at full scope by 12-31) and -2 (the >= 50 MW threshold survives comment), both score-by 2027-01-15.",
  },
  {
    id: "fomc-blackout-start-2027-01-16",
    kind: "macro-print",
    title: "FOMC communications blackout begins (through 2027-01-28)",
    date: "2027-01-16",
    status: "estimate",
    source:
      "EST: federalreserve.gov/monetarypolicy/files/fomc-blackout-period-calendar.pdf — PDF downloaded and its content streams inflated in-session 2026-08-31; it is titled '2025-2027 FOMC Trading and External Communications Blackout Calendar' (so it spans 2027) and its footnote states the policy verbatim ('the blackout period will begin at 12:00 a.m. Eastern Time the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a meeting... if the Committee meeting starts on a Tuesday, the blackout period will begin at the start of the Saturday that falls ten days earlier, and if the meeting ends on a Wednesday, the blackout period will end at the end of Thursday'). Jan 26 2027 is a Tuesday and Jan 27 a Wednesday, so the source's own worked example gives Saturday 2027-01-16 through Thursday 2027-01-28 with no inference of ours. Filed estimate rather than confirmed (unlike fomc-blackout-start-2026-11-28) because it is a firm rule applied to a TENTATIVE meeting date — fomccalendars.htm states every 2027 date is 'tentative until confirmed at the meeting immediately preceding it'. PROVENANCE UPGRADED 2026-08-31 (this event's initial research): the PDF's vector grid was DECODED rather than derived — composing the text matrix so glyph positions resolve to page coordinates, then hit-testing each day number against the filled rectangles, with the legend resolving grey 0.851 = 'Blackout dates'. Validated first on the PDF's 2026 page, where it returns Sep 5-17 / Oct 17-29 / Nov 28 -> Dec 10, matching all three sibling ledgers exactly; the 2027 page then returns JANUARY 2027: 16-28, the Board's own highlighting with no arithmetic of ours. Status still estimate: decoding the shading raises provenance, not certainty, since the Board shaded those days because it PLANS to meet Jan 26-27. Discovered during the fomc-2027-01-27 initial research, checked 2026-08-31",
    impact: "medium",
    symbols: [],
    notes:
      "The gate around the FOMC's annual ORGANIZATIONAL meeting, which is what makes it worth a slot rather than a duplicate of fomc-2027-01-27: the January meeting is where the Committee reaffirms or revises its Statement on Longer-Run Goals and Monetary Policy Strategy, and 2027-01-26/27 is Chair Warsh's first (his first meeting as chair was 2026-06-17). So the eleven days this gate covers are the last window in which any participant can shape expectations before a potential framework change lands — and the gate outlives the decision by a session, exactly as fomc-blackout-start-2026-11-28 measured for December. Corridor caveat carried from the fomc-2027-01-27 research: what data prints inside this window is NOT knowable as of 2026-08-31 — bea.gov/news/schedule ends at 2026-12-23, bls.gov/schedule/2027 is unreachable (403) and federalreserve.gov/newsevents/2027-january.htm 404s, so no January-2027 data entry is proposed here. Promote to confirmed once the 2026-12-09 meeting confirms the 2027 calendar; the date re-derives from whatever it confirms. INITIAL RESEARCH 2026-08-31 (docs/research/events/fomc-blackout-start-2027-01-16.md) found the macro corridor is unsourceable but the CORPORATE one is knowable by structure, and that is the whole finding: a January FOMC and this book's Q4 mega-cap prints are both pinned to the last week of January, so this is the one gate in the year that overlaps the book's own print cluster. Measured from Yahoo daily bars across NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN over all eight January gates 2019-2026, the gate's FINAL session (the day after the decision, still inside the gate) averaged 2.87% absolute move per name vs a 1.82% January baseline (n=1,316), with 6 of 8 carrying a name past 4% — META +23.3% 2023-02-02, META +10.4% / MSFT -10.0% 2026-01-29 on a flat S&P. Limit stated in the ledger: on medians the overhang (2.26%) and the decision day (2.35%) are indistinguishable, so the surviving claim is 'above baseline, not quiet', and attribution to earnings is structural inference, not sourced (Yahoo quoteSummary 401s). Deployable consequence is one sizing rule — treat 2027-01-28 as an event session rather than post-FOMC calm, with the first legal Fed response only on 2027-01-29 — plus a deadline at the 2027-01-15 close (MLK 01-18 leaves 8 sessions inside the gate). Second finding, disjoint from FT-33 by its own carve-out: the January organizational slot is CONDITIONAL — 6 of the last 8 Januaries published a consensus statement (2020 and 2025 did not) and both skips are live-framework-review years, per the January-2025 minutes. Registered as FT-34 (overhang dispersion, score 2027-01-29) and FT-35 (January publishes at all, score 2027-01-28).",
  },
  {
    id: "fomc-2027-01-27",
    kind: "macro-print",
    title: "FOMC decision (meeting Jan 26–27, no SEP)",
    date: "2027-01-27",
    status: "estimate",
    source:
      'EST: federalreserve.gov/monetarypolicy/fomccalendars.htm fetched direct 2026-08-31 lists "January 26-27" as the first 2027 meeting with no projections asterisk (March 16-17 carries the first 2027 SEP). Filed estimate NOT for want of a primary but because the Fed\'s own page states every 2027 date is "tentative until confirmed at the meeting immediately preceding it" — i.e. the 2026-12-09 meeting confirms this one. Statement time assumed 14:00 ET per the standing convention, not separately sourced. Discovered during the pce-2026-12-23 initial research, checked 2026-08-31',
    impact: "high",
    symbols: [],
    notes:
      "The terminus of the 48-day policy vacuum that opens at fomc-2026-12-09 — a gap three December ledgers (ppi-2026-12-15, fomc-minutes-2026-12-30, pce-2026-12-23) already reason about by hand with no calendar entry to anchor it. Nothing between 12-09 and this date can produce a policy response, which is exactly why the December prints get read as information rather than as catalysts. Two open questions this entry exists to track: whether the Committee sees the December PCE before it votes (BEA's schedule as published 2026-08-31 ends at pce-2026-12-23, and the two most recent analogues split — Dec-2023 data released 2024-01-26 BEFORE that year's Jan 30-31 meeting, Dec-2024 data released 2025-01-31 AFTER the Jan 28-29 one), and whether the blackout arithmetic holds (second Saturday before a Tuesday start = 2027-01-16). No SEP, so this meeting cannot revise the December dots — it can only act on them. Estimate widens caution only; promote once the 12-09 meeting confirms the 2027 calendar. INITIAL RESEARCH 2026-08-31 (docs/research/events/fomc-2027-01-27.md) found the distinguishing feature is the calendar slot, not the rate: this is the FOMC's ANNUAL ORGANIZATIONAL MEETING — where the consensus statement is reaffirmed 'with appropriate revisions' each January — and it is Warsh's first, landing weeks after his five task forces (including one on communications) are due to conclude by year-end 2026; registered as FT-33 rather than asserted, since the only two revisions (2020-08-27, 2025-08-22) were both announced at Jackson Hole in August. Two published facts land with it: the Fed's own rotation table gives 2027 to New York/Chicago/Richmond/Atlanta/San Francisco, so Hammack, Kashkari and Logan — the three-way dissent TO HIKE of 2026-07-29 — are all off the ballot (this changes dissent capacity and the visible split, not the modal path); and Atlanta's incoming vote has been held by interim president Cheryl Venable since Bostic retired 2026-02-28, with no successor timeline as of April-2026 reporting. Measured base rate for the year's first FOMC decision day (Yahoo daily bars, 2019-2026): mean -0.29%, mean |move| 0.94%, 5 of 8 inside +/-0.5%, with the two largest moves confounded by non-Fed drivers (GameStop 2021-01-27; Alphabet -7% on 2024-01-31). A 2027-keyed venue now exists but carries no price: Kalshi's KXFEDDECISION-27JAN-{C26,C25,H0,H25,H26}, expiry 2027-04-28, all active, with no bid/ask/volume on the public API — re-probe each pulse.",
  },
  {
    id: "nerc-computational-load-phase-ii-workplan-2027-03-01",
    kind: "sector",
    title:
      "NERC deadline to file its Phase II work plan for computational-load reliability standards (FERC Docket RD26-7-000)",
    date: "2027-03-01",
    status: "estimate",
    source:
      'NEWS: the same FERC order of 2026-07-16 in Docket No. RD26-7-000 that sets the 2026-12-31 standards-filing deadline also requires NERC to submit an informational filing describing its approach to ADDITIONAL computational-load Reliability Standards by March 1, 2027. Corroborated 2026-09-04 across three independent secondary reads that agree on the date and the deliverable: Willkie Farr client alert 2026-07-30 (PDF text extracted in-session — "FERC also required NERC to submit an informational filing detailing its work plan regarding these additional revisions by March 1, 2027"), Troutman 2026-07-22 ("NERC must submit a detailed workplan by March 1, 2027") and POWER Magazine 2026-07-16. The NERC side is independently visible: nerc.com\'s Project 2026-02 page, fetched direct 2026-09-04, states the Phase I drafting team "would be responsible for advising a follow-up SAR for a Phase II, under development by the LLWG, which would recommend updates to standards across families such as MOD, TOP, IRO, and COM". ferc.gov itself remains unreadable (HTTP 403, Cloudflare) and elibrary.ferc.gov serves an SPA with no reachable search API, so no primary read of the order was obtained and this is NEWS: rather than FED:. Discovered during the nerc-computational-load-standards-2026-12-31 initial research, checked 2026-09-04. AMENDED 2026-09-04 by this event\'s own initial research (docs/research/events/nerc-computational-load-phase-ii-workplan-2027-03-01.md), status UNCHANGED at estimate/NEWS:. Two further independent secondary reads corroborate the date and, more usefully, its CHARACTER as informational: Snell & Wilmer 2026-07-23 ("a March 1, 2027, informational filing describing the next phase of standards development") and AMPYX Cyber 2026-07-21 ("submit a Phase II workplan by March 1, 2027", "informational in nature rather than a directive requiring immediate standards development") — five agreeing reads in total. ferc.gov 403\'d and elibrary.ferc.gov\'s search API returned 522 on a THIRD consecutive attempt, so still no primary read of the order. The Phase II SUBSTANCE is now primary, however: NERC\'s Large Loads Working Group "Final Computational Loads Standard Authorization Request Roadmap" (July 2026), fetched from nerc.com and text-extracted in-session, maps every gap to a recommended SAR/SIR with an "Estimated SAR/SIR Submission By" quarter (Q2 2026 Phase 1 / Q4 2026 / Q1-Q3 2027 / Q4 2027)',
    impact: "low",
    symbols: [],
    notes:
      "PROPOSED AS THE SUCCESSOR FEDERAL INSTRUMENT to nerc-computational-load-standards-2026-12-31, and filed with the same honest limits: no price channel on the date, symbols: [], low affirmed. WHAT THE DATE IS: an INFORMATIONAL filing — a work plan for Phase II, which is one further step removed from enforceability than the 12-31 filing already is (that one is a proposal FERC must still approve; this one is a description of proposals not yet drafted). Its value on this calendar is scope: Phase I covers only the new CLO-001/002/003 standards plus FAC-001-5/FAC-002-5, while Phase II is where computational load reaches the established MOD, TOP, IRO and COM standard families — i.e. where the obligations touch modeling, real-time operations and inter-entity communications broadly rather than as a bolt-on. The one thing worth watching on 03-01 is therefore the BREADTH the work plan claims, not the date. Sibling state/RTO tracking of the same theme: ercot-data-center-audit-filing-2026-12-10, puct-batch-zero-report-open-meeting-2026-12-17, georgia-psc-data-center-cost-shift-2026-12-31 and the PJM capacity-auction entries. A pulse that succeeds in reading ferc.gov or elibrary direct should upgrade this entry and its 12-31 sibling together — they rest on the same unread order. AMENDED 2026-09-04 by initial research: the BREADTH question above is now largely answered in advance, and answered DOWNWARD. NERC's LLWG published the Phase II map itself in July 2026 (the Computational Loads SAR Roadmap, read primary off nerc.com), and it reaches wider than MOD/TOP/IRO/COM — also PRC, BAL, PER, EOP, TPL/FAC and CIP — but its Priority column puts the High-priority items in Phase 1 and Q4 2026, leaving Phase II's Q1-Q3 2027 work graded Medium and its Q4 2027 work graded Low. So Phase II is the residual tier by the authoring body's own scoring, the 03-01 filing looks closer to formalising an existing document than revealing a new one, and low impact is affirmed rather than merely inherited. Caveat kept honest: the roadmap never mentions the FERC order or March 1, 2027, so roadmap-equals-work-plan is inference, registered as FT-nerc-computational-load-phase-ii-workplan-2027-03-01-2.",
  },
  {
    id: "ftc-v-amazon-antitrust-trial-2027-03-29",
    kind: "sector",
    title: "FTC v. Amazon monopolization bench trial begins (W.D. Wash.)",
    date: "2027-03-29",
    status: "estimate",
    source:
      "NEWS: MLex, 'US FTC-Amazon antitrust trial pushed back to March 2027' (article published 2025-12-15, fetched 2026-08-30) reports a scheduling order signed by US District Judge John Chun setting the bench trial for 2027-03-29, trial briefs 2027-03-22, pretrial conference 2027-03-15. The underlying order is a docket entry in FTC et al v. Amazon.com Inc, No. 2:23-cv-01495 (W.D. Wash.), seen only as a Justia docket listing and never fetched — court-ordered but press-relayed here, checked 2026-08-30",
    impact: "medium",
    symbols: ["AMZN"],
    notes:
      "AMZN's largest structural legal overhang, and the first dated checkpoint this calendar carries for it. The date has already reset twice (October 2026 -> 2027-02-09 -> 2027-03-29, the last slip attributed to the late-2025 government shutdown's effect on case schedules), which is itself why it stays `estimate`: a trial date this case has moved twice is a soft date, not a hard one. Tiered `medium` deliberately — the trial START is a process checkpoint, not a decision point (bench trial, no jury, any remedy years further out), so the repricing channel is a slow burn rather than a one-day gap. Discovered during the amzn-2026-10-29-print pulse check (adjacency sweep item 4, policy/legal); it sits ~5 months past that print and carries no read on it. Initial research 2026-08-30 (docs/research/events/ftc-v-amazon-antitrust-trial-2027-03-29.md) confirmed the `medium` tier structurally: Judge Chun BIFURCATED liability from remedies on 2024-09-30, so this proceeding decides liability only and can produce no relief — applying Google's own ~16-month liability->remedy clock puts an AMZN remedy in 2028-2029. It also measured the comparable: the US v. Google search trial OPENING (2023-09-12) moved GOOGL -1.15% against QQQ -1.11%, an excess of -0.04%. Promotion to `confirmed` is additionally blocked by a schema gap — the prefix table above defines no `confirmed` prefix for a federal court docket (third instance of this gap, after a state utility commission and a state election authority).",
  },
  {
    id: "pjm-capacity-auction-2027-05",
    kind: "sector",
    title: "PJM 2030/31 capacity auction — first potentially uncapped print",
    date: "2027-05-15",
    status: "estimate",
    source:
      "EST: esaipower.com auction calendar — BRA 2030/31 May 2027; confirm vs pjm.com, checked 2026-08-17",
    impact: "medium",
    symbols: [],
    notes:
      "FERC collar (accepted 2026-04-28) covers only 2028/29 + 2029/30 — this is the cap-sunset event VST's Tier-2 gate keys on.",
  },
];
