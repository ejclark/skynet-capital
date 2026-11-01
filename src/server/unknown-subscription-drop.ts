import type { PlaybookSubscription } from "../domain/types.js";
import { isAuthoredPlayId } from "../playbooks/authored-play.js";
import { findPlaybook } from "../playbooks/registry.js";
import { pointerMove } from "../subscriptions/conviction-pointer.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import { convictionNames, pointerChange } from "./conviction-pointer-changes.js";
import type { MemberConvictionStore } from "./member-conviction-store.js";
import { ownViewsOf } from "./pair-conviction-write.js";
import {
  recordControlsChange,
  type SettingsChange,
  type SettingsChangeLog,
} from "./settings-change-log.js";
import { change, subscriptionSummary } from "./subscription-changes.js";
import type { SubscriptionStore } from "./subscription-store.js";

/**
 * A SUBSCRIPTION NO REGISTRY ENTRY KNOWS IS DROPPED BY THE POLL (#6599). A playbook retired from the
 * registry (HC-SAURON, 2026-10-16) leaves its subscriptions on file: nothing trades on them, and the
 * bots refuse each one again every time they read the list. The bots' refusal stays
 * (`resolveBotRoster`), because a bots build older than the app must still refuse an id itself; this
 * is the app cleaning its own list, so a future retirement cleans up the same way.
 *
 * WHAT IT MAY DROP: an id `findPlaybook` does not know and that is not a member's authored play. A
 * `U-` id is never in the registry and is never this rule's call, whether or not its spec compiles
 * today. A paused subscription is dropped like a running one, since neither can ever run.
 *
 * ALWAYS RECORDED. Unlike the pointer rule (`conviction-pointer-changes.ts`), this one is not
 * re-applied each poll once it has acted, so a drop whose line would be lost could never be
 * explained. So it waits while the change log cannot be read whole, as the shadow scout's seed does,
 * and puts an account back when its line will not write (`recordControlsChange`); the next poll
 * tries again. A failure on one account never stops the others.
 *
 * THE LIMIT: the registry read is this build's. An app rolled back past the commit that added a
 * playbook would drop subscriptions to it, and an owner's own view on that pair goes with them on
 * the same poll (`prunePairViews`). So would an app that seeds an id only a newer bots build knows,
 * in a bots-first deploy, and the seed's marker stops it coming back. Each drop has its line, with
 * the settings as they were, for resubscribing by hand: paper money, recoverable, and said here
 * rather than guarded against.
 */

/** Who drops a subscription when no person did; the Settings card reads it as the app's own. */
export const UNKNOWN_PLAYBOOK_RULE_AUTHOR = "unknown-playbook-rule";

const isUnknown = ({ playbookId }: Pick<PlaybookSubscription, "playbookId">): boolean =>
  findPlaybook(playbookId) === undefined && !isAuthoredPlayId(playbookId);

/** `state` with one account's subscriptions replaced; an account left with none is removed. */
function withAccount(
  state: SubscriptionsState,
  accountId: string,
  subs: readonly PlaybookSubscription[],
): SubscriptionsState {
  if (subs.length > 0) return { ...state, [accountId]: subs };
  const { [accountId]: _gone, ...rest } = state;
  return rest;
}

/**
 * Drop every unknown subscription, logging each on its own bot's card. Returns `account/playbookId`
 * for each one dropped. No write on the common poll, when there is nothing to drop.
 */
export function dropUnknownSubscriptions(
  subscriptions: SubscriptionStore,
  changes: SettingsChangeLog,
  members: MemberConvictionStore | undefined,
  at = new Date(),
  onError: (message: string) => void = (message) => process.emitWarning(message),
): readonly string[] {
  const state = subscriptions.loadIfReadable();
  if (!state) return [];
  const accounts = Object.entries(state).filter(([, subs]) => subs.some(isUnknown));
  if (accounts.length === 0 || !changes.readable()) return [];

  const viewOf = ownViewsOf(members);
  const names = convictionNames(members);
  const linesFor = (accountId: string, sub: PlaybookSubscription): SettingsChange[] => {
    const moved = pointerMove(accountId, sub, undefined);
    return [
      change(
        `subscription:${sub.playbookId}`,
        subscriptionSummary(sub, viewOf),
        null,
        UNKNOWN_PLAYBOOK_RULE_AUTHOR,
        at,
      ),
      ...(moved ? [pointerChange(moved, names, UNKNOWN_PLAYBOOK_RULE_AUTHOR, at)] : []),
    ];
  };

  const dropped: string[] = [];
  let current = state;
  for (const [accountId, subs] of accounts) {
    const gone = subs.filter(isUnknown);
    const next = withAccount(
      current,
      accountId,
      subs.filter((s) => !isUnknown(s)),
    );
    try {
      subscriptions.replace(next);
      recordControlsChange(
        changes,
        accountId,
        gone.flatMap((sub) => linesFor(accountId, sub)),
        () => subscriptions.replace(current),
      );
      current = next;
      dropped.push(...gone.map((sub) => `${accountId}/${sub.playbookId}`));
    } catch (err) {
      onError(
        `[subscriptions] could not finish dropping ${accountId}'s subscriptions to unknown playbooks, the next poll tries again: ${String(err)}`,
      );
    }
  }
  return dropped;
}
