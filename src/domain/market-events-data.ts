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
  // Forward Treasury coupon supply (treasurydirect.gov upcoming + treasury.gov tentative schedule,
  // checked 2026-08-18). Long-end reopenings (10/20/30Y, TIPS) move rates hardest; the short-end
  // 2/3Y + FRN auctions are omitted as low-impact (the schedule-automation follow-up ingests those)
  // — with ONE deliberate exception since 2026-08-29, `treasury-3y-note-2026-09-08` below. Warsh's
  // 2026-08-28 keynote pushed the hawkish repricing almost entirely into the FRONT end (2Y +6-9bp,
  // Sep hike odds ~35%->56-59%) while the long end held, so for this one cycle the 3Y is the first
  // coupon auction to price the live hike question. The blanket exclusion still stands for every
  // other 2/3Y date; adding one back needs a dated reason like this, not a habit.
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
    id: "treasury-3y-note-2026-09-08",
    kind: "rates",
    title: "3-Year Treasury Note auction",
    date: "2026-09-08",
    status: "estimate",
    source:
      "EST: treasury.gov upcoming-auctions API (fiscaldata.treasury.gov) lists announce 2026-09-03, auction 2026-09-08, issue 2026-09-15 — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-08-29",
    impact: "medium",
    symbols: [],
    notes:
      "Front-end supply opening the September coupon block (3Y 09-08 → 10Y 09-09 → 30Y 09-10). Newly relevant because Warsh's 2026-08-28 keynote pushed the hawkish repricing almost entirely into the front end (2Y +6-9bp, Sep hike odds ~35%->56-59%) while the long end held — this is the first coupon auction to price that risk. Discovered during the treasury-20y-bond-2026-09-15 pulse-check adjacency sweep.",
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
    status: "estimate",
    source:
      "NEWS: CNBC 2026-08-19 ('Treasury doubles debt buybacks as Bessent moves to steady bond market'), treasury.gov press release sb0607 — checked 2026-08-27",
    impact: "medium",
    symbols: [],
    notes:
      "Bessent's 2026-08-19 announcement doubles nominal long-end liquidity-support buyback operations (10-20Y and 20-30Y sectors) from a $2B to a $4B/operation minimum, effective this date through the refunding quarter's close (2026-11-04) — a fiscal-liquidity support for long-end demand technicals landing the day before the 30Y reopening (09-10). Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep; not previously a dated calendar entry.",
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
      "EST: treasury.gov Tentative Schedule of Treasury Buyback Operations (Q3 2026 refunding, published 2026-08-05) — announce 09-09, operation 09-10 1:40pm ET, settle 09-11; tentative and its $2B cap predates press release sb0607, checked 2026-08-30",
    impact: "medium",
    symbols: [],
    notes:
      "Lands 40 minutes after the 30Y reopening closes on the SAME day (auction 1:00pm ET, buyback 1:40pm ET) and is the first long-end liquidity-support operation on or after sb0607's 09-09 effective date — so its cap should step from the scheduled $2B to the announced $4B/operation minimum, though Treasury has not yet published the updated schedule. Note the sector is 10-20Y, NOT the 20-30Y bucket the reopened bond sits in; the next 20-30Y operation is 2026-09-24. Discovered during the treasury-30y-bond-2026-09-10 pulse-check adjacency sweep.",
  },
  {
    id: "treasury-20y-bond-2026-09-15",
    kind: "rates",
    title: "20-Year Treasury Bond auction (reopening)",
    date: "2026-09-15",
    status: "confirmed",
    source:
      "TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18",
    impact: "high",
    symbols: [],
    notes:
      "Long-end supply the day before the Sep-16 FOMC — the auction that drew today's concession, reopened.",
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
  // Options expiration — 3rd-Friday standard (monthly); quarterly (Mar/Jun/Sep/Dec) is
  // triple/quad witching. Pin risk, dealer gamma, and volume spikes cluster here; kept market-wide.
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
  // Scheduled macro releases beyond CPI/FOMC/jobs/PCE/PPI (agency schedules, checked 2026-08-18).
  // The rate-path movers our long-duration names trade on; second-order surveys (Michigan
  // sentiment, durable goods) and weekly jobless claims are deliberately omitted as low-impact.
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
    id: "adp-employment-2026-09-02",
    kind: "macro-print",
    title: "ADP National Employment Report (Aug 2026 data)",
    date: "2026-09-02",
    status: "estimate",
    source:
      "NEWS: fred.stlouisfed.org/releases/calendar?rid=194 + mediacenter.adp.com release cadence — 08:15 ET, checked 2026-08-27",
    impact: "medium",
    symbols: [],
    notes:
      "Two sessions ahead of BLS payrolls (9/4); private-sector proxy the market leans on pre-NFP, though the ADP-to-NFP correlation runs loose (July ADP printed +44k vs BLS's -23k the same cycle).",
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
    status: "estimate",
    source:
      "EST: challengergray.com 2026 release calendar lists 2026-09-03 (05:30 ET) for August data — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, and the publisher's own calendar carries a 'subject to change' note, checked 2026-08-31",
    impact: "low",
    symbols: [],
    notes:
      "Announced-layoffs proxy, the session before BLS payrolls (9/4) and a sibling of the tracked ADP print (9/2) — it supplies the industry and geographic layoff detail weekly claims do not. Filed `low`, not `medium` like ADP, to respect this file's standing note that second-order labor surveys are noisier than the prints tracked here; weekly jobless claims stay deliberately omitted. Matters this cycle only because Warsh's 2026-08-28 keynote characterised the labor market as stable at full employment and pinned the hawkish case on inflation — announced job cuts are one of the few reads that can contradict the low-firing half of that framing before the 9/5 blackout. (The quoted 'low fire, low hire' phrasing this note previously carried is Powell-era 2025 language, not in the 8/28 remarks; corrected 2026-08-31 during this event's initial research.) Discovered during the jobs-2026-09-04 pulse-check adjacency sweep.",
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
    id: "government-funding-deadline-2026-09-30",
    kind: "geopolitical",
    title: "FY2027 federal funding deadline — shutdown begins 2026-10-01 absent a CR",
    date: "2026-09-30",
    status: "estimate",
    source:
      "NEWS: Conference Board policy backgrounder + CRFB FY2027 appropriations tracker (both 2026-08-12) — FY2026 funds lapse end of 09-30; Senate CR to Dec 11 passed 08-08 (90-6), House CR to Dec 4 passed 07-21 (220-205), neither enacted, checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "Not a print — a dated policy checkpoint that gates whether the federal prints around it exist. ISM (10-01) is a private survey and publishes through a lapse; BLS does not — in the 2025 lapse it skipped the October Employment Situation and cancelled the October CPI outright. So an un-averted lapse removes the 10-02 payrolls and leaves the 10-01 ISM as the corridor's only hard macro read into an Oct 27-28 FOMC with no SEP. Kind `geopolitical` is the closest fit the enum offers for a domestic policy checkpoint (it is scoped to dated checkpoints like a summit or a tariff deadline); the imperfect fit is named, not fixed from this lane. Discovered during the ism-manufacturing-2026-10-01 initial research.",
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
    id: "crwv-fully-connected-2026-09-29",
    kind: "product-launch",
    title: "CoreWeave Fully Connected 2026 (Moscone South, SF) — Sep 29–Oct 1",
    date: "2026-09-29",
    status: "estimate",
    source:
      "NEWS: coreweave.com/fully-connected-2026 states Sep 29–Oct 1 2026, Moscone South, keynotes Intrator/Salanki/Goldberg + NVIDIA's Ian Buck; CoreWeave's own X post (#FullyConnected26) repeats the dates — company-primary but filed estimate per this lane's adjacency rule (a discovered event is proposed, never self-confirmed), checked 2026-08-31",
    impact: "medium",
    symbols: ["CRWV"],
    notes:
      "CoreWeave's own customer/product conference, ~6 weeks before the est. 2026-11-10 Q3 print — the one company-controlled news venue inside the pre-print window, and the venue where product/capacity announcements would land ahead of that print. Two prior crwv-2026-11-10-print pulses (08-17, 08-24) recorded the conference as 'reported for September, no exact date discoverable' and could not propose it; the dates are now on CoreWeave's own site. Day 1 sits on the 09-29 MU print and the 09-30 funding deadline / Chicago PMI / GDP cluster, so the corridor is crowded. Discovered during the crwv-2026-11-10-print pulse-check adjacency sweep.",
  },
  {
    id: "ism-manufacturing-2026-10-01",
    kind: "macro-print",
    title: "ISM Manufacturing PMI (Sep 2026 data)",
    date: "2026-10-01",
    status: "estimate",
    source:
      "EST: ISM publishes the Manufacturing PMI at 10:00 ET on the first business day of the month (the cadence the confirmed 2026-09-01 entry follows); 2026-10-01 is a Thursday — not re-verified against ismworld.org's own calendar, checked 2026-08-29",
    impact: "high",
    symbols: [],
    notes:
      "The national print the Chicago Business Barometer leads by two business days, and the first manufacturing read of Q4. The calendar tracked the 09-01 release and then nothing until CPI 10-14, so the follow-through the 09-30 Chicago print exists to probe was untracked. Discovered during the chicago-pmi-2026-09-30 initial research.",
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
    id: "ppi-2026-11-13",
    kind: "macro-print",
    title: "PPI release (Oct 2026 data)",
    date: "2026-11-13",
    status: "estimate",
    source:
      'EST: bls.gov/schedule/news_release/ppi.htm — its schedule table reads "October 2026 | Nov. 13, 2026 | 08:30 AM" ET (fetched direct 2026-08-31; the page 403s to plain fetchers and needs a UA header). Primary-sourced, but filed estimate per the event-research lane\'s no-self-confirm limit on an event discovered in-sweep, checked 2026-08-31',
    impact: "medium",
    symbols: [],
    notes:
      "Fills the gap in the tracked PPI series (09-10, 10-15, [this], 12-15) — discovered during the ppi-2026-12-15 initial research, where it is the LAST wholesale print before that one and so the base its trend read extrapolates from. Three days after cpi-2026-11-10.",
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
