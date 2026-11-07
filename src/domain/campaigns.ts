/**
 * CAMPAIGNS — a market or sector people want to play, held as a record (#6949 slice 1).
 *
 * The goal (Eric, 2026-11-06): "ensure we have means to include markets and sectors of interest
 * for people to play." A campaign names that landscape: a one-sentence storyline, the GICS sector
 * it sits in, a cast of symbols, the named forces that move them, and open questions that point at
 * conviction claims. The calendar already holds the dated events; a campaign says which of them
 * belong to its story, and why, so research can be steered by it (slice 5's landscape read, the
 * narrator's questions in #6948).
 *
 * A NEW CAMPAIGN IS A RECORD, NEVER A CODE CHANGE (#6949 constraints). Each one is a checked-in
 * JSON file, `src/domain/campaigns/<id>.json`, read at load, the same one-file-per-owner shape the
 * event calendar uses (market-events-data.ts, #1449). A member-crafted campaign (slice 3) compiles
 * from a form into this same record, the way an authored play compiles into a `Playbook` (#809).
 *
 * NO NEW FACTS. Linking reads what the calendar already says: an event links when it names a cast
 * symbol, or when a force's id prefix or kind matches it. A force's prefixes are the same join key
 * a ledger and `SECTOR_MACRO_SERIES` use. The campaign scopes the story only; every honesty rule in
 * docs/process/EVENT-RESEARCH.md still holds for every event it links.
 *
 * HOW A LINKED ITEM IS MARKED. Criterion 3 asks for *measured* or *reported*. A calendar date has a
 * third honest state those two would misname, so a link carries one of three, read off the event's
 * source prefix (the audit trail market-events-data.ts documents):
 *   measured  — a trusted primary prefix (`IR:`, `BLS:`, `FED:`, `TSY:`, …): the publisher's own
 *               schedule, fetched.
 *   reported  — `NEWS:`: press says so; no primary read.
 *   estimated — `EST:`: our own projection from a cadence. Calling it measured would overstate
 *               it, and nobody reported it.
 *
 * Paper only; educational. A campaign never places an order and never sizes one.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { MarketEvent } from "./market-events-types.js";
import { GICS_SECTORS } from "./sector-coverage.js";
import { TICKER_DIRECTORY } from "./ticker-directory/index.js";

type EventKind = MarketEvent["kind"];

/** One role in the cast ("Chips", "Benchmarks") and the symbols that play it. */
export interface CastRole {
  readonly role: string;
  readonly symbols: readonly string[];
  /** The research file(s) the role's symbols were checked against. Never a guess (#6949). */
  readonly source: string;
}

/**
 * A named force that moves the cast — power, rates, export rules. It links an event by the event
 * id's PREFIX (a full id is its own prefix) or by the event's kind; either one is enough.
 */
export interface CampaignForce {
  readonly id: string;
  readonly name: string;
  /** Why this force moves the cast, with the research or code that says so. */
  readonly why: string;
  readonly prefixes?: readonly string[];
  readonly kinds?: readonly EventKind[];
}

/** An open question the landscape should answer, pointing at the conviction claim it tests. */
export interface OpenQuestion {
  readonly question: string;
  /** A conviction id (`ai-dip-2026-10`), as `src/playbooks/conviction-seeds.ts` holds it. */
  readonly conviction: string;
  /** The claim's label in that conviction's call sheet ("3", "2a"). */
  readonly claim: string;
}

export interface Campaign {
  /** Slug; equals the file name. */
  readonly id: string;
  readonly title: string;
  /** One sentence, at most `MAX_STORYLINE` characters. */
  readonly storyline: string;
  /** The GICS sector it sits in, by `GICS_SECTORS`' label. Markets (an ETF anchor) are slice 2. */
  readonly sector: string;
  readonly cast: readonly CastRole[];
  readonly forces: readonly CampaignForce[];
  readonly openQuestions: readonly OpenQuestion[];
  /**
   * Criterion 2: a campaign whose cast holds nothing the order path trades today must say so. The
   * loader refuses a campaign with no tradable cast symbol unless this is true.
   */
  readonly researchOnly?: boolean;
}

/** The storyline cap a member's form will hold too (#6949 criterion 7, #2224's 200-char precedent). */
export const MAX_STORYLINE = 200;

/** Why an event links to a campaign: the cast symbol it names, or the force that matched it. */
export type LinkReason =
  | { readonly via: "cast"; readonly symbol: string }
  | { readonly via: "force"; readonly force: string };

export type Evidence = "measured" | "reported" | "estimated";

/** One event linked to a campaign, with its source and its date as the timestamp (criterion 3). */
export interface CampaignLink {
  readonly event: MarketEvent;
  readonly reasons: readonly LinkReason[];
  readonly source: string;
  /** The event's own date (YYYY-MM-DD) — the calendar's timestamp. */
  readonly at: string;
  readonly evidence: Evidence;
}

/** How the source prefix marks a linked item (see the header). */
export function evidenceOf(source: string): Evidence {
  if (source.startsWith("NEWS:")) return "reported";
  if (source.startsWith("EST:")) return "estimated";
  return "measured";
}

/**
 * Directory buckets that are stocks or US-listed ETFs: the 11 GICS sectors, "ETF" and "Small cap".
 * "Crypto" is out: this plan adds no crypto order path (#6949 constraints).
 */
const TRADABLE_BUCKETS: ReadonlySet<string> = new Set([
  ...GICS_SECTORS.map((s) => s.name),
  "ETF",
  "Small cap",
]);

const TRADABLE_SYMBOLS: ReadonlySet<string> = new Set(
  TICKER_DIRECTORY.filter((e) => TRADABLE_BUCKETS.has(e.sector)).map((e) => e.symbol.toUpperCase()),
);

/**
 * Whether a symbol is a stock or US-listed ETF the order path trades today, as far as the ticker
 * directory knows. Conservative on purpose: the directory is not a whitelist, so a miss here only
 * means "not known tradable", which is what marks a campaign research-only rather than blocking it.
 */
export function isTradable(symbol: string): boolean {
  return TRADABLE_SYMBOLS.has(symbol.trim().toUpperCase());
}

/** Every cast symbol, each once, in cast order. */
export function castSymbols(campaign: Campaign): readonly string[] {
  return [...new Set(campaign.cast.flatMap((r) => r.symbols))];
}

/** Why `event` belongs to `campaign`, or an empty list when it does not. */
export function linkReasons(campaign: Campaign, event: MarketEvent): readonly LinkReason[] {
  const cast = new Set(castSymbols(campaign));
  const reasons: LinkReason[] = event.symbols
    .filter((s) => cast.has(s))
    .map((symbol) => ({ via: "cast", symbol }));
  for (const force of campaign.forces) {
    const byPrefix = force.prefixes?.some((p) => event.id.startsWith(p)) ?? false;
    const byKind = force.kinds?.includes(event.kind) ?? false;
    if (byPrefix || byKind) reasons.push({ via: "force", force: force.id });
  }
  return reasons;
}

/** The events a campaign links, in the order given, each with its reasons, source and mark. */
export function linkEvents(
  campaign: Campaign,
  events: readonly MarketEvent[],
): readonly CampaignLink[] {
  const links: CampaignLink[] = [];
  for (const event of events) {
    const reasons = linkReasons(campaign, event);
    if (reasons.length === 0) continue;
    links.push({
      event,
      reasons,
      source: event.source,
      at: event.date,
      evidence: evidenceOf(event.source),
    });
  }
  return links;
}

/** Counts of linked events by event kind and by force — the slice-1 report, and slice 5's seed. */
export interface LinkCensus {
  readonly linked: number;
  readonly byKind: Readonly<Record<string, number>>;
  /** Events a force matched; one event can count under several forces. */
  readonly byForce: Readonly<Record<string, number>>;
  /** Events that name a cast symbol. */
  readonly byCast: number;
}

const bump = (tally: Record<string, number>, key: string): void => {
  tally[key] = (tally[key] ?? 0) + 1;
};

export function linkCensus(links: readonly CampaignLink[]): LinkCensus {
  const byKind: Record<string, number> = {};
  const byForce: Record<string, number> = {};
  let byCast = 0;
  for (const link of links) {
    bump(byKind, link.event.kind);
    for (const force of new Set(link.reasons.flatMap((r) => (r.via === "force" ? [r.force] : []))))
      bump(byForce, force);
    if (link.reasons.some((r) => r.via === "cast")) byCast += 1;
  }
  return { linked: links.length, byKind, byForce, byCast };
}

// ── The loader ────────────────────────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const SYMBOL_RE = /^[A-Z][A-Z0-9.]{0,9}$/;
const CLAIM_RE = /^\d+[a-z]?$/;
const GICS_NAMES: ReadonlySet<string> = new Set(GICS_SECTORS.map((s) => s.name));

/** The calendar's kinds (scripts/event-scan-validation.mjs holds the same list). A misspelled kind
 *  would match nothing in silence, so the loader refuses it instead. */
const EVENT_KINDS: ReadonlySet<string> = new Set<EventKind>([
  "earnings",
  "macro-print",
  "product-launch",
  "sector",
  "rates",
  "ipo-listing",
  "lockup-expiry",
  "opex",
  "geopolitical",
]);

const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);

type Raw = Record<string, unknown>;
type Fail = (what: string) => never;

function checkHeader(c: Raw, expectedId: string, fail: Fail): void {
  if (!(isText(c.id) && SLUG_RE.test(c.id))) fail("id must be a lowercase slug");
  if (c.id !== expectedId) fail(`id "${String(c.id)}" must equal the file name "${expectedId}"`);
  if (!isText(c.title)) fail("missing title");
  if (!isText(c.storyline)) fail("missing storyline");
  if ((c.storyline as string).length > MAX_STORYLINE)
    fail(`storyline is over ${MAX_STORYLINE} characters`);
  if (!(isText(c.sector) && GICS_NAMES.has(c.sector)))
    fail(`sector "${String(c.sector)}" is not one of the 11 GICS sectors`);
}

function checkCastRole(role: Raw, fail: Fail): void {
  if (!isText(role.role)) fail("a cast role is missing its name");
  if (!(isTextList(role.symbols) && role.symbols.length > 0))
    fail(`cast role "${String(role.role)}" has no symbols`);
  for (const s of role.symbols as string[])
    if (!SYMBOL_RE.test(s)) fail(`cast symbol "${s}" is not an uppercase ticker`);
  if (!isText(role.source)) fail(`cast role "${String(role.role)}" names no source`);
}

function checkForce(force: Raw, fail: Fail): void {
  const id = String(force.id);
  if (!(isText(force.id) && SLUG_RE.test(force.id))) fail("a force id must be a slug");
  if (!(isText(force.name) && isText(force.why))) fail(`force "${id}" needs a name and a why`);
  const prefixes = force.prefixes ?? [];
  const kinds = force.kinds ?? [];
  if (!isTextList(prefixes)) fail(`force "${id}": prefixes must be strings`);
  if (!(isTextList(kinds) && kinds.every((k) => EVENT_KINDS.has(k))))
    fail(`force "${id}": kinds must be calendar event kinds`);
  if ((prefixes as string[]).length + (kinds as string[]).length === 0)
    fail(`force "${id}" matches nothing`);
}

function checkQuestion(q: Raw, fail: Fail): void {
  if (!(isText(q.question) && isText(q.conviction) && isText(q.claim)))
    fail("an open question needs a question, a conviction and a claim");
  if (!CLAIM_RE.test(q.claim as string)) fail(`claim "${String(q.claim)}" is not a claim label`);
}

/**
 * Parse one campaign file, loud on the first problem and naming the file. The record is data a
 * member's form will one day write (slice 3), so every field is checked here rather than trusted.
 */
export function parseCampaign(raw: unknown, file: string, expectedId: string): Campaign {
  const fail: Fail = (what) => {
    throw new Error(`campaigns: ${file}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null) fail("not an object");
  const c = raw as Raw;
  checkHeader(c, expectedId, fail);
  if (!(Array.isArray(c.cast) && c.cast.length > 0)) fail("cast must be a non-empty list");
  for (const role of c.cast as Raw[]) checkCastRole(role, fail);
  if (!Array.isArray(c.forces)) fail("forces must be a list");
  const forceIds = (c.forces as Raw[]).map((f) => f.id);
  for (const force of c.forces as Raw[]) checkForce(force, fail);
  const twice = forceIds.find((id, i) => forceIds.indexOf(id) !== i);
  if (twice !== undefined) fail(`force "${String(twice)}" is listed twice`);
  if (!Array.isArray(c.openQuestions)) fail("openQuestions must be a list");
  for (const q of c.openQuestions as Raw[]) checkQuestion(q, fail);
  if (c.researchOnly !== undefined && typeof c.researchOnly !== "boolean")
    fail("researchOnly must be true or false");
  const campaign = raw as Campaign;
  if (campaign.researchOnly !== true && !castSymbols(campaign).some(isTradable))
    fail("no cast symbol is a stock or US-listed ETF the order path trades; mark it researchOnly");
  return campaign;
}

/** Where campaign files live, relative to the repo root (market-events-data.ts → PATH RESOLUTION). */
const CAMPAIGNS_DIR = join("src", "domain", "campaigns");

/** Read every `<id>.json` under `dir`, sorted by id. Exported so specs can point it at a fixture. */
export function loadCampaigns(dir: string = join(process.cwd(), CAMPAIGNS_DIR)): Campaign[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) =>
      parseCampaign(JSON.parse(readFileSync(join(dir, f), "utf8")), f, basename(f, ".json")),
    );
}

export const CAMPAIGNS: readonly Campaign[] = loadCampaigns();

/** A campaign by id, or undefined. */
export function campaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
