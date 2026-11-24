import { finiteOrUndefined } from "../domain/finite.js";
import type { Alert } from "./alert.js";
import type { DeliveryMessage } from "./alert-delivery.js";
import { ORDER_WATCH_SOURCE } from "./order-watch.js";

/**
 * ONE ORDER, ONE EMAIL (#8251) — the pure half of "Email me when it fills" on the order receipt.
 *
 * The account-wide delivery switch (`alert-delivery.ts`) mails a fill only on the `info` floor,
 * which also mails every position alert. A member who placed an order after hours wants one thing:
 * to hear when THAT order is done. A watch is that ask, and nothing else — it never changes the
 * member's channel or floor, and it ends itself after one message.
 *
 * Honesty rules, the same as the alert email's:
 * - every number is the ledger's own, carried on the order-watch alert's `data` — nothing computed;
 * - the subject leads with the outcome and the order in words, never an order id;
 * - the link was built when the member tapped (the configured public origin, else the tap's own
 *   request origin), never guessed at send time;
 * - the address is the one the member's session carried at the tap, and the dispatcher re-checks it
 *   against the account's current owner before sending.
 */

/** One armed watch. `destination` and `link` are captured from the tap, server side. */
export interface FillWatch {
  readonly orderId: string;
  readonly destination: string;
  readonly link: string;
  /** When it was armed (ISO). */
  readonly at: string;
}

/**
 * How long a watch may stay open (#8352). An after-hours order placed on a Friday night ends by
 * Monday's close; a week covers a long weekend with room to spare. Past it the watch is dropped
 * with a logged note: the order's ending has left the ledger's 24 h alert window by then
 * (`ORDER_WATCH_WINDOW_MS`), so no later pass could ever word the email, and an open line would
 * hold one of the 50 watch slots for good.
 */
export const WATCH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Refused sends one watch may spend before it is dropped with a logged note (#8352). The hourly
 *  sweep and any order event each earn a pass, so five is a few hours of provider trouble — enough
 *  to ride out a rate limit, never a loop against a provider that keeps saying no. */
export const WATCH_MAX_SEND_FAILURES = 5;

/** The states that end a watch. A partial fill is not one: the order is still working. */
const ENDINGS: Readonly<Record<string, { readonly word: string; readonly filled: boolean }>> = {
  filled: { word: "Filled", filled: true },
  canceled: { word: "Cancelled", filled: false },
  cancelled: { word: "Cancelled", filled: false },
  done_for_day: { word: "Cancelled at the close", filled: false },
  expired: { word: "Expired", filled: false },
  rejected: { word: "Rejected", filled: false },
};

/** What the ledger says happened to one order, read off an order-watch alert's structured data. */
export interface WatchOutcome {
  readonly orderId: string;
  readonly status: string;
  readonly display: string;
  readonly quantity?: number;
  readonly filledQuantity?: number;
  readonly price?: number;
}

/** The ledger's ending for `orderId`, or undefined while it is still working (or partly filled). */
export function watchOutcome(alerts: readonly Alert[], orderId: string): WatchOutcome | undefined {
  for (const alert of alerts) {
    if (alert.source !== ORDER_WATCH_SOURCE || alert.data?.orderId !== orderId) continue;
    const status = typeof alert.data.status === "string" ? alert.data.status : "";
    if (!ENDINGS[status]) continue;
    const display = typeof alert.data.display === "string" ? alert.data.display : "order";
    const quantity = finiteOrUndefined(alert.data.quantity);
    const filledQuantity = finiteOrUndefined(alert.data.filledQuantity);
    const price = finiteOrUndefined(alert.data.price);
    return {
      orderId,
      status,
      display,
      ...(quantity !== undefined ? { quantity } : {}),
      ...(filledQuantity !== undefined ? { filledQuantity } : {}),
      ...(price !== undefined ? { price } : {}),
    };
  }
  return undefined;
}

/** The sent-ledger key: one email per watched order, ever — a re-derived ending never re-sends. */
export function fillWatchFingerprint(orderId: string): string {
  return `fill-watch:${orderId}`;
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "Filled: 3 NVDA at $120.00" · "Cancelled, not filled: 10 NVDA" · "Cancelled with 4 of 10
 *  filled: NVDA". The size and price are the ledger's; an absent number is left out, not guessed. */
export function fillWatchSubject(outcome: WatchOutcome): string {
  const ending = ENDINGS[outcome.status] ?? { word: "Ended", filled: false };
  const { quantity, filledQuantity, price, display } = outcome;
  if (ending.filled) {
    const size = filledQuantity ?? quantity;
    const sized = size !== undefined ? `${size} ${display}` : display;
    return `${ending.word}: ${sized}${price !== undefined ? ` at ${usd(price)}` : ""}`;
  }
  if (filledQuantity !== undefined && filledQuantity > 0 && quantity !== undefined) {
    return `${ending.word} with ${filledQuantity} of ${quantity} filled: ${display}`;
  }
  const sized = quantity !== undefined ? `${quantity} ${display}` : display;
  return `${ending.word}, not filled: ${sized}`;
}

/** The whole message: the outcome in words, one link back to the order, and why it came. */
export function fillWatchMessage(watch: FillWatch, outcome: WatchOutcome): DeliveryMessage {
  const ending = ENDINGS[outcome.status];
  const subject = fillWatchSubject(outcome);
  const what = ending?.filled
    ? "Your order filled."
    : outcome.status === "rejected"
      ? "The broker refused your order, so it will not fill. The ticket's review shows the reason the next time you send one."
      : "Your order ended without filling.";
  const text = [
    subject,
    "",
    what,
    "",
    `See it on your Orders: ${watch.link}`,
    "",
    "Why you got this: you tapped “Email me when it fills” on this order on Skynet Capital (paper trading, educational — no real money moves).",
    "This was a one-time email for this order. Your alert settings did not change.",
  ].join("\n");
  return { to: watch.destination, subject, text };
}
