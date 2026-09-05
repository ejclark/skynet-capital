import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// `docs/research/forward-tests.md merge=union` in .gitattributes (#1334, measured 2026-09-05).
// Every research session appends ONE table row at the ledger's tail; 13 of 24 conflict-flagged PRs
// since 09-03 named this file, and all 25 ledger commits on main since 09-04 are pure appends, so
// any two open research PRs conflict by construction even though their content never disagrees.
// These specs run real git merges in a scratch repo (never mocked — the point is proving git itself
// resolves this shape), and deliberately assert the NEGATIVE too: the identical pair without the
// attribute must still conflict, so dropping the line from .gitattributes fails loudly here rather
// than quietly restoring the bottleneck.
const LEDGER = "docs/research/forward-tests.md";

const BASE = `# Forward-test register — predictions logged before outcomes

| Id | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|
| FT-1 | first prediction | first kill switch | 2026-09-01 | _open_ |
| FT-2 | second prediction | second kill switch | 2026-09-02 | _open_ |

**Rules.** New registrations append here, at the tail of the table.
`;

/** Append one row where a research session appends it: at the tail of the table. */
function appendRow(source: string, id: string): string {
  const row = `| ${id} | ${id} prediction | ${id} kill switch | 2026-09-30 | _open_ |`;
  const lines = source.split("\n");
  let last = -1;
  for (const [index, line] of lines.entries()) if (line.startsWith("| FT-")) last = index;
  lines.splice(last + 1, 0, row);
  return lines.join("\n");
}

function rowIds(source: string): string[] {
  return [...source.matchAll(/^\|\s*(FT-[\w-]+)\s*\|/gm)].map((match) => match[1] ?? "");
}

function git(dir: string, args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8", env: hermeticGitEnv() });
}

function makeRepo(options: { union: boolean }): string {
  const dir = mkdtempSync(join(tmpdir(), "merge-forward-tests-"));
  git(dir, ["init", "-q", "-b", "trunk"]);
  git(dir, ["config", "user.email", "t@t.com"]);
  git(dir, ["config", "user.name", "t"]);
  writeFileSync(join(dir, ".gitattributes"), options.union ? "ledger.md merge=union\n" : "");
  writeFileSync(join(dir, "ledger.md"), BASE);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-qm", "base"]);
  git(dir, ["tag", "base"]);
  return dir;
}

/** Two research PRs fork from the same base, each append a row, and one merges first. */
function raceTwoAppends(dir: string): void {
  git(dir, ["checkout", "-q", "-b", "pr-a"]);
  writeFileSync(join(dir, "ledger.md"), appendRow(BASE, "FT-from-pr-a"));
  git(dir, ["commit", "-aqm", "pr-a registers a forward test"]);

  git(dir, ["checkout", "-q", "trunk"]);
  git(dir, ["merge", "-q", "pr-a", "--no-edit"]);

  git(dir, ["checkout", "-q", "-b", "pr-b", "base"]);
  writeFileSync(join(dir, "ledger.md"), appendRow(BASE, "FT-from-pr-b"));
  git(dir, ["commit", "-aqm", "pr-b registers a forward test"]);

  git(dir, ["merge", "trunk", "--no-edit"]);
}

describe("forward-tests ledger merge=union", () => {
  it("resolves two concurrent tail appends with no conflict, keeping both rows in the table", () => {
    const dir = makeRepo({ union: true });
    try {
      raceTwoAppends(dir);

      const merged = readFileSync(join(dir, "ledger.md"), "utf8");
      expect(merged).not.toContain("<<<<<<<");
      expect(rowIds(merged).sort()).toEqual(["FT-1", "FT-2", "FT-from-pr-a", "FT-from-pr-b"]);
      // Both rows have to land INSIDE the table. Union emits ours-then-theirs within the hunk, so
      // nothing may be interleaved past the closing prose — the ledger's readers (and the id scan's
      // `^\|\s*(FT-…)` match) assume one row per line, all above the Rules paragraph.
      const rules = merged.indexOf("**Rules.**");
      expect(rules).toBeGreaterThan(merged.lastIndexOf("| FT-from-pr-"));
      expect(merged.trimEnd().endsWith("at the tail of the table.")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("still conflicts on the identical pair when the attribute is absent", () => {
    const dir = makeRepo({ union: false });
    try {
      expect(() => raceTwoAppends(dir)).toThrow();
      expect(git(dir, ["status", "--short"])).toContain("UU ledger.md");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("declares union for the real ledger path and for nothing wider", () => {
    const cwd = process.cwd();
    const attr = (path: string): string =>
      execFileSync("git", ["check-attr", "merge", "--", path], {
        cwd,
        encoding: "utf8",
        env: hermeticGitEnv(),
      }).trim();

    expect(attr(LEDGER)).toBe(`${LEDGER}: merge: union`);
    // Event ledgers carry multi-line prose, where union interleaves instead of appending — the
    // failure scikit-learn hit and reverted, and the one #1324 proved on market-events-data.ts.
    expect(attr("docs/research/events/nvda-2026-08-26-print.md")).toContain("merge: unspecified");
  });
});
