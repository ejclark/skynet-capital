import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { optionBook } from "../../src/domain/option-book.js";
import {
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionContractQuote,
  type OrderIntent,
  type PlaybookMode,
  type Portfolio,
  type Position,
} from "../../src/domain/types.js";
import { SPREAD_SHORT_DELTA, spreadShape } from "../../src/playbooks/call-spread.js";
import { NVDA_CALL_SPREAD, registeredPlaybooks, S1_NVDA } from "../../src/playbooks/registry.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

// The NVDA call debit spread on the real 2026 exchange calendar. If NVIDIA confirms 11-18: D-20 is
// Wed 10-21, D-6 Tue 11-10, D-5 Wed 11-11 (Veterans Day trades), and the print blackout is
// 11-18..11-19 — so the latest expiry after D-5 and before it is Fri 11-13.
const confirmed = (date: string): EarningsPrint => ({
  symbol: "NVDA",
  date,
  status: "confirmed",
  source: "test: IR call notice",
});
const CONFIRMED: readonly EarningsPrint[] = [confirmed("2026-11-18")];
// As filed 2026-10-05: an estimate, window Nov 17–25. It opens nothing.
const ESTIMATED: readonly EarningsPrint[] = [
  {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "estimate",
    source: "test: cadence",
    window: { start: "2026-11-17", end: "2026-11-25" },
  },
];

const spreadWindow = NVDA_CALL_SPREAD.desiredState;

const OCT_28 = "2026-10-28T15:00:00Z"; // Wed 11:00 ET — the day NVIDIA's notice is due
const NOV_13 = "2026-11-13";
const LISTED = ["2026-10-30", "2026-11-06", NOV_13, "2026-11-20", "2026-11-27", "2026-12-18"];
const occ = (strike: number, expiration = NOV_13) =>
  buildOccSymbol({ underlying: "NVDA", expiration, type: "call", strike });

type Row = readonly [strike: number, delta: number | undefined, bid: number, ask: number];
// NVDA at $240, 16 days out at ~42% implied: the house model's own prices and deltas.
const CALLS: readonly Row[] = [
  [225, 0.78, 17.55, 17.95],
  [230, 0.7, 14, 14.35],
  [235, 0.61, 10.9, 11.2],
  [240, 0.52, 8.3, 8.55],
  [245, 0.42, 6.15, 6.35],
  [250, 0.33, 4.4, 4.6],
  [255, 0.26, 3.1, 3.25],
  [260, 0.19, 2.1, 2.22],
  [265, 0.14, 1.4, 1.48],
];
const chain = (asOf: string, rows: readonly Row[] = CALLS, expiration = NOV_13) =>
  rows.map(([strike, delta, bid, ask]) =>
    anOptionQuote(occ(strike, expiration), {
      bid,
      ask,
      openInterest: 2_000,
      at: asOf,
      ...(delta === undefined ? {} : { delta }),
    }),
  );
function market(
  asOf = OCT_28,
  quotes: readonly OptionContractQuote[] = chain(asOf),
  listed: readonly string[] = LISTED,
  spot = 240,
): MarketContext {
  return withOptionQuotes(aContext({ NVDA: { last: spot } }, asOf), quotes, { NVDA: listed });
}

const contract = (symbol: string, quantity: number): Position => ({
  symbol,
  quantity,
  avgPrice: 5,
});
const book = (...positions: Position[]): Portfolio => aPortfolio({ cash: 50_000, positions });
const VERTICAL = book(contract(occ(240), 1), contract(occ(255), -1));
const decide = (
  context: MarketContext,
  portfolio: Portfolio = book(),
  calendar: readonly EarningsPrint[] = CONFIRMED,
  mode: PlaybookMode = "standard",
): readonly OrderIntent[] => NVDA_CALL_SPREAD.decide?.(context, portfolio, calendar, mode) ?? [];
const at = (day: string, time = "15:00:00Z") => `${day}T${time}`;

describe("NVDA-CALL-SPREAD — the window, counted in trading sessions", () => {
  it("opens at D-20 (10-21) and holds through D-6 (11-10) on a confirmed 11-18 print", () => {
    expect(spreadWindow(at("2026-10-20"), CONFIRMED)).toBe("no-window"); // D-21
    expect(spreadWindow(at("2026-10-21"), CONFIRMED)).toBe("long");
    expect(spreadWindow(at("2026-11-10"), CONFIRMED)).toBe("long");
  });

  it("is flat from D-5 (11-11) through the print and the days just after it", () => {
    for (const day of ["2026-11-11", "2026-11-13", "2026-11-18", "2026-11-19", "2026-11-21"]) {
      expect(spreadWindow(at(day), CONFIRMED)).toBe("flat");
    }
    // Past the post-print days, the next row is February's estimate: no window.
    expect(spreadWindow(at("2026-11-23"), CONFIRMED)).toBe("no-window");
  });

  it("counts the same sessions S1-NVDA does — 10-21 is D-20 for both (#4776)", () => {
    expect(S1_NVDA.desiredState(at("2026-10-21"), CONFIRMED)).toBe("long");
    expect(spreadWindow(at("2026-10-21"), CONFIRMED)).toBe("long");
  });

  it("opens nothing on the estimate as filed, nor with no NVDA print on file", () => {
    expect(spreadWindow(OCT_28, ESTIMATED)).toBe("no-window");
    expect(spreadWindow(OCT_28, [])).toBe("no-window");
  });

  it("is its own verdict: desiredState reads the same window", () => {
    expect(NVDA_CALL_SPREAD.desiredState(OCT_28, CONFIRMED)).toBe("long");
  });
});

describe("NVDA-CALL-SPREAD — what NVDA contracts the bot holds", () => {
  const shape = (portfolio: Portfolio) => spreadShape(optionBook(portfolio, "NVDA")).kind;

  it("reads no contracts as none, shares or not", () => {
    expect(shape(book())).toBe("none");
    expect(shape(book({ symbol: "NVDA", quantity: 50, avgPrice: 200 }))).toBe("none");
  });

  it("reads one long call below one short call, same expiry and size, as its spread", () => {
    expect(spreadShape(optionBook(VERTICAL, "NVDA"))).toMatchObject({
      kind: "vertical",
      long: { occSymbol: occ(240) },
      short: { occSymbol: occ(255) },
      quantity: 1,
    });
    expect(shape(book(contract(occ(255), -2), contract(occ(240), 2)))).toBe("vertical");
  });

  it("leaves anything else alone", () => {
    const foreign = [
      book(contract(occ(240), 1)),
      book(contract(occ(240), 1), contract(occ(255), 1)),
      book(contract(occ(255), 1), contract(occ(240), -1)), // a credit spread
      book(contract(occ(240), 1), contract(occ(255, "2026-11-20"), -1)),
      book(contract(occ(240), 2), contract(occ(255), -1)),
      book(contract(occ(240), 1), contract(occ(255), -1), contract(occ(260), -1)),
      book(
        contract(occ(240), 1),
        contract(
          buildOccSymbol({ underlying: "NVDA", expiration: NOV_13, type: "put", strike: 255 }),
          -1,
        ),
      ),
    ];
    expect(foreign.map(shape)).toEqual(foreign.map(() => "foreign"));
  });
});

describe("NVDA-CALL-SPREAD — what it asks the market for", () => {
  const demand = (portfolio: Portfolio, asOf = OCT_28, listed: readonly string[] = LISTED) =>
    NVDA_CALL_SPREAD.optionDemand?.(asOf, portfolio, { NVDA: listed }, CONFIRMED, "standard");

  it("asks for the 11-13 call chain to open in the window", () => {
    expect(demand(book())).toEqual({
      chains: [{ underlying: "NVDA", expiration: NOV_13, type: "call" }],
      contracts: [],
    });
  });

  it("asks for its two legs once the window has shut on a held spread", () => {
    expect(demand(VERTICAL, at("2026-11-11"))).toEqual({
      chains: [],
      contracts: [occ(240), occ(255)],
    });
  });

  it("asks for nothing holding inside the window, on a foreign book, or with no expiry to fit", () => {
    expect(demand(VERTICAL)).toBe(NO_OPTION_DEMAND);
    expect(demand(book(contract(occ(240), 1)))).toBe(NO_OPTION_DEMAND);
    expect(demand(book(), OCT_28, ["2026-11-06", "2026-11-20"])).toBe(NO_OPTION_DEMAND);
  });
});

describe("NVDA-CALL-SPREAD — opening the spread", () => {
  it("buys the 0.50-delta call and sells the 0.25-delta call above it, one spread, for a debit", () => {
    const [open] = decide(market());
    expect(open).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      quantity: 1,
      type: "limit",
      strategy: "nvda-spread-open",
      option: {
        effect: "open",
        structure: "call-debit-spread",
        legs: [
          { occSymbol: occ(240), side: "buy", ratio: 1 },
          { occSymbol: occ(255), side: "sell", ratio: 1 },
        ],
        // Net band 8.30 − 3.25 = 5.05 to 8.55 − 3.10 = 5.45; mid 5.25, a quarter toward 5.45.
        band: { low: 5.05, high: 5.45, at: OCT_28 },
        limitPrice: 5.3,
        selection: {
          rule: "spread-by-delta",
          phase: "open",
          spot: 240,
          dte: 16,
          targetDelta: 0.25,
          pickedDelta: 0.26,
          deltaSource: "feed",
          expiryBefore: "2026-11-18",
          candidates: 5,
          towardNatural: 0.25,
        },
      },
      forecast: {
        direction: "up",
        invalidator:
          "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost",
      },
    });
  });

  it("says what it can lose, when it leaves, and where a one-sigma rise reaches", () => {
    const [open] = decide(market());
    expect(open?.reason).toContain("the options form of the pre-earnings run-up");
    expect(open?.reason).toContain("The most it can lose is that $530 debit");
    expect(open?.reason).toContain("sold back by 2026-11-11");
    expect(open?.expectation).toContain("above $255 at expiry the spread is worth $1,500");
    expect(open?.expectation).toMatch(/one-standard-deviation rise .* reaches about \$26\d\.\d\d/);
  });

  // #885: which playbooks a bot runs is its owner's to see. Its sentences ride every fill to any
  // member (the league Wire), so they say what the play does and never name a playbook.
  it("names no playbook in anything it tells a member", () => {
    const [open] = decide(market());
    const said = [open?.reason, open?.expectation, open?.forecast?.invalidator].join(" ");
    expect(said.length).toBeGreaterThan(0);
    for (const { id } of registeredPlaybooks()) expect(said).not.toContain(id);
  });

  it("moves the short strike and the price with the mode", () => {
    const shortLeg = (mode: PlaybookMode) =>
      decide(market(), book(), CONFIRMED, mode)[0]?.option?.legs[1]?.occSymbol;
    expect(shortLeg("conservative")).toBe(occ(250));
    expect(shortLeg("aggressive")).toBe(occ(260));
    expect(SPREAD_SHORT_DELTA.conservative).toBeGreaterThan(SPREAD_SHORT_DELTA.aggressive);
    // Conservative prices at the net mid: 8.425 − 4.50 = 3.925 → the cent below, the better buy.
    expect(decide(market(), book(), CONFIRMED, "conservative")[0]?.option?.limitPrice).toBe(3.92);
  });

  it("reads delta off the house model when the feed has none", () => {
    const noGreeks = CALLS.map(([k, , b, a]): Row => [k, undefined, b, a]);
    const [open] = decide(market(OCT_28, chain(OCT_28, noGreeks)));
    expect(open?.option?.legs.map((l) => l.occSymbol)).toEqual([occ(240), occ(255)]);
    expect(open?.option?.selection?.deltaSource).toBe("model");
  });

  it("opens on D-20 itself, 10-21, before NVIDIA would normally have posted the date", () => {
    const oct21 = at("2026-10-21");
    expect(decide(market(oct21, chain(oct21)))).toHaveLength(1);
  });
});

describe("NVDA-CALL-SPREAD — closing the spread", () => {
  // NVDA at $250 on D-5: the 240 call 11.40 × 11.70, the 255 call 3.90 × 4.10 — the spread sells for
  // a credit between 7.30 and 7.80, signed −7.80..−7.30 in Alpaca's net.
  const closing = (
    asOf: string,
    rows: readonly Row[] = [
      [240, 0.71, 11.4, 11.7],
      [255, 0.36, 3.9, 4.1],
    ],
  ) => market(asOf, chain(asOf, rows), LISTED, 250);
  const close = (asOf: string, calendar: readonly EarningsPrint[] = CONFIRMED) =>
    decide(closing(asOf), VERTICAL, calendar)[0];

  it("sells it back on D-5 as one two-leg order at mid", () => {
    expect(close(at("2026-11-11", "15:30:00Z"))).toMatchObject({
      symbol: "NVDA",
      side: "sell",
      quantity: 1,
      strategy: "nvda-spread-close",
      option: {
        effect: "close",
        structure: "close",
        legs: [
          { occSymbol: occ(240), side: "sell", ratio: 1 },
          { occSymbol: occ(255), side: "buy", ratio: 1 },
        ],
        limitPrice: -7.55,
        band: { low: -7.8, high: -7.3 },
        selection: { rule: "spread-close", phase: "dead-week", towardNatural: 0 },
      },
    });
  });

  it("says how it is priced and what happens if it does not fill", () => {
    expect(close(at("2026-11-11", "15:30:00Z"))?.expectation).toBe(
      "Priced at mid; each session past D-5 moves it closer to natural.",
    );
    expect(close(at("2026-11-11", "15:30:00Z"), [confirmed("2026-11-10")])?.expectation).toBe(
      "Priced at the natural side: the print has passed, so it waits for nothing.",
    );
    expect(close(at("2026-10-30", "15:30:00Z"), ESTIMATED)?.expectation).toContain(
      "expiry hygiene closes it two sessions before expiry",
    );
  });

  it("leans toward natural as the sessions since D-5 pass", () => {
    // 14:30 ET on D-5: a third of the way; 10:30 ET the next session: two thirds; two sessions on:
    // natural.
    expect(close(at("2026-11-11", "19:30:00Z"))?.option?.limitPrice).toBe(-7.47);
    expect(close(at("2026-11-12", "15:30:00Z"))?.option?.limitPrice).toBe(-7.38);
    expect(close(at("2026-11-13", "15:30:00Z"))?.option?.limitPrice).toBe(-7.3);
  });

  it("goes straight to natural after a print, and to mid when the date stops being confirmed", () => {
    // NVIDIA moved the print up to 11-10: the day after, the spread is out at the natural side.
    expect(close(at("2026-11-11", "15:30:00Z"), [confirmed("2026-11-10")])).toMatchObject({
      option: { limitPrice: -7.3, selection: { phase: "after-print" } },
    });
    expect(close(at("2026-10-30", "15:30:00Z"), ESTIMATED)).toMatchObject({
      option: { limitPrice: -7.55, selection: { phase: "unconfirmed" } },
    });
    expect(close(at("2026-10-20", "15:30:00Z"))).toMatchObject({
      option: { selection: { phase: "before-window" } },
    });
  });

  it("asks a cent for a spread whose net rounds to zero, and sends nothing without a quote", () => {
    const worthless = closing(at("2026-11-11", "15:30:00Z"), [
      [240, 0.02, 0.1, 0.11],
      [255, 0.01, 0.1, 0.11],
    ]);
    expect(decide(worthless, VERTICAL)[0]?.option?.limitPrice).toBe(0.01);
    expect(decide(market(at("2026-11-11"), []), VERTICAL)).toEqual([]);
  });

  it("sells back any NVDA call debit spread on its bot outside the window, whoever placed it", () => {
    // A Dec-18 240/260 spans the print, so the play never opens it — but positions carry no record
    // of who placed them, so on an estimated date it is read as the play's and sold at mid.
    const dec18 = "2026-12-18";
    const desk = book(contract(occ(240, dec18), 1), contract(occ(260, dec18), -1));
    const oct5 = at("2026-10-05", "15:30:00Z");
    const rows: readonly Row[] = [
      [240, 0.55, 16, 16.4],
      [260, 0.36, 8, 8.3],
    ];
    expect(decide(market(oct5, chain(oct5, rows, dec18)), desk, ESTIMATED)).toMatchObject([
      { strategy: "nvda-spread-close", option: { selection: { phase: "unconfirmed" } } },
    ]);
  });

  it("holds a spread inside the window", () => {
    expect(decide(market(), VERTICAL)).toEqual([]);
  });
});

describe("NVDA-CALL-SPREAD — when it does nothing", () => {
  it("leaves a foreign NVDA book alone, in the window or out of it", () => {
    expect(decide(market(), book(contract(occ(240), 1)))).toEqual([]);
    expect(decide(market(at("2026-11-11")), book(contract(occ(240), 1)))).toEqual([]);
  });

  it("opens nothing outside the window or on the estimate", () => {
    expect(decide(market(at("2026-11-11")))).toEqual([]);
    expect(decide(market(at("2026-10-20")))).toEqual([]);
    expect(decide(market(), book(), ESTIMATED)).toEqual([]);
  });

  it("opens nothing with no expiry between D-5 and the print, no strike above the long, or no spot", () => {
    expect(decide(market(OCT_28, chain(OCT_28), ["2026-11-06", "2026-11-20"]))).toEqual([]);
    const topStrike = CALLS.filter(([k]) => k <= 240);
    expect(decide(market(OCT_28, chain(OCT_28, topStrike)))).toEqual([]);
    const noSpot = withOptionQuotes(aContext({}, OCT_28), chain(OCT_28), { NVDA: LISTED });
    expect(decide(noSpot)).toEqual([]);
  });

  it("opens nothing on a crossed chain whose spread would cost a cent or less", () => {
    const crossed: readonly Row[] = [
      [240, 0.5, 1, 1.05],
      [255, 0.25, 1.1, 1.15],
    ];
    expect(decide(market(OCT_28, chain(OCT_28, crossed)))).toEqual([]);
    // A net ask of exactly a cent (1.11 − 1.10): the floor alone would price a 1-cent debit.
    const oneCent: readonly Row[] = [
      [240, 0.5, 1, 1.11],
      [255, 0.25, 1.1, 1.15],
    ];
    expect(decide(market(OCT_28, chain(OCT_28, oneCent)))).toEqual([]);
  });

  it("opens nothing when the only tradeable long call is deep in the money", () => {
    // The 230–255 rows quote too wide to trade, so the call nearest 0.50 delta that does is the
    // 0.78-delta 225 — deep in the money, not the "about at the money" leg the card promises.
    const deep = CALLS.map(
      ([k, d, b, a]): Row => (k >= 230 && k <= 255 ? [k, d, b, b * 1.3] : [k, d, b, a]),
    );
    expect(decide(market(OCT_28, chain(OCT_28, deep)))).toEqual([]);
  });

  it("opens nothing when no short call sits near the mode's delta", () => {
    // Above the 240 call only a 0.42-delta strike trades: a spread a strike wide, not 0.25 delta.
    const narrow = CALLS.filter(([k]) => k <= 245);
    expect(decide(market(OCT_28, chain(OCT_28, narrow)))).toEqual([]);
  });
});

describe("NVDA-CALL-SPREAD — registration", () => {
  it("is a level-3 option play on NVDA that derives from S1-NVDA and holds no short to expiry", () => {
    expect(NVDA_CALL_SPREAD).toMatchObject({
      id: "NVDA-CALL-SPREAD",
      symbols: ["NVDA"],
      keyedOn: "earnings",
      derivesFrom: "S1-NVDA",
      options: { underlyings: ["NVDA"], holdsShortToExpiry: [], requiredLevel: 3 },
    });
    expect(NVDA_CALL_SPREAD.evidence).toContain("docs/research/nvda-earnings-cycle.md");
  });
});
