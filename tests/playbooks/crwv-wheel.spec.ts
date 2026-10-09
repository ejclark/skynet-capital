import type { Bot } from "../../src/bots/bot.js";
import { type EarningsPrint, UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import { optionBook } from "../../src/domain/option-book.js";
import {
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionContractQuote,
  type OrderIntent,
  type PlaybookMode,
  type PlaybookSubscription,
  type Portfolio,
  type Position,
} from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { type EnabledPlaybook, playbookIntents } from "../../src/playbooks/playbook.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { WHEEL_DELTAS, wheelPhase } from "../../src/playbooks/wheel.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

// The CRWV wheel on the real 2026 exchange calendar. Print rows pinned as filed on 2026-10-05:
// CRWV's November estimate (window Nov 9–16, so the blackout runs Nov 9–17 — the session after
// counts) and the February 2027 estimate that lets the wheel see past November at all.
const NOV_PRINT: EarningsPrint = {
  symbol: "CRWV",
  date: "2026-11-10",
  status: "estimate",
  source: "test: as filed 2026-10-05",
  window: { start: "2026-11-09", end: "2026-11-16" },
};
const FEB_PRINT: EarningsPrint = {
  symbol: "CRWV",
  date: "2027-02-25",
  status: "estimate",
  source: "test: as filed 2026-10-05",
  window: { start: "2027-02-18", end: "2027-03-05" },
};
const CALENDAR: readonly EarningsPrint[] = [NOV_PRINT, FEB_PRINT];

// Wed 2026-11-18, 11:00 ET (EST): the first session after the blackout. Dec 31 is the latest
// listed expiry 30–45 days out (43) before Feb 18; Jan 15 is 58 days out.
const NOV_18 = "2026-11-18T16:00:00Z";
const LISTED = [
  "2026-11-20",
  "2026-11-27",
  "2026-12-04",
  "2026-12-11",
  "2026-12-18",
  "2026-12-24",
  "2026-12-31",
  "2027-01-15",
  "2027-02-19",
];
const DEC_31 = "2026-12-31";
const occ = (type: "call" | "put", strike: number, expiration = DEC_31) =>
  buildOccSymbol({ underlying: "CRWV", expiration, type, strike });

type Row = readonly [strike: number, delta: number | undefined, bid: number, ask: number];
// CRWV at $92, ~70% implied: the deltas are the house model's own reading of these prices.
const PUTS: readonly Row[] = [
  [70, -0.1, 1.1, 1.25],
  [75, -0.15, 1.65, 1.85],
  [80, -0.21, 2.2, 2.4],
  [85, -0.28, 3.3, 3.5],
  [90, -0.41, 4.8, 5.1],
];
const CALLS: readonly Row[] = [
  [95, 0.47, 5.6, 5.9],
  [100, 0.37, 3.9, 4.15],
  [105, 0.28, 2.7, 2.9],
  [110, 0.21, 1.85, 2],
  [115, 0.15, 1.25, 1.4],
];
const chain = (
  type: "call" | "put",
  rows: readonly Row[],
  asOf: string,
  expiration = DEC_31,
): OptionContractQuote[] =>
  rows.map(([strike, delta, bid, ask]) =>
    anOptionQuote(occ(type, strike, expiration), {
      bid,
      ask,
      openInterest: 500,
      at: asOf,
      ...(delta === undefined ? {} : { delta }),
    }),
  );

function market(
  asOf = NOV_18,
  quotes: readonly OptionContractQuote[] = [
    ...chain("put", PUTS, asOf),
    ...chain("call", CALLS, asOf),
  ],
  listed: readonly string[] = LISTED,
  spot = 92,
): MarketContext {
  return withOptionQuotes(aContext({ CRWV: { last: spot } }, asOf), quotes, { CRWV: listed });
}

const book = (...positions: Position[]): Portfolio => aPortfolio({ cash: 100_000, positions });
const shares = (quantity: number, avgPrice = 80): Position => ({
  symbol: "CRWV",
  quantity,
  avgPrice,
});
const contract = (symbol: string, quantity: number): Position => ({
  symbol,
  quantity,
  avgPrice: 2.3,
});

const decide = (
  context: MarketContext,
  portfolio: Portfolio = book(),
  mode: PlaybookMode = "standard",
  calendar: readonly EarningsPrint[] = CALENDAR,
): readonly OrderIntent[] => CRWV_WHEEL.decide?.(context, portfolio, calendar, mode) ?? [];
const soldLeg = (intents: readonly OrderIntent[]) => intents[0]?.option?.legs[0]?.occSymbol;

describe("CRWV-WHEEL — where the wheel is, from positions alone", () => {
  const phase = (...positions: Position[]) => wheelPhase(optionBook(book(...positions), "CRWV"));

  it("is flat with nothing held, and with a partial lot too small to write a call on", () => {
    expect(phase()).toBe("flat");
    expect(phase(shares(50))).toBe("flat");
  });

  it("holds a sold put, even beside shares an early assignment already delivered", () => {
    expect(phase(contract(occ("put", 80), -1))).toBe("put-open");
    expect(phase(shares(100), contract(occ("put", 75), -1))).toBe("put-open");
  });

  it("reads an assignment — early or at expiry — as 100 shares not yet written on", () => {
    expect(phase(shares(100))).toBe("assigned");
    expect(phase(shares(150))).toBe("assigned");
    expect(phase(shares(250), contract(occ("call", 105), -1))).toBe("assigned");
  });

  it("holds a covered call that has every whole lot written on", () => {
    expect(phase(shares(100), contract(occ("call", 105), -1))).toBe("call-open");
    expect(phase(shares(150), contract(occ("call", 105), -1))).toBe("call-open");
  });

  it("leaves a book it did not build alone: any long contract, or short shares", () => {
    expect(phase(contract(occ("call", 105), 1))).toBe("foreign");
    expect(phase(contract(occ("put", 80), -1), contract(occ("put", 70), 1))).toBe("foreign");
    expect(phase(shares(-100))).toBe("foreign");
  });
});

describe("CRWV-WHEEL — the sale window around CRWV's print", () => {
  const state = (asOf: string, calendar = CALENDAR) => CRWV_WHEEL.desiredState(asOf, calendar);
  const at = (day: string) => `${day}T15:00:00Z`;

  it("sells through 2026-10-07, the last day a 30-day expiry (Nov 6) clears the Nov 9 blackout", () => {
    expect(state(at("2026-10-07"))).toBe("long");
  });

  it("is dark every day from 2026-10-08 to 2026-11-17, and opens again on 2026-11-18", () => {
    const open: string[] = [];
    for (let d = Date.parse("2026-10-08"); d <= Date.parse("2026-11-17"); d += 86_400_000) {
      const day = new Date(d).toISOString().slice(0, 10);
      if (state(at(day)) !== "no-window") open.push(day);
    }
    expect(open).toEqual([]);
    expect(state(NOV_18)).toBe("long");
  });

  it("stays dark after the November print when no later CRWV print is on file", () => {
    expect(state(NOV_18, [NOV_PRINT])).toBe("no-window");
    expect(state(NOV_18, [])).toBe("no-window");
  });

  it("goes dark again once no 30-day expiry can end before the February blackout", () => {
    // The last session before Feb 18 is Feb 17: 33 days from Jan 15, 29 from Jan 19 (Jan 18 is MLK).
    expect(state(at("2027-01-15"))).toBe("long");
    expect(state(at("2027-01-19"))).toBe("no-window");
  });
});

describe("CRWV-WHEEL — what it asks the market for", () => {
  const demand = (portfolio: Portfolio, asOf = NOV_18, listed: readonly string[] = LISTED) =>
    CRWV_WHEEL.optionDemand?.(asOf, portfolio, { CRWV: listed }, CALENDAR, "standard");

  it("asks for the put chain on the latest 30–45-day expiry before the blackout when flat", () => {
    expect(demand(book())).toEqual({
      chains: [{ underlying: "CRWV", expiration: DEC_31, type: "put" }],
      contracts: [],
    });
  });

  it("asks for the call chain once assigned", () => {
    expect(demand(book(shares(100)))).toEqual({
      chains: [{ underlying: "CRWV", expiration: DEC_31, type: "call" }],
      contracts: [],
    });
  });

  it("asks for nothing while a sale is open, inside the blackout, or with no eligible expiry", () => {
    expect(demand(book(contract(occ("put", 80), -1)))).toBe(NO_OPTION_DEMAND);
    expect(demand(book(), "2026-11-10T16:00:00Z")).toBe(NO_OPTION_DEMAND);
    expect(demand(book(), NOV_18, ["2026-11-20", "2027-01-15"])).toBe(NO_OPTION_DEMAND);
  });
});

describe("CRWV-WHEEL — selling a cash-secured put", () => {
  it("sells one put nearest 0.20 delta on Dec 31, priced a quarter toward the bid, assignment intended", () => {
    const [put] = decide(market());
    expect(put).toMatchObject({
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      type: "limit",
      strategy: "crwv-wheel-put",
      option: {
        effect: "open",
        structure: "cash-secured-put",
        legs: [{ occSymbol: occ("put", 80), side: "sell", ratio: 1 }],
        // Mid 2.30, a quarter of the way to the 2.20 bid is 2.275: a tie on the $0.05 grid goes to
        // the better price for a seller, 2.30.
        limitPrice: 2.3,
        band: { low: 2.2, high: 2.4, at: NOV_18 },
        assignment: "intended",
        selection: {
          rule: "wheel-put-by-delta",
          phase: "flat",
          spot: 92,
          dte: 43,
          targetDelta: 0.2,
          pickedDelta: 0.21,
          deltaSource: "feed",
          expiryBefore: "2027-02-18",
          candidates: 5,
          towardNatural: 0.25,
        },
      },
    });
  });

  it("states the study it runs against and the dated falsifier on the order itself", () => {
    const [put] = decide(market());
    expect(put?.reason).toContain("$8,000 stays set aside");
    expect(put?.reason).toContain("our study found CRWV's option premium underpays its moves");
    expect(put?.forecast).toEqual({
      direction: "up",
      invalidator:
        "CRWV settles below $80 on 2026-12-31 — the wheel buys 100 shares at $80; the play retires " +
        "if its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money",
    });
  });

  it("moves the strike and the price with the mode", () => {
    expect(soldLeg(decide(market(), book(), "conservative"))).toBe(occ("put", 75));
    expect(decide(market(), book(), "conservative")[0]?.option?.limitPrice).toBe(1.75); // mid
    expect(soldLeg(decide(market(), book(), "aggressive"))).toBe(occ("put", 85));
    expect(WHEEL_DELTAS.aggressive.call).toBeLessThanOrEqual(0.3);
  });

  it("reads delta off the house model when the feed has none", () => {
    const noGreeks = PUTS.map(([k, , b, a]): Row => [k, undefined, b, a]);
    const [put] = decide(market(NOV_18, chain("put", noGreeks, NOV_18)));
    expect(put?.option?.legs[0]?.occSymbol).toBe(occ("put", 80));
    expect(put?.option?.selection?.deltaSource).toBe("model");
  });

  it("sells its last print-clean put on 2026-10-07 — the Nov 6 expiry, 30 days out", () => {
    const oct7 = "2026-10-07T15:00:00Z";
    const quotes = chain("put", PUTS, oct7, "2026-11-06");
    const [put] = decide(market(oct7, quotes, ["2026-10-16", "2026-11-06", "2026-11-20"]));
    expect(put?.option?.legs[0]?.occSymbol).toBe(occ("put", 80, "2026-11-06"));
    expect(put?.option?.selection?.expiryBefore).toBe("2026-11-09");
  });
});

describe("CRWV-WHEEL — selling a covered call once assigned", () => {
  it("sells one call nearest 0.25 delta, struck above spot when the shares cost less", () => {
    const [call] = decide(market(), book(shares(100, 80)));
    expect(call).toMatchObject({
      side: "sell",
      quantity: 1,
      strategy: "crwv-wheel-call",
      option: {
        structure: "covered-call",
        legs: [{ occSymbol: occ("call", 105), side: "sell", ratio: 1 }],
        limitPrice: 2.8,
        assignment: "intended",
        selection: { rule: "wheel-call-by-delta", phase: "assigned", targetDelta: 0.25 },
      },
    });
    expect(call?.reason).toContain("at or above their $80.00 cost");
  });

  it("never strikes the call below what the shares cost", () => {
    // Bought at $107: 105 is the nearest delta but would sell at a loss, so 110 it is.
    expect(soldLeg(decide(market(), book(shares(100, 107))))).toBe(occ("call", 110));
  });

  it("sells after an early assignment, and on the whole lot of a partial one", () => {
    expect(soldLeg(decide(market(), book(shares(100))))).toBe(occ("call", 105));
    expect(decide(market(), book(shares(150)))).toHaveLength(1);
    const twoLots = book(shares(250), contract(occ("call", 110), -1));
    expect(decide(market(), twoLots)[0]?.quantity).toBe(1);
  });
});

describe("CRWV-WHEEL — when it sells nothing", () => {
  it("holds an open put or call and leaves a foreign book alone", () => {
    expect(decide(market(), book(contract(occ("put", 80), -1)))).toEqual([]);
    expect(decide(market(), book(shares(100), contract(occ("call", 105), -1)))).toEqual([]);
    expect(decide(market(), book(contract(occ("call", 105), 1)))).toEqual([]);
  });

  it("sells nothing inside the blackout, or with no later print on file", () => {
    const nov12 = "2026-11-12T16:00:00Z";
    expect(decide(market(nov12, chain("put", PUTS, nov12)))).toEqual([]);
    expect(decide(market(), book(), "standard", [NOV_PRINT])).toEqual([]);
  });

  it("sells nothing when no strike is eligible", () => {
    // Every call under the shares' $120 cost.
    expect(decide(market(), book(shares(100, 120)))).toEqual([]);
    // Every put a wide, untradeable quote.
    const wide = PUTS.map(([k, d]): Row => [k, d, 1, 2]);
    expect(decide(market(NOV_18, chain("put", wide, NOV_18)))).toEqual([]);
    // No quotes at all, and no spot.
    expect(decide(market(NOV_18, []))).toEqual([]);
    const noSpot = withOptionQuotes(aContext({}, NOV_18), chain("put", PUTS, NOV_18), {
      CRWV: LISTED,
    });
    expect(decide(noSpot)).toEqual([]);
  });

  it("sells no put far from its target delta when only the near-the-money strikes trade", () => {
    // The 0.15–0.28 rungs quote too wide to trade; the tight 90 put is a 0.41-delta coin flip.
    const thin: readonly Row[] = [
      [75, -0.15, 1.5, 2],
      [80, -0.21, 2, 2.6],
      [85, -0.28, 3.1, 3.8],
      [90, -0.41, 4.8, 5.1],
    ];
    expect(decide(market(NOV_18, chain("put", thin, NOV_18)))).toEqual([]);
  });

  it("never sells a strike above 0.30 delta, the house ceiling on a sold option", () => {
    // Aggressive aims at 0.30: the 0.33 call sits nearer it than the 0.27, but is over the ceiling.
    const calls: readonly Row[] = [
      [95, 0.41, 5.1, 5.4],
      [100, 0.33, 3.9, 4.15],
      [105, 0.27, 2.7, 2.9],
    ];
    const [call] = decide(
      market(NOV_18, chain("call", calls, NOV_18)),
      book(shares(100)),
      "aggressive",
    );
    expect(call?.option?.legs[0]?.occSymbol).toBe(occ("call", 105));
    expect(call?.option?.selection?.pickedDelta).toBe(0.27);
    // An aggressive put with only 0.33 and 0.18 strikes either side of 0.25: the 0.33 one is over
    // the ceiling and the 0.18 one too far from the target, so nothing.
    const puts: readonly Row[] = [
      [78, -0.18, 1.9, 2.05],
      [86, -0.33, 3.5, 3.7],
    ];
    expect(decide(market(NOV_18, chain("put", puts, NOV_18)), book(), "aggressive")).toEqual([]);
  });

  it("sells nothing when no listed expiry is 30 to 45 days out", () => {
    expect(decide(market(NOV_18, chain("put", PUTS, NOV_18), ["2027-01-15"]))).toEqual([]);
  });
});

describe("CRWV-WHEEL — registration", () => {
  it("is an option play on CRWV that holds both shorts into assignment, at level 1", () => {
    expect(CRWV_WHEEL).toMatchObject({
      id: "CRWV-WHEEL",
      symbols: ["CRWV"],
      keyedOn: "earnings",
      size: { conservative: 0, standard: 0, aggressive: 0 },
      options: { underlyings: ["CRWV"], holdsShortToExpiry: ["put", "call"], requiredLevel: 1 },
    });
    expect(CRWV_WHEEL.evidence).toContain("docs/research/crwv-premium-fit.md");
    expect(CRWV_WHEEL.evidence).toContain("2027-01-29");
  });
});

/** PAUSED (#4651): the wheel opens nothing new, but a covered call is the one risk-reducing open it
 *  keeps — without it, shares it was assigned would have no exit at all. */
describe("CRWV-WHEEL — paused", () => {
  const paused: readonly EnabledPlaybook[] = [
    { playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true },
  ];

  it("still sells a covered call on the 100 shares it was assigned — their way out", () => {
    const intents = playbookIntents(paused, market(), book(shares(100, 80)), CALENDAR);
    expect(intents).toEqual(
      decide(market(), book(shares(100, 80))).map((i) => ({
        ...i,
        playbookId: "CRWV-WHEEL",
        playbookMode: "standard",
      })),
    );
    expect(intents).toEqual([
      expect.objectContaining({
        playbookId: "CRWV-WHEEL",
        option: expect.objectContaining({ structure: "covered-call", effect: "open" }),
      }),
    ]);
  });

  it("sells no cash-secured put while flat", () => {
    expect(decide(market())).toHaveLength(1);
    expect(playbookIntents(paused, market(), book(), CALENDAR)).toEqual([]);
  });

  /** End to end through the production wiring and the real guards (#4651 final check): the guards
   *  size a paused wheel's covered call under its paused subscription, exactly as they do running.
   *  Before, they found no ENABLED subscription and refused it "option-unallocated", every time. */
  describe("through the live roster and the guards", () => {
    const quiet: Persona = { id: "sauron", name: "Sauron", thesis: "test", decide: () => [] };
    const bot: Bot = { persona: quiet, credentials: { apiKey: "k", apiSecret: "s" } };
    const wheelSub = (enabled: boolean): PlaybookSubscription => ({
      accountId: "sauron",
      playbookId: "CRWV-WHEEL",
      mode: "aggressive",
      capitalAllocated: 75_000,
      enabled,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    });
    // The live runner's base risk (run-autonomous: the print discipline) plus an account approved
    // for covered calls and cash-secured puts (`OptionWiring.risk`).
    const liveRisk = {
      ...DEFAULT_RISK_CONFIG,
      discipline: { calendar: UPCOMING_PRINTS },
      optionsLevel: 1,
    };
    const trade = (enabled: boolean, portfolio: Portfolio) => {
      const trading = tradingRoster(resolveBotRoster(bot, [], [wheelSub(enabled)]), liveRisk);
      const raw = trading.persona.decide(market(), portfolio);
      return { raw, ...applyGuardsWithVerdicts(raw, portfolio, market(), trading.risk) };
    };

    it("approves a paused wheel's covered call on its assigned shares, as it does running", () => {
      const assigned = book(shares(100, 80));
      const running = trade(true, assigned);
      const paused = trade(false, assigned);
      expect(paused.raw).toEqual([
        expect.objectContaining({
          playbookId: "CRWV-WHEEL",
          option: expect.objectContaining({ structure: "covered-call", effect: "open" }),
        }),
      ]);
      expect(paused.raw).toEqual(running.raw);
      expect(running.approved).toHaveLength(1);
      expect(paused.approved).toEqual(running.approved);
      expect(paused.refused).toEqual([]);
    });

    it("never lets a paused wheel's cash-secured put reach the guards", () => {
      expect(trade(true, book()).raw).toHaveLength(1);
      expect(trade(false, book()).raw).toEqual([]);
    });
  });
});
