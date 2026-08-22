import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

type Check = { path: string; protected: boolean; pattern?: string; why?: string };
const check = (...paths: string[]): Check[] => JSON.parse(scan("--check", ...paths)) as Check[];

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
      "src/engine/guards.ts",
      "src/bots/account-guard.ts",
      "src/playbooks/registry.ts",
      "fly.toml",
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
    const run = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
        cwd: dir,
        encoding: "utf8",
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
      const passing = execFileSync("node", ["scripts/envelope-scan.mjs", "--base", "main"], {
        cwd: dir,
        encoding: "utf8",
      });
      expect(passing).toContain("nothing in the protected envelope was touched");

      mkdirSync(join(dir, "src/server/auth"), { recursive: true });
      writeFileSync(join(dir, "src/server/auth/session.ts"), "export const nope = 1;\n");
      run("add", "-A");
      run("commit", "-m", "protected path");
      expect(() =>
        execFileSync("node", ["scripts/envelope-scan.mjs", "--base", "main"], {
          cwd: dir,
          stdio: "pipe",
        }),
      ).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
