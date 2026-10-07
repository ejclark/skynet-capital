import { rstest } from "@rstest/core";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OptionContractQuote } from "../../src/domain/types.js";
import type { OptionMarketPort } from "../../src/ports/option-market.js";
import {
  type LiveNeedsReads,
  liveNeeds,
  liveNeedsRefusal,
} from "../../src/subscriptions/subscribe-live-needs.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { anOptionQuote } from "../support/builders.js";

/**
 * What a NEW subscription needs from the live market and the account (#4469 slice 3a part 2,
 * criterion 9): a price on the feed, the options level, and — in session — a liquid chain and one
 * contract's cash inside the budget. Judged by the playbook's own demand and `decide`, so the wheel
 * here is the real CRWV wheel on the same fixtures its own spec trades against.
 */

// Wed 2026-11-18, 11:00 ET: the first session after CRWV's November blackout (the wheel's spec).
const NOV_18 = "2026-11-18T16:00:00Z";
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
const LISTED = ["2026-11-20", "2026-12-04", "2026-12-18", "2026-12-31", "2027-01-15", "2027-02-19"];
const DEC_31 = "2026-12-31";

// CRWV at $92: the Δ0.21 put is the $80 strike, so one contract ties up $8,000.
const PUTS: readonly (readonly [number, number, number, number])[] = [
  [70, -0.1, 1.1, 1.25],
  [75, -0.15, 1.65, 1.85],
  [80, -0.21, 2.2, 2.4],
  [85, -0.28, 3.3, 3.5],
  [90, -0.41, 4.8, 5.1],
];
const puts = (width = 0): OptionContractQuote[] =>
  PUTS.map(([strike, delta, bid, ask]) =>
    anOptionQuote(buildOccSymbol({ underlying: "CRWV", expiration: DEC_31, type: "put", strike }), {
      bid,
      ask: ask + width,
      delta,
      openInterest: 500,
      at: NOV_18,
    }),
  );

/** The bots' option port over a fixed chain: answers whatever chains the playbook's demand names. */
const portOver = (quotes: readonly OptionContractQuote[]): OptionMarketPort => ({
  readOptionMarket: (request) => {
    const listed = { CRWV: LISTED };
    const wanted = new Set(request.demand(listed).chains.map((c) => `${c.expiration}|${c.type}`));
    return Promise.resolve({
      listed,
      contracts: Object.fromEntries(
        quotes.filter((q) => wanted.has(`${q.expiration}|${q.type}`)).map((q) => [q.occSymbol, q]),
      ),
    });
  },
});

const wheelInput = {
  playbookId: "CRWV-WHEEL",
  mode: "standard" as const,
  capitalAllocated: 75_000,
  asOfIso: NOV_18,
  calendar: CALENDAR,
  sessionOpen: true,
};

const feed =
  (price: number | undefined): LiveNeedsReads["price"] =>
  async () =>
    price;
const healthy = (): LiveNeedsReads => ({
  price: feed(92),
  optionsLevel: async () => 1,
  optionMarket: portOver(puts()),
});

describe("a new subscription takes what the live market and the account say", () => {
  it("takes the wheel on CRWV with a price, the level, a liquid chain and the cash", async () => {
    expect(await liveNeedsRefusal(wheelInput, healthy())).toBeUndefined();
  });

  it("refuses a ticker the feed has no price for, in words, and never reads further", async () => {
    const optionsLevel = rstest.fn(async () => 1);
    expect(
      await liveNeedsRefusal(wheelInput, { ...healthy(), price: feed(undefined), optionsLevel }),
    ).toBe(
      "The market-data feed gave no price for CRWV just now, so the wheel on CRWV can't be taken yet. Try again in a minute.",
    );
    expect(optionsLevel).not.toHaveBeenCalled();
  });

  it("refuses an account below the options level the playbook's opens need", async () => {
    expect(await liveNeedsRefusal(wheelInput, { ...healthy(), optionsLevel: async () => 0 })).toBe(
      "The wheel on CRWV needs options level 1 on this account, and it is at level 0.",
    );
    expect(
      await liveNeedsRefusal(
        { ...wheelInput, playbookId: "NVDA-CALL-SPREAD" },
        { ...healthy(), optionsLevel: async () => 1 },
      ),
    ).toBe("The call spread on NVDA needs options level 3 on this account, and it is at level 1.");
  });

  it("skips a check whose read could not be made — unknown is never a refusal", async () => {
    expect(
      await liveNeedsRefusal(wheelInput, { ...healthy(), optionsLevel: async () => undefined }),
    ).toBeUndefined();
    expect(await liveNeedsRefusal(wheelInput, {})).toBeUndefined();
  });

  it("refuses a chain with no liquid contract in session", async () => {
    // A $2 wider ask on every strike puts each spread well past the house's 15% of mid.
    const wide = { ...healthy(), optionMarket: portOver(puts(2)) };
    expect(await liveNeedsRefusal(wheelInput, wide)).toBe(
      "The wheel on CRWV can't be taken yet: CRWV's options have no liquid contract right now (a real bid, a tight spread, a fresh quote).",
    );
  });

  it("refuses a budget under one contract's cash, naming both numbers", async () => {
    expect(await liveNeedsRefusal({ ...wheelInput, capitalAllocated: 5_000 }, healthy())).toBe(
      "One contract of the wheel on CRWV ties up about $8,000 right now, and the budget is $5,000. Raise the budget to at least that.",
    );
    expect(
      await liveNeedsRefusal({ ...wheelInput, capitalAllocated: 8_000 }, healthy()),
    ).toBeUndefined();
  });

  it("does not judge the chain or the cash outside the regular session", async () => {
    const closed = { ...wheelInput, sessionOpen: false, capitalAllocated: 1_000 };
    expect(
      await liveNeedsRefusal(closed, { ...healthy(), optionMarket: portOver(puts(2)) }),
    ).toBeUndefined();
  });

  it("does not judge a chain the playbook would not read now (a blackout, a window not open)", async () => {
    const read = rstest.fn(portOver(puts(2)).readOptionMarket);
    const noPrintInReach = { ...wheelInput, calendar: [] };
    expect(
      await liveNeedsRefusal(noPrintInReach, {
        ...healthy(),
        optionMarket: { readOptionMarket: read },
      }),
    ).toBeUndefined();
    expect(read).toHaveBeenCalled();
  });

  it("asks a share pair for a price only, and a basket for nothing", async () => {
    const optionMarket = { readOptionMarket: rstest.fn() };
    const price = rstest.fn(feed(180));
    expect(
      await liveNeedsRefusal(
        { ...wheelInput, playbookId: "S1-NVDA" },
        { price, optionsLevel: async () => 0, optionMarket },
      ),
    ).toBeUndefined();
    expect(price).toHaveBeenCalledWith("NVDA");
    expect(optionMarket.readOptionMarket).not.toHaveBeenCalled();

    const basketPrice = rstest.fn(feed(undefined));
    expect(
      await liveNeedsRefusal({ ...wheelInput, playbookId: "HC-SAURON" }, { price: basketPrice }),
    ).toBeUndefined();
    expect(basketPrice).not.toHaveBeenCalled();
  });

  it("leaves an id nothing resolves to the eligibility check", async () => {
    expect(
      await liveNeedsRefusal({ ...wheelInput, playbookId: "NOPE-1" }, healthy()),
    ).toBeUndefined();
  });
});

describe("the preflight reports what a contract ties up, not only whether it is refused", () => {
  it("gives one contract's cash for a budget that fits, so the Store can state the idle share", async () => {
    expect(await liveNeeds(wheelInput, healthy())).toEqual({ oneContractCash: 8_000 });
  });

  it("gives the cash beside the refusal when the budget falls short", async () => {
    const verdict = await liveNeeds({ ...wheelInput, capitalAllocated: 5_000 }, healthy());
    expect(verdict.oneContractCash).toBe(8_000);
    expect(verdict.refusal).toMatch(/ties up about \$8,000/);
  });

  it("gives no cash when no chain was judged (outside the session, or a share pair)", async () => {
    expect(await liveNeeds({ ...wheelInput, sessionOpen: false }, healthy())).toEqual({});
    expect(await liveNeeds({ ...wheelInput, playbookId: "S1-NVDA" }, healthy())).toEqual({});
  });
});
