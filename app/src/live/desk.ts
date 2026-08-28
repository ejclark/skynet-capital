/**
 * The desk's client model (#738 phase 2c) — the JSON twin of `/u/:id`'s blotter, plus the
 * Issues-style filter grammar the desk's filter bar speaks. Types mirror
 * `src/observatory/desk-json-view.ts` by hand (same contract note as board.ts). Every displayed
 * value arrives server-formatted; the one raw numeric (`totalPlRaw`) exists for FILTERING only.
 */

export type Tone = "pos" | "neg" | "flat";

export interface DeskPosition {
  readonly symbol: string;
  readonly display: string;
  readonly detail: string;
  readonly isOption: boolean;
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayPct: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly totalPlRaw: number;
  readonly returnPct: string;
  readonly totalTone: Tone;
  readonly weightPct: number;
}

export interface DeskTiles {
  readonly openPositions: number;
  readonly invested: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly unrealized: string;
  readonly unrealizedNote: string;
  readonly unrealizedTone: Tone;
  readonly cash: string;
}

export interface Desk {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
  readonly tiles: DeskTiles;
  readonly positions: readonly DeskPosition[];
}

export interface DeskSnapshot {
  readonly generatedAt: string;
  readonly desk: Desk;
}

export async function fetchDesk(id: string): Promise<DeskSnapshot> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/desk/${id} → ${res.status}`);
  return (await res.json()) as DeskSnapshot;
}

/**
 * The filter grammar — the blotter's subset of the Issues bar: bare terms match the display name,
 * `is:option`/`is:share` split by instrument, `pl:>0`/`pl:<0` split by the sign of total P/L.
 * Chips and the query text are ONE model; both sides write this string.
 */
export interface DeskFilter {
  readonly terms: readonly string[];
  readonly option?: boolean;
  readonly plSign?: 1 | -1;
}

export function parseDeskQuery(query: string): DeskFilter {
  const terms: string[] = [];
  let option: boolean | undefined;
  let plSign: 1 | -1 | undefined;
  for (const token of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (token === "is:option") option = true;
    else if (token === "is:share") option = false;
    else if (token === "pl:>0") plSign = 1;
    else if (token === "pl:<0") plSign = -1;
    else terms.push(token);
  }
  return { terms, ...(option === undefined ? {} : { option }), ...(plSign ? { plSign } : {}) };
}

export function matchesFilter(position: DeskPosition, filter: DeskFilter): boolean {
  if (filter.option !== undefined && position.isOption !== filter.option) return false;
  if (filter.plSign === 1 && position.totalPlRaw <= 0) return false;
  if (filter.plSign === -1 && position.totalPlRaw >= 0) return false;
  const haystack = `${position.display} ${position.symbol}`.toLowerCase();
  return filter.terms.every((term) => haystack.includes(term));
}

/** Toggle one qualifier in the query string — the chip side of the bidirectional model. */
export function toggleQualifier(query: string, qualifier: string): string {
  const parts = query.split(/\s+/).filter(Boolean);
  const without = parts.filter((p) => p.toLowerCase() !== qualifier);
  if (without.length !== parts.length) return without.join(" ");
  return [...parts, qualifier].join(" ");
}
