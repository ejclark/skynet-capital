import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { EXIT_DTE, TAKE_PROFIT } from "../../src/playbooks/long-call-rules.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { ExitPlanStore } from "../../src/server/exit-plan-store.js";
import { serveOptionApi } from "../../src/server/option-api-routes.js";

/**
 * THE EXIT PLAN AT REVIEW AND ON SUBMIT (#5709 slice 3). Buying a call (course 302) the review
 * carries the house's long-call plan priced off the order; nothing else does. A Carry on an accepted
 * order records the plan against the contract, and the receipt says whether it was saved. Bought
 * without it, a contract the desk does not already hold drops a stale plan, so a new position never
 * inherits the plan of an earlier, closed one.
 */

const OCC = "NVDA270115C00180000";
const NOW = new Date("2026-11-01T15:00:00Z");

function fakeRes() {
  const out: { body?: string } = {};
  const res = {
    writeHead: () => res,
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const ann = { email: "ann@x.com" } as never;

function config(
  overrides: Record<string, unknown> = {},
  positions: readonly { symbol: string; quantity: number }[] = [],
): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [{ id: "human-ann", cash: 50_000, positions }] }) },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    tradingEnabled: true,
    now: () => NOW,
    submitOptionTrade: () =>
      Promise.resolve({ ok: true, orderId: "o-1", status: "accepted", symbol: OCC }),
    ...overrides,
  } as unknown as DashboardServerConfig;
}

const buyCall = (fields: Record<string, unknown> = {}) => ({
  kind: "open",
  participantId: "human-ann",
  code: "302",
  underlying: "NVDA",
  contracts: 2,
  strike: 180,
  expiration: "2027-01-15",
  orderType: "limit",
  limitPrice: 12,
  ...fields,
});

async function call(path: string, body: unknown, cfg: DashboardServerConfig) {
  const { res, out } = fakeRes();
  await serveOptionApi(post(body), res, path, cfg, ann);
  return JSON.parse(out.body ?? "{}");
}

describe("the exit plan on a call purchase's review", () => {
  it("WHEN a member reviews buying a call, the preview SHALL carry the house's plan, priced off the order", async () => {
    const { preview } = await call("/api/trade/option/review", buyCall(), config());
    expect(preview.ok).toBe(true);
    expect(preview.exitPlan).toEqual({
      paid: 12,
      multiple: TAKE_PROFIT,
      takeProfit: 24,
      gain: 12 * 100 * 2,
      exitDte: EXIT_DTE,
      timeStop: "2026-12-01",
      holdDays: 30,
    });
  });

  it("offers no plan on any other play — the house has no rule for a sold option or a bought put", async () => {
    for (const code of ["201", "202", "301"]) {
      const { preview } = await call(
        "/api/trade/option/review",
        buyCall({ code, strike: 40, limitPrice: 1 }),
        config(),
      );
      expect(preview.exitPlan).toBeUndefined();
    }
  });

  it("offers no plan on a refused order", async () => {
    const { preview } = await call(
      "/api/trade/option/review",
      buyCall({ contracts: 1000 }),
      config(),
    );
    expect(preview.ok).toBe(false);
    expect(preview.exitPlan).toBeUndefined();
  });
});

describe("the exit plan on submit", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-exit-plans-"));
    path = join(dir, "exit-plans.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("WHEN the member carried the plan and the order is accepted, the plan SHALL be recorded against the contract", async () => {
    const exitPlans = new ExitPlanStore(path);
    const result = await call(
      "/api/trade/option/submit",
      { ...buyCall(), exitPlan: "carry" },
      config({ exitPlans }),
    );
    expect(result).toMatchObject({ ok: true, exitPlan: "carried" });
    expect([...exitPlans.carried("human-ann")]).toEqual([OCC]);
  });

  it("records nothing when the order is refused", async () => {
    const exitPlans = new ExitPlanStore(path);
    const result = await call(
      "/api/trade/option/submit",
      { ...buyCall(), exitPlan: "carry" },
      config({
        exitPlans,
        submitOptionTrade: () => Promise.resolve({ ok: false, refusals: ["no"] }),
      }),
    );
    expect(result.exitPlan).toBeUndefined();
    expect(exitPlans.carried("human-ann").size).toBe(0);
  });

  it("says the plan was not saved when no store is wired — the order still went", async () => {
    const result = await call(
      "/api/trade/option/submit",
      { ...buyCall(), exitPlan: "carry" },
      config(),
    );
    expect(result).toMatchObject({ ok: true, exitPlan: "not-saved" });
  });

  it("says the plan was not saved when the file can't be read whole, and leaves the file alone", async () => {
    const unreadable = '{"human-ann": {"NOT-AN-OCC": {"rule": "house-long-call"}}}';
    await writeFile(path, unreadable);
    const exitPlans = new ExitPlanStore(path, () => undefined);
    const result = await call(
      "/api/trade/option/submit",
      { ...buyCall(), exitPlan: "carry" },
      config({ exitPlans }),
    );
    expect(result.exitPlan).toBe("not-saved");
    expect(await readFile(path, "utf8")).toBe(unreadable);
  });

  it("a fresh purchase without the plan drops a plan carried on an earlier day for a contract no longer held", async () => {
    const exitPlans = new ExitPlanStore(path);
    exitPlans.carry("human-ann", OCC, new Date("2026-10-20T15:00:00Z"));
    const result = await call("/api/trade/option/submit", buyCall(), config({ exitPlans }));
    expect(result.exitPlan).toBeUndefined();
    expect(exitPlans.carried("human-ann").size).toBe(0);
  });

  it("keeps a plan carried today — its own order may still be waiting to fill", async () => {
    const exitPlans = new ExitPlanStore(path);
    exitPlans.carry("human-ann", OCC, NOW);
    await call("/api/trade/option/submit", buyCall(), config({ exitPlans }));
    expect([...exitPlans.carried("human-ann")]).toEqual([OCC]);
  });

  it("records no plan for a call already inside the time stop — the review offered none", async () => {
    const exitPlans = new ExitPlanStore(path);
    const result = await call(
      "/api/trade/option/submit",
      { ...buyCall({ expiration: "2026-12-04" }), exitPlan: "carry" },
      config({ exitPlans }),
    );
    expect(result.exitPlan).toBeUndefined();
    expect(exitPlans.carried("human-ann").size).toBe(0);
  });

  it("an accepted close of the whole holding drops its plan; a partial close keeps it", async () => {
    const exitPlans = new ExitPlanStore(path);
    exitPlans.carry("human-ann", OCC, NOW);
    const close = (contracts?: number) => ({
      kind: "close",
      participantId: "human-ann",
      occSymbol: OCC,
      ...(contracts !== undefined ? { contracts } : {}),
    });
    const holding = config({ exitPlans }, [{ symbol: OCC, quantity: 2 }]);
    await call("/api/trade/option/submit", close(1), holding);
    expect([...exitPlans.carried("human-ann")]).toEqual([OCC]);
    await call("/api/trade/option/submit", close(), holding);
    expect(exitPlans.carried("human-ann").size).toBe(0);
  });

  it("adding to a held call without the plan keeps the plan it already carries", async () => {
    const exitPlans = new ExitPlanStore(path);
    exitPlans.carry("human-ann", OCC, NOW);
    await call(
      "/api/trade/option/submit",
      buyCall(),
      config({ exitPlans }, [{ symbol: OCC, quantity: 2 }]),
    );
    expect([...exitPlans.carried("human-ann")]).toEqual([OCC]);
  });
});

describe("ExitPlanStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-exit-plans-"));
    path = join(dir, "exit-plans.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps each desk's plans to itself, and survives a reload", () => {
    new ExitPlanStore(path).carry("human-ann", OCC, NOW);
    const reread = new ExitPlanStore(path);
    expect([...reread.carried("human-ann")]).toEqual([OCC]);
    expect(reread.carried("human-bob").size).toBe(0);
  });

  it("drops one contract's plan and removes an emptied desk", () => {
    const store = new ExitPlanStore(path);
    store.carry("human-ann", OCC, NOW);
    expect(store.drop("human-ann", OCC)).toBe(true);
    expect(store.carried("human-ann").size).toBe(0);
  });

  it("keeps a plan its drop condition spares", () => {
    const store = new ExitPlanStore(path);
    store.carry("human-ann", OCC, NOW);
    store.drop("human-ann", OCC, () => false);
    expect([...store.carried("human-ann")]).toEqual([OCC]);
  });
});
