import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  ownsDesk,
  withoutCyclePlaybooks,
  withoutHeartbeatPlaybookIds,
  withoutReasoningPlaybook,
} from "../../src/server/desk-owner-gate.js";

/**
 * #885 (Eric, 2026-08-29): "at this time, we do not show what playbooks others are using". The
 * gate decides who owns a desk and strips only the playbook's name — every other field a non-owner
 * reads (verdict, mode, reason, fill) survives untouched.
 */

const session = (email: string) => ({ email, provider: "google" as const, exp: 0 });

describe("ownsDesk", () => {
  it("treats a deployment with no sign-in configured as the single operator's own", () => {
    expect(ownsDesk("sauron", {} as DashboardServerConfig, undefined)).toBe(true);
  });

  it("answers from the session's full owned set once sign-in is configured", () => {
    const config = {
      auth: {},
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["human-eric", "sauron"] : []),
    } as unknown as DashboardServerConfig;
    expect(ownsDesk("sauron", config, session("owner@x"))).toBe(true);
    expect(ownsDesk("sauron", config, session("guest@x"))).toBe(false);
    expect(ownsDesk("sauron", config, undefined)).toBe(false);
  });
});

describe("the playbook strips", () => {
  it("drops each heartbeat line's id and keeps its verdict", () => {
    const heartbeat = {
      state: "beating" as const,
      marketOpen: true,
      lastPassAt: null,
      sinceLastPassMs: null,
      cadenceMs: 15_000,
      staleAfterMs: 120_000,
      playbooks: [
        {
          playbookId: "S1-NVDA",
          mode: "standard" as const,
          state: "long" as const,
          since: "2026-09-22T15:00:00Z",
          sinceIsLowerBound: false,
        },
      ],
    };
    expect(withoutHeartbeatPlaybookIds(heartbeat).playbooks).toEqual([
      { mode: "standard", state: "long", since: "2026-09-22T15:00:00Z", sinceIsLowerBound: false },
    ]);
    expect(withoutHeartbeatPlaybookIds({ ...heartbeat, playbooks: null }).playbooks).toBeNull();
  });

  it("drops each outcome's playbook chip and keeps the trade", () => {
    const [cycle] = withoutCyclePlaybooks([
      {
        at: "2026-09-22T15:00:00Z",
        mode: "live",
        status: "placed",
        headline: "1 placed",
        rawCount: 1,
        guardedCount: 1,
        outcomes: [
          {
            symbol: "NVDA",
            side: "buy",
            quantity: 1,
            playbook: "S1-NVDA",
            playbookMode: "standard",
            reason: "fade",
            action: "placed",
          },
        ],
      },
    ]);
    expect(cycle?.outcomes).toEqual([
      { symbol: "NVDA", side: "buy", quantity: 1, reason: "fade", action: "placed" },
    ]);
  });

  it("drops a decision's playbook and keeps who decided and why", () => {
    expect(
      withoutReasoningPlaybook({
        reason: "fade",
        personaId: "sauron",
        playbookId: "S1-NVDA",
        playbookMode: "standard",
      }),
    ).toEqual({ reason: "fade", personaId: "sauron" });
  });
});
