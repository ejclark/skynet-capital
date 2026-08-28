import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classifyDiff } from "../../scripts/envelope-scan.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Autonomous-lane envelope gate — the mechanical replacement for a paragraph. Before this, the only
// thing stopping an unattended session from editing auth, credentials, or its own workflow was
// prompt text; because prompt text is arguable, it had to be written so defensively that ordinary
// member feedback got caught and routed to Eric. This gate is the trade that let the prompt's
// default become BUILD, so it is tested in BOTH directions — a protected path must fail, and an
// open one must pass. A gate that only ever passes is the failure mode this repo has banked before.
const scan = (...args: string[]): string =>
  execFileSync("node", ["scripts/envelope-scan.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

type Check = {
  path: string;
  protected: boolean;
  blocking: boolean;
  additiveSafe?: boolean;
  pattern?: string;
  why?: string;
};
const check = (...paths: string[]): Check[] => JSON.parse(scan("--check", ...paths)) as Check[];

// classifyDiff — the diffAware exemption's actual rule, calibrated against #679-#696's real diffs
// (see envelope.json's $diffAwareComment): a pure-insertion diff that adds no new mutating broker
// call is additive-safe; anything else, including a pure insertion that DOES add one, is not.
describe("classifyDiff — the diffAware exemption rule", () => {
  const insertOnly = [
    "diff --git a/f.ts b/f.ts",
    "--- a/f.ts",
    "+++ b/f.ts",
    "@@ -1,2 +1,4 @@",
    " export const a = 1;",
    "+export const b = 2;",
    "+export const c = 3;",
  ].join("\n");

  const removesALine = [
    "diff --git a/f.ts b/f.ts",
    "--- a/f.ts",
    "+++ b/f.ts",
    "@@ -1,2 +1,1 @@",
    "-export const a = 1;",
    "+export const a = 2;",
  ].join("\n");

  const insertsANewMutatingCall = [
    "diff --git a/f.ts b/f.ts",
    "--- a/f.ts",
    "+++ b/f.ts",
    "@@ -1,1 +1,3 @@",
    " export const a = 1;",
    "+export async function cancelOrder(id) {",
    "+  return this.transport.delete(`/v2/orders/${id}`);",
    "+}",
  ].join("\n");

  it("is additive-safe for a pure insertion that adds no new mutating call — the Slice 4 shape", () => {
    expect(classifyDiff(insertOnly)).toEqual({
      pureInsertion: true,
      addsNewMutatingCall: false,
      additiveSafe: true,
    });
  });

  it("is not additive-safe once an existing line is removed or modified — the Slice 1 shape", () => {
    expect(classifyDiff(removesALine)?.pureInsertion).toBe(false);
    expect(classifyDiff(removesALine)?.additiveSafe).toBe(false);
  });

  it("is not additive-safe for a pure insertion that adds a new mutating call — the Slice 2 shape", () => {
    const result = classifyDiff(insertsANewMutatingCall);
    expect(result?.pureInsertion).toBe(true);
    expect(result?.addsNewMutatingCall).toBe(true);
    expect(result?.additiveSafe).toBe(false);
  });

  it("treats no change at all as null, never as safe — 'no change' and 'unsafe' must not look alike", () => {
    expect(classifyDiff("")).toBeNull();
    expect(classifyDiff(null)).toBeNull();
    expect(classifyDiff(undefined)).toBeNull();
  });
});

describe("autonomous-lane envelope", () => {
  it("protects the irreversible class — auth, credentials, money-moving logic, guards, workflows", () => {
    const protectedPaths = [
      ".github/workflows/postmaster.yml",
      ".github/prompts/feedback-build.md",
      ".claude/settings.json",
      "envelope.json",
      "src/server/auth/session.ts",
      "src/server/desk-gate.ts",
      "src/server/invite-form.ts",
      "src/alpaca/credentials.ts",
      "src/alpaca/alpaca-trading-client.ts",
      "src/server/trade-service.ts",
      "src/trading/order-ticket.ts",
      "src/server/feedback-coach-limits.ts",
      "src/engine/guards.ts",
      "src/bots/account-guard.ts",
      "src/playbooks/registry.ts",
      "fly.toml",
      "fly.bots.toml",
      "scripts/bot-relevant.mjs",
      "scripts/smoke-bots.sh",
      "Dockerfile",
      ".env.local",
    ];
    for (const entry of check(...protectedPaths)) {
      expect(entry.protected, `${entry.path} must be protected`).toBe(true);
      expect(entry.why).toBeTruthy();
    }
  });

  // Eric, 2026-08-22 — "gate money-moving logic only". Rendering trades is ordinary buildable work;
  // a lane that can't restyle a trade card sends its member to Eric for a CSS change.
  // THE SEAM (2026-08-22). Protecting all of feedback-coach.ts would have been the blunt fix for the
  // spend loophole, but the system prompt is exactly the lever Eric named for improving the curator.
  // What costs money is gated; what improves quality stays open. Assert both halves, or the seam
  // silently collapses into "the whole file is frozen" the next time someone tidies it.
  it("gates the coach's cost dials while leaving its prompt open to improvement", () => {
    const [dials, prompt] = check(
      "src/server/feedback-coach-limits.ts",
      "src/server/feedback-coach.ts",
    );

    expect(dials?.protected).toBe(true);
    expect(dials?.why).toContain("bill");
    expect(prompt?.protected).toBe(false);
  });

  it("leaves presentation, UI, and the 3D scene open to the lanes", () => {
    const openPaths = [
      "src/observatory/feedback-view.ts",
      "src/observatory/board-view.ts",
      "src/ui/desk-style.ts",
      "src/three/kit/params.ts",
      "src/server/feedback-service.ts",
      "src/server/page-shell.ts",
      "docs/FEEDBACK.md",
      "tests/arch/envelope.spec.ts",
    ];
    for (const entry of check(...openPaths)) {
      expect(entry.protected, `${entry.path} must stay buildable`).toBe(false);
    }
  });

  it("skips branches that are not an autonomous lane, so human PRs are never gated", () => {
    expect(scan("--lane", "claude/some-human-branch")).toContain("not an autonomous lane");
  });

  it("--list names every protected pattern with the reason it is protected", () => {
    const listed = scan("--list");
    expect(listed).toContain("src/server/auth/**");
    expect(listed).toContain("new runtime dependencies");
  });

  // End to end through real git: a lane branch touching a protected path must exit non-zero, and
  // the same branch touching an open path must exit zero. This is the assertion that actually
  // stops a bad change reaching main — the rest above only prove the rule table.
  it("fails a lane branch that touches a protected path, and passes one that does not", () => {
    const dir = mkdtempSync(join(tmpdir(), "envelope-"));
    // `--lane` explicitly, and GITHUB_HEAD_REF scrubbed: in Actions that variable names the PR's
    // OWN branch and outranks the checked-out one (correct in production — CI checks out a detached
    // merge ref, so `rev-parse --abbrev-ref HEAD` says "HEAD"). Inside this temp repo it made the
    // scan skip, and the assertion below passed for the wrong reason on a green local run.
    const scanTemp = (...args: string[]): string =>
      execFileSync("node", ["scripts/envelope-scan.mjs", "--lane", "feedback/1", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: hermeticGitEnv({ GITHUB_HEAD_REF: "" }),
      });
    const run = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: hermeticGitEnv(),
      });
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "scripts"), { recursive: true });
      cpSync("envelope.json", join(dir, "envelope.json"));
      cpSync("scripts/envelope-scan.mjs", join(dir, "scripts/envelope-scan.mjs"));
      writeFileSync(join(dir, "README.md"), "base\n");
      run("add", "-A");
      run("commit", "-m", "base");

      run("checkout", "-b", "feedback/1");
      mkdirSync(join(dir, "src/observatory"), { recursive: true });
      writeFileSync(join(dir, "src/observatory/feedback-view.ts"), "export const ok = 1;\n");
      run("add", "-A");
      run("commit", "-m", "open path");
      expect(scanTemp("--base", "main")).toContain("nothing in the protected envelope was touched");

      mkdirSync(join(dir, "src/server/auth"), { recursive: true });
      writeFileSync(join(dir, "src/server/auth/session.ts"), "export const nope = 1;\n");
      run("add", "-A");
      run("commit", "-m", "protected path");
      expect(() => scanTemp("--base", "main")).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The diffAware exemption end to end, through real git — src/alpaca/alpaca-trading-client.ts is
  // a real diffAware rule in the shipped envelope.json (cpSync'd into this temp repo below), so this
  // exercises the actual production configuration, not a synthetic stand-in.
  it("exempts a diffAware protected path only when the real diff is a pure, non-mutating insertion", () => {
    const dir = mkdtempSync(join(tmpdir(), "envelope-diffaware-"));
    const run = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: hermeticGitEnv(),
      });
    const clientPath = join(dir, "src/alpaca/alpaca-trading-client.ts");
    const checkTemp = (...args: string[]): Check[] =>
      JSON.parse(
        execFileSync(
          "node",
          [join(process.cwd(), "scripts/envelope-scan.mjs"), "--check", ...args],
          {
            cwd: dir,
            encoding: "utf8",
            env: hermeticGitEnv(),
          },
        ),
      ) as Check[];
    const scanTemp = (...args: string[]): string =>
      execFileSync(
        "node",
        [join(process.cwd(), "scripts/envelope-scan.mjs"), "--lane", "feedback/1", ...args],
        { cwd: dir, encoding: "utf8", env: hermeticGitEnv({ GITHUB_HEAD_REF: "" }) },
      );
    try {
      run("init", "-b", "main");
      mkdirSync(join(dir, "src/alpaca"), { recursive: true });
      cpSync("envelope.json", join(dir, "envelope.json"));
      writeFileSync(clientPath, "export const existing = 1;\n");
      run("add", "-A");
      run("commit", "-m", "base");

      // Pure insertion, no new mutating call — exempt.
      run("checkout", "-b", "feedback/1");
      writeFileSync(clientPath, "export const existing = 1;\nexport const addedField = 2;\n");
      run("add", "-A");
      run("commit", "-m", "additive field");
      const additive = checkTemp("src/alpaca/alpaca-trading-client.ts", "--base", "main");
      expect(additive[0]).toMatchObject({ protected: true, additiveSafe: true, blocking: false });
      const additiveScan = scanTemp("--base", "main");
      expect(additiveScan).toContain("diffAware exemption");
      expect(additiveScan).toContain("nothing in the protected envelope was touched");

      // Same file, but an existing line changes — not a pure insertion, stays gated.
      run("checkout", "main");
      run("checkout", "-b", "feedback/2");
      writeFileSync(clientPath, "export const existing = 2;\n");
      run("add", "-A");
      run("commit", "-m", "modifies existing line");
      const modified = checkTemp("src/alpaca/alpaca-trading-client.ts", "--base", "main");
      expect(modified[0]).toMatchObject({ protected: true, additiveSafe: false, blocking: true });
      expect(() => scanTemp("--base", "main")).toThrow();

      // Pure insertion, but it adds a brand-new mutating broker call — stays gated even though
      // nothing existing was touched (the Slice 2 shape: new capability, not a safe extension).
      run("checkout", "main");
      run("checkout", "-b", "feedback/3");
      writeFileSync(
        clientPath,
        "export const existing = 1;\n" +
          "export async function cancelOrder(id) {\n" +
          "  return this.transport.delete(`/v2/orders/${id}`);\n" +
          "}\n",
      );
      run("add", "-A");
      run("commit", "-m", "new mutating call, purely additive");
      const newCall = checkTemp("src/alpaca/alpaca-trading-client.ts", "--base", "main");
      expect(newCall[0]).toMatchObject({ protected: true, additiveSafe: false, blocking: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
