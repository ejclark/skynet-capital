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
 * gets its own mode/capital, not a second conflicting entry for the same symbol.
 */
export function mergeRosters(
  base: readonly EnabledPlaybook[],
  overrides: readonly EnabledPlaybook[],
): EnabledPlaybook[] {
  const overrideIds = new Set(overrides.map((e) => e.playbook.id));
  return [...base.filter((e) => !overrideIds.has(e.playbook.id)), ...overrides];
}
