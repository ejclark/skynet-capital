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
