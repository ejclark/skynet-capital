import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The bots-app deploy preflight — extracted out of pipeline.yml's `deploy-bots` job (#933
// follow-up) so the token/cutover/force/baseline gates are spec-tested instead of living
// untested in a `run:` block. Driven through the real entrypoint (env vars in, two lines out),
// the house pattern for every script spec here — no `.d.ts` invented for an `.mjs` module.
// FLY_TOML_PATH points at a temp fixture so the cutover gate is provable without touching this
// repo's real fly.toml (already cut over — no `bots =` line).
const tmpToml = mkdtempSync(join(tmpdir(), "bots-preflight-"));
// The volume gate (2026-09-04, 16 red deploys on a mount whose volume did not exist yet) asks
// flyctl for the app volumes; VOLUMES_JSON stands in for that answer so no spec ever shells out.
const VOLUMES_PRESENT = JSON.stringify([{ name: "skynet_bots_data" }]);
const botsTomlPath = join(tmpToml, "fly.bots.toml");
writeFileSync(
  botsTomlPath,
  `app = "skynet-capital-bots"\n[mounts]\n  source = "skynet_bots_data"\n  destination = "/data"\n`,
);
const cutTomlPath = join(tmpToml, "cut-over.toml");
const preCutoverTomlPath = join(tmpToml, "pre-cutover.toml");
writeFileSync(cutTomlPath, "dashboard = 1\n");
writeFileSync(preCutoverTomlPath, "bots = 1\ndashboard = 1\n");
// The failure backoff (#6005) asks the GitHub API for the SHA's deploy history; an empty
// BOTS_DEPLOY_HISTORY stands in for "no prior attempts", and GITHUB_STEP_SUMMARY points at a temp
// file so a CI run of this spec never writes into its own job summary.
const summaryPath = join(tmpToml, "step-summary.md");

afterAll(() => rmSync(tmpToml, { recursive: true, force: true }));

const preflight = (env: Record<string, string>): { deploy: boolean; reason: string } => {
  const out = execFileSync("node", ["scripts/bots-deploy-preflight.mjs"], {
    encoding: "utf8",
    env: {
      ...process.env,
      FLY_TOML_PATH: cutTomlPath,
      VOLUMES_JSON: VOLUMES_PRESENT,
      BOTS_DEPLOY_HISTORY: "",
      GITHUB_STEP_SUMMARY: summaryPath,
      ...env,
    },
  });
  const [verdict, reason] = out.trim().split("\n");
  return { deploy: verdict === "deploy", reason: reason ?? "" };
};

const BASE_ENV = {
  FLY_API_TOKEN: "a-token",
  FORCE: "false",
  DEPLOYED_SHA: "",
  HEAD_SHA: "",
};

const NOW = Date.parse("2026-09-04T16:00:00Z");
const DEBOUNCE_MIN = 15;
const isoMinutesAgo = (min: number) => new Date(NOW - min * 60_000).toISOString();

describe("bots-deploy preflight (deploy-bots gate)", () => {
  it("skips when no bots-app Fly token is provisioned — safe no-op until Eric sets one up", () => {
    const verdict = preflight({ ...BASE_ENV, FLY_API_TOKEN: "" });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("FLY_API_TOKEN_BOTS");
  });

  it("skips pre-cutover — token present but fly.toml still owns the bots process group", () => {
    const verdict = preflight({ ...BASE_ENV, FLY_TOML_PATH: preCutoverTomlPath });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("pre-cutover");
  });

  it("deploys on force_bots_deploy regardless of baseline", () => {
    const verdict = preflight({ ...BASE_ENV, FORCE: "true" });
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toBe("force_bots_deploy dispatch");
  });

  it("deploys when there is no GIT_SHA baseline — first deploy, or a manual one", () => {
    const verdict = preflight({ ...BASE_ENV, DEPLOYED_SHA: "" });
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toContain("no GIT_SHA baseline");
  });

  it("falls through to the path classifier once token/cutover/force/baseline all clear", () => {
    // DEPLOYED_SHA == HEAD_SHA (both "HEAD") is an empty diff — the classifier's own "nothing
    // changed" case, proving the git-diff -> classify wiring without depending on repo history.
    const verdict = preflight({ ...BASE_ENV, DEPLOYED_SHA: "HEAD", HEAD_SHA: "HEAD" });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("no changed paths");
  });

  it("priority order: token beats cutover and force — no token is the first word", () => {
    const verdict = preflight({
      ...BASE_ENV,
      FLY_API_TOKEN: "",
      FLY_TOML_PATH: preCutoverTomlPath,
      FORCE: "true",
    });
    expect(verdict.reason).toContain("FLY_API_TOKEN_BOTS");
  });

  it("priority order: cutover beats force — pre-cutover wins even on a forced dispatch", () => {
    const verdict = preflight({ ...BASE_ENV, FLY_TOML_PATH: preCutoverTomlPath, FORCE: "true" });
    expect(verdict.reason).toContain("pre-cutover");
  });

  describe("debounce — the 2026-08-26 incident class, reintroduced via the research lane", () => {
    it("skips a bot-relevant change when the last deploy was under the cooldown window", () => {
      const verdict = preflight({
        ...BASE_ENV,
        DEPLOYED_SHA: "HEAD",
        HEAD_SHA: "HEAD",
        DEPLOYED_AT: isoMinutesAgo(5),
        NOW_MS: String(NOW),
      });
      expect(verdict.deploy).toBe(false);
      expect(verdict.reason).toContain("debounced");
      expect(verdict.reason).toContain("5m ago");
    });

    it("falls through to the classifier once the cooldown window has passed", () => {
      const verdict = preflight({
        ...BASE_ENV,
        DEPLOYED_SHA: "HEAD",
        HEAD_SHA: "HEAD",
        DEPLOYED_AT: isoMinutesAgo(DEBOUNCE_MIN + 1),
        NOW_MS: String(NOW),
      });
      expect(verdict.reason).toContain("no changed paths");
    });

    it("never debounces a forced dispatch", () => {
      const verdict = preflight({
        ...BASE_ENV,
        FORCE: "true",
        DEPLOYED_SHA: "HEAD",
        HEAD_SHA: "HEAD",
        DEPLOYED_AT: isoMinutesAgo(1),
        NOW_MS: String(NOW),
      });
      expect(verdict.deploy).toBe(true);
      expect(verdict.reason).toBe("force_bots_deploy dispatch");
    });

    it("never debounces the first deploy — no baseline still wins outright", () => {
      const verdict = preflight({
        ...BASE_ENV,
        DEPLOYED_SHA: "",
        DEPLOYED_AT: isoMinutesAgo(1),
        NOW_MS: String(NOW),
      });
      expect(verdict.deploy).toBe(true);
      expect(verdict.reason).toContain("no GIT_SHA baseline");
    });

    it("fails open on a missing or unparseable DEPLOYED_AT — no debounce, straight to classify", () => {
      const verdict = preflight({
        ...BASE_ENV,
        DEPLOYED_SHA: "HEAD",
        HEAD_SHA: "HEAD",
        DEPLOYED_AT: "not-a-timestamp",
        NOW_MS: String(NOW),
      });
      expect(verdict.reason).toContain("no changed paths");
    });
  });
});

describe("bots-deploy preflight — the volume gate (#1264 aftermath)", () => {
  it("skips with the exact `fly volume create` when a declared mount has no volume", () => {
    const verdict = preflight({
      ...BASE_ENV,
      FORCE: "true",
      BOTS_TOML_PATH: botsTomlPath,
      VOLUMES_JSON: "[]",
    });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("skynet_bots_data");
    expect(verdict.reason).toContain("fly volume create skynet_bots_data -a skynet-capital-bots");
  });

  it("deploys when the listing shows the declared volume", () => {
    const verdict = preflight({
      ...BASE_ENV,
      FORCE: "true",
      BOTS_TOML_PATH: botsTomlPath,
      VOLUMES_JSON: VOLUMES_PRESENT,
    });
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toBe("force_bots_deploy dispatch");
  });

  it("fails open on an unreadable listing — the gate never blocks on its own error", () => {
    const verdict = preflight({
      ...BASE_ENV,
      FORCE: "true",
      BOTS_TOML_PATH: botsTomlPath,
      VOLUMES_JSON: "not json",
    });
    expect(verdict.deploy).toBe(true);
  });

  // Degrade honestly (#3769 row 1): a fail-open still names what it skipped — one `·` note on
  // stderr, so the two-line stdout contract pipeline.yml parses with head/tail is untouched.
  const preflightStderr = (env: Record<string, string>) =>
    spawnSync(process.execPath, ["scripts/bots-deploy-preflight.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        FLY_TOML_PATH: cutTomlPath,
        BOTS_DEPLOY_HISTORY: "",
        GITHUB_STEP_SUMMARY: summaryPath,
        ...env,
      },
    });

  it("names the skipped volume check when the listing is unreadable — stdout stays two lines", () => {
    const r = preflightStderr({
      ...BASE_ENV,
      FORCE: "true",
      BOTS_TOML_PATH: botsTomlPath,
      VOLUMES_JSON: "not json",
    });
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split("\n")).toEqual(["deploy", "force_bots_deploy dispatch"]);
    expect(r.stderr).toContain("· volume check skipped (volume listing is not JSON) — UNKNOWN");
  });

  it("names the skipped volume check when flyctl cannot answer", () => {
    // PATH points at a dir with no flyctl — the same state as a runner without it installed.
    const r = preflightStderr({ ...BASE_ENV, FORCE: "true", PATH: tmpToml });
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split("\n")[0]).toBe("deploy");
    expect(r.stderr).toContain(
      "· volume check skipped (`flyctl volumes list -a skynet-capital-bots` failed)",
    );
  });

  it("never overrides a skip verdict — a missing volume is not consulted when nothing would deploy", () => {
    const verdict = preflight({
      ...BASE_ENV,
      FLY_API_TOKEN: "",
      BOTS_TOML_PATH: botsTomlPath,
      VOLUMES_JSON: "[]",
    });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("no bots-app Fly token");
  });
});

describe("bots-deploy preflight — the per-SHA failure backoff (#6005)", () => {
  // The incident: a rolled-back deploy drops the GIT_SHA stamp, so "no baseline" said deploy on
  // every catch-up tick — 91 dispatches on one commit. HEAD_SHA is a full-length fake SHA.
  const HEAD = "dd038433aaaabbbbccccddddeeeeffff00001111";
  const UNSTAMPED = { ...BASE_ENV, DEPLOYED_SHA: "", HEAD_SHA: HEAD };

  it("skips once the last 3 bots deploys of this SHA all failed, and says so in the summary", () => {
    rmSync(summaryPath, { force: true });
    const verdict = preflight({ ...UNSTAMPED, BOTS_DEPLOY_HISTORY: "failure,failure,failure" });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("backoff: the last 3 bots deploys of dd03843 failed");
    expect(verdict.reason).toContain("next bot-relevant commit on main");
    expect(readFileSync(summaryPath, "utf8")).toContain("**Bots deploy held**");
  });

  it("still tries while the streak is under the limit", () => {
    const verdict = preflight({ ...UNSTAMPED, BOTS_DEPLOY_HISTORY: "failure,failure" });
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toContain("no GIT_SHA baseline");
  });

  it("a success ends the streak — older failures before it never count", () => {
    const verdict = preflight({
      ...UNSTAMPED,
      BOTS_DEPLOY_HISTORY: "failure,success,failure,failure",
    });
    expect(verdict.deploy).toBe(true);
  });

  it("cancelled or skipped jobs were never attempts — they neither count nor break the streak", () => {
    const verdict = preflight({
      ...UNSTAMPED,
      BOTS_DEPLOY_HISTORY: "failure,cancelled,failure,skipped,failure",
    });
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("backoff");
  });

  it("a new commit is a clean record — no history for the new SHA, so it deploys", () => {
    const verdict = preflight({ ...UNSTAMPED, HEAD_SHA: "f".repeat(40), BOTS_DEPLOY_HISTORY: "" });
    expect(verdict.deploy).toBe(true);
  });

  it("never holds a forced dispatch — the manual lever always gets its try", () => {
    const verdict = preflight({
      ...UNSTAMPED,
      FORCE: "true",
      BOTS_DEPLOY_HISTORY: "failure,failure,failure,failure",
    });
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toBe("force_bots_deploy dispatch");
  });

  it("never consulted on a skip verdict — nothing to hold when nothing would deploy", () => {
    const verdict = preflight({
      ...BASE_ENV,
      DEPLOYED_SHA: "HEAD",
      HEAD_SHA: "HEAD",
      BOTS_DEPLOY_HISTORY: "failure,failure,failure",
    });
    expect(verdict.reason).toContain("no changed paths");
  });

  it("fails open and names itself when the run history cannot be read", () => {
    // No BOTS_DEPLOY_HISTORY override and PATH without gh — the pipeline's own token-less state.
    const env: Record<string, string | undefined> = {
      ...process.env,
      ...UNSTAMPED,
      FLY_TOML_PATH: cutTomlPath,
      VOLUMES_JSON: VOLUMES_PRESENT,
      GITHUB_STEP_SUMMARY: summaryPath,
      PATH: tmpToml,
    };
    delete env.BOTS_DEPLOY_HISTORY;
    const r = spawnSync(process.execPath, ["scripts/bots-deploy-preflight.mjs"], {
      encoding: "utf8",
      env,
    });
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split("\n")[0]).toBe("deploy");
    expect(r.stderr).toContain(
      "· failure backoff skipped (`gh api` could not read the run history) — UNKNOWN",
    );
  });
});
