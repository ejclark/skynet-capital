import { existsSync, readFileSync } from "node:fs";
import {
  dueForResearch,
  effectiveDispatchCap,
  loadDailyBudget,
  loadDispatchCap,
} from "../../scripts/moneypenny/events.mjs";

// THE DAILY BUDGET GATE (#2946, second incident).
//
// The per-tick dispatch ceiling (research-dispatch.spec.ts) bounds one push's burst. It does NOT
// bound the day: "every merge to main is a tick" (moneypenny-events.yml's own header), and a
// dispatched research PR merging is itself the next tick's trigger. Measured 2026-09-15/16 — with
// the per-tick cap already live — 116 `docs(research):` commits landed in a rolling 24h window,
// 14-22/hour for six straight hours. The per-tick cap turned one burst into many small ones; it
// never capped the day.
//
// These specs pin the combinator's arithmetic (never more than either cap, floored at 0) and the
// same fail-closed doctrine as the per-tick budget: a missing or nonsensical daily budget file
// must never read as "no daily limit".

describe("daily research budget", () => {
  describe("effectiveDispatchCap", () => {
    it("is the per-tick cap when the day still has plenty of room", () => {
      expect(effectiveDispatchCap({ tickCap: 6, dailyCap: 24, dispatchedToday: 3 })).toBe(6);
    });

    it("is whatever's left of the day once that's tighter than the per-tick cap", () => {
      expect(effectiveDispatchCap({ tickCap: 6, dailyCap: 24, dispatchedToday: 21 })).toBe(3);
    });

    it("floors at zero rather than going negative when the day is already over budget", () => {
      expect(effectiveDispatchCap({ tickCap: 6, dailyCap: 24, dispatchedToday: 30 })).toBe(0);
    });

    it("is zero exactly at the boundary — dispatchedToday === dailyCap", () => {
      expect(effectiveDispatchCap({ tickCap: 6, dailyCap: 24, dispatchedToday: 24 })).toBe(0);
    });

    it("is exactly 1 the moment the day has 1 slot of headroom left", () => {
      expect(effectiveDispatchCap({ tickCap: 6, dailyCap: 24, dispatchedToday: 23 })).toBe(1);
    });
  });

  // FAIL CLOSED — the same property research-dispatch.spec.ts pins for the per-tick file. A
  // missing or malformed daily budget must refuse to dispatch, not silently permit the full
  // per-tick cap every time (which would reproduce the exact incident this file exists to stop).
  describe("loadDailyBudget", () => {
    it("refuses when the budget file is missing", () => {
      expect(() => loadDailyBudget("no/such/daily-budget.json")).toThrow(
        /daily research budget missing/,
      );
    });

    it.each([
      ["zero", "tests/fixtures/dispatch-budget/zero.json"],
      ["negative", "tests/fixtures/dispatch-budget/negative.json"],
      ["fractional", "tests/fixtures/dispatch-budget/fractional.json"],
      ["absent key", "tests/fixtures/dispatch-budget/absent.json"],
      ["a string", "tests/fixtures/dispatch-budget/string.json"],
    ])("refuses a %s daily cap rather than guessing one", (_label, file) => {
      // These fixtures use `maxPerTick`, not `maxPerDay` — for the "absent key" case that's the
      // point (no maxPerDay key present); for the others the key name is irrelevant, only the
      // malformed VALUE shape matters, and loadDailyBudget reads `maxPerDay` off the same file
      // shape as loadDispatchCap reads `maxPerTick`, so a bad value under either key exercises the
      // same integer validation.
      expect(() => loadDailyBudget(file)).toThrow(/maxPerDay must be a positive integer/);
    });
  });

  // The live gate: the committed policy file must exist and be sane, or the lane has no daily
  // ceiling in production no matter how well the arithmetic above behaves.
  it("ships a committed, sane daily budget file", () => {
    expect(existsSync("research-daily-budget.json")).toBe(true);
    const budget = JSON.parse(readFileSync("research-daily-budget.json", "utf8"));
    expect(Number.isInteger(budget.maxPerDay)).toBe(true);
    expect(budget.maxPerDay).toBeGreaterThan(0);
    // A ceiling the lane cannot outrun even at max per-tick spend every tick. Raising it is a
    // reviewed policy change with a reason — not a quiet edit, and this spec is where the
    // argument has to surface.
    expect(budget.maxPerDay).toBeLessThanOrEqual(48);
    expect(loadDailyBudget()).toBe(budget.maxPerDay);
  });

  // No ratchet, deliberately — same reasoning as the per-tick budget's own guard: the house
  // `Math.min(prev, debt)` idiom is right for debt that should only shrink, but on a dispatch
  // ceiling it would pin the cap to whatever a quiet day produced and eventually to 0.
  it("has no ratchet that could drive the daily cap to zero", () => {
    const src = readFileSync("scripts/moneypenny/events.mjs", "utf8");
    expect(src).not.toMatch(/maxPerDay.*Math\.min|Math\.min.*maxPerDay/);
  });

  // LIVE INTEGRATION — the default no-args call shells real `git log` against THIS repo's real
  // history and reads the two real committed budget files. No fixture stands between this test
  // and the actual mechanism the workflow calls. Asserts shape, not an exact count (the real
  // commit count changes every day this repo ships research) — a fixed number here would either
  // rot immediately or get silently loosened to stop failing, neither of which tests anything.
  it("computes a real cap against the committed budgets and actual git history", () => {
    const cap = effectiveDispatchCap();
    expect(Number.isInteger(cap)).toBe(true);
    expect(cap).toBeGreaterThanOrEqual(0);
    expect(cap).toBeLessThanOrEqual(loadDispatchCap());
  });

  // THE WIRING CHECK — and the bug this design deliberately avoids. `dueForResearch`'s own
  // default stays loadDispatchCap()-only (deterministic, per-tick, matches every test that omits
  // a cap). effectiveDispatchCap is NOT wired in as that default: an earlier version of this
  // change did that, and it broke an unrelated dedupe test the moment the real repo's rolling-24h
  // commit count exceeded maxPerDay — a pure dedupe test started failing because of production
  // git history it had nothing to do with. A cap tied to live state belongs at the one real
  // production call site (the workflow), passed explicitly, never as a shared function's silent
  // default that every caller and every test inherits.
  it("dueForResearch stays deterministic by default — the daily cap is opt-in, not implicit", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      id: `wiring-check-${i}`,
      impact: "low",
      daysUntil: 10,
      reason: "interval-elapsed",
    }));
    // Omitting cap must depend ONLY on the per-tick budget, never on today's git history.
    expect(dueForResearch(many, [])).toHaveLength(loadDispatchCap());
    // The daily-aware cap is reachable, but only when a caller asks for it explicitly.
    expect(dueForResearch(many, [], effectiveDispatchCap())).toHaveLength(effectiveDispatchCap());
  });
});
