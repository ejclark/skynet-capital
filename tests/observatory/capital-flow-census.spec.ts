import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { type CapitalFlow, inferCapitalFlow } from "../../src/observatory/capital-flow.js";
import {
  censusFlows,
  censusMarkdown,
  parseFlowLines,
  parseJournalLines,
  witnesses,
} from "../../src/observatory/capital-flow-census.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import { lifecycleLedgerRecord } from "../../src/observatory/option-lifecycle-activity.js";
import { parseLifecycleActivity } from "../../src/trading/option-lifecycle.js";

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

const sample = (at: string, equity: number, cash: number): EquitySample => ({
  at,
  participantId: "human-dana",
  equity,
  cash,
  realizedPl: 0,
});

describe("witnesses", () => {
  it("agrees when a top-up moves cash and equity together", () => {
    expect(witnesses(flow(300_000, 300_000))).toBe("agree");
  });

  it("agrees when a reset left the book flat, whatever the cash did", () => {
    expect(witnesses(flow(-200_000, -650_000, { heldAfter: 0 }))).toBe("agree");
    expect(witnesses(flow(300_000, -20_000, { heldAfter: 0 }))).toBe("agree");
  });

  it("agrees on a genuine reset when a bot filled before it in the same window (#8064)", () => {
    // Flat at $700k, a bot buys $50,000 of SPY, then a reset to $1M clears that position.
    const buy: TradeActivityRecord = {
      orderId: "o1",
      participantId: "human-dana",
      symbol: "SPY",
      side: "buy",
      quantity: 100,
      filledQuantity: 100,
      price: 500,
      status: "filled",
      at: "2026-10-05T14:01:00.000Z",
      source: "stream",
    };
    const line = inferCapitalFlow(
      sample("2026-10-05T14:00:00.000Z", 700_000, 700_000),
      sample("2026-10-05T14:05:00.000Z", 1_000_000, 1_000_000),
      [buy],
    );
    if (!line) throw new Error("precondition: the detector records the reset");
    expect(witnesses(line, [buy])).toBe("agree");
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

// #7730 — the detector's own named false-positive source: a 420-strike put assigned ($0 lifecycle
// line, the share leg's -$42,000 unjournaled) in a window where the book also fell 0.7%. Under the
// first witness rule both moves pointed down and the cash "covered" the move; the held book (#7729)
// now gives it away as well, but the journal condemns it first, and alone can for an older line.
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
const assignedOnADownDay = (): CapitalFlow => {
  const line = inferCapitalFlow(sample(T0, 1_000_000, 500_000), sample(T1, 993_000, 458_000), [
    assignment,
  ]);
  if (!line) throw new Error("precondition: the detector records the false line");
  return line;
};

describe("an assignment that shares a window with a market move (#7730)", () => {
  it("is recorded by the detector as a removal, its shares still held (the precondition)", () => {
    expect(assignedOnADownDay()).toMatchObject({
      amount: -7_000,
      unexplainedCash: -42_000,
      heldAfter: 535_000,
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

  it("grades a line recorded before the held book disagree, not ungraded, when a row is near", () => {
    const near = { ...assignment, at: "2026-10-20T14:02:00.000Z" };
    expect(witnesses(legacy(-7_000, -42_000))).toBe("ungraded");
    expect(witnesses(legacy(-7_000, -42_000), [near])).toBe("disagree");
  });

  it("withholds the all-clear and counts the line as disagreeing at the floors it clears", () => {
    const census = censusFlows([assignedOnADownDay()], weekIn, [assignment]);
    expect(census).toMatchObject({ disagree: 1, lifecycleExplained: 1 });
    expect(census.floors.some((row) => row.disagree > 0)).toBe(true);
    const text = censusMarkdown(census);
    expect(text).not.toContain("Every line's witnesses agree: keep today's rule.");
    expect(text).toContain("could have moved: 1 line(s), graded disagree");
  });

  it("never prints the all-clear when the journal was not read", () => {
    const text = censusMarkdown(censusFlows([flow(300_000, 300_000)], weekIn));
    expect(text).not.toContain("Every line's witnesses agree: keep today's rule.");
    expect(text).toContain("rerun with --activity");
  });
});

// #7729 × #7730 — why the journal is read BEFORE the held book. A covered call assigned away hands
// the shares over at the strike (the $0 lifecycle row leaves that cash unexplained) and leaves the
// book flat, so the held-book witness reads it as a reset. The equity move is the short call's mark
// vanishing: an earned gain, which a recorded flow would tell the league was capital arriving.
describe("a covered call assigned away, flattening the book", () => {
  const calledAway: TradeActivityRecord = {
    orderId: "lifecycle:act-2",
    participantId: "human-dana",
    symbol: "AAPL261016C00400000",
    side: "sell",
    quantity: 20,
    filledQuantity: 20,
    price: 0,
    status: "assigned",
    at: "2026-10-05T14:03:00.000Z",
    source: "lifecycle",
  };
  // 2,000 shares at $400 and 20 short $400 calls marked at -$16,000, then delivered at the strike.
  const line = (): CapitalFlow => {
    const recorded = inferCapitalFlow(
      sample(T0, 1_000_000, 216_000),
      sample(T1, 1_016_000, 1_016_000),
      [calledAway],
    );
    if (!recorded) throw new Error("precondition: the detector records the false line");
    return recorded;
  };

  it("is recorded with a flat book after it (the precondition)", () => {
    expect(line()).toMatchObject({ amount: 16_000, unexplainedCash: 800_000, heldAfter: 0 });
  });

  it("passes the witnesses alone: the blind spot the journal exists to cover", () => {
    expect(witnesses(line())).toBe("agree");
  });

  it("disagrees once the journal is read, and the census withholds the all-clear", () => {
    expect(witnesses(line(), [calledAway])).toBe("disagree");
    const census = censusFlows([line()], weekIn, [calledAway]);
    expect(census).toMatchObject({ agree: 0, disagree: 1, lifecycleExplained: 1 });
    expect(censusMarkdown(census)).not.toContain("keep today's rule");
  });
});

// #8083 — the one-day margin is there to catch a lifecycle row's cash wherever it landed, not to
// condemn every line near one. A reset the day after an expiry or an assignment is still a reset:
// an expiry moves no cash, and an assignment's share leg moves its strike notional, which a
// reset's cash does not match. Driven through the real parser and ledger writer, so the rows carry
// the end-of-day stamp production gives a date-only activity.
describe("a genuine reset the day after an expiry or assignment (#8083)", () => {
  const friday = (activity_type: string, symbol: string, qty = "1"): TradeActivityRecord => {
    const parsed = parseLifecycleActivity({
      id: "act-9",
      activity_type,
      symbol,
      qty,
      date: "2026-10-23",
    });
    if (!parsed) throw new Error("precondition: the row parses");
    return lifecycleLedgerRecord(parsed, "human-dana");
  };
  const expiry = friday("OPEXP", "AAPL261023P00420000");
  const assigned = friday("OPASN", "AAPL261023P00420000");
  // The issue's net-short refund: puts marked at −$320k, topped up to $1M on Saturday afternoon.
  const reset = (): CapitalFlow => {
    const line = inferCapitalFlow(
      sample("2026-10-24T14:55:00.000Z", 700_000, 1_020_000),
      sample("2026-10-24T15:00:00.000Z", 1_000_000, 1_000_000),
      [],
    );
    if (!line) throw new Error("precondition: the detector records the reset");
    return line;
  };

  it("sits inside the margin, stamped at the end of Friday (the precondition)", () => {
    expect(expiry.at).toBe("2026-10-23T23:59:59.999Z");
    expect(reset()).toMatchObject({ amount: 300_000, unexplainedCash: -20_000, heldAfter: 0 });
  });

  it("agrees, and the census prints the all-clear, the day after an expiry", () => {
    expect(witnesses(reset(), [expiry])).toBe("agree");
    const census = censusFlows([reset()], weekIn, [expiry]);
    expect(census).toMatchObject({ agree: 1, disagree: 0, lifecycleExplained: 0 });
    expect(censusMarkdown(census)).toContain("Every line's witnesses agree: keep today's rule.");
  });

  it("agrees the day after an assignment whose strike notional is not the line's cash", () => {
    expect(witnesses(reset(), [assigned])).toBe("agree");
    expect(censusFlows([reset()], weekIn, [assigned]).disagree).toBe(0);
  });

  it("still disagrees when the assignment's notional is the line's cash", () => {
    const line = { ...reset(), unexplainedCash: -42_000 };
    expect(witnesses(line, [assigned])).toBe("disagree");
    expect(witnesses(line, [friday("OPASN", "AAPL261023P00140000", "3")])).toBe("disagree");
  });

  it("still disagrees when a near row's cash cannot be known", () => {
    // A share settlement with no price, and an assignment on a symbol that is not an OCC contract.
    expect(witnesses(reset(), [friday("OPTRD", "AAPL", "100")])).toBe("disagree");
    expect(witnesses(reset(), [{ ...assigned, symbol: "AAPL" }])).toBe("disagree");
  });

  it("matches two assignments landing together, and a settlement's price either way", () => {
    const call = friday("OPASN", "AAPL261023C00400000", "2");
    const both = { ...reset(), unexplainedCash: 80_000 - 42_000 };
    expect(witnesses(both, [assigned, call])).toBe("disagree");
    const settled = parseLifecycleActivity({
      id: "act-10",
      activity_type: "OPTRD",
      symbol: "AAPL",
      qty: "100",
      price: "200",
      date: "2026-10-23",
    });
    if (!settled) throw new Error("precondition: the settlement parses");
    const row = lifecycleLedgerRecord(settled, "human-dana");
    expect(witnesses({ ...reset(), unexplainedCash: 20_000 }, [row])).toBe("disagree");
    expect(witnesses(reset(), [row])).toBe("disagree");
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

  it("counts an ungraded line apart and keeps it out of the floor table", () => {
    const census = censusFlows([flow(300_000, 300_000), legacy(90_000, -80_000)], weekIn, []);
    expect(census).toMatchObject({ lines: 2, agree: 1, disagree: 0, ungraded: 1 });
    expect(census.recommendedFloor).toBe(1_000);
    const text = censusMarkdown(census);
    expect(text).toContain("Every graded line's witnesses agree: keep today's rule.");
    expect(text).toContain("Ungraded: 1");
  });

  it("withholds the graded all-clear too when the journal was not read", () => {
    const text = censusMarkdown(
      censusFlows([flow(300_000, 300_000), legacy(90_000, -80_000)], weekIn),
    );
    expect(text).toContain(
      "Every graded line's witnesses agree, but the fill journal was not read",
    );
    expect(text).not.toContain("keep today's rule.");
  });

  it("says nothing can be graded when every line predates the held book", () => {
    const text = censusMarkdown(censusFlows([legacy(90_000, -80_000)], weekIn, []));
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
      censusFlows([flow(312_345, 312_345, { participantId: "human-secret" })], weekIn, []),
    );
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

// #7729 — an Alpaca paper reset clears every position, so the cash it moves is the equity change
// PLUS the cleared book's net value: more than equity for a net-long book, less (or the other way)
// for a net-short one. These genuine resets run through the detector itself, so the census grades
// exactly the line production would record.
describe("a genuine reset, as the detector records it", () => {
  const reset = (equity: number, cash: number, to = 1_000_000): CapitalFlow => {
    const line = inferCapitalFlow(
      sample("2026-10-20T14:00:00.000Z", equity, cash),
      sample("2026-10-20T14:05:00.000Z", to, to),
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
    const census = censusFlows([reset(1_300_000, 500_000), reset(700_000, 1_020_000)], weekIn, []);
    expect(census).toMatchObject({ agree: 2, disagree: 0, recommendedFloor: 1_000 });
    expect(censusMarkdown(census)).toContain("Every line's witnesses agree: keep today's rule.");
  });

  it("stays agreeing when the journal is read and holds no lifecycle row near the reset", () => {
    const line = reset(1_300_000, 500_000);
    expect(witnesses(line, [assignment])).toBe("agree");
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

  it("keeps a numeric held book and drops one that is not a number", () => {
    const good = JSON.stringify(flow(5_000, 9_000, { heldAfter: 0 }));
    const bad = JSON.stringify({ ...flow(5_000, 9_000), heldAfter: "0" });
    const [kept, dropped] = parseFlowLines(`${good}\n${bad}`);
    expect(kept?.heldAfter).toBe(0);
    expect(dropped && "heldAfter" in dropped).toBe(false);
    expect(dropped && witnesses(dropped)).toBe("ungraded");
  });
});
