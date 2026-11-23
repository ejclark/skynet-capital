import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import { hermeticGitEnv } from "../support/hermetic-git";

// The placement check's IO half (#8005 slice 2), end to end: the real readers over a copy of this
// repo's member-facing tree in a throwaway git repo, one commit per scenario, read back with
// `--commit` (base by `git archive`, head likewise) and, for an uncommitted file, by the working
// tree. Each scenario is one the census counts homeless, so a pass here that the census then
// counts is the plan's falsifier (2026-12-14) caught early. Pure rules: crawl-placement.spec.ts.

const REPO = process.cwd();
const SCRIPT = join(REPO, "scripts/crawl/placement.mjs");
const TREE = ["app/src", "src/server", "src/companion", "docs/IA.md", "docs/members/triage.json"];
const env = hermeticGitEnv({
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@t",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@t",
});

let dir = "";
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: dir, env, encoding: "utf8" }).trim();
const commit = (msg: string) => {
  git("add", "-A");
  git("commit", "-q", "-m", msg);
  return git("rev-parse", "HEAD");
};
/** The check's rows. Exit 1 is its advisory "something to place", so stdout is read either way. */
const rowsOf = (args: string[]) => {
  const run = spawnSync("node", [SCRIPT, ...args, "--json"], { cwd: dir, env, encoding: "utf8" });
  if (run.status !== 0 && run.status !== 1)
    throw new Error(`placement exited ${run.status}: ${run.stderr}`);
  return JSON.parse(run.stdout).rows as {
    kind: string;
    what: string;
    status: string;
    homes?: string[];
    words?: string[];
  }[];
};
const edit = (file: string, from: string, to: string) => {
  const path = join(dir, file);
  const src = readFileSync(path, "utf8");
  if (!src.includes(from)) throw new Error(`fixture drift: ${file} no longer holds ${from}`);
  writeFileSync(path, src.replace(from, to));
};

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "placement-replay-"));
  const tar = join(dir, ".tree.tar");
  execFileSync("git", ["archive", "--format=tar", "-o", tar, "HEAD", "--", ...TREE], {
    cwd: REPO,
    env: hermeticGitEnv(),
  });
  execFileSync("tar", ["-xf", tar, "-C", dir]);
  rmSync(tar);
  git("init", "-q");
  // A part that exists but no route imports yet: one branch adds it, a later one mounts it.
  writeFileSync(join(dir, "app/src/shell/zz-later.tsx"), "export const ZzLater = null;\n");
  commit("base");
}, 60_000);

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("the placement check over real trees", () => {
  it("judges a part the branch mounts, though an earlier branch added the file", () => {
    edit(
      "app/src/routes/trade.tsx",
      "import { createFileRoute",
      'import { ZzLater } from "../shell/zz-later";\nvoid ZzLater;\nimport { createFileRoute',
    );
    const rows = rowsOf(["--commit", commit("mount a part")]);
    expect(rows).toContainEqual(
      expect.objectContaining({
        kind: "part",
        what: "app/src/shell/zz-later.tsx",
        status: "homeless",
      }),
    );
  }, 60_000);

  it("flags a member route the server adds and nothing reads", () => {
    appendFileSync(join(dir, "src/server/dashboard-server.ts"), '\nconst ZZ = "/api/zz-probe";\n');
    const rows = rowsOf(["--commit", commit("serve a route")]);
    expect(rows).toEqual([{ kind: "api", what: "/api/zz-probe", status: "homeless" }]);
  }, 60_000);

  it("names the group a new section's triage home extends", () => {
    edit(
      "app/src/shell/trade-bench.tsx",
      '  { id: "orders", label: "Orders" },',
      '  { id: "orders", label: "Orders" },\n  { id: "scanner", label: "Scanner" },',
    );
    const triage = join(dir, "docs/members/triage.json");
    const rowsJson = JSON.parse(readFileSync(triage, "utf8"));
    rowsJson.push({ screen: "/trade ?section=scanner", verdict: "keep", home: "workbench" });
    writeFileSync(triage, `${JSON.stringify(rowsJson, null, 2)}\n`);
    const rows = rowsOf(["--commit", commit("add a section")]);
    expect(rows).toContainEqual({
      kind: "screen",
      what: "/trade ?section=scanner",
      home: "workbench",
      status: "extends",
      words: ["Scanner"],
    });
  }, 60_000);

  it("sees a new part still untracked when run by hand before a commit", () => {
    writeFileSync(join(dir, "app/src/shell/zz-draft.tsx"), "export const ZzDraft = null;\n");
    edit(
      "app/src/routes/trade.tsx",
      "import { createFileRoute",
      'import { ZzDraft } from "../shell/zz-draft";\nvoid ZzDraft;\nimport { createFileRoute',
    );
    const rows = rowsOf(["--base", "HEAD"]);
    expect(rows).toContainEqual(
      expect.objectContaining({
        kind: "part",
        what: "app/src/shell/zz-draft.tsx",
        status: "homeless",
      }),
    );
  }, 60_000);
});
