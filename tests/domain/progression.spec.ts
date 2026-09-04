import {
  deriveEarned,
  earnedCodes,
  LADDER_GATE_MILESTONE,
  LADDER_GATE_NOTE,
  type LadderFill,
  type LadderTag,
  ladderGated,
  milestoneForCode,
  nextUp,
  unlockedCodes,
} from "../../src/domain/progression.js";

const fill = (over: Partial<LadderFill>): LadderFill => ({
  orderId: "o1",
  symbol: "AAPL",
  side: "buy",
  filledQuantity: 10,
  at: "2026-08-25T14:00:00.000Z",
  ...over,
});

const OCC_PUT = "MSFT260918P00420000";
const OCC_CALL = "MSFT260918C00500000";

describe("deriveEarned — milestones from real fills, never a checkbox", () => {
  it("earns the stock milestones from equity fills alone — no tag needed (free backfill)", () => {
    const earned = deriveEarned(
      [fill({ orderId: "b1", side: "buy" }), fill({ orderId: "s1", side: "sell" })],
      [],
    );
    expect(earned.map((m) => m.milestoneId)).toEqual(["first-buy", "first-sell"]);
    expect(earned[0]).toMatchObject({ code: "101", orderId: "b1" });
  });

  it("earns an option milestone only through its open tag", () => {
    const fills = [fill({ orderId: "p1", symbol: OCC_PUT, side: "sell", filledQuantity: 2 })];
    expect(deriveEarned(fills, [])).toEqual([]); // untagged option fill proves nothing
    const earned = deriveEarned(fills, [{ orderId: "p1", code: "201", intent: "open" }]);
    expect(earned).toEqual([
      {
        milestoneId: "first-cash-secured-put",
        code: "201",
        orderId: "p1",
        at: "2026-08-25T14:00:00.000Z",
      },
    ]);
  });

  it("never counts a close-side option fill — buying back a short put is not a long put", () => {
    const fills = [fill({ orderId: "c1", symbol: OCC_PUT, side: "buy", filledQuantity: 2 })];
    const tags: LadderTag[] = [{ orderId: "c1", intent: "close" }];
    expect(deriveEarned(fills, tags)).toEqual([]);
  });

  it("ignores an unfilled order — submission is not proof", () => {
    expect(deriveEarned([fill({ filledQuantity: 0 })], [])).toEqual([]);
  });

  it("is idempotent, keeping the EARLIEST fill as the evidence for each code", () => {
    const fills = [
      fill({ orderId: "b2", at: "2026-08-25T15:00:00.000Z" }),
      fill({ orderId: "b1", at: "2026-08-24T15:00:00.000Z" }),
    ];
    const once = deriveEarned(fills, []);
    expect(once).toEqual(deriveEarned(fills, []));
    expect(once).toHaveLength(1);
    expect(once[0]?.orderId).toBe("b1");
  });

  it("classifies every option leg by its tag: 202 covered call, 301 long put, 302 long call", () => {
    const earned = deriveEarned(
      [
        fill({ orderId: "cc", symbol: OCC_CALL, side: "sell", filledQuantity: 1 }),
        fill({ orderId: "lp", symbol: OCC_PUT, side: "buy", filledQuantity: 1 }),
        fill({ orderId: "lc", symbol: OCC_CALL, side: "buy", filledQuantity: 1 }),
      ],
      [
        { orderId: "cc", code: "202", intent: "open" },
        { orderId: "lp", code: "301", intent: "open" },
        { orderId: "lc", code: "302", intent: "open" },
      ],
    );
    expect(earned.map((m) => m.code)).toEqual(["202", "301", "302"]); // ladder order
  });
});

describe("the ladder — sequential unlocks with training wheels on", () => {
  it("opens only 101 for a brand-new trader", () => {
    expect([...unlockedCodes(new Set())]).toEqual(["101"]);
  });

  it("opens each rung when the one before it is earned", () => {
    expect(unlockedCodes(new Set(["101"])).has("102")).toBe(true);
    expect(unlockedCodes(new Set(["101"])).has("201")).toBe(false);
    const throughWheel = unlockedCodes(new Set(["101", "102", "201", "202"]));
    expect(throughWheel.has("301")).toBe(true);
    expect(throughWheel.has("302")).toBe(false);
  });

  it("never locks away a trade the member has already done (seeded history with gaps)", () => {
    const gappy = unlockedCodes(new Set(["101", "201"]));
    expect(gappy.has("201")).toBe(true); // earned → open, even though 102 is not
    expect(gappy.has("202")).toBe(true); // and the rung after an earned one opens
  });

  it("points at the next unearned rung, and at nothing once the ladder is done", () => {
    const earned = new Set(["101"] as const);
    expect(nextUp(unlockedCodes(earned), earned)).toBe("102");
    const all = new Set(["101", "102", "201", "202", "301", "302"] as const);
    expect(nextUp(unlockedCodes(all), all)).toBeUndefined();
  });

  it("resolves every ladder code to its curriculum milestone", () => {
    expect(milestoneForCode("201")?.id).toBe("first-cash-secured-put");
    expect(earnedCodes([{ milestoneId: "first-buy", code: "101", orderId: "x", at: "t" }])).toEqual(
      new Set(["101"]),
    );
  });
});

describe("the message gate on the ladder (#1119, lowered 2026-09-03)", () => {
  it("holds with wheels on and nothing said, and lifts the moment first-message is earned", () => {
    expect(ladderGated(true, new Set())).toBe(true);
    expect(ladderGated(true, new Set(["first-message"]))).toBe(false);
  });

  it("also lifts for a member who filed real feedback — that proves a message too", () => {
    expect(ladderGated(true, new Set(["first-feedback"]))).toBe(false);
  });

  it("never gates a member with the wheels off", () => {
    expect(ladderGated(false, new Set())).toBe(false);
  });

  it("names the remedy in one sentence a member can act on", () => {
    expect(LADDER_GATE_NOTE).toContain("hello to Moneypenny");
    expect(LADDER_GATE_MILESTONE).toBe("first-message");
  });
});
