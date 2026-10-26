import { MAX_WIRED_CONVICTIONS } from "../autonomous/convictions-wire.js";
import { marketDayKey } from "../domain/market-day.js";
import type { SubscriptionConviction } from "../domain/types.js";
import { parseStoredConviction } from "../playbooks/conviction-parse.js";
import { type Conviction, convictionProblems } from "../playbooks/conviction-record.js";
import { recordFor } from "../subscriptions/conviction-pointer.js";
import { isPairView, pairView, pairViewId } from "../subscriptions/pair-conviction.js";
import type { MemberConvictionStore, PairViewWrite } from "./member-conviction-store.js";

/**
 * WHAT THE SUBSCRIBE AND CONVICTION FORMS WRITE BEFORE THE SUBSCRIPTION (#5482 contract piece 3,
 * the app's half). The owner's reason and check day are written as a view stated on that one pair
 * (`subscriptions/pair-conviction.ts`), held on that one account, so the subscription write that
 * follows points at it and keeps no inline copy (`conviction-pointer.ts` takes the member branch).
 *
 * Which of three, by what the owner stated:
 *  - their day is a seeded record's on a pair that record steers (the AI-dip view's 2027-01-29 on
 *    the CRWV wheel): no view is written, and any of theirs on the pair is dropped. The
 *    subscription points at the record, as before, and keeps the narrowings it sets — a view of
 *    their own would replace those, which would trade wider than the record lets it;
 *  - any other day, on any pair: their view is written (or replaced in place, same id);
 *  - the controls wire already full: the write is refused and nothing changes. A view past
 *    `MAX_WIRED_CONVICTIONS` would make the bots refuse every member's views at once, so that set
 *    is never grown past it. Until piece 4 the subscription kept an inline copy instead; the bots
 *    now read pointers only and would run that pair exits-only (`isConvictionOffView`), so a write
 *    reported as saved would quietly stop the pair. Saying so is the honest answer;
 *  - no member store wired (a test or local config with no views file): a seeded record's day
 *    still points at the record; any other day is refused, since a subscription holds no inline
 *    copy since #5482's last contract piece;
 *  - a view the pointer rule would never hold (an authored play's id, a reason too long to read
 *    back): refused, so the form never answers ok over a conviction that went nowhere.
 *
 * Written first, so a subscription that points at the view never exists without it. `undo` puts
 * the view back as it was, for a subscription write the change log rolls back after this
 * (`recordSubscriptionWrite`, both or neither). A file that cannot be read whole refuses the write.
 */
export function statePairConviction(
  members: MemberConvictionStore | undefined,
  ref: { readonly accountId: string; readonly playbookId: string },
  conviction: SubscriptionConviction,
  owner: string,
  at: Date,
): PairViewWrite {
  const id = pairViewId(ref.accountId, ref.playbookId);
  if (recordFor(ref.playbookId, conviction)) {
    return members ? members.dropPair(ref.accountId, id) : { ok: true, undo: () => undefined };
  }
  // Nowhere to keep the owner's own day: refused, since a subscription no longer holds one inline.
  if (!members) return { ok: false, reason: CONVICTION_NO_VIEWS };
  const wired = members.handedOver().filter((w) => w.conviction.id !== id).length;
  // Full: refused, not kept inline — the bots read pointers only, so an inline copy opens nothing.
  if (wired >= MAX_WIRED_CONVICTIONS) return { ok: false, reason: CONVICTION_WIRE_FULL };
  const view = pairView({
    ...ref,
    conviction,
    owner,
    statedOn: marketDayKey(at.toISOString()),
  });
  // A view the pointer rule would never hold (an authored play's id, a reason past a stored claim's
  // length) is refused here, so the form never answers ok over a conviction that went nowhere.
  if (convictionProblems(view).length > 0 || !parseStoredConviction(view)) {
    return { ok: false, reason: CONVICTION_NOT_KEPT };
  }
  return members.statePair(ref.accountId, view, at);
}

/** Drop the account's view on the pair after an unsubscribe. Best effort: a file that cannot be
 *  read whole leaves it, and the controls poll prunes it (`prunePairViews`). */
export function dropPairConviction(
  members: MemberConvictionStore | undefined,
  ref: { readonly accountId: string; readonly playbookId: string },
): void {
  members?.dropPair(ref.accountId, pairViewId(ref.accountId, ref.playbookId));
}

/** Why a form's conviction was refused when the views file could not be read whole. */
export const CONVICTION_UNSAVED =
  "Your conviction couldn't be saved just now, so nothing was changed. Try again shortly.";

/** Why a form's conviction was refused where no views file is wired (a test or local config). */
export const CONVICTION_NO_VIEWS =
  "This server has nowhere to keep your own conviction, so nothing was changed. Use the shared view's check day, or run it with a views file.";

/** Why a form's conviction was refused when it cannot be kept as a view on this pair. */
export const CONVICTION_NOT_KEPT =
  "This conviction can't be kept as a view on this pair (a strategy you wrote, or a reason that is too long), so nothing was changed.";

/** Why a form's conviction was refused when the bots already hold as many views as they can read. */
export const CONVICTION_WIRE_FULL =
  "The bots already hold as many convictions as they can read, so this one wasn't saved and nothing was changed. Try again once one is taken back.";

export type WithConviction<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

/** Owners' own views on one pair, by id. */
export type OwnViews = (id: string) => Conviction | undefined;

/** Every owner's own view on one pair as the store holds it now, read once. */
export function ownViewsOf(members: MemberConvictionStore | undefined): OwnViews {
  const views = new Map(
    (members?.handedOver() ?? [])
      .filter((w) => isPairView(w.conviction))
      .map((w) => [w.conviction.id, w.conviction] as const),
  );
  return (id) => views.get(id);
}

/**
 * A subscription write that may state a conviction: the view first (`statePairConviction`), then
 * `write`, and the view put back if `write` throws — the change log's rollback has already put the
 * subscription back by then. `write` is handed the owners' views as they were before, so its log
 * line can say the day the conviction had. With no conviction stated, `write` runs alone.
 */
export function writeWithConviction<T>(
  members: MemberConvictionStore | undefined,
  ref: { readonly accountId: string; readonly playbookId: string },
  conviction: SubscriptionConviction | undefined,
  owner: string,
  at: Date,
  write: (viewsBefore: OwnViews) => T,
): WithConviction<T> {
  const viewsBefore = ownViewsOf(members);
  if (!conviction) return { ok: true, value: write(viewsBefore) };
  const stated = statePairConviction(members, ref, conviction, owner, at);
  if (!stated.ok) {
    const said = [CONVICTION_WIRE_FULL, CONVICTION_NO_VIEWS, CONVICTION_NOT_KEPT];
    return { ok: false, reason: said.includes(stated.reason) ? stated.reason : CONVICTION_UNSAVED };
  }
  try {
    return { ok: true, value: write(viewsBefore) };
  } catch (err) {
    stated.undo();
    throw err;
  }
}
