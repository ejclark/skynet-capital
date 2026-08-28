/**
 * The discovery surface's client model (#738 phase 6a) — mirrors `CollectionsIndexView`. The
 * honesty guards ride the payload: `claim` states what shelf membership means mechanically,
 * `evidence` is each member's receipt, and a persona with no `desk` is an explicit absence.
 */

export interface ShelfMember {
  readonly kind: "persona" | "playbook";
  readonly id: string;
  readonly name: string;
  readonly thesis: string;
  readonly lore?: string;
  readonly evidence: string;
  readonly href?: string;
  readonly desk?: { readonly id: string; readonly name: string };
}

export interface Shelf {
  readonly id: string;
  readonly name: string;
  readonly claim: string;
  readonly blurb: string;
  readonly members: readonly ShelfMember[];
}

export interface CollectionsIndex {
  readonly collections: readonly Shelf[];
  readonly unshelved: readonly ShelfMember[];
}

export async function fetchCollections(): Promise<CollectionsIndex> {
  const res = await fetch("/api/collections", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`collections ${res.status}`);
  return (await res.json()) as CollectionsIndex;
}
