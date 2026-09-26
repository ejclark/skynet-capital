import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { snippetHexes } from "../../scripts/mermaid-lint.mjs";
import {
  findLanding,
  landedPicture,
  openPicture,
  wrapLabel,
} from "../../scripts/platter-picture.mjs";

// The held PR's two pictures are generated from git (plan #3786 slice 4) so they cannot say a count
// the ledger does not hold, or a merge commit that never landed (#3754). The open-time picture is
// the choice; the after-landing picture is the record in whichever ending is true. Every picture
// must parse under the pinned Mermaid, carry only hexes a checked-in snippet holds (the ink mode,
// copied whole — a generated picture never chooses a hex), and name no house noun (rule 7).
const SCRIPT = join(process.cwd(), "scripts/platter-picture.mjs");
const LINT = join(process.cwd(), "scripts/mermaid-lint.mjs");

/** Run the pinned lint over one diagram, the way ship checkbody does. */
const lint = (source: string) =>
  spawnSync("node", [LINT, "--stdin", "--json"], {
    input: `\n\`\`\`mermaid\n${source}\n\`\`\`\n`,
    encoding: "utf8",
  });

/** A first-parent log in the merge scan's format: one squashed landing, one merge-commit landing. */
const SEP = "\x1e";
const NUL = "\x00";
const ledger = [
  "| # | item | why | verify evidence | revert |",
  "|---|---|---|---|---|",
  "| 1 | `item/a` | update the review action | verify green | `aaaaaaa` |",
  "| 2 | `item/b` | pin the deploy tool | verify green | `bbbbbbb` |",
  "",
  "_Caption — the platter ledger, read from the boarded commits._",
].join("\n");
const LOG =
  `1111111111111111111111111111111111111111${NUL}0000000000000000000000000000000000000000${NUL}chore(platter): protected-path changes — 2026-09-26-x (#3711)${NUL}${ledger}${SEP}` +
  `2222222222222222222222222222222222222222${NUL}0000000000000000000000000000000000000000 3333333333333333333333333333333333333333${NUL}Merge pull request #3712 from ejclark/platter/y${NUL}chore(platter): protected-path changes\n\n${ledger}${SEP}`;

describe("platter picture — the choice at open time", () => {
  it("names the real count and both buttons, parses, wears only snippet hexes, and no house noun", () => {
    const pic = openPicture(3);
    expect(pic).toContain("3 protected");
    expect(pic).toContain("Create a merge commit");
    expect(pic).toContain("Squash and merge");
    const registry = snippetHexes();
    expect(registry).not.toBeNull();
    for (const hex of pic.match(/#[0-9a-f]{6}/gi) ?? []) {
      expect(registry?.has(hex.toUpperCase()), hex).toBe(true);
    }
    expect(pic).not.toMatch(/\bplatter\b/i);
    const r = lint(pic);
    expect(r.status, r.stdout).toBe(0);
  });

  it("refuses a count under one — an empty held PR has no picture", () => {
    expect(() => openPicture(0)).toThrow(/count/);
  });
});

describe("platter picture — the record after landing", () => {
  it("draws the squash ending for a single-parent landing, naming the defect", () => {
    const landing = findLanding(LOG, 3711);
    expect(landing?.flattened).toBe(true);
    const pic = landedPicture(landing as NonNullable<typeof landing>);
    expect(pic).toContain("no item reverts alone");
    expect(pic).toContain("#3754");
    expect(pic).toContain("1 + 2");
    expect(pic).toContain("update the review<br/>action");
    expect(lint(pic).status).toBe(0);
  });

  it("draws the merge ending for a two-parent landing", () => {
    const landing = findLanding(LOG, 3712);
    expect(landing?.flattened).toBe(false);
    const pic = landedPicture(landing as NonNullable<typeof landing>);
    expect(pic).toContain("any item reverts alone");
    expect(pic).toContain("Create a merge commit");
    expect(pic).not.toContain("#3754");
    expect(lint(pic).status).toBe(0);
  });

  it("wraps a long label by hand at word boundaries", () => {
    expect(wrapLabel("update the upload artifact action to seven", 18)).toBe(
      "update the upload<br/>artifact action to<br/>seven",
    );
  });

  it("CLI: exits 3 and says unknown when the PR is not a landing in the log", () => {
    const dir = mkdtempSync(join(tmpdir(), "platter-picture-"));
    try {
      const file = join(dir, "log.txt");
      writeFileSync(file, LOG);
      const r = spawnSync("node", [SCRIPT, "landed", "9999", "--log", file], { encoding: "utf8" });
      expect(r.status).toBe(3);
      expect(r.stderr).toContain("unknown");
      expect(r.stdout).toBe("");
      const ok = execFileSync("node", [SCRIPT, "landed", "3711", "--log", file], {
        encoding: "utf8",
      });
      expect(ok).toContain("Squash and merge");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
