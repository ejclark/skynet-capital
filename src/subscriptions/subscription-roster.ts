import type { PlaybookSubscription } from "../domain/types.js";
import type { AuthoredRoster } from "../playbooks/authored-play.js";
import type { EnabledPlaybook, Playbook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";

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
 * `authoredRoster(specs, accountId)`. Omitted — every caller today, since nothing persists a spec
 * yet — behaves byte-for-byte as before: only house plays resolve.
 */
export function subscriptionRoster(
  subscriptions: readonly PlaybookSubscription[],
  authored?: AuthoredRoster,
): {
  readonly enabled: readonly EnabledPlaybook[];
  readonly rejected: readonly string[];
} {
  const enabled: EnabledPlaybook[] = [];
  const rejected: string[] = [];
  for (const sub of subscriptions) {
    if (!sub.enabled) continue;
    const playbook = authoredPlay(authored, sub) ?? findPlaybook(sub.playbookId);
    if (playbook) {
      enabled.push({ playbook, mode: sub.mode });
    } else {
      rejected.push(sub.playbookId);
    }
  }
  return { enabled, rejected };
}

/**
 * Merge an account's subscription-driven roster over the house-wide one — override wins by
 * `playbook.id`, so a bot that explicitly subscribed to a playbook the house roster ALSO enables
 * gets its own mode/capital, not a second conflicting entry for the same symbol — in the house
 * entry's position.
 *
 * A PAUSE WINS TOO (#4651). A house entry whose id the account has paused (`paused`, from
 * `pausedPlaybookIds`) leaves this account's roster: pausing a playbook in the Store turns it off on
 * that account even when the env roster names it. Before, a paused subscription was simply skipped,
 * so the house entry of the same id kept trading and Pause did nothing. An account with no
 * subscription to the id keeps the house entry.
 */
export function mergeRosters(
  base: readonly EnabledPlaybook[],
  overrides: readonly EnabledPlaybook[],
  paused: ReadonlySet<string> = new Set(),
): EnabledPlaybook[] {
  // Replace in place, so an override changes a house entry's mode without changing its turn in
  // the evaluation order — seeding a bot's subscriptions from the house roster (#4535) must leave
  // the order it trades in exactly as it was. Overrides the base lacks append, in their own order.
  const byId = new Map(overrides.map((e) => [e.playbook.id, e]));
  const baseIds = new Set(base.map((e) => e.playbook.id));
  return [
    ...base.flatMap((e) => {
      const override = byId.get(e.playbook.id);
      if (override) return [override];
      return paused.has(e.playbook.id) ? [] : [e];
    }),
    ...overrides.filter((e) => !baseIds.has(e.playbook.id)),
  ];
}

/**
 * The playbook ids an account has PAUSED: it holds a subscription to the id, switched off, and no
 * enabled one. An id it has no subscription to at all is not paused — that is "never subscribed".
 */
export function pausedPlaybookIds(subscriptions: readonly PlaybookSubscription[]): Set<string> {
  const on = new Set(subscriptions.filter((s) => s.enabled).map((s) => s.playbookId));
  return new Set(
    subscriptions.filter((s) => !(s.enabled || on.has(s.playbookId))).map((s) => s.playbookId),
  );
}
