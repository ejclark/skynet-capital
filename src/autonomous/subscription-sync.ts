import type { PlaybookSubscription } from "../domain/types.js";
import type { SubscriptionsSnapshot } from "./subscriptions-wire.js";

/**
 * THE SUBSCRIPTION SWAP — the bots-side half of `subscriptions-wire.ts` (issue #3595).
 *
 * A snapshot arriving on the `/controls` poll rebuilds each bot's roster and swaps it into the
 * already-running `AutonomousTrader` IN PLACE, the same posture and for the same reason as
 * `SwappableBotBroker`'s credential rotation: a restart would throw away this process's in-memory
 * momentum, sentiment and per-symbol cooldown state, which is precisely the state a mid-session
 * subscription change must not cost. The swap therefore lands BETWEEN cycles, never inside one —
 * `AutonomousTrader.evaluate` reads its persona and risk once at the top of a cycle, so a swap
 * applied while a cycle is in flight takes effect on the next one rather than mixing two rosters
 * inside a single decision.
 *
 * Two refusals keep a flapping bridge from churning the fleet:
 *
 *  - **stale** — a snapshot stamped older than the one in force is ignored. An app that rolled
 *    back onto an older store, or a response that arrives out of order, must never rewind a live
 *    roster.
 *  - **unchanged** — a snapshot whose version matches the one in force is a no-op. This is the
 *    common case (nothing changed between two polls), so it has to be free: no rebuild, no log
 *    line, no `subscriptionsVersion` churn.
 *
 * An unreachable bridge needs no handling here at all: `bot-controls-client.ts` fails open to
 * last-known, so nothing is offered to `accept` and the fleet keeps trading the last subscriptions
 * it received — which is exactly the required behavior while the bridge is down.
 */

/** One live bot's swap seam. `applySubscriptions` rebuilds this bot's roster from its own
 *  subscriptions and installs it; the sync never knows what a roster is made of. */
export interface SubscriptionSyncBot {
  /** The `accountId` this bot's subscriptions are keyed under — its `persona.id`. */
  readonly personaId: string;
  readonly applySubscriptions: (subscriptions: readonly PlaybookSubscription[]) => void;
}

/** What `accept` did with a snapshot. */
export type SubscriptionSyncOutcome = "applied" | "stale" | "unchanged";

export interface SubscriptionSyncDeps {
  readonly bots: readonly SubscriptionSyncBot[];
  /** Fires only on an actual swap — the boot-log counterpart of the `[playbooks]` lines. */
  readonly onApplied?: (version: string, at: number) => void;
  /** Fires when a snapshot is refused, so a rewinding app is visible rather than silent.
   *  Deliberately NOT called for `unchanged`, which is the steady state, not an event. */
  readonly onStale?: (version: string, at: number, inForceAt: number) => void;
  /** A bot's own rebuild threw. Never allowed to fail the poll this rides on, and never allowed to
   *  leave the fleet half-swapped silently — the version in force stays where it was. */
  readonly onApplyError?: (personaId: string, error: unknown) => void;
}

export interface SubscriptionSync {
  /** Offer a parsed snapshot. Returns what happened to it. */
  accept(snapshot: SubscriptionsSnapshot): SubscriptionSyncOutcome;
  /**
   * The subscription version this process is trading under, or `undefined` before any snapshot has
   * landed. `undefined` is load-bearing and must NOT be reported as a version: a bots process that
   * has never heard from the dashboard is trading the house roster only, and saying so honestly is
   * the whole point (slice 2 renders it as `subscriptions: unknown`).
   */
  version(): string | undefined;
  /** When the snapshot in force was stamped by the app (epoch ms), or `undefined` before the
   *  first one — how old the roster is, for the same vitals. */
  inForceAt(): number | undefined;
}

export function createSubscriptionSync(deps: SubscriptionSyncDeps): SubscriptionSync {
  let version: string | undefined;
  let at: number | undefined;

  return {
    accept(snapshot) {
      if (at !== undefined && snapshot.at < at) {
        deps.onStale?.(snapshot.version, snapshot.at, at);
        return "stale";
      }
      if (snapshot.version === version) {
        // Still advance the clock: a same-version snapshot is proof the app is current, and
        // letting `at` lag would make the next genuine change look stale against an older mark.
        at = snapshot.at;
        return "unchanged";
      }
      for (const bot of deps.bots) {
        try {
          bot.applySubscriptions(snapshot.accounts[bot.personaId] ?? []);
        } catch (error) {
          deps.onApplyError?.(bot.personaId, error);
        }
      }
      version = snapshot.version;
      at = snapshot.at;
      deps.onApplied?.(snapshot.version, snapshot.at);
      return "applied";
    },
    version: () => version,
    inForceAt: () => at,
  };
}
