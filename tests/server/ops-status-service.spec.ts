import { degradedDeploySignals } from "../../src/server/ops-status-deploy-verdict.js";
import {
  activitySignal,
  bridgeSignal,
  buildOpsStatus,
  paperOrdersSignal,
  personaGateSignal,
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

describe("personaGateSignal", () => {
  it("reads unknown when the bots process has reported no gate verdicts", () => {
    const signal = personaGateSignal(undefined);
    expect(signal.verdict).toBe("unknown");
    expect(signal.link).toBeUndefined();
  });

  it("reads unknown for an empty array the same as no report at all", () => {
    expect(personaGateSignal([]).verdict).toBe("unknown");
  });

  it("reads ok when every persona cleared the readiness gate", () => {
    const signal = personaGateSignal([
      { id: "sauron", ready: true, reason: "passed the readiness pack" },
      { id: "banker", ready: true, reason: "passed the readiness pack" },
    ]);
    expect(signal.verdict).toBe("ok");
    expect(signal.detail).toContain("2 persona(s) cleared to place paper orders");
    // "live" alone reads as real money on a paper-only app (#6954's honest-labels invariant)
    expect(signal.detail).not.toMatch(/\blive\b/);
  });

  it("reads attention and names each pinned persona with its reason", () => {
    const signal = personaGateSignal([
      { id: "sauron", ready: true, reason: "passed the readiness pack" },
      { id: "banker", ready: false, reason: "failed the safety battery (1 violation(s): x)" },
    ]);
    expect(signal.verdict).toBe("attention");
    expect(signal.detail).toContain("1 of 2 persona(s) pinned to observe");
    expect(signal.detail).toContain("banker (failed the safety battery (1 violation(s): x))");
    expect(signal.detail).not.toContain("sauron (");
  });
});

describe("paperOrdersSignal (#6954 slice 1)", () => {
  const placing = { ready: true, reason: "passed", wanted: "live", mode: "live" } as const;
  const none = () => null;

  it("reads unknown when the bots process has not reported its house mode", () => {
    const signal = paperOrdersSignal(undefined, [{ id: "sauron", ...placing }], none);
    expect(signal.verdict).toBe("unknown");
    expect(signal.id).toBe("paper-orders");
  });

  it("asks for attention when the house only watches: no bot places a paper order", () => {
    const signal = paperOrdersSignal("observe", [{ id: "sauron", ...placing }], none);
    expect(signal.verdict).toBe("attention");
    expect(signal.detail).toContain("Every bot is watching");
    expect(signal.detail).toContain("places no paper orders");
  });

  it("names each bot placing paper orders under a live house", () => {
    const signal = paperOrdersSignal(
      "live",
      [
        { id: "sauron", ...placing },
        { id: "banker", ...placing },
      ],
      none,
    );
    expect(signal.verdict).toBe("ok");
    expect(signal.detail).toBe(
      "2 of 2 bot(s) placing paper orders. sauron: placing paper orders; banker: placing paper orders.",
    );
  });

  it("names the gate that holds each watching bot: its owner, its readiness gate, a suspend", () => {
    const signal = paperOrdersSignal(
      "live",
      [
        { id: "sauron", ...placing },
        { id: "banker", ready: true, reason: "passed", wanted: "observe", mode: "observe" },
        {
          id: "prospector",
          ready: false,
          reason: "not ready yet",
          wanted: "live",
          mode: "observe",
        },
        { id: "day-trader", ...placing },
      ],
      (id) => (id === "day-trader" ? "suspended by owner" : null),
    );
    expect(signal.verdict).toBe("ok");
    expect(signal.detail).toContain("1 of 4 bot(s) placing paper orders.");
    expect(signal.detail).toContain("sauron: placing paper orders");
    expect(signal.detail).toContain("banker: watching: its owner set it to watch only");
    expect(signal.detail).toContain("prospector: watching: not cleared by its readiness gate");
    expect(signal.detail).toContain("day-trader: watching: suspended by owner");
  });

  it("reads the outer gate when two hold a bot: its owner before its readiness gate", () => {
    const signal = paperOrdersSignal(
      "live",
      [{ id: "banker", ready: false, reason: "not ready", wanted: "observe", mode: "observe" }],
      none,
    );
    expect(signal.detail).toContain("banker: watching: its owner set it to watch only");
  });

  it("never says placing over a bot the owner suspended (all bots)", () => {
    const signal = paperOrdersSignal(
      "live",
      [{ id: "sauron", ...placing }],
      () => "suspended by owner (all bots)",
    );
    expect(signal.detail).toContain("0 of 1 bot(s) placing paper orders.");
    expect(signal.detail).toContain("sauron: watching: suspended by owner (all bots)");
  });

  it("reads a verdict with no mode (an older bots build) as not reported, never a guess", () => {
    const signal = paperOrdersSignal(
      "live",
      [{ id: "sauron", ready: true, reason: "passed" }],
      none,
    );
    expect(signal.verdict).toBe("unknown");
    expect(signal.detail).toContain("no bot has reported its own mode yet");
  });

  it('never prints a bare "live" that would read as real money', () => {
    const details = [
      paperOrdersSignal("live", [{ id: "sauron", ...placing }], none),
      paperOrdersSignal("observe", [{ id: "sauron", ...placing }], none),
      paperOrdersSignal(undefined, undefined, none),
      paperOrdersSignal("live", [], none),
    ].map((s) => s.detail);
    for (const detail of details) expect(detail).not.toMatch(/\blive\b/i);
  });
});

describe("buildOpsStatus", () => {
  it("degrades the deploy signals honestly when no fetcher is wired", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => undefined,
      personaGateVerdicts: () => undefined,
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
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
      botsRunningSha: () => undefined,
      personaGateVerdicts: () => undefined,
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
      lastBotActivityAt: async () => undefined,
      fetchDeploySignals: async () => ({ app, bots }),
      repo: "x/y",
    });
    expect(status.degraded).toBe(false);
    expect(status.signals).toContainEqual(app);
    expect(status.signals).toContainEqual(bots);
  });

  it("folds the reported persona gate verdicts into a persona-gate signal", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => undefined,
      personaGateVerdicts: () => [{ id: "sauron", ready: false, reason: "not ready yet" }],
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
      lastBotActivityAt: async () => undefined,
      repo: "x/y",
    });
    const gate = status.signals.find((s) => s.id === "persona-gate");
    expect(gate?.verdict).toBe("attention");
    expect(gate?.detail).toContain("sauron (not ready yet)");
  });

  it("folds the reported house mode and a suspend from Mission Control into the paper-orders row", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => undefined,
      personaGateVerdicts: () => [
        { id: "sauron", ready: true, reason: "passed", wanted: "live", mode: "live" },
      ],
      botsProcessMode: () => "live",
      suspendedReason: (id) => (id === "sauron" ? "suspended by owner" : null),
      lastBotActivityAt: async () => undefined,
      repo: "x/y",
    });
    const row = status.signals.find((s) => s.id === "paper-orders");
    expect(row?.detail).toContain("sauron: watching: suspended by owner");
  });

  it("never throws the panel over a failing activity or deploy read", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => undefined,
      personaGateVerdicts: () => undefined,
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
      lastBotActivityAt: () => Promise.reject(new Error("store down")),
      fetchDeploySignals: () => Promise.reject(new Error("network down")),
      repo: "x/y",
    });
    expect(status.signals).toHaveLength(6);
    expect(status.signals.every((s) => s.verdict === "unknown")).toBe(true);
  });
});

describe("resolveOpsStatusRepo", () => {
  it("defaults to the house repo, honors an override", () => {
    expect(resolveOpsStatusRepo({})).toBe("ejclark/skynet-capital");
    expect(resolveOpsStatusRepo({ SKYNET_FEEDBACK_REPO: "a/b" })).toBe("a/b");
  });
});

describe("the bots process's reported commit reaches the deploy signals (#666)", () => {
  const RUNNING = "7ac0ffee00000000000000000000000000000abc";

  it("hands the reported commit to the deploy fetcher", async () => {
    const seen: (string | undefined)[] = [];
    await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => RUNNING,
      personaGateVerdicts: () => undefined,
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
      lastBotActivityAt: async () => undefined,
      fetchDeploySignals: (_now, sha) => {
        seen.push(sha);
        return Promise.resolve(degradedDeploySignals({ href: "https://x", label: "Open Actions" }));
      },
      repo: "x/y",
    });
    expect(seen).toEqual([RUNNING]);
  });

  it("still names the running commit when there is no GitHub token at all", async () => {
    const status = await buildOpsStatus({
      now: () => NOW,
      bridgeLastPollAt: () => undefined,
      botsRunningSha: () => RUNNING,
      personaGateVerdicts: () => undefined,
      botsProcessMode: () => undefined,
      suspendedReason: () => null,
      lastBotActivityAt: async () => undefined,
      repo: "x/y",
    });
    const bots = status.signals.find((s) => s.id === "deploy-bots");
    expect(status.degraded).toBe(true);
    expect(bots?.detail).toContain("running 7ac0ffe");
  });
});
