import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Workflow-shape gate. Two failures this repo has actually shipped, both invisible to every other
// check because a workflow file is not code any spec was reading:
//
//   1. DUPLICATE JOB KEY (main, 2026-08-22). #476 deleted a broken `tier` step, but the diff landed
//      as a SECOND `build-feedback:` block rather than an edit of the first. YAML takes the last
//      key, so the surviving job still carried the `set -euo pipefail` bash the PR existed to
//      remove — the fix read as merged and was not in effect. A duplicate key is never intentional.
//   2. A PROMPT SHIM POINTING AT NOTHING. The lanes read their instructions from
//      `.github/prompts/*.md`; a wrong path means a session runs with no orders, and the first
//      symptom is a live firing. The filename is checkable here for free.
const DIR = ".github/workflows";
const files = readdirSync(DIR).filter((f) => f.endsWith(".yml"));

/** Job keys are the 2-space-indented mapping keys under a top-level `jobs:`. No YAML dep needed —
 *  and adding one would trip the envelope gate's new-runtime-dependency rule anyway. */
function jobKeys(source: string): string[] {
  const lines = source.split("\n");
  const start = lines.indexOf("jobs:");
  if (start === -1) return [];
  const keys: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line) && line.trim()) break; // next top-level key ends the jobs block
    const match = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (match?.[1]) keys.push(match[1]);
  }
  return keys;
}

describe("workflow shape", () => {
  it("finds the workflow files it is meant to be guarding", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(jobKeys(readFileSync(join(DIR, "pipeline.yml"), "utf8"))).toContain("verify");
  });

  it("declares every job exactly once — a duplicate key silently shadows the first", () => {
    for (const file of files) {
      const keys = jobKeys(readFileSync(join(DIR, file), "utf8"));
      const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
      expect(dupes, `${file} declares ${dupes.join(", ")} more than once`).toEqual([]);
    }
  });

  it("points every prompt shim at a file that exists", () => {
    const referenced: string[] = [];
    for (const file of files) {
      const source = readFileSync(join(DIR, file), "utf8");
      for (const m of source.matchAll(/\.github\/prompts\/([a-z0-9-]+\.md)/g)) {
        if (m[1]) referenced.push(m[1]);
      }
    }
    expect(referenced.length).toBeGreaterThan(0);
    const present = new Set(readdirSync(".github/prompts"));
    for (const name of referenced) {
      expect(present.has(name), `.github/prompts/${name} is referenced but missing`).toBe(true);
    }
  });
});
