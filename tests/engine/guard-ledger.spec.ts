import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent, Portfolio } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, type RiskConfig } from "../../src/engine/guards.js";
import {
  aContext,
  anOptionIntent,
  anOptionQuote,
  aPortfolio,
  aPosition,
  withOptionQuotes,
} from "../support/builders.js";

// The batch ledger (`engine/guard-batch.ts`): within ONE cycle, what an approved intent claims —
// cash, shares — is gone for the next. Live whenever the batch carries an option order or the book
// already holds a short; a share-only cycle with no option positions never sees it
// (`guards-byte-identity.spec.ts`).
const AS_OF = "2026-10-07T15:00:00Z";
const PUT = "CRWV261106P00085000";
const CALL = "CRWV261106C00100000";
const CALENDAR: readonly EarningsPrint[] = [
  { symbol: "CRWV", date: "2026-11-10", status: "estimate", source: "test" },
];
const CONFIG: RiskConfig = {
  maxPositionPct: 1,
  optionsLevel: 1,
  discipline: { calendar: CALENDAR },
  subscriptions: [
    {
      accountId: "sauron",
      playbookId: "CRWV-WHEEL",
      mode: "standard",
      capitalAllocated: 20_000,
      enabled: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ],
};
const context = withOptionQuotes(aContext({ CRWV: { last: 90 }, NVDA: { last: 100 } }, AS_OF), [
  anOptionQuote(PUT, { bid: 2, ask: 2.2, at: AS_OF }),
  anOptionQuote(CALL, { bid: 1.6, ask: 1.8, at: AS_OF }),
]);
const sellPut = anOptionIntent();
const coveredCall = anOptionIntent({
  option: {
    structure: "covered-call",
    legs: [{ occSymbol: CALL, side: "sell", ratio: 1 }],
    limitPrice: 1.7,
  },
});
const shares = (side: "buy" | "sell", symbol: string, quantity: number): OrderIntent => ({
  symbol,
  side,
  quantity,
  type: "market",
  reason: "test",
});
const run = (intents: readonly OrderIntent[], portfolio: Portfolio) =>
  applyGuardsWithVerdicts(intents, portfolio, context, CONFIG);

describe("the batch ledger — a sold put and a share buy in one cycle", () => {
  it("the put claims its collateral first; the share buy sizes against what is left", () => {
    const result = run([sellPut, shares("buy", "CRWV", 50)], aPortfolio({ cash: 10_000 }));
    // $10,000 − $8,500 collateral = $1,500 → 16 CRWV at ~$90.05.
    expect(result.approved.map((i) => i.quantity)).toEqual([1, 16]);
  });

  it("in the other order, the shares spend the cash and the put is not secured", () => {
    const result = run([shares("buy", "CRWV", 50), sellPut], aPortfolio({ cash: 10_000 }));
    expect(result.approved).toMatchObject([{ symbol: "CRWV", quantity: 50 }]);
    expect(result.refused).toEqual([{ intent: sellPut, reason: "put-not-secured" }]);
  });
});

describe("the batch ledger — share buys under an open put", () => {
  const underPut = (cash: number): Portfolio =>
    aPortfolio({ cash, positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })] });

  it("two buys cannot jointly eat the put's collateral", () => {
    // $10,000 cash, $8,500 promised: $1,500 free. Without the ledger both buys read $1,500.
    const result = run([shares("buy", "NVDA", 10), shares("buy", "NVDA", 10)], underPut(10_000));
    expect(result.approved.map((i) => i.quantity)).toEqual([10, 4]);
  });

  it("names collateral-reserved when the cash is there but promised", () => {
    const result = run([shares("buy", "NVDA", 10)], underPut(8_550));
    expect(result.refused).toEqual([
      { intent: shares("buy", "NVDA", 10), reason: "collateral-reserved" },
    ]);
  });
});

describe("the batch ledger — shares under a sold call", () => {
  it("a debit spread's short call never locks shares: S1-NVDA's D-5 sale passes in full", () => {
    const nvda = aPortfolio({
      positions: [
        aPosition({ symbol: "NVDA", quantity: 100 }),
        aPosition({ symbol: "NVDA261113C00240000", quantity: 1, avgPrice: 9 }),
        aPosition({ symbol: "NVDA261113C00250000", quantity: -1, avgPrice: 5.5 }),
      ],
    });
    const sale = { ...shares("sell", "NVDA", 100), playbookId: "S1-NVDA" };
    expect(run([sale], nvda).approved).toEqual([sale]);
  });

  it("an uncapped sold call holds back its 100 shares; the rest still sell", () => {
    const covered = (held: number): Portfolio =>
      aPortfolio({
        positions: [
          aPosition({ symbol: "CRWV", quantity: held }),
          aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
        ],
      });
    expect(run([shares("sell", "CRWV", 150)], covered(150)).approved).toMatchObject([
      { quantity: 50 },
    ]);
    expect(run([shares("sell", "CRWV", 100)], covered(100)).refused).toEqual([
      { intent: shares("sell", "CRWV", 100), reason: "uncovers-short-call" },
    ]);
  });

  it("two sells in one cycle cannot jointly sell the covered shares", () => {
    const portfolio = aPortfolio({
      positions: [
        aPosition({ symbol: "CRWV", quantity: 200 }),
        aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
      ],
    });
    const result = run([shares("sell", "CRWV", 100), shares("sell", "CRWV", 100)], portfolio);
    expect(result.approved).toHaveLength(1);
    expect(result.refused.map((r) => r.reason)).toEqual(["uncovers-short-call"]);
  });

  it("a covered call and a sale of its shares in one cycle: whichever comes second is refused", () => {
    const hundred = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 100 })] });
    const sale = shares("sell", "CRWV", 100);
    expect(run([coveredCall, sale], hundred).refused).toEqual([
      { intent: sale, reason: "uncovers-short-call" },
    ]);
    expect(run([sale, coveredCall], hundred).refused).toEqual([
      { intent: coveredCall, reason: "call-not-covered" },
    ]);
  });
});

describe("the batch ledger — one allocation across a playbook's shares and options", () => {
  // CRWV-WHEEL is allocated $20,000. Cash is plentiful, so only the allocation can bind.
  const wheelBuy = (quantity: number): OrderIntent => ({
    ...shares("buy", "CRWV", quantity),
    playbookId: "CRWV-WHEEL",
  });

  it("an open put's collateral counts against a share buy under the same playbook", () => {
    const underPut = aPortfolio({
      cash: 100_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
    });
    // $20,000 − $8,500 securing the put = $11,500 → 127 CRWV at ~$90.05, not 222.
    expect(run([wheelBuy(200)], underPut).approved).toMatchObject([{ quantity: 127 }]);
  });

  it("so does a put sold earlier in the same cycle", () => {
    const result = run([sellPut, wheelBuy(200)], aPortfolio({ cash: 100_000 }));
    expect(result.approved.map((i) => i.quantity)).toEqual([1, 127]);
  });
});

// A held long's power to cap a short is a pairing, not an amount, and every approved order may
// fill or not on its own — so each order is judged against the worst case of the ones approved
// before it (#4645 red-team). Every case below was approved as a naked short before that.
describe("the batch ledger — a held long caps one short, and approvals may not fill", () => {
  const PUT_88 = "CRWV261106P00088000";
  const PUT_90 = "CRWV261106P00090000";
  const CALL_95 = "CRWV261106C00095000";
  const CALL_105 = "CRWV261106C00105000";
  const wide = withOptionQuotes(
    aContext({ CRWV: { last: 90 } }, AS_OF),
    [PUT, PUT_88, PUT_90, CALL_95, CALL, CALL_105].map((occ) =>
      anOptionQuote(occ, { bid: 2, ask: 2.2, at: AS_OF }),
    ),
  );
  const runWide = (intents: readonly OrderIntent[], portfolio: Portfolio) =>
    applyGuardsWithVerdicts(intents, portfolio, wide, CONFIG);
  const sell = (occ: string, structure: "cash-secured-put" | "covered-call"): OrderIntent =>
    anOptionIntent({ option: { structure, legs: [{ occSymbol: occ, side: "sell", ratio: 1 }] } });
  const close = (occ: string, side: "buy" | "sell"): OrderIntent =>
    anOptionIntent({
      side,
      playbookId: undefined,
      playbookMode: undefined,
      option: { effect: "close", structure: "close", legs: [{ occSymbol: occ, side, ratio: 1 }] },
    });
  const reasons = (intents: readonly OrderIntent[], portfolio: Portfolio) =>
    runWide(intents, portfolio).refused.map((r) => r.reason);
  const longPut = aPortfolio({
    cash: 1_000,
    positions: [aPosition({ symbol: PUT_90, quantity: 1, avgPrice: 1 })],
  });

  it("two sold puts cannot both lean on one held long put", () => {
    // $1,000 secures a put the $90 long caps; it cannot secure a second $8,800 strike.
    expect(
      reasons([sell(PUT, "cash-secured-put"), sell(PUT_88, "cash-secured-put")], longPut),
    ).toEqual(["put-not-secured"]);
  });

  it("a close cannot pull a long out from under a put sold in the same cycle — in either order", () => {
    const sold = sell(PUT, "cash-secured-put");
    const capClose = close(PUT_90, "sell");
    expect(runWide([sold, capClose], longPut).refused).toEqual([
      { intent: capClose, reason: "put-not-secured" },
    ]);
    expect(runWide([capClose, sold], longPut).refused).toEqual([
      { intent: sold, reason: "put-not-secured" },
    ]);
  });

  it("two sold calls cannot both lean on one held long call", () => {
    const longCall = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: CALL_95, quantity: 1, avgPrice: 1 })],
    });
    expect(reasons([sell(CALL, "covered-call"), sell(CALL_105, "covered-call")], longCall)).toEqual(
      ["call-not-covered"],
    );
  });

  it("a sale cannot take the shares a call needs once a close in the same cycle drops its cap", () => {
    const capped = aPortfolio({
      cash: 1_000,
      positions: [
        aPosition({ symbol: "CRWV", quantity: 100 }),
        aPosition({ symbol: CALL_95, quantity: 1, avgPrice: 1 }),
      ],
    });
    const sale = shares("sell", "CRWV", 100);
    const result = runWide([sell(CALL, "covered-call"), close(CALL_95, "sell"), sale], capped);
    expect(result.refused).toEqual([{ intent: sale, reason: "uncovers-short-call" }]);
  });

  it("a second close of the same short never buys more than is short", () => {
    const shortPut = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 })],
    });
    const buyBack = close(PUT, "buy");
    expect(runWide([buyBack, { ...buyBack, quantity: 5 }], shortPut).refused).toEqual([
      { intent: { ...buyBack, quantity: 5 }, reason: "nothing-held" },
    ]);
  });

  it("a spread closed leg by leg keeps its long until the short is gone, since either leg may not fill", () => {
    const spread = aPortfolio({
      cash: 1_000,
      positions: [
        aPosition({ symbol: PUT_90, quantity: 1, avgPrice: 1 }),
        aPosition({ symbol: PUT, quantity: -1, avgPrice: 2 }),
      ],
    });
    const shortLeg = close(PUT, "buy");
    const longLeg = close(PUT_90, "sell");
    expect(runWide([shortLeg, longLeg], spread).refused).toEqual([
      { intent: longLeg, reason: "put-not-secured" },
    ]);
  });

  it("a vertical closed as ONE order never locks the shares under it — it fills whole or not at all", () => {
    const spreadOverShares = aPortfolio({
      positions: [
        aPosition({ symbol: "CRWV", quantity: 100 }),
        aPosition({ symbol: CALL_95, quantity: 1, avgPrice: 4 }),
        aPosition({ symbol: CALL, quantity: -1, avgPrice: 1.7 }),
      ],
    });
    const vertical = anOptionIntent({
      side: "sell",
      playbookId: undefined,
      option: {
        effect: "close",
        structure: "close",
        legs: [
          { occSymbol: CALL_95, side: "sell", ratio: 1 },
          { occSymbol: CALL, side: "buy", ratio: 1 },
        ],
        limitPrice: -0.1,
      },
    });
    const sale = shares("sell", "CRWV", 100);
    // Band, in Alpaca's signed net: buy C100 at [2, 2.2] less sell C95 at [2, 2.2] → [−0.2, 0.2].
    expect(runWide([vertical, sale], spreadOverShares).approved).toEqual([vertical, sale]);
    // Closed leg by leg instead, the long's close may fill alone and leave the call bare.
    expect(reasons([close(CALL_95, "sell"), sale], spreadOverShares)).toEqual([
      "uncovers-short-call",
    ]);
  });
});

// Found by the #4645 soundness fuzz (`guard-soundness.spec.ts`), each approved before the fix.
describe("the batch ledger — cover judged on the best assignment, outcome by outcome", () => {
  const C95_OCT = "CRWV261030C00095000";
  const C90_NOV = "CRWV261106C00090000";
  const C95_NOV = "CRWV261106C00095000";
  const C105_NOV = "CRWV261106C00105000";
  const book = (cash: number, ...positions: Parameters<typeof aPosition>[0][]): Portfolio =>
    aPortfolio({ cash, positions: positions.map((p) => aPosition(p)) });
  const quoted = withOptionQuotes(
    aContext({ CRWV: { last: 90 } }, AS_OF),
    [PUT, CALL, C95_OCT, C90_NOV, C95_NOV, C105_NOV].map((occ) =>
      anOptionQuote(occ, { bid: 1.6, ask: 1.8, at: AS_OF }),
    ),
  );
  const judge = (intents: readonly OrderIntent[], portfolio: Portfolio) =>
    applyGuardsWithVerdicts(intents, portfolio, quoted, CONFIG);
  const buyBack = (occ: string): OrderIntent =>
    anOptionIntent({
      side: "buy",
      playbookId: undefined,
      playbookMode: undefined,
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: occ, side: "buy", ratio: 1 }],
        limitPrice: 1.7,
      },
    });

  it("a buy-back is never paid out of the cash another sold put stands on", () => {
    // $8,500 secures the put exactly; the covered call's $170 buy-back would leave it $170 short.
    const wheel = (cash: number) =>
      book(
        cash,
        { symbol: "CRWV", quantity: 100 },
        { symbol: PUT, quantity: -1, avgPrice: 2 },
        { symbol: CALL, quantity: -1, avgPrice: 1.7 },
      );
    expect(judge([buyBack(CALL)], wheel(8_500)).refused).toEqual([
      { intent: buyBack(CALL), reason: "collateral-reserved" },
    ]);
    expect(judge([buyBack(CALL)], wheel(8_670)).approved).toHaveLength(1);
    // Buying back the put itself frees its own collateral: never refused for its premium.
    expect(judge([buyBack(PUT)], wheel(8_500)).approved).toHaveLength(1);
  });

  it("shares covering a call are not freed by a long call above it the account cannot pay the width of", () => {
    // 200 shares cover both calls; the $100 long could cap one only with $500 of width cash, and there
    // is none — so not one share may go.
    const lots = (shares: number) =>
      book(
        0,
        { symbol: "CRWV", quantity: shares },
        { symbol: C95_OCT, quantity: -2, avgPrice: 2 },
        { symbol: CALL, quantity: 1, avgPrice: 1 },
      );
    expect(judge([shares("sell", "CRWV", 1)], lots(200)).refused).toEqual([
      { intent: shares("sell", "CRWV", 1), reason: "uncovers-short-call" },
    ]);
    // With 300, the extra 100 sell freely.
    expect(judge([shares("sell", "CRWV", 150)], lots(300)).approved).toMatchObject([
      { quantity: 100 },
    ]);
  });

  it("a covered call never leans on a long call above it the account cannot pay the width of", () => {
    const lot = book(
      0,
      { symbol: "CRWV", quantity: 100 },
      { symbol: C90_NOV, quantity: -1, avgPrice: 2 },
      { symbol: C105_NOV, quantity: 1, avgPrice: 1 },
    );
    const call = anOptionIntent({
      option: {
        structure: "covered-call",
        legs: [{ occSymbol: C95_NOV, side: "sell", ratio: 1 }],
        limitPrice: 1.7,
      },
    });
    expect(judge([call], lot).refused).toEqual([{ intent: call, reason: "insufficient-cash" }]);
  });
});

// Found while fixing the above: judging worst outcome against worst outcome counted the first
// spread's debit as paid while reading its collateral from the outcome where it never filled.
describe("the batch ledger — a premium counts only where its order fills", () => {
  const NVDA_PRINT: EarningsPrint = {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-17", end: "2026-11-20" },
  };
  const spreads: RiskConfig = {
    ...CONFIG,
    optionsLevel: 3,
    discipline: { calendar: [...CALENDAR, NVDA_PRINT] },
  };
  const C160 = "NVDA261030C00160000";
  const C180 = "NVDA261030C00180000";
  const C190 = "NVDA261030C00190000";
  const nvda = withOptionQuotes(aContext({ NVDA: { last: 180 } }, AS_OF), [
    anOptionQuote(C160, { bid: 25.8, ask: 26, at: AS_OF }),
    anOptionQuote(C180, { bid: 10, ask: 10.2, at: AS_OF }),
    anOptionQuote(C190, { bid: 7, ask: 7.2, at: AS_OF }),
  ]);
  const spread = (long: string, limitPrice: number): OrderIntent =>
    anOptionIntent({
      symbol: "NVDA",
      side: "buy",
      option: {
        structure: "call-debit-spread",
        legs: [
          { occSymbol: long, side: "buy", ratio: 1 },
          { occSymbol: C190, side: "sell", ratio: 1 },
        ],
        limitPrice,
      },
    });

  it("a second spread cannot spend cash the first one's fill would need", () => {
    // $4,000 caps the Oct 16 $170 short with the $210 long. Both spreads filling leaves one $190 short
    // capped only by the $210 — $2,000 of width — with $1,834 left after both debits.
    const portfolio = aPortfolio({
      cash: 4_000,
      positions: [
        aPosition({ symbol: "NVDA261030C00210000", quantity: 1, avgPrice: 1 }),
        aPosition({ symbol: "NVDA261016C00170000", quantity: -1, avgPrice: 12 }),
      ],
    });
    const first = spread(C180, 2.97);
    const second = spread(C160, 18.69);
    const result = applyGuardsWithVerdicts([first, second], portfolio, nvda, spreads);
    expect(result.approved).toEqual([first]);
    expect(result.refused.map((r) => r.intent)).toEqual([second]);
  });
});

// Share orders that compete see each other in EVERY batch, options or not (#4670): before, a
// share-only batch on a book promising nothing sized each order against the starting book alone.
describe("the batch ledger — share orders that compete, with no option anywhere", () => {
  it("two sells of one ticker cannot jointly sell more than is held", () => {
    const fifty = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 50 })] });
    const result = run([shares("sell", "CRWV", 300), shares("sell", "CRWV", 1)], fifty);
    expect(result.approved).toMatchObject([{ quantity: 50 }]);
    expect(result.refused).toEqual([{ intent: shares("sell", "CRWV", 1), reason: "nothing-held" }]);
  });

  it("two buys cannot jointly spend more than the cash", () => {
    const result = run(
      [shares("buy", "NVDA", 10), shares("buy", "NVDA", 10)],
      aPortfolio({ cash: 1_000 }),
    );
    const ask = context.quotes.NVDA?.ask ?? 0;
    const spent = result.approved.reduce((sum, i) => sum + i.quantity * ask, 0);
    expect(spent).toBeLessThanOrEqual(1_000);
    expect(result.refused.map((r) => r.reason)).toEqual(["insufficient-cash"]);
  });

  it("two buys under one playbook cannot jointly spend more than its allocation", () => {
    const buy = { ...shares("buy", "CRWV", 200), playbookId: "CRWV-WHEEL" };
    const result = run([buy, buy], aPortfolio({ cash: 1_000_000 }));
    const ask = context.quotes.CRWV?.ask ?? 0;
    const spent = result.approved.reduce((sum, i) => sum + i.quantity * ask, 0);
    // CRWV-WHEEL is allocated $20,000: 200 shares at ~$90 is $18,010, so the second gets the rest.
    expect(spent).toBeLessThanOrEqual(20_000);
    expect(result.approved).toHaveLength(2);
  });
});

// Shares a sell order still open at the broker will take are already gone (#4678): the trader reads
// the open sells once a cycle and the ledger starts from them, so a new sell — or a call written on
// those shares — is judged against what they leave.
describe("the batch ledger — sells still open at the broker", () => {
  const fifty = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 50 })] });
  const openSells = (quantity: number) => new Map([["CRWV", quantity]]);
  const runOpen = (intents: readonly OrderIntent[], portfolio: Portfolio, open: number) =>
    applyGuardsWithVerdicts(intents, portfolio, context, CONFIG, openSells(open));

  it("a new sell is sized against the shares the open sell leaves", () => {
    expect(runOpen([shares("sell", "CRWV", 50)], fifty, 30).approved).toMatchObject([
      { symbol: "CRWV", quantity: 20 },
    ]);
  });

  it("an open sell and this batch's own sells together never sell more than is held", () => {
    const second = shares("sell", "CRWV", 10);
    const result = runOpen([shares("sell", "CRWV", 10), second], fifty, 40);
    expect(result.approved).toMatchObject([{ quantity: 10 }]);
    expect(result.refused).toEqual([{ intent: second, reason: "nothing-held" }]);
  });

  it("shares an open sell will take no longer cover a call written on them", () => {
    const hundred = aPortfolio({ positions: [aPosition({ symbol: "CRWV", quantity: 100 })] });
    expect(runOpen([coveredCall], hundred, 0).approved).toEqual([coveredCall]);
    expect(runOpen([coveredCall], hundred, 100).refused).toEqual([
      { intent: coveredCall, reason: "call-not-covered" },
    ]);
  });
});
