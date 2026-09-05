import fc from "fast-check";
import type { OptionTicketContext, OptionTicketRequest } from "../../src/trading/option-ticket.js";
import { previewOptionOrder } from "../../src/trading/option-ticket.js";

/**
 * PROPERTY-BASED PROOF of the two invariants `previewOptionOrder`'s own header names as the whole
 * point of this module: a cash-secured put is refused when the cash isn't there, and a covered
 * call is refused when the shares aren't held. "No naked premium from this desk, ever" — the file
 * says so in prose; this is that claim as a checkable property over a generated space, not three
 * hand-picked examples.
 *
 * WHY THIS FILE EXISTS (2026-08-29, Eric's directive). `envelope.json`'s `diffAware` exemption
 * already gates `option-ticket.ts` on DIFF SHAPE — a pure insertion with no new mutating call
 * skips the hold. That is real progress ("gate the verb, not the file"), but it is still a
 * SYNTACTIC proxy: it disqualifies any diff that removes or reshapes a line, including a
 * behavior-preserving one. `#628`'s `option-symbols.ts` regex promotion is the exact near-miss —
 * it removed two local `const` declarations to import the same regexes from elsewhere, changed
 * zero behavior, and would still have failed `additiveSafe` today, because removal is removal.
 *
 * A property suite is the next rung: instead of asking "did this diff only add lines", ask
 * "does the invariant this file exists to enforce still hold, checked against thousands of
 * generated accounts, not the ones a reviewer thought to write by hand." That is evidence about
 * BEHAVIOR, which is the thing envelope.json actually cares about — the file is just the current,
 * blunter proxy for it.
 *
 * This suite does not change what envelope-scan.mjs exempts — see the plan issue this PR links —
 * because widening what may bypass a human hold on money-moving code is Eric's call
 * (`CLAUDE.md` → *Hard boundaries*), not something a diff earns for itself by adding tests. What
 * IS mine to build, unprompted, any time: the verification that makes that call an informed one.
 */

/**
 * An account: cash and a set of held stock positions.
 *
 * `fc.uniqueArray` on `symbol`, not a plain `fc.array` — the first draft allowed two entries for
 * the same symbol and immediately found a "counterexample" for the covered-call property: with
 * NVDA held as both 0 and 100 shares, `heldShares()` (a `.find()`, not a sum) saw only the first
 * row and refused a call the naive "add up every NVDA row" model expected to clear. That is not a
 * bug in `heldShares` — `TicketHolding[]` is built from Alpaca's `/v2/positions`, a brokerage's
 * net-holding ledger, which cannot return two rows for one symbol by construction. The generator
 * was producing a shape no real caller can ever hand this function. Constraining it to match the
 * real contract is the fix, not patching `heldShares` to tolerate an input it will never receive.
 */
const contextArb: fc.Arbitrary<OptionTicketContext> = fc.record({
  cash: fc.double({ min: 0, max: 10_000_000, noNaN: true }),
  positions: fc.uniqueArray(
    fc.record({
      symbol: fc.constantFrom("NVDA", "AAPL", "KO", "MSFT"),
      quantity: fc.integer({ min: 0, max: 100_000 }),
      avgPrice: fc.double({ min: 0.01, max: 10_000, noNaN: true }),
      marketValue: fc.double({ min: 0, max: 10_000_000, noNaN: true }),
    }),
    { maxLength: 4, selector: (p) => p.symbol },
  ),
  tradingEnabled: fc.constant(true),
  isSelf: fc.constant(true),
});

const requestArb = (code: "201" | "202"): fc.Arbitrary<OptionTicketRequest> =>
  fc.record({
    code: fc.constant(code),
    underlying: fc.constant("NVDA"),
    contracts: fc.integer({ min: 1, max: 50 }),
    strike: fc.double({ min: 1, max: 2000, noNaN: true }),
    expiration: fc.constant("2026-12-18"),
    orderType: fc.constant("market" as const),
  });

describe("property: a cash-secured put is never approved uncovered", () => {
  it("refuses whenever the required collateral exceeds cash on hand, for any account", () => {
    fc.assert(
      fc.property(contextArb, requestArb("201"), (context, request) => {
        // Same association as production (option-economics.ts: strike * scale, scale = contracts * 100).
        // (strike * contracts) * 100 rounds differently at the boundary and CI hit the counterexample
        // strike 1999.9999999999995 × 50 vs cash 9999999.999999996 (#1377): a one-ulp disagreement
        // between the test's premise and the code's check, not a real refusal.
        const collateral = request.strike * (request.contracts * 100);
        const preview = previewOptionOrder(request, context);
        if (collateral > context.cash) {
          expect(preview.ok).toBe(false);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("never refuses on affordability grounds when the collateral is fully covered", () => {
    fc.assert(
      fc.property(contextArb, requestArb("201"), (context, request) => {
        // Same association as production (option-economics.ts: strike * scale, scale = contracts * 100).
        // (strike * contracts) * 100 rounds differently at the boundary and CI hit the counterexample
        // strike 1999.9999999999995 × 50 vs cash 9999999.999999996 (#1377): a one-ulp disagreement
        // between the test's premise and the code's check, not a real refusal.
        const collateral = request.strike * (request.contracts * 100);
        fc.pre(collateral <= context.cash);
        const preview = previewOptionOrder(request, context);
        expect(preview.refusals.some((r) => r.includes("Cash-secured"))).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

describe("property: a covered call is never approved naked", () => {
  it("refuses whenever held shares fall short of the contracts sold, for any account", () => {
    fc.assert(
      fc.property(contextArb, requestArb("202"), (context, request) => {
        const needed = request.contracts * 100;
        const held = Math.max(0, context.positions.find((p) => p.symbol === "NVDA")?.quantity ?? 0);
        const preview = previewOptionOrder(request, context);
        if (held < needed) {
          expect(preview.ok).toBe(false);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("never refuses on coverage grounds once enough shares are held", () => {
    fc.assert(
      fc.property(contextArb, requestArb("202"), (context, request) => {
        const needed = request.contracts * 100;
        const held = Math.max(0, context.positions.find((p) => p.symbol === "NVDA")?.quantity ?? 0);
        fc.pre(held >= needed);
        const preview = previewOptionOrder(request, context);
        expect(preview.refusals.some((r) => r.includes("Covered means"))).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});
