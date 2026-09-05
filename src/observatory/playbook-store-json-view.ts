/**
 * THE PLAYBOOK STORE, as data (issue #885) — the catalog merged with one account's own
 * subscriptions. No cross-account visibility (Eric, settled fork): the caller passes only the
 * viewer's OWN subscriptions (or none, for a viewer who doesn't own this desk), never another
 * account's.
 */

import { type PlaybookStoreEntry, playbookStoreCatalog } from "../discovery/playbook-store.js";
import type { PlaybookSubscription } from "../domain/types.js";

interface PlaybookStoreCardView extends PlaybookStoreEntry {
  readonly subscription?: {
    readonly mode: PlaybookSubscription["mode"];
    readonly capitalAllocated: number;
    readonly enabled: boolean;
    /** Symbol-targeting filter (#885) — absent means unrestricted. */
    readonly symbols?: readonly string[];
  };
}

export interface PlaybookStoreView {
  readonly cards: readonly PlaybookStoreCardView[];
  /** Sum of capitalAllocated across this account's ENABLED subscriptions (Eric, #885: "the
   *  summation of money being managed under playbooks could be an interesting metric"). */
  readonly capitalUnderManagement: number;
  /** Whether the viewer may subscribe at all — absent when nobody's account is open here. */
  readonly canManage: boolean;
}

export function playbookStoreView(
  subscriptions: readonly PlaybookSubscription[] | undefined,
): PlaybookStoreView {
  const byPlaybookId = new Map(subscriptions?.map((s) => [s.playbookId, s]));
  const cards = playbookStoreCatalog().map((entry) => {
    const sub = byPlaybookId.get(entry.id);
    return {
      ...entry,
      ...(sub
        ? {
            subscription: {
              mode: sub.mode,
              capitalAllocated: sub.capitalAllocated,
              enabled: sub.enabled,
              ...(sub.symbols ? { symbols: sub.symbols } : {}),
            },
          }
        : {}),
    };
  });
  const capitalUnderManagement = (subscriptions ?? [])
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.capitalAllocated, 0);
  return { cards, capitalUnderManagement, canManage: subscriptions !== undefined };
}
