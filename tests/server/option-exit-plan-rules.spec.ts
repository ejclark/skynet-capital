import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXIT_DTE, TAKE_PROFIT } from "../../src/playbooks/long-call-rules.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { ExitPlanStore } from "../../src/server/exit-plan-store.js";
import {
  carriesExitPlan,
  exitPlanOnReview,
  holdingsBeforeOrder,
  settleExitPlan,
} from "../../src/server/option-exit-plan.js";
import type { DeskOptionRequest } from "../../src/server/option-trade-service.js";

/**
 * THE EXIT-PLAN GLUE, called directly (#5709 slice 3). `option-exit-plan.spec.ts` drives it through
 * the options routes; this pins each of the three functions on its own: what the review prices,
 * what counts as a Carry, and what a settled order does to the plans on file.
 */

const OCC = "NVDA270115C00180000";
const OTHER_OCC = "NVDA270115C00200000";
const DESK = "human-ann";
const NOW = new Date("2026-11-01T15:00:00Z");

type OpenRequest = Extract<DeskOptionRequest, { kind: "open" }>;
type CloseRequest = Extract<DeskOptionRequest, { kind: "close" }>;

const buyCall = (fields: Partial<OpenRequest> = {}): OpenRequest => ({
  kind: "open",
  participantId: DESK,
  code: "302",
  underlying: "NVDA",
  contracts: 2,
  strike: 180,
  expiration: "2027-01-15",
  orderType: "limit",
  limitPrice: 12,
  ...fields,
});

const closeOut = (fields: Partial<CloseRequest> = {}): CloseRequest => ({
  kind: "close",
  participantId: DESK,
  occSymbol: OCC,
  ...fields,
});

describe("exitPlanOnReview", () => {
  describe("when the member reviews buying a call with a priced preview", () => {
    it("prices the house's plan off the premium, contracts and expiry on the order", () => {
      const { exitPlan } = exitPlanOnReview(buyCall(), { ok: true, estPremium: 12 }, NOW);
      expect(exitPlan).toEqual({
        paid: 12,
        multiple: TAKE_PROFIT,
        takeProfit: 24,
        gain: 12 * 100 * 2,
        exitDte: EXIT_DTE,
        timeStop: "2026-12-01",
        holdDays: 30,
      });
    });

    it("counts the days to the time stop on the market's calendar day, not UTC's", () => {
      // 02:00Z on 12-01 is still the evening of 11-30 in New York.
      const lateEvening = new Date("2026-12-01T02:00:00Z");
      const { exitPlan } = exitPlanOnReview(buyCall(), { ok: true, estPremium: 12 }, lateEvening);
      expect(exitPlan?.holdDays).toBe(1);
    });

    it("reports a time stop already due as zero or fewer days", () => {
      const { exitPlan } = exitPlanOnReview(
        buyCall({ expiration: "2026-11-20" }),
        { ok: true, estPremium: 3 },
        NOW,
      );
      expect(exitPlan?.holdDays).toBeLessThanOrEqual(0);
    });
  });

  describe("when the order is not a buy-to-open call", () => {
    it("offers no plan for any other play", () => {
      for (const code of ["201", "202", "301"] as const) {
        expect(exitPlanOnReview(buyCall({ code }), { ok: true, estPremium: 5 }, NOW)).toEqual({});
      }
    });

    it("offers no plan for a close", () => {
      expect(exitPlanOnReview(closeOut(), { ok: true, estPremium: 5 }, NOW)).toEqual({});
    });
  });

  describe("when the preview has no honest premium to price from", () => {
    it("offers no plan for a refused preview", () => {
      expect(exitPlanOnReview(buyCall(), { ok: false, estPremium: 12 }, NOW)).toEqual({});
    });

    it("offers no plan when the preview carries no premium", () => {
      expect(exitPlanOnReview(buyCall(), { ok: true }, NOW)).toEqual({});
    });

    it("offers no plan for a zero or negative premium", () => {
      expect(exitPlanOnReview(buyCall(), { ok: true, estPremium: 0 }, NOW)).toEqual({});
      expect(exitPlanOnReview(buyCall(), { ok: true, estPremium: -1 }, NOW)).toEqual({});
    });
  });
});

describe("carriesExitPlan", () => {
  describe("when the body says exitPlan is carry", () => {
    it("is true", () => {
      expect(carriesExitPlan(JSON.stringify({ exitPlan: "carry", code: "302" }))).toBe(true);
    });
  });

  describe("when the body makes no such choice", () => {
    it("is false for any other value", () => {
      expect(carriesExitPlan(JSON.stringify({ exitPlan: "skip" }))).toBe(false);
      expect(carriesExitPlan(JSON.stringify({ exitPlan: true }))).toBe(false);
      expect(carriesExitPlan(JSON.stringify({ exitPlan: "Carry" }))).toBe(false);
    });

    it("is false when the field is absent", () => {
      expect(carriesExitPlan("{}")).toBe(false);
    });

    it("is false for a body that is not a JSON object", () => {
      expect(carriesExitPlan("not json")).toBe(false);
      expect(carriesExitPlan("[]")).toBe(false);
      expect(carriesExitPlan('"carry"')).toBe(false);
      expect(carriesExitPlan("null")).toBe(false);
    });
  });
});

describe("settleExitPlan", () => {
  let dir: string;
  let store: ExitPlanStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-exit-plan-rules-"));
    store = new ExitPlanStore(join(dir, "exit-plans.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  /** A desk config holding `held` long contracts, a clock fixed at NOW, and the temp store. */
  function config(
    held: Readonly<Record<string, number>> = {},
    overrides: { exitPlans?: ExitPlanStore | undefined; now?: (() => Date) | undefined } = {},
  ): Pick<DashboardServerConfig, "exitPlans" | "hub" | "now"> {
    const positions = Object.entries(held).map(([symbol, quantity]) => ({ symbol, quantity }));
    const base = {
      exitPlans: store,
      now: () => NOW,
      hub: {
        getState: () => ({ participants: [{ id: DESK, positions }] }),
      } as unknown as DashboardServerConfig["hub"],
    };
    const merged = { ...base, ...overrides };
    return {
      hub: merged.hub,
      ...(merged.exitPlans ? { exitPlans: merged.exitPlans } : {}),
      ...(merged.now ? { now: merged.now } : {}),
    };
  }

  const accepted = { ok: true, symbol: OCC };
  const noStore = { exitPlans: undefined };

  /** Settle as the route does: the desk's holdings read off the hub before the order (#8401). */
  const settle = (
    request: DeskOptionRequest,
    result: { ok: boolean; symbol?: string },
    carry: boolean,
    cfg: ReturnType<typeof config>,
  ) => settleExitPlan(request, result, carry, cfg, holdingsBeforeOrder(cfg, request.participantId));

  describe("when the member carried the plan and the order was accepted", () => {
    it("records the plan against the contract and says it was carried", () => {
      expect(settle(buyCall(), accepted, true, config())).toEqual({
        exitPlan: "carried",
      });
      expect([...store.carried(DESK)]).toEqual([OCC]);
    });

    it("offers and records nothing for a call already inside the time stop", () => {
      const inside = buyCall({ expiration: "2026-11-20" });
      expect(settle(inside, accepted, true, config())).toEqual({});
      expect(store.carried(DESK).size).toBe(0);
    });

    it("says the plan was not saved when no store is wired", () => {
      expect(settle(buyCall(), accepted, true, config({}, noStore))).toEqual({
        exitPlan: "not-saved",
      });
    });

    it("reads the real clock when the config has none", () => {
      const result = settle(
        buyCall({ expiration: "2099-01-15" }),
        accepted,
        true,
        config({}, { now: undefined }),
      );
      expect(result).toEqual({ exitPlan: "carried" });
    });
  });

  describe("when the order was not accepted", () => {
    it("changes nothing and says nothing, carry or not", () => {
      store.carry(DESK, OCC);
      expect(settle(buyCall(), { ok: false, symbol: OCC }, true, config())).toEqual({});
      expect(settle(closeOut(), { ok: false }, false, config({ [OCC]: 1 }))).toEqual({});
      expect([...store.carried(DESK)]).toEqual([OCC]);
    });
  });

  describe("when the order is not a buy-call", () => {
    it("records nothing for another play", () => {
      expect(settle(buyCall({ code: "301" }), accepted, true, config())).toEqual({});
      expect(store.carried(DESK).size).toBe(0);
    });

    it("records nothing when the accepted order names no contract symbol", () => {
      expect(settle(buyCall(), { ok: true }, true, config())).toEqual({});
      expect(store.carried(DESK).size).toBe(0);
    });
  });

  describe("when an accepted close sells the whole holding", () => {
    it("drops the plan on that contract and leaves others alone", () => {
      store.carry(DESK, OCC);
      store.carry(DESK, OTHER_OCC);
      const result = settle(closeOut(), { ok: true }, false, config({ [OCC]: 3 }));
      expect(result).toEqual({});
      expect([...store.carried(DESK)]).toEqual([OTHER_OCC]);
    });

    it("drops the plan when the close names exactly the contracts held", () => {
      store.carry(DESK, OCC);
      settle(closeOut({ contracts: 3 }), { ok: true }, false, config({ [OCC]: 3 }));
      expect(store.carried(DESK).size).toBe(0);
    });
  });

  describe("when an accepted close sells only part of the holding", () => {
    it("keeps the plan", () => {
      store.carry(DESK, OCC);
      settle(closeOut({ contracts: 1 }), { ok: true }, false, config({ [OCC]: 3 }));
      expect([...store.carried(DESK)]).toEqual([OCC]);
    });
  });

  describe("when a close lands with no store wired", () => {
    it("settles quietly", () => {
      expect(settle(closeOut(), { ok: true }, false, config({ [OCC]: 1 }, noStore))).toEqual({});
    });
  });

  describe("when a purchase went without the plan", () => {
    it("drops a plan carried on an earlier market day for a contract the desk does not hold", () => {
      store.carry(DESK, OCC, new Date("2026-10-30T15:00:00Z"));
      expect(settle(buyCall(), accepted, false, config())).toEqual({});
      expect(store.carried(DESK).size).toBe(0);
    });

    it("keeps a plan carried today, which may still be waiting on its own order to fill", () => {
      store.carry(DESK, OCC, new Date("2026-11-01T14:00:00Z"));
      settle(buyCall(), accepted, false, config());
      expect([...store.carried(DESK)]).toEqual([OCC]);
    });

    it("keeps the plan when the desk already holds the contract", () => {
      store.carry(DESK, OCC, new Date("2026-10-30T15:00:00Z"));
      settle(buyCall(), accepted, false, config({ [OCC]: 1 }));
      expect([...store.carried(DESK)]).toEqual([OCC]);
    });

    it("treats a zero-quantity position as not held", () => {
      store.carry(DESK, OCC, new Date("2026-10-30T15:00:00Z"));
      settle(buyCall(), accepted, false, config({ [OCC]: 0 }));
      expect(store.carried(DESK).size).toBe(0);
    });

    it("settles quietly when no store is wired", () => {
      expect(settle(buyCall(), accepted, false, config({}, noStore))).toEqual({});
    });
  });
});
