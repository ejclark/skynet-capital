import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lintWorkflow } from "../../scripts/workflow-lint.mjs";

// The workflow structure gate. Provenance: on 2026-08-22 an edit left `build-feedback:` defined
// twice in moneypenny-events.yml (formerly postmaster.yml). Loose YAML loaders keep the last duplicate silently — the local check
// passed — while GitHub rejects the file outright, producing a run with ZERO jobs and a red `main`
// with the postmaster (feedback lane, event research, stall audit) dead until a human noticed.
//
// A workflow file is the one kind of source in this repo that CI cannot test by running it, so its
// structure is checked here instead. Three rules, each one an actual state that file was in.
const run = (dir: string): { code: number; stderr: string } => {
  try {
    execFileSync("node", [join(process.cwd(), "scripts/workflow-lint.mjs"), dir], {
      stdio: "pipe",
    });
    return { code: 0, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer };
    return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
  }
};

const withWorkflow = (yaml: string): { code: number; stderr: string } => {
  const dir = mkdtempSync(join(tmpdir(), "wf-lint-"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "sample.yml"), yaml);
  const result = run(dir);
  rmSync(dir, { recursive: true, force: true });
  return result;
};

const SOUND = `name: Sample
on:
  push:
    branches: [main]
jobs:
  route:
    runs-on: ubuntu-latest
    outputs:
      thing: \${{ steps.pick.outputs.thing }}
    steps:
      - uses: actions/checkout@v7
      - id: pick
        run: |
          echo "thing: a duplicate-looking line"
          echo "thing: another one"
          echo "thing=x" >> "$GITHUB_OUTPUT"
  build:
    needs: route
    runs-on: ubuntu-latest
    steps:
      - run: echo \${{ needs.route.outputs.thing }}
`;

describe("workflow structure gate", () => {
  it("passes this repo's real workflows", () => {
    const { code, stderr } = run(".github/workflows");

    expect(stderr).toBe("");
    expect(code).toBe(0);
  });

  it("passes a sound file, including repeated keys inside a shell block scalar", () => {
    // `run: |` holds arbitrary text; lines in it are not structure and must never be flagged.
    expect(withWorkflow(SOUND).code).toBe(0);
  });

  it("fails a duplicated job key — the 2026-08-22 outage, exactly", () => {
    const { code, stderr } = withWorkflow(
      `${SOUND}  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo again\n`,
    );

    expect(code).toBe(1);
    expect(stderr).toContain("duplicate key `build`");
  });

  it("fails a step output reference whose step was deleted", () => {
    const { code, stderr } = withWorkflow(
      SOUND.replace("steps.pick.outputs.thing", "steps.tier.outputs.model"),
    );

    expect(code).toBe(1);
    expect(stderr).toContain("declares no step `tier`");
  });

  it("fails a workflow_run trigger with no workflows list — the 2026-08-22 repeat", () => {
    const { code, stderr } = withWorkflow(
      "name: X\non:\n  workflow_run:\n    types: [completed]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n",
    );

    expect(code).toBe(1);
    expect(stderr).toContain("no `workflows:` list");
  });

  it("passes a workflow_run trigger that names its workflows", () => {
    const { code } = withWorkflow(
      'name: X\non:\n  workflow_run:\n    workflows: ["Pipeline"]\n    types: [completed]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n',
    );

    expect(code).toBe(0);
  });

  it("fails a needs: naming a job that does not exist", () => {
    const { code, stderr } = withWorkflow(SOUND.replace("needs: route", "needs: routte"));

    expect(code).toBe(1);
    expect(stderr).toContain("needs `routte`");
  });
});

// Rule 6, added 2026-08-29 (#894, following #889/#890 — a same-day, three-PR pipeline patch chain).
// `arm-auto-merge` ran `node scripts/envelope-scan.mjs`, which imports the `typescript`
// devDependency transitively, with no `npm ci` step ahead of it in the job — the script crashed
// before printing anything, and the JSON parse downstream failed the job outright instead of
// correctly reporting "this diff is protected, skip." This is the class of bug workflow-lint exists
// to catch mechanically, since a workflow file cannot be run to find out before it merges.
describe("workflow lint — missing dependency install before a repo script", () => {
  const MISSING_INSTALL = `name: Sample
on:
  push:
    branches: [main]
jobs:
  arm-auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: node scripts/needs-deps.mjs
`;

  const WITH_INSTALL = MISSING_INSTALL.replace(
    "      - run: node scripts/needs-deps.mjs\n",
    "      - run: npm ci\n      - run: node scripts/needs-deps.mjs\n",
  );

  const NO_DEPS_SCRIPT = MISSING_INSTALL.replace("scripts/needs-deps.mjs", "scripts/no-deps.mjs");

  it("fails a job that runs a deps-needing script with no earlier npm ci — the #890 shape", () => {
    const problems = lintWorkflow("sample.yml", MISSING_INSTALL, [], () => true);

    expect(problems.some((p) => p.includes("node_modules") && p.includes("see #890"))).toBe(true);
  });

  it("passes once npm ci runs earlier in the same job", () => {
    expect(lintWorkflow("sample.yml", WITH_INSTALL, [], () => true)).toEqual([]);
  });

  it("passes a script whose import graph needs nothing installed", () => {
    expect(lintWorkflow("sample.yml", NO_DEPS_SCRIPT, [], () => false)).toEqual([]);
  });

  it("holds for the real workflows in this repo (real script import graphs)", () => {
    expect(() =>
      execFileSync("node", ["scripts/workflow-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});

// Rule 5, added 2026-08-22 with the prompt shims. The AI lanes now read their instructions from
// `.github/prompts/*.md` rather than inline YAML — which keeps the envelope tunable without a
// carve-out merge, but makes a wrong path silent: the workflow parses, the run starts, and a live
// session works with no orders. Cheap to check, so it is checked.
describe("workflow lint — prompt shims", () => {
  const withPrompts = (yaml: string, prompts: string[]): { code: number; stderr: string } => {
    const dir = mkdtempSync(join(tmpdir(), "wf-prompts-"));
    const workflows = join(dir, "workflows");
    mkdirSync(join(dir, "prompts"), { recursive: true });
    mkdirSync(workflows, { recursive: true });
    writeFileSync(join(workflows, "sample.yml"), yaml);
    for (const p of prompts) writeFileSync(join(dir, "prompts", p), "# stub\n");
    const result = run(workflows);
    rmSync(dir, { recursive: true, force: true });
    return result;
  };

  const SHIM = `name: Sample
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Read \`.github/prompts/feedback-build.md\` in this repo and follow it exactly.
`;

  it("flags a shim pointing at a prompt file that does not exist", () => {
    const { code, stderr } = withPrompts(SHIM, ["other.md"]);

    expect(code).toBe(1);
    expect(stderr).toContain("feedback-build.md");
    expect(stderr).toContain("no instructions");
  });

  it("passes a shim whose prompt file exists", () => {
    expect(withPrompts(SHIM, ["feedback-build.md"]).code).toBe(0);
  });

  it("holds for the real workflows in this repo", () => {
    expect(() =>
      execFileSync("node", ["scripts/workflow-lint.mjs"], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});
