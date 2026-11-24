import { createAlertDelivery } from "../adapters/email-alert-delivery.js";
import { createAlertDeliveryStore } from "../adapters/jsonl-alert-delivery-store.js";
import { AlertDeliveryDispatcher } from "../alerts/alert-delivery-dispatcher.js";
import { WATCH_MAX_AGE_MS } from "../alerts/fill-watch.js";
import type { ActivityEventBus } from "../observatory/activity-event.js";
import type { AlertDeliveryPort, AlertDeliveryStorePort } from "../ports/alert-delivery.js";
import { type DeskAlertsDeps, deskAlertsFor } from "../server/desk-alerts-route.js";

/**
 * WIRING ALERT DELIVERY (#3407 P4 slice 3) — the two triggers that reach a member who is NOT
 * looking at the Alerts strip, and the honest no-op when the credential is absent.
 *
 * 1. **The bus.** Every order lifecycle event the desk already publishes (`activityEvents`, the
 *    same stream `desk-events-route.ts` fans out) re-derives that one member's alerts and delivers
 *    what is new. A fill or a rejection therefore reaches them within a second of the broker's own
 *    echo, with no polling added anywhere.
 * 2. **The sweep.** Expiry reminders and assignment risk are standing conditions, not events —
 *    nothing fires them. A timer re-derives them for MEMBERS WHO OPTED IN ONLY, so a deployment
 *    where nobody has turned delivery on does no broker reads at all and the cost of this feature
 *    is exactly zero until someone asks for it. A member with an open one-order watch counts as
 *    asking (#8352): the sweep is what retries a watched fill whose one send was refused or lost
 *    to a restart, whatever the account-wide channel says, and it drops a watch past
 *    `WATCH_MAX_AGE_MS` with a logged note so a lost email cannot hold a watch slot forever.
 *
 * Both paths share `deskAlertsFor`, the strip's own derivation, so a delivered alert is by
 * construction the same alert the page would have shown — dismissals already subtracted, no second
 * copy of the producers to drift.
 *
 * With no transport configured this wires NOTHING and logs one line: the route still answers and
 * says delivery is unconfigured, which is the plan's done line rather than a silent drop.
 */

/** How often standing conditions are re-derived for opted-in members. Expiry rungs are a month, a
 *  week and a day wide, so an hour is plenty — a tighter loop buys no earlier warning. */
const DEFAULT_SWEEP_MINUTES = 60;

/** The `stop` for a wiring that started nothing. */
function noop(): void {
  return;
}

export interface AlertDeliveryWiring {
  /** Always present: the member's choice is durable whether or not a transport exists. */
  readonly store: AlertDeliveryStorePort;
  /** Absent when no credential is configured — the route reports that in words. */
  readonly transport?: AlertDeliveryPort;
  /** Run one delivery pass for this account now (the fill-watch route's tap, #8251). Absent with
   *  no transport. */
  readonly nudge?: (participantId: string) => void;
  /** Stop the sweep and unsubscribe from the bus. */
  readonly stop: () => void;
}

export function wireAlertDelivery(options: {
  readonly env: NodeJS.ProcessEnv;
  /** Everything the strip's own derivation needs, minus the dismissals this wiring adds itself. */
  readonly deps: () => DeskAlertsDeps;
  readonly activityEvents: Pick<ActivityEventBus, "subscribe">;
  /** Who owns an account right now — a background send re-checks the stored address against it,
   *  so an account that changed hands stops mailing its previous owner. */
  readonly ownerEmailFor: (participantId: string) => string | undefined;
  readonly sweepMinutes?: number;
}): AlertDeliveryWiring {
  const store = createAlertDeliveryStore(options.env);
  const built = createAlertDelivery(options.env);
  if (!("port" in built)) {
    console.log(`Alert delivery: off — ${built.reason}`);
    // Nothing to stop: with no transport there is no bus subscription and no sweep.
    return { store, stop: noop };
  }
  const transport = built.port;
  const dispatcher = new AlertDeliveryDispatcher(store, transport, options.ownerEmailFor);

  const deliverFor = async (participantId: string): Promise<void> => {
    try {
      const derived = await deskAlertsFor(participantId, options.deps());
      if (derived.kind !== "ok") return;
      const outcome = await dispatcher.deliver(participantId, derived.alerts);
      for (const failure of outcome.failed) {
        console.warn(`Alert delivery failed for ${participantId}: ${failure.reason}`);
      }
    } catch (error) {
      // A delivery pass must never take the server down, and it must never be silent either.
      console.warn(`Alert delivery pass failed for ${participantId}: ${String(error)}`);
    }
  };

  // One pass per member at a time: a burst of fills on one account would otherwise race the
  // sent-ledger and mail the same alert twice. An event that lands mid-pass is not dropped: it
  // earns ONE more pass after this one (#8251 — a watched order's fill can arrive while the pass
  // for its acceptance is still reading, and dropping it would lose the one email the tap asked for).
  const inFlight = new Set<string>();
  const again = new Set<string>();
  const queue = (participantId: string): void => {
    if (participantId === "") return;
    if (inFlight.has(participantId)) {
      again.add(participantId);
      return;
    }
    inFlight.add(participantId);
    void deliverFor(participantId).finally(() => {
      inFlight.delete(participantId);
      if (again.delete(participantId)) queue(participantId);
    });
  };

  const subscription = options.activityEvents.subscribe((event) => {
    if (event.target.kind === "order") queue(event.actor.participantId);
  });

  const sweep = async (): Promise<void> => {
    const members = await store.listMembers().catch(() => []);
    for (const id of members) {
      const { prefs, watches } = await store.load(id);
      const open = await dropStaleWatches(id, watches);
      if (prefs.channel !== "off" || open > 0) queue(id);
    }
  };
  // A watch past its age limit can never be worded (its order's ending has left the alert window),
  // so it is ended here rather than re-derived hourly forever. Returns how many stay open.
  const dropStaleWatches = async (
    id: string,
    watches: readonly { readonly orderId: string; readonly at: string }[],
  ): Promise<number> => {
    let open = 0;
    for (const watch of watches) {
      if (Date.now() - Date.parse(watch.at) <= WATCH_MAX_AGE_MS) {
        open += 1;
        continue;
      }
      await store.dropWatch(id, watch.orderId);
      console.warn(
        `Alert delivery: watch on ${watch.orderId} for ${id} dropped unsent after ${WATCH_MAX_AGE_MS / 86_400_000} days`,
      );
    }
    return open;
  };
  const minutes = Number(options.env.SKYNET_ALERT_SWEEP_MINUTES ?? "") || DEFAULT_SWEEP_MINUTES;
  const timer = setInterval(() => void sweep(), minutes * 60_000);
  timer.unref?.();
  console.log(`Alert delivery: on (${transport.channel} as ${transport.from}, sweep ${minutes}m)`);

  return {
    store,
    transport,
    nudge: queue,
    stop: () => {
      clearInterval(timer);
      subscription.unsubscribe();
    },
  };
}
