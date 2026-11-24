import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import { addedParts, historyNote, serverAdditions } from "../../scripts/crawl/cohesion.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The cohesion census's history half (#8065): rows 4b and 4c read git back to the study
// (2026-10-09). A shallow clone's cut-off commit has no parent, so git diffs it against an empty
// tree and every file in it reads as added — the census counted 260 parts "added since the study"
// where full history has 96, and its note said the rows undercount. Done when: a shallow clone can
// only undercount, and the note shows exactly when the cut-off falls on or after the study.

const run = (cwd: string, args: string[], date?: string) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    // Identity and dates go on after the scrub, which drops every GIT_* key, extras included.
    env: {
      ...hermeticGitEnv(),
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@example.com",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@example.com",
      ...(date
        ? { GIT_AUTHOR_DATE: `${date}T12:00:00Z`, GIT_COMMITTER_DATE: `${date}T12:00:00Z` }
        : {}),
    },
  });

function commit(repo: string, date: string, subject: string, files: Record<string, string>) {
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, p)), { recursive: true });
    writeFileSync(join(repo, p), body);
  }
  run(repo, ["add", "-A"]);
  run(repo, ["commit", "-q", "-m", subject], date);
}

let root = "";
// The census's own git calls inherit process.env, and under a git hook its GIT_DIR outranks `cwd`:
// scrub every GIT_* key while these specs run, so they read the fixture and never the real repo.
const scrubbed: Record<string, string | undefined> = {};
const clone = (name: string, extra: string[]) => {
  const dir = join(root, name);
  run(root, ["clone", "-q", ...extra, `file://${join(root, "origin")}`, dir]);
  return dir;
};
const files = (cwd: string) => addedParts(cwd).map((p) => p.file);

beforeAll(() => {
  for (const k of Object.keys(process.env).filter((k) => k.startsWith("GIT_"))) {
    scrubbed[k] = process.env[k];
    delete process.env[k];
  }
  root = mkdtempSync(join(tmpdir(), "cohesion-history-"));
  const origin = join(root, "origin");
  mkdirSync(origin);
  run(origin, ["init", "-q", "-b", "main"]);
  commit(origin, "2026-09-01", "feat(old): before the study", {
    "app/src/shell/old.tsx": "export {};\n",
    "src/server/old.ts": 'const a = "/api/old";\n',
  });
  commit(origin, "2026-10-05", "chore: a touch before the study", { "README.md": "hi\n" });
  commit(origin, "2026-10-20", "feat(trade): a new route", {
    "app/src/routes/new.tsx": "export {};\n",
    "src/server/new.ts": 'const b = "/api/new";\n',
  });
  commit(origin, "2026-11-01", "fix(shell): a later part", {
    "app/src/shell/later.tsx": "export {};\n",
    "README.md": "hello\n",
  });
});
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  Object.assign(process.env, scrubbed);
});

describe("cohesion history in a full clone", () => {
  it("counts what was added since the study, with the commit's scope, and no note", () => {
    const full = clone("full", []);
    expect(addedParts(full)).toEqual([
      { file: "app/src/routes/new.tsx", scope: "feat(trade)" },
      { file: "app/src/shell/later.tsx", scope: "fix(shell)" },
    ]);
    expect(serverAdditions(full)).toEqual(["/api/new"]);
    expect(historyNote(full)).toBeNull();
  });
});

describe("cohesion history in a shallow clone", () => {
  it("never reads the cut-off commit's whole tree as added (depth 1)", () => {
    const shallow = clone("depth1", ["--depth", "1"]);
    // Before the fix: all three parts and both routes, the pre-study ones included.
    expect(files(shallow)).not.toContain("app/src/shell/old.tsx");
    expect(serverAdditions(shallow)).not.toContain("/api/old");
    // Only ever an undercount of full history.
    for (const f of files(shallow))
      expect(["app/src/routes/new.tsx", "app/src/shell/later.tsx"]).toContain(f);
    const note = historyNote(shallow);
    expect(note).toMatch(/2026-11-01/);
    expect(note).toMatch(/undercount/);
  });

  it("matches full history, with no note, once the cut-off is before the study", () => {
    const deep = clone("since", ["--shallow-since=2026-10-01"]);
    expect(files(deep)).toEqual(["app/src/routes/new.tsx", "app/src/shell/later.tsx"]);
    expect(serverAdditions(deep)).toEqual(["/api/new"]);
    expect(historyNote(deep)).toBeNull();
  });
});
