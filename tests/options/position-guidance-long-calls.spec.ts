import type { LeverContext } from "../../src/options/position-guidance-levers.js";
import { longCallCalls } from "../../src/options/position-guidance-long.js";
import type {
  GuidanceStake,
  HeldLongOption,
  PulseItem,
} from "../../src/options/position-guidance-types.js";
import { EXIT_DTE, TAKE_PROFIT } from "../../src/playbooks/long-call-rules.js";
import { inputs, NOW } from "./position-guidance-fixture.js";

/**
 * CALLS YOU HOLD, read straight from the long-call reader (#5709 slice 2). The sibling spec
 * (`position-guidance-long.spec.ts`) drives it through `positionGuidance`; this one pins the edges
 * that path hides — the exact day the time stop starts, the pulse gates in their order, how the
 * three-line cap treats the warnings, and the wording of a call that is under water.
 * Frozen calendar: today is 2026-09-25, so 2026-11-09 is exactly 45 days out.
 */

const TODAY = "2026-09-25";
const dayPlus = (n: number): string =>
  new Date(Date.parse(`${TODAY}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

const call = (over: Partial<HeldLongOption> = {}): HeldLongOption => ({
  type: "call",
  strike: 90,
  expiration: dayPlus(90),
  contracts: 2,
  costPerContract: 10,
  bid: 12,
  ask: 12.5,
  ...over,
});

const ctxOf = (stake: GuidanceStake, pulse?: PulseItem[]): LeverContext => ({
  input: inputs({ stake, ...(pulse ? { pulse } : {}) }),
  today: TODAY,
  strip: [],
  richness: { verdict: "unknown", basis: "none" },
});

const read = (held: HeldLongOption[], pulse?: PulseItem[]) =>
  longCallCalls(ctxOf({ heldCalls: held }, pulse));

const pulseItem = (over: Partial<PulseItem> & Pick<PulseItem, "id" | "status">): PulseItem => ({
  source: "test feed",
  asOf: NOW,
  note: "a note",
  ...over,
});

describe("when a call sits right at the edge of the time stop", () => {
  it("calls the time stop on exactly the last day of the window, and not a day earlier", () => {
    const [onEdge] = read([call({ expiration: dayPlus(EXIT_DTE) })]);
    expect(onEdge?.dte).toBe(EXIT_DTE);
    expect(onEdge?.call).toBe("TIME STOP");
    const [justOutside] = read([call({ expiration: dayPlus(EXIT_DTE + 1) })]);
    expect(justOutside?.call).toBe("HOLD");
  });

  it("lets time win over profit when a rich call is also inside the window", () => {
    const [m] = read([call({ expiration: dayPlus(EXIT_DTE), bid: TAKE_PROFIT * 10 * 3 })]);
    expect(m?.call).toBe("TIME STOP");
  });

  it("says '1 day left' in the singular on the eve of expiry, and still answers on expiry day", () => {
    const [eve] = read([call({ expiration: dayPlus(1) })]);
    expect(eve?.call).toBe("TIME STOP");
    expect(eve?.reasons[0]?.text).toMatch(/^1 day left /);
    const [today] = read([call({ expiration: TODAY })]);
    expect(today?.call).toBe("TIME STOP");
    expect(today?.dte).toBe(0);
    expect(today?.reasons[0]?.text).toMatch(/^0 days left /);
  });

  it("treats yesterday's expiry as expired, with no verdict and no confidence", () => {
    const [m] = read([call({ expiration: dayPlus(-1) })]);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.confidence).toBe("none");
    expect(m?.dte).toBe(-1);
    expect(m?.reasons).toHaveLength(1);
    expect(m?.reasons[0]?.text).toContain("expired");
    expect(m?.provesWrong).toBe("");
    expect(m?.until).toBeUndefined();
  });
});

describe("when the call is judged", () => {
  it("carries its own contract terms through to the verdict", () => {
    const [m] = read([call({ strike: 95, contracts: 7, expiration: dayPlus(60) })]);
    expect(m).toMatchObject({ strike: 95, contracts: 7, expiration: dayPlus(60), dte: 60 });
  });

  it("grades a real verdict medium — never high, since nothing here is a sure thing", () => {
    expect(read([call()])[0]?.confidence).toBe("medium");
    expect(read([call({ bid: 25 })])[0]?.confidence).toBe("medium");
    expect(read([call({ expiration: dayPlus(10) })])[0]?.confidence).toBe("medium");
  });

  it("reports the bid as a multiple of what was paid", () => {
    expect(read([call({ bid: 15 })])[0]?.multiple).toBeCloseTo(1.5);
    expect(read([call({ bid: 4 })])[0]?.multiple).toBeCloseTo(0.4);
  });

  it("leaves the multiple out when there is no bid, even on a time stop", () => {
    const [m] = read([call({ expiration: dayPlus(10), bid: undefined })]);
    expect(m?.call).toBe("TIME STOP");
    expect(m?.multiple).toBeUndefined();
  });
});

describe("when the call is under water", () => {
  it("says what share of the cost the bid is, rather than a multiple below one", () => {
    const [m] = read([call({ bid: 5 })]);
    expect(m?.call).toBe("HOLD");
    expect(m?.reasons[0]?.text).toBe("The bid is $5.00 against the $10.00 you paid — 50% of it.");
  });

  it("states the price against cost on a time stop, so the member sees the loss they would book", () => {
    const [m] = read([call({ expiration: dayPlus(20), bid: 4 })]);
    expect(m?.call).toBe("TIME STOP");
    const text = m?.reasons.map((r) => r.text).join(" ");
    expect(text).toContain("$4.00 against the $10.00 you paid — 40% of it");
  });

  it("states a time stop's gain as a multiple, once the bid is above cost", () => {
    const [m] = read([call({ expiration: dayPlus(20), bid: 23 })]);
    expect(m?.reasons.map((r) => r.text).join(" ")).toContain("— 2.3× it");
  });

  it("still names the time stop when the cost was never recorded, with no price line", () => {
    const [m] = read([call({ expiration: dayPlus(20), costPerContract: 0 })]);
    expect(m?.call).toBe("TIME STOP");
    expect(m?.multiple).toBeUndefined();
    expect(m?.reasons.map((r) => r.text).join(" ")).not.toContain("you paid");
  });
});

describe("when the verdict is a time stop", () => {
  it("is due by the expiry itself and proves wrong if the stock jumps first", () => {
    const exp = dayPlus(30);
    const [m] = read([call({ expiration: exp })]);
    expect(m?.until?.date).toBe(exp);
    expect(m?.provesWrong).toContain("If the stock jumps before");
  });

  it("offers the rule without selling: the member is told selling is their call", () => {
    const [m] = read([call({ expiration: dayPlus(30) })]);
    expect(m?.reasons.map((r) => r.text).join(" ")).toContain("nothing sells from here");
  });
});

describe("when the verdict is take profit", () => {
  it("is due when the time stop falls, 45 days before expiry, and says what holding risks", () => {
    const exp = dayPlus(100);
    const [m] = read([call({ expiration: exp, bid: TAKE_PROFIT * 10 })]);
    expect(m?.call).toBe("TAKE PROFIT");
    expect(m?.until?.date).toBe(dayPlus(100 - EXIT_DTE));
    expect(m?.provesWrong).toContain("pullback risk");
    expect(m?.provesWrong).toContain("100 days");
  });

  it("is a plan for the open, not an order, when the market is shut", () => {
    const shut = longCallCalls({
      ...ctxOf({ heldCalls: [call({ bid: 25 })] }),
      input: inputs({ sessionOpen: false, stake: { heldCalls: [call({ bid: 25 })] } }),
    });
    expect(shut[0]?.call).toBe("TAKE PROFIT");
    expect(shut[0]?.atOpen).toBe(true);
  });

  it("plans a time stop for the open too, but never flags a no-answer for it", () => {
    const stake = { heldCalls: [call({ expiration: dayPlus(10) }), call({ bid: undefined })] };
    const shut = longCallCalls({ ...ctxOf(stake), input: inputs({ sessionOpen: false, stake }) });
    expect(shut.map((m) => [m.call, m.atOpen])).toEqual([
      ["TIME STOP", true],
      ["NO ANSWER", false],
    ]);
  });
});

describe("when the verdict is hold", () => {
  it("names the bid that would fire take-profit and the day the time stop falls due", () => {
    const exp = dayPlus(100);
    const [m] = read([call({ expiration: exp, costPerContract: 8, bid: 9 })]);
    expect(m?.call).toBe("HOLD");
    const text = m?.reasons.map((r) => r.text).join(" ") ?? "";
    expect(text).toContain(`$${(TAKE_PROFIT * 8).toFixed(2)} a share`);
    expect(text).toContain("The bid is $9.00 against the $8.00 you paid — 1.1× it");
    expect(m?.until?.date).toBe(dayPlus(100 - EXIT_DTE));
    expect(m?.until?.why).toContain("$16.00");
  });

  it("never plans a hold for the open — only a sale is a plan", () => {
    const stake = { heldCalls: [call()] };
    const shut = longCallCalls({ ...ctxOf(stake), input: inputs({ sessionOpen: false, stake }) });
    expect(shut[0]?.atOpen).toBe(false);
  });
});

describe("when the market feeds say the price can't be trusted", () => {
  const blocker = pulseItem({
    id: "session",
    status: "aging",
    note: "after hours, marks and stock disagree",
    blocksPricing: true,
  });

  it("has no answer on a call outside the time stop, quoting the reason", () => {
    const [m] = read([call({ bid: 30 })], [blocker]);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toBe(
      "Prices can't be trusted until the market opens — after hours, marks and stock disagree.",
    );
    expect(m?.confidence).toBe("none");
  });

  it("still calls the time stop, since a calendar fact needs no price", () => {
    const [m] = read([call({ expiration: dayPlus(20) })], [blocker]);
    expect(m?.call).toBe("TIME STOP");
  });

  it("checks for a missing quote before the pricing blocker", () => {
    const [m] = read([call({ bid: undefined })], [blocker]);
    expect(m?.reasons[0]?.text).toContain("No live price to sell it at");
  });

  it("checks the blocker before stale option prices when both apply", () => {
    const stale = pulseItem({ id: "chain", status: "stale", note: "30 min old" });
    const [m] = read([call()], [blocker, stale]);
    expect(m?.reasons[0]?.text).toContain("Prices can't be trusted");
  });

  it("quotes the stale note and tells the member to refresh before acting", () => {
    const stale = pulseItem({ id: "chain", status: "stale", note: "30 min old" });
    const [m] = read([call()], [stale]);
    expect(m?.reasons[0]?.text).toBe(
      "Option prices are out of date — 30 min old. Refresh before acting.",
    );
  });

  it("answers a time stop through stale option prices, since it needs none", () => {
    const stale = pulseItem({ id: "chain", status: "stale", note: "30 min old" });
    expect(read([call({ expiration: dayPlus(5) })], [stale])[0]?.call).toBe("TIME STOP");
  });

  it("does not treat a fresh or aging chain as a reason to withhold", () => {
    for (const status of ["fresh", "aging"] as const) {
      const chain = pulseItem({ id: "chain", status });
      expect(read([call()], [chain])[0]?.call).toBe("HOLD");
    }
  });

  it("answers normally when the pulse is empty", () => {
    expect(read([call()], [])[0]?.call).toBe("HOLD");
  });
});

describe("when the stock price is only partly verified", () => {
  const aging = pulseItem({ id: "spot", status: "aging", note: "one source of two agrees" });

  it("leads with the caveat, and keeps the verdict", () => {
    const [m] = read([call()], [aging]);
    expect(m?.call).toBe("HOLD");
    expect(m?.reasons[0]).toMatchObject({ rule: "PULSE" });
    expect(m?.reasons[0]?.text).toBe(
      "The stock price is only partly verified — one source of two agrees. Confidence capped at medium.",
    );
  });

  it("never shows more than three reasons, so the caveat pushes out the least important", () => {
    const [hold] = read([call()], [aging]);
    expect(hold?.reasons).toHaveLength(3);
    expect(hold?.reasons.map((r) => r.rule)).toEqual(["PULSE", "EXIT-PROFIT", "EXIT-PROFIT"]);
    const [profit] = read([call({ bid: 25 })], [aging]);
    expect(profit?.reasons.map((r) => r.rule)).toEqual(["PULSE", "EXIT-PROFIT", "MANAGE"]);
  });

  it("adds no caveat when the stock price is fresh", () => {
    const fresh = pulseItem({ id: "spot", status: "fresh" });
    expect(read([call()], [fresh])[0]?.reasons.some((r) => r.rule === "PULSE")).toBe(false);
  });

  it("does not add the caveat to a no-answer, which already says it can't judge", () => {
    const [m] = read([call({ bid: undefined })], [aging]);
    expect(m?.reasons).toHaveLength(1);
    expect(m?.reasons[0]?.text).toContain("No live price");
  });
});

describe("when more than one call is held", () => {
  it("orders by expiry, then strike, soonest and lowest first", () => {
    const e1 = dayPlus(60);
    const e2 = dayPlus(80);
    const out = read([
      call({ expiration: e2, strike: 80 }),
      call({ expiration: e1, strike: 100 }),
      call({ expiration: e1, strike: 90 }),
    ]);
    expect(out.map((m) => [m.expiration, m.strike])).toEqual([
      [e1, 90],
      [e1, 100],
      [e2, 80],
    ]);
  });

  it("keeps two strikes on the same expiry apart", () => {
    const e = dayPlus(60);
    expect(
      read([call({ expiration: e, strike: 90 }), call({ expiration: e, strike: 95 })]),
    ).toHaveLength(2);
  });

  it("reads the typed-in call alongside a different held one", () => {
    const out = longCallCalls(
      ctxOf({
        heldCalls: [call({ strike: 90 })],
        longOption: call({ strike: 100, expiration: dayPlus(70) }),
      }),
    );
    expect(out.map((m) => [m.strike, m.dte])).toEqual([
      [100, 70],
      [90, 90],
    ]);
  });

  it("prefers the account's copy of a call over the typed-in duplicate, since it has the live quote", () => {
    const out = longCallCalls(
      ctxOf({
        heldCalls: [call({ bid: 25 })],
        longOption: call({ bid: undefined }),
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.call).toBe("TAKE PROFIT");
  });

  it("ignores a typed-in put and a stake with nothing held", () => {
    expect(longCallCalls(ctxOf({ longOption: call({ type: "put" }) }))).toEqual([]);
    expect(longCallCalls(ctxOf({}))).toEqual([]);
  });
});
