import type { OrderResult } from "../domain/types.js";

/**
 * What the broker said about an order, when it says something the result does not (#4650). The
 * store keeps every result's words (`decision-db-results.ts`); a reader is shown them only where the
 * order never traded — a limit not reached, a rejection, an error — because there they answer "why
 * not". A fill's words ("partial fill; remainder canceled") and a working order's ("order accepted",
 * "cancel not confirmed") restate what the row already shows, or what its settlement will replace;
 * and a rejection whose words are only "order rejected" adds nothing to the result itself.
 *
 * Shared by the pass log (`decision-json-view.ts`) and a fill's why (`wire-reasoning.ts`), so both
 * surfaces say it once, on the same rule. The words stay the owner's alone (`desk-owner-gate.ts`).
 */
export function brokerWordsFor(result: OrderResult | undefined): string | undefined {
  if (!(result?.reason && (result.status === "unfilled" || result.status === "rejected"))) {
    return undefined;
  }
  const words = result.reason.trim();
  return words && words.toLowerCase() !== `order ${result.status}` ? words : undefined;
}
