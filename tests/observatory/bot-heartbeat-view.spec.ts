import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { PlaybookVerdict } from "../../src/domain/types.js";
import {
  botHeartbeatView,
  PASS_CADENCE_MS,
  STALE_AFTER_MS,
} from "../../src/observatory/bot-heartbeat-view.js";

const NOW = new Date("2026-09-24T15:00:00Z");
const pass = (
  agoMs: number,
  verdicts?: readonly PlaybookVerdict[],
  halted?: string,
): DecisionRecord => ({
  at: NOW.getTime() - agoMs,
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...(verdicts ? { playbookVerdicts: verdicts } : {}),
  ...(halted ? { halted } : {}),
});
const s1 = (state: PlaybookVerdict["state"]): PlaybookVerdict => ({
  playbookId: "S1-NVDA",
  mode: "standard",
  state,
});

describe("botHeartbeatView — silence has three causes, and they never read alike", () => {
  it("beats when the newest pass is recent and the market is open", () => {
    const view = botHeartbeatView([pass(20_000)], NOW, true);
    expect(view.state).toBe("beating");
    expect(view.sinceLastPassMs).toBe(20_000);
    expect(view.cadenceMs).toBe(PASS_CADENCE_MS);
  });

  it("goes stale once the newest pass is older than the threshold during market hours", () => {
    expect(botHeartbeatView([pass(STALE_AFTER_MS + 1)], NOW, true).state).toBe("stale");
    expect(botHeartbeatView([pass(STALE_AFTER_MS)], NOW, true).state).toBe("beating");
  });

  it("reads market-closed, never stale, however old the last pass is", () => {
    const view = botHeartbeatView([pass(16 * 60 * 60_000)], NOW, false);
    expect(view.state).toBe("market-closed");
    expect(view.lastPassAt).toBe(new Date(NOW.getTime() - 16 * 60 * 60_000).toISOString());
  });

  it("says no-record, with nulls rather than zeros, for a bot that never recorded a pass", () => {
    expect(botHeartbeatView([], NOW, true)).toMatchObject({
      state: "no-record",
      lastPassAt: null,
      sinceLastPassMs: null,
      playbooks: null,
    });
  });

  it("surfaces the breaker holding a halted loop — alive, but not deciding", () => {
    const view = botHeartbeatView([pass(10_000, undefined, "daily-loss")], NOW, true);
    expect(view.state).toBe("beating");
    expect(view.halted).toBe("daily-loss");
  });
});

describe("botHeartbeatView — per-playbook verdicts", () => {
  it("reports each playbook's current verdict and when that run began", () => {
    const view = botHeartbeatView(
      [pass(0, [s1("no-window")]), pass(15_000, [s1("no-window")]), pass(30_000, [s1("long")])],
      NOW,
      true,
    );
    expect(view.playbooks).toEqual([
      {
        ...s1("no-window"),
        since: new Date(NOW.getTime() - 15_000).toISOString(),
        sinceIsLowerBound: false,
      },
    ]);
  });

  it("flags 'since' as a lower bound when the run reaches the oldest pass on hand", () => {
    const view = botHeartbeatView([pass(0, [s1("long")]), pass(15_000, [s1("long")])], NOW, true);
    expect(view.playbooks?.[0]?.sinceIsLowerBound).toBe(true);
  });

  it("reads verdicts from the newest pass that has them, skipping a halted one", () => {
    const view = botHeartbeatView(
      [pass(0, undefined, "manual"), pass(15_000, [s1("flat")])],
      NOW,
      true,
    );
    expect(view.playbooks?.[0]?.state).toBe("flat");
  });

  it("keeps two modes of the same playbook apart", () => {
    const aggressive: PlaybookVerdict = { ...s1("long"), mode: "aggressive" };
    const view = botHeartbeatView(
      [pass(0, [s1("no-window"), aggressive]), pass(15_000, [s1("long"), aggressive])],
      NOW,
      true,
    );
    expect(view.playbooks?.map((p) => [p.mode, p.sinceIsLowerBound])).toEqual([
      ["standard", false],
      ["aggressive", true],
    ]);
  });

  it("is null, not empty, when no pass on hand carries verdicts", () => {
    expect(botHeartbeatView([pass(0)], NOW, true).playbooks).toBeNull();
  });
});
