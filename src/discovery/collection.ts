/**
 * The discovery layer's shared vocabulary — a **collection** is a narrative shelf you browse
 * (Public.com organises discovery around "Cannabis" / "Self-Driving Cars", not a GICS lookup), and
 * a **member** is one entry from an existing catalog that a probe proved belongs on that shelf.
 *
 * The load-bearing field is `claim`: every collection states, mechanically, what membership MEANS —
 * so an evocative shelf name can never oversell what the strategy actually does. The name is lore;
 * the claim is the mechanics; `evidence` on each member is the receipt from the probe run.
 */

/** Which catalog a member came from — personas (`src/personas`) or playbooks (`src/playbooks`). */
export type CatalogKind = "persona" | "playbook";

export interface CollectionMember {
  readonly kind: CatalogKind;
  readonly id: string;
  readonly name: string;
  readonly thesis: string;
  /** The character/legend line, for personas that carry one (`persona-lore.ts`). */
  readonly lore?: string;
  /** What the derivation actually OBSERVED — a verbatim order reason, or the derived window. */
  readonly evidence: string;
  /**
   * The member's EXISTING detail view, when the catalog itself knows it (a playbook links to the
   * research doc it cites). Personas resolve to a live desk at render time instead — the discovery
   * surface never re-renders persona detail of its own.
   */
  readonly href?: string;
}

export interface Collection {
  readonly id: string;
  readonly name: string;
  /** Exactly what membership means, mechanically. Never decorative — this is the honesty guard. */
  readonly claim: string;
  readonly blurb: string;
  readonly members: readonly CollectionMember[];
}
