import {
  activitySignal,
  bridgeSignal,
  buildOpsStatus,
  resolveOpsStatusRepo,
} from "../../src/server/ops-status-service.js";

const LINK = {
  href: "https://github.com/x/y/actions/workflows/pipeline.yml",
  label: "Open Actions",
};
const NOW = new Date("2026-08-28T12:00:00.000Z");

// The ops-status panel (#666 slice 1) exists because Eric was on his phone with no surface saying
// the bots were dark — these specs pin the two credential-free proxies for "is the bots app
// alive" and their honest failure/quiet-market wording, plus the composer that wires them
// together with the (optional) deploy fetcher.
describe("bridgeSignal", () => {
  it("reads unknown when no poll has landed yet this app run", () => {
    const signal = bridgeSignal(undefined, NOW, LINK);
    expect(signal.verdict).toBe("unknown");
    expect(signal.link).toEqual(LINK);
  });

  it("reads ok within the ~90s stale window", () => {
    const signal = bridgeSignal(new Date(NOW.getTime() - 20_000).toISOString(), NOW, LINK);
    expect(signal.verdict).toBe("ok");
    expect(signal.detail).toContain("20s ago");
    expect(signal.link).toBeUndefined();
  });

  it("reads attention once the poll is stale", () => {
    const signal = bridgeSignal(new Date(NOW.getTime() - 200_000).toISOString(), NOW, LINK);
    expect(signal.verdict).toBe("attention");
    expect(signal.detail).toContain("200s");
    expect(signal.link).toEqual(LINK);
  });
});

describe("activitySignal", () => {
  it("reads unknown with no recorded activity", () => {
    expect(activitySignal(undefined, NOW, LINK).verdict).toBe("unknown");
  });

  it("reads ok inside the quiet-market window", () => {
    const signal = activitySignal(new Date(NOW.getTime() - 3_600_000).toISOString(), NOW, LINK);
    expect(signal.verdict).toBe("ok");
    expect(signal.detail).toContain("1h");
  });

  it("never alarms on stale activity — reads unknown, not attention, past a day", () => {
    const signal = activitySignal(
      new Date(NOW.getTime() - 3 * 86_400_000).toISOString(),
      NOW,
      LINK,
    );
    expect(signal.verdict).toBe("unknown");
    expect(signal.detail).toContain("quiet market");
  });
});

describe("buildOpsStatus", () => {
  it("degrades the deploy signals honestly when no fetcher is wired", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      lastBotActivityAt: async () => undefined,
      repo: "x/y",
    });
    expect(status.degraded).toBe(true);
    const deployIds = status.signals.filter((s) => s.id.startsWith("deploy-"));
    expect(deployIds).toHaveLength(2);
    for (const s of deployIds) {
      expect(s.verdict).toBe("unknown");
      expect(s.detail).toContain("No GitHub token");
    }
  });

  it("folds a wired deploy fetcher's signals in and marks the run un-degraded", async () => {
    const app = {
      id: "deploy-app",
      label: "App deploy",
      verdict: "ok" as const,
      detail: "current",
    };
    const bots = {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "ok" as const,
      detail: "current",
    };
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      lastBotActivityAt: async () => undefined,
      fetchDeploySignals: async () => ({ app, bots }),
      repo: "x/y",
    });
    expect(status.degraded).toBe(false);
    expect(status.signals).toContainEqual(app);
    expect(status.signals).toContainEqual(bots);
  });

  it("never throws the panel over a failing activity or deploy read", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      lastBotActivityAt: () => Promise.reject(new Error("store down")),
      fetchDeploySignals: () => Promise.reject(new Error("network down")),
      repo: "x/y",
    });
    expect(status.signals).toHaveLength(4);
    expect(status.signals.every((s) => s.verdict === "unknown")).toBe(true);
  });
});

describe("resolveOpsStatusRepo", () => {
  it("defaults to the house repo, honors an override", () => {
    expect(resolveOpsStatusRepo({})).toBe("ejclark/skynet-capital");
    expect(resolveOpsStatusRepo({ SKYNET_FEEDBACK_REPO: "a/b" })).toBe("a/b");
  });
});
