import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTION_ID_MAX } from "./subscription-state.js";

/**
 * AN OWNER'S CONVICTION ON ONE PAIR, AS A VIEW (#5482 contract piece 3, the app's half). Until now
 * the subscribe and conviction forms stored the owner's reason and check day on the subscription
 * itself (`SubscriptionConviction`), the last conviction the bots read from anywhere but a record.
 * The forms now write that same reason and day as a view stated on its one pair
 * (`Conviction.scope: "pair"`, which the bots accept since #5939) and point the subscription at it.
 *
 * Kept vs changed: the DECISION is #4469's — an owner may run a pair on their own labelled reason,
 * checked on their own day (criteria 2 and 12). The MECHANISM moves from an inline copy to a record,
 * so every pair is checked one way: by its pointer.
 *
 * The view says no more than the inline conviction did (`pairScopeProblems`): one claim (the owner's
 * reason), one pair, nothing narrowed, the strategy's retire test kept. Its one claim's falsifier is
 * the check itself — net P/L below $0, or the retire test failing, on the check day — because that
 * is what the inline conviction was checked on, and the bots check the view the same way.
 *
 * One view per account and pair: its id is derived from both (`pairViewId`), so restating the
 * conviction replaces the view in place and the pointer never moves for a new date alone.
 */

/** The claim's tag: an owner who runs a pair the study does not back, or checks it on a day of their
 *  own, holds that the market underrates it. */
const OWN_TAG = "underrated" as const;

/** FNV-1a, 32 bits, base 36: a short stable tag so two accounts' views on one pair never share an
 *  id. Not a secret and not a security boundary; only a name. */
function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The id of `accountId`'s view on `playbookId`: kebab-case, at most 64 characters, the same on
 *  every write so a restated conviction replaces its view. */
export function pairViewId(accountId: string, playbookId: string): string {
  const tag = shortHash(`${accountId}\u0000${playbookId}`);
  const room = CONVICTION_ID_MAX - "pair-".length - tag.length - 1;
  const pair = slug(playbookId).slice(0, room).replace(/-+$/, "") || "x";
  return `pair-${pair}-${tag}`;
}

export interface PairStatement {
  readonly accountId: string;
  readonly playbookId: string;
  readonly conviction: SubscriptionConviction;
  /** Whose view it is, as members know them (`creditFor(session)`). */
  readonly owner: string;
  /** `YYYY-MM-DD`: the market day it was stated. */
  readonly statedOn: string;
}

/** The view an owner's reason and check day become on their one pair. */
export function pairView(statement: PairStatement): Conviction {
  const { accountId, playbookId, conviction, owner, statedOn } = statement;
  return {
    id: pairViewId(accountId, playbookId),
    title: `${owner}'s own conviction`.slice(0, 80),
    owner,
    statedOn,
    checkOn: conviction.checkOn,
    claims: [
      {
        tag: OWN_TAG,
        statement: conviction.reason,
        bucket: "forward",
        evidence: "The owner's own reason for running this pair; no study backs it.",
        falsifier: `Its net P/L is below $0, or its strategy's retire test fails, on ${conviction.checkOn}.`,
        scoreBy: conviction.checkOn,
      },
    ],
    steers: [playbookId],
    scope: "pair",
  };
}

/** True for a view stated on its one pair. */
export const isPairView = (conviction: Conviction | undefined): conviction is Conviction =>
  conviction?.scope === "pair";

/** The reason and day a view stated on its one pair says — what the owner typed. */
export function statedConviction(view: Conviction): SubscriptionConviction | undefined {
  const reason = view.claims[0]?.statement;
  return isPairView(view) && reason ? { reason, checkOn: view.checkOn } : undefined;
}

/**
 * `sub` as its owner reads it: a pointer at their own view on this pair reads as the reason and
 * day they stated, exactly as the inline conviction did, so the Store row and its check line are
 * unchanged by where the conviction is kept. Every other subscription is returned as it is.
 */
export function asOwnConviction(
  sub: PlaybookSubscription,
  lookup: (id: string) => Conviction | undefined,
): PlaybookSubscription {
  const id = sub.convictionId;
  const view = id === undefined ? undefined : lookup(id);
  const stated = view?.steers.includes(sub.playbookId) ? statedConviction(view) : undefined;
  if (!stated) return sub;
  const { convictionId: _pointer, ...rest } = sub;
  return { ...rest, conviction: stated };
}
