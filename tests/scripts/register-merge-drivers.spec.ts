import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #1324: .gitattributes has named `merge=market-events` on the shared market-events data file for a
// while, and scripts/merge-market-events.mjs has implemented it — but git resolves a driver NAME to
// a driver COMMAND through .git/config, which is untracked, so a fresh clone or CI checkout had the
// attribute pointing at nothing and fell back to the line-based merge that caused the conflicts in
// the first place. These specs pin the registration itself, and pin the load-bearing detail that
// it happens ABOVE setup-commit-signing.sh's GIT_SIGNING_KEY early-exit — GIT_SIGNING_KEY is unset
// in every CI lane, which is exactly where the unregistered driver was costing merges.
//
// Everything runs in a scratch repo under a hermetic git env: registering a driver is a real
// .git/config write, and a spec that reached the developer's own repo would be a side effect.
const SCRIPTS = join(process.cwd(), "scripts");

function git(dir: string, args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8", env: hermeticGitEnv() });
}

/** A throwaway repo carrying copies of the two scripts under test (and the driver they name). */
function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "register-merge-drivers-"));
  git(dir, ["init", "-q", "-b", "trunk"]);
  mkdirSync(join(dir, "scripts"));
  for (const name of [
    "register-merge-drivers.sh",
    "setup-commit-signing.sh",
    "merge-market-events.mjs",
  ]) {
    copyFileSync(join(SCRIPTS, name), join(dir, "scripts", name));
  }
  return dir;
}

function run(dir: string, script: string, env: Record<string, string> = {}) {
  return spawnSync("bash", [join(dir, "scripts", script)], {
    cwd: dir,
    encoding: "utf8",
    env: hermeticGitEnv(env),
  });
}

describe("register-merge-drivers.sh", () => {
  it("writes the market-events driver command into the repo's own git config", () => {
    const dir = makeRepo();
    try {
      const result = run(dir, "register-merge-drivers.sh");
      expect(result.status).toBe(0);

      const command = git(dir, ["config", "--get", "merge.market-events.driver"]).trim();
      expect(command).toContain("merge-market-events.mjs");
      expect(command).toContain("%O %A %B"); // git's ancestor/ours/theirs placeholders
      expect(git(dir, ["config", "--get", "merge.market-events.name"]).trim()).not.toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is idempotent — a second run leaves exactly one driver entry, not a duplicate", () => {
    const dir = makeRepo();
    try {
      expect(run(dir, "register-merge-drivers.sh").status).toBe(0);
      expect(run(dir, "register-merge-drivers.sh").status).toBe(0);

      const all = git(dir, ["config", "--get-all", "merge.market-events.driver"])
        .trim()
        .split("\n");
      expect(all).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("no-ops instead of failing when there is no git work tree to register into", () => {
    const dir = mkdtempSync(join(tmpdir(), "register-merge-drivers-nogit-"));
    try {
      mkdirSync(join(dir, "scripts"));
      copyFileSync(
        join(SCRIPTS, "register-merge-drivers.sh"),
        join(dir, "scripts", "register-merge-drivers.sh"),
      );
      // A SessionStart hook that fails is far more expensive than an unregistered driver, so the
      // script has to survive being run somewhere it cannot do its job.
      const result = run(dir, "register-merge-drivers.sh");
      expect(result.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("setup-commit-signing.sh", () => {
  it("still registers the merge driver when GIT_SIGNING_KEY is unset — the CI-lane path", () => {
    const dir = makeRepo();
    try {
      const result = run(dir, "setup-commit-signing.sh", { GIT_SIGNING_KEY: "" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("GIT_SIGNING_KEY not set");

      expect(git(dir, ["config", "--get", "merge.market-events.driver"]).trim()).toContain(
        "merge-market-events.mjs",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
