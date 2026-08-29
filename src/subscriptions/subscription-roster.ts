import type { PlaybookSubscription } from "../domain/types.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";

/**
 * Resolve one account's subscriptions into an `EnabledPlaybook[]` the same shape
 * `enabledPlaybooks` (env-driven, house-wide) already produces — so both feed `withPlaybooks`
 * identically. A disabled subscription is skipped entirely (not even reported as rejected: it
 * was deliberately turned off, not malformed). A subscription naming a playbook id that no
 * longer exists in the house roster IS reported, the same way `enabledPlaybooks` reports an
 * unknown `SKYNET_PLAYBOOKS` token — a stale subscription should be loud, not silently dark.
 */
export function subscriptionRoster(subscriptions: readonly PlaybookSubscription[]): {
  readonly enabled: readonly EnabledPlaybook[];
  readonly rejected: readonly string[];
} {
  const enabled: EnabledPlaybook[] = [];
  const rejected: string[] = [];
  for (const sub of subscriptions) {
    if (!sub.enabled) continue;
    const playbook = findPlaybook(sub.playbookId);
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
