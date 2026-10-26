import { bookNeeds, type CoverLeg, orderLegs } from "../../src/domain/option-book.js";
import type {
  MarketContext,
  OptionOrderIntent,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import {
  claim,
  closableContracts,
  committedToPlaybook,
  type GuardLedger,
  type OpenBuy,
  openBuysSpend,
  openLedger,
  soldShares,
  spendableCash,
  subscriptionTerms,
  unspentCash,
  worsens,
} from "../../src/engine/guard-batch.js";
import {
  anOptionIntent,
  aPortfolio,
  aPosition,
  aQuote,
  aSubscription,
} from "../support/builders.js";

// The batch ledger's own arithmetic (`engine/guard-batch.ts`), read straight off its exports. The
// guard-level story — a put and a share buy in one cycle — lives in `guard-ledger.spec.ts`; this
// file pins the pieces that story is built from: what an open buy is priced at, when the ledger goes
// live, what a claim records, and how a change is judged against what came before it.
const PUT = "CRWV261106P00085000"; // a sold one needs $8,500 of cash set aside
const CALL = "CRWV261106C00100000"; // a sold, uncapped one holds back 100 shares

const sellPut = anOptionIntent();
const putOption = sellPut.option as OptionOrderIntent;
const buyBackPut = anOptionIntent({
  side: "buy",
  option: {
    effect: "close",
    structure: "close",
    legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
    limitPrice: 2.1,
  },
});
const buyBackOption = buyBackPut.option as OptionOrderIntent;

const heldShortPut = (cash: number): Portfolio =>
  aPortfolio({ cash, positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })] });

/** A fresh ledger over `portfolio`, live for option arithmetic (it carries an option intent). */
const liveLedger = (portfolio: Portfolio): GuardLedger =>
  openLedger([sellPut], bookNeeds(portfolio), portfolio);

const putLegs = (units: number): CoverLeg[] => orderLegs(putOption, units);

describe("openBuysSpend — what buys still open at the broker will pay", () => {
  const portfolio = aPortfolio({ cash: 10_000 });
  const context = (asks: Record<string, number>): MarketContext => ({
    asOf: "2026-10-07T15:00:00Z",
    quotes: Object.fromEntries(
      Object.entries(asks).map(([symbol, ask]) => [symbol, aQuote({ symbol, last: ask, ask })]),
    ),
  });
  const buy = (overrides: Partial<OpenBuy> = {}): OpenBuy => ({
    symbol: "NVDA",
    quantity: 10,
    ...overrides,
  });

  describe("when there are no open buys", () => {
    it("spends nothing", () => {
      expect(openBuysSpend([], portfolio, context({}))).toBe(0);
    });
  });

  describe("when a buy carries a limit price", () => {
    it("pays quantity times that limit, whatever the quote says", () => {
      const spend = openBuysSpend([buy({ limitPrice: 95 })], portfolio, context({ NVDA: 120 }));
      expect(spend).toBe(950);
    });
  });

  describe("when a buy has no limit", () => {
    it("is priced at the freshest ask the cycle holds", () => {
      expect(openBuysSpend([buy()], portfolio, context({ NVDA: 120 }))).toBe(1_200);
    });

    it("falls to the holding's per-share mark when there is no ask: market value over quantity", () => {
      const held = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 80, marketValue: 6_000 })],
      });
      // $6,000 / 50 shares = $120 a share, not the $80 cost.
      expect(openBuysSpend([buy()], held, context({}))).toBe(1_200);
    });

    it("falls to the holding's cost when the broker gave no market value", () => {
      const held = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 80 })],
      });
      expect(openBuysSpend([buy()], held, context({}))).toBe(800);
    });

    it("treats a zero ask as a data gap and uses the holding's mark instead of pricing at $0", () => {
      const held = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 80 })],
      });
      expect(openBuysSpend([buy()], held, context({ NVDA: 0 }))).toBe(800);
    });
  });

  describe("when a buy cannot be priced at all", () => {
    it("holds every dollar of cash: what it will spend is unknown", () => {
      expect(openBuysSpend([buy()], portfolio, context({}))).toBe(10_000);
    });

    it("holds every dollar even when earlier buys in the list were priced", () => {
      const spend = openBuysSpend(
        [buy({ symbol: "AAPL", limitPrice: 10 }), buy()],
        portfolio,
        context({}),
      );
      expect(spend).toBe(10_000);
    });

    it("never goes below zero when the account is overdrawn", () => {
      const overdrawn = aPortfolio({ cash: -500 });
      expect(openBuysSpend([buy()], overdrawn, context({}))).toBe(0);
    });

    it("does not count a mark of zero as a price", () => {
      const held = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA", quantity: 50, avgPrice: 0 })],
      });
      expect(openBuysSpend([buy()], held, context({}))).toBe(10_000);
    });

    it("does not read a short or empty holding as a mark", () => {
      const short = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA", quantity: -5, avgPrice: 80 })],
      });
      expect(openBuysSpend([buy()], short, context({}))).toBe(10_000);
    });
  });

  describe("when several buys are open", () => {
    it("adds them up, each at its own price", () => {
      const spend = openBuysSpend(
        [buy({ limitPrice: 100 }), buy({ symbol: "AAPL", quantity: 5 })],
        portfolio,
        context({ AAPL: 200 }),
      );
      expect(spend).toBe(1_000 + 1_000);
    });

    it("ignores a buy with nothing left to fill — even one that cannot be priced", () => {
      const spend = openBuysSpend(
        [buy({ quantity: 0 }), buy({ quantity: -3 }), buy({ limitPrice: 10 })],
        portfolio,
        context({}),
      );
      expect(spend).toBe(100);
    });
  });
});

describe("openLedger — when the batch ledger goes live", () => {
  const noShorts = aPortfolio({ cash: 10_000, positions: [aPosition({ symbol: "NVDA" })] });
  const shareBuy: OrderIntent = {
    symbol: "NVDA",
    side: "buy",
    quantity: 5,
    type: "market",
    reason: "test",
  };

  it("stays inactive for a share-only batch over a book with no shorts", () => {
    expect(openLedger([shareBuy], bookNeeds(noShorts), noShorts).active).toBe(false);
  });

  it("goes active when the batch carries an option order", () => {
    expect(openLedger([shareBuy, sellPut], bookNeeds(noShorts), noShorts).active).toBe(true);
  });

  it("goes active when the book already holds a short put that has cash set aside", () => {
    const book = heldShortPut(10_000);
    expect(openLedger([shareBuy], bookNeeds(book), book).active).toBe(true);
  });

  it("goes active when the book already holds a sold call that promises shares", () => {
    const book = aPortfolio({
      cash: 10_000,
      positions: [
        aPosition({ symbol: "CRWV", quantity: 100 }),
        aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
      ],
    });
    expect(openLedger([shareBuy], bookNeeds(book), book).active).toBe(true);
  });

  it("starts with nothing approved and carries the starting book's contracts", () => {
    const book = heldShortPut(10_000);
    const ledger = openLedger([], bookNeeds(book), book);
    expect(ledger.orders).toEqual([]);
    expect(ledger.byPlaybook.size).toBe(0);
    expect(ledger.held).toEqual([
      { underlying: "CRWV", type: "put", strike: 85, expiration: "2026-11-06", contracts: -1 },
    ]);
  });

  it("counts what open buys will pay as already spent, and open sells as already sold", () => {
    const ledger = openLedger(
      [shareBuy],
      bookNeeds(noShorts),
      noShorts,
      new Map([["NVDA", 40]]),
      1_500,
    );
    expect(unspentCash(noShorts, ledger)).toBe(8_500);
    expect(soldShares(ledger, "NVDA")).toBe(40);
  });

  it("does not let a later claim write back into the caller's open-sells map", () => {
    const openSells = new Map([["NVDA", 40]]);
    const ledger = openLedger([shareBuy], bookNeeds(noShorts), noShorts, openSells);
    claim(ledger, { sold: { underlying: "NVDA", shares: 10 } });
    expect(soldShares(ledger, "NVDA")).toBe(50);
    expect(openSells.get("NVDA")).toBe(40);
  });
});

describe("claim — what an approved intent takes out of the batch", () => {
  const book = aPortfolio({ cash: 10_000 });
  const fresh = (): GuardLedger => openLedger([], bookNeeds(book), book);

  it("a share buy's dollars come out of the unspent cash, and add up across buys", () => {
    const ledger = fresh();
    claim(ledger, { spent: 1_200 });
    claim(ledger, { spent: 300 });
    expect(unspentCash(book, ledger)).toBe(8_500);
  });

  it("a negative or absent spend never hands cash back", () => {
    const ledger = fresh();
    claim(ledger, { spent: -900 });
    claim(ledger, {});
    expect(unspentCash(book, ledger)).toBe(10_000);
  });

  it("share sells add up per underlying, and other tickers are untouched", () => {
    const ledger = fresh();
    claim(ledger, { sold: { underlying: "NVDA", shares: 30 } });
    claim(ledger, { sold: { underlying: "NVDA", shares: 20 } });
    expect(soldShares(ledger, "NVDA")).toBe(50);
    expect(soldShares(ledger, "AAPL")).toBe(0);
  });

  it("a sell of zero shares records nothing", () => {
    const ledger = fresh();
    claim(ledger, { sold: { underlying: "NVDA", shares: 0 } });
    expect(ledger.sold.has("NVDA")).toBe(false);
  });

  it("a playbook's risk adds up against that playbook alone", () => {
    const ledger = fresh();
    claim(ledger, { playbookId: "CRWV-WHEEL", risk: 8_500 });
    claim(ledger, { playbookId: "CRWV-WHEEL", risk: 1_000 });
    claim(ledger, { playbookId: "OTHER", risk: 50 });
    expect([...ledger.byPlaybook]).toEqual([
      ["CRWV-WHEEL", 9_500],
      ["OTHER", 50],
    ]);
  });

  it("records no risk for a zero or negative risk, or one with no playbook to charge it to", () => {
    const ledger = fresh();
    claim(ledger, { playbookId: "CRWV-WHEEL", risk: 0 });
    claim(ledger, { playbookId: "CRWV-WHEEL", risk: -100 });
    claim(ledger, { risk: 500 });
    expect(ledger.byPlaybook.size).toBe(0);
  });

  it("keeps an approved option order whole, per underlying", () => {
    const ledger = fresh();
    claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 2 } });
    expect(ledger.orders).toHaveLength(1);
    expect(ledger.orders[0]).toMatchObject({ underlying: "CRWV", pays: 0 });
  });

  it("a bought option's premium rides with its order, not with the share spend", () => {
    const ledger = fresh();
    claim(ledger, { order: { underlying: "CRWV", option: buyBackOption, units: 3 } });
    // $2.10 × 100 shares × 3 units, owed only if the order fills.
    expect(ledger.orders[0]?.pays).toBeCloseTo(630, 6);
    expect(unspentCash(book, ledger)).toBe(10_000);
  });
});

describe("closableContracts — how much a close may still take", () => {
  const ledgerWith = (...orders: [OptionOrderIntent, number][]): GuardLedger => {
    const book = aPortfolio({ cash: 10_000 });
    const ledger = openLedger([sellPut], bookNeeds(book), book);
    for (const [option, units] of orders) {
      claim(ledger, { order: { underlying: "CRWV", option, units } });
    }
    return ledger;
  };
  const sellOf = (units: number): [OptionOrderIntent, number] => [
    {
      ...buyBackOption,
      legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }],
      limitPrice: 2,
    },
    units,
  ];

  it("a held long can be sold in full when nothing earlier touched it", () => {
    expect(closableContracts(ledgerWith(), PUT, 3, "sell")).toBe(3);
  });

  it("a held long is reduced by what earlier approved orders sold of it", () => {
    expect(closableContracts(ledgerWith(sellOf(2)), PUT, 3, "sell")).toBe(1);
  });

  it("never goes below zero once earlier orders sold more than is held", () => {
    expect(closableContracts(ledgerWith(sellOf(2), sellOf(2)), PUT, 3, "sell")).toBe(0);
  });

  it("an earlier buy of the same contract adds nothing to sell — it may not fill", () => {
    expect(closableContracts(ledgerWith([buyBackOption, 5]), PUT, 3, "sell")).toBe(3);
  });

  it("a held short can be bought back in full when nothing earlier touched it", () => {
    expect(closableContracts(ledgerWith(), PUT, -2, "buy")).toBe(2);
  });

  it("a held short is reduced by what earlier approved orders bought back", () => {
    expect(closableContracts(ledgerWith([buyBackOption, 1]), PUT, -2, "buy")).toBe(1);
  });

  it("an earlier sale of the same contract never adds to what can be bought back", () => {
    expect(closableContracts(ledgerWith(sellOf(4)), PUT, -2, "buy")).toBe(2);
  });

  it("holds nothing to buy back against a long, nor to sell against a short", () => {
    expect(closableContracts(ledgerWith(), PUT, 2, "buy")).toBe(0);
    expect(closableContracts(ledgerWith(), PUT, -2, "sell")).toBe(0);
  });

  it("only counts orders on the same contract", () => {
    expect(closableContracts(ledgerWith(sellOf(2)), CALL, 3, "sell")).toBe(3);
  });
});

describe("spendableCash — cash neither paid out nor needed by the batch's options", () => {
  it("is the account's cash less share buys when no option is anywhere in the batch", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const ledger = openLedger([], bookNeeds(portfolio), portfolio);
    claim(ledger, { spent: 2_500 });
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBe(7_500);
  });

  it("holds back an open short put's collateral", () => {
    const portfolio = heldShortPut(10_000);
    const ledger = openLedger([], bookNeeds(portfolio), portfolio);
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBe(1_500);
  });

  it("holds back the collateral of a put approved earlier in the same batch", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const ledger = liveLedger(portfolio);
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBe(10_000);
    claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 1 } });
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBe(1_500);
  });

  it("subtracts share buys on top of an option's collateral", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const ledger = liveLedger(portfolio);
    claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 1 } });
    claim(ledger, { spent: 1_000 });
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBe(500);
  });

  it("counts a premium only at its worst — a bought option's debit is cash the book may owe", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const ledger = liveLedger(portfolio);
    claim(ledger, { order: { underlying: "CRWV", option: buyBackOption, units: 1 } });
    expect(spendableCash(portfolio, ledger, bookNeeds(portfolio))).toBeCloseTo(9_790, 6);
  });
});

describe("worsens — does one change make the book's cover worse?", () => {
  describe("when an option order opens a put", () => {
    it("is fine when the account can secure it, and says what it newly needs", () => {
      const portfolio = aPortfolio({ cash: 10_000 });
      const verdict = worsens(portfolio, liveLedger(portfolio), "CRWV", { legs: putLegs(1) });
      expect(verdict).toEqual({ shares: false, cash: false, newCash: 8_500 });
    });

    it("worsens cash when the account cannot secure it", () => {
      const portfolio = aPortfolio({ cash: 5_000 });
      const verdict = worsens(portfolio, liveLedger(portfolio), "CRWV", { legs: putLegs(1) });
      expect(verdict.cash).toBe(true);
      expect(verdict.shares).toBe(false);
    });

    it("worsens cash for a second put the first one's collateral leaves no room for", () => {
      const portfolio = aPortfolio({ cash: 10_000 });
      const ledger = liveLedger(portfolio);
      claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 1 } });
      const verdict = worsens(portfolio, ledger, "CRWV", { legs: putLegs(1) });
      expect(verdict.cash).toBe(true);
      expect(verdict.newCash).toBe(8_500);
    });

    it("is fine for a second put when there is cash for both", () => {
      const portfolio = aPortfolio({ cash: 20_000 });
      const ledger = liveLedger(portfolio);
      claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 1 } });
      expect(worsens(portfolio, ledger, "CRWV", { legs: putLegs(1) }).cash).toBe(false);
    });

    it("counts the cash other tickers' options already need, not just this ticker's", () => {
      const portfolio = aPortfolio({
        cash: 10_000,
        positions: [aPosition({ symbol: "NVDA261106P00050000", quantity: -1, avgPrice: 1 })],
      });
      // NVDA's $5,000 put leaves $5,000 for CRWV's $8,500.
      const verdict = worsens(portfolio, liveLedger(portfolio), "CRWV", { legs: putLegs(1) });
      expect(verdict.cash).toBe(true);
    });
  });

  describe("when a change sheds risk from a book already short of cash", () => {
    it("is not a worsening: buying the short back never counts against it", () => {
      const portfolio = heldShortPut(5_000);
      const verdict = worsens(portfolio, liveLedger(portfolio), "CRWV", {
        legs: orderLegs(buyBackOption, 1),
        pays: 210,
      });
      expect(verdict.cash).toBe(false);
      expect(verdict.shares).toBe(false);
    });

    it("but selling a further put into that same short book is", () => {
      const portfolio = heldShortPut(5_000);
      expect(worsens(portfolio, liveLedger(portfolio), "CRWV", { legs: putLegs(1) }).cash).toBe(
        true,
      );
    });
  });

  describe("when a share sale meets a sold call that needs the shares", () => {
    const covered = aPortfolio({
      cash: 10_000,
      positions: [
        aPosition({ symbol: "CRWV", quantity: 100 }),
        aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
      ],
    });

    it("worsens shares: selling any of the 100 leaves the call short of cover", () => {
      const verdict = worsens(covered, openLedger([], bookNeeds(covered), covered), "CRWV", {
        sells: 1,
      });
      expect(verdict.shares).toBe(true);
    });

    it("does not worsen shares for a sale of nothing", () => {
      const verdict = worsens(covered, openLedger([], bookNeeds(covered), covered), "CRWV", {
        sells: 0,
      });
      expect(verdict.shares).toBe(false);
    });

    it("counts shares an approved sell already took this batch as no longer free", () => {
      const ledger = openLedger([], bookNeeds(covered), covered);
      claim(ledger, { sold: { underlying: "CRWV", shares: 60 } });
      // 40 shares are free against a call needing 100: it is short already, and each further
      // share sold leaves it shorter still.
      expect(worsens(covered, ledger, "CRWV", { sells: 1 }).shares).toBe(true);
      expect(worsens(covered, ledger, "CRWV", { sells: 0 }).shares).toBe(false);
    });

    it("lets shares beyond the call's 100 sell freely", () => {
      const extra = aPortfolio({
        cash: 10_000,
        positions: [
          aPosition({ symbol: "CRWV", quantity: 150 }),
          aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
        ],
      });
      const ledger = openLedger([], bookNeeds(extra), extra);
      expect(worsens(extra, ledger, "CRWV", { sells: 50 }).shares).toBe(false);
      expect(worsens(extra, ledger, "CRWV", { sells: 51 }).shares).toBe(true);
    });
  });

  describe("when many orders are already approved on one underlying", () => {
    const claimPuts = (portfolio: Portfolio, count: number): GuardLedger => {
      const ledger = liveLedger(portfolio);
      for (let i = 0; i < count; i++) {
        claim(ledger, { order: { underlying: "CRWV", option: putOption, units: 1 } });
      }
      return ledger;
    };

    it("judges a risk-shedding close exactly while the combinations are enumerable", () => {
      const portfolio = aPortfolio({ cash: 10_000 });
      const ledger = claimPuts(portfolio, 2);
      const verdict = worsens(portfolio, ledger, "CRWV", {
        legs: orderLegs(buyBackOption, 1),
        pays: 210,
      });
      expect(verdict.cash).toBe(false);
    });

    it("past ten orders the book is only an estimate, so a change must leave cover whole outright", () => {
      const portfolio = aPortfolio({ cash: 80_000 });
      const ledger = claimPuts(portfolio, 11);
      // Eleven sold puts need $93,500 against $80,000: short of cash however it is counted. Even a
      // close that sheds a put is held to "leaves cover whole", which this book can no longer show.
      const verdict = worsens(portfolio, ledger, "CRWV", {
        legs: orderLegs(buyBackOption, 1),
        pays: 210,
      });
      expect(verdict.cash).toBe(true);
    });

    it("past ten orders, a change is fine when the bounding book is fully covered", () => {
      const portfolio = aPortfolio({ cash: 1_000_000 });
      const ledger = claimPuts(portfolio, 11);
      const verdict = worsens(portfolio, ledger, "CRWV", { legs: putLegs(1) });
      expect(verdict.cash).toBe(false);
      expect(verdict.shares).toBe(false);
    });
  });
});

describe("subscriptionTerms — which subscription an intent trades under", () => {
  const intent = (overrides: Partial<OrderIntent> = {}): OrderIntent => ({
    symbol: "CRWV",
    side: "buy",
    quantity: 1,
    type: "market",
    reason: "test",
    playbookId: "CRWV-WHEEL",
    ...overrides,
  });
  const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription =>
    aSubscription("sauron", "CRWV-WHEEL", overrides);

  describe("when the intent has no playbook", () => {
    it("has no subscription, refuses nothing and has realized nothing", () => {
      const terms = subscriptionTerms(intent({ playbookId: undefined }), {
        subscriptions: [sub()],
      });
      expect(terms).toEqual({ refusesSymbol: false, realizedPl: 0 });
    });
  });

  describe("when picking among subscriptions", () => {
    it("finds the subscription for the intent's playbook", () => {
      const mine = sub({ capitalAllocated: 5_000 });
      const other = aSubscription("sauron", "NVDA-GROWTH", { capitalAllocated: 1 });
      expect(subscriptionTerms(intent(), { subscriptions: [other, mine] }).subscription).toBe(mine);
    });

    it("has none when the account never subscribed to that playbook", () => {
      const terms = subscriptionTerms(intent(), {
        subscriptions: [aSubscription("sauron", "NVDA-GROWTH")],
      });
      expect(terms.subscription).toBeUndefined();
      expect("subscription" in terms).toBe(false);
    });

    it("has none when the config carries no subscriptions at all", () => {
      expect(subscriptionTerms(intent(), {}).subscription).toBeUndefined();
    });

    it("prefers the enabled subscription over a paused one, whichever is listed first", () => {
      const paused = sub({ enabled: false, capitalAllocated: 100 });
      const running = sub({ enabled: true, capitalAllocated: 200 });
      expect(subscriptionTerms(intent(), { subscriptions: [paused, running] }).subscription).toBe(
        running,
      );
      expect(subscriptionTerms(intent(), { subscriptions: [running, paused] }).subscription).toBe(
        running,
      );
    });

    it("falls back to the paused one so its exits and covered calls still size on its terms", () => {
      const paused = sub({ enabled: false, capitalAllocated: 100 });
      expect(subscriptionTerms(intent(), { subscriptions: [paused] }).subscription).toBe(paused);
    });
  });

  describe("when the subscription filters by symbol", () => {
    it("refuses a ticker outside the list", () => {
      const terms = subscriptionTerms(intent({ symbol: "NVDA" }), {
        subscriptions: [sub({ symbols: ["CRWV"] })],
      });
      expect(terms.refusesSymbol).toBe(true);
    });

    it("allows a ticker on the list", () => {
      const terms = subscriptionTerms(intent(), { subscriptions: [sub({ symbols: ["CRWV"] })] });
      expect(terms.refusesSymbol).toBe(false);
    });

    it("treats an empty or absent filter as unrestricted", () => {
      expect(
        subscriptionTerms(intent({ symbol: "NVDA" }), { subscriptions: [sub({ symbols: [] })] })
          .refusesSymbol,
      ).toBe(false);
      expect(
        subscriptionTerms(intent({ symbol: "NVDA" }), { subscriptions: [sub()] }).refusesSymbol,
      ).toBe(false);
    });

    it("refuses nothing when there is no subscription to hold a filter", () => {
      expect(subscriptionTerms(intent({ symbol: "NVDA" }), {}).refusesSymbol).toBe(false);
    });
  });

  describe("when the subscription compounds its allocation", () => {
    const realized = (id: string): number => (id === "CRWV-WHEEL" ? 750 : -1);

    it("reports what the playbook has realized", () => {
      const terms = subscriptionTerms(intent(), {
        subscriptions: [sub({ compoundAllocation: true })],
        realizedPlForPlaybook: realized,
      });
      expect(terms.realizedPl).toBe(750);
    });

    it("reports a loss as negative, so a losing playbook shrinks", () => {
      const terms = subscriptionTerms(intent(), {
        subscriptions: [sub({ compoundAllocation: true })],
        realizedPlForPlaybook: () => -300,
      });
      expect(terms.realizedPl).toBe(-300);
    });

    it("is zero when no realized-P/L source is wired in", () => {
      const terms = subscriptionTerms(intent(), {
        subscriptions: [sub({ compoundAllocation: true })],
      });
      expect(terms.realizedPl).toBe(0);
    });

    it("is zero when the subscription does not compound — off by default", () => {
      expect(
        subscriptionTerms(intent(), { subscriptions: [sub()], realizedPlForPlaybook: realized })
          .realizedPl,
      ).toBe(0);
      expect(
        subscriptionTerms(intent(), {
          subscriptions: [sub({ compoundAllocation: false })],
          realizedPlForPlaybook: realized,
        }).realizedPl,
      ).toBe(0);
    });
  });
});

describe("committedToPlaybook — dollars a playbook already has against its allocation", () => {
  const AS_OF = "2026-10-07T15:00:00Z";
  const ctx = (asks: Record<string, number>): MarketContext => ({
    asOf: AS_OF,
    quotes: Object.fromEntries(
      Object.entries(asks).map(([symbol, ask]) => [symbol, aQuote({ symbol, last: ask, ask })]),
    ),
  });
  const buy = (symbol: string, playbookId?: string): OrderIntent => ({
    symbol,
    side: "buy",
    quantity: 1,
    type: "market",
    reason: "test",
    ...(playbookId ? { playbookId } : {}),
  });
  const committed = (
    intent: OrderIntent,
    portfolio: Portfolio,
    context: MarketContext,
    baskets?: ReadonlyMap<string, readonly string[]>,
    ledger?: GuardLedger,
  ): number => {
    const book = bookNeeds(portfolio);
    return committedToPlaybook(intent, portfolio, context, baskets, {
      ledger: ledger ?? openLedger([], book, portfolio),
      book,
    });
  };

  it("is nothing for a playbook with no shares, no options and no claims", () => {
    expect(committed(buy("CRWV", "CRWV-WHEEL"), aPortfolio(), ctx({ CRWV: 90 }))).toBe(0);
  });

  it("counts the intent's own symbol's shares at the ask when no basket is registered", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 10 })] });
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }))).toBe(900);
  });

  it("counts the whole registered basket's shares, not only this symbol's", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "CRWV", quantity: 10 }),
        aPosition({ symbol: "NVDA", quantity: 2 }),
        aPosition({ symbol: "AAPL", quantity: 1_000 }),
      ],
    });
    const baskets = new Map([["DUO", ["CRWV", "NVDA"]]]);
    const total = committed(
      buy("CRWV", "DUO"),
      portfolio,
      ctx({ CRWV: 90, NVDA: 100, AAPL: 5 }),
      baskets,
    );
    // AAPL is not in the basket: 10 × 90 + 2 × 100.
    expect(total).toBe(1_100);
  });

  it("leaves out a basket symbol the cycle has no quote for", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 10 })] });
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({}))).toBe(0);
  });

  it("counts the collateral its sold puts hold against the same allocation", () => {
    const portfolio = heldShortPut(10_000);
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }))).toBe(8_500);
  });

  it("adds shares and put collateral — a playbook cannot commit its allocation twice", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [
        aPosition({ symbol: "CRWV", quantity: 10 }),
        aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 }),
      ],
    });
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }))).toBe(900 + 8_500);
  });

  it("counts a long contract at its mark, and never a short one as value", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: CALL, quantity: 1, avgPrice: 1.5, marketValue: 250 }),
        aPosition({ symbol: PUT, quantity: -1, avgPrice: 2, marketValue: -300 }),
      ],
    });
    // The long call's $250 mark; the short put adds only its $8,500 collateral, not -$300.
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }))).toBe(250 + 8_500);
  });

  it("ignores long contracts on an underlying outside the basket", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA261106C00100000", quantity: 2, avgPrice: 3, marketValue: 600 }),
      ],
    });
    expect(committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }))).toBe(0);
  });

  it("adds what earlier intents in this batch claimed for the playbook", () => {
    const portfolio = aPortfolio({ cash: 10_000 });
    const ledger = openLedger([], bookNeeds(portfolio), portfolio);
    claim(ledger, { playbookId: "CRWV-WHEEL", risk: 2_000 });
    claim(ledger, { playbookId: "OTHER", risk: 999 });
    expect(
      committed(buy("CRWV", "CRWV-WHEEL"), portfolio, ctx({ CRWV: 90 }), undefined, ledger),
    ).toBe(2_000);
  });

  it("charges an intent with no playbook only for its own symbol, with no batch claims", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 4 })] });
    expect(committed(buy("CRWV"), portfolio, ctx({ CRWV: 90 }))).toBe(360);
  });
});
