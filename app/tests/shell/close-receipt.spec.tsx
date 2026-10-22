import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PositionLot } from "../../src/live/desk";
import type { DeskOrderEvent } from "../../src/live/desk-events";
import {
  CloseReceipt,
  fifoLine,
  fifoTakes,
  type SentClose,
  soldLine,
} from "../../src/shell/close-receipt";

/**
 * What a close did (#5959). Eric closed NVDA's newest buy (22 shares) and the OLDER buy shrank —
 * the ledger pairs a sell with the oldest buy first and the order names no buy — while the panel
 * vanished with no word on what happened.
 *
 * WHEN a sell leaves part of a many-buy position open, THE confirm step SHALL say which buys it
 * comes out of, oldest first. WHEN the order is sent, THE row SHALL say so; WHEN the desk's stream
 * carries its fill, THE row SHALL read "Sold 22 NVDA · $4,688" until dismissed.
 */

const buy = (openedAt: string, quantity: string): PositionLot => ({
  lotId: `NVDA-${openedAt}`,
  openedAt,
  quantity,
  costPerShare: "$200.00",
  price: "$213.09",
  costBasis: "$0",
  value: "$0",
  dayPl: "$0",
  dayTone: "flat",
  totalPl: "$0",
  returnPct: "0%",
  totalTone: "flat",
});

// Three buys, oldest first — the order `desk-json-view.ts` lists them in.
const threeBuys = [
  buy("2026-10-22 14:20 UTC", "10"),
  buy("2026-10-22 14:25 UTC", "56"),
  buy("2026-10-22 14:28 UTC", "22"),
];

describe("fifoTakes — which buys a sell comes out of", () => {
  it("takes a sell sized to the NEWEST buy from the oldest ones first", () => {
    expect(fifoTakes(threeBuys, 22)).toEqual([
      { openedAt: "2026-10-22 14:20 UTC", from: 10, to: 0 },
      { openedAt: "2026-10-22 14:25 UTC", from: 56, to: 44 },
    ]);
  });

  it("leaves the newest buy untouched until every older one is gone", () => {
    const taken = fifoTakes(threeBuys, 70);
    expect(taken.map((t) => t.to)).toEqual([0, 0, 18]);
  });

  it("reads a thousands-separated size", () => {
    expect(fifoTakes([buy("a", "1,200"), buy("b", "5")], 400)).toEqual([
      { openedAt: "a", from: 1200, to: 800 },
    ]);
  });
});

describe("fifoLine — said before Confirm", () => {
  it("names each buy the sell shrinks, oldest first", () => {
    expect(fifoLine(threeBuys, 22, "shares")).toBe(
      "Comes out of your oldest buys first: 2026-10-22 14:20 UTC, 10 → 0 · 2026-10-22 14:25 UTC, 56 → 44 shares",
    );
  });

  it("says buy, singular, when one buy covers it", () => {
    expect(fifoLine(threeBuys, 4, "shares")).toBe(
      "Comes out of your oldest buy first: 2026-10-22 14:20 UTC, 10 → 6 shares",
    );
  });

  it("says nothing when there is no choice to explain: one buy, or a sell of everything", () => {
    expect(fifoLine([buy("a", "22")], 10, "shares")).toBeUndefined();
    expect(fifoLine(threeBuys, 88, "shares")).toBeUndefined();
    expect(fifoLine(undefined, 10, "shares")).toBeUndefined();
  });
});

const sent: SentClose = {
  orderId: "ord-1",
  status: "accepted",
  symbol: "NVDA",
  display: "NVDA",
  side: "sell",
  count: 22,
  estNotional: 4687.98,
};

const frame = (
  eventType: string,
  payload: Record<string, unknown>,
  orderId = "ord-1",
): DeskOrderEvent => ({
  id: `${orderId}:${eventType}`,
  eventType,
  orderId,
  at: "2026-10-22T14:30:00Z",
  outcome: "success",
  payload,
});

describe("soldLine — the row's receipt", () => {
  it("says what was sent, and that the fill is pending, before the stream carries it", () => {
    expect(soldLine(sent, undefined)).toEqual({
      text: "Sell 22 NVDA sent · est $4,688 · waiting for the fill",
      tone: "ok",
    });
  });

  it("says Sold, in the fill's own numbers, once the stream carries the fill", () => {
    const fill = frame("order.filled", { filledQuantity: 22, price: 213.09, status: "filled" });
    expect(soldLine(sent, fill)).toEqual({ text: "Sold 22 NVDA · $4,688", tone: "ok" });
  });

  it("scales an option's per-share premium to the contract", () => {
    const put: SentClose = {
      ...sent,
      symbol: "CRWV261120P00080000",
      display: "CRWV $80 put",
      side: "buy",
      count: 1,
    };
    const fill = frame("order.filled", { filledQuantity: 1, price: 5.5, status: "filled" });
    expect(soldLine(put, fill).text).toBe("Bought back 1 CRWV $80 put · $550");
  });

  it("never says Sold for an order that ended unfilled", () => {
    const fill = frame("order.updated", { status: "canceled" });
    expect(soldLine(sent, fill)).toEqual({
      text: "Sell 22 NVDA canceled — nothing sold",
      tone: "err",
    });
  });

  it("reads a partial fill as one", () => {
    const fill = frame("order.updated", { status: "partially_filled", filledQuantity: 10 });
    expect(soldLine(sent, fill).text).toBe("Sell 22 NVDA sent · est $4,688 · partly filled");
  });
});

describe("CloseReceipt", () => {
  it("shows the sent line, and offers Dismiss", () => {
    const onDismiss = rstest.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CloseReceipt deskId="sauron" sent={sent} onDismiss={onDismiss} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sell 22 NVDA sent · est $4,688 · waiting for the fill",
    );
    // Dismiss clearing the line is the row's job — `close-panel.spec.tsx` › keeps a line in the row.
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
