import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import { AutonomousTrader, type TraderMode } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { MarketContext, OrderIntent, OrderResult, Portfolio } from "../../src/domain/types.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { Persona } from "../../src/personas/persona.js";
import type { BrokerPort, OpenShareOrder } from "../../src/ports/broker.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * #4678: a share order still open at the broker — a market order queued for the open — outlives the
 * trader's 5-minute cooldown. The trader reads the broker's open share orders once a live cycle, so
 * a buy never stacks on an open buy of the same symbol, and a sell is sized against what the open
 * sells leave.
 */

const RISK = { maxPositionPct: 0.5 };
const COOLDOWN_MS = 60_000;

const shares = (side: "buy" | "sell", symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side,
  quantity,
  type: "market",
  reason: "test",
});

/** A persona that asks for the same orders every cycle. */
function wants(...intents: OrderIntent[]): Persona {
  return { id: "wants", name: "Wants", thesis: "test", decide: () => intents };
}

/** A persona that buys only while it holds none of the symbol, and sells all of it once it does. */
function roundTrip(symbol: string, quantity: number): Persona {
  return {
    id: "round-trip",
    name: "Round trip",
    thesis: "test",
    decide: (_context, portfolio) => {
      const held = portfolio.positions.find((p) => p.symbol === symbol)?.quantity ?? 0;
      return [held > 0 ? shares("sell", symbol, held) : shares("buy", symbol, quantity)];
    },
  };
}

const marketOf = (...symbols: string[]): MarketContext =>
  aContext(Object.fromEntries(symbols.map((s) => [s, { last: 100, momentum: 0.05 }])));

/**
 * An Alpaca paper account where every share order sits at "accepted" — what a market order placed
 * after the close looks like until the next open — and shows in the open-order list until `fill`.
 */
class QueuingAlpaca implements AlpacaTradingTransport {
  readonly placed: string[] = [];
  readonly open: { id: string; symbol: string; qty: string; side: string }[] = [];
  private readonly held: Map<string, number>;
  /** Set to fill the queue at the next open-order list read — after that cycle's positions read,
   *  the way fills land at the opening auction while a cycle is mid-flight. */
  fillAtNextOrderList = false;

  constructor(held: Record<string, number> = {}) {
    this.held = new Map(Object.entries(held));
  }

  /** The open: every queued order fills and leaves the open-order list. */
  fill(): void {
    for (const order of this.open.splice(0)) {
      const sign = order.side === "buy" ? 1 : -1;
      this.held.set(order.symbol, (this.held.get(order.symbol) ?? 0) + sign * Number(order.qty));
    }
  }

  get(path: string): Promise<JsonResponse> {
    if (path === "/v2/account") {
      return ok({ id: "a1", cash: "1000000", portfolio_value: "1000000", status: "ACTIVE" });
    }
    if (path === "/v2/positions") {
      return ok(
        [...this.held]
          .filter(([, qty]) => qty !== 0)
          .map(([symbol, qty]) => ({
            symbol,
            qty: String(qty),
            avg_entry_price: "100",
          })),
      );
    }
    if (path.startsWith("/v2/orders?")) {
      if (this.fillAtNextOrderList) {
        this.fillAtNextOrderList = false;
        this.fill();
      }
      return ok(this.open.map((o) => ({ ...o, status: "accepted", filled_qty: "0" })));
    }
    const id = path.replace("/v2/orders/", "");
    return ok({ id, status: "accepted", filled_qty: "0", filled_avg_price: null });
  }

  post(path: string, body: unknown): Promise<JsonResponse> {
    if (path !== "/v2/orders") return Promise.resolve({ status: 404, body: null });
    const { symbol, side, qty } = body as { symbol: string; side: string; qty: number };
    const id = `o${this.placed.length + 1}`;
    this.placed.push(`${side} ${qty} ${symbol}`);
    this.open.push({ id, symbol, qty: String(qty), side });
    return ok({ id, symbol, qty: String(qty), side, status: "accepted" });
  }

  delete(): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

const ok = (body: unknown): Promise<JsonResponse> => Promise.resolve({ status: 200, body });

/** A broker whose open orders a spec sets directly; counts every read and every submit. */
class ScriptedBroker implements BrokerPort {
  reads = 0;
  readonly submitted: string[] = [];
  constructor(
    private readonly portfolio: Portfolio,
    private readonly openOrders: readonly OpenShareOrder[] | Error = [],
  ) {}
  getPortfolio(): Promise<Portfolio> {
    return Promise.resolve(this.portfolio);
  }
  submit(order: OrderIntent): Promise<OrderResult> {
    this.submitted.push(`${order.side} ${order.quantity} ${order.symbol}`);
    return Promise.resolve({ intent: order, status: "working", reason: "order accepted" });
  }
  openShareOrders(): Promise<readonly OpenShareOrder[]> {
    this.reads += 1;
    const open = this.openOrders;
    return open instanceof Error ? Promise.reject(open) : Promise.resolve(open);
  }
}

function traderOn(
  broker: BrokerPort,
  persona: Persona,
  opts: { mode?: TraderMode; clock?: () => number } = {},
) {
  const decisions: DecisionRecord[] = [];
  const trader = new AutonomousTrader({
    persona,
    broker,
    risk: RISK,
    cooldownMs: COOLDOWN_MS,
    now: opts.clock ?? (() => 1_000),
    ...(opts.mode ? { mode: opts.mode } : {}),
    onDecision: (r) => decisions.push(r),
  });
  return { trader, decisions };
}

describe("a buy still queued at the broker (#4678)", () => {
  it("is not bought again once the cooldown has passed — the second buy waits", async () => {
    const alpaca = new QueuingAlpaca();
    const broker = new AlpacaBrokerAdapter(new AlpacaTradingClient(alpaca), {
      sleep: () => Promise.resolve(),
    });
    let clock = 1_000;
    const { trader, decisions } = traderOn(broker, wants(shares("buy", "NVDA", 10)), {
      clock: () => clock,
    });

    await trader.evaluate(marketOf("NVDA"));
    clock += 2 * COOLDOWN_MS; // the cooldown is long over; the order is still queued
    await trader.evaluate(marketOf("NVDA"));

    expect(alpaca.placed).toEqual(["buy 10 NVDA"]);
    expect(decisions[1]?.outcomes).toEqual([
      { intent: shares("buy", "NVDA", 10), action: "cooldown-skipped" },
    ]);
  });

  it("buys as before once the broker no longer holds the earlier order", async () => {
    const alpaca = new QueuingAlpaca();
    const broker = new AlpacaBrokerAdapter(new AlpacaTradingClient(alpaca), {
      sleep: () => Promise.resolve(),
    });
    let clock = 1_000;
    const { trader } = traderOn(broker, wants(shares("buy", "NVDA", 10)), { clock: () => clock });

    await trader.evaluate(marketOf("NVDA"));
    alpaca.fill();
    clock += 2 * COOLDOWN_MS;
    await trader.evaluate(marketOf("NVDA"));

    expect(alpaca.placed).toEqual(["buy 10 NVDA", "buy 10 NVDA"]);
  });

  it("holds back only a buy of the same symbol", async () => {
    const broker = new ScriptedBroker(aPortfolio({ positions: [aPosition({ symbol: "AMD" })] }), [
      { symbol: "NVDA", side: "buy", quantity: 10 },
    ]);
    const { trader, decisions } = traderOn(
      broker,
      wants(shares("buy", "NVDA", 10), shares("buy", "AMD", 5)),
    );

    await trader.evaluate(marketOf("NVDA", "AMD"));

    expect(broker.submitted).toEqual(["buy 5 AMD"]);
    expect(decisions[0]?.outcomes.map((o) => `${o.intent.symbol} ${o.action}`)).toEqual([
      "NVDA cooldown-skipped",
      "AMD placed",
    ]);
  });

  it("a buy over an open SELL of the symbol is not stacking, so it is sent", async () => {
    const broker = new ScriptedBroker(
      aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 10 })] }),
      [{ symbol: "NVDA", side: "sell", quantity: 10 }],
    );
    const { trader } = traderOn(broker, wants(shares("buy", "NVDA", 5)));

    await trader.evaluate(marketOf("NVDA"));

    expect(broker.submitted).toEqual(["buy 5 NVDA"]);
  });
});

describe("an order that fills while a cycle is deciding (#4678)", () => {
  it("a buy that fills between the positions read and the open-order read is not bought again", async () => {
    const alpaca = new QueuingAlpaca();
    const broker = new AlpacaBrokerAdapter(new AlpacaTradingClient(alpaca), {
      sleep: () => Promise.resolve(),
    });
    let clock = 1_000;
    const { trader, decisions } = traderOn(broker, roundTrip("NVDA", 10), { clock: () => clock });

    await trader.evaluate(marketOf("NVDA")); // queued after the close
    clock += 2 * COOLDOWN_MS;
    await trader.evaluate(marketOf("NVDA")); // still queued: the open buy holds it
    clock += 2 * COOLDOWN_MS;
    alpaca.fillAtNextOrderList = true; // the open: it fills mid-cycle
    await trader.evaluate(marketOf("NVDA"));

    expect(alpaca.placed).toEqual(["buy 10 NVDA"]);
    expect(decisions[2]?.outcomes.map((o) => `${o.intent.side} ${o.action}`)).toEqual([
      "buy cooldown-skipped",
    ]);
  });

  it("a sell that fills mid-cycle is not sold again on shares already gone", async () => {
    const alpaca = new QueuingAlpaca({ NVDA: 10 });
    const broker = new AlpacaBrokerAdapter(new AlpacaTradingClient(alpaca), {
      sleep: () => Promise.resolve(),
    });
    let clock = 1_000;
    const { trader } = traderOn(broker, roundTrip("NVDA", 10), { clock: () => clock });

    await trader.evaluate(marketOf("NVDA")); // the sell queues
    clock += 2 * COOLDOWN_MS;
    alpaca.fillAtNextOrderList = true;
    await trader.evaluate(marketOf("NVDA"));

    expect(alpaca.placed).toEqual(["sell 10 NVDA"]);
  });

  it("the next cycle decides on the filled position, as before", async () => {
    const alpaca = new QueuingAlpaca();
    const broker = new AlpacaBrokerAdapter(new AlpacaTradingClient(alpaca), {
      sleep: () => Promise.resolve(),
    });
    let clock = 1_000;
    const { trader } = traderOn(broker, roundTrip("NVDA", 10), { clock: () => clock });

    await trader.evaluate(marketOf("NVDA"));
    clock += 2 * COOLDOWN_MS;
    alpaca.fillAtNextOrderList = true;
    await trader.evaluate(marketOf("NVDA"));
    clock += 2 * COOLDOWN_MS;
    await trader.evaluate(marketOf("NVDA"));

    expect(alpaca.placed).toEqual(["buy 10 NVDA", "sell 10 NVDA"]);
  });
});

describe("a sell while a sell is still open (#4678)", () => {
  it("is sized against the shares the open sell leaves", async () => {
    const broker = new ScriptedBroker(
      aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 50 })] }),
      [{ symbol: "NVDA", side: "sell", quantity: 30 }],
    );
    const { trader, decisions } = traderOn(broker, wants(shares("sell", "NVDA", 50)));

    await trader.evaluate(marketOf("NVDA"));

    expect(broker.submitted).toEqual(["sell 20 NVDA"]);
    expect(decisions[0]?.guardedIntents).toMatchObject([{ symbol: "NVDA", quantity: 20 }]);
  });

  it("is refused nothing-held when the open sells already take every share", async () => {
    const broker = new ScriptedBroker(
      aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 50 })] }),
      [
        { symbol: "NVDA", side: "sell", quantity: 30 },
        { symbol: "NVDA", side: "sell", quantity: 20 },
      ],
    );
    const { trader, decisions } = traderOn(broker, wants(shares("sell", "NVDA", 50)));

    await trader.evaluate(marketOf("NVDA"));

    expect(broker.submitted).toEqual([]);
    expect(decisions[0]?.refusals).toEqual([
      { intent: shares("sell", "NVDA", 50), reason: "nothing-held" },
    ]);
  });
});

describe("reading the broker's open orders (#4678)", () => {
  it("a failed read holds every buy and no sell", async () => {
    const broker = new ScriptedBroker(
      aPortfolio({ positions: [aPosition({ symbol: "AMD", quantity: 40 })] }),
      new Error("503 service unavailable"),
    );
    const { trader, decisions } = traderOn(
      broker,
      wants(shares("buy", "NVDA", 10), shares("sell", "AMD", 40)),
    );

    await trader.evaluate(marketOf("NVDA", "AMD"));

    expect(broker.submitted).toEqual(["sell 40 AMD"]);
    expect(decisions[0]?.outcomes.map((o) => `${o.intent.symbol} ${o.action}`)).toEqual([
      "NVDA cooldown-skipped",
      "AMD placed",
    ]);
  });

  it("reads once a cycle however many share orders it decides, and not at all for none", async () => {
    const busy = new ScriptedBroker(
      aPortfolio({ positions: [aPosition({ symbol: "AMD", quantity: 40 })] }),
    );
    await traderOn(
      busy,
      wants(shares("buy", "NVDA", 10), shares("buy", "MSFT", 1), shares("sell", "AMD", 40)),
    ).trader.evaluate(marketOf("NVDA", "MSFT", "AMD"));
    const quiet = new ScriptedBroker(aPortfolio());
    await traderOn(quiet, wants()).trader.evaluate(marketOf("NVDA"));

    expect(busy.reads).toBe(1);
    expect(busy.submitted).toHaveLength(3);
    expect(quiet.reads).toBe(0);
  });

  it("observe mode reads nothing and records what it would place, as before", async () => {
    const broker = new ScriptedBroker(aPortfolio(), [
      { symbol: "NVDA", side: "buy", quantity: 10 },
    ]);
    const { trader, decisions } = traderOn(broker, wants(shares("buy", "NVDA", 10)), {
      mode: "observe",
    });

    await trader.evaluate(marketOf("NVDA"));

    expect(broker.reads).toBe(0);
    expect(decisions[0]?.outcomes.map((o) => o.action)).toEqual(["observed"]);
  });

  it("a broker with no open-order read (the in-memory one) trades as before", async () => {
    const broker: BrokerPort = {
      getPortfolio: () => Promise.resolve(aPortfolio()),
      submit: (intent) => Promise.resolve({ intent, status: "filled", filledQuantity: 10 }),
    };
    const { trader, decisions } = traderOn(broker, wants(shares("buy", "NVDA", 10)));

    await trader.evaluate(marketOf("NVDA"));

    expect(decisions[0]?.outcomes.map((o) => o.action)).toEqual(["placed"]);
  });
});
