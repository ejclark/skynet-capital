import { positionGuidance } from "../../src/options/position-guidance.js";
import { guidanceToMarkdown } from "../../src/options/position-guidance-markdown.js";
import type { HeldLongOption, PulseItem } from "../../src/options/position-guidance-types.js";
import { EXIT_DTE, TAKE_PROFIT } from "../../src/playbooks/long-call-rules.js";
import { inputs, NOW } from "./position-guidance-fixture.js";

/**
 * CALLS YOU HOLD (#5709 slice 2): the house's long-call exit rules, read for a call the member
 * bought. The calendar is the frozen CRWV world (today 2026-09-25), so Nov 20 is 56 days out and
 * Nov 6 is 42 — the first outside the time stop, the second inside it.
 */

const call = (over: Partial<HeldLongOption> = {}): HeldLongOption => ({
  type: "call",
  strike: 90,
  expiration: "2026-11-20",
  contracts: 5,
  costPerContract: 12,
  bid: 6,
  ask: 6.4,
  ...over,
});

const longOf = (held: HeldLongOption[], pulse?: PulseItem[]) =>
  positionGuidance(inputs({ stake: { cash: 5_000, heldCalls: held }, ...(pulse ? { pulse } : {}) }))
    .longCalls;

describe("calls you hold — the house's two exit rules, offered to the member", () => {
  it("holds a call outside both rules, and names the day the time stop falls due", () => {
    const [m] = longOf([call()]);
    expect(m?.call).toBe("HOLD");
    expect(m?.until?.date).toBe("2026-10-06"); // 45 days before Nov 20
    expect(m?.reasons.map((r) => r.text).join(" ")).toContain("$24.00 a share");
    expect(m?.provesWrong).toContain("$24.00");
  });

  it("takes profit once the bid is the house's multiple of what was paid", () => {
    const [m] = longOf([call({ bid: TAKE_PROFIT * 12 })]);
    expect(m?.call).toBe("TAKE PROFIT");
    expect(m?.multiple).toBe(TAKE_PROFIT);
    expect(m?.reasons[0]?.text).toContain("2.0× it");
    expect(m?.reasons[1]?.text).toContain("frees the cash for your next trade");
  });

  it("just short of the multiple is still a hold", () => {
    expect(longOf([call({ bid: TAKE_PROFIT * 12 - 0.01 })])[0]?.call).toBe("HOLD");
  });

  it("calls the time stop inside the exit window whatever the return — up, down, or flat", () => {
    for (const bid of [3, 12, 30]) {
      const [m] = longOf([call({ expiration: "2026-11-06", bid })]);
      expect(m?.call).toBe("TIME STOP");
      expect(m?.dte).toBeLessThanOrEqual(EXIT_DTE);
      expect(m?.reasons[0]?.text).toContain("42 days left");
    }
  });

  it("answers the time stop with no quote at all — it is a calendar fact", () => {
    const [m] = longOf([call({ expiration: "2026-11-06", bid: undefined, ask: undefined })]);
    expect(m?.call).toBe("TIME STOP");
  });

  it("has no answer without a price to sell at, outside the time stop", () => {
    const [m] = longOf([call({ bid: undefined })]);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toContain("No live price to sell it at");
  });

  it("has no answer on option prices the pulse calls out of date", () => {
    const pulse: PulseItem[] = [
      { id: "chain", source: "Alpaca", asOf: NOW, status: "stale", note: "20 min old" },
    ];
    const [m] = longOf([call()], pulse);
    expect(m?.call).toBe("NO ANSWER");
    expect(m?.reasons[0]?.text).toContain("out of date");
  });

  it("has no answer for a call that already expired", () => {
    expect(longOf([call({ expiration: "2026-09-18" })])[0]?.call).toBe("NO ANSWER");
  });

  it("plans the sale for the open when the market is closed — never an instruction for now", () => {
    const closed = positionGuidance(
      inputs({ sessionOpen: false, stake: { heldCalls: [call({ bid: 30 })] } }),
    );
    expect(closed.longCalls[0]?.atOpen).toBe(true);
    const hold = positionGuidance(inputs({ sessionOpen: false, stake: { heldCalls: [call()] } }));
    expect(hold.longCalls[0]?.atOpen).toBe(false);
  });

  it("judges each held call on its own, soonest first, and skips a bought put", () => {
    const g = longOf([call({ strike: 100 }), call({ expiration: "2026-11-06" })]);
    expect(g.map((m) => m.call)).toEqual(["TIME STOP", "HOLD"]);
    const put = positionGuidance(inputs({ stake: { longOption: call({ type: "put" }) } }));
    expect(put.longCalls).toEqual([]);
  });

  it("reads a typed-in long call too, without doubling one the account already holds", () => {
    const typed = positionGuidance(inputs({ stake: { longOption: call() } }));
    expect(typed.longCalls).toHaveLength(1);
    const both = positionGuidance(
      inputs({ stake: { longOption: call({ bid: undefined }), heldCalls: [call()] } }),
    );
    expect(both.longCalls).toHaveLength(1);
    expect(both.longCalls[0]?.call).toBe("HOLD");
  });

  it("drops a held call that isn't a real position instead of judging it", () => {
    const junk = [call({ strike: 0 }), call({ costPerContract: -1 }), call({ expiration: "soon" })];
    expect(longOf(junk)).toEqual([]);
    expect(longOf([...junk, call()])).toHaveLength(1);
  });

  it("is empty for a member who holds no long call", () => {
    expect(positionGuidance(inputs()).longCalls).toEqual([]);
    expect(guidanceToMarkdown(positionGuidance(inputs()))).not.toContain("Calls you hold");
  });

  it("offers a rule, never an order: no action button text, and the markdown has its own section", () => {
    const g = positionGuidance(inputs({ stake: { heldCalls: [call({ bid: 30 })] } }));
    const md = guidanceToMarkdown(g);
    expect(md).toContain("### 3c · Calls you hold");
    expect(md).toContain("**Take profit**");
    expect(md).toContain("2.5× paid");
  });
});
