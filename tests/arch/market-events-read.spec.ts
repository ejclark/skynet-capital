import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// The shared calendar read (scripts/market-events-read.mjs) behind event-scan and
// event-material-scan. It has no CLI of its own, so the spec runs the real module in a child
// process over a seeded directory and reads what it prints — honest degradation: a missing input
// is a named state, never a quiet branch.
const MODULE = resolve("scripts/market-events-read.mjs");

const entry = (id: string) => ({
  id,
  kind: "macro-print",
  title: id,
  date: "2026-09-20",
  status: "confirmed",
  source: "BLS: fixture",
  impact: "low",
  symbols: [],
});

const readDir = (seed: (dir: string) => void) => {
  const dir = mkdtempSync(join(tmpdir(), "market-events-read-"));
  try {
    seed(dir);
    const script = `import { readCalendarDir } from ${JSON.stringify(MODULE)};
const r = readCalendarDir(${JSON.stringify(join(dir, "events"))});
console.log(JSON.stringify(r.events.map((e) => e.id)));`;
    return spawnSync("node", ["--input-type=module", "-e", script], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("market-events-read — missing inputs are named", () => {
  it("reads canonical files alone and prints a note when there is no proposals/ dir", () => {
    const res = readDir((dir) => {
      mkdirSync(join(dir, "events"));
      writeFileSync(join(dir, "events", "alpha.json"), JSON.stringify(entry("alpha")));
    });
    expect(res.status).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual(["alpha"]);
    expect(res.stderr).toMatch(/^· no proposals\/ dir at .*proposals — canonical files only$/m);
  });

  it("prints no note when proposals/ exists", () => {
    const res = readDir((dir) => {
      mkdirSync(join(dir, "events", "proposals"), { recursive: true });
      writeFileSync(join(dir, "events", "alpha.json"), JSON.stringify(entry("alpha")));
    });
    expect(res.status).toBe(0);
    expect(res.stderr).toBe("");
  });

  it("refuses a missing calendar dir rather than returning an empty calendar", () => {
    const res = readDir(() => {
      // seed nothing: no events/ dir at all
    });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain("refusing to guess");
  });
});
