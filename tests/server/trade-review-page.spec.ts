import type { ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { reviewPage } from "../../src/server/trade-review-page.js";
import type { TradeRouteDeps } from "../../src/server/trade-ticket-route.js";
import { previewOrder, type TicketContext } from "../../src/trading/order-ticket.js";

/**
 * The review screen's price fallback, at the seam where it is actually decided. The rule under
 * test is "never invent a price, and never spend a broker call that can't change the answer" —
 * so every case here is stated as when the lookup should and should not happen.
 */

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 748_645,
  equity: 749_845,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200 }],
  activity: [],
};

const context: TicketContext = {
  cash: ann.cash,
  positions: ann.positions,
  tradingEnabled: true,
  isSelf: true,
};

const capture = () => {
  const sent = { status: 0, body: "" };
  const res = {
    writeHead(status: number) {
      sent.status = status;
    },
    end(body?: string) {
      sent.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { sent, res };
};

const deps = (quote?: () => Promise<number | undefined>): TradeRouteDeps & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    snapshotFor: () => ann,
    requesterId: "ann",
    tradingEnabled: true,
    nav: { active: "you" as const, canAdd: false, authed: true },
    document: (_title: string, body: string) => body,
    ...(quote
      ? {
          optionsClientFor: () =>
            ({
              getUnderlyingPrice: async (symbol: string) => {
                calls.push(symbol);
                return await quote();
              },
            }) as unknown as AlpacaOptionsClient,
        }
      : {}),
  };
};

describe("the review page's price fallback", () => {
  it("quotes an unheld symbol and prices the order off it", async () => {
    const { sent, res } = capture();
    const d = deps(async () => 512.5);
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context);

    await reviewPage(res, "Review order", ann, preview, d, "ann");
    expect(d.calls).toEqual(["MSFT"]);
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("≈ $51,250");
    expect(sent.body).toContain("≈ $697,395");
  });

  it("spends no broker call for a symbol the account already holds", async () => {
    const { sent, res } = capture();
    const d = deps(async () => 999);
    const preview = previewOrder({ symbol: "AAPL", quantity: 10, action: "sell" }, context);

    await reviewPage(res, "Review order", ann, preview, d, "ann");
    expect(d.calls).toEqual([]);
    expect(sent.body).toContain("at the latest market price of $120.00");
  });

  it("spends no broker call for a limit order — the trader's own price is the basis", async () => {
    const { res } = capture();
    const d = deps(async () => 999);
    const preview = previewOrder(
      { symbol: "MSFT", quantity: 10, action: "buy", orderType: "limit", limitPrice: 500 },
      context,
    );

    await reviewPage(res, "Review order", ann, preview, d, "ann");
    expect(d.calls).toEqual([]);
  });

  it("spends no broker call on an order that is already refused", async () => {
    const { sent, res } = capture();
    const d = deps(async () => 999);
    const preview = previewOrder({ symbol: "MSFT", quantity: 5, action: "sell" }, context);
    expect(preview.ok).toBe(false);

    await reviewPage(res, "Order refused", ann, preview, d, "ann");
    expect(d.calls).toEqual([]);
    expect(sent.body).toContain("don't hold this symbol");
  });

  it("keeps saying the cost is unknown when the quote lookup fails", async () => {
    const { sent, res } = capture();
    const d = deps(() => Promise.reject(new Error("broker unreachable")));
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context);

    await reviewPage(res, "Review order", ann, preview, d, "ann");
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("unknown until it fills");
  });

  it("keeps saying the cost is unknown when no account is linked to quote from", async () => {
    const { sent, res } = capture();
    const preview = previewOrder({ symbol: "MSFT", quantity: 100, action: "buy" }, context);

    await reviewPage(res, "Review order", ann, preview, deps(), "ann");
    expect(sent.body).toContain("unknown until it fills");
  });
});
