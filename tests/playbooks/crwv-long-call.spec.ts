import type { Bot } from "../../src/bots/bot.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { requiredOptionLevel } from "../../src/domain/option-book.js";
import { optionOrderProblems } from "../../src/domain/option-order.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookMode,
  PlaybookSubscription,
  Portfolio,
  Position,
} from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { LONG_CALL_MAX_CONTRACTS } from "../../src/playbooks/long-call.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import { CRWV_LONG_CALL, findPlaybook } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

// CRWV's November print as filed: blackout Nov 9–17 (the session after counts).
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];

// Fri 2026-10-16, 11:00 ET. Apr 16 2027 is 182 days out, the latest listed inside 120–200.
const OCT_16 = "2026-10-16T15:00:00Z";
const LISTED = ["2026-11-20", "2026-12-18", "2027-01-15", "2027-03-19", "2027-04-16", "2027-06-17"];
const APR_16 = "2027-04-16";
const occ = (strike: number, expiration = APR_16) =>
  buildOccSymbol({ underlying: "CRWV", expiration, type: "call", strike });

type Row = readonly [strike: number, delta: number, bid: number, ask: number];
// CRWV at $62, ~90% implied.
const CALLS: readonly Row[] = [
  [50, 0.72, 20.1, 20.7],
  [55, 0.66, 17.6, 18.2],
  [60, 0.6, 15.4, 15.9],
  [70, 0.5, 11.8, 12.3],
  [80, 0.41, 9.0, 9.4],
];
const chain = (asOf: string, rows: readonly Row[] = CALLS, expiration = APR_16) =>
  rows.map(([strike, delta, bid, ask]) =>
    anOptionQuote(occ(strike, expiration), { bid, ask, delta, openInterest: 500, at: asOf }),
  );

function market(
  asOf = OCT_16,
  quotes: readonly OptionContractQuote[] = chain(asOf),
  spot = 62,
): MarketContext {
  return withOptionQuotes(aContext({ CRWV: { last: spot } }, asOf), quotes, { CRWV: LISTED });
}

const book = (...positions: Position[]): Portfolio => aPortfolio({ cash: 100_000, positions });
const held = (
  strike: number,
  quantity: number,
  avgPrice: number,
  expiration = APR_16,
): Position => ({
  symbol: occ(strike, expiration),
  quantity,
  avgPrice,
});
const decide = (
  context: MarketContext,
  portfolio: Portfolio = book(),
  mode: PlaybookMode = "standard",
): readonly OrderIntent[] => CRWV_LONG_CALL.decide?.(context, portfolio, CALENDAR, mode) ?? [];

describe("CRWV-LONG-CALL — registered as a conviction pair", () => {
  it("resolves by id in the pair table and the registry, as a ◆ conviction with a check date", () => {
    const pair = findPair("CRWV-LONG-CALL");
    expect(pair?.strategy).toBe("long-call");
    expect(pair?.evidence.status).toBe("conviction");
    expect(pair?.evidence.checkOn).toBe("2027-01-29");
    expect(findPlaybook("CRWV-LONG-CALL")).toBe(CRWV_LONG_CALL);
    expect(CRWV_LONG_CALL.options).toEqual({
      underlyings: ["CRWV"],
      holdsShortToExpiry: [],
      requiredLevel: 2,
    });
  });
});

describe("CRWV-LONG-CALL — buying", () => {
  it("buys one call on the latest expiry 120–200 days out, nearest the mode's delta", () => {
    const [intent, ...rest] = decide(market());
    expect(rest).toEqual([]);
    expect(intent?.option).toMatchObject({
      effect: "open",
      structure: "long-call",
      legs: [{ occSymbol: occ(60), side: "buy" }],
    });
    expect(intent?.side).toBe("buy");
    expect(intent?.quantity).toBe(1);
    expect(intent?.reason).toMatch(/held through earnings/);
    expect(optionOrderProblems(intent as OrderIntent)).toEqual([]);
  });

  it("aims deeper in the money when conservative and further out when aggressive", () => {
    const leg = (mode: PlaybookMode) =>
      decide(market(), book(), mode)[0]?.option?.legs[0]?.occSymbol;
    expect(leg("conservative")).toBe(occ(50));
    expect(leg("aggressive")).toBe(occ(70));
  });

  it("asks for the chain on that expiry, plus the quotes of what it holds", () => {
    const demand = (portfolio: Portfolio) =>
      CRWV_LONG_CALL.optionDemand?.(OCT_16, portfolio, { CRWV: LISTED }, CALENDAR, "standard");
    expect(demand(book())).toEqual({
      chains: [{ underlying: "CRWV", expiration: APR_16, type: "call" }],
      contracts: [],
    });
    expect(demand(book(held(60, 2, 15.5)))).toEqual({
      chains: [{ underlying: "CRWV", expiration: APR_16, type: "call" }],
      contracts: [occ(60)],
    });
  });

  it("adds one more on the expiry it holds while the price is near what it paid", () => {
    expect(decide(market(), book(held(60, 2, 15.5)))).toHaveLength(1);
  });

  it("never chases: no add once the ask is more than 10% over the held cost", () => {
    expect(decide(market(), book(held(60, 2, 13)))).toEqual([]);
  });

  it("stops adding at the mode's cap", () => {
    const cap = LONG_CALL_MAX_CONTRACTS.standard;
    expect(decide(market(), book(held(60, cap, 15.5)))).toEqual([]);
  });

  it("leaves a book it did not build alone: a sold contract or a put on CRWV", () => {
    const put = buildOccSymbol({
      underlying: "CRWV",
      expiration: "2026-11-06",
      type: "put",
      strike: 55,
    });
    expect(decide(market(), book({ symbol: put, quantity: -1, avgPrice: 1.7 }))).toEqual([]);
  });

  it("buys nothing with no expiry listed in the window", () => {
    const short = withOptionQuotes(aContext({ CRWV: { last: 62 } }, OCT_16), chain(OCT_16), {
      CRWV: ["2026-11-20", "2026-12-18"],
    });
    expect(decide(short)).toEqual([]);
  });
});

describe("CRWV-LONG-CALL — selling", () => {
  it("sells everything once the bid is double the cost", () => {
    const [close] = decide(market(), book(held(60, 3, 7.5)));
    expect(close?.option).toMatchObject({
      effect: "close",
      legs: [{ occSymbol: occ(60), side: "sell" }],
    });
    expect(close?.quantity).toBe(3);
    expect(close?.reason).toMatch(/double/);
  });

  it("sells everything with 45 days left, whatever the price", () => {
    // 2027-03-02 is 45 days before Apr 16.
    const late = "2027-03-02T15:00:00Z";
    const [close] = decide(market(late, chain(late)), book(held(60, 2, 15.5)));
    expect(close?.option?.effect).toBe("close");
    expect(close?.reason).toMatch(/45 days/);
  });

  it("holds while neither exit has come, and a held call is never closed just for spanning a print", () => {
    const intents = decide(market(), book(held(60, 2, 15.5)));
    expect(intents.every((i) => i.option?.effect === "open")).toBe(true);
  });
});

describe("a long call through the real guards", () => {
  const quiet: Persona = { id: "sauron", name: "Sauron", thesis: "test", decide: () => [] };
  const bot: Bot = { persona: quiet, credentials: { apiKey: "k", apiSecret: "s" } };
  const sub = (capitalAllocated: number): PlaybookSubscription => ({
    accountId: "sauron",
    playbookId: "CRWV-LONG-CALL",
    mode: "standard",
    capitalAllocated,
    enabled: true,
    conviction: { reason: "CRWV recovers over 3 to 6 months", checkOn: "2027-01-29" },
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
  });
  const trade = (level: number, capital = 20_000, asOf = OCT_16) => {
    const risk = {
      ...DEFAULT_RISK_CONFIG,
      discipline: { calendar: CALENDAR },
      optionsLevel: level,
    };
    const trading = tradingRoster(resolveBotRoster(bot, [], [sub(capital)]), risk);
    const context = market(asOf, chain(asOf));
    const raw = trading.persona.decide(context, book());
    return { raw, ...applyGuardsWithVerdicts(raw, book(), context, trading.risk) };
  };

  it("needs options level 2", () => {
    const [intent] = trade(2).raw;
    expect(intent?.option && requiredOptionLevel(intent.option)).toBe(2);
  });

  it("approves a call whose expiry spans CRWV's November print", () => {
    const result = trade(2);
    expect(result.approved).toEqual([
      expect.objectContaining({ playbookId: "CRWV-LONG-CALL", quantity: 1 }),
    ]);
  });

  it("refuses it on an account approved only for level 1", () => {
    expect(trade(1).approved).toEqual([]);
  });

  it("refuses it when one contract costs more than the budget", () => {
    expect(trade(2, 1_000).approved).toEqual([]);
  });

  it("opens nothing inside the print's blackout", () => {
    expect(trade(2, 20_000, "2026-11-10T15:00:00Z").approved).toEqual([]);
  });
});
