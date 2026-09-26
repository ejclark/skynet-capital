import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  reason?: string;
};
const check = (...paths: string[]): Check[] => JSON.parse(scan("--check", ...paths)) as Check[];

describe("autonomous-lane envelope", () => {
  it("protects the irreversible class — auth, credentials, money-moving logic, guards, workflows", () => {
    const protectedPaths = [
      ".github/workflows/moneypenny-events.yml",
      ".github/prompts/feedback-build.md",
      ".claude/settings.json",
      "envelope.json",
      "src/server/auth/session.ts",
      "src/server/account-identity-gate.ts",
      "src/server/invite-form.ts",
      "src/server/feedback-coach-model.ts",
      "src/companion/companion-model.ts",
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

  // #928 — the envelope gates cross-account data access, not trading-domain shape. None of these
  // carry an account-identity check (confirmed by reading each one, not by filename): risk sizing,
  // discipline rules, bot-account collision hygiene, and playbook authorship are ordinary open
  // trading-feature work a member or bot should be free to extend unattended.
  it("leaves risk guards, bot-account hygiene, and playbook authorship open (#928)", () => {
    const openPaths = [
      "src/engine/guards.ts",
      "src/bots/account-guard.ts",
      "src/playbooks/registry.ts",
      "src/trading/order-ticket.ts",
      "src/trading/option-ticket.ts",
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
    // Invoked by its real absolute path (not a copy) so the script's own `import "typescript"`
    // resolves against the real repo's node_modules — a bare copy into an isolated temp dir has no
    // node_modules tree of its own to resolve a bare specifier against (#716/#858 added the import).
    const scanTemp = (...args: string[]): string =>
      execFileSync(
        "node",
        [join(process.cwd(), "scripts/envelope-scan.mjs"), "--lane", "feedback/1", ...args],
        { cwd: dir, encoding: "utf8", env: hermeticGitEnv({ GITHUB_HEAD_REF: "" }) },
      );
    const run = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: hermeticGitEnv(),
      });
    try {
      run("init", "-b", "main");
      cpSync("envelope.json", join(dir, "envelope.json"));
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

  // Degrade honestly (#3769 row 1): an input the verdict rests on, missing, is a named UNKNOWN at
  // the gate's own failure exit — never "not a lane" or "no new deps".
  describe("missing inputs fail closed", () => {
    const script = join(process.cwd(), "scripts/envelope-scan.mjs");
    const scanIn = (dir: string, ...args: string[]) =>
      spawnSync(process.execPath, [script, ...args], {
        cwd: dir,
        encoding: "utf8",
        // Set AFTER the scrub (which drops every GIT_* key): git never climbs out of the temp dir.
        env: { ...hermeticGitEnv({ GITHUB_HEAD_REF: "" }), GIT_CEILING_DIRECTORIES: tmpdir() },
      });

    it("an unnameable branch (no --lane, no GITHUB_HEAD_REF, not a git tree) is UNKNOWN, exit 1", () => {
      const dir = mkdtempSync(join(tmpdir(), "envelope-nogit-"));
      try {
        cpSync("envelope.json", join(dir, "envelope.json"));
        const r = scanIn(dir);
        expect(r.status).toBe(1);
        expect(r.stderr).toContain("branch UNKNOWN");
        expect(r.stdout).not.toContain("not an autonomous lane");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("an unreadable base package.json is an UNKNOWN dependency breach, exit 1", () => {
      const dir = mkdtempSync(join(tmpdir(), "envelope-pkg-"));
      const run = (...args: string[]) =>
        execFileSync(
          "git",
          ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args],
          { cwd: dir, encoding: "utf8", env: hermeticGitEnv() },
        );
      try {
        run("init", "-q", "-b", "main");
        cpSync("envelope.json", join(dir, "envelope.json"));
        run("add", "-A");
        run("commit", "-q", "-m", "base without package.json");
        run("checkout", "-q", "-b", "feedback/2");
        writeFileSync(join(dir, "package.json"), '{"dependencies":{"left-pad":"1.0.0"}}\n');
        run("add", "-A");
        run("commit", "-q", "-m", "adds package.json");
        const r = scanIn(dir, "--lane", "feedback/2", "--base", "main");
        expect(r.status).toBe(1);
        expect(r.stderr).toContain("package.json → dependencies");
        expect(r.stderr).toContain("UNKNOWN — cannot read package.json at the merge base");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
