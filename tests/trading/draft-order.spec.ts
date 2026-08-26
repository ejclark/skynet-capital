import {
  addLeg,
  type DraftOrder,
  draftSymbols,
  emptyDraft,
  MAX_LEGS,
  type NewLeg,
  removeLeg,
  repriceLeg,
  review,
  submitDraft,
  undefinedRiskLegs,
  validate,
} from "../../src/trading/draft-order.js";

/**
 * The multi-leg draft, tested through the lifecycle a member actually walks rather than through
 * each function in isolation.
 *
 * The invariant most of these cases exist to protect: **you cannot edit your way past a check.**
 * A validated draft is a claim about one specific set of legs, so any change to the legs must
 * discard it — otherwise the review screen renders a stale pass as a current one, which is the
 * one failure here that could put an order in front of a member under a number that was never
 * true of it.
 */

const CALL: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
  limitPrice: 4.2,
};
const HIGHER_CALL: NewLeg = { ...CALL, strike: 200, action: "buy", limitPrice: 1.1 };

const OK = { ok: true, refusals: [], warnings: [] };
const FAILS = { ok: false, refusals: ["Not enough collateral."], warnings: [] };

/** A validated vertical spread — the shortest path to the interesting states. */
function validatedSpread(): DraftOrder {
  return validate(addLeg(addLeg(emptyDraft(), CALL), HIGHER_CALL), OK);
}

describe("the draft — building it", () => {
  it("starts empty and becomes a draft on the first leg", () => {
    expect(emptyDraft().phase).toBe("empty");
    expect(addLeg(emptyDraft(), CALL).phase).toBe("drafting");
  });

  it("gives each leg an id that is never reused, so a stale id can't hit a different leg", () => {
    const two = addLeg(addLeg(emptyDraft(), CALL), HIGHER_CALL);
    const removed = removeLeg(two, "leg-1");
    const readded = addLeg(removed, CALL);

    expect(two.legs.map((l) => l.id)).toEqual(["leg-1", "leg-2"]);
    expect(readded.legs.map((l) => l.id)).toEqual(["leg-2", "leg-3"]);
  });

  it("returns to empty when the last leg is removed", () => {
    expect(removeLeg(addLeg(emptyDraft(), CALL), "leg-1").phase).toBe("empty");
  });

  it("refuses a leg whose numbers aren't real, and leaves the draft untouched", () => {
    const draft = addLeg(emptyDraft(), { ...CALL, contracts: 0, strike: -5 });

    expect(draft.legs).toEqual([]);
    expect(draft.refusals).toHaveLength(2);
  });

  it("refuses a fifth leg rather than dropping it, since the broker takes four", () => {
    let draft = emptyDraft();
    for (let i = 0; i < MAX_LEGS; i++) {
      draft = addLeg(draft, { ...CALL, strike: 100 + i });
    }
    const over = addLeg(draft, { ...CALL, strike: 300 });

    expect(draft.legs).toHaveLength(MAX_LEGS);
    expect(over.legs).toHaveLength(MAX_LEGS);
    expect(over.refusals[0]).toContain(`at most ${MAX_LEGS}`);
  });

  it("refuses the same contract on the same side twice — that's a resize, not a leg", () => {
    const dup = addLeg(addLeg(emptyDraft(), CALL), { ...CALL, contracts: 3 });

    expect(dup.legs).toHaveLength(1);
    expect(dup.refusals[0]).toContain("already in this order");
  });

  it("allows the same contract on OPPOSITE sides — that is a real, if flat, structure", () => {
    const both = addLeg(addLeg(emptyDraft(), CALL), { ...CALL, action: "buy" });

    expect(both.legs).toHaveLength(2);
  });

  it("refuses to touch a leg that isn't in the order", () => {
    const draft = addLeg(emptyDraft(), CALL);

    expect(removeLeg(draft, "leg-9").refusals[0]).toContain("isn't part of this order");
    expect(repriceLeg(draft, "leg-9", 1).refusals[0]).toContain("isn't part of this order");
  });
});

describe("the draft — repricing", () => {
  it("changes one leg's limit and leaves the others alone", () => {
    const draft = repriceLeg(addLeg(addLeg(emptyDraft(), CALL), HIGHER_CALL), "leg-1", 5.5);

    expect(draft.legs[0]?.limitPrice).toBe(5.5);
    expect(draft.legs[1]?.limitPrice).toBe(1.1);
  });

  it("drops the limit entirely for an at-market reprice, rather than leaving a hollow key", () => {
    const draft = repriceLeg(addLeg(emptyDraft(), CALL), "leg-1", undefined);

    expect(draft.legs[0]).not.toHaveProperty("limitPrice");
  });

  it("refuses a limit of zero or worse — a premium is a price, not a placeholder", () => {
    const draft = addLeg(emptyDraft(), CALL);

    expect(repriceLeg(draft, "leg-1", 0).legs[0]?.limitPrice).toBe(4.2);
    expect(repriceLeg(draft, "leg-1", Number.NaN).refusals).toHaveLength(1);
  });
});

describe("the draft — you cannot edit your way past a check", () => {
  it("holds a passing verdict while nothing changes", () => {
    const validated = validatedSpread();

    expect(validated.phase).toBe("validated");
    expect(validated.verdict?.ok).toBe(true);
  });

  it.each([
    ["a leg is added", (d: DraftOrder) => addLeg(d, { ...CALL, strike: 210, action: "buy" })],
    ["a leg is removed", (d: DraftOrder) => removeLeg(d, "leg-1")],
    ["a leg is repriced", (d: DraftOrder) => repriceLeg(d, "leg-1", 9.9)],
  ])("drops back to drafting and discards the verdict when %s", (_label, edit) => {
    const edited = edit(validatedSpread());

    expect(edited.phase).toBe("drafting");
    expect(edited.verdict).toBeUndefined();
  });

  it("blocks the review screen on a draft that was edited after passing", () => {
    const edited = repriceLeg(validatedSpread(), "leg-1", 9.9);

    expect(review(edited).phase).toBe("drafting");
    expect(review(edited).refusals[0]).toContain("hasn't been checked");
  });

  it("keeps a FAILING verdict visible instead of looking unchecked", () => {
    // "We checked and it fails" and "we have not checked" must not render the same.
    const failed = validate(addLeg(addLeg(emptyDraft(), CALL), HIGHER_CALL), FAILS);

    expect(failed.phase).toBe("drafting");
    expect(failed.verdict?.ok).toBe(false);
    expect(failed.refusals).toEqual(["Not enough collateral."]);
  });

  it("refuses to validate a one-leg draft — that is the single-play ticket's job", () => {
    expect(validate(addLeg(emptyDraft(), CALL), OK).phase).toBe("drafting");
    expect(validate(addLeg(emptyDraft(), CALL), OK).refusals[0]).toContain("at least two legs");
  });
});

describe("the draft — the review screen is the only path to an order", () => {
  it("walks validated to reviewed to submitted", () => {
    expect(submitDraft(review(validatedSpread())).phase).toBe("submitted");
  });

  it("refuses to fire straight from validated, skipping the review", () => {
    const skipped = submitDraft(validatedSpread());

    expect(skipped.phase).toBe("validated");
    expect(skipped.refusals[0]).toContain("only sent from the review screen");
  });

  it("refuses to fire a draft that was never checked", () => {
    expect(submitDraft(addLeg(emptyDraft(), CALL)).phase).toBe("drafting");
  });

  it("refuses every edit once the order is gone", () => {
    const sent = submitDraft(review(validatedSpread()));

    for (const after of [
      addLeg(sent, HIGHER_CALL),
      removeLeg(sent, "leg-1"),
      repriceLeg(sent, "leg-1", 1),
      validate(sent, OK),
    ]) {
      expect(after.phase).toBe("submitted");
      expect(after.refusals[0]).toContain("already sent");
    }
  });
});

describe("the draft — what carries unlimited loss", () => {
  it("names a bare short call, which has no ceiling at all", () => {
    const bare = addLeg(addLeg(emptyDraft(), CALL), { ...CALL, strike: 170, optionType: "put" });

    expect(undefinedRiskLegs(bare).map((l) => l.id)).toEqual(["leg-1"]);
  });

  it("clears a short call capped by a long call above it", () => {
    expect(undefinedRiskLegs(validatedSpread())).toEqual([]);
  });

  it("still names it when the cap sits BELOW the short strike, where it caps nothing", () => {
    const inverted = addLeg(addLeg(emptyDraft(), CALL), {
      ...CALL,
      strike: 170,
      action: "buy",
    });

    expect(undefinedRiskLegs(inverted).map((l) => l.id)).toEqual(["leg-1"]);
  });

  it("still names it when the cap expires first, leaving the short bare for the rest", () => {
    const calendar = addLeg(addLeg(emptyDraft(), CALL), {
      ...HIGHER_CALL,
      expiration: "2026-08-21",
    });

    expect(undefinedRiskLegs(calendar).map((l) => l.id)).toEqual(["leg-1"]);
  });

  it("still names it when the cap covers fewer contracts than the short", () => {
    const short = addLeg(addLeg(emptyDraft(), { ...CALL, contracts: 5 }), HIGHER_CALL);

    expect(undefinedRiskLegs(short).map((l) => l.id)).toEqual(["leg-1"]);
  });

  it("says nothing about a short PUT, whose loss is bounded by the strike", () => {
    const put = addLeg(emptyDraft(), { ...CALL, optionType: "put" });

    expect(undefinedRiskLegs(put)).toEqual([]);
  });
});

describe("the draft — the symbols it would send", () => {
  it("renders each leg as its OCC symbol, in leg order", () => {
    expect(draftSymbols(validatedSpread())).toEqual(["NVDA260918C00180000", "NVDA260918C00200000"]);
  });

  it("has nothing to send from an empty draft", () => {
    expect(draftSymbols(emptyDraft())).toEqual([]);
  });
});
