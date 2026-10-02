import { readFileSync } from "node:fs";
import type { DraftLeg } from "../../app/src/live/draft-order";
import { chainMarks, outlookPick, outlookSearch } from "../../app/src/shell/outlook-pick";
import type { OptionLeg } from "../../src/options/payoff-surface";
import type { RankedCandidate } from "../../src/options/recommend";

/**
 * Picking a structure on the Outlook pane opens the chain on its legs (#3407, slice 4). The rule
 * being pinned is the fail-safe, not the arithmetic: a rung a member hasn't earned never widens
 * from a pick, exactly as `chainPickTarget` holds for a chain tap (#1461 — milestones gate, they
 * never drive). The strikes and the expiry still travel in that case; only the rung stays put.
 *
 * Also pinned: a rung this function can't find in the catalog reads as LOCKED. A missing plays index
 * (still loading, or a request that failed) must not be the one path that presets an unearned rung.
 */

const leg = (over: Partial<OptionLeg> = {}): OptionLeg => ({
  kind: "call",
  quantity: 1,
  strike: 180,
  daysToExpiry: 30,
  volatility: 0.4,
  entryPrice: 6.1,
  ...over,
});

const candidate = (over: Partial<RankedCandidate> = {}): RankedCandidate =>
  ({
    kind: "long-call",
    legs: [leg()],
    daysToExpiry: 30,
    expiration: "2026-11-20",
    risk: {
      entryCost: 610,
      maxProfit: { kind: "unbounded" },
      maxLoss: { kind: "amount", amount: 610 },
      breakEvens: [186.1],
    },
    score: {
      composite: 0.5,
      probabilityOfProfit: 0.4,
      targetProfit: 120,
      volFit: { reading: { kind: "absent", reason: "no-iv-history" } },
    },
    mechanics: "Profits if NVDA is above $186.10 in 30 days.",
    ...over,
  }) as RankedCandidate;

const open = (...codes: string[]) => codes.map((code) => ({ code, locked: false }) as never);
const EVERY_RUNG_OPEN = open("101", "102", "201", "202", "301", "302", "401");

describe("outlookPick", () => {
  it("presets the long-call rung for a single long call", () => {
    expect(outlookPick(candidate(), EVERY_RUNG_OPEN).play).toBe("302");
  });

  it("presets the long-put rung for a single long put", () => {
    const pick = outlookPick(
      candidate({ kind: "long-put", legs: [leg({ kind: "put" })] }),
      EVERY_RUNG_OPEN,
    );
    expect(pick.play).toBe("301");
  });

  it("reads the side off the LEG, not the structure's name — a lone short put is 201", () => {
    const pick = outlookPick(
      candidate({ legs: [leg({ kind: "put", quantity: -1 })] }),
      EVERY_RUNG_OPEN,
    );
    expect(pick.play).toBe("201");
  });

  it("sends anything multi-leg to the Spread builder, whose chain taps add legs", () => {
    const spread = candidate({
      kind: "bull-call-spread",
      legs: [leg({ strike: 180 }), leg({ strike: 190, quantity: -1 })],
    });
    expect(outlookPick(spread, EVERY_RUNG_OPEN).play).toBe("401");
  });

  it("returns every strike the structure sits on, ascending and deduplicated", () => {
    const condor = candidate({
      kind: "iron-condor",
      legs: [
        leg({ kind: "put", strike: 170, quantity: -1 }),
        leg({ kind: "put", strike: 160 }),
        leg({ kind: "call", strike: 190, quantity: -1 }),
        leg({ kind: "call", strike: 200 }),
      ],
    });
    expect(outlookPick(condor, EVERY_RUNG_OPEN).strikes).toEqual([160, 170, 190, 200]);
  });

  it("carries the structure's own expiry, so the chain opens on the right one", () => {
    expect(outlookPick(candidate(), EVERY_RUNG_OPEN).expiration).toBe("2026-11-20");
  });

  it("omits the expiry when the chain carried none, rather than inventing one", () => {
    const pick = outlookPick(candidate({ expiration: undefined }), EVERY_RUNG_OPEN);
    expect(pick.expiration).toBeUndefined();
  });

  it("withholds a LOCKED rung but still carries the strikes and the expiry", () => {
    const plays = [{ code: "302", locked: true }] as never[];
    const pick = outlookPick(candidate(), plays);
    expect(pick.play).toBeUndefined();
    expect(pick.locked).toBe(true);
    expect(pick.lockedPlay).toBe("302");
    expect(pick.strikes).toEqual([180]);
    expect(pick.expiration).toBe("2026-11-20");
  });

  it("treats a rung it cannot find as locked — fail safe, never fail open", () => {
    expect(outlookPick(candidate(), undefined).locked).toBe(true);
    expect(outlookPick(candidate(), []).play).toBeUndefined();
  });
});

describe("the Outlook pane's placement", () => {
  const trade = readFileSync("app/src/routes/trade.tsx", "utf8");

  it("is an auxiliary bench entry — shown only when asked, never auto-docked", () => {
    expect(trade).toContain('id === "chain" || id === "guidance" || id === "outlook"');
  });

  it("is in the section switch, which is a control role rather than a navigation word", () => {
    expect(trade).toContain('{ id: "outlook", label: "Outlook" }');
  });

  it("renders the pane through the one component, never a second inline copy", () => {
    expect(trade).toContain("<OutlookSection");
    expect(trade).toContain("onUse={(_candidate, pick) => props.onOutlookUse(pick)}");
  });
});

describe("outlookSearch", () => {
  const pick = () => outlookPick(candidate(), EVERY_RUNG_OPEN);

  it("lands on the chain pane, on the structure's expiry and lowest strike, rung preset", () => {
    expect(outlookSearch({ desk: "d1" }, pick())).toEqual({
      desk: "d1",
      section: "chain",
      exp: "2026-11-20",
      strike: "180",
      play: "302",
    });
  });

  it("takes the LOWEST strike of a multi-leg structure — the row the chain opens on", () => {
    const condor = candidate({
      kind: "iron-condor",
      legs: [leg({ strike: 200 }), leg({ strike: 160 }), leg({ strike: 190 })],
    });
    expect(outlookSearch({}, outlookPick(condor, EVERY_RUNG_OPEN)).strike).toBe("160");
  });

  it("omits the rung when it isn't earned — the contract still travels", () => {
    const withheld = outlookPick(candidate(), [{ code: "302", locked: true }] as never[]);
    const search = outlookSearch({}, withheld);
    expect(search).not.toHaveProperty("play");
    expect(search.strike).toBe("180");
    expect(search.section).toBe("chain");
  });

  it("omits the expiry rather than writing an empty one", () => {
    const search = outlookSearch(
      {},
      outlookPick(candidate({ expiration: undefined }), EVERY_RUNG_OPEN),
    );
    expect(search).not.toHaveProperty("exp");
  });
});

describe("chainMarks", () => {
  const legOf = (over: Partial<DraftLeg>): DraftLeg =>
    ({
      underlying: "NVDA",
      optionType: "call",
      strike: 190,
      expiration: "2026-11-20",
      action: "buy",
      contracts: 1,
      ...over,
    }) as DraftLeg;

  it("marks nothing as undefined, never as an empty set", () => {
    expect(chainMarks({ symbol: "NVDA", expiration: "", legs: [], spread: false })).toBeUndefined();
  });

  it("marks a pick's strikes on the symbol it was picked against", () => {
    const marks = chainMarks({
      symbol: "NVDA",
      expiration: "",
      legs: [],
      spread: false,
      picked: { symbol: "NVDA", strikes: [170, 180] },
    });
    expect(marks).toEqual([170, 180]);
  });

  it("drops a pick made against another underlying — a mark describes THIS chain", () => {
    const marks = chainMarks({
      symbol: "AMD",
      expiration: "",
      legs: [],
      spread: false,
      picked: { symbol: "NVDA", strikes: [170, 180] },
    });
    expect(marks).toBeUndefined();
  });

  it("marks the Spread draft's legs only while the Spread ticket is the one on screen", () => {
    const legs = [legOf({ strike: 190 })];
    expect(chainMarks({ symbol: "NVDA", expiration: "", legs, spread: true })).toEqual([190]);
    expect(chainMarks({ symbol: "NVDA", expiration: "", legs, spread: false })).toBeUndefined();
  });

  it("filters legs to the expiry the pane has browsed to, once it has one", () => {
    const legs = [legOf({ strike: 190 }), legOf({ strike: 200, expiration: "2026-12-18" })];
    expect(chainMarks({ symbol: "NVDA", expiration: "2026-11-20", legs, spread: true })).toEqual([
      190,
    ]);
    expect(chainMarks({ symbol: "NVDA", expiration: "", legs, spread: true })).toEqual([190, 200]);
  });

  it("merges legs and a pick without repeating a shared strike", () => {
    const marks = chainMarks({
      symbol: "NVDA",
      expiration: "",
      legs: [legOf({ strike: 190 })],
      spread: true,
      picked: { symbol: "NVDA", strikes: [180, 190] },
    });
    expect(marks).toEqual([190, 180]);
  });
});
