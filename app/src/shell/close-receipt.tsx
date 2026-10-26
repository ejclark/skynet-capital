import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { contractMultiplier } from "../../../src/trading/option-symbols";
import { dollars } from "../live/book-health";
import type { PositionLot } from "../live/desk";
import { type DeskOrderEvent, invalidateDesk, useOrderFill } from "../live/desk-events";
import { parseQuantity } from "../live/quantity";
import { InlineResult } from "../ui";
import { isCompletedFill, useFillFlare } from "./fill-flare";

/**
 * WHAT A CLOSE DID, SAID ONCE IT IS SENT (#5959). Three gaps one report found:
 *  - **Which buy a sell comes out of.** The ledger pairs a sell with the OLDEST open buy first
 *    (`src/trading/round-trips.ts`, FIFO), and the order carries no buy id, so a sell sized to the
 *    newest buy still shrinks the oldest. Until a sell can name its buy, the confirm step says which
 *    buys it will come out of (`fifoLine`) and only the oldest buy's button says "Close this buy".
 *  - **No word on success.** The close panel unmounted the moment the order was accepted, so the
 *    member saw the form vanish and nothing else. The row now keeps a line — "Sold 22 NVDA ·
 *    $4,688" — until dismissed or the next close, and "Sold" is a word the desk's own fill stream
 *    earns (`useOrderFill`, as the Trade page's ticket does), never the broker's "accepted".
 *  - **A row that didn't move.** The re-read fired at submit, before the paper fill landed, and
 *    never reached the Accounts page's `["desks", …]` read. It now fires again on the fill (and once
 *    more after a few seconds for a desk with no event stream) across every view of the desk.
 */

/** The order a close sent, as the row's receipt needs it. */
export interface SentClose {
  readonly orderId: string;
  /** The broker's echo at submit — "accepted", "new", now and then "filled". */
  readonly status: string;
  readonly symbol: string;
  readonly display: string;
  /** Sell (a held position) or buy (a written option's buy to close). */
  readonly side: "buy" | "sell";
  readonly count: number;
  readonly estNotional?: number;
}

/** Every read of a desk's positions a close changes: the desk's own (Overview, `/u/:id`, the
 *  option book), its activity, and the Accounts page's merged reads. */
export function refreshAfterClose(queryClient: QueryClient, deskId: string): void {
  invalidateDesk(queryClient, deskId);
  for (const queryKey of [
    ["desk-activity", deskId],
    ["desks"],
    ["accounts-activity"],
    ["accounts-networth"],
  ]) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/** One buy's size before and after a sell takes from it. */
export interface BuyTaken {
  readonly openedAt: string;
  readonly from: number;
  readonly to: number;
}

/** The buys a sell of `count` comes out of, oldest first — the ledger's FIFO pairing. `buys`
 *  arrive oldest first (`desk-json-view.ts` lists the matcher's open lots in queue order). */
export function fifoTakes(buys: readonly PositionLot[], count: number): BuyTaken[] {
  const taken: BuyTaken[] = [];
  let left = count;
  for (const buy of buys) {
    if (left <= 0) break;
    const from = parseQuantity(buy.quantity);
    if (!Number.isFinite(from) || from <= 0) continue;
    const take = Math.min(from, left);
    taken.push({ openedAt: buy.openedAt, from, to: from - take });
    left -= take;
  }
  return taken;
}

/** "Comes out of your oldest buy first: 2026-10-22 14:25 UTC, 56 → 34 shares" — said before
 *  Confirm whenever a sell leaves part of a many-buy position open. Undefined when there is no
 *  choice to explain: one buy, or a sell of everything. */
export function fifoLine(
  buys: readonly PositionLot[] | undefined,
  count: number,
  unit: string,
): string | undefined {
  if (!buys || buys.length < 2) return undefined;
  const taken = fifoTakes(buys, count);
  const total = buys.reduce((sum, b) => sum + (parseQuantity(b.quantity) || 0), 0);
  if (taken.length === 0 || count >= total) return undefined;
  const which = taken.length === 1 ? "your oldest buy" : "your oldest buys";
  const n = (value: number) => value.toLocaleString("en-US");
  const steps = taken.map((t) => `${t.openedAt}, ${n(t.from)} → ${n(t.to)}`).join(" · ");
  return `Comes out of ${which} first: ${steps} ${unit}`;
}

const numberField = (fill: DeskOrderEvent, key: string): number | undefined => {
  const value = fill.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

/** The order's status word: the stream's latest, else the broker's echo at submit. */
const statusOf = (sent: SentClose, fill: DeskOrderEvent | undefined): string => {
  const streamed = fill?.payload.status;
  return (typeof streamed === "string" ? streamed : sent.status).toLowerCase();
};

/** Statuses that end an order without the close it asked for. */
const ENDED_UNFILLED = new Set(["canceled", "cancelled", "rejected", "expired"]);

/**
 * The receipt line: "Sold 22 NVDA · $4,688" once the stream carries this order's fill (its own
 * quantity and price, an option's premium scaled per contract), and until then what was sent —
 * "Sell 22 NVDA sent · est $4,688 · waiting for the fill". A written option's close reads "Bought
 * back". `tone` is `err` only when the order ended unfilled.
 */
export function soldLine(
  sent: SentClose,
  fill: DeskOrderEvent | undefined,
): { readonly text: string; readonly tone: "ok" | "err" } {
  const past = sent.side === "sell" ? "Sold" : "Bought back";
  const present = sent.side === "sell" ? "Sell" : "Buy back";
  if (isCompletedFill(fill)) {
    const quantity = numberField(fill, "filledQuantity") ?? sent.count;
    const price = numberField(fill, "price");
    const worth =
      price !== undefined
        ? ` · ${dollars(quantity * price * contractMultiplier(sent.symbol))}`
        : "";
    return { text: `${past} ${quantity} ${sent.display}${worth}`, tone: "ok" };
  }
  const est = sent.estNotional !== undefined ? ` · est ${dollars(sent.estNotional)}` : "";
  const status = statusOf(sent, fill);
  if (ENDED_UNFILLED.has(status)) {
    return {
      text: `${present} ${sent.count} ${sent.display} ${status} — nothing sold`,
      tone: "err",
    };
  }
  if (status === "filled")
    return { text: `${past} ${sent.count} ${sent.display}${est}`, tone: "ok" };
  const progress = status === "partially_filled" ? "partly filled" : "waiting for the fill";
  return { text: `${present} ${sent.count} ${sent.display} sent${est} · ${progress}`, tone: "ok" };
}

/** Seconds after the send to read the desk once more, for a desk the event stream can't reach. */
const FALLBACK_REREAD_MS = 3000;

/** The row's receipt for one sent close, until Dismiss or the next close replaces it. Keyed by
 *  the order id where it mounts, so each order gets its own fallback re-read. */
export function CloseReceipt({
  deskId,
  sent,
  onDismiss,
}: {
  readonly deskId: string;
  readonly sent: SentClose;
  readonly onDismiss: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const fill = useOrderFill(deskId, sent.orderId);
  useFillFlare(fill);
  const filled = isCompletedFill(fill);
  useEffect(() => {
    if (filled) refreshAfterClose(queryClient, deskId);
  }, [filled, queryClient, deskId]);
  useEffect(() => {
    const timer = setTimeout(() => refreshAfterClose(queryClient, deskId), FALLBACK_REREAD_MS);
    return () => clearTimeout(timer);
  }, [queryClient, deskId]);
  const line = soldLine(sent, fill);
  return (
    <div className="close-receipt">
      <InlineResult as="span" tone={line.tone} className="tkt-close-note">
        {line.text}
      </InlineResult>
      <button type="button" className="btn mc-btn" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
