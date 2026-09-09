import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";

/** The bot's mind as data: run-row status at a glance, guard work shown, reasons verbatim. */

const intent = (over: Record<string, unknown> = {}) => ({
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 10,
  type: "market" as const,
  reason: "momentum continuation above the shelf",
  ...over,
});

const record = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1_750_000_000_000,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [intent()],
  guardedIntents: [intent()],
  outcomes: [{ intent: intent(), action: "observed" }],
  ...over,
});

describe("decisionCyclesView", () => {
  it("derives the run-row status: halted > placed > rejected > observed > quiet", () => {
    expect(decisionCyclesView([record({ halted: "kill switch engaged" })])[0]).toMatchObject({
      status: "halted",
      headline: "kill switch engaged",
    });
    expect(
      decisionCyclesView([
        record({
          outcomes: [
            {
              intent: intent(),
              action: "placed",
              result: { intent: intent(), status: "filled" },
            },
            {
              intent: intent(),
              action: "rejected",
              result: { intent: intent(), status: "rejected" },
            },
          ],
        }),
      ])[0]?.status,
    ).toBe("placed");
    expect(
      decisionCyclesView([record({ rawIntents: [], guardedIntents: [], outcomes: [] })])[0],
    ).toMatchObject({ status: "quiet", headline: "no signals fired — watching" });
  });

  it("distinguishes a total guard refusal from quiet — the persona fired and every intent was dropped", () => {
    // rawIntents > 0 but guardedIntents/outcomes are both empty: applyGuards dropped everything
    // (ladder BLOCK, S2/E1, position cap all `continue` with no trace) — a real signal the house's
    // own risk policy overrode, not silence. Before this PR this rendered as "quiet — watching".
    const view = decisionCyclesView([
      record({
        rawIntents: [intent({ symbol: "NVDA", side: "buy", quantity: 60 })],
        guardedIntents: [],
        outcomes: [],
      }),
    ]);
    expect(view[0]).toMatchObject({
      status: "refused",
      headline: "1 refused by guards — nothing placed",
    });
    expect(view[0]?.refusedIntents).toEqual([
      {
        symbol: "NVDA",
        side: "buy",
        quantity: 60,
        reason: "momentum continuation above the shelf",
      },
    ]);
    // A refused cycle carries no `outcomes` at all — a reader must not confuse it with a placed
    // or clamped cycle that happens to have zero rows.
    expect(view[0]?.outcomes).toEqual([]);
  });

  it("never mixes refusedIntents into a cycle that has real outcomes — a partial clamp is not a refusal", () => {
    const view = decisionCyclesView([
      record({
        rawIntents: [intent(), intent({ symbol: "TSLA" })],
        guardedIntents: [intent()],
        outcomes: [{ intent: intent(), action: "observed" }],
      }),
    ]);
    expect(view[0]?.status).toBe("observed");
    expect(view[0]?.refusedIntents).toBeUndefined();
  });

  it("shows the guards' work — clamped intents surface in the headline", () => {
    const view = decisionCyclesView([
      record({ rawIntents: [intent(), intent({ symbol: "TSLA" })], guardedIntents: [intent()] }),
    ]);
    expect(view[0]?.headline).toContain("1 clamped by guards");
    expect(view[0]).toMatchObject({ rawCount: 2, guardedCount: 1 });
  });

  it("carries the persona's reason verbatim and the fill when one exists", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({ playbookId: "S2-NVDA" }),
            action: "placed",
            result: { intent: intent(), status: "filled", filledQuantity: 10, filledPrice: 176.1 },
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      reason: "momentum continuation above the shelf",
      playbook: "S2-NVDA",
      fill: "10 @ $176.10",
    });
  });

  it("carries strategy, expectation, and forecast through to the view — never parsing reason prose", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({
              strategy: "sauron-panic-claim",
              expectation: "Expect a mean-reversion bounce.",
              forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
            }),
            action: "observed",
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      strategy: "sauron-panic-claim",
      expectation: "Expect a mean-reversion bounce.",
      forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
    });
  });

  it("omits strategy/expectation/forecast rather than emitting empty values when absent", () => {
    const view = decisionCyclesView([record()]);
    expect(view[0]?.outcomes[0]).not.toHaveProperty("strategy");
    expect(view[0]?.outcomes[0]).not.toHaveProperty("expectation");
    expect(view[0]?.outcomes[0]).not.toHaveProperty("forecast");
  });

  it("sorts newest first", () => {
    const view = decisionCyclesView([record({ at: 1 }), record({ at: 2 })]);
    expect(new Date(view[0]?.at ?? 0).getTime()).toBe(2);
  });
});
