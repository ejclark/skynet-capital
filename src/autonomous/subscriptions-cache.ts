import type { BotsStateDb } from "./bots-state-db.js";
import type { SubscriptionSync } from "./subscription-sync.js";
import { parseSubscriptionsSnapshot, type SubscriptionsSnapshot } from "./subscriptions-wire.js";

/**
 * THE LAST SUBSCRIPTIONS THE BOTS APPLIED, KEPT ON THE VOLUME (review of #4642 slice 10, finding
 * 15). Since only a subscribed playbook may open a position, a bots process that boots while the
 * dashboard is unreachable would trade an empty list: every buy refused and recorded "not from a
 * subscribed playbook" while the Store shows the bot subscribed, and the forced pick marking a
 * false "not subscribed" day. So every snapshot the bots apply is kept beside the momentum and
 * cooldown state (`bots-state-db.ts`, dark unless `SKYNET_BOTS_DB_PATH` is set), and a boot whose
 * own fetch carried none trades the kept one until the dashboard answers — the sync then applies the
 * newer snapshot over it as usual (`subscription-sync.ts` refuses only an OLDER one).
 *
 * Best-effort both ways, like every other bots-state read: an unreadable or malformed kept snapshot
 * restores nothing (the bot then opens nothing until the first poll, and the boot log says so), and
 * a failed write costs only the next restart's head start.
 */
export interface SubscriptionsCache {
  /** The kept snapshot, validated exactly as the wire validates one; undefined if none or bad. */
  restore(): SubscriptionsSnapshot | undefined;
  keep(snapshot: SubscriptionsSnapshot): void;
}

export function subscriptionsCache(
  db: Pick<BotsStateDb, "loadSubscriptions" | "saveSubscriptions"> | undefined,
): SubscriptionsCache {
  return {
    restore: () => {
      try {
        return db ? parseSubscriptionsSnapshot(db.loadSubscriptions()) : undefined;
      } catch {
        return undefined;
      }
    },
    keep: (snapshot) => {
      try {
        db?.saveSubscriptions(snapshot);
      } catch {
        // Best-effort: the live sync never depends on the copy.
      }
    },
  };
}

/** Offer a snapshot to the live sync, and keep it once the fleet actually trades it. */
export function acceptAndKeep(
  sync: Pick<SubscriptionSync, "accept">,
  cache: SubscriptionsCache,
  snapshot: SubscriptionsSnapshot,
): ReturnType<SubscriptionSync["accept"]> {
  const outcome = sync.accept(snapshot);
  if (outcome === "applied") cache.keep(snapshot);
  return outcome;
}

/**
 * The boot's subscriptions: the boot fetch's own snapshot when it carried one; else the kept one,
 * said plainly; else nothing, said plainly too — never a quiet empty roster.
 */
export function applyBootSubscriptions(
  sync: Pick<SubscriptionSync, "accept">,
  cache: SubscriptionsCache,
  fetched: SubscriptionsSnapshot | undefined,
  log: { warn(line: string): void } = console,
): void {
  if (fetched) {
    acceptAndKeep(sync, cache, fetched);
    return;
  }
  const kept = cache.restore();
  if (kept) {
    sync.accept(kept);
    log.warn(
      `[playbooks] no subscriptions from the dashboard at boot — trading the last ones received (version ${kept.version}, stamped ${new Date(kept.at).toISOString()}) until it answers`,
    );
    return;
  }
  log.warn(
    "[playbooks] no subscriptions from the dashboard at boot and none kept — no bot opens a position until it answers (exits still run); refusals until then read 'not from a subscribed playbook'",
  );
}
