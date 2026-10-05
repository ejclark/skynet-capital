import { type Alert, type AlertPriority, alertFingerprint, priorityRank } from "./alert.js";

/**
 * ALERT DELIVERY, THE PURE HALF (#3407 P4 slice 3) — who wants an alert sent to them, and what the
 * sent message says. No transport, no store, no clock: total functions over the substrate's own
 * `Alert`, so every rule here is driven from a spec with nothing on the network.
 *
 * Why delivery needs its own vocabulary at all: the alerts strip (`desk-alerts.tsx`) only tells a
 * member what their positions are saying WHILE THEY ARE LOOKING. An assignment-risk alert on a
 * short contract two days out is precisely the one a member needs when they are not looking, which
 * is the gap the plan's P4 row names. Delivery is that reach — and reach is also the thing that can
 * annoy, so the default is OFF and the member picks the floor.
 *
 * Honesty rules carried here, not left to the transport:
 * - An alert is a SIGNAL, never a claim about a fill or a P/L — the message repeats the producer's
 *   own `title`/`body` verbatim and adds no number of its own.
 * - The destination is the member's OWN authenticated address, captured from their session when
 *   they opt in (`alert-delivery-route.ts`), never free text. This app therefore cannot be asked
 *   to mail a stranger, which is the whole abuse surface a notification feature usually opens.
 * - `off` is a real answer and the default: a member who never visits the control is never mailed.
 */

/** Where a member wants alerts to reach them. `off` is the default and a complete answer. */
export type DeliveryChannel = "off" | "email";

/** Every channel a member may pick, in the order the control renders them. */
export const DELIVERY_CHANNELS: readonly DeliveryChannel[] = ["off", "email"];

/** One member's standing delivery choice. Absent record = `DELIVERY_OFF`. */
export interface AlertDeliveryPrefs {
  readonly channel: DeliveryChannel;
  /** The quietest alert worth sending. `critical` only, or warnings too, or everything. */
  readonly minPriority: AlertPriority;
  /** Where it goes — the member's own authenticated address, captured at opt-in. Absent on `off`. */
  readonly destination?: string;
}

/** Nobody is mailed until they ask to be. */
export const DELIVERY_OFF: AlertDeliveryPrefs = { channel: "off", minPriority: "critical" };

/** A channel string from the wire, or undefined when it is not one we offer. */
export function parseChannel(value: unknown): DeliveryChannel | undefined {
  return DELIVERY_CHANNELS.find((channel) => channel === value);
}

/** A priority string from the wire, or undefined when it is not one of the three rungs. */
export function parsePriority(value: unknown): AlertPriority | undefined {
  return (["critical", "warning", "info"] as const).find((priority) => priority === value);
}

/**
 * Does this alert reach this member? Three gates, all of them the member's own choice:
 * the channel is on, a destination exists to send to, and the alert is at least as loud as the
 * floor they set. Dismissal is NOT consulted here — the strip subtracts dismissals before delivery
 * ever sees an alert (`desk-alerts-route.ts` does the same), and an alert a member already waved
 * away on screen is not news to mail.
 */
export function shouldDeliver(alert: Alert, prefs: AlertDeliveryPrefs): boolean {
  if (prefs.channel === "off") return false;
  if (!prefs.destination) return false;
  return priorityRank(alert.priority) <= priorityRank(prefs.minPriority);
}

/** How loud a member said they wanted it, in words a control can render. */
export const PRIORITY_FLOOR_WORDS: Record<AlertPriority, string> = {
  critical: "Act now only",
  warning: "Act now and worth a look",
  info: "Everything",
};

/** One message, ready for a transport. Plain text on purpose — no HTML, no tracking, no images. */
export interface DeliveryMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

/** What "the same alert, already sent" means — the substrate's own dismissal identity, reused so a
 *  re-derived alert with a fresh id is never mailed twice and an ESCALATED one is mailed again. */
export function deliveryFingerprint(alert: Alert): string {
  return alertFingerprint(alert);
}

const SUBJECT_PREFIX: Record<AlertPriority, string> = {
  critical: "Act now",
  warning: "Worth a look",
  info: "FYI",
};

/**
 * The message for one alert: the producer's own words, the priority said out loud, and a line
 * saying where this came from and how to stop it. Nothing computed, nothing inferred — a reader
 * who only ever sees these emails must never learn a number the app did not already show them.
 *
 * No link back, on purpose: this deployment has no configured public origin, and a guessed URL in
 * a credential-bearing channel is worse than a sentence naming the panel.
 */
export function deliveryMessage(alert: Alert, to: string): DeliveryMessage {
  const scope = alert.symbol ? `${alert.symbol} — ` : "";
  const lines = [
    alert.title,
    ...(alert.body ? ["", alert.body] : []),
    "",
    `Why you got this: ${SUBJECT_PREFIX[alert.priority]} alert from your own ${alert.source === "order-watch" ? "orders" : "option positions"} on Skynet Capital (paper trading, educational — no real money moves).`,
    "Turn delivery off any time on the Alerts panel of your Trade page.",
  ];
  return {
    to,
    subject: `[${SUBJECT_PREFIX[alert.priority]}] ${scope}${alert.title}`,
    text: lines.join("\n"),
  };
}
