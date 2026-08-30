import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Participant } from "../../src/participants/participant.js";
import { resolveDeskTrading } from "../../src/server/account-identity-gate.js";

/**
 * THE SHARE DESK'S EXECUTION SEAM — the review screen is a courtesy, this re-check is the gate:
 * it re-reads the live account and re-runs the SAME pure ticket rules before ever calling the
 * broker (`account-identity-gate.ts`'s `verifyOwnAccount` and `desk-gate.ts`'s
 * `readReview`/`submitAndAudit` are the shared machinery this and the options desk both stand on).
 */

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

function transport(
  fixture: { cash: string; positions?: unknown },
  orders: Array<{ path: string; body: unknown }>,
): AlpacaTradingTransport {
  const inner = new FixtureTradingTransport({
    account: { id: "acct", cash: fixture.cash, portfolio_value: fixture.cash, status: "ACTIVE" },
    positions: fixture.positions ?? [],
  });
  return {
    get: (path): Promise<JsonResponse> => inner.get(path),
    post: (_path, body): Promise<JsonResponse> => {
      orders.push({ path: _path, body });
      const b = body as { symbol: string };
      return Promise.resolve({
        status: 200,
        body: { id: "order-1", symbol: b.symbol, status: "accepted" },
      });
    },
    delete: (path): Promise<JsonResponse> => inner.delete(path),
  };
}

function makeService(options: { cash?: string; positions?: unknown; authConfigured?: boolean }) {
  const orders: Array<{ path: string; body: unknown }> = [];
  const audited: unknown[] = [];
  const t = transport(
    {
      cash: options.cash ?? "100000",
      ...(options.positions ? { positions: options.positions } : {}),
    },
    orders,
  );
  const desk = resolveDeskTrading({
    findParticipant: (id) => (id === "ann" ? ann : undefined),
    clientFactory: () => new AlpacaTradingClient(t),
    optionsClientFactory: () => new AlpacaOptionsClient(t),
    authConfigured: options.authConfigured ?? true,
    recordAudit: (entry) => Promise.resolve(void audited.push(entry)),
  });
  return { desk, orders, audited };
}

describe("resolveDeskTrading", () => {
  it("is enabled only when an authenticator is configured — no separate kill switch", () => {
    expect(makeService({ authConfigured: true }).desk.enabled).toBe(true);
    expect(makeService({ authConfigured: false }).desk.enabled).toBe(false);
  });

  it("refuses every order when no authenticator is configured, before touching the broker", async () => {
    const { desk, orders } = makeService({ authConfigured: false });
    const result = await desk.submit(
      { participantId: "ann", symbol: "NVDA", quantity: 5, action: "buy" },
      "ann",
    );
    expect(result).toMatchObject({
      ok: false,
      refusals: [expect.stringContaining("switched off")],
    });
    expect(orders).toHaveLength(0);
  });

  it("refuses anyone but the account's own resolved identity", async () => {
    const { desk, orders } = makeService({});
    const result = await desk.submit(
      { participantId: "ann", symbol: "NVDA", quantity: 5, action: "buy" },
      "joe",
    );
    expect(result.ok).toBe(false);
    expect(orders).toHaveLength(0);
  });

  it("re-checks the discipline rules on FRESH numbers — a drained account is caught", async () => {
    const { desk, orders } = makeService({
      cash: "100",
      positions: [{ symbol: "NVDA", qty: "10", avg_entry_price: "100", market_value: "1000" }],
    });
    const result = await desk.submit(
      { participantId: "ann", symbol: "nvda", quantity: 5, action: "buy" },
      "ann",
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.refusals.join(" ")).toContain(
        "Estimated cost is more than your available cash",
      );
    expect(orders).toHaveLength(0);
  });

  it("submits a market buy, symbol normalized, day time-in-force", async () => {
    const { desk, orders } = makeService({});
    const result = await desk.submit(
      { participantId: "ann", symbol: "nvda", quantity: 5, action: "buy" },
      "ann",
    );
    expect(result).toMatchObject({ ok: true, orderId: "order-1" });
    expect(orders[0]?.body).toMatchObject({
      symbol: "NVDA",
      qty: 5,
      side: "buy",
      type: "market",
      time_in_force: "day",
    });
  });

  it("submits a limit sell within the held quantity, gtc time-in-force", async () => {
    const { desk, orders } = makeService({
      positions: [{ symbol: "NVDA", qty: "10", avg_entry_price: "100", market_value: "1000" }],
    });
    const result = await desk.submit(
      {
        participantId: "ann",
        symbol: "NVDA",
        quantity: 4,
        action: "sell",
        orderType: "limit",
        limitPrice: 105,
      },
      "ann",
    );
    expect(result.ok).toBe(true);
    expect(orders[0]?.body).toMatchObject({
      symbol: "NVDA",
      qty: 4,
      side: "sell",
      type: "limit",
      time_in_force: "gtc",
      limit_price: 105,
    });
  });

  it("refuses selling more than held — this desk never opens a short", async () => {
    const { desk, orders } = makeService({
      positions: [{ symbol: "NVDA", qty: "2", avg_entry_price: "100", market_value: "200" }],
    });
    const result = await desk.submit(
      { participantId: "ann", symbol: "NVDA", quantity: 5, action: "sell" },
      "ann",
    );
    expect(result.ok).toBe(false);
    expect(orders).toHaveLength(0);
  });

  it("tags a buy's audit line 101/open, a sell's 102/close", async () => {
    const { desk, audited } = makeService({
      positions: [{ symbol: "NVDA", qty: "10", avg_entry_price: "100", market_value: "1000" }],
    });
    await desk.submit({ participantId: "ann", symbol: "NVDA", quantity: 1, action: "buy" }, "ann");
    await desk.submit({ participantId: "ann", symbol: "NVDA", quantity: 1, action: "sell" }, "ann");
    expect(audited[0]).toMatchObject({ code: "101", intent: "open", side: "buy" });
    expect(audited[1]).toMatchObject({ code: "102", intent: "close", side: "sell" });
  });
});
