import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Participant } from "../../src/participants/participant.js";
import { bindAccountIdentityGate } from "../../src/server/account-identity-gate.js";
import {
  createDraftTradeService,
  multiLegStructure,
} from "../../src/server/draft-trade-service.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import type { DraftLeg, DraftOrder } from "../../src/trading/draft-order.js";

/**
 * The multi-leg execution seam (#3407 P3 slice 1): a reviewed draft is re-checked on live
 * numbers and sent as ONE `mleg` order — net limit in Alpaca's sign (debit +, credit −), legs
 * in ratio, position intent read off the live book — and audited under the 401 rung.
 */

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

function transport(
  fixture: { cash: string; positions?: unknown; optionsTradingLevel?: number },
  orders: Array<{ path: string; body: unknown }>,
  reply: JsonResponse = {
    status: 200,
    body: { id: "mleg-1", symbol: "", status: "accepted", time_in_force: "day" },
  },
): AlpacaTradingTransport {
  const inner = new FixtureTradingTransport({
    account: {
      id: "acct",
      cash: fixture.cash,
      portfolio_value: fixture.cash,
      status: "ACTIVE",
      ...(fixture.optionsTradingLevel !== undefined
        ? { options_trading_level: fixture.optionsTradingLevel }
        : {}),
    },
    positions: fixture.positions ?? [],
  });
  return {
    get: (path): Promise<JsonResponse> => inner.get(path),
    post: (path, body): Promise<JsonResponse> => {
      orders.push({ path, body });
      return Promise.resolve(reply);
    },
    delete: (path): Promise<JsonResponse> => inner.delete(path),
  };
}

const SHORT_CALL: DraftLeg = {
  id: "leg-1",
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 2,
  limitPrice: 4.2,
};
const LONG_CALL: DraftLeg = {
  ...SHORT_CALL,
  id: "leg-2",
  strike: 200,
  action: "buy",
  limitPrice: 1.1,
};

function reviewed(legs: readonly DraftLeg[] = [SHORT_CALL, LONG_CALL]): DraftOrder {
  return {
    phase: "reviewed",
    legs,
    verdict: { ok: true, refusals: [], warnings: [] },
    refusals: [],
    nextLegId: legs.length + 1,
  };
}

function makeService(options: {
  cash?: string;
  positions?: unknown;
  enabled?: boolean;
  optionsTradingLevel?: number;
  reply?: JsonResponse;
}) {
  const orders: Array<{ path: string; body: unknown }> = [];
  const audited: OrderAuditRecord[] = [];
  const t = transport(
    {
      cash: options.cash ?? "100000",
      ...(options.positions ? { positions: options.positions } : {}),
      ...(options.optionsTradingLevel !== undefined
        ? { optionsTradingLevel: options.optionsTradingLevel }
        : {}),
    },
    orders,
    options.reply,
  );
  const verifyAccess = bindAccountIdentityGate({
    findParticipant: (id) => (id === "ann" ? ann : undefined),
    clientFactory: () => new AlpacaTradingClient(t),
    optionsClientFactory: () => new AlpacaOptionsClient(t),
    tradingEnabled: options.enabled ?? true,
  });
  const submit = createDraftTradeService({
    verifyAccess,
    recordAudit: (entry) => Promise.resolve(void audited.push(entry)),
  });
  return { submit, orders, audited };
}

describe("multiLegStructure — the unit the broker prices", () => {
  it("reduces 2/2 to quantity 2 of a 1:1 unit and nets a credit as a negative limit", () => {
    expect(multiLegStructure([SHORT_CALL, LONG_CALL])).toEqual({
      quantity: 2,
      ratios: [1, 1],
      netLimitPrice: -3.1,
    });
  });

  it("keeps a 1:2 ratio on the legs and nets the debit per unit", () => {
    const one = { ...LONG_CALL, contracts: 1, limitPrice: 5 };
    const two = { ...SHORT_CALL, contracts: 2, limitPrice: 1.5 };
    expect(multiLegStructure([one, two])).toEqual({
      quantity: 1,
      ratios: [1, 2],
      netLimitPrice: 2,
    });
  });
});

describe("draft trade service — the gate", () => {
  it("refuses when trading is switched off, before touching anything", async () => {
    const { submit, orders } = makeService({ enabled: false });
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result).toMatchObject({ ok: false });
    expect(orders).toHaveLength(0);
  });

  it("refuses anyone but the account's own resolved identity", async () => {
    const { submit, orders } = makeService({});
    expect((await submit({ participantId: "ann", draft: reviewed() }, "joe")).ok).toBe(false);
    expect((await submit({ participantId: "ann", draft: reviewed() }, undefined)).ok).toBe(false);
    expect(orders).toHaveLength(0);
  });

  it("sends only from the review screen — an echoed 'validated' draft never fires", async () => {
    const { submit, orders } = makeService({});
    const result = await submit(
      { participantId: "ann", draft: { ...reviewed(), phase: "validated" } },
      "ann",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals[0]).toContain("review screen");
    expect(orders).toHaveLength(0);
  });

  it("refuses an unpriced leg — a spread is one net limit, so every leg must carry one", async () => {
    const { submit, orders } = makeService({});
    const { limitPrice: _unpriced, ...atMarket } = LONG_CALL;
    const result = await submit(
      { participantId: "ann", draft: reviewed([SHORT_CALL, atMarket]) },
      "ann",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals[0]).toContain("one net limit");
    expect(orders).toHaveLength(0);
  });
});

describe("draft trade service — the live re-check", () => {
  it("re-runs the collateral rules on FRESH numbers — a drained account is caught", async () => {
    const { submit, orders } = makeService({ cash: "100" }); // a $20-wide 2-lot needs $4,000
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals.join(" ")).toContain("set aside");
    expect(orders).toHaveLength(0);
  });

  it("refuses when the account's options level is below spreads (level 3)", async () => {
    const { submit, orders } = makeService({ optionsTradingLevel: 2 });
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals.join(" ")).toContain("level 3");
    expect(orders).toHaveLength(0);
  });

  it("names the read failure in a fixed sentence, never the exception", async () => {
    const orders: Array<{ path: string; body: unknown }> = [];
    const broken: AlpacaTradingTransport = {
      get: () => Promise.reject(new Error("proxy banner with a hostname")),
      post: (path, body) => {
        orders.push({ path, body });
        return Promise.resolve({ status: 200, body: {} });
      },
      delete: () => Promise.resolve({ status: 200, body: {} }),
    };
    const submit = createDraftTradeService({
      verifyAccess: bindAccountIdentityGate({
        findParticipant: () => ann,
        clientFactory: () => new AlpacaTradingClient(broken),
        optionsClientFactory: () => new AlpacaOptionsClient(broken),
        tradingEnabled: true,
      }),
    });
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.refusals[0]).toContain("Couldn't read the account");
      expect(result.refusals[0]).not.toContain("hostname");
    }
    expect(orders).toHaveLength(0);
  });
});

describe("draft trade service — the wire", () => {
  it("sends a verified credit spread as ONE mleg order: net credit negative, legs in ratio, day", async () => {
    const { submit, orders, audited } = makeService({ optionsTradingLevel: 3 });
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result).toMatchObject({ ok: true, orderId: "mleg-1", status: "accepted" });
    expect(orders).toHaveLength(1);
    expect(orders[0]?.path).toBe("/v2/orders");
    expect(orders[0]?.body).toEqual({
      order_class: "mleg",
      qty: 2,
      type: "limit",
      limit_price: -3.1,
      time_in_force: "day",
      legs: [
        {
          symbol: "NVDA260918C00180000",
          ratio_qty: 1,
          side: "sell",
          position_intent: "sell_to_open",
        },
        {
          symbol: "NVDA260918C00200000",
          ratio_qty: 1,
          side: "buy",
          position_intent: "buy_to_open",
        },
      ],
    });
    // The parent order carries no single symbol; the audit line names the legs, under the
    // 401 rung, as a sell (a credit is sold).
    expect(audited).toHaveLength(1);
    expect(audited[0]).toMatchObject({
      participantId: "ann",
      orderId: "mleg-1",
      code: "401",
      intent: "open",
      side: "sell",
      symbol: "NVDA260918C00180000,NVDA260918C00200000",
    });
  });

  it("passes a member's GTC through and reads to_close intents off the live book", async () => {
    const { submit, orders } = makeService({
      optionsTradingLevel: 3,
      positions: [
        {
          symbol: "NVDA260918C00180000",
          qty: "-2",
          avg_entry_price: "4.00",
          market_value: "-800",
          asset_class: "us_option",
        },
      ],
    });
    // Buying back the short 180 call closes what the book holds; the new short 160 call opens,
    // capped by that same 180 leg — a roll down, as one order.
    const buyBack = { ...SHORT_CALL, action: "buy" as const, limitPrice: 3 };
    const sellLower = { ...SHORT_CALL, id: "leg-2", strike: 160, limitPrice: 5.1 };
    const result = await submit(
      { participantId: "ann", draft: reviewed([buyBack, sellLower]), timeInForce: "gtc" },
      "ann",
    );
    expect(result).toMatchObject({ ok: true });
    expect(orders[0]?.body).toMatchObject({
      time_in_force: "gtc",
      limit_price: -2.1,
      legs: [
        { symbol: "NVDA260918C00180000", position_intent: "buy_to_close" },
        { symbol: "NVDA260918C00160000", position_intent: "sell_to_open" },
      ],
    });
  });

  it("relays the broker's own rejection reason and audits nothing", async () => {
    const { submit, audited } = makeService({
      optionsTradingLevel: 3,
      reply: { status: 422, body: { message: "insufficient options buying power" } },
    });
    const result = await submit({ participantId: "ann", draft: reviewed() }, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals[0]).toContain("insufficient options buying power");
    expect(audited).toHaveLength(0);
  });
});
