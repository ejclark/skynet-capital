import type { AlertDismissalsPort } from "../ports/alert-dismissals.js";
import { type Alert, type AlertFilter, alertFingerprint } from "./alert.js";
import type { AlertBus, AlertListener } from "./alert-bus.js";

/**
 * THE ALERT CENTER — one consumer's view of the bus, with dismissal remembered across reloads.
 *
 * The bus is deliberately memoryless about people: it fans signals out and keeps a rolling
 * window, nothing more. This is the per-consumer layer on top — it holds the dismissed set for
 * exactly one `consumerId` and subtracts it from everything that consumer would otherwise see,
 * live (`watch`) and on mount (`visible`) alike.
 *
 * It is a substrate, NOT a display: no HTML, no styling, no notion of a panel. The intended
 * delivery surfaces are the trading companion (#467) and the push bridge (#432); both consume
 * this, and neither is built here.
 *
 * Construction is `AlertCenter.open`, which is async because loading the dismissed set is the one
 * I/O this substrate does. That is on purpose: there is no half-built center whose `visible()`
 * would have to answer before it knows what was dismissed. If the store cannot be read, `open`
 * REJECTS — a center that quietly treated an unreadable store as "nothing dismissed" would
 * re-show everything the member had waved away and call it a clean slate.
 */
export class AlertCenter {
  private constructor(
    private readonly bus: AlertBus,
    private readonly dismissals: AlertDismissalsPort,
    private readonly consumerId: string,
    private readonly dismissed: Set<string>,
  ) {}

  /** Load this consumer's dismissed set, then hand back a center ready to answer. */
  static async open(options: {
    readonly bus: AlertBus;
    readonly dismissals: AlertDismissalsPort;
    /** Who is looking — a participant id. Dismissals never cross consumers. */
    readonly consumerId: string;
  }): Promise<AlertCenter> {
    const loaded = await options.dismissals.loadDismissed(options.consumerId);
    return new AlertCenter(options.bus, options.dismissals, options.consumerId, new Set(loaded));
  }

  /** Has this consumer already waved this alert (or an identical earlier one) away? */
  isDismissed(alert: Alert): boolean {
    return this.dismissed.has(alertFingerprint(alert));
  }

  /**
   * What this consumer should see right now: the bus's rolling window, narrowed by `filter` and
   * with everything already dismissed removed. Loudest-then-newest first, from the bus.
   */
  visible(filter?: AlertFilter): Alert[] {
    return this.bus.recent(filter).filter((alert) => !this.isDismissed(alert));
  }

  /**
   * Subscribe to future alerts matching `filter`, skipping ones this consumer has dismissed —
   * so a producer re-emitting a standing condition every poll does not re-nag. Returns the
   * unsubscribe.
   */
  watch(filter: AlertFilter | undefined, listener: AlertListener): () => void {
    return this.bus.subscribe(filter, (alert) => {
      if (!this.isDismissed(alert)) listener(alert);
    });
  }

  /**
   * Wave an alert away, for good. Persists FIRST and only then records it locally, so the
   * in-memory set never claims a durability the store did not accept — a rejected write leaves
   * the alert visible, which is the truthful outcome (it will indeed be back on the next load).
   */
  async dismiss(alert: Alert): Promise<void> {
    const fingerprint = alertFingerprint(alert);
    await this.dismissals.dismiss(this.consumerId, fingerprint);
    this.dismissed.add(fingerprint);
  }
}
