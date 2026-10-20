import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OptionContractQuote,
  OrderIntent,
  PlaybookMode,
  Portfolio,
  Position,
} from "../../src/domain/types.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import {
  inQuietPeriod,
  type Narrowing,
  resolveSteering,
  type SteerBounds,
} from "../../src/playbooks/conviction-steering.js";
import { ConvictionStore } from "../../src/playbooks/conviction-store.js";
import { CRWV_LONG_CALL, CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { steeredBy } from "../../src/playbooks/steered-playbook.js";
import { subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

/**
 * #5482 slice 4 — a conviction narrows the settings of the pairs it steers (criterion 3), the
 * playbook still picks the timing and no order comes from the conviction (criterion 4), and exits
 * are never narrowed away. The AI-dip view's own narrowings are measured on a fixture chain.
 */

const BOUNDS: SteerBounds = {
  dte: { min: 14, max: 45 },
  contracts: { conservative: 3, standard: 6, aggressive: 10 },
};
const resolve = (narrowings: readonly Narrowing[], strict = true) =>
  resolveSteering(narrowings, BOUNDS, AI_DIP_2026_10.claims, strict);

const ACCOUNT = "acct-eric";
const aiDipSub = (playbookId: string) =>
  aSubscription(ACCOUNT, playbookId, { convictionId: "ai-dip-2026-10" });

describe("narrowing kinds — each only tightens a bound", () => {
  it("days to expiry: a window inside the playbook's is kept, a side moved outward is refused", () => {
    const ok = resolve([{ kind: "dte", min: 21, max: 40 }]);
    expect(ok).toMatchObject({ ok: true, steering: { dte: { min: 21, max: 40 } } });
    expect(resolve([{ kind: "dte", min: 30 }])).toMatchObject({
      ok: true,
      steering: { dte: { min: 30, max: 45 } },
    });
    expect(resolve([{ kind: "dte", min: 7 }])).toEqual({
      ok: false,
      reason: "7-45 days to expiry is wider than this playbook's 14-45",
    });
    expect(resolve([{ kind: "dte", max: 60 }])).toMatchObject({ ok: false });
    expect(resolve([{ kind: "dte", min: 40, max: 20 }])).toMatchObject({ ok: false });
    expect(resolve([{ kind: "dte" }])).toMatchObject({ ok: false });
  });

  it("expiry floor: any real day narrows a playbook that has none; a bad day is refused", () => {
    expect(resolve([{ kind: "expiry-from", day: "2027-03-18" }])).toMatchObject({
      ok: true,
      steering: { expiryFrom: "2027-03-18" },
    });
    expect(resolve([{ kind: "expiry-from", day: "2027-02-30" }])).toMatchObject({ ok: false });
  });

  it("strike ceiling: a price, or the floor band a claim's cycle-phase study carries", () => {
    expect(resolve([{ kind: "strike-ceiling", ceiling: 50 }])).toMatchObject({
      ok: true,
      steering: { strikeMax: 50 },
    });
    expect(resolve([{ kind: "strike-ceiling", ceiling: -1 }])).toMatchObject({ ok: false });
    const floor = resolve([{ kind: "strike-ceiling", ceiling: { floorOfClaim: "7" } }]);
    expect(floor.ok && floor.steering.strikeMax).toBeCloseTo(53.67, 2);
  });

  it("strike ceiling by claim: a claim with no cycle-phase study is refused when a playbook is built", () => {
    const unread = [{ kind: "strike-ceiling", ceiling: { floorOfClaim: "5" } }] as const;
    // Claim 5 was studied by earnings-cycle, not cycle-phase: no floor band to read.
    expect(resolve(unread)).toMatchObject({ ok: false });
    expect(
      resolve([{ kind: "strike-ceiling", ceiling: { floorOfClaim: "99" } }], false),
    ).toMatchObject({
      ok: false,
    });
    // The record store reads it leniently, so a study still to run cannot make the record vanish.
    expect(resolve(unread, false)).toMatchObject({ ok: true });
  });

  it("quiet period: sessions after the print, within reason", () => {
    expect(resolve([{ kind: "quiet", sessionsAfterPrint: 6 }])).toMatchObject({
      ok: true,
      steering: { quietSessionsAfterPrint: 6 },
    });
    expect(resolve([{ kind: "quiet", sessionsAfterPrint: -1 }])).toMatchObject({ ok: false });
    expect(resolve([{ kind: "quiet", sessionsAfterPrint: 400 }])).toMatchObject({ ok: false });
  });

  it("contracts: a cap up to the most the playbook asks for, never above", () => {
    expect(resolve([{ kind: "contracts", max: 4 }])).toMatchObject({
      ok: true,
      steering: { contractsMax: 4 },
    });
    expect(resolve([{ kind: "contracts", max: 11 }])).toEqual({
      ok: false,
      reason: "a cap of 11 contracts is above this playbook's most, 10",
    });
    expect(resolve([{ kind: "contracts", max: 0 }])).toMatchObject({ ok: false });
  });

  it("refuses the whole set when one narrowing widens, and when a kind repeats", () => {
    const mixed = resolve([
      { kind: "expiry-from", day: "2027-03-18" },
      { kind: "dte", min: 5 },
    ]);
    expect(mixed.ok).toBe(false);
    expect(mixed).not.toHaveProperty("steering");
    expect(
      resolve([
        { kind: "quiet", sessionsAfterPrint: 3 },
        { kind: "quiet", sessionsAfterPrint: 4 },
      ]),
    ).toEqual({ ok: false, reason: "it narrows quiet twice" });
  });

  it("resolves to plain data: nothing in it can place an order", () => {
    const resolved = resolve([
      { kind: "dte", min: 21 },
      { kind: "contracts", max: 2 },
    ]);
    expect(
      Object.values(resolved.ok ? resolved.steering : {}).every((v) => typeof v !== "function"),
    ).toBe(true);
  });
});

describe("the quiet period", () => {
  const CALENDAR: readonly EarningsPrint[] = [
    {
      symbol: "CRWV",
      date: "2026-11-10",
      status: "estimate",
      source: "test",
      window: { start: "2026-11-09", end: "2026-11-16" },
    },
  ];
  const quiet = (day: string) => inQuietPeriod("CRWV", day, 6, CALENDAR);

  it("runs from the first day the print could land to 6 sessions after the last", () => {
    expect(quiet("2026-11-06")).toBe(false);
    expect(quiet("2026-11-09")).toBe(true);
    expect(quiet("2026-11-17")).toBe(true);
    expect(quiet("2026-11-24")).toBe(true);
    expect(quiet("2026-11-25")).toBe(false);
  });

  it("is about this symbol's prints only", () => {
    expect(inQuietPeriod("NVDA", "2026-11-12", 6, CALENDAR)).toBe(false);
  });
});

describe("the record store refuses a narrowing that would widen, whole", () => {
  const stated = (narrowings: Conviction["narrowings"]): Conviction => ({
    ...AI_DIP_2026_10,
    id: "wide-view",
    ...(narrowings ? { narrowings } : {}),
  });

  it("serves the AI-dip view with its narrowings", () => {
    const store = new ConvictionStore([AI_DIP_2026_10]);
    expect(store.refused).toEqual([]);
    expect(store.get("ai-dip-2026-10")?.narrowings?.map((n) => n.pair)).toEqual([
      "CRWV-WHEEL",
      "CRWV-LONG-CALL",
    ]);
  });

  it("refuses a record whose wheel window starts before the wheel's own", () => {
    const store = new ConvictionStore([
      stated([{ pair: "CRWV-WHEEL", fromClaims: ["2a"], narrow: [{ kind: "dte", min: 7 }] }]),
    ]);
    expect(store.all()).toEqual([]);
    expect(store.refused).toEqual([
      {
        id: "wide-view",
        problems: [
          "narrowing of CRWV-WHEEL: 7-45 days to expiry is wider than this playbook's 14-45",
        ],
      },
    ]);
  });

  it("refuses a narrowing of a pair the record does not steer, and one that cites no such claim", () => {
    const outside = new ConvictionStore([
      stated([{ pair: "S1-NVDA", fromClaims: ["5"], narrow: [{ kind: "contracts", max: 1 }] }]),
    ]);
    expect(outside.refused[0]?.problems).toContain("narrows S1-NVDA, which it does not steer");
    const uncited = new ConvictionStore([
      stated([{ pair: "CRWV-WHEEL", fromClaims: ["42"], narrow: [{ kind: "contracts", max: 1 }] }]),
    ]);
    expect(uncited.refused[0]?.problems).toEqual([
      "narrowing of CRWV-WHEEL cites claim 42, which is not here",
    ]);
  });
});

// ---------- the AI-dip view on a fixture chain ----------

const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
  {
    symbol: "CRWV",
    date: "2027-02-25",
    status: "estimate",
    source: "test",
    window: { start: "2027-02-18", end: "2027-03-05" },
  },
];
const book = (...positions: Position[]): Portfolio => aPortfolio({ cash: 100_000, positions });
const decideOf = (
  playbook: { decide?: NonNullable<typeof CRWV_WHEEL.decide> },
  context: MarketContext,
  portfolio: Portfolio,
  mode: PlaybookMode = "standard",
): readonly OrderIntent[] => playbook.decide?.(context, portfolio, CALENDAR, mode) ?? [];

describe("CRWV-LONG-CALL under the AI-dip view", () => {
  const OCT_16 = "2026-10-16T15:00:00Z";
  const NOV_12 = "2026-11-12T16:00:00Z";
  const NOV_25 = "2026-11-25T16:00:00Z";
  const FEB = "2027-02-19";
  const MAR = "2027-03-19";
  const APR = "2027-04-16";
  const occ = (strike: number, expiration: string) =>
    buildOccSymbol({ underlying: "CRWV", expiration, type: "call", strike });
  // CRWV at $62: the 60-strike call sits at the standard mode's 0.60 delta.
  const quotes = (asOf: string, expiration: string): OptionContractQuote[] =>
    [
      [50, 0.72, 20.1, 20.7],
      [55, 0.66, 17.6, 18.2],
      [60, 0.6, 15.4, 15.9],
      [70, 0.5, 11.8, 12.3],
    ].map(([strike, delta, bid, ask]) =>
      anOptionQuote(occ(strike as number, expiration), {
        bid: bid as number,
        ask: ask as number,
        delta: delta as number,
        openInterest: 500,
        at: asOf,
      }),
    );
  const market = (asOf: string, expiration: string, listed: readonly string[]) =>
    withOptionQuotes(aContext({ CRWV: { last: 62 } }, asOf), quotes(asOf, expiration), {
      CRWV: listed,
    });
  const steered = steeredBy(CRWV_LONG_CALL, aiDipSub("CRWV-LONG-CALL"));
  const narrowed = steered.playbook;

  it("is steered by the record, with each fence said", () => {
    expect(steered).toMatchObject({
      says: [
        "expiries on or after 2027-03-18",
        "no new opens from the print's blackout until 6 sessions after it",
      ],
    });
    expect(narrowed).not.toBe(CRWV_LONG_CALL);
    expect(narrowed.steerable).toBeUndefined();
  });

  it("buys no February expiry: with only a Feb expiry in the window it stands aside, where it bought", () => {
    const listed = ["2026-11-20", "2026-12-18", "2027-01-15", FEB];
    const context = market(OCT_16, FEB, listed);
    const base = decideOf(CRWV_LONG_CALL, context, book());
    expect(base[0]?.option?.legs[0]?.occSymbol).toBe(occ(60, FEB));
    expect(decideOf(narrowed, context, book())).toEqual([]);
    expect(
      narrowed.optionDemand?.(OCT_16, book(), { CRWV: listed }, CALENDAR, "standard").chains,
    ).toEqual([]);
    expect(
      CRWV_LONG_CALL.optionDemand?.(OCT_16, book(), { CRWV: listed }, CALENDAR, "standard").chains,
    ).toEqual([{ underlying: "CRWV", expiration: FEB, type: "call" }]);
  });

  it("buys exactly what it bought when the expiry it picks is already on or after 2027-03-18", () => {
    const listed = ["2026-11-20", FEB, MAR, APR];
    const context = market(OCT_16, APR, listed);
    expect(decideOf(narrowed, context, book())).toEqual(decideOf(CRWV_LONG_CALL, context, book()));
    expect(decideOf(narrowed, context, book())[0]?.option?.legs[0]?.occSymbol).toBe(occ(60, APR));
  });

  it("buys nothing from the blackout until 6 sessions after the print, then buys as before", () => {
    const listed = ["2026-11-20", MAR, APR];
    const inside = market(NOV_12, APR, listed);
    expect(decideOf(CRWV_LONG_CALL, inside, book())).toHaveLength(1);
    expect(decideOf(narrowed, inside, book())).toEqual([]);
    const after = market(NOV_25, APR, listed);
    expect(decideOf(narrowed, after, book())).toEqual(decideOf(CRWV_LONG_CALL, after, book()));
    expect(decideOf(narrowed, after, book())).toHaveLength(1);
  });

  it("does not add to a held contract during the quiet period, nor to one under the expiry floor", () => {
    const listed = ["2026-11-20", MAR, APR];
    const heldApr = { symbol: occ(60, APR), quantity: 2, avgPrice: 15.5 };
    const inside = market(NOV_12, APR, listed);
    expect(decideOf(CRWV_LONG_CALL, inside, book(heldApr))).toHaveLength(1);
    expect(decideOf(narrowed, inside, book(heldApr))).toEqual([]);
    const heldFeb = { symbol: occ(60, FEB), quantity: 2, avgPrice: 15.5 };
    const feb = market(OCT_16, FEB, listed);
    expect(decideOf(CRWV_LONG_CALL, feb, book(heldFeb))).toHaveLength(1);
    expect(decideOf(narrowed, feb, book(heldFeb))).toEqual([]);
  });

  it("still sells: a profit exit inside the quiet period, and a held February call at 45 days", () => {
    const listed = ["2026-11-20", MAR, APR];
    const doubled = { symbol: occ(60, APR), quantity: 3, avgPrice: 7.5 };
    const [close] = decideOf(narrowed, market(NOV_12, APR, listed), book(doubled));
    expect(close?.option).toMatchObject({
      effect: "close",
      legs: [{ occSymbol: occ(60, APR), side: "sell" }],
    });
    expect(close?.quantity).toBe(3);
    // 2027-01-05 is 45 days before the Feb 19 call: sold, though the conviction would not buy it.
    const late = "2027-01-05T16:00:00Z";
    const heldFeb = { symbol: occ(60, FEB), quantity: 2, avgPrice: 15.5 };
    const [time] = decideOf(narrowed, market(late, FEB, listed), book(heldFeb));
    expect(time?.option?.effect).toBe("close");
  });
});

describe("CRWV-WHEEL under the AI-dip view", () => {
  // Wed 2026-11-18, 11:00 ET: the first session after CRWV's blackout. Dec 31 is the latest listed
  // expiry 14-45 days out that ends before the February blackout.
  const NOV_18 = "2026-11-18T16:00:00Z";
  const OCT_16 = "2026-10-16T15:00:00Z";
  const DEC_31 = "2026-12-31";
  const LISTED = ["2026-11-20", "2026-12-18", DEC_31, "2027-01-15", "2027-02-19"];
  const occ = (type: "call" | "put", strike: number) =>
    buildOccSymbol({ underlying: "CRWV", expiration: DEC_31, type, strike });
  type Row = readonly [strike: number, delta: number, bid: number, ask: number];
  const quotes = (type: "call" | "put", rows: readonly Row[], asOf: string) =>
    rows.map(([strike, delta, bid, ask]) =>
      anOptionQuote(occ(type, strike), { bid, ask, delta, openInterest: 500, at: asOf }),
    );
  // CRWV at $64.72 (the study's close). The floor band median is about $53.67.
  const market = (puts: readonly Row[], calls: readonly Row[] = [], asOf = NOV_18) =>
    withOptionQuotes(
      aContext({ CRWV: { last: 64.72 } }, asOf),
      [...quotes("put", puts, asOf), ...quotes("call", calls, asOf)],
      { CRWV: LISTED },
    );
  const narrowed = steeredBy(CRWV_WHEEL, aiDipSub("CRWV-WHEEL")).playbook;
  const strikeOf = (intents: readonly OrderIntent[]) => intents[0]?.option?.legs[0]?.occSymbol;

  it("is steered by the record, naming the floor it read", () => {
    const result = steeredBy(CRWV_WHEEL, aiDipSub("CRWV-WHEEL"));
    expect(result).toMatchObject({
      says: [expect.stringMatching(/^strikes at or under \$53\.67 /)],
    });
  });

  it("sells the strike under the floor band where the wheel would sell one above it", () => {
    const puts: Row[] = [
      [50, -0.08, 0.5, 0.56],
      [52, -0.14, 0.9, 1.0],
      [55, -0.15, 1.15, 1.3],
    ];
    expect(strikeOf(decideOf(CRWV_WHEEL, market(puts), book()))).toBe(occ("put", 55));
    const [sale] = decideOf(narrowed, market(puts), book());
    expect(sale?.option?.legs[0]?.occSymbol).toBe(occ("put", 52));
    // Everything else about the sale is the wheel's: its contracts, its expiry, its structure.
    expect(sale?.option).toMatchObject({ effect: "open", structure: "cash-secured-put" });
    expect(sale?.quantity).toBe(6);
  });

  it("sells nothing that cycle when no strike sits both under the floor band and in the delta tolerance", () => {
    const puts: Row[] = [
      [55, -0.15, 1.15, 1.3],
      [58, -0.19, 1.8, 2.0],
    ];
    expect(decideOf(CRWV_WHEEL, market(puts), book())).toHaveLength(1);
    expect(decideOf(narrowed, market(puts), book())).toEqual([]);
  });

  it("still sells the covered call on assigned shares, struck as before", () => {
    const calls: Row[] = [[70, 0.25, 2.0, 2.2]];
    const shares: Position = { symbol: "CRWV", quantity: 100, avgPrice: 60 };
    const context = market([[52, -0.14, 0.9, 1.0]], calls);
    const base = decideOf(CRWV_WHEEL, context, book(shares));
    const under = decideOf(narrowed, context, book(shares));
    expect(base[0]?.option?.structure).toBe("covered-call");
    expect(under).toEqual(base);
  });

  it("opens nothing the wheel's own window does not: the conviction places no order by itself", () => {
    // 2026-10-16 is inside the print window's run-up: the wheel is dark, and so is the steered one.
    const dark = market([[52, -0.14, 0.9, 1.0]], [], OCT_16);
    expect(decideOf(CRWV_WHEEL, dark, book())).toEqual([]);
    expect(decideOf(narrowed, dark, book())).toEqual([]);
    for (const day of ["2026-10-16", "2026-11-12", "2026-11-18", "2026-12-20"]) {
      expect(narrowed.desiredState(`${day}T16:00:00Z`, CALENDAR)).toBe(
        CRWV_WHEEL.desiredState(`${day}T16:00:00Z`, CALENDAR),
      );
    }
  });
});

describe("a subscription runs the playbook its conviction narrows", () => {
  it("narrows the subscription that points at the record, and only that one", () => {
    const roster = subscriptionRoster([
      aiDipSub("CRWV-WHEEL"),
      aiDipSub("CRWV-LONG-CALL"),
      aSubscription("acct-other", "CRWV-WHEEL"),
    ]);
    expect(roster.steeringRefused).toEqual([]);
    expect(roster.steered).toEqual([
      expect.stringMatching(/^CRWV-WHEEL: strikes at or under \$53\.67/),
      "CRWV-LONG-CALL: expiries on or after 2027-03-18; no new opens from the print's blackout until 6 sessions after it",
    ]);
    const [wheelSub, callSub, otherSub] = roster.enabled;
    expect(wheelSub?.playbook).not.toBe(CRWV_WHEEL);
    expect(callSub?.playbook).not.toBe(CRWV_LONG_CALL);
    // Another member's subscription to the same house pair is not steered by Eric's view.
    expect(otherSub?.playbook).toBe(CRWV_WHEEL);
  });

  it("runs a pair exits-only while its pointer names a record these bots do not hold (#5482 slice 6c)", () => {
    // A member's record arrives over the poll, and a pointer at one can be read before it is: its
    // narrowings are unknown, so the pair opens nothing rather than trade wider than its owner set.
    const sub = aSubscription(ACCOUNT, "CRWV-WHEEL", { convictionId: "nope" });
    const reason = 'points at conviction "nope", which these bots do not hold';
    expect(steeredBy(CRWV_WHEEL, sub)).toEqual({ playbook: CRWV_WHEEL, refused: reason });
    const roster = subscriptionRoster([sub]);
    expect(roster.enabled).toEqual([{ playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true }]);
    expect(roster.steeringRefused).toEqual([`CRWV-WHEEL: ${reason}`]);
  });

  it("runs a pair exits-only while its pointer names a record that does not steer it (#5482 contract piece 2)", () => {
    // A pointed pair never reads its inline conviction, so an unusable pointer leaves it no check
    // day; trading it unnarrowed and unchecked is the one state no owner chose.
    const lookup = () => ({ ...AI_DIP_2026_10, steers: ["CRWV-LONG-CALL"] });
    const reason = 'points at conviction "ai-dip-2026-10", which does not steer CRWV-WHEEL';
    expect(steeredBy(CRWV_WHEEL, aiDipSub("CRWV-WHEEL"), lookup)).toEqual({
      playbook: CRWV_WHEEL,
      refused: reason,
    });
    const roster = subscriptionRoster([aiDipSub("CRWV-WHEEL")], undefined, lookup);
    expect(roster.enabled).toEqual([{ playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true }]);
    expect(roster.steeringRefused).toEqual([`CRWV-WHEEL: ${reason}`]);
  });

  it("refuses a widening whole and runs the pair exits-only, saying why", () => {
    const widening: Conviction = {
      ...AI_DIP_2026_10,
      narrowings: [
        {
          pair: "CRWV-WHEEL",
          fromClaims: ["2a"],
          narrow: [
            { kind: "strike-ceiling", ceiling: 50 },
            { kind: "dte", min: 7 },
          ],
        },
      ],
    };
    const reason =
      'conviction "ai-dip-2026-10" is refused whole: 7-45 days to expiry is wider than this playbook\'s 14-45';
    const result = steeredBy(CRWV_WHEEL, aiDipSub("CRWV-WHEEL"), () => widening);
    expect(result).toEqual({ playbook: CRWV_WHEEL, refused: reason });
    // The roster fails safe: the pair stays on it, exits only, and the reason is reported.
    const roster = subscriptionRoster([aiDipSub("CRWV-WHEEL")], undefined, () => widening);
    expect(roster.enabled).toEqual([{ playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true }]);
    expect(roster.steeringRefused).toEqual([`CRWV-WHEEL: ${reason}`]);
    expect(roster.steered).toEqual([]);
  });
});
