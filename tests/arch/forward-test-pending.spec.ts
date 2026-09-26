import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Forward-test timing (scripts/forward-test-pending.mjs) — the read behind event-scan's close-out
// hold and forward-test re-dispatch. It has no CLI of its own, so the spec runs the real module in
// a child process over a seeded register. Honest degradation: a missing fragment means "no tests
// registered" (a real state); a missing register is UNKNOWN, never "no tests anywhere".
const MODULE = resolve("scripts/forward-test-pending.mjs");

const FRAGMENT =
  "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n" +
  "| FT-alpha-2026-09-14-1 | h | p | k | 2026-09-18 | _open_ |\n";

const unscored = (seed: (dir: string) => void, eventId: string) => {
  const dir = mkdtempSync(join(tmpdir(), "ft-pending-"));
  try {
    seed(dir);
    const script = `import { unscoredForwardTests } from ${JSON.stringify(MODULE)};
console.log(JSON.stringify(unscoredForwardTests(${JSON.stringify(eventId)}, ${JSON.stringify(join(dir, "forward-tests"))})));`;
    return spawnSync("node", ["--input-type=module", "-e", script], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("forward-test-pending — missing inputs are named", () => {
  const seedRegister = (dir: string) => {
    mkdirSync(join(dir, "forward-tests"));
    writeFileSync(join(dir, "forward-tests", "alpha-2026-09-14.md"), FRAGMENT);
  };

  it("reads an event's unscored rows from its own fragment", () => {
    const res = unscored(seedRegister, "alpha-2026-09-14");
    expect(res.status).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual([
      { id: "FT-alpha-2026-09-14-1", scoreBy: "2026-09-18" },
    ]);
  });

  it("an event with no fragment has no tests registered — empty, not an error", () => {
    const res = unscored(seedRegister, "bravo-2026-09-20");
    expect(res.status).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual([]);
  });

  it("refuses a missing register rather than reading every event as test-free", () => {
    const res = unscored(() => {
      // seed nothing: no forward-tests/ dir at all
    }, "alpha-2026-09-14");
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(
      /forward-test-pending: cannot read .*forward-tests — refusing to guess/,
    );
  });
});
