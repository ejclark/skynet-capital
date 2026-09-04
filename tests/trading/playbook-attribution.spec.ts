import {
  type AttributableOutcome,
  indexPlaybookTags,
  playbookTagsFromOutcomes,
} from "../../src/trading/playbook-attribution.js";

/**
 * Closing the #885 attribution gap: `OrderIntent.playbookId` must survive to a tag keyed by the
 * broker's own order id, so a fill/round-trip can later be joined back to the playbook that drove
 * it. `AttributableOutcome` is structurally satisfied by `IntentOutcome` — no import of the
 * autonomous layer's types needed to prove the join is correct.
 */
describe("playbookTagsFromOutcomes", () => {
  it("tags an outcome that both reached the broker and carried playbook attribution", () => {
    const outcomes: AttributableOutcome[] = [
      {
        intent: { playbookId: "S1-NVDA", playbookMode: "standard" },
        result: { orderId: "o1" },
      },
    ];
    expect(playbookTagsFromOutcomes(outcomes)).toEqual([
      { orderId: "o1", playbookId: "S1-NVDA", playbookMode: "standard" },
    ]);
  });

  it("omits playbookMode when the intent carried none", () => {
    const outcomes: AttributableOutcome[] = [
      { intent: { playbookId: "S1-NVDA" }, result: { orderId: "o1" } },
    ];
    expect(playbookTagsFromOutcomes(outcomes)).toEqual([{ orderId: "o1", playbookId: "S1-NVDA" }]);
  });

  it("drops a bare persona reflex with no playbookId at all", () => {
    const outcomes: AttributableOutcome[] = [{ intent: {}, result: { orderId: "o1" } }];
    expect(playbookTagsFromOutcomes(outcomes)).toEqual([]);
  });

  it("drops an outcome the broker never assigned an order id to (cooldown-skip, observe, a bare rejection)", () => {
    const outcomes: AttributableOutcome[] = [
      { intent: { playbookId: "S1-NVDA" } }, // no `result` at all
      { intent: { playbookId: "S1-NVDA" }, result: {} }, // result present, but no orderId
    ];
    expect(playbookTagsFromOutcomes(outcomes)).toEqual([]);
  });
});

describe("indexPlaybookTags", () => {
  it("looks up a tag by order id", () => {
    const byOrder = indexPlaybookTags([{ orderId: "o1", playbookId: "S1-NVDA" }]);
    expect(byOrder.get("o1")).toEqual({ orderId: "o1", playbookId: "S1-NVDA" });
    expect(byOrder.get("o2")).toBeUndefined();
  });
});
