import type { AlertDeliveryPort, AlertDeliveryStorePort } from "../ports/alert-delivery.js";
import { type Alert, sortAlerts } from "./alert.js";
import { deliveryFingerprint, deliveryMessage, shouldDeliver } from "./alert-delivery.js";

/**
 * THE DELIVERY DISPATCHER (#3407 P4 slice 3) — the seam between alerts a member cannot see and a
 * transport that reaches them. It owns three decisions and nothing else:
 *
 * 1. **Who.** The member's own stored choice (`AlertDeliveryStorePort`), never a default-on.
 * 2. **What is new.** The durable sent-ledger, keyed by the substrate's own `alertFingerprint`, so
 *    a producer that re-derives the same standing condition on every read mails it ONCE and an
 *    escalation (info → critical, which the fingerprint carries) earns a second send.
 * 3. **How much.** A hard per-run cap. A member who opens twelve positions in a morning gets the
 *    loudest few mailed and the rest on screen, because a mail storm is how a member learns to
 *    filter this sender out — and the strip is never degraded, only the mail is capped.
 *
 * What it deliberately does NOT own: deriving alerts (the producers do, purely), knowing whether a
 * member dismissed one (the caller subtracts dismissals first, exactly as the strip's route does),
 * and the transport (one port, one adapter). A send that fails leaves the ledger UNMARKED, so the
 * next pass retries rather than recording a delivery that never happened.
 */

/** Most alerts one member may be mailed in a single pass. Loudest first, the rest stay on screen. */
export const MAX_PER_RUN = 3;

export interface DispatchOutcome {
  /** Fingerprints actually accepted by the transport. */
  readonly delivered: readonly string[];
  /** Alerts that matched but could not be sent, with the transport's reason. */
  readonly failed: readonly { readonly fingerprint: string; readonly reason: string }[];
  /** Matched, unsent alerts held back by `MAX_PER_RUN` — named so a caller can report the truth. */
  readonly heldBack: number;
}

const NOTHING: DispatchOutcome = { delivered: [], failed: [], heldBack: 0 };

/** Same address, ignoring case — a session's email is lowercased at mint, a stamped roster one
 *  is not, and an owner whose address differs only in case is still the owner. */
function sameAddress(stored: string, current: string | undefined): boolean {
  return current !== undefined && stored.toLowerCase() === current.toLowerCase();
}

export class AlertDeliveryDispatcher {
  constructor(
    private readonly store: AlertDeliveryStorePort,
    private readonly transport: AlertDeliveryPort,
    /**
     * Who owns this account RIGHT NOW. The stored destination was captured from a session at
     * opt-in, and an account can change hands afterwards (an owner unlinks and re-links it) — so
     * every background send re-checks the address against current ownership rather than trusting a
     * record written months ago. Absent (specs, offline wiring) = no re-check.
     */
    private readonly ownerEmailFor?: (consumerId: string) => string | undefined,
  ) {}

  /**
   * Deliver whatever of `alerts` this member has asked for and has not already been sent. The
   * caller hands in alerts ALREADY minus dismissals — an alert waved away on screen is not news.
   */
  async deliver(consumerId: string, alerts: readonly Alert[]): Promise<DispatchOutcome> {
    if (alerts.length === 0) return NOTHING;
    const { prefs, sent } = await this.store.load(consumerId);
    if (prefs.channel === "off" || !prefs.destination) return NOTHING;
    if (this.ownerEmailFor && !sameAddress(prefs.destination, this.ownerEmailFor(consumerId))) {
      // The account changed hands since this choice was made. Silence is the right answer: the
      // previous owner must not keep receiving this account's positions and fills.
      return NOTHING;
    }
    const already = new Set(sent);
    const candidates = sortAlerts(alerts).filter(
      (alert) => shouldDeliver(alert, prefs) && !already.has(deliveryFingerprint(alert)),
    );
    const batch = candidates.slice(0, MAX_PER_RUN);
    const delivered: string[] = [];
    const failed: { fingerprint: string; reason: string }[] = [];
    for (const alert of batch) {
      const fingerprint = deliveryFingerprint(alert);
      const receipt = await this.transport.send(deliveryMessage(alert, prefs.destination));
      if (receipt.ok) {
        // Record only after the transport accepted it: an unmarked alert is retried, a wrongly
        // marked one is lost forever, and losing an assignment-risk alert is the costlier error.
        await this.store.recordSent(consumerId, fingerprint);
        delivered.push(fingerprint);
      } else {
        failed.push({ fingerprint, reason: receipt.reason });
      }
    }
    return { delivered, failed, heldBack: candidates.length - batch.length };
  }
}
