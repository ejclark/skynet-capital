import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  accountsBurst,
  accountsOpen,
  type BudgetPhase,
  flyCommand,
  flyEnv,
  procMemory,
  summary,
  verdict,
} from "../../scripts/stability/budget-lib.mjs";
import { harnessRoster, OWNER_EMAIL, seedStores } from "../../scripts/stability/seed.js";
import { openDecisionDb } from "../../src/autonomous/decision-db.js";
import { createActivityEventBus } from "../../src/observatory/activity-bus.js";
import { createActivityStore } from "../../src/observatory/activity-store.js";
import { createHistoryStore } from "../../src/observatory/history-store.js";
import { loadParticipants } from "../../src/participants/load-participants.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { createFeedbackLogStore } from "../../src/server/feedback-log.js";
import { createOrderAuditLog } from "../../src/server/order-audit-log.js";

/**
 * The stability budget run (#4612 slice 1, #4613): the pure half of the runner, and the seed's
 * promise that what it writes is what production's stores read, at the paths production's env
 * points them to. The docker half is exercised by `npm run stability:budget` itself.
 */

const FLY = readFileSync(new URL("../../fly.toml", import.meta.url), "utf8");
const budgets = { peakMb: 300, pulseMb: 30, pulseMs: 150 };
const alive = { running: true, oomKilled: false, exitCode: 0 };
const pulse = (addMb: number, ms: number) => ({
  path: "/api/desk/a/pulse",
  status: 200,
  ms,
  addMb,
});
const phase = (over: Partial<BudgetPhase> = {}): BudgetPhase => ({
  name: "pulse-each",
  note: "",
  rows: [pulse(12, 40)],
  peakMb: 180,
  ...over,
});

describe("flyEnv / flyCommand — production's wiring, read from fly.toml", () => {
  it("puts every durable store fly.toml declares under /data, and nothing else in", () => {
    const env = flyEnv(FLY);
    expect(env.SKYNET_HISTORY_DIR).toBe("/data/history");
    expect(env.SKYNET_ACTIVITY_DIR).toBe("/data/activity");
    expect(Object.values(env).every((v) => v.startsWith("/data/"))).toBe(true);
    expect(Object.keys(env)).not.toContain("app");
  });

  it("starts the server the way the app process does, falling back to the image's CMD", () => {
    expect(flyCommand(FLY)).toBe("node --enable-source-maps dist/serve.mjs");
    expect(flyCommand('[env]\n  A = "b"\n')).toBe("node --enable-source-maps dist/serve.mjs");
  });
});

describe("accountsOpen / accountsBurst — what a member's Accounts click fires", () => {
  it("opens Accounts as the shell does: its reads and the viewed account's Pulse, no stream", () => {
    const open = accountsOpen("human-eric");
    expect(open).toHaveLength(13);
    expect(open.filter((p) => p.endsWith("/pulse"))).toEqual(["/api/desk/human-eric/pulse"]);
    expect(open.some((p) => p.startsWith("/events"))).toBe(false);
  });

  it("widens the same load to every participant's Pulse, each asked for once", () => {
    const burst = accountsBurst("human-eric", ["sauron", "human-eric", "human-m1"]);
    expect(burst).toContain("/api/desk/human-eric");
    expect(burst).toContain("/api/accounts/human-eric/equity-curve?range=1M");
    expect(burst.filter((p) => p.endsWith("/pulse"))).toEqual([
      "/api/desk/sauron/pulse",
      "/api/desk/human-eric/pulse",
      "/api/desk/human-m1/pulse",
    ]);
    expect(burst.some((p) => p.startsWith("/events"))).toBe(false);
  });
});

describe("procMemory", () => {
  it("reads resident memory, its high-water mark and the anon part in MB", () => {
    const status = "VmHWM:\t  204800 kB\nVmRSS:\t  102400 kB\nRssAnon:\t   51200 kB\n";
    expect(procMemory(status)).toEqual({ rss: 100, hwm: 200, anon: 50 });
  });
});

describe("verdict", () => {
  it("passes a run inside every budget", () => {
    expect(verdict({ phases: [phase()], state: alive, budgets, bootPeakMb: 120 })).toEqual({
      ok: true,
      peakMb: 180,
      failures: [],
    });
  });

  it("fails an OOM kill, a 5xx and a refused connection, whatever the numbers say", () => {
    const rows = [
      { path: "/api/wire", status: 502, ms: 3 },
      { path: "/api/desk/a/pulse", status: "ERR UND_ERR_SOCKET", ms: 400 },
    ];
    const v = verdict({
      phases: [phase({ name: "accounts-cold", rows })],
      state: { running: false, oomKilled: true, exitCode: 137 },
      budgets,
    });
    expect(v.ok).toBe(false);
    expect(v.failures).toEqual([
      "the kernel OOM-killed the server (OOMKilled=true)",
      "accounts-cold: /api/wire answered 502",
      "accounts-cold: /api/desk/a/pulse answered ERR UND_ERR_SOCKET",
    ]);
  });

  it("fails peak RSS over budget, boot included, and a Pulse that adds or takes too much", () => {
    const v = verdict({
      phases: [phase({ rows: [pulse(31, 40), pulse(5, 151)] })],
      state: alive,
      budgets,
      bootPeakMb: 301,
    });
    expect(v.failures).toEqual([
      "peak RSS 301 MB > budget 300 MB",
      "/api/desk/a/pulse added 31 MB > budget 30 MB",
      "/api/desk/a/pulse took 151 ms > budget 150 ms",
    ]);
  });
});

describe("summary", () => {
  const report = (over: Partial<Parameters<typeof summary>[0]> = {}) => ({
    commit: "4ba54e84",
    days: 56,
    participants: 12,
    memory: "512m",
    seedMs: 5164,
    budgets,
    seeded: {
      historyRows: 227_136,
      historyRowsPerParticipant: 18_928,
      activityRows: 1,
      decisionCycles: 2,
    },
    boot: { peakMb: 166, settledMb: 156, anonMb: 102 },
    phases: [phase()],
    state: alive,
    cgroupPeakMb: 162,
    verdict: { ok: true, peakMb: 180, failures: [] },
    ...over,
  });

  it("says what was measured, per phase, and the verdict last", () => {
    const text = summary(report());
    expect(text).toContain("4ba54e84 · 56 days × 12 participants · 512m container");
    expect(text).toContain("18,928 history samples per participant");
    expect(text).toContain("| `/api/desk/a/pulse` | 200 | 40 |");
    expect(text.trim().endsWith("**PASS** — within budget.")).toBe(true);
  });

  it("names a killed server and every failure instead of a peak it could not read", () => {
    const text = summary(
      report({
        state: { running: false, oomKilled: true, exitCode: 137 },
        verdict: {
          ok: false,
          peakMb: 0,
          failures: ["the kernel OOM-killed the server (OOMKilled=true)"],
        },
      }),
    );
    expect(text).toContain("DOWN (OOMKilled=true, exit 137) · peak RSS n/a (killed mid-phase)");
    expect(text).toContain("**FAIL**\n- the kernel OOM-killed the server (OOMKilled=true)");
  });
});

describe("seedStores — production-shaped stores at production's paths", () => {
  const out = mkdtempSync(join(tmpdir(), "stability-seed-"));
  afterAll(() => rmSync(out, { recursive: true, force: true }));
  // The runner's mapping: fly.toml's `/data/…` onto the seed directory.
  const env = Object.fromEntries(
    Object.entries(flyEnv(FLY)).map(([k, v]) => [k, join(out, v.replace(/^\/data\//, ""))]),
  );
  const report = seedStores({
    days: 2,
    participants: 5,
    now: Date.parse("2026-10-04T17:00:00Z"),
    dirs: {
      history: env.SKYNET_HISTORY_DIR as string,
      activity: env.SKYNET_ACTIVITY_DIR as string,
      orderAudit: env.SKYNET_ORDER_AUDIT_DIR as string,
      feedbackLog: env.SKYNET_FEEDBACK_LOG_DIR as string,
      companionMessageLog: env.SKYNET_COMPANION_MESSAGE_LOG_DIR as string,
      insights: env.SKYNET_INSIGHTS_DIR as string,
    },
  });

  it("writes the sampler's grid plus deploy boots: 2 days is 576 + 100 samples a desk", async () => {
    const samples = await createHistoryStore(env).list("human-eric");
    expect(samples).toHaveLength(676);
    expect(report.historyRowsPerParticipant).toBe(676);
    expect(samples.at(-1)?.at).toBe("2026-10-04T16:55:00.000Z");
    expect(report.lastEquity["human-eric"]).toBe(samples.at(-1)?.equity);
  });

  it("journals trades the activity store, the event bus and the order audit all read back", async () => {
    expect((await createActivityStore(env).list()).length).toBe(report.activityRows);
    expect((await createActivityEventBus(env).list()).length).toBe(report.eventRows);
    expect((await createOrderAuditLog(env).list()).length).toBe(report.auditRows);
    expect((await createFeedbackLogStore(env).list()).length).toBe(report.feedbackRows);
  });

  it("records bot decision cycles where the app's insight bridge opens them", () => {
    const db = openDecisionDb(join(env.SKYNET_INSIGHTS_DIR as string, "decisions.db"));
    try {
      expect(db.listByPersona("sauron", { limit: 5 })).toHaveLength(5);
    } finally {
      db.close();
    }
  });

  it("names a roster live mode builds from env, the viewer owning human-eric", () => {
    const roster = harnessRoster(5);
    const vars = Object.fromEntries(
      roster.flatMap((p) => [
        [p.keyVar, `stab-${p.id}`],
        [p.secretVar, "s"],
        ...(p.emailVar ? [[p.emailVar, OWNER_EMAIL]] : []),
      ]),
    );
    const live = loadParticipants(createDefaultPersonas(), vars);
    expect(live.map((p) => p.id).sort()).toEqual(roster.map((p) => p.id).sort());
    expect(live.find((p) => p.ownerEmail)?.id).toBe("human-eric");
  });
});
