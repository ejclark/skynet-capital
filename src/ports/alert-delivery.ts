import type { AlertDeliveryPrefs, DeliveryMessage } from "../alerts/alert-delivery.js";

/**
 * The two boundaries alert delivery reaches across (#3407 P4 slice 3): where a member's own choice
 * is kept, and the transport that actually carries a message off this machine.
 *
 * Both are ports for the same reason `AlertDismissalsPort` is: the rules live in pure modules and
 * the specs drive them with nothing on disk and nothing on the network. It also means the
 * irreversible half of this feature — a real credential talking to a real provider — is ONE small
 * adapter, and the deployment without that credential is a first-class, honest state rather than a
 * silent failure (`available: false` with a reason, the shape `desk-events-route.ts` already uses).
 */

/** What the store knows about one member: their choice, and what has already been sent to them. */
export interface AlertDeliveryRecord {
  readonly prefs: AlertDeliveryPrefs;
  /** Fingerprints already delivered, so a re-derived alert is never mailed twice. */
  readonly sent: readonly string[];
}

/** Where a member's delivery choice and sent-ledger live. Durable: both must outlive a deploy. */
export interface AlertDeliveryStorePort {
  /** This member's record. A member who never opted in reads as `DELIVERY_OFF` with no sends. */
  load(consumerId: string): Promise<AlertDeliveryRecord>;
  /** Record a new choice. Last write wins. */
  savePrefs(consumerId: string, prefs: AlertDeliveryPrefs): Promise<void>;
  /** Note that this fingerprint reached this member. Idempotent — a repeat costs a line only. */
  recordSent(consumerId: string, fingerprint: string): Promise<void>;
  /** Every member who has ever saved a choice — the sweep's whole working set, so a deployment
   *  where nobody opted in does no work at all. */
  listMembers(): Promise<readonly string[]>;
}

/** A transport's answer. `sent` is the provider's own word for it; a refusal carries its reason. */
export type DeliveryReceipt =
  | { readonly ok: true; readonly id?: string }
  | { readonly ok: false; readonly reason: string };

/** The transport itself — one channel, one `send`. Absent from the config = delivery is off on
 *  this deployment, and the alerts surface says exactly that. */
export interface AlertDeliveryPort {
  /** Which channel this transport serves, for the surface to name. */
  readonly channel: "email";
  /** Who it sends as, for the control to show a member before they opt in. */
  readonly from: string;
  send(message: DeliveryMessage): Promise<DeliveryReceipt>;
}
