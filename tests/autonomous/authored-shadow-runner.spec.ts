import {
  type AuthoredShadowDeps,
  AuthoredShadowRunner,
  type AuthoredShadowStore,
  SHADOW_MODE,
} from "../../src/autonomous/authored-shadow-runner.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { ShadowRun } from "../../src/playbooks/authored-shadow.js";
import { anOrder, aSpec, at, CALENDAR } from "../support/authored-shadow.js";
import { aContext } from "../support/builders.js";

/**
 * THE SHADOW TEST'S PASS (#5457 slice 2).
 *
 * WHEN a draft is in its shadow test, the system SHALL decide it each pass as the play would be
 * decided on its author's own bot — same window, same sizing off that bot's equity, same limits —
 * and write the would-be trade on a ledger at the ask going in and the bid coming out. The run is
 * the member's, scoped to one test: a play taken out of its test loses its ledger, and a new test of
 * the same play starts clean.
 */

const BOOK: Portfolio = { cash: 100_000, positions: [] };
const RISK = { maxPositionPct: 0.03 };

function build(over: Partial<AuthoredShadowDeps> = {}) {
  const fills: string[] = [];
  const runner = new AuthoredShadowRunner({
    risk: RISK,
    blockedReason: () => null,
    portfolioOf: (id) => (id === "futurist" ? BOOK : undefined),
    calendar: CALENDAR,
    now: () => 1_700_000_000_000,
    onFill: (_run, trade) => fills.push(`${trade.side} ${trade.quantity} ${trade.symbol}`),
    ...over,
  });
  runner.setOrders([anOrder()]);
  return { runner, fills };
}

const amd = (day: string, last = 100) => aContext({ AMD: { last } }, at(day));
const REPORT_AT = 1_700_000_000_000;

describe("a play in its shadow test is decided as it would be on its author's bot", () => {
  it("records a would-be buy at the ask when its window opens, sized off the author's equity", () => {
    const { runner, fills } = build();
    runner.runPass(amd("2026-10-20")); // 14 days before the report: inside 20 → 5
    const run = runner.run("U-futurist-amd-run-up");
    // standard size 2% of $100,000 at the ask $100.05 → 19 shares
    expect(run?.trades).toEqual([
      expect.objectContaining({ side: "buy", symbol: "AMD", quantity: 19, price: 100.05 }),
    ]);
    expect(run?.trades[0]?.quote).toMatchObject({ bid: 99.95, ask: 100.05, last: 100 });
    expect(run?.holding).toMatchObject({ quantity: 19, avgPrice: 100.05 });
    expect(fills).toEqual(["buy 19 AMD"]);
  });

  it("runs the middle size, whatever the other two say", () => {
    expect(SHADOW_MODE).toBe("standard");
  });

  it("sizes off the author's equity, not a fixed book", () => {
    const { runner } = build({ portfolioOf: () => ({ cash: 50_000, positions: [] }) });
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-amd-run-up")?.trades[0]?.quantity).toBe(9); // 2% of 50,000 / 100.05
  });

  it("holds while the window stays open: one buy, however many passes", () => {
    const { runner } = build();
    for (const day of ["2026-10-20", "2026-10-21", "2026-10-22"]) runner.runPass(amd(day));
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(1);
  });

  it("records the would-be sell at the bid when the window closes, and what the round trip won", () => {
    const { runner } = build();
    runner.runPass(amd("2026-10-20", 100));
    runner.runPass(amd("2026-10-29", 110)); // 5 days before: flat
    const run = runner.run("U-futurist-amd-run-up");
    const sell = run?.trades[1];
    expect(sell).toMatchObject({ side: "sell", quantity: 19, price: 109.95 });
    expect(sell?.realized).toBeCloseTo((109.95 - 100.05) * 19, 6);
    expect(run?.holding).toBeUndefined();
    expect(run?.roundTrips).toBe(1);
    expect(run?.realized).toBeCloseTo((109.95 - 100.05) * 19, 6);
  });

  it("counts each session day once", () => {
    const { runner } = build();
    runner.runPass(amd("2026-10-20"));
    runner.runPass(amd("2026-10-20"));
    runner.runPass(amd("2026-10-21"));
    expect(runner.run("U-futurist-amd-run-up")?.sessions).toEqual(["2026-10-20", "2026-10-21"]);
  });

  it("records nothing while the window is shut, and says why: no report date on file", () => {
    const { runner } = build({ calendar: [] });
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(0);
    expect(runner.report(REPORT_AT).plays[0]).toMatchObject({
      state: "watching",
      window: "no-window",
      sessions: 1,
    });
  });

  it("an event play is exactly as quiet as the play would be: the live roster hands it no events", () => {
    const { runner } = build();
    runner.setOrders([
      anOrder({
        id: "U-futurist-news",
        spec: aSpec({ slug: "news", trigger: { kind: "event-window", holdMinutes: 60 } }),
      }),
    ]);
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-news")?.tradeCount).toBe(0);
    // nothing ever signaled, so its window never opened and never closed
    expect(runner.report(REPORT_AT).plays[0]?.window).toBe("no-window");
  });
});

describe("the limits a real order faces are the limits the test faces", () => {
  it("writes down a refusal instead of a trade, once per day and reason", () => {
    const { runner } = build({ risk: { maxPositionPct: 0.00001 } }); // room for under one share
    runner.runPass(amd("2026-10-20"));
    runner.runPass(amd("2026-10-20"));
    runner.runPass(amd("2026-10-21"));
    const run = runner.run("U-futurist-amd-run-up");
    expect(run?.tradeCount).toBe(0);
    expect(run?.refusals.map((r) => `${r.day} ${r.side} ${r.symbol} ${r.reason}`)).toEqual([
      "2026-10-20 buy AMD position-cap",
      "2026-10-21 buy AMD position-cap",
    ]);
    expect(runner.report(REPORT_AT).plays[0]).toMatchObject({
      refused: 2,
      lastRefusal: { day: "2026-10-21", side: "buy", symbol: "AMD", reason: "position-cap" },
    });
  });

  it("a halt stops a new would-be buy but still lets a would-be sell record", () => {
    let halted: string | null = null;
    const { runner } = build({ blockedReason: () => halted });
    halted = "halted";
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(0);
    halted = null;
    runner.runPass(amd("2026-10-21"));
    halted = "halted";
    runner.runPass(amd("2026-10-29", 110));
    expect(runner.run("U-futurist-amd-run-up")?.trades.map((t) => t.side)).toEqual(["buy", "sell"]);
  });

  it("sizes the second leg against the book as the test left it, not the account's holdings", () => {
    const real: Portfolio = {
      cash: 90_000,
      positions: [{ symbol: "AMD", quantity: 100, avgPrice: 100 }],
    };
    const { runner } = build({ portfolioOf: () => real });
    runner.runPass(amd("2026-10-20", 100)); // the test is flat even though the account holds AMD
    expect(runner.run("U-futurist-amd-run-up")?.holding?.quantity).toBeGreaterThan(0);
    expect(real.positions[0]?.quantity).toBe(100); // the account itself is untouched
  });
});

describe("it waits, and says so, when it cannot run honestly", () => {
  it("has no pass without a live book for the author's bot", () => {
    const { runner } = build({ portfolioOf: () => undefined });
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-amd-run-up")?.sessions).toEqual([]);
    expect(runner.report(REPORT_AT).plays[0]).toMatchObject({ state: "waiting", sessions: 0 });
  });

  it("will not run a play that no longer clears the model's bounds", () => {
    const { runner } = build();
    runner.setOrders([
      anOrder({ spec: aSpec({ size: { conservative: 0.5, standard: 0.5, aggressive: 0.5 } }) }),
    ]);
    runner.runPass(amd("2026-10-20"));
    expect(runner.report(REPORT_AT).plays[0]?.state).toBe("invalid");
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(0);
  });

  it("reports 'waiting' before any pass has run", () => {
    expect(build().runner.report(REPORT_AT).plays[0]?.state).toBe("waiting");
  });
});

describe("the orders from the app decide which tests exist", () => {
  it("drops a play that left its test, with its ledger", () => {
    const removed: string[] = [];
    const { runner } = build({ store: memoryStore([], removed) });
    runner.runPass(amd("2026-10-20"));
    runner.setOrders([]);
    expect(runner.run("U-futurist-amd-run-up")).toBeUndefined();
    expect(runner.report(REPORT_AT).plays).toEqual([]);
    expect(removed).toEqual(["U-futurist-amd-run-up"]);
  });

  it("keeps the ledger when the same test is sent again", () => {
    const { runner } = build();
    runner.runPass(amd("2026-10-20"));
    runner.setOrders([anOrder()]);
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(1);
  });

  it("starts clean when the test began again or the spec was edited", () => {
    const { runner } = build();
    runner.runPass(amd("2026-10-20"));
    runner.setOrders([anOrder({ since: "2026-10-18T10:00:00.000Z" })]);
    expect(runner.run("U-futurist-amd-run-up")).toMatchObject({ tradeCount: 0, sessions: [] });
    runner.runPass(amd("2026-10-20"));
    runner.setOrders([
      anOrder({
        since: "2026-10-18T10:00:00.000Z",
        spec: aSpec({
          trigger: { kind: "pre-print-window", enterDaysBefore: 30, exitDaysBefore: 5 },
        }),
      }),
    ]);
    expect(runner.run("U-futurist-amd-run-up")?.tradeCount).toBe(0);
  });

  it("tests several plays at once, each on its own author's book", () => {
    const books: Record<string, Portfolio> = {
      futurist: { cash: 100_000, positions: [] },
      sauron: { cash: 10_000, positions: [] },
    };
    const { runner } = build({ portfolioOf: (id) => books[id] });
    runner.setOrders([
      anOrder(),
      anOrder({
        id: "U-sauron-amd-run-up",
        spec: aSpec({ authorAccountId: "sauron" }),
      }),
    ]);
    runner.runPass(amd("2026-10-20"));
    expect(runner.run("U-futurist-amd-run-up")?.trades[0]?.quantity).toBe(19);
    expect(runner.run("U-sauron-amd-run-up")?.trades[0]?.quantity).toBe(1);
  });
});

describe("the test survives a restart", () => {
  it("writes the ledger as it changes and a fresh runner picks it up", () => {
    const saved: ShadowRun[] = [];
    const store = memoryStore(saved);
    const first = build({ store });
    first.runner.runPass(amd("2026-10-20"));
    expect(saved.length).toBeGreaterThan(0);

    const second = new AuthoredShadowRunner({
      risk: RISK,
      blockedReason: () => null,
      portfolioOf: () => BOOK,
      calendar: CALENDAR,
      store,
    });
    expect(second.run("U-futurist-amd-run-up")).toMatchObject({
      tradeCount: 1,
      holding: { quantity: 19 },
    });
    second.setOrders([anOrder()]); // the app's poll after the restart: the same test, nothing lost
    second.runPass(amd("2026-10-21"));
    expect(second.run("U-futurist-amd-run-up")?.tradeCount).toBe(1); // already long: no second buy
  });

  it("does not write on a pass that changed nothing", () => {
    const saved: ShadowRun[] = [];
    const { runner } = build({ store: memoryStore(saved) });
    runner.runPass(amd("2026-10-20"));
    const before = saved.length;
    runner.runPass(amd("2026-10-20"));
    expect(saved.length).toBe(before);
  });
});

describe("what the app is told", () => {
  it("is the status line and the newest would-be trades, newest first, at most five", () => {
    const { runner } = build();
    runner.runPass(amd("2026-10-20", 100));
    runner.runPass(amd("2026-10-29", 110));
    const entry = runner.report(REPORT_AT).plays[0];
    expect(entry).toMatchObject({
      id: "U-futurist-amd-run-up",
      state: "watching",
      window: "flat",
      sessions: 2,
      tradeCount: 2,
      roundTrips: 1,
      refused: 0,
      lastPassAt: 1_700_000_000_000,
    });
    expect(entry?.recent.map((t) => t.side)).toEqual(["sell", "buy"]);
    expect(entry?.recent[0]).toMatchObject({ bid: 109.95, ask: 110.05, price: 109.95 });
  });
});

function memoryStore(saved: ShadowRun[] = [], removed: string[] = []): AuthoredShadowStore {
  const rows = new Map<string, ShadowRun>();
  return {
    loadAll: () => [...rows.values()],
    save: (run) => {
      rows.set(run.id, run);
      saved.push(run);
    },
    remove: (id) => {
      rows.delete(id);
      removed.push(id);
    },
  };
}
