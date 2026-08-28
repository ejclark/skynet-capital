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

export interface ResearchShelfData {
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
