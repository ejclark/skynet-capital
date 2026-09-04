import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The bots-app deploy preflight — extracted out of pipeline.yml's `deploy-bots` job (#933
// follow-up) so the token/cutover/force/baseline gates are spec-tested instead of living
// untested in a `run:` block. Driven through the real entrypoint (env vars in, two lines out),
// the house pattern for every script spec here — no `.d.ts` invented for an `.mjs` module.
// FLY_TOML_PATH points at a temp fixture so the cutover gate is provable without touching this
// repo's real fly.toml (already cut over — no `bots =` line).
const tmpToml = mkdtempSync(join(tmpdir(), "bots-preflight-"));
const cutTomlPath = join(tmpToml, "cut-over.toml");
const preCutoverTomlPath = join(tmpToml, "pre-cutover.toml");
writeFileSync(cutTomlPath, "dashboard = 1\n");
writeFileSync(preCutoverTomlPath, "bots = 1\ndashboard = 1\n");

afterAll(() => rmSync(tmpToml, { recursive: true, force: true }));

const preflight = (env: Record<string, string>): { deploy: boolean; reason: string } => {
  const out = execFileSync("node", ["scripts/bots-deploy-preflight.mjs"], {
    encoding: "utf8",
    env: { ...process.env, FLY_TOML_PATH: cutTomlPath, ...env },
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
