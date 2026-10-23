import type { PlaybookSubscription } from "../domain/types.js";
import type { AuthoredRoster } from "../playbooks/authored-play.js";
import {
  type ConvictionLookup,
  INLINE_NOT_MOVED,
  isUnmovedInline,
} from "../playbooks/conviction-store.js";
import type { EnabledPlaybook, Playbook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";
import { steeredBy } from "../playbooks/steered-playbook.js";

/**
 * A subscription's authored play, or `undefined` — the mechanical half of the own-account rule
 * (`authored-play.ts`'s module doc; Eric, 2026-09-22: an authored play "runs only on its author's
 * own account and never on anyone else's bot"). The comparison is the enforcement: a roster is
 * stamped with the account it was compiled for, so a subscription belonging to any other account
 * falls through to the house registry and finds nothing under a `U-` id.
 */
function authoredPlay(
  authored: AuthoredRoster | undefined,
  sub: PlaybookSubscription,
): Playbook | undefined {
  if (!authored || authored.accountId !== sub.accountId) {
    return undefined;
  }
  return authored.plays.find((play) => play.id === sub.playbookId);
}

/**
 * Resolve one account's subscriptions into an `EnabledPlaybook[]` the same shape
 * `enabledPlaybooks` (env-driven, house-wide) already produces — so both feed `withPlaybooks`
 * identically. A disabled subscription is skipped entirely (not even reported as rejected: it
 * was deliberately turned off, not malformed). A subscription naming a playbook id that no
 * longer exists in the house roster IS reported, the same way `enabledPlaybooks` reports an
 * unknown `SKYNET_PLAYBOOKS` token — a stale subscription should be loud, not silently dark.
 *
 * `authored` (#809 slice 2) is this account's own compiled authored plays, from
 * `authoredRoster(specs, accountId)`; the bots forward it through `resolveBotRoster` (#4450 slice
 * 3). Omitted — what every caller supplies today, since nothing persists a spec yet — only house
 * plays resolve.
 *
 * A house playbook whose subscription points at a conviction record steering it runs narrowed by
 * that record (#5482 slice 4, `steeredBy`): `steered` says each fence, once, for the boot log. A
 * narrowing that would widen a bound is `refused` whole and the pair runs exits-only, so nothing
 * new opens on a conviction that did not hold. So does a subscription that still carries an inline
 * conviction with no pointer (#5482 contract piece 4): the bots no longer read one.
 */
export function subscriptionRoster(
  subscriptions: readonly PlaybookSubscription[],
  authored?: AuthoredRoster,
  convictionOf?: ConvictionLookup,
): {
  readonly enabled: readonly EnabledPlaybook[];
  readonly rejected: readonly string[];
  readonly steered: readonly string[];
  readonly steeringRefused: readonly string[];
} {
  const enabled: EnabledPlaybook[] = [];
  const rejected: string[] = [];
  const steered: string[] = [];
  const steeringRefused: string[] = [];
  for (const sub of subscriptions) {
    if (!sub.enabled) continue;
    const own = authoredPlay(authored, sub);
    const house = own ?? findPlaybook(sub.playbookId);
    if (!house) {
      rejected.push(sub.playbookId);
      continue;
    }
    // A member's own authored play is never steered: a record steers house pairs. One carrying a
    // pointer anyway is held like any pointer the bots cannot use (`steeredBy` refuses it), since a
    // pointed pair never reads its inline conviction (#5482 contract piece 2). An inline copy with
    // no pointer is never read either (piece 4, `statedCheck`), so its pair has no check day and
    // runs exits-only the same way, until the app's poll moves the copy onto a view.
    const result = isUnmovedInline(sub)
      ? { playbook: house, refused: INLINE_NOT_MOVED }
      : own && sub.convictionId === undefined
        ? { playbook: own, says: [] }
        : steeredBy(house, sub, convictionOf);
    if ("refused" in result) {
      steeringRefused.push(`${sub.playbookId}: ${result.refused}`);
      enabled.push({ playbook: house, mode: sub.mode, exitsOnly: true });
      continue;
    }
    if (result.says.length > 0) steered.push(`${sub.playbookId}: ${result.says.join("; ")}`);
    enabled.push({ playbook: result.playbook, mode: sub.mode });
  }
  return { enabled, rejected, steered, steeringRefused };
}

/**
 * Merge an account's subscription-driven roster over the house-wide one — override wins by
 * `playbook.id`, so a bot that explicitly subscribed to a playbook the house roster ALSO enables
 * gets its own mode/capital, not a second conflicting entry for the same symbol — in the house
 * entry's position.
 *
 * A paused subscription is an override too (`pausedRoster`, exits only), so it replaces a house
 * entry of the same id exactly as an enabled one does — Pause works even for a playbook the env
 * roster names (#4651). An account with no subscription to the id keeps the house entry.
 */
export function mergeRosters(
  base: readonly EnabledPlaybook[],
  overrides: readonly EnabledPlaybook[],
): EnabledPlaybook[] {
  // Replace in place, so an override changes a house entry's mode without changing its turn in
  // the evaluation order — seeding a bot's subscriptions from the house roster (#4535) must leave
  // the order it trades in exactly as it was. Overrides the base lacks append, in their own order.
  const byId = new Map(overrides.map((e) => [e.playbook.id, e]));
  const baseIds = new Set(base.map((e) => e.playbook.id));
  return [
    ...base.map((e) => byId.get(e.playbook.id) ?? e),
    ...overrides.filter((e) => !baseIds.has(e.playbook.id)),
  ];
}

/**
 * The playbook ids an account has PAUSED: it holds a subscription to the id, switched off, and no
 * enabled one. An id it has no subscription to at all is not paused — that is "never subscribed".
 */
export function pausedPlaybookIds(
  subscriptions: readonly Pick<PlaybookSubscription, "playbookId" | "enabled">[],
): Set<string> {
  const on = new Set(subscriptions.filter((s) => s.enabled).map((s) => s.playbookId));
  return new Set(
    subscriptions.filter((s) => !(s.enabled || on.has(s.playbookId))).map((s) => s.playbookId),
  );
}

/**
 * PAUSE STOPS A PLAYBOOK OPENING ANYTHING NEW; ITS OWNERSHIP AND EXITS ARE UNCHANGED (#4651). Each
 * paused subscription resolves to an `exitsOnly` entry: it still sells on its own exit rules —
 * S1-NVDA paused at D-5 still exits before the print — keeps its names exactly as when it runs, and
 * opens nothing but a covered call (`pausedMayPlace`). Merged over the house roster like any
 * override (`mergeRosters`), it replaces an env entry of the same id. Before, a paused subscription
 * was skipped: an env-named playbook kept trading, and a Store-only one dropped its exits too.
 * An id no playbook resolves is left out quietly; `subscriptionRoster` already names it.
 */
export function pausedRoster(
  subscriptions: readonly PlaybookSubscription[],
  authored?: AuthoredRoster,
): EnabledPlaybook[] {
  const paused = pausedPlaybookIds(subscriptions);
  return subscriptions.flatMap((sub) => {
    if (sub.enabled || !paused.has(sub.playbookId)) return [];
    const playbook = authoredPlay(authored, sub) ?? findPlaybook(sub.playbookId);
    return playbook ? [{ playbook, mode: sub.mode, exitsOnly: true as const }] : [];
  });
}
