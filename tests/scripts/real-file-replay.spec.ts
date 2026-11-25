// Real-file replay (#8344): a parser or key rule is replayed over the committed files it reads,
// not only over the input shapes its author pictured. Both defects this guards were already sitting
// in files on main when they merged: the hand-made specs beside them could not see a shape nobody
// typed in. Neither assertion below lists a shape, so a new one landing in the repo turns this red.
//   1. #8244 (scripts/profile-scan.mjs): two `#N · <question>` ledger rows on one day shared a cite,
//      so one profile line cleared two misses.
//   2. #8241 (scripts/dream-digest.mjs): `- #N` bullets and ` - #N` separators read as another
//      repo's issue, so a bare #N went unlisted.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { memoryClaims } from "../../scripts/dream-digest.mjs";
import { FILES, ledgerRows } from "../../scripts/profile-scan.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

type Row = { date: string; cite: string };

describe("real-file replay: profile-scan keys every committed ledger row apart", () => {
  it("gives no two rows on one day the same cite, so each miss owes its own profile line", () => {
    const rows: Row[] = ledgerRows(readFileSync(FILES.ledger, "utf8"));
    expect(rows.length).toBeGreaterThan(0);
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.cite, (seen.get(r.cite) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1).map(([cite]) => cite)).toEqual([]);
  });
});

/** A list bullet led by an issue number (`- #5850`, `* #5160`), and a dash separator (` - #N`). */
const BULLET = /^\s*[-*]\s+#(\d{3,5})\b/;
const SEPARATOR = / - #(\d{3,5})\b/g;

const trackedDocs = () =>
  execFileSync("git", ["ls-files", "-z", "--", "docs/*.md"], {
    encoding: "utf8",
    env: hermeticGitEnv(),
  })
    .split("\0")
    .filter(Boolean);

describe("real-file replay: dream-digest lists every bare #N the committed docs carry", () => {
  it("keeps each `- #N` bullet and ` - #N` separator in docs/ as this repo's issue", () => {
    const files = trackedDocs();
    expect(files.length).toBeGreaterThan(0);
    const missed: string[] = [];
    let checked = 0;
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // An indented bullet (`  - #N`) matches both shapes; count the number once.
          const wanted = [
            ...new Set(
              [line.match(BULLET)?.[1], ...[...line.matchAll(SEPARATOR)].map((m) => m[1])]
                .filter((n): n is string => Boolean(n))
                .map(Number),
            ),
          ];
          if (!wanted.length) return;
          checked++;
          const { issues } = memoryClaims(line) as { issues: number[] };
          for (const n of wanted) if (!issues.includes(n)) missed.push(`${file}:${i + 1} #${n}`);
        });
    }
    // The shapes are live in the repo today; if none were found the walk itself broke.
    expect(checked).toBeGreaterThan(0);
    expect(missed).toEqual([]);
  });
});
