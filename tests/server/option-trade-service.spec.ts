import { FixtureTradingTransport } from "../../src/adapters/fixture-trading-transport.js";
import { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Participant } from "../../src/participants/participant.js";
import { openDesk } from "../../src/server/desk-gate.js";
import {
  createOptionTradeService,
  type DeskOptionRequest,
} from "../../src/server/option-trade-service.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

/** Trading transport: account/positions/clock from a fixture, orders + contracts routed here. */
function transport(
  fixture: { cash: string; positions?: unknown; optionsTradingLevel?: number },
  contracts: unknown[],
  orders: Array<{ path: string; body: unknown }>,
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
    get: (path): Promise<JsonResponse> => {
      if (path.startsWith("/v2/options/contracts")) {
        return Promise.resolve({ status: 200, body: { option_contracts: contracts } });
      }
      return inner.get(path);
    },
    post: (path, body): Promise<JsonResponse> => {
      orders.push({ path, body });
      return Promise.resolve({
        status: 200,
        body: { id: "order-1", symbol: "MSFT260918P00420000", status: "accepted" },
      });
    },
    delete: (path): Promise<JsonResponse> => inner.delete(path),
  };
}

const putContract = {
  symbol: "MSFT260918P00420000",
  expiration_date: "2026-09-18",
  strike_price: "420",
  type: "put",
  close_price: "10.70",
};

const openRequest: DeskOptionRequest = {
  kind: "open",
  participantId: "ann",
  code: "201",
  underlying: "MSFT",
  contracts: 2,
  strike: 420,
  expiration: "2026-09-18",
  orderType: "limit",
  limitPrice: 10.7,
};

function makeService(options: {
  cash?: string;
  positions?: unknown;
  contracts?: unknown[];
  enabled?: boolean;
  optionsTradingLevel?: number;
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
    options.contracts ?? [putContract],
    orders,
  );
  const submit = createOptionTradeService({
    findParticipant: (id) => (id === "ann" ? ann : undefined),
    clientFactory: () => new AlpacaTradingClient(t),
    optionsClientFactory: () => new AlpacaOptionsClient(t),
    tradingEnabled: options.enabled ?? true,
    recordAudit: (entry) => Promise.resolve(void audited.push(entry)),
  });
  return { submit, orders, audited };
}

describe("openDesk — the structural gate both desks share", () => {
  const deps = {
    tradingEnabled: true,
    findParticipant: (id: string) => (id === "ann" ? ann : undefined),
    clientFactory: () => ({}) as never,
  };

  it("refuses, in order: switched off · wrong identity · unknown account", () => {
    expect(openDesk({ ...deps, tradingEnabled: false }, "ann", "ann")).toMatchObject({
      refusals: [expect.stringContaining("switched off")],
    });
    expect(openDesk(deps, "ann", "joe")).toMatchObject({
      refusals: ["You can only trade your own account."],
    });
    expect(openDesk(deps, "ghost", "ghost")).toMatchObject({
      refusals: ["That account isn't on the board."],
    });
  });

  it("answers the participant with a live client when the gate passes", () => {
    const desk = openDesk(deps, "ann", "ann");
    expect("participant" in desk && desk.participant.id).toBe("ann");
  });
});

describe("option trade service — the gate", () => {
  it("refuses when trading is switched off, before touching anything", async () => {
    const { submit, orders } = makeService({ enabled: false });
    const result = await submit(openRequest, "ann");
    expect(result).toMatchObject({ ok: false });
    expect(orders).toHaveLength(0);
  });

  it("refuses anyone but the account's own resolved identity", async () => {
    const { submit, orders } = makeService({});
    expect((await submit(openRequest, "joe")).ok).toBe(false);
    expect((await submit(openRequest, undefined)).ok).toBe(false);
    expect(orders).toHaveLength(0);
  });

  it("refuses a strike that isn't actually listed — a hand-edited form dies here", async () => {
    const { submit, orders } = makeService({});
    const result = await submit({ ...openRequest, strike: 419 }, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals.join(" ")).toContain("pick a strike from the chain");
    expect(orders).toHaveLength(0);
  });

  it("re-checks the discipline rules on FRESH numbers — a drained account is caught", async () => {
    const { submit, orders } = makeService({ cash: "50000" }); // collateral needs $84,000
    const result = await submit(openRequest, "ann");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals.join(" ")).toContain("Cash-secured");
    expect(orders).toHaveLength(0);
  });

  it("refuses on a live re-check when the account's options level doesn't cover the play (#468 criterion 7)", async () => {
    const { submit, orders } = makeService({ optionsTradingLevel: 0 });
    const result = await submit(openRequest, "ann"); // code 201 needs level 1
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusals.join(" ")).toContain("needs level 1");
    expect(orders).toHaveLength(0);
  });

  it("submits when the live account's level covers the play", async () => {
    const { submit, orders } = makeService({ optionsTradingLevel: 1 });
    const result = await submit(openRequest, "ann");
    expect(result.ok).toBe(true);
    expect(orders).toHaveLength(1);
  });

  it("submits a verified cash-secured put with the exchange's own symbol, day-only", async () => {
    const { submit, orders } = makeService({});
    const result = await submit(openRequest, "ann");
    expect(result).toMatchObject({ ok: true, orderId: "order-1" });
    expect(orders[0]?.body).toEqual({
      symbol: "MSFT260918P00420000",
      qty: 2,
      side: "sell",
      type: "limit",
      limit_price: 10.7,
      time_in_force: "day",
      position_intent: "sell_to_open",
    });
  });

  it("closes a short position with a buy_to_close, sized off the live holding", async () => {
    const { submit, orders } = makeService({
      positions: [
        {
          symbol: "MSFT260918P00420000",
          qty: "-2",
          avg_entry_price: "10.70",
          market_value: "-2140",
        },
      ],
    });
    const result = await submit(
      { kind: "close", participantId: "ann", occSymbol: "MSFT260918P00420000" },
      "ann",
    );
    expect(result.ok).toBe(true);
    expect(orders[0]?.body).toMatchObject({
      symbol: "MSFT260918P00420000",
      qty: 2,
      side: "buy",
      type: "market",
      position_intent: "buy_to_close",
    });
  });

  it("tags an OPEN's audit line with its play code (tag-at-entry)", async () => {
    const { submit, audited } = makeService({});
    await submit(openRequest, "ann");
    expect(audited[0]).toMatchObject({
      code: "201",
      intent: "open",
      side: "sell",
      symbol: "MSFT260918P00420000",
    });
  });

  it("tags a CLOSE's audit line with intent close and NO play code — an exit is not a play", async () => {
    const { submit, audited } = makeService({
      positions: [
        {
          symbol: "MSFT260918P00420000",
          qty: "-2",
          avg_entry_price: "10.70",
          market_value: "-2140",
        },
      ],
    });
    await submit({ kind: "close", participantId: "ann", occSymbol: "MSFT260918P00420000" }, "ann");
    expect(audited[0]).toMatchObject({ intent: "close", side: "buy" });
    expect(audited[0]?.code).toBeUndefined();
  });

  it("refuses closing a contract the account doesn't hold", async () => {
    const { submit, orders } = makeService({});
    const result = await submit(
      { kind: "close", participantId: "ann", occSymbol: "MSFT260918P00420000" },
      "ann",
    );
    expect(result.ok).toBe(false);
    expect(orders).toHaveLength(0);
  });
});
