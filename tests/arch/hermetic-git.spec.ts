import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

/**
 * The gate that stops the 2026-08-26 index-corruption bug coming back a third time.
 *
 * Twice now a spec has built a throwaway git repo, reached it only through `cwd`, and — under
 * `.husky/pre-push`, where git exports `GIT_DIR` into the environment — silently operated on the
 * REAL repository instead. `envelope.spec.ts` staged a wholesale deletion of every tracked file;
 * `doc-rot.spec.ts` re-initialised the repo and flipped `core.bare`, after which every plain git
 * command answered "fatal: this operation must be run in a work tree".
 *
 * Both were fixed by hand, and the second was missed twice because the fix lived as a private
 * helper inside the file that hurt first. So the rule is machine-checked now: a spec that shells
 * out to git must reach it through `hermeticGitEnv`. Enforcement, not willingness — the same
 * doctrine every other gate in this repo runs on.
 */

const SPEC_ROOT = join(process.cwd(), "tests");

function specFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...specFiles(path));
    else if (entry.name.endsWith(".spec.ts")) found.push(path);
  }
  return found;
}

/** A spec that spawns `git` as a child process, by any of the node:child_process entry points. */
const SPAWNS_GIT = /(?:execFileSync|spawnSync|execFile|spawn)\(\s*"git"/;

describe("hermetic git in specs", () => {
  it("scrubs every GIT_* variable, not a remembered allowlist", () => {
    const env = hermeticGitEnv();
    const leaked = Object.keys(env).filter((k) => k.startsWith("GIT_"));
    expect(leaked).toEqual([]);
  });

  it("keeps the caller's own additions while scrubbing git's", () => {
    const env = hermeticGitEnv({ GITHUB_HEAD_REF: "", MY_FLAG: "1" });
    expect(env.MY_FLAG).toBe("1");
    expect(env.GITHUB_HEAD_REF).toBe(""); // not a GIT_ var — a GitHub one; must survive
  });

  it("every spec that spawns git reaches it through hermeticGitEnv", () => {
    const offenders = specFiles(SPEC_ROOT).filter((file) => {
      const source = readFileSync(file, "utf8");
      return SPAWNS_GIT.test(source) && !source.includes("hermeticGitEnv");
    });
    // A spec here spawns git with the ambient environment, so under a git hook it will operate on
    // the real repository instead of its own fixture. Import hermeticGitEnv and pass `env:`.
    expect(offenders).toEqual([]);
  });
});
