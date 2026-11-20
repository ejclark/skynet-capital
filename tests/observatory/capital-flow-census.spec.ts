import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { type CapitalFlow, inferCapitalFlow } from "../../src/observatory/capital-flow.js";
import {
  censusFlows,
  censusMarkdown,
  parseFlowLines,
  parseJournalLines,
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

// #7730 — the detector's own named false-positive source: a 420-strike put assigned ($0 lifecycle
// line, the share leg's -$42,000 unjournaled) in a window where the book also fell 0.7%. Both
// witnesses point down and the cash "covers" the move, so only the journal can catch it.
const T0 = "2026-10-05T14:00:00.000Z";
const T1 = "2026-10-05T14:05:00.000Z";
const assignment: TradeActivityRecord = {
  orderId: "lifecycle:act-1",
  participantId: "human-dana",
  symbol: "AAPL261016P00420000",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "assigned",
  at: "2026-10-05T14:02:00.000Z",
  source: "lifecycle",
};
const sample = (at: string, equity: number, cash: number) => ({
  at,
  participantId: "human-dana",
  equity,
  cash,
  realizedPl: 0,
});
const assignedOnADownDay = (): CapitalFlow => {
  const line = inferCapitalFlow(sample(T0, 1_000_000, 500_000), sample(T1, 993_000, 458_000), [
    assignment,
  ]);
  if (!line) throw new Error("precondition: the detector records the false line");
  return line;
};

describe("an assignment that shares a window with a market move (#7730)", () => {
  it("is recorded by the detector as a removal (the precondition)", () => {
    expect(assignedOnADownDay()).toMatchObject({
      amount: -7_000,
      unexplainedCash: -42_000,
      direction: "removed",
    });
  });

  it("disagrees once the line is read against the journal's lifecycle rows", () => {
    expect(witnesses(assignedOnADownDay(), [assignment])).toBe("disagree");
  });

  it("still disagrees when the row is stamped at the end of its date, hours after the window", () => {
    const timeless = { ...assignment, at: "2026-10-05T23:59:59.999Z" };
    expect(witnesses(assignedOnADownDay(), [timeless])).toBe("disagree");
  });

  it("ignores another member's lifecycle row, and one weeks from the window", () => {
    const line = flow(300_000, 300_000);
    expect(witnesses(line, [{ ...assignment, participantId: "human-ari" }])).toBe("agree");
    expect(witnesses(line, [{ ...assignment, at: "2026-10-25T14:02:00.000Z" }])).toBe("agree");
  });

  it("withholds the all-clear and counts the line as disagreeing at the floors it clears", () => {
    const census = censusFlows([assignedOnADownDay()], weekIn, [assignment]);
    expect(census).toMatchObject({ disagree: 1, lifecycleNear: 1 });
    expect(census.floors.some((row) => row.disagree > 0)).toBe(true);
    const text = censusMarkdown(census);
    expect(text).not.toContain("Every line's witnesses agree: keep today's rule.");
    expect(text).toContain("Near an assignment, exercise or expiry in the fill journal: 1 line(s)");
  });

  it("never prints the all-clear when the journal was not read", () => {
    const text = censusMarkdown(censusFlows([assignedOnADownDay()], weekIn));
    expect(text).not.toContain("Every line's witnesses agree: keep today's rule.");
    expect(text).toContain("rerun with --activity");
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
      [flow(300_000, 300_000), flow(50_000, 51_000, "human-ari")],
      weekIn,
      [],
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

  it("recommends no floor when a disagreeing line clears every candidate", () => {
    const census = censusFlows([flow(90_000, -80_000)], weekIn);
    expect(census.recommendedFloor).toBeUndefined();
  });
});

describe("censusMarkdown", () => {
  it("prints counts and floors, never a participant id or an amount", () => {
    const text = censusMarkdown(censusFlows([flow(312_345, 312_345, "human-secret")], weekIn, []));
    expect(text).toContain("Every line's witnesses agree: keep today's rule.");
    expect(text).not.toContain("human-secret");
    expect(text).not.toContain("312");
  });

  it("says plainly when the shadow week has not passed", () => {
    expect(censusMarkdown(censusFlows([], new Date("2026-10-21T00:00:00Z")))).toContain(
      "Not ready: 1 of 7",
    );
  });
});

describe("parseJournalLines", () => {
  it("keeps journal rows and skips a blank or torn line", () => {
    const text = `${JSON.stringify(assignment)}\n\n{"participantId":"x","at`;
    expect(parseJournalLines(text)).toEqual([assignment]);
  });
});

describe("parseFlowLines", () => {
  it("skips a blank or torn line instead of failing the read", () => {
    const text = `${JSON.stringify(flow(5_000, 5_000))}\n\n{"participantId":"x","amou`;
    expect(parseFlowLines(text)).toHaveLength(1);
  });
});
