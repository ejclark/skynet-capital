import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
  Position,
} from "../../src/domain/types.js";
import {
  applyGuardsWithVerdicts,
  type GuardResult,
  type RiskConfig,
} from "../../src/engine/guards.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * BYTE-IDENTITY: the option guards changed nothing for a share-only cycle with no short options.
 *
 * Before the batch ledger, every intent was guarded against the cycle's starting book with no
 * memory of its siblings — so a batch's verdict was exactly the verdicts of its intents run one at
 * a time, concatenated in order. That is the property pinned here, over seeded batches drawn from
 * the same shapes `guards.spec.ts` exercises (cash, holdings, subscriptions with budgets and
 * filters, baskets, compounding, the ladder, S2/E1). Each single-intent verdict is the old code
 * path line for line — `guards.spec.ts` pins those — so equality here is equality with before.
 * A held LONG contract promises nothing and keeps the property; a held short breaks it on purpose,
 * which the last spec shows so the property cannot pass vacuously.
 */

/** Deterministic PRNG (mulberry32) — a failing seed reproduces exactly. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const pick = <T>(rand: () => number, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)] as T;

const SYMBOLS = ["EEM", "MSFT", "NVDA", "NOQUOTE"] as const;
const LONG_CALL = "NVDA261113C00240000";
const CALENDAR: readonly EarningsPrint[] = [
  { symbol: "EEM", date: "2026-08-26", status: "estimate", source: "test" },
];
const subscription = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "acct-1",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
  ...overrides,
});

const CONFIGS: readonly RiskConfig[] = [
  { maxPositionPct: 0.2 },
  { maxPositionPct: 1, subscriptions: [subscription()] },
  { maxPositionPct: 1, subscriptions: [subscription({ symbols: ["EEM"] })] },
  {
    maxPositionPct: 1,
    subscriptions: [subscription({ playbookId: "BASKET-1" })],
    playbookSymbols: new Map([["BASKET-1", ["EEM", "MSFT"]]]),
  },
  {
    maxPositionPct: 1,
    subscriptions: [subscription({ compoundAllocation: true })],
    realizedPlForPlaybook: () => 3_000,
  },
  { maxPositionPct: 0.2, accountTier: "restricted" },
  { maxPositionPct: 0.2, discipline: { calendar: CALENDAR } },
];
const ASOFS = ["2026-07-24T14:30:00Z", "2026-08-25T15:00:00.000Z", "2026-08-14T13:35:00.000Z"];

function aBatch(rand: () => number): readonly OrderIntent[] {
  const size = 1 + Math.floor(rand() * 6);
  return Array.from({ length: size }, () => ({
    symbol: pick(rand, SYMBOLS),
    side: pick(rand, ["buy", "sell"] as const),
    quantity: pick(rand, [1, 10, 30, 500, 10_000]),
    type: "market" as const,
    reason: "property",
    ...(rand() < 0.5
      ? {
          playbookId: pick(rand, ["S1-NVDA", "BASKET-1", "G1-GOOG"]),
          playbookMode: "standard" as const,
        }
      : {}),
    ...(rand() < 0.2 ? { urgent: true } : {}),
    ...(rand() < 0.2 ? { allowThroughPrint: true } : {}),
  }));
}

function aBook(rand: () => number): Portfolio {
  const positions: Position[] = [];
  for (const symbol of ["EEM", "MSFT", "NVDA"]) {
    if (rand() < 0.5)
      positions.push(aPosition({ symbol, quantity: pick(rand, [5, 30, 60, 3_000]) }));
  }
  // A held LONG contract: valued ×100 in equity, but it promises no cash and no shares.
  if (rand() < 0.3) positions.push(aPosition({ symbol: LONG_CALL, quantity: 2, avgPrice: 5 }));
  return aPortfolio({ cash: pick(rand, [0, 2_000, 10_000, 1_000_000]), positions });
}

const aMarket = (rand: () => number): MarketContext =>
  aContext({ EEM: { last: 100 }, MSFT: { last: 50 }, NVDA: { last: 180 } }, pick(rand, ASOFS));

/** The pre-ledger semantics: each intent alone against the starting book, verdicts concatenated. */
function oneAtATime(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig,
): GuardResult {
  const each = intents.map((i) => applyGuardsWithVerdicts([i], portfolio, context, config));
  return {
    approved: each.flatMap((r) => r.approved),
    refused: each.flatMap((r) => r.refused),
  };
}

describe("guards — byte identity for share-only cycles with no short options", () => {
  it("every batch's verdict equals its intents' verdicts one at a time, over 600 seeded batches", () => {
    let compared = 0;
    for (let seed = 1; seed <= 600; seed += 1) {
      const rand = prng(seed);
      const intents = aBatch(rand);
      const portfolio = aBook(rand);
      const context = aMarket(rand);
      const config = pick(rand, CONFIGS);
      const batch = applyGuardsWithVerdicts(intents, portfolio, context, config);
      expect({ seed, ...batch }).toEqual({
        seed,
        ...oneAtATime(intents, portfolio, context, config),
      });
      compared += intents.length;
    }
    expect(compared).toBeGreaterThan(1_500);
  });

  it("the property is not vacuous: with a sold put on the book, two buys stop being independent", () => {
    const portfolio = aPortfolio({
      cash: 10_000,
      positions: [aPosition({ symbol: "CRWV261106P00085000", quantity: -1, avgPrice: 2 })],
    });
    const context = aContext({ NVDA: { last: 100 } });
    const buy: OrderIntent = {
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "t",
    };
    const config = { maxPositionPct: 1 };
    expect(applyGuardsWithVerdicts([buy, buy], portfolio, context, config)).not.toEqual(
      oneAtATime([buy, buy], portfolio, context, config),
    );
  });
});
