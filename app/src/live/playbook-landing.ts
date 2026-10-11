/**
 * ARRIVING AT A PLAYBOOK'S CARD (#5073 slice 4a — #5037 round 2, R2-act: "an Activity row's tag
 * lands on that card, open, with the fill ringed on its lane"). The pure half of the join: the
 * search an order's playbook link writes, the same search read back (validated) on `/accounts`, and
 * which card it names.
 *
 * `?card=` is the playbook, `?mode=` the mode it ran in (one playbook can run in two), `?fill=` the
 * check that placed the order — the `at` of its round, epoch ms, which is the very instant the
 * lane's trade mark is drawn at (both are the decision's `at`, `wire-reasoning.ts` and
 * `decision-db-week.ts`) — and `?from=` the order, so the card's one way back lands on its row.
 */

import type { PlaybookCard } from "./bot-playbooks";

export interface PlaybookLanding {
  readonly card: string;
  readonly mode?: string;
  readonly fill?: number;
  readonly from?: string;
}

const MAX_CARD = 80;
const MAX_MODE = 32;
const MAX_ORDER = 100;

const bounded = (raw: unknown, max: number): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= max ? raw : undefined;

/** The landing a URL asks for, or nothing — no `card`, no landing; a malformed part just drops. */
export function landingFromSearch(search: Record<string, unknown>): Partial<PlaybookLanding> {
  const card = bounded(search.card, MAX_CARD);
  if (!card) return {};
  const mode = bounded(search.mode, MAX_MODE);
  const fill = Number(search.fill);
  const from = bounded(search.from, MAX_ORDER);
  return {
    card,
    ...(mode ? { mode } : {}),
    ...(Number.isSafeInteger(fill) && fill > 0 ? { fill } : {}),
    ...(from ? { from } : {}),
  };
}

/** The landing out of a validated search, which carries the page's other params beside it. */
export function landingOf(search: Partial<PlaybookLanding>): PlaybookLanding | undefined {
  const { card, mode, fill, from } = search;
  if (!card) return undefined;
  return {
    card,
    ...(mode ? { mode } : {}),
    ...(fill ? { fill } : {}),
    ...(from ? { from } : {}),
  };
}

/** What an order's playbook link writes, from what its decision recorded. */
export function landingFor(
  why: { readonly playbookId: string; readonly playbookMode?: string; readonly cycleAt?: string },
  orderId: string,
): PlaybookLanding {
  const fill = why.cycleAt ? Date.parse(why.cycleAt) : Number.NaN;
  return {
    card: why.playbookId,
    ...(why.playbookMode ? { mode: why.playbookMode } : {}),
    ...(Number.isFinite(fill) ? { fill } : {}),
    from: orderId,
  };
}

/** The card a landing names: the playbook in the mode it ran in, else the playbook in any mode
 *  (its mode changed since). A card whose name is withheld (#885) is never a target. */
export function landingCard(
  cards: readonly PlaybookCard[],
  landing: PlaybookLanding,
): PlaybookCard | undefined {
  const own = cards.filter((c) => c.playbookId === landing.card);
  return own.find((c) => c.mode === landing.mode) ?? own[0];
}
