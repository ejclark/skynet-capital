import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// The governor chore is read by a rep with nothing else in hand, so what it says to run has to work as
// written. A spec that types the numbers in by hand cannot see a rule pointing at the wrong line, or a
// flag the row leaves out. These run the chore's own commands against what the scans really print.
const chore = readFileSync("docs/grind/governor.instructions.md", "utf8");
const ledgerLines = [...chore.matchAll(/`npm run loop:ledger -- (--add [^`]+)`/g)].map((m) =>
  String(m[1]),
);

type Eye = { debt?: number; app?: { debt?: number } };

/** The rule the chore states, as a rep follows it: `debt`, plus `app.debt` where that exists. */
const debtOf = (eye: string, cwd = process.cwd()) => {
  const r = spawnSync("node", [resolve("scripts", eye), "--candidate"], { cwd, encoding: "utf8" });
  expect(r.status).toBe(0);
  const parsed = JSON.parse(r.stdout) as Eye;
  return (parsed.debt as number) + (parsed.app?.debt ?? 0);
};

describe("the governor chore's debt number", () => {
  it("states the one rule this spec follows, for every eye", () => {
    expect(chore.replace(/\s+/g, " ")).toContain(
      "`debt` plus `app.debt` where that exists, from the same `node <eye> --candidate` output",
    );
    expect(chore).not.toMatch(/first\s+line of/);
  });

  // The first line of the plain scan names the cap and the grandfathered files: neither moves when a
  // rep removes an over-cap file. The count that does move is the scan's own `✗ N file(s)`.
  it("is the over-cap count for the architecture scan", () => {
    const plain = spawnSync("node", ["scripts/arch-scan.mjs"], { encoding: "utf8" });
    const count = /✗ (\d+) file\(s\) exceed the code-line cap/.exec(plain.stderr)?.[1];
    expect(debtOf("arch-scan.mjs")).toBe(Number(count ?? 0));
  });

  it("is a number the duplication and spec-gap scans also give", () => {
    expect(debtOf("dupe-scan.mjs")).toBeGreaterThanOrEqual(0);
    expect(debtOf("spec-gap-scan.mjs")).toBeGreaterThanOrEqual(0);
  });

  it("is nothing owed when the budget is met, with no candidate left", () => {
    const dir = mkdtempSync(join(tmpdir(), "governor-empty-"));
    try {
      mkdirSync(join(dir, "src"));
      writeFileSync(join(dir, "src", "small.ts"), "export const a = 1;\n");
      expect(debtOf("arch-scan.mjs", dir)).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the governor chore's ledger rows", () => {
  const overCap = (dir: string, name: string) =>
    writeFileSync(
      join(dir, "src", name),
      Array.from({ length: 301 }, (_, i) => `export const a${i} = ${i};`).join("\n"),
    );

  /** One rep, by the chore: read the number, do the work, read it again, append with its lines. */
  function rep(dir: string, ledger: string, work: () => void) {
    const before = debtOf("arch-scan.mjs", dir);
    work();
    const after = debtOf("arch-scan.mjs", dir);
    const fill = (line: string) =>
      line
        .replace("<drill>", "decompose")
        .replace("<before>", String(before))
        .replace("<after>", String(after))
        .replace("<what>", "one over-cap file split");
    const lines = existsSync(join(ledger, "governor-decompose.jsonl"))
      ? ledgerLines.slice(1)
      : ledgerLines;
    for (const line of lines) {
      const command = `node scripts/loop-ledger.mjs ${fill(line)} --ledger ${ledger}`;
      const r = spawnSync("bash", ["-c", command], { encoding: "utf8" });
      expect(r.stderr).toBe("");
      expect(r.status).toBe(0);
    }
  }

  it("charges each rep only its own change, when other PRs moved the debt between reps", () => {
    const dir = mkdtempSync(join(tmpdir(), "governor-reps-"));
    const ledger = join(dir, "ledger");
    try {
      mkdirSync(join(dir, "src"));
      for (const n of ["a", "b", "c", "d", "e"]) overCap(dir, `${n}.ts`);
      // Three grandfathered files on the list: that number sits beside the debt and never moves.
      for (const n of ["g1", "g2", "g3"]) overCap(dir, `${n}.ts`);
      writeFileSync(
        join(dir, "arch-grandfather.json"),
        JSON.stringify({ "src/g1.ts": "x", "src/g2.ts": "x", "src/g3.ts": "x" }),
      );

      rep(dir, ledger, () => rmSync(join(dir, "src", "a.ts")));
      overCap(dir, "new1.ts"); // other PRs land over-cap files between the cycles
      overCap(dir, "new2.ts");
      rep(dir, ledger, () => rmSync(join(dir, "src", "b.ts")));
      overCap(dir, "new3.ts");
      rep(dir, ledger, () => rmSync(join(dir, "src", "c.ts")));

      const rows = readFileSync(join(ledger, "governor-decompose.jsonl"), "utf8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
      expect(rows.map((r) => [r.before, r.after])).toEqual([
        [5, 5],
        [5, 4],
        [6, 5],
        [6, 5],
      ]);
      const reading = spawnSync("node", ["scripts/loop-ledger.mjs", "--ledger", ledger], {
        encoding: "utf8",
      });
      expect(reading.status).toBe(0);
      expect(reading.stdout).not.toContain("stopped");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// A rep runs in a cloud session, where gh's GraphQL calls come back HTTP 403. The `pr`, `issue`,
// `search`, `repo` and `project` subcommands are GraphQL, as is `gh api graphql`, so one in the
// chore stops every rep at step 1 (governed cycle 7).
describe("the governor chore's GitHub reads", () => {
  it("go through REST, never a GraphQL subcommand", () => {
    expect(chore).not.toMatch(/`gh (pr|issue|search|repo|project)\b|gh api graphql/);
    expect(chore).toContain("`gh api 'repos/{owner}/{repo}/pulls?state=open&per_page=100'");
  });
});
