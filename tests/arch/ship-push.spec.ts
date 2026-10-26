import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

/**
 * A BEHIND BRANCH IS CAUGHT UP, NOT REFUSED (#5195). The stale-base guard (docs/LESSONS.md,
 * 2026-09-04) refused and printed `git merge origin/main --no-edit`; 21 agents in 3 days ran it by
 * hand and re-ran ship open. Now ship runs that merge itself before verify, so verify still tests
 * the merged tree. Real git against a fake origin that moved ahead; `npx` and `npm` are stubs, and
 * the npm stub fails verify on purpose — "LOCAL VERIFY FAILED" proves the run carried on past the
 * merge, and stops it before anything reaches the network.
 */
describe("ship open — a branch behind origin/main is merged up, never rebased", () => {
  let dir: string;
  let work: string;
  const env = () =>
    hermeticGitEnv({
      GH_TOKEN: "test-token-never-used",
      PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`,
    });
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: work, encoding: "utf8", env: env(), stdio: "pipe" }).trim();
  const commit = (file: string, text: string, subject: string) => {
    writeFileSync(join(work, file), text);
    git(["add", "-A"]);
    git(["commit", "-q", "-m", subject]);
  };
  const ship = (extra: string[] = []) => {
    const body = join(dir, "body.md");
    writeFileSync(body, "## The picture\n\nPicture: waived — spec\n\n## Summary\n\n- spec\n");
    try {
      const out = execFileSync(
        "bash",
        [resolve("scripts/ship.sh"), "open", "test: spec", "--body-file", body, ...extra],
        { cwd: work, env: env(), stdio: "pipe" },
      );
      return { code: 0, stdout: out.toString(), stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stderr?: Buffer; stdout?: Buffer };
      return {
        code: e.status ?? -1,
        stdout: e.stdout?.toString() ?? "",
        stderr: e.stderr?.toString() ?? "",
      };
    }
  };
  /** A branch with its own work while origin/main moved two commits on; `clash` edits the same line. */
  const behindBy2 = (clash: boolean) => {
    commit("feature.txt", "feature\n", "feat: the branch's own work");
    if (clash) commit("shared.txt", "feature\n", "feat: the branch edits shared");
    git(["checkout", "-q", "main"]);
    commit("main-a.txt", "a\n", "chore: main moves on");
    commit("shared.txt", "main\n", "chore: main edits shared");
    git(["push", "-q", "origin", "main"]);
    git(["reset", "-q", "--hard", "HEAD~2"]);
    git(["checkout", "-q", "feature"]);
    return git(["rev-parse", "HEAD"]);
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-behind-"));
    work = join(dir, "work");
    mkdirSync(join(dir, "bin"));
    // Drain stdin: ship pipes the PR title in under `set -o pipefail`, so a stub that exits without
    // reading races `echo` into SIGPIPE and reads as a commitlint failure (flaky, and CI-load-sensitive).
    writeFileSync(join(dir, "bin", "npx"), "#!/bin/sh\ncat >/dev/null\nexit 0\n");
    writeFileSync(join(dir, "bin", "npm"), "#!/bin/sh\necho stub-npm-fails\nexit 1\n");
    chmodSync(join(dir, "bin", "npx"), 0o755);
    chmodSync(join(dir, "bin", "npm"), 0o755);
    execFileSync("git", ["init", "-q", "--bare", "-b", "main", join(dir, "origin.git")], {
      env: env(),
      stdio: "pipe",
    });
    mkdirSync(work);
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    git(["config", "commit.gpgsign", "false"]);
    git(["remote", "add", "origin", join(dir, "origin.git")]);
    // ship runs its body linter as `node scripts/…` from the repo root; lend it this repo's, untracked.
    symlinkSync(resolve("scripts"), join(work, "scripts"));
    writeFileSync(join(work, ".git", "info", "exclude"), "scripts\n");
    commit("shared.txt", "seed\n", "chore: seed");
    git(["push", "-q", "origin", "main"]);
    git(["checkout", "-q", "-b", "feature"]);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("merges a clean catch-up, says so in one line, and carries on to local verify", () => {
    const before = behindBy2(false);
    const { code, stdout } = ship();
    expect(stdout).toContain("ship: merged origin/main (2 commits)");
    expect(stdout).toContain("LOCAL VERIFY FAILED"); // the stubbed verify ran: the merge did not stop it
    expect(code).toBe(1);
    expect(git(["rev-parse", "HEAD^1"])).toBe(before); // a merge on top, the branch's own commits kept
    expect(git(["rev-parse", "HEAD^2"])).toBe(git(["rev-parse", "origin/main"]));
    expect(git(["log", "-1", "--format=%s"])).toBe(
      "Merge remote-tracking branch 'origin/main' into feature",
    );
  });

  it("aborts a conflicting merge, names the paths, and refuses with the branch untouched", () => {
    const before = behindBy2(true);
    const { code, stdout, stderr } = ship();
    expect(code).toBe(1);
    expect(stderr).toContain("conflicting paths:");
    expect(stderr).toContain("    shared.txt");
    expect(stderr).toContain("2 commit(s) behind origin/main");
    expect(stdout).not.toContain("local verify");
    expect(git(["rev-parse", "HEAD"])).toBe(before);
    expect(git(["status", "--porcelain"])).toBe("");
  });

  it("keeps today's refusal under --no-merge", () => {
    const before = behindBy2(false);
    const { code, stdout, stderr } = ship(["--no-merge"]);
    expect(code).toBe(1);
    expect(stderr).toContain("2 commit(s) behind origin/main");
    expect(stderr).toContain("git merge origin/main --no-edit");
    expect(stdout).not.toContain("merged origin/main");
    expect(git(["rev-parse", "HEAD"])).toBe(before);
  });
});

/**
 * A REFUSED PUSH SAYS WHY (#4495, 2026-10-02).
 *
 * The push loop sent stderr to /dev/null, so when GitHub refused a lane's workflow-file push for
 * want of the `workflows` permission, the log read only "push failed after retries" and the cause
 * took a second, manual push to see — half of the ~5 minutes each failure cost. These run the real
 * `ship push` against a bare origin whose pre-receive hook refuses the way GitHub did, echoing a
 * token-bearing URL the way git can, so the mask is tested on the same output path.
 */
describe("ship push — a refused push prints the remote's reason", () => {
  const refuse = (reason: string) => {
    const root = mkdtempSync(join(tmpdir(), "ship-push-"));
    const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
    const git = (cwd: string, args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8", env, stdio: "pipe" });
    const work = join(root, "work");
    const hits = join(root, "hits");
    try {
      git(root, ["init", "-q", "--bare", "-b", "main", "origin.git"]);
      writeFileSync(join(root, "reason"), `${reason}\n`);
      const hook = join(root, "origin.git", "hooks", "pre-receive");
      writeFileSync(
        hook,
        [
          "#!/bin/sh",
          `echo hit >> '${hits}'`,
          `cat '${join(root, "reason")}' >&2`,
          "echo 'seen at https://x-access-token:ghs_s3cr3tT0ken@github.com/o/r.git' >&2",
          "exit 1",
          "",
        ].join("\n"),
      );
      chmodSync(hook, 0o755);
      git(root, ["clone", "-q", join(root, "origin.git"), "work"]);
      git(work, ["config", "user.email", "spec@example.com"]);
      git(work, ["config", "user.name", "spec"]);
      git(work, ["checkout", "-q", "-b", "feedback/1"]);
      git(work, ["commit", "-q", "--allow-empty", "-m", "fix: the item"]);
      let code = 0;
      let stderr = "";
      try {
        execFileSync("bash", [resolve("scripts/ship.sh"), "push", "feedback/1"], {
          cwd: work,
          env,
          stdio: "pipe",
        });
      } catch (error) {
        const e = error as { status?: number; stderr?: Buffer };
        code = e.status ?? 1;
        stderr = e.stderr?.toString() ?? "";
      }
      return { code, stderr, attempts: readFileSync(hits, "utf8").trim().split("\n").length };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };

  it("names the `workflows` permission when that is why the remote refused", () => {
    const r = refuse(
      "refusing to allow a GitHub App to create or update workflow `.github/workflows/x.yml` without `workflows` permission",
    );
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("ship: push failed — the remote said:");
    expect(r.stderr).toContain("without `workflows` permission");
    expect(r.stderr).toContain("this credential lacks the `workflows` permission");
  });

  it("masks the token a remote message can echo back", () => {
    const r = refuse("pre-receive says no");
    expect(r.stderr).toContain("x-access-token:***@github.com");
    expect(r.stderr).not.toContain("ghs_s3cr3tT0ken");
  });

  it("stops at the first answered rejection — a retry cannot change it", () => {
    const r = refuse("pre-receive says no");
    expect(r.attempts).toBe(1);
    expect(r.stderr).toContain("pre-receive says no");
    expect(r.stderr).not.toContain("lacks the `workflows` permission");
  });
});
