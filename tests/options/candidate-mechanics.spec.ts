import { describeMechanics, type MechanicsContext } from "../../src/options/candidate-mechanics.js";
import type { OptionLeg } from "../../src/options/payoff-surface.js";
import type { StructureKind } from "../../src/options/structure-candidates.js";
import { type RiskHorizon, structureRisk } from "../../src/options/structure-risk.js";

/**
 * The explanation is the one place this engine could quietly turn into advice, so it is tested as a
 * boundary and not as prose. Two things are asserted: the sentence says WHERE the structure makes
 * money and what it can lose (including "not capped" when that is the truth), and no sentence it
 * can produce contains second-person or instruction-shaped language.
 */

const EXPIRY_DAYS = 30;
const HORIZON: RiskHorizon = { spot: 100, daysForward: EXPIRY_DAYS, volatility: 0.25, rate: 0 };
const CONTEXT: MechanicsContext = { symbol: "NVDA", horizon: HORIZON, expiration: "2026-09-18" };

/** Every phrasing this module can emit has to clear these. They are the constraint, not a style. */
const ADVICE_SHAPED = [
  /\byou\b/i,
  /\byour\b/i,
  /\bshould\b/i,
  /\brecommend/i,
  /\bsuggest/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bbest\b/i,
  /\bworth (buying|owning|a trade)\b/i,
];

const call = (over: Partial<OptionLeg> = {}): OptionLeg => ({
  kind: "call",
  quantity: 1,
  strike: 100,
  daysToExpiry: EXPIRY_DAYS,
  volatility: 0.25,
  entryPrice: 3.5,
  ...over,
});

const put = (over: Partial<OptionLeg> = {}): OptionLeg => ({
  kind: "put",
  quantity: -1,
  strike: 95,
  daysToExpiry: EXPIRY_DAYS,
  volatility: 0.25,
  entryPrice: 2,
  ...over,
});

function sentence(kind: StructureKind, legs: readonly OptionLeg[], context = CONTEXT): string {
  const risk = structureRisk(legs, context.horizon);
  if (!risk) throw new Error("expected a risk profile");
  return describeMechanics(kind, legs, risk, context);
}

describe("describeMechanics — what the structure does, never what to do", () => {
  it("names the structure, its legs, its expiry and where it is above water", () => {
    const text = sentence("long-call", [call()]);
    expect(text).toContain("Long call on NVDA");
    expect(text).toContain("long 1 NVDA 100 call");
    expect(text).toContain("expiring 2026-09-18");
    expect(text).toContain("At 30 days out it profits if NVDA is above $103.50");
  });

  it("says a loss is NOT CAPPED when it is not capped", () => {
    const text = sentence("short-strangle", [
      put(),
      call({ quantity: -1, strike: 105, entryPrice: 2 }),
    ]);
    expect(text).toContain("profits if NVDA is between $91.00 and $109.00");
    expect(text).toContain("the most it can lose is not capped");
  });

  it("states both sides of a defined-risk structure in the same breath", () => {
    const text = sentence("bull-call-spread", [
      call(),
      call({ quantity: -1, strike: 110, entryPrice: 1.2 }),
    ]);
    expect(text).toMatch(/the most it can make is \$770\.00 and the most it can lose is \$230\.00/);
  });

  it("carries the educational, paper-only disclosure in the sentence itself", () => {
    expect(sentence("long-call", [call()])).toContain(
      "educational, paper trading, not financial advice",
    );
  });

  it("falls back to the horizon alone when the chain carried no expiry date", () => {
    const text = sentence("long-call", [call()], { symbol: "NVDA", horizon: HORIZON });
    expect(text).not.toContain("expiring");
    expect(text).toContain("At 30 days out");
  });

  it("emits no advice-shaped language for any structure it can describe", () => {
    const shapes: readonly (readonly [StructureKind, readonly OptionLeg[]])[] = [
      ["long-call", [call()]],
      ["long-put", [put({ quantity: 1, strike: 100, entryPrice: 3 })]],
      ["bull-call-spread", [call(), call({ quantity: -1, strike: 110, entryPrice: 1.2 })]],
      ["short-put-spread", [put(), put({ quantity: 1, strike: 90, entryPrice: 1 })]],
      ["short-strangle", [put(), call({ quantity: -1, strike: 105, entryPrice: 2 })]],
      [
        "long-call-butterfly",
        [
          call({ strike: 90, entryPrice: 12 }),
          call({ quantity: -2, strike: 100, entryPrice: 3.5 }),
          call({ strike: 110, entryPrice: 1.2 }),
        ],
      ],
    ];
    for (const [kind, legs] of shapes) {
      const text = sentence(kind, legs);
      for (const pattern of ADVICE_SHAPED) {
        expect({ kind, matched: pattern.test(text) }).toEqual({ kind, matched: false });
      }
    }
  });
});
