import { type CapitalFlow, inferCapitalFlow } from "../../src/observatory/capital-flow.js";
import {
  censusFlows,
  censusMarkdown,
  parseFlowLines,
  witnesses,
} from "../../src/observatory/capital-flow-census.js";
import type { EquitySample } from "../../src/observatory/history-record.js";

// #4563 — the shadow ledger is graded before any member sees a capital-flow mark. The run log the
// census prints into is public, so it must carry counts and floors only.

// A line as the detector writes it today. `heldAfter` defaults to a book still held — the shape of
// a false line — so a test that means a reset says `heldAfter: 0` out loud.
const flow = (
  amount: number,
  unexplainedCash: number,
  {
    participantId = "human-dana",
    heldAfter = 400_000,
  }: { participantId?: string; heldAfter?: number } = {},
): CapitalFlow => ({
  participantId,
  from: "2026-10-20T14:00:00.000Z",
  at: "2026-10-20T14:05:00.000Z",
  amount,
  direction: amount > 0 ? "added" : "removed",
  unexplainedCash,
  heldAfter,
  basis: "inferred",
});

// A line recorded before #7729, which carried no held book.
const legacy = (amount: number, unexplainedCash: number): CapitalFlow => {
  const { heldAfter: _, ...line } = flow(amount, unexplainedCash);
  return line;
};

const weekIn = new Date("2026-10-27T12:00:00Z");

describe("witnesses", () => {
  it("agrees when a top-up moves cash and equity together", () => {
    expect(witnesses(flow(300_000, 300_000))).toBe("agree");
  });

  it("agrees when a reset left the book flat, whatever the cash did", () => {
    expect(witnesses(flow(-200_000, -650_000, { heldAfter: 0 }))).toBe("agree");
    expect(witnesses(flow(300_000, -20_000, { heldAfter: 0 }))).toBe("agree");
  });

  it("disagrees when the book is still held and cash does not match the equity move", () => {
    expect(witnesses(flow(-200_000, -650_000))).toBe("disagree");
  });

  it("disagrees when the two moves point opposite ways", () => {
    expect(witnesses(flow(12_000, -8_000))).toBe("disagree");
  });

  it("disagrees when the unexplained cash falls well short of the equity move", () => {
    expect(witnesses(flow(40_000, 6_000))).toBe("disagree");
  });
});

describe("witnesses on a line recorded before the held book", () => {
  it("still agrees when cash matches the equity move", () => {
    expect(witnesses(legacy(300_000, 300_400))).toBe("agree");
  });

  it("is ungraded otherwise: a reset and a false line look alike without the held book", () => {
    expect(witnesses(legacy(-300_000, 500_000))).toBe("ungraded");
    expect(witnesses(legacy(12_000, -8_000))).toBe("ungraded");
  });
});

describe("censusFlows", () => {
  it("is not ready before a week of shadow time", () => {
    const census = censusFlows([], new Date("2026-10-22T00:00:00Z"));
    expect(census.ready).toBe(false);
    expect(census.shadowDays).toBe(2);
  });

  it("keeps today's floor when every line's witnesses agree", () => {
    const census = censusFlows(
      [flow(300_000, 300_000), flow(50_000, 51_000, { participantId: "human-ari" })],
      weekIn,
    );
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

  it("counts an ungraded line apart and keeps it out of the floor table", () => {
    const census = censusFlows([flow(300_000, 300_000), legacy(90_000, -80_000)], weekIn);
    expect(census).toMatchObject({ lines: 2, agree: 1, disagree: 0, ungraded: 1 });
    expect(census.recommendedFloor).toBe(1_000);
    const text = censusMarkdown(census);
    expect(text).toContain("Every graded line's witnesses agree");
    expect(text).toContain("Ungraded: 1");
  });

  it("says nothing can be graded when every line predates the held book", () => {
    const text = censusMarkdown(censusFlows([legacy(90_000, -80_000)], weekIn));
    expect(text).toContain("No line can be graded yet");
  });

  it("recommends no floor when a disagreeing line clears every candidate", () => {
    const census = censusFlows([flow(90_000, -80_000)], weekIn);
    expect(census.recommendedFloor).toBeUndefined();
  });
});

describe("censusMarkdown", () => {
  it("prints counts and floors, never a participant id or an amount", () => {
    const text = censusMarkdown(
      censusFlows([flow(312_345, 312_345, { participantId: "human-secret" })], weekIn),
    );
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

// #7729 — an Alpaca paper reset clears every position, so the cash it moves is the equity change
// PLUS the cleared book's net value: more than equity for a net-long book, less (or the other way)
// for a net-short one. These genuine resets run through the detector itself, so the census grades
// exactly the line production would record.
describe("a genuine reset, as the detector records it", () => {
  const at = (iso: string, equity: number, cash: number): EquitySample => ({
    at: iso,
    participantId: "human-dana",
    equity,
    cash,
    realizedPl: 0,
  });
  const reset = (equity: number, cash: number, to = 1_000_000): CapitalFlow => {
    const line = inferCapitalFlow(
      at("2026-10-20T14:00:00.000Z", equity, cash),
      at("2026-10-20T14:05:00.000Z", to, to),
      [],
    );
    if (!line) throw new Error("the detector recorded nothing");
    return line;
  };

  it("agrees on a net-long book reset back down: cash rises while equity falls", () => {
    const line = reset(1_300_000, 500_000);
    expect(line).toMatchObject({ amount: -300_000, unexplainedCash: 500_000 });
    expect(witnesses(line)).toBe("agree");
    expect(censusFlows([line], weekIn).disagree).toBe(0);
  });

  it("agrees on a net-short book topped up: equity rises while cash dips", () => {
    // Cash-secured puts sold for $20k of premium, now marked at −$320k.
    const line = reset(700_000, 1_020_000);
    expect(line).toMatchObject({ amount: 300_000, unexplainedCash: -20_000 });
    expect(witnesses(line)).toBe("agree");
    expect(censusFlows([line], weekIn).disagree).toBe(0);
  });

  it("agrees when a small short book leaves the cash just short of the equity move", () => {
    const line = reset(700_000, 701_500);
    expect(line.unexplainedCash).toBe(298_500);
    expect(witnesses(line)).toBe("agree");
  });

  it("never lets a run of genuine resets talk the census into a raised floor", () => {
    const census = censusFlows([reset(1_300_000, 500_000), reset(700_000, 1_020_000)], weekIn);
    expect(census).toMatchObject({ agree: 2, disagree: 0, recommendedFloor: 1_000 });
    expect(censusMarkdown(census)).toContain("keep today's rule");
  });
});

describe("parseFlowLines", () => {
  it("skips a blank or torn line instead of failing the read", () => {
    const text = `${JSON.stringify(flow(5_000, 5_000))}\n\n{"participantId":"x","amou`;
    expect(parseFlowLines(text)).toHaveLength(1);
  });

  it("keeps a numeric held book and drops one that is not a number", () => {
    const good = JSON.stringify(flow(5_000, 9_000, { heldAfter: 0 }));
    const bad = JSON.stringify({ ...flow(5_000, 9_000), heldAfter: "0" });
    const [kept, dropped] = parseFlowLines(`${good}\n${bad}`);
    expect(kept?.heldAfter).toBe(0);
    expect(dropped && "heldAfter" in dropped).toBe(false);
    expect(dropped && witnesses(dropped)).toBe("ungraded");
  });
});
