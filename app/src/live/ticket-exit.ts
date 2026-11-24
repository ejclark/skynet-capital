import { signedDollars } from "./order-facts";
import { money } from "./ticket";

/**
 * THE EXIT AT ENTRY, IN WORDS (#8249 PR 2) — what the stock form, its review and its receipt say
 * about a take-profit and a stop the broker holds with a whole-share limit buy. Pure, so every
 * sentence is specced; the form (`shell/exit-fields.tsx`, `shell/trade-gate.tsx`) renders them.
 *
 * Honesty rules: every price and dollar figure is the server's — the review's come from
 * `previewOrder` (`src/trading/order-exit.ts`), the receipt's from the broker's own echo — and
 * nothing here computes one. The two exits are told apart by their words ("Take-profit", "Stop-Market": never a bare "Stop", the ticket's own rule in `ticket.ts`)
 * and their signed dollars, never by a colour: a standing reader is red/green colourblind.
 */

/** What an exit does once placed, said before it is placed. Alpaca holds a bracket's exits to the
 *  regular session, so the line says when they don't act. */
export const EXIT_HOURS_NOTE =
  "Guards regular hours only: the take-profit and stop don't act between 4pm and 9:30am ET.";

/** The exit's time in force, stated where the picker would be: an exit is sent GTC, since one that
 *  expired at the close would protect nothing overnight (the server refuses Day). */
export const EXIT_TIF_NOTE =
  "Time in force: GTC. The entry and its exits stay working until they fill or you cancel.";

/** The review's two exit lines, from the server's preview. A leg whose dollars the server could not
 *  measure (no limit to measure against) states its price alone. The stop's figure is "about":
 *  once triggered it sells at the market, which in a fast move is past the stop. The sign carries
 *  the direction ("+$12.00", "−$18.00", `signedDollars`), so no colour has to. */
export function exitPreviewLines(exit: {
  readonly takeProfit: number;
  readonly stop: number;
  readonly takeProfitDollars?: number;
  readonly stopDollars?: number;
}): readonly [string, string] {
  const tp =
    exit.takeProfitDollars === undefined
      ? ""
      : ` · ${signedDollars(exit.takeProfitDollars)} against your limit if it fills`;
  const stop =
    exit.stopDollars === undefined
      ? ""
      : ` · about ${signedDollars(exit.stopDollars)} against your limit (a triggered stop sells at the market)`;
  return [`Take-profit ${money(exit.takeProfit)}${tp}`, `Stop-Market ${money(exit.stop)}${stop}`];
}

/** The receipt's exit line, at the prices the broker echoed. It states the order as the broker
 *  took it and the rules it runs by — never where the exits stand now, which the headline above it
 *  follows (a cancelled entry cancels both exits, and this line must stay true when it does). */
export function exitReceiptLine(exits: {
  readonly takeProfit: number;
  readonly stop: number;
}): string {
  return `Sent with its exits: Take-profit ${money(exits.takeProfit)} · Stop-Market ${money(exits.stop)}. The broker holds them until the entry fills; when one fills the other is cancelled, and cancelling the entry cancels both.`;
}

/** An orders-list row's name for a bracket exit, by its job (`exitRole`, `desk-orders-view.ts`). */
export const EXIT_ROLE_LABELS: Record<"take-profit" | "stop", string> = {
  "take-profit": "Take-profit",
  stop: "Stop-Market",
};
