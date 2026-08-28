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

export interface ResearchCall {
  readonly eventId: string;
  readonly call: string;
  readonly horizon: string;
  readonly confidence?: string;
  readonly href: string;
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

export interface ResearchShelfData {
  readonly events: readonly ResearchEvent[];
  readonly calls: readonly ResearchCall[];
  readonly symbols: readonly ResearchSymbol[];
  readonly studies: readonly ResearchDocLink[];
  readonly ledgers: readonly ResearchDocLink[];
}

export async function fetchResearch(): Promise<ResearchShelfData> {
  const res = await fetch("/api/research", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`research ${res.status}`);
  return (await res.json()) as ResearchShelfData;
}

/** The research query's two dimensions, ONE string: bare terms match text, `on:YYYY-MM-DD`
 *  pins a calendar day (the rail's control writes it; typing it works identically). */
export interface ResearchFilter {
  readonly terms: readonly string[];
  readonly on?: string;
}

const ON_RE = /^on:(\d{4}-\d{2}-\d{2})$/;

export function parseResearchQuery(query: string): ResearchFilter {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const on = tokens.map((t) => ON_RE.exec(t.toLowerCase())?.[1]).find(Boolean);
  return {
    terms: tokens.filter((t) => !ON_RE.test(t.toLowerCase())).map((t) => t.toLowerCase()),
    ...(on ? { on } : {}),
  };
}

/** Toggle the day pin: same day clears it, a different day replaces it, text terms survive. */
export function toggleOnDate(query: string, date: string): string {
  const { terms, on } = parseResearchQuery(query);
  const kept = query.split(/\s+/).filter((t) => t && !ON_RE.test(t.toLowerCase()));
  void terms;
  return (on === date ? kept : [...kept, `on:${date}`]).join(" ");
}
