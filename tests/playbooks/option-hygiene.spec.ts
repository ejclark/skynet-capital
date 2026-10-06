import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OptionContractQuote,
  Portfolio,
  Position,
} from "../../src/domain/types.js";
import { applyGuardsWithVerdicts } from "../../src/engine/guards.js";
import type { Persona } from "../../src/personas/persona.js";
import { CRWV_WHEEL } from "../../src/playbooks/crwv-wheel.js";
import { hygieneDemand, hygieneIntents } from "../../src/playbooks/option-hygiene.js";
import type { EnabledPlaybook, Playbook } from "../../src/playbooks/playbook.js";
import { withOptionSafety } from "../../src/playbooks/with-option-safety.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

// Expiry hygiene. CRWV's Nov 6 contracts fall due at T-2 = Wed Nov 4; CRWV's print blackout runs
// Nov 9–17, so a short expiring after it falls due two sessions before, Thu Nov 5. Times are ET
// (EST after Nov 1): 16:00Z = 11:00.
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
];
const CALL_95 = "CRWV261106C00095000";
const CALL_100 = "CRWV261106C00100000";
const PUT_NOV6 = "CRWV261106P00085000";
const PUT_NOV20 = "CRWV261120P00085000";

const WHEEL: Playbook = {
  id: "CRWV-WHEEL",
  symbols: ["CRWV"],
  thesis: "test",
  evidence: "test",
  size: { conservative: 0, standard: 0, aggressive: 0 },
  desiredState: () => "no-window",
  options: { underlyings: ["CRWV"], holdsShortToExpiry: ["put", "call"], requiredLevel: 1 },
};
const wheel: readonly EnabledPlaybook[] = [{ playbook: WHEEL, mode: "standard" }];

const holding = (...positions: Position[]): Portfolio => aPortfolio({ cash: 50_000, positions });
const contract = (symbol: string, quantity: number, over: Partial<Position> = {}): Position => ({
  symbol,
  quantity,
  avgPrice: 1.4,
  ...over,
});
const at = (asOf: string, quotes: readonly OptionContractQuote[] = []): MarketContext =>
  withOptionQuotes(aContext({ CRWV: { last: 92 } }, asOf), quotes);
const quoted = (asOf: string, ...quotes: [string, number, number][]) =>
  at(
    asOf,
    quotes.map(([occ, bid, ask]) => anOptionQuote(occ, { bid, ask, at: asOf })),
  );

const T3 = "2026-11-03T16:00:00Z";
const T2 = "2026-11-04T16:00:00Z";
const T2_LATE = "2026-11-04T20:45:00Z"; // 15:45 ET
const T1 = "2026-11-05T15:30:00Z"; // 10:30 ET
const T1_PM = "2026-11-05T19:30:00Z"; // 14:30 ET
const T0 = "2026-11-06T15:30:00Z";

describe("expiry hygiene — when a contract falls due", () => {
  const long = holding(contract(CALL_95, 1));

  it("leaves a contract alone before T-2, and asks for no quote", () => {
    expect(hygieneIntents(quoted(T3, [CALL_95, 1, 1.2]), long, [], CALENDAR)).toEqual([]);
    expect(hygieneDemand(T3, long, [], CALENDAR).contracts).toEqual([]);
  });

  it("closes a long at T-2 at mid, tagged as the safety close it is", () => {
    const [close] = hygieneIntents(quoted(T2, [CALL_95, 1, 1.2]), long, [], CALENDAR);
    expect(close).toMatchObject({
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      type: "limit",
      strategy: "expiry-hygiene",
      urgent: true,
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: CALL_95, side: "sell", ratio: 1 }],
        limitPrice: 1.1,
        band: { low: 1, high: 1.2 },
      },
    });
    expect(close?.playbookId).toBeUndefined(); // nobody owns it: a desk-placed contract
    expect(close?.forecast).toBeUndefined();
    expect(hygieneDemand(T2, long, [], CALENDAR).contracts).toEqual([CALL_95]);
  });

  it("never drops a worthless long: a $0.00 bid asks one tick ($0.05), and the guards name what stops it", () => {
    const worthless = quoted(T2, [CALL_95, 0, 0]);
    const [close] = hygieneIntents(worthless, long, [], CALENDAR);
    expect(close?.option).toMatchObject({ limitPrice: 0.05, band: { low: 0, high: 0 } });
    const verdict = applyGuardsWithVerdicts(close ? [close] : [], long, worthless, {
      maxPositionPct: 1,
    });
    expect(verdict.refused.map((r) => r.reason)).toEqual(["option-limit-outside-quote"]);
  });

  it("walks the limit from mid to natural as the day and the sessions pass", () => {
    const priceAt = (asOf: string) =>
      hygieneIntents(quoted(asOf, [CALL_95, 1, 1.2]), long, [], CALENDAR)[0]?.option?.limitPrice;
    expect([priceAt(T2), priceAt(T2_LATE), priceAt(T1), priceAt(T1_PM), priceAt(T0)]).toEqual([
      1.1, 1.05, 1.05, 1, 1,
    ]);
  });
});

describe("expiry hygiene — grouping", () => {
  it("closes one long and one short of equal size in one expiry as a single vertical", () => {
    const book = holding(contract(CALL_95, 1), contract(CALL_100, -1, { avgPrice: 0.5 }));
    const closes = hygieneIntents(
      quoted(T2, [CALL_95, 1, 1.2], [CALL_100, 0.4, 0.5]),
      book,
      [],
      CALENDAR,
    );
    expect(closes).toHaveLength(1);
    expect(closes[0]).toMatchObject({
      side: "sell", // a net credit
      quantity: 1,
      option: {
        legs: [
          { occSymbol: CALL_95, side: "sell", ratio: 1 },
          { occSymbol: CALL_100, side: "buy", ratio: 1 },
        ],
        limitPrice: -0.65,
        band: { low: -0.8, high: -0.5 },
      },
    });
  });

  it("closes anything else leg by leg", () => {
    const book = holding(contract(CALL_95, 2), contract(CALL_100, -1, { avgPrice: 0.5 }));
    const closes = hygieneIntents(
      quoted(T2, [CALL_95, 1, 1.2], [CALL_100, 0.4, 0.5]),
      book,
      [],
      CALENDAR,
    );
    expect(closes.map((c) => [c.side, c.quantity, c.option?.legs.length])).toEqual([
      ["sell", 2, 1],
      ["buy", 1, 1],
    ]);
  });

  it("skips a contract the playbooks already close this cycle", () => {
    const book = holding(contract(CALL_95, 1));
    expect(
      hygieneIntents(quoted(T2, [CALL_95, 1, 1.2]), book, [], CALENDAR, new Set([CALL_95])),
    ).toEqual([]);
  });
});

describe("expiry hygiene — no quote", () => {
  const book = holding(contract(CALL_95, 1, { avgPrice: 1.4, marketValue: 90 }));

  it("waits at T-2, and from T-1 emits at its mark with no band — which the guards refuse loudly", () => {
    expect(hygieneIntents(at(T2), book, [], CALENDAR)).toEqual([]);
    const [close] = hygieneIntents(at(T1), book, [], CALENDAR);
    expect(close?.option).toMatchObject({ limitPrice: 0.9 });
    expect(close?.option?.band).toBeUndefined();
    const verdict = applyGuardsWithVerdicts(close ? [close] : [], book, at(T1), {
      maxPositionPct: 1,
    });
    expect(verdict.refused.map((r) => r.reason)).toEqual(["no-quote"]);
  });
});

describe("expiry hygiene — shorts", () => {
  it("leaves a short the enabled wheel holds to assignment, and closes it once the wheel is paused", () => {
    const book = holding(contract(PUT_NOV6, -1, { avgPrice: 2.1 }));
    const context = quoted(T2, [PUT_NOV6, 0.3, 0.4]);
    expect(hygieneIntents(context, book, wheel, CALENDAR)).toEqual([]);
    expect(hygieneIntents(context, book, [], CALENDAR)).toMatchObject([
      { side: "buy", strategy: "expiry-hygiene" },
    ]);
  });

  // #4651: a paused wheel opens nothing new, so a short put — whose assignment would buy new shares
  // — is bought back at T-2. The wheel never closes its own put, so hygiene is its one closer:
  // exactly one close, through the whole composed persona the live bot runs.
  it("buys back a paused wheel's short put at T-2, exactly once — never before, never twice", () => {
    const paused: readonly EnabledPlaybook[] = [
      { playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true },
    ];
    const quiet: Persona = { id: "sauron", name: "Sauron", thesis: "test", decide: () => [] };
    const bot = withOptionSafety(withPlaybooks(quiet, paused, CALENDAR), paused, CALENDAR);
    const book = holding(contract(PUT_NOV6, -1, { avgPrice: 2.1 }));
    expect(bot.decide(quoted(T3, [PUT_NOV6, 0.3, 0.4]), book)).toEqual([]);
    expect(bot.decide(quoted(T2, [PUT_NOV6, 0.3, 0.4]), book)).toMatchObject([
      { side: "buy", strategy: "expiry-hygiene", option: { effect: "close" } },
    ]);
  });

  // A paused wheel keeps its covered call into call-away: that is how its assigned shares leave.
  it("keeps a paused wheel's covered call into assignment at T-2, as when it runs", () => {
    const book = holding({ symbol: "CRWV", quantity: 100, avgPrice: 80 }, contract(CALL_95, -1));
    const context = quoted(T2, [CALL_95, 1, 1.2]);
    const paused: readonly EnabledPlaybook[] = [
      { playbook: WHEEL, mode: "standard", exitsOnly: true },
    ];
    expect(hygieneIntents(context, book, paused, CALENDAR)).toEqual([]);
    expect(hygieneIntents(context, book, wheel, CALENDAR)).toEqual([]);
  });

  it("closes a short that spans a print two sessions before the blackout, whatever its owner holds", () => {
    const book = holding(contract(PUT_NOV20, -1, { avgPrice: 3 }));
    const asOf = "2026-11-05T16:00:00Z";
    expect(hygieneIntents(quoted(T2, [PUT_NOV20, 1, 1.1]), book, wheel, CALENDAR)).toEqual([]);
    const [close] = hygieneIntents(quoted(asOf, [PUT_NOV20, 1, 1.1]), book, wheel, CALENDAR);
    expect(close).toMatchObject({
      side: "buy",
      strategy: "print-span-close",
      playbookId: "CRWV-WHEEL",
      playbookMode: "standard",
    });
    expect(hygieneDemand(asOf, book, wheel, CALENDAR).contracts).toEqual([PUT_NOV20]);
  });
});
