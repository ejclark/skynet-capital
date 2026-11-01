import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// #6470. The audit grades a check by breaking it on purpose: each bug in a list is applied to a
// temporary copy of the files and the spec is run there. Driven end to end through the real CLI
// against a toy check, so the wiring (copy, apply, run, count, exit) is what is pinned, not a pure
// function. One bug is caught, one survives, one no longer matches the file.
const SCRIPT = resolve("scripts/fitness-audit.mjs");
const FIXTURE = "tests/fixtures/fitness-audit";
const TARGET = [`--script`, `${FIXTURE}/toy.mjs`, `--spec`, `${FIXTURE}/toy.check.ts`];

function audit(args: string[], cwd = process.cwd()) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
  });
  return { status: res.status, out: res.stdout, err: res.stderr };
}

describe("fitness audit", () => {
  const before = readFileSync(resolve(FIXTURE, "toy.mjs"), "utf8");
  const run = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--json"]);
  const report = JSON.parse(run.out);
  const byId = Object.fromEntries(report.bugs.map((b: { id: string }) => [b.id, b]));

  it("reports every bug as caught, survived or not applied", () => {
    expect(byId["count-needs-two"].result).toBe("caught");
    expect(byId["age-boundary-off"].result).toBe("survived");
    expect(byId["stale-find"].result).toBe("not-applied");
  });

  it("keeps a bug that did not apply in the denominator and fails loudly", () => {
    expect(report.total).toBe(3);
    expect(report.caught).toBe(1);
    expect(report.survived).toBe(1);
    expect(report.notApplied).toBe(1);
    expect(run.status).toBe(1);
    expect(run.err).toContain("NOT APPLIED");
    expect(run.err).toContain("stale-find");
  });

  it("never edits the files in the worktree", () => {
    expect(readFileSync(resolve(FIXTURE, "toy.mjs"), "utf8")).toBe(before);
  });

  it("names the contract with the most survivors as the candidate", () => {
    expect(report.candidate.contract).toBe("fresh-stamp");
    expect(report.candidate.survivors).toBe(1);
    const only = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--candidate"]);
    expect(JSON.parse(only.out).contract).toBe("fresh-stamp");
  });

  it("exits 0 when every bug applied, even with a survivor", () => {
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-bugs-"));
    const applied = JSON.parse(readFileSync(resolve(FIXTURE, "bugs.json"), "utf8")).slice(0, 2);
    const file = join(dir, "bugs.json");
    writeFileSync(file, JSON.stringify(applied));
    const res = audit([...TARGET, "--bugs", file]);
    expect(res.status).toBe(0);
    expect(res.out).toContain("caught 1");
    expect(res.out).toContain("survived 1");
  });
});

describe("fitness audit refusals", () => {
  it("refuses to grade a spec that is already red", () => {
    // A copy of the toy with its spec broken: a red baseline would count every bug as caught.
    const root = mkdtempSync(join(tmpdir(), "fitness-audit-red-"));
    mkdirSync(join(root, FIXTURE), { recursive: true });
    for (const name of ["toy.mjs", "toy.check.ts", "bugs.json"]) {
      writeFileSync(join(root, FIXTURE, name), readFileSync(resolve(FIXTURE, name)));
    }
    const spec = join(root, FIXTURE, "toy.check.ts");
    writeFileSync(spec, readFileSync(spec, "utf8").replace('toBe("pass")', 'toBe("fail")'));
    const res = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--root", root]);
    expect(res.status).toBe(2);
    expect(res.err).toContain("baseline");
  });

  it("refuses a bug list missing a field, naming the bug", () => {
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-bad-"));
    const file = join(dir, "bugs.json");
    writeFileSync(file, JSON.stringify([{ id: "no-find", file: `${FIXTURE}/toy.mjs` }]));
    const res = audit([...TARGET, "--bugs", file]);
    expect(res.status).toBe(2);
    expect(res.err).toContain("no-find");
  });
});
