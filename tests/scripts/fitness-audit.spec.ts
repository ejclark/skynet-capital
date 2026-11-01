import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { applyBug, attribute, bugDeadlineMs, validateBugs } from "../../scripts/fitness-audit.mjs";

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

/** The --json report, or the script's own stderr when it crashed instead of reporting. */
function parseReport(run: ReturnType<typeof audit>) {
  try {
    return JSON.parse(run.out);
  } catch {
    throw new Error(`fitness-audit gave no report (exit ${run.status}): ${run.err}`);
  }
}

describe("fitness audit", () => {
  const before = readFileSync(resolve(FIXTURE, "toy.mjs"), "utf8");
  const run = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--json"]);
  const report = parseReport(run);
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

  it("refuses a flag with no value as a usage error", () => {
    const res = audit([...TARGET, "--bugs"]);
    expect(res.status).toBe(2);
    expect(res.err).toContain("--bugs needs a value");
  });

  it("applies a replacement with a `$` in it as written", () => {
    // String.replace would read `$'` as "the rest of the file"; the audit must not.
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-dollar-"));
    const file = join(dir, "bugs.json");
    const bug = {
      id: "dollar-literal",
      file: `${FIXTURE}/toy.mjs`,
      find: "const FRESH_MS = 300;",
      replace: "const FRESH_MS = 300; const TAIL = `$'`;",
      why: "an unused literal with a dollar sign changes nothing, so the spec stays green",
    };
    writeFileSync(file, JSON.stringify([bug]));
    const res = audit([...TARGET, "--bugs", file, "--json"]);
    expect(parseReport(res).bugs[0].result).toBe("survived");
  });

  it("refuses a bug list missing a field, naming the bug", () => {
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-bad-"));
    const file = join(dir, "bugs.json");
    writeFileSync(file, JSON.stringify([{ id: "no-find", file: `${FIXTURE}/toy.mjs` }]));
    const res = audit([...TARGET, "--bugs", file]);
    expect(res.status).toBe(2);
    expect(res.err).toContain("no-find");
  });

  it("still refuses an empty find and a replace that is not text", () => {
    expect(() => validateBugs([{ ...DELETE_A_LINE, find: "" }])).toThrow('"find"');
    const { replace: _, ...noReplace } = DELETE_A_LINE;
    expect(() => validateBugs([noReplace])).toThrow('"replace"');
  });
});

// A bug's most natural shape is deleting a guard, and an empty replace was refused, so it had to be
// written as a comment or a no-op that a reader then has to see through.
const DELETE_A_LINE = {
  id: "delete-the-guard",
  file: `${FIXTURE}/toy.mjs`,
  find: 'return machines.length > 0 ? "pass" : "fail";',
  replace: "",
  why: "with the line gone the judge says nothing, and the spec expects a verdict",
};

describe("fitness audit: a bug that deletes a line", () => {
  it("accepts an empty replace and grades it end to end", () => {
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-delete-"));
    const file = join(dir, "bugs.json");
    writeFileSync(file, JSON.stringify([DELETE_A_LINE]));
    const res = audit([...TARGET, "--bugs", file, "--json"]);
    expect(parseReport(res).bugs[0].result).toBe("caught");
  });

  it("counts a bug that empties the whole file as applied, not as a find that went stale", () => {
    expect(applyBug({ ...DELETE_A_LINE, find: "all of it" }, "all of it")).toEqual({
      source: "",
      note: "",
    });
  });
});

describe("fitness audit: which contract a bug attacks", () => {
  const SOURCE = `const judge = 1;
export const CONTRACTS = [
  {
    id: "first",
    probe: () => "inside first",
  },
  {
    id: "last",
    probe: () => "inside last",
  },
];
const below = 2;
`;
  const bug = (find: string) => ({ find });

  it("takes the bug's own field first", () => {
    expect(attribute({ contract: "first", find: "const below" }, SOURCE)).toBe("first");
  });

  it("gives a bug inside a contract to that contract", () => {
    expect(attribute(bug("inside first"), SOURCE)).toBe("first");
    expect(attribute(bug("inside last"), SOURCE)).toBe("last");
  });

  it("calls anything outside the array shared, above it or below it", () => {
    expect(attribute(bug("const judge"), SOURCE)).toBe("shared");
    expect(attribute(bug("const below"), SOURCE)).toBe("shared");
  });

  it("keeps --candidate on the contracts: a survivor below the array skews no contract's reading", () => {
    // The real shape: a check's reporting lives below its contracts, and every survivor there used
    // to read as the last contract's, so the candidate named a contract nobody had attacked.
    const root = mkdtempSync(join(tmpdir(), "fitness-audit-below-"));
    mkdirSync(join(root, FIXTURE), { recursive: true });
    for (const name of ["toy.mjs", "toy.check.ts"]) {
      writeFileSync(join(root, FIXTURE, name), readFileSync(resolve(FIXTURE, name)));
    }
    const toy = join(root, FIXTURE, "toy.mjs");
    writeFileSync(toy, `${readFileSync(toy, "utf8")}export const BELOW = "unread";\n`);
    writeFileSync(
      join(root, "bugs.json"),
      JSON.stringify([
        {
          id: "below-the-array",
          file: `${FIXTURE}/toy.mjs`,
          find: 'BELOW = "unread"',
          replace: 'BELOW = "changed"',
          why: "nothing reads it, so it survives, and it attacks no contract",
        },
      ]),
    );
    const res = audit([...TARGET, "--bugs", "bugs.json", "--root", root, "--json"]);
    const report = parseReport(res);
    expect(report.bugs[0]).toMatchObject({ contract: "shared", result: "survived" });
    expect(report.candidate).toMatchObject({ survivors: 0 });
  });
});

describe("fitness audit: a slow machine is not a caught bug", () => {
  const root = () => {
    const dir = mkdtempSync(join(tmpdir(), "fitness-audit-slow-"));
    mkdirSync(join(dir, FIXTURE), { recursive: true });
    for (const name of ["toy.mjs", "toy.check.ts", "bugs.json"]) {
      writeFileSync(join(dir, FIXTURE, name), readFileSync(resolve(FIXTURE, name)));
    }
    return dir;
  };

  it("says the baseline ran out of time, rather than printing nothing", () => {
    const res = audit([
      ...TARGET,
      "--bugs",
      `${FIXTURE}/bugs.json`,
      "--root",
      root(),
      "--timeout",
      "0.001",
    ]);
    expect(res.status).toBe(2);
    expect(res.err).toContain("baseline ran out of time");
    expect(res.err).not.toContain("undefined");
    expect(res.err).toContain("--timeout");
  });

  it("gives a bug at least three times what the green baseline took", () => {
    // Under load a mutant that runs a little long used to read as caught, the one wrong answer the
    // score cannot afford. The floor is the baseline's own time, so it moves with the machine.
    expect(bugDeadlineMs(10_000)).toBe(120_000);
    expect(bugDeadlineMs(150_000)).toBe(450_000);
  });

  it("refuses a timeout that is not a positive number", () => {
    for (const bad of ["soon", "0", "-5"]) {
      const res = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--timeout", bad]);
      expect(res.status).toBe(2);
      expect(res.err).toContain("--timeout needs a positive number");
    }
  });

  it("names the test that caught a bug, so a caught row can be checked", () => {
    const run = audit([...TARGET, "--bugs", `${FIXTURE}/bugs.json`, "--json"]);
    const caught = parseReport(run).bugs.find((b: { id: string }) => b.id === "count-needs-two");
    expect(caught.caughtBy).toContain("passes one machine and fails none");
  });
});
