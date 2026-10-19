import {
  fillPrice,
  isSameTest,
  MAX_SHADOW_REFUSALS,
  MAX_SHADOW_SESSIONS,
  MAX_SHADOW_TRADES,
  noteSession,
  recordFill,
  recordRefusal,
  startRun,
} from "../../src/playbooks/authored-shadow.js";
import { anOrder, aSpec } from "../support/authored-shadow.js";

/**
 * THE SHADOW LEDGER (#5457 slice 2) — COND-SCOUT's fill rule on a would-be position: a buy fills at
 * the ask, a sell at the bid, the whole quote kept so the spread paid can be audited.
 */

const quote = (bid: number, ask: number) => ({ bid, ask, last: (bid + ask) / 2, asOf: "t" });
const fill = (side: "buy" | "sell", quantity: number, bid: number, ask: number, at = 1) => ({
  side,
  symbol: "AMD",
  quantity,
  quote: quote(bid, ask),
  at,
});

describe("the fill rule", () => {
  it("a buy takes the ask and a sell the bid — never the mid, which would hand the test the spread", () => {
    expect(fillPrice("buy", quote(99, 101))).toBe(101);
    expect(fillPrice("sell", quote(99, 101))).toBe(99);
  });

  it("has no price without a usable side of the quote", () => {
    expect(fillPrice("buy", quote(99, 0))).toBeUndefined();
    expect(fillPrice("sell", quote(0, 101))).toBeUndefined();
  });

  it("records nothing for a fill it cannot price or size", () => {
    const run = startRun(anOrder());
    expect(recordFill(run, fill("buy", 5, 99, 0))).toBe(run);
    expect(recordFill(run, fill("buy", 0, 99, 101))).toBe(run);
  });
});

describe("the would-be position", () => {
  it("a buy opens it at the ask, keeping the whole quote beside the fill", () => {
    const run = recordFill(startRun(anOrder()), fill("buy", 10, 99, 101, 5));
    expect(run.holding).toEqual({ quantity: 10, avgPrice: 101, openedAt: 5 });
    expect(run.trades).toEqual([
      {
        at: 5,
        side: "buy",
        symbol: "AMD",
        quantity: 10,
        price: 101,
        quote: { bid: 99, ask: 101, last: 100, asOf: "t" },
      },
    ]);
    expect(run.tradeCount).toBe(1);
  });

  it("a second buy averages the cost and keeps when the position first opened", () => {
    let run = recordFill(startRun(anOrder()), fill("buy", 10, 99, 100, 1));
    run = recordFill(run, fill("buy", 10, 109, 110, 2));
    expect(run.holding).toEqual({ quantity: 20, avgPrice: 105, openedAt: 1 });
  });

  it("a sell books what the round trip won, at the bid, and closes the position", () => {
    let run = recordFill(startRun(anOrder()), fill("buy", 10, 99, 100));
    run = recordFill(run, fill("sell", 10, 109, 110));
    expect(run.trades[1]).toMatchObject({ side: "sell", price: 109, realized: 90 });
    expect(run.realized).toBe(90);
    expect(run.roundTrips).toBe(1);
    expect(run.holding).toBeUndefined();
  });

  it("a loss is a negative result, not a missing one", () => {
    let run = recordFill(startRun(anOrder()), fill("buy", 10, 99, 100));
    run = recordFill(run, fill("sell", 10, 89, 90));
    expect(run.realized).toBe(-110);
  });

  it("a part sell leaves the rest held; a sell past the position is cut to it", () => {
    let run = recordFill(startRun(anOrder()), fill("buy", 10, 99, 100));
    run = recordFill(run, fill("sell", 4, 109, 110));
    expect(run.holding?.quantity).toBe(6);
    run = recordFill(run, fill("sell", 50, 109, 110));
    expect(run.trades.at(-1)?.quantity).toBe(6);
    expect(run.holding).toBeUndefined();
  });

  it("a sell with nothing held records nothing", () => {
    const run = startRun(anOrder());
    expect(recordFill(run, fill("sell", 5, 99, 101))).toBe(run);
  });
});

describe("what it remembers is bounded", () => {
  it("keeps the newest trades but counts every one, and the result stays exact", () => {
    let run = startRun(anOrder());
    for (let i = 0; i < MAX_SHADOW_TRADES + 10; i++) {
      run = recordFill(run, fill("buy", 1, 99, 100, i));
      run = recordFill(run, fill("sell", 1, 100, 101, i));
    }
    expect(run.trades).toHaveLength(MAX_SHADOW_TRADES);
    expect(run.tradeCount).toBe(2 * (MAX_SHADOW_TRADES + 10));
    expect(run.roundTrips).toBe(MAX_SHADOW_TRADES + 10);
    expect(run.realized).toBeCloseTo(0, 6); // bought at 100, sold at 100: no result
  });

  it("keeps the newest session days", () => {
    let run = startRun(anOrder());
    for (let i = 0; i < MAX_SHADOW_SESSIONS + 5; i++) {
      run = noteSession(run, `d${String(i).padStart(4, "0")}`);
    }
    expect(run.sessions).toHaveLength(MAX_SHADOW_SESSIONS);
    expect(run.sessions[0]).toBe("d0005");
  });

  it("counts a session day once", () => {
    const run = noteSession(startRun(anOrder()), "2026-10-20");
    expect(noteSession(run, "2026-10-20")).toBe(run);
  });

  it("says a refusal once per day, symbol, side and reason, and keeps the newest few", () => {
    const refusal = {
      day: "2026-10-20",
      symbol: "AMD",
      side: "buy" as const,
      reason: "position-cap",
    };
    let run = recordRefusal(startRun(anOrder()), refusal);
    expect(recordRefusal(run, refusal)).toBe(run);
    expect(recordRefusal(run, { ...refusal, reason: "s2-print" }).refusals).toHaveLength(2);
    for (let i = 0; i < MAX_SHADOW_REFUSALS + 5; i++) {
      run = recordRefusal(run, { ...refusal, day: `2026-11-${String(i).padStart(2, "0")}` });
    }
    expect(run.refusals).toHaveLength(MAX_SHADOW_REFUSALS);
  });
});

describe("which test is running", () => {
  it("the same start and the same spec is the same test", () => {
    const run = startRun(anOrder());
    expect(isSameTest(run, anOrder())).toBe(true);
  });

  it("a new start, or an edited spec, is a new test", () => {
    const run = startRun(anOrder());
    expect(isSameTest(run, anOrder({ since: "2026-10-18T00:00:00.000Z" }))).toBe(false);
    expect(
      isSameTest(
        run,
        anOrder({ spec: aSpec({ thesis: "a different reason to hold into the print" }) }),
      ),
    ).toBe(false);
  });
});
