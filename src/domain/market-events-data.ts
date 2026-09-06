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
 *               `BLS:` bls.gov release schedule · `FED:` federalreserve.gov FOMC calendar ·
 *               `PJM:` pjm.com auction schedule · `SEC:` an SEC filing ·
 *               `TSY:` treasury.gov / treasurydirect.gov auction schedule ·
 *               `OCC:` options-expiration calendar (theocc.com / Cboe; 3rd-Friday standard) ·
 *               `BEA:` bea.gov release schedule (GDP, PCE) · `CENSUS:` census.gov schedule
 *               (retail sales, durable goods) · `ISM:` ismworld.org PMI calendar ·
 *               `CB:` conference-board.org consumer-confidence schedule · `UMICH:` sca.isr.umich.edu ·
 *               `FHFA:` fhfa.gov HPI release-date table + the published report's own notes
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
  return raw as MarketEvent;
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

/**
 * Read every `<id>.json` under `dir`, then every `proposals/<id>.from-<proposer>.json` for ids no
 * canonical file names (first by file name wins), and return the calendar in `(date, id)` order.
 * Exported so specs can point it at a fixture directory; the default is the real one.
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
  return [...byId.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

export const MARKET_EVENTS: readonly MarketEvent[] = loadMarketEvents();
