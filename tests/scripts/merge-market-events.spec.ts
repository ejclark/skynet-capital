import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The custom merge driver for src/domain/market-events-data.ts (#1324, measured 2026-09-04):
// 13+ concurrent research PRs each append one entry to that one shared array, so merging any one
// conflicts every other still-open PR against the new base. A plain git `merge=union` was tried
// first and PROVEN WRONG by exactly this test's first case — it merges by line, so two entries
// inserted at the same spot get their lines interleaved into one malformed, duplicate-keyed
// object. These specs run the driver through real git merges in a scratch repo (never mocked —
// the whole point is proving actual git invokes it correctly), covering both the case it must
// resolve silently and the case it must refuse to guess on.
const SCRIPT = join(process.cwd(), "scripts", "merge-market-events.mjs");

const BASE = `export const MARKET_EVENTS: readonly MarketEvent[] = [
  {
    id: "existing-a",
    date: "2026-01-01",
  },
];
`;

function insertBeforeClose(source: string, id: string, date: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inserted = false;
  for (const line of lines) {
    if (line.trim() === "];" && !inserted) {
      out.push("  {", `    id: "${id}",`, `    date: "${date}",`, "  },");
      inserted = true;
    }
    out.push(line);
  }
  return out.join("\n");
}

function git(dir: string, args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8", env: hermeticGitEnv() });
}

function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "merge-market-events-"));
  git(dir, ["init", "-q", "-b", "trunk"]);
  git(dir, ["config", "user.email", "t@t.com"]);
  git(dir, ["config", "user.name", "t"]);
  writeFileSync(join(dir, ".gitattributes"), "events.ts merge=market-events\n");
  git(dir, ["config", "merge.market-events.driver", `node ${SCRIPT} %O %A %B`]);
  writeFileSync(join(dir, "events.ts"), BASE);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-qm", "base"]);
  git(dir, ["tag", "base"]);
  return dir;
}

describe("merge-market-events driver", () => {
  it("keeps both sides' independent inserts as separate, valid entries", () => {
    const dir = makeRepo();
    try {
      git(dir, ["branch", "pr-a"]);
      git(dir, ["checkout", "-q", "pr-a"]);
      writeFileSync(join(dir, "events.ts"), insertBeforeClose(BASE, "new-from-pr-a", "2026-03-01"));
      git(dir, ["commit", "-aqm", "pr-a"]);

      git(dir, ["checkout", "-q", "trunk"]);
      git(dir, ["merge", "-q", "pr-a", "--no-edit"]);

      git(dir, ["checkout", "-q", "-b", "pr-b", "base"]);
      writeFileSync(join(dir, "events.ts"), insertBeforeClose(BASE, "new-from-pr-b", "2026-04-01"));
      git(dir, ["commit", "-aqm", "pr-b"]);

      git(dir, ["merge", "trunk", "--no-edit"]);

      const merged = readFileSync(join(dir, "events.ts"), "utf8");
      const evaluated = new Function(
        `${merged.replace("export const MARKET_EVENTS: readonly MarketEvent[] =", "return")}`,
      )();
      expect(evaluated.map((e: { id: string }) => e.id).sort()).toEqual([
        "existing-a",
        "new-from-pr-a",
        "new-from-pr-b",
      ]);
      // Regression guard for the union-merge failure this driver replaces: no entry may swallow
      // another's fields (the bug produced one object with both sides' id/date keys).
      for (const entry of evaluated) {
        expect(Object.keys(entry).sort()).toEqual(["date", "id"]);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to guess when both sides edit the same entry differently — a real conflict", () => {
    const dir = makeRepo();
    try {
      git(dir, ["branch", "fork-a"]);
      git(dir, ["checkout", "-q", "fork-a"]);
      writeFileSync(join(dir, "events.ts"), BASE.replace("2026-01-01", "2026-01-02"));
      git(dir, ["commit", "-aqm", "fork-a edits date"]);

      git(dir, ["checkout", "-q", "trunk"]);
      writeFileSync(join(dir, "events.ts"), BASE.replace("2026-01-01", "2026-01-03"));
      git(dir, ["commit", "-aqm", "trunk edits date differently"]);

      git(dir, ["checkout", "-q", "fork-a"]);
      expect(() => git(dir, ["merge", "trunk", "--no-edit"])).toThrow();

      const status = git(dir, ["status", "--short"]);
      expect(status).toContain("UU events.ts");

      // A refusal has to LOOK like a conflict, not just be recorded as one. With a custom driver
      // git does not run its own merge first, so without the driver's `git merge-file` fallback
      // %A holds plain "ours" — and anything scanning for markers (this repo's conflict-repair
      // lane reads them in step 2) would call the file clean and merge a silently-lost edit.
      const conflicted = readFileSync(join(dir, "events.ts"), "utf8");
      expect(conflicted).toContain("<<<<<<< ours");
      expect(conflicted).toContain("=======");
      expect(conflicted).toContain(">>>>>>> theirs");
      expect(conflicted).toContain("2026-01-02"); // ours
      expect(conflicted).toContain("2026-01-03"); // theirs
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("merges an entry removed by one side and untouched by the other", () => {
    const dir = makeRepo();
    try {
      git(dir, ["branch", "pr-a"]);
      git(dir, ["checkout", "-q", "pr-a"]);
      writeFileSync(join(dir, "events.ts"), insertBeforeClose(BASE, "to-remove", "2026-02-01"));
      git(dir, ["commit", "-aqm", "pr-a adds to-remove"]);
      git(dir, ["checkout", "-q", "trunk"]);
      git(dir, ["merge", "-q", "pr-a", "--no-edit"]);

      git(dir, ["checkout", "-q", "-b", "pr-b", "trunk"]);
      writeFileSync(
        join(dir, "events.ts"),
        insertBeforeClose(BASE, "to-remove", "2026-02-01").replace(
          /\s*\{\n\s*id: "to-remove",[\s\S]*?\},\n/,
          "\n",
        ),
      );
      git(dir, ["commit", "-aqm", "pr-b removes to-remove"]);
      git(dir, ["merge", "trunk", "--no-edit"]);

      const merged = readFileSync(join(dir, "events.ts"), "utf8");
      expect(merged).not.toContain("to-remove");
      expect(merged).toContain("existing-a");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
