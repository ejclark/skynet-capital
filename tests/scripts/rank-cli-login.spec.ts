import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";

// #6676: on a laptop with no token in the environment, `npm run rank` died with `Bad credentials`
// because it never asked the gh login, as the other session commands do. These run the real CLI
// entry with `gh` and `curl` stubbed, the shape admission-cli-login.spec.ts set for the same bug.
const CLI = resolve("scripts/rank.mjs");

describe("rank's CLI with no token in the environment", () => {
  let dir: string;
  const stub = (name: string, lines: string[]) => {
    writeFileSync(join(dir, name), ["#!/bin/sh", ...lines, ""].join("\n"));
    chmodSync(join(dir, name), 0o755);
  };
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "rank-login-"));
    stub("curl", [
      `printf '%s\\n' "$*" >> "${dir}/curl.log"`,
      'case "$*" in',
      `  *"Bearer from-the-login"*) echo '[]' ;;`,
      `  *) echo '{"message":"Bad credentials"}'; echo 'curl: (22) The requested URL returned error: 401' >&2; exit 22 ;;`,
      "esac",
    ]);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const run = () => {
    const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${dir}:${process.env.PATH}` };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    return spawnSync("node", [CLI], { encoding: "utf8", env });
  };

  it("reads the queue with the gh login's token", () => {
    stub("gh", ["[ \"$*\" = 'auth token' ] && echo from-the-login"]);
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("0 buildable items");
    expect(readFileSync(join(dir, "curl.log"), "utf8")).toContain("Bearer from-the-login");
  });

  it("says how to sign in, in one line, when there is no gh login either", () => {
    stub("gh", ["echo 'not logged in' >&2", "exit 1"]);
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr.trim().split("\n")).toEqual([
      "rank: no GH_TOKEN, GITHUB_TOKEN or `gh auth token` — sign in with `gh auth login`",
    ]);
  });
});
