import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// The spec-gap eye's --candidate must never name a file its own drill refuses. The backfill
// skill's trading/risk carve-out is the list the drill stops on; it is read here from the skill
// itself, so a path added there and not to the scan turns this red instead of stalling the coach
// for a cycle (governed cycles 7 and 14 both stalled on src/playbooks/with-unsubscribed-exits.ts).
const skill = readFileSync(".claude/skills/backfill/SKILL.md", "utf8");
const bullet = /\*\*Trading\/risk carve-out[\s\S]*?do NOT/.exec(skill)?.[0] ?? "";
const carveOut = [...bullet.matchAll(/`(src\/[^`]+)`/g)].map((m) => String(m[1]));

type Candidate = {
  candidate: { file: string } | null;
  runnerUp: { file: string } | null;
  debt: number;
  needsHuman: { count: number; files: string[] };
};

/** A file the scan will see: a glob like `src/trading/**` becomes one file inside it. */
const pathFor = (glob: string) => (glob.endsWith("/**") ? `${glob.slice(0, -3)}/big.ts` : glob);

function scan(files: Record<string, number>): Candidate {
  const dir = mkdtempSync(join(tmpdir(), "spec-gap-carve-"));
  try {
    mkdirSync(join(dir, "tests"));
    for (const [file, lines] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      const body = Array.from({ length: lines }, (_, i) => `export const a${i} = ${i};`);
      writeFileSync(join(dir, file), `${body.join("\n")}\n`);
    }
    const r = spawnSync("node", [resolve("scripts/spec-gap-scan.mjs"), "--candidate"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(r.status).toBe(0);
    return JSON.parse(r.stdout) as Candidate;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the spec-gap eye's candidate", () => {
  it("reads the backfill skill's carve-out list", () => {
    expect(carveOut).toContain("src/playbooks/**");
    expect(carveOut.length).toBeGreaterThanOrEqual(5);
  });

  it("skips every carve-out path, however large, for the largest file the drill may spec", () => {
    const files: Record<string, number> = { "src/small.ts": 3, "src/smaller.ts": 2 };
    for (const glob of carveOut) files[pathFor(glob)] = 500;
    const r = scan(files);
    expect(r.candidate?.file).toBe("src/small.ts");
    expect(r.runnerUp?.file).toBe("src/smaller.ts");
    expect(r.needsHuman.files.sort()).toEqual(carveOut.map(pathFor).sort());
  });

  it("still counts carve-out files as debt, since untested is untested", () => {
    const r = scan({ "src/small.ts": 3, "src/playbooks/big.ts": 500 });
    expect(r.debt).toBe(2);
    expect(r.needsHuman.count).toBe(1);
  });

  it("names no candidate when only carve-out files are left", () => {
    const r = scan({ "src/playbooks/big.ts": 500 });
    expect(r.candidate).toBeNull();
    expect(r.needsHuman.files).toEqual(["src/playbooks/big.ts"]);
  });
});
