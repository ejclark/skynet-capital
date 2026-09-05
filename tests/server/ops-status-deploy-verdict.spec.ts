import {
  appDeploySignal,
  botsDeployLag,
  botsDeploySignal,
  classifyBotRelevant,
  degradedDeploySignals,
  degradedFromFailure,
  deployLag,
} from "../../src/server/ops-status-deploy-verdict.js";

const LINK = {
  href: "https://github.com/x/y/actions/workflows/pipeline.yml",
  label: "Open Actions",
};
const RELEASED = "8c65f65";
const HEAD = "4f234c0";

// Ported 1:1 from scripts/deploy-lag.mjs / scripts/bot-relevant.mjs (see the module header for
// why they're ported, not imported) — these pin the port against the same provenance case
// tests/scripts/deploy-lag.spec.ts drives through the real CLI: #492's silent-merge outage.
describe("deployLag", () => {
  it("says nothing is wrong when head is the released commit", () => {
    const lag = deployLag(RELEASED, RELEASED, []);
    expect(lag).toEqual({ lagging: false, behind: 0, cause: null });
  });

  it("catches the outage: every stranding commit merged by a silent token", () => {
    const lag = deployLag(HEAD, RELEASED, [
      { sha: "942a85a", subject: "docs", mergedBy: "github-actions[bot]" },
      { sha: HEAD, subject: "feat", mergedBy: "github-actions[bot]" },
    ]);
    expect(lag).toEqual({ lagging: true, behind: 2, cause: "silent-merge" });
  });

  it("calls the cause unknown when a human merge is in the mix", () => {
    const lag = deployLag(HEAD, RELEASED, [{ sha: HEAD, subject: "feat", mergedBy: "eric" }]);
    expect(lag.cause).toBe("unknown");
  });
});

describe("classifyBotRelevant", () => {
  it("skips an empty changeset", () => {
    expect(classifyBotRelevant([])).toEqual({ deploy: false, reason: "no changed paths" });
  });

  it("skips a docs/tests-only changeset", () => {
    const verdict = classifyBotRelevant([
      "docs/foo.md",
      "tests/bar.spec.ts",
      ".github/workflows/x.yml",
    ]);
    expect(verdict.deploy).toBe(false);
  });

  it("deploys when any path touches the runtime", () => {
    const verdict = classifyBotRelevant(["src/bots/runner.ts", "docs/foo.md"]);
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toContain("src/bots/runner.ts");
  });
});

describe("botsDeployLag", () => {
  it("reads unknown when the scan itself failed", () => {
    expect(botsDeployLag(HEAD, undefined, undefined).known).toBe(false);
  });

  it("reads no-baseline when the scan found no bots deploy yet", () => {
    const lag = botsDeployLag(HEAD, "", []);
    expect(lag).toEqual({ known: true, baseline: false, lagging: false });
  });

  it("reads current when the baseline is already head", () => {
    expect(botsDeployLag(HEAD, HEAD, []).lagging).toBe(false);
  });

  it("reads stale only when a changed path is bot-relevant", () => {
    expect(botsDeployLag(HEAD, RELEASED, ["docs/x.md"]).lagging).toBe(false);
    expect(botsDeployLag(HEAD, RELEASED, ["src/bots/runner.ts"]).lagging).toBe(true);
  });
});

describe("appDeploySignal", () => {
  it("reads ok when current", () => {
    const signal = appDeploySignal({ lagging: false, behind: 0, cause: null }, HEAD, HEAD, LINK);
    expect(signal.verdict).toBe("ok");
    expect(signal.link).toBeUndefined();
  });

  it("names the silent-merge cause and deep-links to Actions", () => {
    const signal = appDeploySignal(
      { lagging: true, behind: 2, cause: "silent-merge" },
      HEAD,
      RELEASED,
      LINK,
    );
    expect(signal.verdict).toBe("attention");
    expect(signal.detail).toContain("token that emits no push");
    expect(signal.link).toEqual(LINK);
  });
});

describe("botsDeploySignal", () => {
  it("reads unknown when the scan failed, ok when current, attention when stale", () => {
    expect(botsDeploySignal({ known: false, baseline: false, lagging: false }, LINK).verdict).toBe(
      "unknown",
    );
    expect(botsDeploySignal({ known: true, baseline: true, lagging: false }, LINK).verdict).toBe(
      "ok",
    );
    const stale = botsDeploySignal(
      { known: true, baseline: true, lagging: true, reason: "2 bot-relevant path(s)" },
      LINK,
    );
    expect(stale.verdict).toBe("attention");
    expect(stale.detail).toContain("force_bots_deploy");
  });
});

describe("botsDeploySignal with the process's own reported commit (#666)", () => {
  const RUNNING = "abc1234def5678000000000000000000000000aa";

  it("names the running commit in every verdict, so the panel answers 'on what commit?'", () => {
    const current = botsDeploySignal(
      { known: true, baseline: true, lagging: false },
      LINK,
      RUNNING,
    );
    expect(current.verdict).toBe("ok");
    expect(current.detail).toContain("running abc1234");

    const stale = botsDeploySignal(
      { known: true, baseline: true, lagging: true, reason: "2 bot-relevant path(s)" },
      LINK,
      RUNNING,
    );
    expect(stale.verdict).toBe("attention");
    expect(stale.detail).toContain("running abc1234");
    expect(stale.detail).toContain("STALE");
    expect(stale.detail).toContain("force_bots_deploy");
  });

  it("still names the commit when GitHub couldn't say what changed since it", () => {
    const signal = botsDeploySignal(
      { known: false, baseline: false, lagging: false },
      LINK,
      RUNNING,
    );
    expect(signal.verdict).toBe("unknown");
    expect(signal.detail).toContain("running abc1234");
    expect(signal.detail).not.toContain("Couldn't scan Actions job history");
  });

  it("falls back to the deploy-record wording when the process reported no commit", () => {
    const signal = botsDeploySignal({ known: true, baseline: true, lagging: false }, LINK);
    expect(signal.detail).toBe(
      "Bots app is current — nothing bot-relevant merged since its last deploy.",
    );
  });
});

describe("the degraded deploy signals carry the reported commit", () => {
  const RUNNING = "0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f";

  it("says what is running but not whether it is current, with no GitHub token", () => {
    const { app, bots } = degradedDeploySignals(LINK, RUNNING);
    expect(app.detail).toContain("No GitHub token");
    expect(bots.detail).toContain("running 0f0f0f0");
    expect(bots.detail).toContain("isn't computed");
    expect(bots.verdict).toBe("unknown");
  });

  it("keeps the token-less wording untouched when nothing was reported", () => {
    expect(degradedDeploySignals(LINK).bots.detail).toContain("No GitHub token");
  });

  it("distinguishes an unreachable GitHub from a missing token", () => {
    expect(degradedFromFailure(LINK, RUNNING).bots.detail).toContain("running 0f0f0f0");
    expect(degradedFromFailure(LINK).bots.detail).toContain(
      "Couldn't reach the GitHub Actions API",
    );
  });
});
