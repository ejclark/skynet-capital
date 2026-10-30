import type { Bot } from "../../src/bots/bot.js";
import type { DailyHighReading } from "../../src/domain/daily-high.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
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
import { leapTrimTag } from "../../src/playbooks/long-leap.js";
import { longLeapExit } from "../../src/playbooks/long-leap-rules.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import type { PlaybookReads } from "../../src/playbooks/playbook.js";
import { findPlaybook, NVDA_LONG_LEAP } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { pairView } from "../../src/subscriptions/pair-conviction.js";
import { newSubscriptionRefusal } from "../../src/subscriptions/subscribe-eligibility.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

/**
 * #6340 slice 1 — the long LEAP on NVDA. The first five EARS lines of the plan, one block each:
 * the buy on a 15% pullback, never under 365 days, half at double once, all out at 180 days, and
 * nothing placed until an owner subscribes.
 */

// NVDA's November print as filed: blackout Nov 17 through the session after the window.
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-17", end: "2026-11-25" },
  },
];

// Fri 2026-10-30, 11:00 ET. Jun 16 2028 is 595 days out, the latest listed inside 365–760;
// Dec 15 2028 (777) is past it and Sep 17 2027 (322) short of it.
const OCT_30 = "2026-10-30T15:00:00Z";
const JUN_28 = "2028-06-16";
const LISTED = ["2027-04-16", "2027-09-17", "2027-12-17", JUN_28, "2028-12-15"];
const occ = (strike: number, expiration = JUN_28) =>
  buildOccSymbol({ underlying: "NVDA", expiration, type: "call", strike });

type Row = readonly [strike: number, delta: number, bid: number, ask: number];
// NVDA at $200.
const CALLS: readonly Row[] = [
  [140, 0.8, 80, 81],
  [160, 0.71, 66, 67],
  [200, 0.6, 44, 45],
  [240, 0.48, 28, 29],
];
const chain = (asOf: string, rows: readonly Row[] = CALLS, expiration = JUN_28) =>
  rows.map(([strike, delta, bid, ask]) =>
    anOptionQuote(occ(strike, expiration), { bid, ask, delta, openInterest: 500, at: asOf }),
  );

function market(
  asOf = OCT_30,
  quotes: readonly OptionContractQuote[] = chain(asOf),
  listed: readonly string[] = LISTED,
): MarketContext {
  return withOptionQuotes(aContext({ NVDA: { last: 200 } }, asOf), quotes, { NVDA: listed });
}

// Thursday's close, 16.7% under the year's $240 high.
const DIPPED: DailyHighReading = { session: "2026-10-29", close: 200, high: 240 };
const reads = (
  reading: DailyHighReading = DIPPED,
  trimmed: readonly string[] = [],
): PlaybookReads => ({
  dailyHigh: (symbol) => (symbol === "NVDA" ? reading : undefined),
  placedUnder: (playbookId, strategy) =>
    playbookId === "NVDA-LONG-LEAP" && strategy === leapTrimTag("NVDA")
      ? new Set(trimmed)
      : new Set(),
});

const book = (...positions: Position[]): Portfolio => aPortfolio({ cash: 100_000, positions });
const held = (
  strike: number,
  quantity: number,
  avgPrice: number,
  expiration = JUN_28,
): Position => ({
  symbol: occ(strike, expiration),
  quantity,
  avgPrice,
});
const decide = (
  context: MarketContext,
  portfolio: Portfolio = book(),
  playbookReads: PlaybookReads | undefined = reads(),
  mode: PlaybookMode = "standard",
): readonly OrderIntent[] =>
  NVDA_LONG_LEAP.decide?.(context, portfolio, CALENDAR, mode, playbookReads) ?? [];

describe("NVDA-LONG-LEAP — registered as a conviction pair, its own template", () => {
  it("resolves by id as a ◆ conviction on the long-leap strategy, checked at the study's date", () => {
    const pair = findPair("NVDA-LONG-LEAP");
    expect(pair?.strategy).toBe("long-leap");
    expect(pair?.evidence.status).toBe("conviction");
    expect(pair?.evidence.checkOn).toBe("2028-01-31");
    expect(pair?.evidence.study).toBe("docs/research/long-leap-dip-2026-10.md");
    expect(findPlaybook("NVDA-LONG-LEAP")).toBe(NVDA_LONG_LEAP);
    expect(NVDA_LONG_LEAP.options).toEqual({
      underlyings: ["NVDA"],
      holdsShortToExpiry: [],
      requiredLevel: 2,
    });
  });

  it("refuses a second option playbook on NVDA: the call spread and the LEAP never share a bot", () => {
    const spread = { playbookId: "NVDA-CALL-SPREAD", enabled: true };
    expect(
      newSubscriptionRefusal({
        playbookId: "NVDA-LONG-LEAP",
        subscriptions: [spread],
        asOfIso: OCT_30,
        conviction: true,
      }),
    ).toBe(
      "The call spread already trades NVDA options on this bot; a bot runs one option playbook per symbol.",
    );
  });
});

describe("WHEN NVDA closes 15% or more under its 252-session high, it buys a LEAP", () => {
  it("asks for a third of its cap on the latest expiry 365–760 days out, nearest the mode's delta", () => {
    const [intent, ...rest] = decide(market());
    expect(rest).toEqual([]);
    expect(intent?.option).toMatchObject({
      effect: "open",
      structure: "long-call",
      legs: [{ occSymbol: occ(160), side: "buy" }],
    });
    expect(intent?.quantity).toBe(10);
    expect(intent?.strategy).toBe("nvda-long-leap");
    expect(intent?.reason).toMatch(/17% under its \$240\.00 high of the past year/);
    expect(optionOrderProblems(intent as OrderIntent)).toEqual([]);
  });

  it("aims at 0.80 delta conservative and 0.60 aggressive", () => {
    const leg = (mode: PlaybookMode) =>
      decide(market(), book(), reads(), mode)[0]?.option?.legs[0]?.occSymbol;
    expect(leg("conservative")).toBe(occ(140));
    expect(leg("aggressive")).toBe(occ(200));
  });

  it("fires at exactly 15% under, and not at 14%", () => {
    expect(decide(market(), book(), reads({ ...DIPPED, close: 204 }))).toHaveLength(1);
    expect(decide(market(), book(), reads({ ...DIPPED, close: 206 }))).toEqual([]);
  });

  it("buys nothing with no daily reading, or one more than two sessions old", () => {
    expect(decide(market(), book(), { dailyHigh: () => undefined })).toEqual([]);
    expect(decide(market(), book(), {})).toEqual([]);
    expect(decide(market(), book(), reads({ ...DIPPED, session: "2026-10-22" }))).toEqual([]);
  });

  it("buys nothing inside NVDA's print blackout", () => {
    const nov18 = "2026-11-18T15:00:00Z";
    const reading = { ...DIPPED, session: "2026-11-17" };
    expect(decide(market(nov18, chain(nov18)), book(), reads(reading))).toEqual([]);
  });

  it("buys nothing inside a conviction's quiet period after the print", () => {
    const quiet = NVDA_LONG_LEAP.steerable?.steer({ quietSessionsAfterPrint: 5 });
    // Dec 1 is past the blackout (through Nov 27) and inside five sessions after the Nov 25 window.
    const dec1 = "2026-12-01T15:00:00Z";
    const reading = { ...DIPPED, session: "2026-11-30" };
    // Dec 15 2028 comes inside the window by Dec 1; leave it unlisted so June stays the pick.
    const context = market(
      dec1,
      chain(dec1),
      LISTED.filter((e) => e !== "2028-12-15"),
    );
    expect(quiet?.decide?.(context, book(), CALENDAR, "standard", reads(reading))).toEqual([]);
    expect(decide(context, book(), reads(reading))).toHaveLength(1);
  });

  it("asks for the entry chain only while the dip holds, and always for what it holds", () => {
    const demand = (portfolio: Portfolio, r: PlaybookReads) =>
      NVDA_LONG_LEAP.optionDemand?.(OCT_30, portfolio, { NVDA: LISTED }, CALENDAR, "standard", r);
    expect(demand(book(), reads())).toEqual({
      chains: [{ underlying: "NVDA", expiration: JUN_28, type: "call" }],
      contracts: [],
    });
    expect(demand(book(), reads({ ...DIPPED, close: 230 }))).toEqual({ chains: [], contracts: [] });
    expect(demand(book(held(160, 2, 66)), reads({ ...DIPPED, close: 230 }))?.contracts).toEqual([
      occ(160),
    ]);
  });

  it("adds the same contract while the dip holds and its ask is within 10% of the cost", () => {
    const [add] = decide(market(), book(held(160, 2, 66)));
    expect(add?.option?.legs[0]?.occSymbol).toBe(occ(160));
    expect(decide(market(), book(held(160, 2, 58)))).toEqual([]);
  });
});

describe("it SHALL NOT buy a call with under 365 days to expiry", () => {
  it("buys nothing when no listed expiry is 365 days out or more", () => {
    const short = market(OCT_30, chain(OCT_30, CALLS, "2027-09-17"), ["2027-04-16", "2027-09-17"]);
    expect(decide(short)).toEqual([]);
  });

  it("adds nothing to a held call once it is under 365 days", () => {
    const sep = "2027-09-17";
    const context = market(OCT_30, chain(OCT_30, CALLS, sep));
    expect(decide(context, book(held(160, 2, 66, sep)))).toEqual([]);
  });
});

describe("WHEN a held contract's bid first reaches double its cost, it sells half", () => {
  it("sells half, rounded up, tagged so it is remembered", () => {
    const [trim, ...rest] = decide(market(), book(held(160, 5, 33)));
    expect(rest).toEqual([]);
    expect(trim?.option).toMatchObject({
      effect: "close",
      legs: [{ occSymbol: occ(160), side: "sell" }],
    });
    expect(trim?.quantity).toBe(3);
    expect(trim?.strategy).toBe("nvda-long-leap-trim");
    expect(trim?.reason).toMatch(/double/);
    expect(trim?.reason).toMatch(/other 2 are held until 180 days are left/);
  });

  it("sells no more once that contract was trimmed: the rest runs", () => {
    expect(decide(market(), book(held(160, 3, 33)), reads(DIPPED, [occ(160)]))).toEqual([]);
  });

  it("neither trims nor adds when its memory cannot be read", () => {
    const blind: PlaybookReads = { dailyHigh: () => DIPPED };
    expect(decide(market(), book(held(160, 4, 33)), blind)).toEqual([]);
    expect(decide(market(), book(held(160, 2, 66)), blind)).toEqual([]);
  });

  it("sells a lone contract whole at double", () => {
    const [trim] = decide(market(), book(held(160, 1, 33)));
    expect(trim?.quantity).toBe(1);
    expect(trim?.reason).toMatch(/^Selling the NVDA .* call: it is worth/);
  });

  it("adds nothing to a contract it already trimmed", () => {
    expect(decide(market(), book(held(160, 2, 66)), reads(DIPPED, [occ(160)]))).toEqual([]);
  });

  it("reads the rule the same way everywhere: unknown memory never trims", () => {
    expect(longLeapExit({ dte: 400, paid: 10, bid: 20, trimmed: false })).toBe("trim");
    expect(longLeapExit({ dte: 400, paid: 10, bid: 20, trimmed: true })).toBeUndefined();
    expect(longLeapExit({ dte: 400, paid: 10, bid: 20 })).toBeUndefined();
    expect(longLeapExit({ dte: 400, paid: 10, bid: 19.99, trimmed: false })).toBeUndefined();
  });
});

describe("WHEN a held contract has 180 days or fewer left, it sells all of it", () => {
  // Apr 16 2027 is 168 days after Oct 30.
  const apr = "2027-04-16";

  it("sells everything, whatever the price", () => {
    const context = market(OCT_30, chain(OCT_30, CALLS, apr));
    const [close] = decide(context, book(held(160, 3, 66, apr)));
    expect(close?.option?.effect).toBe("close");
    expect(close?.quantity).toBe(3);
    expect(close?.strategy).toBe("nvda-long-leap-close");
    expect(close?.reason).toMatch(/180 days/);
  });

  it("buys nothing while a time exit is due, even with no quote for the held call", () => {
    expect(decide(market(), book(held(160, 3, 66, apr)))).toEqual([]);
  });

  it("wins over a trim on the same contract", () => {
    expect(longLeapExit({ dte: 180, paid: 10, bid: 30, trimmed: false })).toBe("time");
  });
});

describe("WHILE no owner has subscribed, the pair places nothing", () => {
  const quiet: Persona = { id: "sauron", name: "Sauron", thesis: "test", decide: () => [] };
  const bot: Bot = { persona: quiet, credentials: { apiKey: "k", apiSecret: "s" } };
  const own = pairView({
    accountId: "sauron",
    playbookId: "NVDA-LONG-LEAP",
    conviction: { reason: "NVDA's growth carries a two-year call", checkOn: "2028-01-31" },
    owner: "Sauron",
    statedOn: "2026-10-30",
  });
  const sub: PlaybookSubscription = {
    accountId: "sauron",
    playbookId: "NVDA-LONG-LEAP",
    mode: "standard",
    capitalAllocated: 20_000,
    enabled: true,
    convictionId: own.id,
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  };
  const trade = (subscriptions: readonly PlaybookSubscription[]) => {
    const risk = { ...DEFAULT_RISK_CONFIG, discipline: { calendar: CALENDAR }, optionsLevel: 2 };
    const lookup = (id: string) => (id === own.id ? own : undefined);
    const trading = tradingRoster(
      resolveBotRoster(bot, [], subscriptions, undefined, lookup),
      risk,
      undefined,
      { reads: reads() },
    );
    const context = market();
    const raw = trading.persona.decide(context, book());
    return { raw, ...applyGuardsWithVerdicts(raw, book(), context, trading.risk) };
  };

  it("places nothing on a bot with no subscription to it, dip or not", () => {
    expect(trade([]).raw).toEqual([]);
  });

  it("buys once subscribed, the tranche cut to what the budget pays for", () => {
    // About $6,650 a contract: $20,000 pays for 3.
    expect(trade([sub]).approved).toEqual([
      expect.objectContaining({ playbookId: "NVDA-LONG-LEAP", quantity: 3 }),
    ]);
  });
});
