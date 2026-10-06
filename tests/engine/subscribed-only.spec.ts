import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import {
  applyGuardsWithVerdicts,
  type GuardRefusalReason,
  type GuardResult,
  type RiskConfig,
} from "../../src/engine/guards.js";
import { opensExposure, subscriptionAllowsOpen } from "../../src/engine/subscribed-only.js";
import {
  aContext,
  anOptionIntent,
  anOptionQuote,
  aPortfolio,
  aPosition,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

/**
 * ONLY A SUBSCRIBED PLAYBOOK OPENS A POSITION (#4642 slice 10, criterion 1), through the one door
 * every intent takes (`applyGuardsWithVerdicts`). Opens with no subscribed playbook are refused
 * `unsubscribed` and recorded; exits always pass — a position is never stranded. Wednesday
 * 2026-10-07, 11:00 ET: past E1, a month before CRWV's print window.
 */
const AS_OF = "2026-10-07T15:00:00Z";
const PUT = "CRWV261106P00085000";
const CALL_100 = "CRWV261106C00100000";
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];
/** Room for 100 assigned shares at $90 and one $85 put's collateral, together. */
const WHEEL_ON = aSubscription("sauron", "CRWV-WHEEL", { capitalAllocated: 30_000 });
const WHEEL_PAUSED = { ...WHEEL_ON, enabled: false };

/** The live bots' guards: options approved, the print calendar, the rule on. */
const live = (subscriptions: readonly PlaybookSubscription[]): RiskConfig => ({
  maxPositionPct: 0.5,
  optionsLevel: 3,
  discipline: { calendar: CALENDAR },
  subscriptions,
  playbookSymbols: new Map([["CRWV-WHEEL", ["CRWV"]]]),
  subscribedOnly: true,
});

const QUOTES: readonly OptionContractQuote[] = [
  anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }),
  anOptionQuote(CALL_100, { bid: 1.6, ask: 1.8, at: AS_OF }),
];
const market: MarketContext = withOptionQuotes(
  aContext({ CRWV: { last: 90 }, AAPL: { last: 100 } }, AS_OF),
  QUOTES,
);

const buy = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  ...over,
});
const sell = (symbol: string, quantity: number, over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol,
  side: "sell",
  quantity,
  type: "market",
  reason: "test",
  ...over,
});
const sellPut = anOptionIntent();
const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: CALL_100, side: "sell", ratio: 1 }],
    limitPrice: 1.7,
  },
});
/** An option close with no playbook on it — what expiry hygiene emits for a contract no playbook
 *  on the bot claims. */
const closeLong = anOptionIntent({
  side: "sell",
  playbookId: undefined,
  playbookMode: undefined,
  option: {
    effect: "close",
    structure: "close",
    legs: [{ occSymbol: CALL_100, side: "sell", ratio: 1 }],
    limitPrice: 1.7,
  },
});

const holds = (...positions: [string, number][]): Portfolio =>
  aPortfolio({
    cash: 50_000,
    positions: positions.map(([symbol, quantity]) => aPosition({ symbol, quantity })),
  });

const run = (
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  config: RiskConfig,
): GuardResult => applyGuardsWithVerdicts(intents, portfolio, market, config);
const reasons = (result: GuardResult): GuardRefusalReason[] => result.refused.map((r) => r.reason);

describe("a bot with no subscriptions opens nothing", () => {
  const none = live([]);

  it("refuses a share buy, a sold put and a covered call as not from a subscribed playbook", () => {
    const book = holds(["CRWV", 100]);
    const result = run([buy(), sellPut, coveredCall], book, none);
    expect(result.approved).toEqual([]);
    expect(reasons(result)).toEqual(["unsubscribed", "unsubscribed", "unsubscribed"]);
  });

  it("refuses a buy that names a playbook the bot is not subscribed to — the id alone grants nothing", () => {
    expect(
      reasons(run([buy({ playbookId: "S1-NVDA", playbookMode: "standard" })], holds(), none)),
    ).toEqual(["unsubscribed"]);
  });
});

// Review of slice 10, finding 12: a sell of shares no longer held (a sell that filled mid-cycle) is
// an exit that found nothing, never an open — it says "nothing held to sell", the same words with
// or without a subscription, and never sends the owner to the Store.
describe("a sell of shares not held", () => {
  it("is refused as nothing held, never as not from a subscribed playbook", () => {
    expect(reasons(run([sell("AAPL", 5)], holds(), live([])))).toEqual(["nothing-held"]);
    const paused = sell("AAPL", 5, { playbookId: "CRWV-WHEEL", playbookMode: "standard" });
    expect(reasons(run([paused], holds(), live([WHEEL_PAUSED])))).toEqual(["nothing-held"]);
  });
});

describe("exits always run, whatever placed the position", () => {
  const none = live([]);

  it("sells shares it holds with no playbook on the order", () => {
    const book = holds(["AAPL", 30]);
    expect(run([sell("AAPL", 30)], book, none).approved).toEqual([sell("AAPL", 30)]);
  });

  it("clamps a sell bigger than the holding to the holding — never refused whole", () => {
    const book = holds(["AAPL", 30]);
    const result = run([sell("AAPL", 45)], book, none);
    expect(result.approved).toEqual([sell("AAPL", 30)]);
    expect(result.refused).toEqual([]);
  });

  it("passes an option close with no playbook on it (expiry hygiene's)", () => {
    const book = holds([CALL_100, 1]);
    expect(run([closeLong], book, none).approved).toMatchObject([{ quantity: 1 }]);
  });

  it("passes an exit-safety sell stamped with a playbook the bot no longer holds", () => {
    const book = holds(["AAPL", 30]);
    const trip = sell("AAPL", 30, {
      playbookId: "S1-NVDA",
      playbookMode: "standard",
      urgent: true,
    });
    expect(run([trip], book, none).approved).toEqual([trip]);
  });
});

describe("who may open", () => {
  it("an enabled subscription opens exactly as the guards sized it before the rule", () => {
    const book = holds(["CRWV", 100]);
    const { subscribedOnly: _, ...ruleOff } = live([WHEEL_ON]);
    for (const intent of [sellPut, coveredCall]) {
      expect(run([intent], book, live([WHEEL_ON]))).toEqual(run([intent], book, ruleOff));
      expect(run([intent], book, live([WHEEL_ON])).approved).toHaveLength(1);
    }
  });

  it("a paused subscription opens only a covered call — the way a paused wheel leaves assigned shares", () => {
    const book = holds(["CRWV", 100]);
    expect(run([coveredCall], book, live([WHEEL_PAUSED])).approved).toHaveLength(1);
    expect(reasons(run([sellPut], book, live([WHEEL_PAUSED])))).toEqual(["unsubscribed"]);
  });

  it("an enabled entry beside a paused one for the same playbook wins", () => {
    expect(subscriptionAllowsOpen(sellPut, [WHEEL_PAUSED, WHEEL_ON])).toBe(true);
  });

  it("with the rule off (evals, the readiness gate, the desk) nothing changes", () => {
    const { subscribedOnly: _, ...ruleOff } = live([]);
    expect(reasons(run([buy()], holds(), ruleOff))).toEqual([]);
  });
});

describe("what counts as an open", () => {
  it("a buy and an option open; never a share sell (held or not) or a close", () => {
    expect(opensExposure(buy())).toBe(true);
    expect(opensExposure(sellPut)).toBe(true);
    expect(opensExposure(sell("MSFT", 1))).toBe(false);
    expect(opensExposure(sell("AAPL", 5))).toBe(false);
    expect(opensExposure(closeLong)).toBe(false);
  });
});

describe("a refused open changes nothing for the rest of the batch", () => {
  // The batch ledger is built without the refused intents, so the others are judged exactly as if
  // they had been handed in alone.
  it("every other intent's verdict is what it is without the refused one", () => {
    const book = holds(["CRWV", 100], ["AAPL", 30]);
    const config = live([WHEEL_ON]);
    const refused = [buy({ symbol: "CRWV", quantity: 400 }), anOptionIntent({ playbookId: "X" })];
    const rest = [coveredCall, sell("AAPL", 30), sellPut];
    const mixed = run([...refused, ...rest], book, config);
    const alone = run(rest, book, config);
    expect(mixed.approved).toEqual(alone.approved);
    expect(mixed.refused).toEqual([
      ...refused.map((intent) => ({ intent, reason: "unsubscribed" })),
      ...alone.refused,
    ]);
  });
});
