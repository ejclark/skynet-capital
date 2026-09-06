/**
 * The research shelf's client model (#738 phase 6c) — mirrors `ResearchShelfJson`. The call
 * board leads (the house doctrine: research leads with the call); documents stay server-rendered
 * and every href here crosses to one honestly.
 */

export interface ResearchDocLink {
  readonly slug: string;
  readonly title: string;
  readonly lastAssessed: string | null;
  readonly href: string;
}

/** One horizon row of a ledger's decision header, exactly as authored. */
export interface HorizonRow {
  readonly call: string;
  readonly horizon: string;
  readonly confidence?: string;
}

/** The template's four horizon rows, keyed the way the server keys them. */
export type HorizonKey = "today" | "week" | "month" | "quarter";

export interface ResearchCall {
  readonly eventId: string;
  /** The Today row — the pre-#1704 payload shape, kept so older payloads still render. */
  readonly call: string;
  readonly horizon: string;
  readonly confidence?: string;
  readonly href: string;
  /** Every horizon row the ledger states (#1704); absent on a payload from before lenses. */
  readonly horizons?: Partial<Record<HorizonKey, HorizonRow>>;
  /** The TL;DR as plain text — the filter's index and the symbol scope's second net. */
  readonly tldr?: string;
  /** Adjacent event ids from the ledger's probe-ref — the hub count reads these. */
  readonly adjacent?: readonly string[];
  /** When the ledger behind this call was last assessed — null (or absent, pre-#follow-on payload)
   *  when no matching ledger doc carries a stamp. A horizon row is only as fresh as the day it was
   *  authored, which is NOT the event date. */
  readonly lastAssessed?: string | null;
}

export interface ResearchSymbol {
  readonly symbol: string;
  readonly href: string;
  readonly next?: { readonly title: string; readonly date: string };
}

export interface ResearchEvent {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  /** macro-print · earnings · opex · rates · sector · geopolitical · product-launch */
  readonly kind?: string;
  /** critical · high · medium · low */
  readonly impact?: string;
  readonly symbols: readonly string[];
  readonly researched: boolean;
}

/** A day the exchange is closed, or closes early — mirrors the server's MarketClosure. */
export interface ResearchClosure {
  readonly date: string;
  readonly reason: string;
  readonly early: boolean;
}

export interface ResearchShelfData {
  readonly events: readonly ResearchEvent[];
  readonly closures: readonly ResearchClosure[];
  readonly calls: readonly ResearchCall[];
  readonly symbols: readonly ResearchSymbol[];
  readonly studies: readonly ResearchDocLink[];
  readonly ledgers: readonly ResearchDocLink[];
}

export async function fetchResearch(): Promise<ResearchShelfData> {
  const res = await fetch("/api/research", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`research ${res.status}`);
  const raw = (await res.json()) as Partial<ResearchShelfData>;
  // A server from before slice 2 sends no closures; the calendar then colours nothing, honestly.
  return { ...(raw as ResearchShelfData), closures: raw.closures ?? [] };
}

/**
 * THE LENS (#1704) — which horizon row the call board reads. Every ledger carries Today / This
 * week / This month / This quarter (docs/research/events/TEMPLATE.md gates all four); the lens
 * picks one. Week is the default by Eric's call (2026-09-06: "weeks are shorter intervals which
 * foster more opportunity to discuss/banter... Week seems like a good tempo for now"); the month
 * argument — investing is long-term — is the banked revisit condition on the issue.
 *
 * ALL is the lens that is not a time filter (Eric, 2026-09-06: "it would be nice to be able to
 * see information absent of these filters as well… a lens with all research in view/context"):
 * every event is in range, the board reads each ledger's headline row, and the rail shades no
 * span. It is always an explicit token — week stays the silent default.
 */
export type Lens = "day" | "week" | "month" | "quarter" | "all";
export const LENSES: readonly Lens[] = ["day", "week", "month", "quarter", "all"];
export const DEFAULT_LENS: Lens = "week";
export const LENS_LABEL: Record<Lens, string> = {
  day: "today",
  week: "this week",
  month: "this month",
  quarter: "this quarter",
  all: "all research",
};

/**
 * The research query, ONE string, several dimensions (the rail's controls and the chips write
 * these; typing them works identically):
 *   bare words      AND — every term must match the event id, the call, the TL;DR, or a doc title
 *   `sym:NVDA`      OR scope — a watchlist; a ledger is in scope when any listed symbol is on its
 *                   event, leads its id, or is named in its TL;DR (#1704: chips were AND over a
 *                   corpus where 257 of 266 events carry no symbol, so three chips returned nothing)
 *   `kind:opex`     the event's kind · `impact:high` its impact tier · `call:watch` the call class
 *   `on:YYYY-MM-DD` the anchor day · `lens:week` the horizon row and range (`lens:all` — no
 *                   time filter: every ledger, its headline row)
 */
export interface ResearchFilter {
  readonly terms: readonly string[];
  readonly symbols: readonly string[];
  readonly kind?: string;
  readonly impact?: string;
  readonly callClass?: string;
  readonly on?: string;
  readonly lens: Lens;
}

const ON_RE = /^on:(\d{4}-\d{2}-\d{2})$/;
const LENS_RE = /^lens:(day|week|month|quarter|all)$/;
const SYM_RE = /^sym:([a-z]{1,6})$/;
const KIND_RE = /^kind:([a-z-]+)$/;
const IMPACT_RE = /^impact:(critical|high|medium|low)$/;
const CALL_RE = /^call:(stand-aside|watch|act|conditional)$/;
const CONTROLS = [ON_RE, LENS_RE, SYM_RE, KIND_RE, IMPACT_RE, CALL_RE];
const isControl = (token: string): boolean => CONTROLS.some((re) => re.test(token.toLowerCase()));

const firstMatch = (tokens: readonly string[], re: RegExp): string | undefined =>
  tokens.map((t) => re.exec(t.toLowerCase())?.[1]).find(Boolean);

export function parseResearchQuery(query: string): ResearchFilter {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const on = firstMatch(tokens, ON_RE);
  const lens = firstMatch(tokens, LENS_RE) as Lens | undefined;
  const kind = firstMatch(tokens, KIND_RE);
  const impact = firstMatch(tokens, IMPACT_RE);
  const callClass = firstMatch(tokens, CALL_RE);
  const symbols = [
    ...new Set(
      tokens
        .map((t) => SYM_RE.exec(t.toLowerCase())?.[1])
        .filter((sym): sym is string => Boolean(sym))
        .map((sym) => sym.toUpperCase()),
    ),
  ];
  return {
    terms: tokens.filter((t) => !isControl(t)).map((t) => t.toLowerCase()),
    symbols,
    ...(kind ? { kind } : {}),
    ...(impact ? { impact } : {}),
    ...(callClass ? { callClass } : {}),
    ...(on ? { on } : {}),
    lens: lens ?? DEFAULT_LENS,
  };
}

/** Toggle a symbol in the OR scope — the chips' write; every other token survives. */
export function toggleSymbolScope(query: string, symbol: string): string {
  const token = `sym:${symbol.toUpperCase()}`;
  const tokens = query.split(/\s+/).filter(Boolean);
  const same = (t: string) => t.toUpperCase() === token.toUpperCase();
  return (tokens.some(same) ? tokens.filter((t) => !same(t)) : [...tokens, token]).join(" ");
}

/** Word-boundary mention of a symbol in free text — the rule `symbolResearch` uses server-side. */
export function mentionsSymbol(text: string | undefined, symbol: string): boolean {
  return text ? new RegExp(`\\b${symbol}\\b`).test(text) : false;
}

/** The single-valued facets a slot can set: `kind:` · `impact:` · `call:`. */
export type Facet = "kind" | "impact" | "call";
const FACET_RE: Record<Facet, RegExp> = { kind: KIND_RE, impact: IMPACT_RE, call: CALL_RE };

/** Set (or, with undefined, clear) one facet token; every other token survives. */
export function setFacet(query: string, facet: Facet, value: string | undefined): string {
  const re = FACET_RE[facet];
  const kept = query.split(/\s+/).filter((t) => t && !re.test(t.toLowerCase()));
  return (value ? [...kept, `${facet}:${value}`] : kept).join(" ");
}

/** Set the lens token: the default lens writes no token at all, so a plain URL stays plain. */
export function setLens(query: string, lens: Lens): string {
  const kept = query.split(/\s+/).filter((t) => t && !LENS_RE.test(t.toLowerCase()));
  return (lens === DEFAULT_LENS ? kept : [...kept, `lens:${lens}`]).join(" ");
}

/**
 * The row a call shows under a lens — the authored row, or null when the ledger states none for
 * that horizon (honesty: never a neighbouring row in its place). A payload from before lenses
 * carries only the Today row, which still serves the day lens. The all lens selects no horizon,
 * so it shows the ledger's HEADLINE row — the decision header's first line, present on every
 * payload — with its own horizon label still on the card.
 */
export function callForLens(call: ResearchCall, lens: Lens): HorizonRow | null {
  if (lens !== "all") {
    const key: HorizonKey = lens === "day" ? "today" : lens;
    const row = call.horizons?.[key];
    if (row) return row;
    if (key !== "today") return null;
  }
  return {
    call: call.call,
    horizon: call.horizon,
    ...(call.confidence ? { confidence: call.confidence } : {}),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How stale a call's ledger is (follow-on to #1704): a horizon row is authored relative to the
 * ledger's LAST ASSESSMENT date, not the event date — a "This week" row assessed three weeks ago
 * describes an old week. Null when the ledger carries no stamp (honesty: no age claimed from
 * nothing); `stale` past a week, the same rhythm the default lens reads at.
 */
export function assessmentAge(
  lastAssessed: string | null | undefined,
  today: string,
): { readonly days: number; readonly stale: boolean } | null {
  if (!lastAssessed) return null;
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastAssessed}T00:00:00Z`)) / DAY_MS,
  );
  return { days, stale: days > 7 };
}

/** Set (or, with undefined, clear) the anchor day; every other token survives. */
export function setOnDate(query: string, date: string | undefined): string {
  const kept = query.split(/\s+/).filter((t) => t && !ON_RE.test(t.toLowerCase()));
  return (date ? [...kept, `on:${date}`] : kept).join(" ");
}

/** Toggle the day pin: same day clears it, a different day replaces it, text terms survive. */
export function toggleOnDate(query: string, date: string): string {
  const { on } = parseResearchQuery(query);
  return setOnDate(query, on === date ? undefined : date);
}
