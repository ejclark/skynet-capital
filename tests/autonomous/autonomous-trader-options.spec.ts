import { AutonomousTrader, type TraderMode } from "../../src/autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { CLIENT_ORDER_ID_PATTERN } from "../../src/domain/option-order.js";
import type {
  MarketContext,
  OptionMarket,
  OptionMarketRequest,
  OrderIntent,
  OrderStatus,
  Portfolio,
} from "../../src/domain/types.js";
import type { RiskConfig } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { optionOpenIntent } from "../../src/playbooks/option-intent.js";
import type { BrokerPort } from "../../src/ports/broker.js";
import type { OptionMarketPort, OptionOrderTracker } from "../../src/ports/option-market.js";
import { aContext, anOptionQuote } from "../support/builders.js";

// The trader's option path (#4645): settle → read only the quotes asked for → decide → guards →
// one attempt per underlying per cooldown (observe AND live) → client order id at submit.
const AS_OF = "2026-10-07T15:00:00Z"; // 11:00 ET, a month before CRWV's print window
const PUT = "CRWV261106P00085000";
const UNQUOTED = "CRWV261106P00080000";
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];
const RISK: RiskConfig = {
  maxPositionPct: 0.03,
  optionsLevel: 1,
  discipline: { calendar: CALENDAR },
  subscriptions: [
    {
      accountId: "wheel-bot",
      playbookId: "CRWV-WHEEL",
      mode: "standard",
      capitalAllocated: 30_000,
      enabled: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ],
};
const context: MarketContext = aContext({ CRWV: { last: 92 } }, AS_OF);

/** Sells one put on each named contract the cycle has a quote for, priced at the quote's mid. */
function wheelPersona(contracts: readonly string[] = [PUT]): Persona {
  return {
    id: "wheel-bot",
    name: "Wheel Bot",
    thesis: "test",
    optionUnderlyings: ["CRWV"],
    optionDemand: () => ({
      chains: [{ underlying: "CRWV", expiration: "2026-11-06", type: "put" }],
      contracts: [],
    }),
    decide: (ctx) =>
      contracts.flatMap((occSymbol) => {
        const quote = ctx.options?.contracts[PUT];
        const intent =
          quote &&
          optionOpenIntent({
            underlying: "CRWV",
            structure: "cash-secured-put",
            legs: [{ occSymbol, side: "sell" }],
            limitPrice: 2.1,
            band: { low: 2, high: 2.2, at: AS_OF },
            reason: "sell a put",
            playbookId: "CRWV-WHEEL",
            playbookMode: "standard",
          });
        return intent ? [intent] : [];
      }),
  };
}

class FakeMarket implements OptionMarketPort {
  readonly requests: OptionMarketRequest[] = [];
  readOptionMarket(request: OptionMarketRequest): Promise<OptionMarket> {
    this.requests.push(request);
    const listed = { CRWV: ["2026-11-06"] };
    request.demand(listed);
    return Promise.resolve({
      listed,
      contracts: { [PUT]: anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }) },
    });
  }
}

function harness(
  opts: {
    mode?: TraderMode;
    status?: OrderStatus;
    persona?: Persona;
    working?: readonly string[];
    market?: OptionMarketPort;
  } = {},
) {
  let clock = 1_000_000;
  const submitted: OrderIntent[] = [];
  const records: DecisionRecord[] = [];
  let settles = 0;
  const broker: BrokerPort = {
    getPortfolio: (): Promise<Portfolio> => Promise.resolve({ cash: 30_000, positions: [] }),
    submit: (intent) => {
      submitted.push(intent);
      return Promise.resolve({ intent, status: opts.status ?? "working", orderId: "o-1" });
    },
  };
  const tracker: OptionOrderTracker = {
    settle: () => {
      settles += 1;
      return Promise.resolve(new Set(opts.working ?? []));
    },
  };
  const market = opts.market ?? new FakeMarket();
  const trader = new AutonomousTrader({
    persona: opts.persona ?? wheelPersona(),
    broker,
    risk: RISK,
    mode: opts.mode ?? "live",
    now: () => clock,
    optionMarket: market,
    optionOrders: tracker,
    onDecision: (r) => records.push(r),
  });
  return {
    trader,
    market,
    submitted,
    records,
    settles: () => settles,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe("AutonomousTrader — option orders", () => {
  it("observe: decides on the quotes it asked for, records `observed`, places nothing, starts the clock", async () => {
    const h = harness({ mode: "observe" });

    await h.trader.evaluate(context);
    expect(h.submitted).toEqual([]);
    expect(h.settles()).toBe(0); // nothing of ours can be working in observe mode
    expect(h.records[0]?.outcomes.map((o) => o.action)).toEqual(["observed"]);
    const [request] = (h.market as FakeMarket).requests;
    expect(request).toMatchObject({ asOf: AS_OF, underlyings: ["CRWV"] });
    expect([...(request?.skip ?? [])]).toEqual([]);

    h.advance(60_000); // inside the 10-minute option cooldown
    await h.trader.evaluate(context);
    expect([...((h.market as FakeMarket).requests[1]?.skip ?? [])]).toEqual(["CRWV"]);
    expect(h.records[1]?.outcomes.map((o) => o.action)).toEqual(["cooldown-skipped"]);

    h.advance(10 * 60_000);
    await h.trader.evaluate(context);
    expect(h.records[2]?.outcomes.map((o) => o.action)).toEqual(["observed"]);
  });

  it("records the context it was handed — option quotes never reach the record", async () => {
    const h = harness({ mode: "observe" });
    await h.trader.evaluate(context);
    expect(h.records[0]?.context).toBe(context);
    expect(h.records[0]?.rawIntents).toHaveLength(1); // ...though the persona did price from them
  });

  it("live: stamps a client order id at submit; a working order is placed, an unfilled one is not", async () => {
    const h = harness();
    await h.trader.evaluate(context);
    const [sent] = h.submitted;
    expect(sent?.clientOrderId).toMatch(/^sk1-wheelbot-CRWV-[0-9a-z]+-0$/);
    expect(sent?.clientOrderId).toMatch(CLIENT_ORDER_ID_PATTERN);
    expect(h.records[0]?.rawIntents[0]?.clientOrderId).toBeUndefined();
    expect(h.records[0]?.outcomes[0]).toMatchObject({
      action: "placed",
      intent: { clientOrderId: sent?.clientOrderId },
      result: { status: "working" },
    });

    const unfilled = harness({ status: "unfilled" });
    await unfilled.trader.evaluate(context);
    expect(unfilled.records[0]?.outcomes[0]?.action).toBe("rejected");
  });

  it("live: settles working orders first — an underlying still working is neither read nor tried", async () => {
    const h = harness({ working: ["CRWV"] });
    await h.trader.evaluate(context);
    expect(h.settles()).toBe(1);
    expect([...((h.market as FakeMarket).requests[0]?.skip ?? [])]).toEqual(["CRWV"]);
    expect(h.submitted).toEqual([]);
    expect(h.records[0]?.outcomes.map((o) => o.action)).toEqual(["cooldown-skipped"]);
  });

  it("a refused attempt starts the clock, but never starves an approved sibling in the same cycle", async () => {
    const h = harness({ mode: "observe", persona: wheelPersona([UNQUOTED, PUT]) });
    await h.trader.evaluate(context);
    expect(h.records[0]?.refusals?.map((r) => r.reason)).toEqual(["no-quote"]);
    expect(h.records[0]?.outcomes.map((o) => o.action)).toEqual(["observed"]);
    h.advance(60_000);
    await h.trader.evaluate(context);
    expect(h.records[1]?.outcomes.map((o) => o.action)).toEqual(["cooldown-skipped"]);
  });

  it("a market read that throws is no quotes — the cycle still decides and records", async () => {
    const failing: OptionMarketPort = { readOptionMarket: () => Promise.reject(new Error("down")) };
    const h = harness({ market: failing });
    await h.trader.evaluate(context);
    expect(h.records).toHaveLength(1);
    expect(h.records[0]?.rawIntents).toEqual([]);
  });

  it("a persona with no option plays never touches the option market", async () => {
    const shares: Persona = {
      id: "shares",
      name: "Shares",
      thesis: "test",
      decide: () => [{ symbol: "CRWV", side: "buy", quantity: 1, type: "market", reason: "r" }],
    };
    const h = harness({ persona: shares });
    await h.trader.evaluate(context);
    expect((h.market as FakeMarket).requests).toEqual([]);
    expect(h.submitted.map((i) => [i.symbol, i.clientOrderId])).toEqual([["CRWV", undefined]]);
  });
});
