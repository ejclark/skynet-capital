import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The workflow structure gate. Provenance: on 2026-08-22 an edit left `build-feedback:` defined
// twice in postmaster.yml. Loose YAML loaders keep the last duplicate silently — the local check
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

  it("fails a needs: naming a job that does not exist", () => {
    const { code, stderr } = withWorkflow(SOUND.replace("needs: route", "needs: routte"));

    expect(code).toBe(1);
    expect(stderr).toContain("needs `routte`");
  });
});
