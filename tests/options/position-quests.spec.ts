import { type Quest, rankQuests } from "../../src/domain/quest.js";
import { accountStake } from "../../src/options/account-stake.js";
import { positionGuidance } from "../../src/options/position-guidance.js";
import type {
  GuidanceStake,
  HeldLongOption,
  OpenCall,
} from "../../src/options/position-guidance-types.js";
import { positionQuests } from "../../src/options/position-quests.js";
import { inputs, quoteAt } from "./position-guidance-fixture.js";

/**
 * QUESTS FROM YOUR POSITIONS (#7028 slice 1). The frozen CRWV world (today 2026-09-25, spot $80):
 * guidance judges each call, and only a verdict that asks for an order becomes a quest.
 *
 *   WHEN position guidance returns an act verdict for a member's position, the system SHALL offer it
 *   as a quest from source "position", with the move, the why, the guidance's rule id, the exits and
 *   an expiry, and SHALL return nothing for a hold verdict.
 */

const DESK = "member-1";

const held = (over: Partial<HeldLongOption> = {}): HeldLongOption => ({
  type: "call",
  strike: 90,
  expiration: "2026-11-20",
  contracts: 2,
  costPerContract: 12,
  bid: 6,
  ask: 6.4,
  ...over,
});

function sold(expiration: string, strike: number, premium: number): OpenCall {
  const q = quoteAt(expiration, strike, "call");
  return {
    occ: `CRWV${expiration.slice(2).replaceAll("-", "")}C${String(strike * 1000).padStart(8, "0")}`,
    strike,
    expiration,
    contracts: 1,
    premium,
    ...(q.bid !== undefined ? { bid: q.bid } : {}),
    ...(q.ask !== undefined ? { ask: q.ask } : {}),
  };
}

const questsOf = (stake: GuidanceStake, sessionOpen = true) =>
  positionQuests(DESK, positionGuidance(inputs({ stake, sessionOpen })));

describe("position quests — calls you hold", () => {
  it("offers a take profit as a sell-to-close quest, with the rule id and an expiry", () => {
    const [q, ...rest] = questsOf({ heldCalls: [held({ bid: 24 })] });
    expect(rest).toEqual([]);
    expect(q?.source).toBe("position");
    expect(q?.move.kind).toBe("sell-to-close");
    expect(q?.move.label).toBe("Take profit: sell your 2 CRWV $90 calls (Nov 20)");
    expect(q?.move.occ).toBe("CRWV261120C00090000");
    expect(q?.move.contracts).toBe(2);
    expect(q?.why[0]?.rule).toBe("EXIT-PROFIT");
    expect(q?.expires.date).toBe("2026-10-06"); // the time stop takes over here
    expect(q?.exits).toEqual([]); // a close IS the exit
    expect(q?.houseCall).toBe("take");
    expect(q?.id).toBe("position:CRWV261120C00090000:take-profit");
  });

  it("offers a time stop, which holds until the call expires", () => {
    const [q] = questsOf({ heldCalls: [held({ expiration: "2026-11-06", contracts: 1 })] });
    expect(q?.move.label).toBe("Time stop: sell your CRWV $90 call (Nov 6)");
    expect(q?.why[0]?.rule).toBe("EXIT-TIME");
    expect(q?.expires).toEqual({ date: "2026-11-06", why: "the call expires" });
  });

  it("returns nothing for a hold, or for no answer", () => {
    expect(questsOf({ heldCalls: [held()] })).toEqual([]);
    expect(questsOf({ heldCalls: [held({ bid: undefined, ask: undefined })] })).toEqual([]);
  });

  it("drafts on Trade for review — the member fires it, nothing places", () => {
    const [q] = questsOf({ heldCalls: [held({ bid: 24 })] });
    expect(q?.move.href).toBe(
      "/app/trade?desk=member-1&symbol=CRWV&section=orders&manage=CRWV261120C00090000" +
        "&quest=position%3ACRWV261120C00090000%3Atake-profit",
    );
  });

  it("marks a quest read with the market closed as a plan for the open", () => {
    const [q] = questsOf({ heldCalls: [held({ expiration: "2026-11-06" })] }, false);
    expect(q?.atOpen).toBe(true);
  });
});

describe("position quests — calls you've sold", () => {
  const STAKE: GuidanceStake = { shares: 400, costBasis: 70, callsSold: 1 };

  it("offers a buy back once half the premium is kept", () => {
    const ask = sold("2026-10-16", 100, 1).ask ?? 0;
    const [q] = questsOf({ ...STAKE, openCalls: [sold("2026-10-16", 100, ask * 2)] });
    expect(q?.move.kind).toBe("buy-to-close");
    expect(q?.move.label).toBe("Buy back your CRWV $100 call (Oct 16)");
    expect(q?.why[0]?.rule).toBe("MANAGE");
    expect(q?.exits).toEqual([]);
  });

  it("offers a roll with its second leg and the new call's exits", () => {
    const [q] = questsOf({ ...STAKE, openCalls: [sold("2026-11-13", 95, 4)] });
    expect(q?.move.kind).toBe("roll");
    expect(q?.move.rollTo?.strike).toBeGreaterThanOrEqual(95);
    expect(q?.move.label).toMatch(
      /^Roll your CRWV \$95 call \(Nov 13\) to the \$\d+ call \(\w+ \d+\)$/,
    );
    expect(q?.exits.map((e) => e.kind)).toEqual(["take-profit", "time"]);
  });

  it("returns nothing for a call it says to keep", () => {
    const ask = sold("2026-10-16", 100, 1).ask ?? 0;
    expect(questsOf({ ...STAKE, openCalls: [sold("2026-10-16", 100, ask * 1.2)] })).toEqual([]);
  });

  it("returns nothing for 'let it go' — it asks for no order", () => {
    const quests = questsOf({ ...STAKE, goal: "exit", openCalls: [sold("2026-10-02", 75, 3)] });
    expect(quests).toEqual([]);
  });
});

describe("position quests — honesty", () => {
  it("says untested in words: no study measures these exit rules yet", () => {
    const [q] = questsOf({ heldCalls: [held({ bid: 24 })] });
    expect(q?.baseRate.kind).toBe("untested");
    if (q?.baseRate.kind === "untested") expect(q.baseRate.note).toContain("not a tested rate");
  });

  it("never says a time is good or great to buy", () => {
    const all = [
      ...questsOf({ heldCalls: [held({ bid: 24 }), held({ expiration: "2026-11-06" })] }),
      ...questsOf({ shares: 400, costBasis: 70, openCalls: [sold("2026-11-13", 95, 4)] }),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const q of all) {
      const text = [q.move.label, ...q.why.map((w) => w.text), ...q.exits.map((e) => e.text)].join(
        " ",
      );
      expect(text).not.toMatch(/\b(good|great) time\b/i);
    }
  });
});

describe("rankQuests", () => {
  const base = (id: string, over: Partial<Quest> = {}): Quest => ({
    id,
    source: "position",
    move: { kind: "sell-to-close", label: id, symbol: "X", href: "/" },
    why: [],
    baseRate: { kind: "untested", note: "" },
    exits: [],
    expires: { date: "2026-12-01", why: "" },
    houseCall: "take",
    confidence: "medium",
    atOpen: false,
    ...over,
  });
  const tested = (rate: number) =>
    ({
      kind: "tested",
      rate,
      sample: 40,
      worstDecile: -0.2,
      source: "docs/research/x.md",
    }) as const;

  it("puts every tested quest above every untested one, the higher rate first", () => {
    const order = rankQuests([
      base("untested-high", { confidence: "high" }),
      base("tested-low", { baseRate: tested(0.4) }),
      base("tested-high", { baseRate: tested(0.6) }),
    ]).map((q) => q.id);
    expect(order).toEqual(["tested-high", "tested-low", "untested-high"]);
  });

  it("puts a stand-aside last, then sorts by confidence, then the soonest expiry", () => {
    const order = rankQuests([
      base("aside", { houseCall: "stand-aside", baseRate: tested(0.9) }),
      base("later", { expires: { date: "2026-12-20", why: "" } }),
      base("sooner"),
      base("high", { confidence: "high", expires: { date: "2027-01-01", why: "" } }),
    ]).map((q) => q.id);
    expect(order).toEqual(["high", "sooner", "later", "aside"]);
  });
});

describe("accountStake — the account's own positions as a stake", () => {
  const quotes = new Map([
    ["CRWV261120C00090000", { bid: 24, ask: 24.5 }],
    ["CRWV261016C00100000", { bid: 0.5, ask: 0.6 }],
  ]);
  const positions = [
    { symbol: "CRWV", quantity: 400, avgPrice: 70 },
    // Option average prices arrive per contract, as broker-positions.ts stores them.
    { symbol: "CRWV261120C00090000", quantity: 2, avgPrice: 1_200 },
    { symbol: "CRWV261016C00100000", quantity: -1, avgPrice: 250 },
    { symbol: "NVDA261120C00150000", quantity: 1, avgPrice: 900 },
    { symbol: "CRWV261120P00060000", quantity: -1, avgPrice: 300 },
  ];

  it("reads shares, calls held and calls sold for one symbol, quotes joined by contract", () => {
    const stake = accountStake(positions, "CRWV", quotes, new Set(["CRWV261120C00090000"]));
    expect(stake).toEqual({
      shares: 400,
      costBasis: 70,
      callsSold: 1,
      openCalls: [
        {
          occ: "CRWV261016C00100000",
          strike: 100,
          expiration: "2026-10-16",
          contracts: 1,
          premium: 2.5,
          bid: 0.5,
          ask: 0.6,
        },
      ],
      heldCalls: [
        {
          type: "call",
          strike: 90,
          expiration: "2026-11-20",
          contracts: 2,
          costPerContract: 12,
          bid: 24,
          ask: 24.5,
          planCarried: true,
        },
      ],
    });
  });

  it("is empty for a symbol the account holds nothing in", () => {
    expect(accountStake(positions, "MU", quotes)).toEqual({});
  });
});
