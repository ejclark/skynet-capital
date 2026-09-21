import { addLeg, emptyDraft, type NewLeg } from "../../src/trading/draft-order.js";
import { draftRequirements } from "../../src/trading/draft-order-requirements.js";

/**
 * Slice 2's pure half: given a leg set alone (no account), what does it demand in dollars and
 * shares. `draft-order-account.spec.ts` covers the comparison against a real account; these cases
 * are about the arithmetic itself — naked vs. capped legs, calls vs. puts, cash vs. shares.
 */

const SHORT_CALL: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
};
const HIGHER_CALL: NewLeg = { ...SHORT_CALL, strike: 200, action: "buy" };
const SHORT_PUT: NewLeg = { ...SHORT_CALL, optionType: "put", strike: 150 };
const LOWER_PUT: NewLeg = { ...SHORT_PUT, strike: 130, action: "buy" };

describe("draftRequirements", () => {
  it("demands 100 shares per contract for a naked short call, no cash", () => {
    const { cash, sharesByUnderlying } = draftRequirements(addLeg(emptyDraft(), SHORT_CALL));

    expect(cash).toBe(0);
    expect(sharesByUnderlying).toEqual(new Map([["NVDA", 100]]));
  });

  it("demands the strike width in cash for a capped call spread, no shares", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_CALL), HIGHER_CALL);
    const { cash, sharesByUnderlying } = draftRequirements(spread);

    expect(cash).toBe((200 - 180) * 100);
    expect(sharesByUnderlying.size).toBe(0);
  });

  it("demands the full strike in cash for a naked short put, same as a single-leg CSP", () => {
    const { cash, sharesByUnderlying } = draftRequirements(addLeg(emptyDraft(), SHORT_PUT));

    expect(cash).toBe(150 * 100);
    expect(sharesByUnderlying.size).toBe(0);
  });

  it("demands only the spread's width in cash for a capped put spread", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_PUT), LOWER_PUT);
    const { cash } = draftRequirements(spread);

    expect(cash).toBe((150 - 130) * 100);
  });

  it("demands nothing from an all-long draft — the debit is checked at execution time", () => {
    const longs = addLeg(addLeg(emptyDraft(), { ...SHORT_CALL, action: "buy" }), {
      ...SHORT_PUT,
      action: "buy",
    });
    const { cash, sharesByUnderlying } = draftRequirements(longs);

    expect(cash).toBe(0);
    expect(sharesByUnderlying.size).toBe(0);
  });

  it("tracks shares per underlying separately, for an iron-condor-shaped four-legger", () => {
    const condor = addLeg(
      addLeg(addLeg(addLeg(emptyDraft(), SHORT_CALL), HIGHER_CALL), SHORT_PUT),
      LOWER_PUT,
    );
    const { cash, sharesByUnderlying } = draftRequirements(condor);

    // Both spreads are capped: no naked call, so no shares demanded at all.
    expect(sharesByUnderlying.size).toBe(0);
    expect(cash).toBe((200 - 180) * 100 + (150 - 130) * 100);
  });

  it("demands nothing for a sell that closes a contract the account holds long (a roll's first leg)", () => {
    const sellToClose = addLeg(emptyDraft(), SHORT_CALL);
    const bare = draftRequirements(sellToClose);
    expect(bare.sharesByUnderlying.get("NVDA")).toBe(100);
    const closing = draftRequirements(sellToClose, new Map([["NVDA260918C00180000", 1]]));
    expect(closing.cash).toBe(0);
    expect(closing.sharesByUnderlying.size).toBe(0);
    // Holding fewer than the leg sells is still a new short for the whole leg.
    const partial = draftRequirements(
      addLeg(emptyDraft(), { ...SHORT_CALL, contracts: 2 }),
      new Map([["NVDA260918C00180000", 1]]),
    );
    expect(partial.sharesByUnderlying.get("NVDA")).toBe(200);
  });

  it("has nothing to demand from an empty draft", () => {
    const { cash, sharesByUnderlying } = draftRequirements(emptyDraft());

    expect(cash).toBe(0);
    expect(sharesByUnderlying.size).toBe(0);
  });
});
