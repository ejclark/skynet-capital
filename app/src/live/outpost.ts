/**
 * THE TRADING OUTPOST's client model (#809 slice 1) — mirrors `OutpostCatalog` in
 * `src/discovery/play-cards.ts`. Same doctrine as the rest of the shell: the client renders the
 * server's answers verbatim and decides nothing. Every card attribute is DERIVED server-side by
 * walking the play itself, so a card here cannot drift from what the play does.
 */

export type PlayAuthorKind = "house" | "member";

export interface PlayAuthor {
  readonly id: string;
  readonly name: string;
  readonly kind: PlayAuthorKind;
}

export type PlayTrigger = "earnings-window" | "event-driven";

export interface PlayTrait {
  readonly id: string;
  readonly label: string;
  /** What the probe actually observed, in words. The receipt behind the label. */
  readonly claim: string;
}

export interface PlayCard {
  readonly id: string;
  readonly symbol: string;
  readonly author: PlayAuthor;
  readonly thesis: string;
  readonly trigger: PlayTrigger;
  readonly window: string;
  readonly size: {
    readonly conservative: number;
    readonly standard: number;
    readonly aggressive: number;
  };
  readonly traits: readonly PlayTrait[];
  readonly evidence: string;
  readonly href?: string;
}

export interface PlayFacet {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

export interface OutpostCatalog {
  readonly cards: readonly PlayCard[];
  readonly authors: readonly PlayFacet[];
  readonly symbols: readonly PlayFacet[];
  readonly triggers: readonly PlayFacet[];
  readonly traits: readonly PlayFacet[];
}

/** The browse filter, as it rides the URL. Every field is a facet id, or absent for "all". */
export interface OutpostFilter {
  readonly author?: string;
  readonly symbol?: string;
  readonly trigger?: string;
  readonly trait?: string;
}

/** Does a card survive the filter? Pure — an absent facet never narrows anything. */
export function cardMatches(card: PlayCard, filter: OutpostFilter): boolean {
  return (
    (filter.author === undefined || card.author.id === filter.author) &&
    (filter.symbol === undefined || card.symbol === filter.symbol) &&
    (filter.trigger === undefined || card.trigger === filter.trigger) &&
    (filter.trait === undefined || card.traits.some((t) => t.id === filter.trait))
  );
}

/** Clicking the facet you already have on takes it off — the whole toggle rule, in one place. */
export function toggleFacet<K extends keyof OutpostFilter>(
  filter: OutpostFilter,
  key: K,
  value: string,
): OutpostFilter {
  const { [key]: current, ...rest } = filter;
  return current === value ? rest : { ...rest, [key]: value };
}

export async function fetchOutpost(): Promise<OutpostCatalog> {
  const res = await fetch("/api/outpost", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`outpost ${res.status}`);
  return (await res.json()) as OutpostCatalog;
}
