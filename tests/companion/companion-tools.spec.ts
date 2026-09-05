import {
  COMPANION_TOOL_DEFS,
  COMPANION_TOOL_NAMES,
  type CompanionDeskDeps,
  type CompanionToolName,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type {
  ParticipantProgression,
  ProgressionService,
} from "../../src/server/progression-service.js";

/**
 * The companion's ENTIRE tool surface — a closed allow-list of read-only lookups. This is one
 * half of the "never fires an order" invariant (`companion-no-order-path.spec.ts` is the other):
 * this file proves the dispatcher answers only the four named tools and refuses everything else,
 * including names an adversarial or confused model might invent.
 */

const snapshot: ParticipantSnapshot = {
  id: "acct-1",
  displayName: "Test Account",
  kind: "human",
  cash: 500,
  equity: 1500,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1000 }],
  activity: [],
};

const fill = (overrides: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "o1",
  participantId: "acct-1",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 100,
  status: "filled",
  at: "2026-08-01T00:00:00Z",
  source: "broker",
  ...overrides,
});

const progressionView: ParticipantProgression = {
  wheels: true,
  earned: [],
  earnedByCode: new Map(),
  unlocked: new Set(["101"]),
  nextUp: "102",
  points: 10,
  rank: { title: "Observer", atPoints: 0 },
  unlockedLevels: new Set(),
  celebrating: [],
  pendingChecks: [],
  engagementEarned: [],
  engagementCelebrating: [],
};

function fakeProgression(view = progressionView): ProgressionService {
  return {
    view: () => Promise.resolve(view),
    setWheels: () => Promise.resolve(),
    acknowledge: () => Promise.resolve([]),
    submitCheck: () => Promise.resolve(undefined),
  };
}

function depsFor(overrides: Partial<CompanionDeskDeps> = {}): CompanionDeskDeps {
  return {
    snapshotFor: (id) => (id === "acct-1" ? snapshot : undefined),
    readTradeActivity: () => Promise.resolve([]),
    progression: fakeProgression(),
    ...overrides,
  };
}

describe("the tool surface itself", () => {
  it("defines exactly the allow-listed tools, and no others", () => {
    expect(COMPANION_TOOL_DEFS.map((t) => t.name).sort()).toEqual([...COMPANION_TOOL_NAMES].sort());
  });

  it("names nothing order-shaped — a schema-level check anyone auditing the list can trust", () => {
    for (const name of COMPANION_TOOL_NAMES) {
      expect(name).not.toMatch(/order|trade|place|submit|cancel|buy|sell/i);
    }
  });
});

describe("runCompanionTool — the four real lanes", () => {
  it("get_my_positions answers the member's own cash/equity/positions", async () => {
    const result = await runCompanionTool("get_my_positions", depsFor(), "acct-1");
    expect(result).toEqual({
      ok: true,
      result: {
        cash: 500,
        equity: 1500,
        positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1000 }],
      },
    });
  });

  it("get_my_positions refuses honestly when the session owns no linked desk", async () => {
    const result = await runCompanionTool(
      "get_my_positions",
      depsFor({ snapshotFor: () => undefined }),
      "nobody",
    );
    expect(result).toEqual({ ok: false, error: "no linked desk" });
  });

  it("get_my_round_trips FIFO-matches the member's own fills into closed trades", async () => {
    const deps = depsFor({
      readTradeActivity: () =>
        Promise.resolve([
          fill({ orderId: "o1", side: "buy", price: 100, at: "2026-08-01T00:00:00Z" }),
          fill({ orderId: "o2", side: "sell", price: 110, at: "2026-08-02T00:00:00Z" }),
        ]),
    });
    const result = await runCompanionTool("get_my_round_trips", deps, "acct-1");
    expect(result).toMatchObject({
      ok: true,
      result: { recent: [{ symbol: "AAPL", entryPrice: 100, exitPrice: 110, realized: 100 }] },
    });
  });

  it("get_my_curriculum_progress answers wheels/points/rank/next-up from the shared service", async () => {
    const result = await runCompanionTool("get_my_curriculum_progress", depsFor(), "acct-1");
    expect(result).toEqual({
      ok: true,
      result: {
        wheels: true,
        points: 10,
        rank: { title: "Observer", atPoints: 0 },
        nextUp: "102",
        earnedCount: 0,
        unlocked: ["101"],
      },
    });
  });

  it("get_play_catalog lists every trade type with this member's own lock state", async () => {
    const result = await runCompanionTool("get_play_catalog", depsFor(), "acct-1");
    expect(result.ok).toBe(true);
    const catalog = (result as { ok: true; result: readonly { code: string; locked: boolean }[] })
      .result;
    expect(catalog.find((p) => p.code === "101")).toMatchObject({ locked: false }); // in `unlocked`
    expect(catalog.find((p) => p.code === "302")).toMatchObject({ locked: true }); // not yet unlocked
  });

  it("get_play_catalog still answers (all unlocked) with no progression wired", async () => {
    const result = await runCompanionTool(
      "get_play_catalog",
      depsFor({ progression: undefined }),
      "acct-1",
    );
    expect(result.ok).toBe(true);
  });
});

describe("runCompanionTool — the closed allow-list (the structural half of 'never fires an order')", () => {
  const adversarialNames = [
    "place_order",
    "submit_trade",
    "cancel_order",
    "buy_stock",
    "sell_stock",
    "execute_order",
    "GET_MY_POSITIONS", // wrong case is still not a match
    "get_my_positions ", // trailing whitespace is still not a match
    "",
    "__proto__",
    "constructor",
  ];

  it.each(adversarialNames)(
    "refuses %j with nothing but the refusal — no desk data ever rides along",
    async (name) => {
      const result = await runCompanionTool(name, depsFor(), "acct-1");
      expect(result).toEqual({ ok: false, error: `no such tool: ${name}` });
    },
  );

  it("draft_feedback hands the draft to the hook and files nothing — a malformed one is refused", async () => {
    const drafts: unknown[] = [];
    const deps: CompanionDeskDeps = {
      snapshotFor: () => undefined,
      onDraft: (d) => drafts.push(d),
    };
    const ok = await runCompanionTool("draft_feedback", deps, undefined, {
      kind: "bug",
      title: "Onboarding step 2 never completes after filing feedback",
      details: "Filed 5 times; M·01 step 2 still reads not done.",
    });
    expect(ok.ok).toBe(true);
    expect(drafts).toEqual([
      {
        kind: "bug",
        title: "Onboarding step 2 never completes after filing feedback",
        details: "Filed 5 times; M·01 step 2 still reads not done.",
      },
    ]);
    const bad = await runCompanionTool("draft_feedback", deps, undefined, { title: "" });
    expect(bad.ok).toBe(false);
    expect(drafts).toHaveLength(1);
  });

  it("the type export names exactly the real tools, so an adversarial cast is visibly a lie", () => {
    const real: readonly CompanionToolName[] = [...COMPANION_TOOL_NAMES];
    expect(real).not.toContain("place_order");
  });
});
