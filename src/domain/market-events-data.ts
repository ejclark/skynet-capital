/**
 * The curated forward market-event calendar — the data half of market-events.ts (types + query
 * functions live there). The MarketEvent shape itself lives one leaf further down, in
 * market-events-types.ts, and is imported + re-exported below.
 *
 * ONE FILE PER EVENT (issue #1449, 2026-09-05). Every entry is its own checked-in JSON file,
 * `src/domain/market-events/<id>.json`, and this module assembles them at load. The calendar used
 * to be one hand-maintained array literal in this file, and that literal was the single biggest
 * source of merge conflicts in the repo: every event-research lane owns exactly one event, but all
 * of them appended to the same array, so any two open research PRs conflicted on GitHub by
 * construction (22 of 47 PRs touching the file flagged, median 13.4 h to merge vs 1 min, #1324).
 * Three merge-side fixes in one day — a custom driver (#1340), date-sorted insertion (#1359), and a
 * union attribute on the sibling register (#1334) — each made the LOCAL merge clean and changed
 * nothing on GitHub, whose server-side merge runs no driver and reads no attribute. Splitting the
 * aggregate is the fix that reaches it: a lane amending its own event edits its own file, a lane
 * proposing an adjacent event adds a new file, and plain git merges both every time. Same shape as
 * towncrier's changelog fragments — one file per owner, aggregate on the read side.
 *
 * WHY A CHECKED-IN TABLE (same doctrine as earnings-calendar.ts, unchanged by the split): event
 * dates change rarely, must be reviewable in a diff (a wrong date silently corrupts every window
 * and every assessment keyed to it — and one file per event makes each diff SMALLER, not larger),
 * and the trading path must never fetch the network to decide. The directory read below is
 * synchronous, local and deterministic. Past dates age out safely because every query in
 * market-events.ts ignores them.
 *
 * WHO READS THIS: every value-consumer of MARKET_EVENTS imports it through market-events.ts (the
 * re-export), never from here directly; scripts/event-scan.mjs (the assessment scanner) and
 * scripts/event-material-scan.mjs read the same directory directly, without `npm ci`, and the
 * drift gate in tests/arch/event-scan.spec.ts fails CI if their read and this module's ever
 * disagree. `node scripts/event-scan.mjs --validate` enforces the contract: file name == `id`,
 * known kind/impact/status, honest source prefix, ISO date.
 *
 * ORDER: entries are sorted here by `(date, id)`, the calendar's canonical order (the same order
 * allEvents() and the scanner compute), so nothing depends on directory listing order.
 *
 * DATE POLICY (inherited from earnings-calendar.ts / docs/plans/trade-playbooks.md): an
 * `estimate` may only WIDEN caution; date-keyed action requires `confirmed`. Research is not
 * action — estimate events still get researched — but every trading-adjacent statement written
 * about an event must carry its confirmed/estimate label honestly.
 *
 * SOURCE PREFIXES (the audit trail of HOW a date is known, extending IR:/CAL: from the earnings
 * calendar). `confirmed` requires a trusted prefix; `estimate` requires an honest one:
 *   confirmed — `IR:` company primary source · `CAL:` automated aggregator cross-ref ·
 *               `BLS:` bls.gov release schedule · `FED:` federalreserve.gov's own calendars — the
 *               FOMC calendar and K.8 (Holidays Observed by the Federal Reserve System). Same
 *               publisher, same domain, two tables; the widening is written down here rather than
 *               stretched silently, which is the thing the audit trail exists to prevent ·
 *               `PJM:` pjm.com auction schedule · `SEC:` an SEC filing ·
 *               `TSY:` treasury.gov / treasurydirect.gov auction schedule ·
 *               `OCC:` options-expiration calendar (theocc.com / Cboe; 3rd-Friday standard) ·
 *               `BEA:` bea.gov release schedule (GDP, PCE) · `CENSUS:` census.gov schedule
 *               (retail sales, durable goods) · `ISM:` ismworld.org PMI calendar ·
 *               `CB:` conference-board.org consumer-confidence schedule · `UMICH:` sca.isr.umich.edu ·
 *               `FHFA:` fhfa.gov HPI release-date table + the published report's own notes ·
 *               `ECF:` a federal court's own FILED DOCUMENT, fetched itself — the signed order or
 *               scheduling order as bytes (a RECAP mirror of PACER at
 *               storage.courtlistener.com/recap/…, a court's own site, or a govinfo court PDF),
 *               with URL, HTTP status and size/checksum recorded in `source`, and the governing
 *               clause quoted verbatim. Defined by WHAT WAS FETCHED, not by domain: a docket
 *               LISTING, a Justia/CourtListener HTML page, or press quoting an order is `NEWS:` —
 *               the mirror can lag the docket, so the document is what it guarantees. A date the
 *               order fixes in its own words ("within 30 days of the date of this Order") is
 *               `ECF:` with the one arithmetic step written out; a date projected from a cadence
 *               rule stays `EST:`. Issue #3058: 13 of 13 docket-sourced entries sat at `estimate`
 *               with the court's checksummed signed order in hand, because no slot existed.
 *               Regulatory proceedings (FERC, state PSC/PUC) have no slot yet — deliberately, not
 *               by oversight: no regulatory primary has ever been fetched from a research runner
 *               (ferc.gov 403, puc.texas.gov TLS failure), and a slot with no promotable member is
 *               one nobody can test. The first one read direct reopens it as its own PR.
 *               `FRB:` a regional Reserve Bank's own published release table, research calendar or
 *               speaking schedule (dallasfed.org, newyorkfed.org, philadelphiafed.org,
 *               clevelandfed.org and the other eight District domains). Distinct from `FED:`,
 *               which means the Board's own federalreserve.gov calendar and nothing else — before
 *               this slot existed a District page had no honest confirmed prefix, so twenty
 *               primary-verified survey dates were pinned at `estimate` and one was promoted by
 *               stretching `FED:` over clevelandfed.org (#3117) ·
 *               `NYSE:` nyse.com's own Holidays & Trading Hours table — the exchange's RULE for
 *               full closures and 1:00 p.m. early closes, published three calendar years out ·
 *               `SIFMA:` sifma.org's own U.S./U.K./Japan holiday schedule. Deliberately NOT folded
 *               into `NYSE:`: SIFMA *recommends* a fixed-income schedule where an exchange
 *               *rules* an equity session, and a `sifma-*` entry tracks that recommendation, so
 *               SIFMA is its primary by definition — one prefix would blur the two trust claims ·
 *               `JPX:` jpx.co.jp's own Market Holidays page (the exchange's rule for the Japanese
 *               cash markets; the page itself notes holidays move with Japan's Act on National
 *               Holidays, which the cadence + kill-switch machinery handles the same way it
 *               handles a tentative FOMC date).
 *               These three are per-publisher, matching how the list is already organised
 *               (`CB:`/`UMICH:`/`FHFA:`/`FRB:`), not one `XCAL:`-style class slot: before they
 *               existed, 42 closure-class entries sat at `estimate` with 41 of them recording a
 *               first-hand primary fetch, and 37 research ledgers had each re-argued the same
 *               missing slot one at a time (#2552).
 *   estimate  — `EST:` cadence/reasoning estimate · `NEWS:` press-reported, not primary-verified
 * The scanner's `--validate` mode enforces this mapping.
 *
 * PATH RESOLUTION: relative to `process.cwd()`, the repo root — the same convention
 * src/server/research-service.ts uses for `docs/research/`, and true in every runtime this module
 * has (tsx from the root, rstest from the root, the Docker image's WORKDIR /app). Resolving off
 * `import.meta.url` instead would tie the module to whatever a bundler decides `__filename` is.
 *
 * This file is the LEAF of the pair for market-events.ts: it owns the MARKET_EVENTS instances and
 * imports the MarketEvent shape from market-events-types.ts (a leaf below it). market-events.ts
 * imports (and re-exports) down into this file, and this file re-exports the shape unchanged —
 * one-directional all the way down (market-events.ts → market-events-data.ts →
 * market-events-types.ts), no cycle.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { ImpactTier, MarketEvent } from "./market-events-types.js";

export type { ImpactTier, MarketEvent };

/** Where the per-event files live, relative to the repo root (see PATH RESOLUTION above). */
export const MARKET_EVENTS_DIR = join("src", "domain", "market-events");

/**
 * PROPOSALS (issue #1717) — the one add/add class the per-event split left behind. Two research
 * lanes sweeping adjacencies on the same day can both discover the same dated event and each file
 * it; under one-file-per-event they both created `<id>.json`, and git cannot merge two creations
 * of one path (5 of the first 126 post-split research PRs stuck exactly there). So a proposal is
 * owned by its PROPOSER, not by the event it names: `proposals/<id>.from-<proposer-event-id>.json`,
 * always `status: "estimate"`. Two lanes can never write the same path. At read time the canonical
 * `<id>.json` wins when it exists (the event's own initial research writes it, reading every
 * proposal as input); otherwise the first proposal by file name stands in, deterministically.
 * Proposals shadowed by a canonical file are inert, never deleted by another lane.
 */
export const PROPOSALS_SUBDIR = "proposals";
export const PROPOSAL_FILE_RE = /^([a-z0-9][a-z0-9-]*)\.from-([a-z0-9][a-z0-9-]*)\.json$/;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/**
 * The boot-time shape guard — loud on the first malformed file, naming it. Deliberately the
 * MINIMUM that keeps a consumer from crashing on a bad field (a missing date breaks every window
 * computation); the full contract (known kinds, source-prefix ↔ status, slug ids, a proposer that
 * exists) is the scanner's `--validate`, which runs inside `npm test`.
 */
function parseMarketEvent(raw: unknown, file: string, expectedId: string): MarketEvent {
  const e = raw as Record<string, unknown>;
  const fail = (what: string): never => {
    throw new Error(`market-events: ${file}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("not a JSON object");
  if (!isString(e.id)) fail("missing id");
  if (e.id !== expectedId) fail(`id "${e.id}" does not match the file name`);
  if (!isString(e.kind)) fail("missing kind");
  if (!isString(e.title)) fail("missing title");
  if (!(isString(e.date) && DATE_RE.test(e.date))) fail("date must be YYYY-MM-DD");
  if (e.status !== "confirmed" && e.status !== "estimate") fail(`unknown status "${e.status}"`);
  if (!isString(e.source)) fail("missing source");
  if (!isString(e.impact)) fail("missing impact");
  if (!(Array.isArray(e.symbols) && e.symbols.every((s) => typeof s === "string")))
    fail("symbols must be an array of strings");
  if (e.notes !== undefined && typeof e.notes !== "string") fail("notes must be a string");
  if (e.supersededBy !== undefined && !isString(e.supersededBy))
    fail("supersededBy must be a non-empty event id");
  return raw as MarketEvent;
}

/** A re-slug its own lane has retired (issue #3101) — it keeps its file, its ledger and its
 *  forward-test fragment, and stops being part of the calendar. Applied AFTER the id dedupe below,
 *  never before: a superseded canonical file still shadows its proposals, so retiring an id can
 *  never resurrect it through a proposal nobody has looked at since. */
const isSuperseded = (e: MarketEvent): boolean => e.supersededBy !== undefined;

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

/**
 * Read every `<id>.json` under `dir`, then every `proposals/<id>.from-<proposer>.json` for ids no
 * canonical file names (first by file name wins), drop every entry its own lane has retired with
 * `supersededBy` (#3101), and return the calendar in `(date, id)` order.
 * Exported so specs can point it at a fixture directory; the default is the real one.
 *
 * scripts/market-events-read.mjs implements this same rule for the dependency-free scanners; the
 * drift gate in tests/arch/event-scan.spec.ts fails CI the day the two reads disagree.
 */
export function loadMarketEvents(
  dir: string = join(process.cwd(), MARKET_EVENTS_DIR),
): MarketEvent[] {
  const byId = new Map<string, MarketEvent>();
  for (const f of readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()) {
    const event = parseMarketEvent(readJson(join(dir, f)), f, basename(f, ".json"));
    byId.set(event.id, event);
  }
  const proposalsDir = join(dir, PROPOSALS_SUBDIR);
  if (existsSync(proposalsDir)) {
    for (const f of readdirSync(proposalsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()) {
      const id = f.match(PROPOSAL_FILE_RE)?.[1];
      if (id === undefined)
        throw new Error(`market-events: proposals/${f}: name must be <id>.from-<proposer>.json`);
      const event = parseMarketEvent(readJson(join(proposalsDir, f)), `proposals/${f}`, id);
      if (event.status !== "estimate")
        throw new Error(`market-events: proposals/${f}: a proposal is always status "estimate"`);
      if (!byId.has(event.id)) byId.set(event.id, event);
    }
  }
  return [...byId.values()]
    .filter((e) => !isSuperseded(e))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export const MARKET_EVENTS: readonly MarketEvent[] = loadMarketEvents();
