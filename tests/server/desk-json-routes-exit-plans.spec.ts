import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { answered, bot, configWith, fakeRes } from "../support/desk-json-fixtures.js";

/** #5709 slice 3: a call bought with the house's exit plan carries it on the desk payload, and its
 *  card speaks of "your plan" — to the desk's owner. Anyone else reads the house's rules. */
describe("/api/desk/:id — a carried exit plan", () => {
  const OCC = "NVDA270115C00200000";
  const holdsCall = {
    ...bot,
    positions: [{ symbol: OCC, quantity: 1, avgPrice: 1200, marketValue: 2600 }],
  };
  const exitPlans = {
    carried: () => new Set([OCC]),
  } as unknown as DashboardServerConfig["exitPlans"];
  const deskFor = async (session?: { email: string; provider: string; exp: number }) => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron",
      "/api/desk/sauron",
      configWith({
        ...(session ? { auth: {} as never, resolveOwnerIds: () => ["human-eric"] } : {}),
        hub: {
          getState: () => ({ generatedAt: "t", participants: [holdsCall], collisions: [] }),
        } as never,
        exitPlans,
      }),
      session as never,
    );
    return answered(out).desk as {
      positions: { symbol: string; exitPlan?: unknown }[];
      decisions: { caption: string }[];
    };
  };

  it("puts the plan on the owner's held call, and names it theirs on the card", async () => {
    const desk = await deskFor();
    expect(desk.positions[0]?.exitPlan).toEqual({ takeProfit: 24, timeStop: "2026-12-01" });
    expect(desk.decisions[0]?.caption).toMatch(/The plan you carried when you bought it/);
  });

  it("gives anyone else the house's rules and no plan", async () => {
    const desk = await deskFor({ email: "guest@x", provider: "google", exp: 0 });
    expect(desk.positions[0]?.exitPlan).toBeUndefined();
    expect(desk.decisions[0]?.caption).toMatch(/The house's long-call bot/);
  });
});
