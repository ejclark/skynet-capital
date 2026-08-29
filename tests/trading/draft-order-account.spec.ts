import { addLeg, emptyDraft, type NewLeg } from "../../src/trading/draft-order.js";
import { validateDraftAccount } from "../../src/trading/draft-order-account.js";

/**
 * The account-facing half of slice 2: given what `draftRequirements` says a leg set demands,
 * does THIS account actually have it. `draft-order.spec.ts` already covers what gets demanded
 * (naked vs. capped legs, cash vs. shares); these cases are about the comparison and the
 * refusal wording.
 */

const NAKED_CALL: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
};
const NAKED_PUT: NewLeg = { ...NAKED_CALL, optionType: "put", strike: 150 };

function accountWith(cash: number, shares = 0, symbol = "NVDA") {
  return {
    cash,
    positions: shares > 0 ? [{ symbol, quantity: shares, avgPrice: 100, marketValue: 0 }] : [],
  };
}

describe("validateDraftAccount", () => {
  it("passes a naked short call covered by exactly enough held shares", () => {
    const verdict = validateDraftAccount(addLeg(emptyDraft(), NAKED_CALL), accountWith(0, 100));

    expect(verdict).toEqual({ ok: true, refusals: [], warnings: [] });
  });

  it("refuses a naked short call short on shares, and names the shortfall", () => {
    const verdict = validateDraftAccount(addLeg(emptyDraft(), NAKED_CALL), accountWith(0, 40));

    expect(verdict.ok).toBe(false);
    expect(verdict.refusals[0]).toMatch(/needs 100 held and you hold 40/);
    expect(verdict.refusals[0]).toMatch(/never sells naked calls/);
  });

  it("passes a naked short put backed by exactly the strike in cash", () => {
    const verdict = validateDraftAccount(addLeg(emptyDraft(), NAKED_PUT), accountWith(150 * 100));

    expect(verdict.ok).toBe(true);
  });

  it("refuses a naked short put short on cash, and names both numbers", () => {
    const verdict = validateDraftAccount(addLeg(emptyDraft(), NAKED_PUT), accountWith(1_000));

    expect(verdict.ok).toBe(false);
    expect(verdict.refusals[0]).toMatch(/needs \$15,000 set aside and you have \$1,000/);
  });

  it("checks shares against the right underlying, not just any held quantity", () => {
    const verdict = validateDraftAccount(
      addLeg(emptyDraft(), NAKED_CALL),
      accountWith(0, 100, "AAPL"),
    );

    expect(verdict.ok).toBe(false);
  });

  it("passes an empty draft — nothing demanded, nothing to check", () => {
    expect(validateDraftAccount(emptyDraft(), accountWith(0))).toEqual({
      ok: true,
      refusals: [],
      warnings: [],
    });
  });

  it("can refuse on both cash and shares at once, for a two-underlying naked draft", () => {
    const draft = addLeg(addLeg(emptyDraft(), NAKED_CALL), {
      ...NAKED_PUT,
      underlying: "AAPL",
    });

    const verdict = validateDraftAccount(draft, accountWith(0, 0));

    expect(verdict.ok).toBe(false);
    expect(verdict.refusals).toHaveLength(2);
  });
});
