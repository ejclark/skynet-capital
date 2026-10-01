import { type DraftLeg, legOnSameContract, type NewLeg } from "../../app/src/live/draft-order";

/** The one decision the multi-leg builder makes before it posts (#3407): is this chain tap a new
 *  leg, or the price for a leg the draft already holds? Everything else about a draft is the
 *  server's answer, so this selector is the only part with a spec. */

const held: DraftLeg = {
  id: "leg-1",
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 2,
  limitPrice: 4.2,
};

const pick = (over: Partial<NewLeg> = {}): NewLeg => {
  const { id: _id, ...base } = held;
  return { ...base, ...over };
};

describe("legOnSameContract", () => {
  it("finds the held leg a tap on the same contract, side and size is asking to reprice", () => {
    expect(legOnSameContract([held], pick({ limitPrice: 4.35 }))?.id).toBe("leg-1");
  });

  it("matches the underlying case-insensitively, as the state machine normalizes it", () => {
    expect(legOnSameContract([held], pick({ underlying: " nvda " }))?.id).toBe("leg-1");
  });

  it("finds nothing for the other side of the same contract — that is a second leg", () => {
    expect(legOnSameContract([held], pick({ action: "buy" }))).toBeUndefined();
  });

  it("finds nothing at a different size — that is the resize the add's refusal is about", () => {
    expect(legOnSameContract([held], pick({ contracts: 3 }))).toBeUndefined();
  });

  it.each([
    ["strike", pick({ strike: 182.5 })],
    ["expiration", pick({ expiration: "2026-10-16" })],
    ["option type", pick({ optionType: "put" })],
    ["underlying", pick({ underlying: "AMD" })],
  ])("finds nothing when the %s differs — a different contract entirely", (_what, candidate) => {
    expect(legOnSameContract([held], candidate)).toBeUndefined();
  });

  it("ignores the price when matching, so a tap at the leg's own price still finds it", () => {
    expect(legOnSameContract([held], pick({ limitPrice: 4.2 }))?.id).toBe("leg-1");
    const { limitPrice: _unpriced, ...atMarket } = pick();
    expect(legOnSameContract([held], atMarket)?.id).toBe("leg-1");
  });

  it("picks the matching leg out of a multi-leg draft, not the first one", () => {
    const other: DraftLeg = { ...held, id: "leg-2", strike: 200, action: "buy", limitPrice: 1.1 };
    expect(legOnSameContract([other, held], pick({ limitPrice: 4.5 }))?.id).toBe("leg-1");
  });

  it("finds nothing in an empty draft", () => {
    expect(legOnSameContract([], pick())).toBeUndefined();
  });
});
