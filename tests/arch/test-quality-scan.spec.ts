import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findSmells } from "../../scripts/test-quality-scan.mjs";
import { hermeticGitEnv } from "../support/hermetic-git";

// Advisory implementation-testing smell detector (Eric, 2026-08-30: tests as acceptance criteria —
// docs/ENGINEERING.md already forbids asserting on private fields or call counts; this catches
// regression into that pattern rather than gating it, since a real boundary can be a legitimate
// exception a script can't judge). Pure pattern-matching only; git-diff wiring is untested here,
// same split as plan-closure-scan.spec.ts.
describe("test-quality-scan: findSmells", () => {
  it("flags a call-count assertion", () => {
    const hits = findSmells("expect(fn).toHaveBeenCalledTimes(2);");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.reason).toContain("call COUNT");
  });

  it("flags a call-arguments assertion", () => {
    const hits = findSmells('expect(fn).toHaveBeenCalledWith("x");');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.reason).toContain("HOW a collaborator was called");
  });

  it("flags direct mock.calls access", () => {
    const hits = findSmells("const args = fn.mock.calls[0];");
    expect(hits).toHaveLength(1);
  });

  it("flags vi.spyOn and jest.spyOn", () => {
    expect(findSmells('vi.spyOn(obj, "method");')).toHaveLength(1);
    expect(findSmells('jest.spyOn(obj, "method");')).toHaveLength(1);
  });

  it("reports the correct line number for a hit past line one", () => {
    const hits = findSmells("const a = 1;\nconst b = 2;\nexpect(fn).toHaveBeenCalledTimes(1);");
    expect(hits[0]?.line).toBe(3);
  });

  it("stays silent on an ordinary behavioral assertion", () => {
    const hits = findSmells('expect(intents[0]).toMatchObject({ symbol: "SPY", side: "buy" });');
    expect(hits).toEqual([]);
  });

  it("stays silent on the empty string", () => {
    expect(findSmells("")).toEqual([]);
  });
});

// HONEST DEGRADATION (#3769 row 1: a missing input is a named state, never a quiet pass). The git
// wiring, driven for real in a seeded repo: a diff it cannot read is UNKNOWN (exit 2, still
// advisory — ship.sh runs it `|| true`), and a spec the change deleted is skipped by name.
describe("test-quality-scan: when an input the scan reads is missing", () => {
  const SCRIPT = fileURLToPath(new URL("../../scripts/test-quality-scan.mjs", import.meta.url));
  const env = hermeticGitEnv();
  let repo = "";
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.email=spec@example.com",
        "-c",
        "user.name=spec",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { cwd: repo, env, stdio: "pipe" },
    );
  const scan = (...args: string[]) =>
    spawnSync("node", [SCRIPT, ...args], { cwd: repo, env, encoding: "utf8" });

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), "test-quality-scan-"));
    git("init", "-q", "-b", "main");
    mkdirSync(join(repo, "tests"));
    writeFileSync(join(repo, "tests/old.spec.ts"), "expect(1).toBe(1);\n");
    git("add", "-A");
    git("commit", "-q", "-m", "seed");
    git("update-ref", "refs/remotes/origin/main", "HEAD");
    git("checkout", "-q", "-b", "feature");
    git("rm", "-q", "tests/old.spec.ts");
    mkdirSync(join(repo, "tests"), { recursive: true }); // rm took the now-empty dir with it
    writeFileSync(join(repo, "tests/new.spec.ts"), "expect(fn).toHaveBeenCalledTimes(2);\n");
    git("add", "-A");
    git("commit", "-q", "-m", "change");
  });
  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it("names a spec the change deleted instead of skipping it silently", () => {
    const res = scan("feature", "--base", "main");
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("· test-quality-scan: tests/old.spec.ts not on disk");
    expect(res.stdout).toContain("tests/new.spec.ts:1");
  });

  it("reports UNKNOWN with exit 2 when the diff cannot be read, never a clean silence", () => {
    const res = scan("no-such-branch", "--base", "main");
    expect(res.status).toBe(2);
    expect(res.stdout).toContain(
      "test-quality-scan: UNKNOWN — could not diff origin/main...no-such-branch",
    );
  });
});
