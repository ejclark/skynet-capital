import { withoutOwnerReasoning } from "../../src/observatory/wire-reasoning.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  ownsDesk,
  withoutCycleOwnerFields,
  withoutHeartbeatPlaybookIds,
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
      rollCall: [{ playbookId: "S1-NVDA", status: "armed" as const, reason: "checked" }],
    };
    expect(withoutHeartbeatPlaybookIds(heartbeat)).not.toHaveProperty("rollCall");
    expect(withoutHeartbeatPlaybookIds(heartbeat).playbooks).toEqual([
      { mode: "standard", state: "long", since: "2026-09-22T15:00:00Z", sinceIsLowerBound: false },
    ]);
    expect(withoutHeartbeatPlaybookIds({ ...heartbeat, playbooks: null }).playbooks).toBeNull();
  });

  it("drops each outcome's playbook chip and keeps the trade", () => {
    const [cycle] = withoutCycleOwnerFields([
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
            strategy: "s1-nvda-fade",
            reason: "fade",
            action: "placed",
          },
        ],
        refusedIntents: [
          { symbol: "NVDA", side: "buy", quantity: 5, strategy: "s1-nvda-fade", reason: "fade" },
        ],
      },
    ]);
    expect(cycle?.outcomes).toEqual([
      { symbol: "NVDA", side: "buy", quantity: 1, reason: "fade", action: "placed" },
    ]);
    // The strategy tag is the playbook's own slug, so it names the playbook too (#4971).
    expect(cycle?.refusedIntents).toEqual([
      { symbol: "NVDA", side: "buy", quantity: 5, reason: "fade" },
    ]);
  });

  it("leaves a cycle with no refused ideas without the key", () => {
    const [cycle] = withoutCycleOwnerFields([
      {
        at: "2026-09-22T15:00:00Z",
        mode: "live",
        status: "quiet",
        headline: "nothing fired",
        rawCount: 0,
        guardedCount: 0,
        outcomes: [],
      },
    ]);
    expect(cycle).not.toHaveProperty("refusedIntents");
  });

  it("drops a decision's playbook and keeps who decided and why", () => {
    expect(
      withoutOwnerReasoning({
        reason: "fade",
        personaId: "sauron",
        playbookId: "S1-NVDA",
        playbookMode: "standard",
      }),
    ).toEqual({ reason: "fade", personaId: "sauron" });
  });

  it("drops a decision's strategy tag, which names its playbook, and keeps its expectation", () => {
    expect(
      withoutOwnerReasoning({
        reason: "sell a put a month out",
        personaId: "sauron",
        strategy: "crwv-wheel-put",
        expectation: "CRWV stays above $80",
      }),
    ).toEqual({
      reason: "sell a put a month out",
      personaId: "sauron",
      expectation: "CRWV stays above $80",
    });
  });
});
