import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The dashboard restart gate (#4616). Driven through the real entrypoint, the house pattern for
// .mjs scripts. The stakes are asymmetric: a wrong `deploy` costs one restart, a wrong `skip` leaves
// production behind main with no signal — so these pin the BIAS (anything ambiguous deploys) and the
// one exception that must NOT skip (the research shelf, read from the image at request time).
type Verdict = { deploy: boolean; reason: string };
const SCRIPT = "scripts/dashboard-deploy-preflight.mjs";

const parse = (out: string): Verdict => {
  const [verdict, reason] = out.trim().split("\n");
  return { deploy: verdict === "deploy", reason: reason ?? "" };
};
const classify = (paths: string[]): Verdict =>
  parse(
    execFileSync("node", [SCRIPT, "--classify"], { input: paths.join("\n"), encoding: "utf8" }),
  );
const run = (env: Record<string, string>, cwd?: string): Verdict =>
  parse(
    execFileSync("node", [join(process.cwd(), SCRIPT)], {
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "", ...env },
      ...(cwd ? { cwd } : {}),
    }),
  );

describe("dashboard deploy preflight", () => {
  it("skips a push that touches only what .dockerignore keeps out of the image", () => {
    const v = classify([
      "tests/server/graceful-shutdown.spec.ts",
      ".github/workflows/pipeline.yml",
      "docs/IDEAS.md",
      "docs/plans/foo.png",
      "README.md",
      "data/history/2026-10-01.jsonl",
    ]);
    expect(v.deploy).toBe(false);
    expect(v.reason).toContain("6 path(s)");
  });

  it("deploys a nested markdown file — .dockerignore's `*.md` only matches the context root", () => {
    expect(classify(["src/server/README.md"]).deploy).toBe(true);
    expect(classify([".claude/skills/ship/SKILL.md"]).deploy).toBe(true);
  });

  it("deploys a research-shelf change — /research reads docs/research from the image", () => {
    expect(classify(["docs/research/nvda-aug-2026-print.md"]).deploy).toBe(true);
  });

  it("deploys on any runtime path, alone or mixed with skippable ones", () => {
    for (const path of [
      "src/domain/market-day.ts",
      "app/src/main.tsx",
      "scripts/smoke.sh",
      "package.json",
      "package-lock.json",
      "Dockerfile",
      "fly.toml",
      "fly.bots.toml",
      "arch-grandfather.json",
    ]) {
      expect(classify([path]).deploy, path).toBe(true);
      expect(classify(["docs/IDEAS.md", path]).deploy, `mixed ${path}`).toBe(true);
    }
  });

  it("skips an empty diff — nothing changed since the running commit", () => {
    expect(classify([]).deploy).toBe(false);
  });

  it("is never narrower than the bots classifier — a bots redeploy always follows a dashboard one", () => {
    // deploy-bots reuses the dashboard's image, so bots-relevant ⇒ dashboard-relevant must hold.
    for (const path of ["src/a.ts", "scripts/x.mjs", "package.json", "fly.toml", "Dockerfile"]) {
      const bots = execFileSync("node", ["scripts/bot-relevant.mjs", "--classify"], {
        input: path,
        encoding: "utf8",
      }).startsWith("deploy");
      if (bots) expect(classify([path]).deploy, path).toBe(true);
    }
  });

  it("deploys when forced, whatever the diff", () => {
    expect(run({ FORCE: "true", DEPLOYED_SHA: "abc", HEAD_SHA: "def" }).deploy).toBe(true);
  });

  it("fails open with no baseline sha — first deploy or a rollback dropped the stamp", () => {
    const v = run({ HEAD_SHA: "def" });
    expect(v.deploy).toBe(true);
    expect(v.reason).toContain("no GIT_SHA baseline");
  });

  it("fails open when the diff cannot be computed (unknown sha)", () => {
    const v = run({ DEPLOYED_SHA: "0".repeat(40), HEAD_SHA: "f".repeat(40) });
    expect(v.deploy).toBe(true);
    expect(v.reason).toContain("fail-open");
  });

  it("diffs from the deployed sha: docs-only since the running commit skips, src deploys", () => {
    const repo = mkRepo();
    const git = (...a: string[]) =>
      execFileSync("git", a, { cwd: repo, encoding: "utf8", env: hermeticGitEnv() }).trim();
    const base = git("rev-parse", "HEAD");
    writeFileSync(join(repo, "NOTES.md"), "more\n");
    git("add", ".");
    git("commit", "-qm", "docs: notes");
    const docsOnly = run({ DEPLOYED_SHA: base, HEAD_SHA: git("rev-parse", "HEAD") }, repo);
    expect(docsOnly.deploy).toBe(false);
    writeFileSync(join(repo, "server.ts"), "export {};\n");
    git("add", ".");
    git("commit", "-qm", "feat: server");
    const withSrc = run({ DEPLOYED_SHA: base, HEAD_SHA: git("rev-parse", "HEAD") }, repo);
    expect(withSrc.deploy).toBe(true);
    expect(withSrc.reason).toContain("server.ts");
  });
});

function mkRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "dash-preflight-"));
  const git = (...a: string[]) =>
    execFileSync("git", a, { cwd: dir, encoding: "utf8", env: hermeticGitEnv() });
  git("init", "-q");
  git("config", "user.email", "t@t");
  git("config", "user.name", "t");
  git("config", "commit.gpgsign", "false");
  writeFileSync(join(dir, "NOTES.md"), "start\n");
  git("add", ".");
  git("commit", "-qm", "init");
  return dir;
}
