import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";

// A session signed in only through `gh` has no GH_TOKEN, but the plan's state block is read with
// curl. The post-merge audit of #6326 reproduced the result: a held plan stayed in --queue, and
// --check then refused it, so a /work-issues pass ended without building what was next. These run
// the real CLI entry with `gh` and `curl` stubbed, because injecting the reads is how the first spec
// missed this.
const CLI = resolve("scripts/moneypenny/admission.mjs");

const ROWS = JSON.stringify([
  {
    number: 4808,
    title: "A held plan",
    labels: [{ name: "ready" }, { name: "plan" }],
    assignees: [],
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
  {
    number: 42,
    title: "A small fix",
    labels: [{ name: "ready" }, { name: "feedback" }],
    assignees: [],
    created_at: "2026-10-02T00:00:00Z",
    updated_at: "2026-10-02T00:00:00Z",
  },
]);

const BLOCK = JSON.stringify([
  {
    body: "## State block\n\n**Next pickup: none buildable now.**\n",
    user: { type: "Bot", login: "skynet-envoy[bot]" },
    author_association: "NONE",
    created_at: "2026-10-01T00:00:00Z",
  },
]);

describe("admission's CLI on a machine signed in only through gh", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "admission-login-"));
    writeFileSync(join(dir, "rows.json"), ROWS);
    writeFileSync(join(dir, "block.json"), BLOCK);
    writeFileSync(
      join(dir, "gh"),
      [
        "#!/bin/sh",
        'case "$*" in',
        "  'auth token') echo from-the-login ;;",
        `  *"issues/4153 "*) echo '{"title":"Work mode: NORMAL","labels":[{"name":"work-mode:normal"}]}' ;;`,
        `  *) cat "${dir}/rows.json" ;;`,
        "esac",
        "",
      ].join("\n"),
    );
    writeFileSync(
      join(dir, "curl"),
      [
        "#!/bin/sh",
        `printf '%s\\n' "$*" >> "${dir}/curl.log"`,
        'case "$*" in',
        '  *"Bearer from-the-login"*) ;;',
        `  *) echo 'curl: (22) The requested URL returned error: 401' >&2; exit 22 ;;`,
        "esac",
        'case "$*" in',
        `  *comments*) cat "${dir}/block.json" ;;`,
        "  *) echo '[]' ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(join(dir, "gh"), 0o755);
    chmodSync(join(dir, "curl"), 0o755);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const run = (...args: string[]) => {
    const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${dir}:${process.env.PATH}` };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    return spawnSync("node", [CLI, ...args], { encoding: "utf8", env });
  };

  it("reads a plan's state block with the login's token", () => {
    const r = run("--queue");
    expect(r.stderr).not.toContain("could not be read");
    expect(readFileSync(join(dir, "curl.log"), "utf8")).toContain("Bearer from-the-login");
  });

  it("drops a held plan from --queue, as --check will refuse it", () => {
    const r = run("--queue");
    const listed = JSON.parse(r.stdout).map((row: { number: number }) => row.number);
    expect(listed).toEqual([42]);
    expect(r.stderr).toContain("skipping #4808");
  });
});
