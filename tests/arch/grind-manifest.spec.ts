import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  argsFor,
  type ChoreManifest,
  isCheckedInChore,
  parseChoreManifest,
  scanChoreFile,
} from "../../scripts/grind-manifest.mjs";

// Grind-manifest gate — every checked-in docs/grind/*.instructions.md chore must declare its own
// compute tier in front matter. `.claude/workflows/grind.js` dispatches at low effort on a cheap
// model by default, and the tier used to live in each chore's prose header for the CALLER to
// transcribe by hand — silent when skipped for effort, destructive when skipped for isolation
// (concurrent items share one checkout). Blocking on purpose: a chore running at the wrong tier is
// a broken contract, not debt to ratchet down.
const SCRIPT = join(process.cwd(), "scripts/grind-manifest.mjs");

const CHORE = `---
name: demo
description: do one demo thing
model: fable
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Demo chore
`;

/** Parse a chore source, asserting it had front matter — keeps each assertion to one idea. */
function manifestOf(source: string, file = "docs/grind/demo.instructions.md"): ChoreManifest {
  const { manifest } = parseChoreManifest(source, file);
  if (!manifest) throw new Error(`expected front matter in ${file}`);
  return manifest;
}

describe("grind-manifest gate (blocking)", () => {
  it("every checked-in chore declares its own effort and isolation", () => {
    execFileSync("node", [SCRIPT], { cwd: process.cwd(), stdio: "pipe" });
  });
});

describe("chore front-matter parsing", () => {
  it("reads every declared key off a well-formed chore", () => {
    const { manifest, problems } = parseChoreManifest(CHORE, "docs/grind/demo.instructions.md");
    expect(problems).toEqual([]);
    expect(manifest).toMatchObject<Partial<ChoreManifest>>({
      name: "demo",
      model: "fable",
      effort: "high",
      isolation: "worktree",
      outcomeCheck: "git ls-remote --exit-code --heads origin {prev.branch}",
    });
  });

  it("keeps a single-quoted command's inner double quotes intact", () => {
    const src = CHORE.replace(
      "outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'",
      `outcomeCheck: 'curl -H "Accept: application/json" url | grep -q marker'`,
    );
    expect(manifestOf(src).outcomeCheck).toBe(
      `curl -H "Accept: application/json" url | grep -q marker`,
    );
  });

  it("flags an effort, model, or isolation value the harness would reject", () => {
    const effort = parseChoreManifest(CHORE.replace("effort: high", "effort: maximum"), "d.md");
    const model = parseChoreManifest(CHORE.replace("model: fable", "model: gpt-4"), "d.md");
    const isolation = parseChoreManifest(
      CHORE.replace("isolation: worktree", "isolation: yes"),
      "d.md",
    );
    expect(effort.problems.some((p: string) => p.includes('effort "maximum"'))).toBe(true);
    expect(model.problems.some((p: string) => p.includes('model "gpt-4"'))).toBe(true);
    expect(isolation.problems.some((p: string) => p.includes('isolation "yes"'))).toBe(true);
  });

  it("flags a misspelled key rather than silently ignoring it", () => {
    const { problems } = parseChoreManifest(CHORE.replace("effort:", "efort:"), "d.md");
    expect(problems.some((p: string) => p.includes('unknown front-matter key "efort"'))).toBe(true);
  });

  it("flags a name that does not match the filename", () => {
    const { problems } = parseChoreManifest(CHORE, "docs/grind/other.instructions.md");
    expect(problems.some((p: string) => p.includes('"demo"') && p.includes("other"))).toBe(true);
  });

  it("flags front matter that is not the first thing in the file", () => {
    const { manifest, problems } = parseChoreManifest(`# Title\n\n${CHORE}`, "d.md");
    expect(manifest).toBeNull();
    expect(problems[0]).toContain("FIRST thing in the file");
  });

  it("returns no manifest and no complaint for a file with no front matter", () => {
    expect(parseChoreManifest("# Just a doc\n", "d.md")).toEqual({ manifest: null, problems: [] });
  });
});

describe("checked-in chores are held to a stricter bar than ad-hoc files", () => {
  it("recognises only docs/grind/*.instructions.md as checked in", () => {
    expect(isCheckedInChore("docs/grind/demo.instructions.md")).toBe(true);
    expect(isCheckedInChore("docs/grind/README.md")).toBe(false);
    expect(isCheckedInChore("tmp/demo.instructions.md")).toBe(false);
  });

  it("asks nothing of a non-chore doc, even one that documents the front-matter format", () => {
    // README.md shows a `---` block inside a fenced yaml example — that must not read as a
    // misplaced header, or the gate fails on the very doc explaining it.
    expect(scanChoreFile("docs/grind/README.md").problems).toEqual([]);
  });

  it("reports an unreadable chore path rather than throwing", () => {
    expect(scanChoreFile("docs/grind/does-not-exist.instructions.md").problems[0]).toContain(
      "cannot be read",
    );
  });
});

describe("--args emission (the preflight a caller pastes)", () => {
  it("fills the tier into the instructions step and appends the outcome check", () => {
    expect(argsFor(manifestOf(CHORE), ["a.ts", "b.ts"])).toEqual({
      items: ["a.ts", "b.ts"],
      steps: [
        {
          kind: "instructions",
          path: "docs/grind/demo.instructions.md",
          effort: "high",
          isolation: true,
          model: "fable",
        },
        { kind: "script", command: "git ls-remote --exit-code --heads origin {prev.branch}" },
      ],
    });
  });

  it("omits model when the chore declares none, and isolation is false for isolation: none", () => {
    const src = CHORE.replace("model: fable\n", "").replace(
      "isolation: worktree",
      "isolation: none",
    );
    const [choreStep] = argsFor(manifestOf(src), ["x"]).steps;
    expect(choreStep?.model).toBeUndefined();
    expect(choreStep?.isolation).toBe(false);
  });

  it("emits no outcome-check step when the chore declares none", () => {
    const src = `${CHORE.split("\noutcomeCheck:")[0]}\n---\n\n# Demo chore\n`;
    expect(argsFor(manifestOf(src), ["x"]).steps).toHaveLength(1);
  });

  it("emits real args for a real chore end to end", () => {
    const out = execFileSync(
      "node",
      [SCRIPT, "--args", "--items", '["1318"]', "docs/grind/research-bottleneck.instructions.md"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const parsed = JSON.parse(out);
    expect(parsed.items).toEqual(["1318"]);
    expect(parsed.steps[0]).toMatchObject({ effort: "high", model: "fable", isolation: false });
    expect(parsed.steps[1].command).toContain("bottleneck-research");
  });
});
