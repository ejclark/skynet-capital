import type { CapitalFlow } from "../../src/observatory/capital-flow.js";
import { curveFlows, flowMark } from "../../src/observatory/capital-flow-mark.js";

// #4563 slice 2 — a recorded paper-balance top-up is named on the row and the curve, in the voice
// the lifecycle rows use: what happened, what it did to the number, and that we inferred it.

const flow = (over: Partial<CapitalFlow> = {}): CapitalFlow => ({
  participantId: "human-dana",
  from: "2026-10-05T14:00:00.000Z",
  at: "2026-10-05T14:05:00.000Z",
  amount: 300_000,
  direction: "added",
  unexplainedCash: 300_000,
  basis: "inferred",
  ...over,
});

describe("flowMark", () => {
  it("leaves a row with no recorded flow exactly as it was — no mark at all", () => {
    expect(flowMark([])).toBeUndefined();
  });

  it("names a top-up's amount and day, says it is not a gain, and says it was inferred", () => {
    const mark = flowMark([flow()]);
    expect(mark).toEqual({
      direction: "added",
      text: "Capital added $300,000 on Oct 5 — not a gain · inferred",
      title: expect.stringContaining("inferred from our own records"),
    });
  });

  it("explains itself in words true on every metric, the flow-adjusted 1M return included", () => {
    const title = flowMark([flow()])?.title ?? "";
    expect(title).not.toMatch(/includes/);
    expect(title).toContain("not a gain or a loss");
    expect(title).toContain("1M return already leaves it out");
  });

  it("names a reset down as capital removed — not a loss", () => {
    const mark = flowMark([flow({ amount: -200_000, direction: "removed" })]);
    expect(mark?.direction).toBe("removed");
    expect(mark?.text).toBe("Capital removed $200,000 on Oct 5 — not a loss · inferred");
  });

  it("nets several flows into one line, counting them", () => {
    const mark = flowMark([
      flow({ amount: 300_000 }),
      flow({ at: "2026-10-09T15:00:00.000Z", amount: -100_000, direction: "removed" }),
    ]);
    expect(mark?.direction).toBe("added");
    expect(mark?.text).toBe(
      "Capital added, net $200,000 over 2 balance changes — not a gain · inferred",
    );
  });

  it("never implies a gain or a loss when the flows cancel out", () => {
    const mark = flowMark([
      flow({ amount: 300_000 }),
      flow({ at: "2026-10-09T15:00:00.000Z", amount: -300_000, direction: "removed" }),
    ]);
    expect(mark?.text).toBe(
      "Capital moved, net $0 over 2 balance changes — not a gain or a loss · inferred",
    );
  });

  it("never reads as a judgment: no gain or loss tone is attached", () => {
    expect(Object.keys(flowMark([flow()]) ?? {}).sort()).toEqual(["direction", "text", "title"]);
  });
});

describe("curveFlows", () => {
  const points = [
    { t: "2026-10-01T04:00:00.000Z", value: 0 },
    { t: "2026-10-08T04:00:00.000Z", value: 0.3 },
  ];

  it("annotates each flow that lands inside the curve's own span, oldest first", () => {
    const later = flow({ at: "2026-10-07T15:00:00.000Z", amount: -50_000, direction: "removed" });
    expect(curveFlows([later, flow()], points)).toEqual([
      {
        t: "2026-10-05T14:05:00.000Z",
        direction: "added",
        label: "Capital added $300,000 on Oct 5 — not a gain",
      },
      {
        t: "2026-10-07T15:00:00.000Z",
        direction: "removed",
        label: "Capital removed $50,000 on Oct 7 — not a loss",
      },
    ]);
  });

  it("leaves out a flow from before the range starts — the curve does not draw that day", () => {
    expect(curveFlows([flow({ at: "2026-09-20T15:00:00.000Z" })], points)).toEqual([]);
  });

  it("annotates nothing on an empty curve", () => {
    expect(curveFlows([flow()], [])).toEqual([]);
  });
});
