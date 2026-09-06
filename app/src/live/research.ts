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
 */
export type Lens = "day" | "week" | "month" | "quarter";
export const LENSES: readonly Lens[] = ["day", "week", "month", "quarter"];
export const DEFAULT_LENS: Lens = "week";
export const LENS_LABEL: Record<Lens, string> = {
  day: "today",
  week: "this week",
  month: "this month",
  quarter: "this quarter",
};

/** The research query's three dimensions, ONE string: bare terms match text, `on:YYYY-MM-DD`
 *  pins a calendar day, `lens:week` picks the horizon row (the rail's controls write these;
 *  typing them works identically). */
export interface ResearchFilter {
  readonly terms: readonly string[];
  readonly on?: string;
  readonly lens: Lens;
}

const ON_RE = /^on:(\d{4}-\d{2}-\d{2})$/;
const LENS_RE = /^lens:(day|week|month|quarter)$/;
const isControl = (token: string): boolean => {
  const t = token.toLowerCase();
  return ON_RE.test(t) || LENS_RE.test(t);
};

export function parseResearchQuery(query: string): ResearchFilter {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const on = tokens.map((t) => ON_RE.exec(t.toLowerCase())?.[1]).find(Boolean);
  const lens = tokens
    .map((t) => LENS_RE.exec(t.toLowerCase())?.[1] as Lens | undefined)
    .find(Boolean);
  return {
    terms: tokens.filter((t) => !isControl(t)).map((t) => t.toLowerCase()),
    ...(on ? { on } : {}),
    lens: lens ?? DEFAULT_LENS,
  };
}

/** Set the lens token: the default lens writes no token at all, so a plain URL stays plain. */
export function setLens(query: string, lens: Lens): string {
  const kept = query.split(/\s+/).filter((t) => t && !LENS_RE.test(t.toLowerCase()));
  return (lens === DEFAULT_LENS ? kept : [...kept, `lens:${lens}`]).join(" ");
}

/**
 * The row a call shows under a lens — the authored row, or null when the ledger states none for
 * that horizon (honesty: never a neighbouring row in its place). A payload from before lenses
 * carries only the Today row, which still serves the day lens.
 */
export function callForLens(call: ResearchCall, lens: Lens): HorizonRow | null {
  const key: HorizonKey = lens === "day" ? "today" : lens;
  const row = call.horizons?.[key];
  if (row) return row;
  if (key !== "today") return null;
  return {
    call: call.call,
    horizon: call.horizon,
    ...(call.confidence ? { confidence: call.confidence } : {}),
  };
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
