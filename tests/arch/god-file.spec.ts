import { execFileSync } from "node:child_process";

// God-file gate: no source file exceeds the flat 300-line cap unless it's named in
// arch-grandfather.json with a one-line reason, and no file is named for what it isn't
// (utils.ts/helpers.ts/common.ts/misc.ts). Enforced directly by scripts/arch-scan.mjs, not
// delegated to Biome — Biome's own noExcessiveLinesPerFile silently misses files dominated by a
// large template literal (this app's own login page and several dashboard views are exactly
// that; confirmed empirically 2026-08-26), so it's a useful secondary IDE signal but not the
// sole gate. To adjust: decompose the file, or add it to arch-grandfather.json in the same PR —
// a deliberate, reviewed act, never silent drift.
describe("architecture — god-file gate", () => {
  it("no source file exceeds the cap without a documented, grandfathered reason", () => {
    expect(() =>
      execFileSync("node", ["scripts/arch-scan.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
