import type { CapitalFlow } from "../../src/observatory/capital-flow.js";
import {
  censusFlows,
  censusMarkdown,
  parseFlowLines,
  witnesses,
} from "../../src/observatory/capital-flow-census.js";

// #4563 — the shadow ledger is graded before any member sees a capital-flow mark. The run log the
// census prints into is public, so it must carry counts and floors only.

const flow = (
  amount: number,
  unexplainedCash: number,
  participantId = "human-dana",
): CapitalFlow => ({
  participantId,
  from: "2026-10-20T14:00:00.000Z",
  at: "2026-10-20T14:05:00.000Z",
  amount,
  direction: amount > 0 ? "added" : "removed",
  unexplainedCash,
  basis: "inferred",
});

const weekIn = new Date("2026-10-27T12:00:00Z");

describe("witnesses", () => {
  it("agrees when a top-up moves cash and equity together", () => {
    expect(witnesses(flow(300_000, 300_000))).toBe("agree");
  });

  it("agrees when a reset that cleared positions moves cash by more than equity", () => {
    expect(witnesses(flow(-200_000, -650_000))).toBe("agree");
  });

  it("disagrees when the two moves point opposite ways", () => {
    expect(witnesses(flow(12_000, -8_000))).toBe("disagree");
  });

  it("disagrees when the unexplained cash falls well short of the equity move", () => {
    expect(witnesses(flow(40_000, 6_000))).toBe("disagree");
  });
});

describe("censusFlows", () => {
  it("is not ready before a week of shadow time", () => {
    const census = censusFlows([], new Date("2026-10-22T00:00:00Z"));
    expect(census.ready).toBe(false);
    expect(census.shadowDays).toBe(2);
  });

  it("keeps today's floor when every line's witnesses agree", () => {
    const census = censusFlows([flow(300_000, 300_000), flow(50_000, 51_000, "human-ari")], weekIn);
    expect(census).toMatchObject({ lines: 2, participants: 2, agree: 2, disagree: 0 });
    expect(census.recommendedFloor).toBe(1_000);
    expect(census.agreeDropped).toBe(0);
  });

  it("recommends the smallest floor no disagreeing line clears, and counts what it costs", () => {
    const census = censusFlows(
      [flow(300_000, 300_000), flow(8_000, 8_000), flow(7_000, -6_000), flow(9_000, 2_000)],
      weekIn,
    );
    expect(census.disagree).toBe(2);
    // $5,000 still lets the 7k/−6k line through (both witnesses clear it); $10,000 does not.
    expect(census.recommendedFloor).toBe(10_000);
    expect(census.agreeDropped).toBe(1);
  });

  it("recommends no floor when a disagreeing line clears every candidate", () => {
    const census = censusFlows([flow(90_000, -80_000)], weekIn);
    expect(census.recommendedFloor).toBeUndefined();
  });
});

describe("censusMarkdown", () => {
  it("prints counts and floors, never a participant id or an amount", () => {
    const text = censusMarkdown(censusFlows([flow(312_345, 312_345, "human-secret")], weekIn));
    expect(text).toContain("keep today's rule");
    expect(text).not.toContain("human-secret");
    expect(text).not.toContain("312");
  });

  it("says plainly when the shadow week has not passed", () => {
    expect(censusMarkdown(censusFlows([], new Date("2026-10-21T00:00:00Z")))).toContain(
      "Not ready: 1 of 7",
    );
  });
});

describe("parseFlowLines", () => {
  it("skips a blank or torn line instead of failing the read", () => {
    const text = `${JSON.stringify(flow(5_000, 5_000))}\n\n{"participantId":"x","amou`;
    expect(parseFlowLines(text)).toHaveLength(1);
  });
});
