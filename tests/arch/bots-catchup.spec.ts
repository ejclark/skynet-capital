import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";

// THE CLOCK'S ORDER (2026-11-01, #6470's study). bots-catchup.yml is the one schedule in the repo,
// and since #6476 it carries the fitness contracts — the only step that can tell the owner a
// machine stopped. It ran second, behind the start step, so a start that exhausted its budget
// (exit 3) skipped every contract exactly when a corrector had failed, and `continue-on-error`
// turned a crashed reporter into a green step. The workflow cannot be run by CI, so its shape is
// pinned by reading the YAML, as tests/arch/workflows.spec.ts does.
const WORKFLOW = ".github/workflows/bots-catchup.yml";
const ACTION = ".github/actions/app-token/action.yml";

type Step = { name: string; text: string };

/** The job's steps, split at the `- ` that opens each one, named by `name:`, `id:` or `uses:`. */
function stepsOf(text: string): Step[] {
  const at = text.indexOf("\n    steps:\n");
  expect(at, `${WORKFLOW} must carry a steps: list`).toBeGreaterThan(-1);
  return text
    .slice(at + "\n    steps:\n".length)
    .split(/\n(?= {6}- )/)
    .map((chunk) => ({
      name:
        /^\s*(?:- )?name: (.+)$/m.exec(chunk)?.[1]?.trim() ??
        /^\s*(?:- )?id: (.+)$/m.exec(chunk)?.[1]?.trim() ??
        /^\s*(?:- )?uses: (\S+)/m.exec(chunk)?.[1]?.trim() ??
        chunk.trim().slice(0, 40),
      text: chunk,
    }));
}

const NOT_CANCELLED = "if: ${{ !cancelled()";

describe("bots-catchup — a failed start still reports, and nothing hides a failed contract", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const steps = stepsOf(text);
  const named = (name: string): Step => {
    const step = steps.find((s) => s.name === name);
    expect(step, `${WORKFLOW} must still carry the step "${name}"`).toBeTruthy();
    return step as Step;
  };
  const index = (name: string) => steps.findIndex((s) => s.name === name);

  it("runs the fitness contracts last, on !cancelled(), with no continue-on-error", () => {
    const fitness = named("Check what must stay true");
    expect(fitness.text).toContain("node scripts/fitness.mjs --report");
    expect(fitness.text).toContain(NOT_CANCELLED);
    expect(fitness.text).not.toMatch(/^\s+continue-on-error:/m);
    expect(index("Check what must stay true")).toBe(steps.length - 1);
  });

  it("keeps the stranded check and the lever on !cancelled(), so a failed start cannot block a catch-up deploy", () => {
    expect(named("Is a bot-relevant commit stranded?").text).toContain(NOT_CANCELLED);
    const lever = named("Pull the recovery lever");
    expect(lever.text).toContain(NOT_CANCELLED);
    expect(lever.text).toContain("steps.check.outputs.dispatch == 'true'");
    expect(index("Start the machine if it is stopped")).toBeLessThan(
      index("Is a bot-relevant commit stranded?"),
    );
  });

  it("sets up Node from .nvmrc before any node runs", () => {
    const setup = steps.findIndex(
      (s) => s.text.includes("actions/setup-node@") && s.text.includes("node-version-file: .nvmrc"),
    );
    expect(setup).toBeGreaterThan(-1);
    const firstNode = steps.findIndex((s) => /\bnode scripts\//.test(s.text));
    expect(firstNode).toBeGreaterThan(setup);
  });

  it("times the job out from real run durations: under the 15-minute tick, well over the 29s max", () => {
    const minutes = Number(/^\s+timeout-minutes: (\d+)/m.exec(text)?.[1]);
    expect(minutes).toBeGreaterThanOrEqual(5);
    expect(minutes).toBeLessThan(15);
  });

  it("runs the report-only pace tick, which may fail without costing the contracts their run", () => {
    const pace = named("Where the week stands (report only)");
    expect(pace.text).toContain("node scripts/moneypenny/quota.mjs --tick");
    expect(pace.text).toContain("continue-on-error: true");
    expect(pace.text).not.toContain("--publish");
  });
});

describe("bots-catchup — the App token is scoped and cannot skip the start step", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const steps = stepsOf(text);
  const mint = steps.find((s) => s.text.includes("uses: ./.github/actions/app-token"));

  it("mints with continue-on-error, scoped to issues and actions writes, and nothing else", () => {
    expect(mint).toBeTruthy();
    expect(mint?.text).toContain("continue-on-error: true");
    expect(mint?.text).toContain("permission-issues: write");
    expect(mint?.text).toContain("permission-actions: write");
    expect(mint?.text).not.toContain("permission-contents");
    expect(mint?.text).not.toContain("permission-pull-requests");
  });

  it("hands the token to the fitness step and the lever, with GITHUB_TOKEN as the fallback", () => {
    const fallback = "${{ steps.app-token.outputs.token || github.token }}";
    const fitness = steps.find((s) => s.name === "Check what must stay true");
    const lever = steps.find((s) => s.name === "Pull the recovery lever");
    expect(fitness?.text).toContain(`GH_TOKEN: ${fallback}`);
    expect(lever?.text).toContain(`GH_TOKEN: ${fallback}`);
  });

  it("never gates the start step on the mint", () => {
    const start = steps.find((s) => s.name === "Start the machine if it is stopped");
    expect(start?.text).not.toContain("app-token");
    expect(start?.text).not.toMatch(/^\s+if:/m);
  });
});

describe("the app-token action pins its action by SHA and passes permission scopes through", () => {
  const action = readFileSync(ACTION, "utf8");

  it("pins actions/create-github-app-token by a 40-hex SHA — it receives the private key", () => {
    const uses = /uses: actions\/create-github-app-token@(\S+)/.exec(action)?.[1];
    expect(uses).toMatch(/^[0-9a-f]{40}$/);
  });

  it("declares optional permission-* inputs and forwards each to the action", () => {
    for (const scope of ["actions", "contents", "issues", "pull-requests"]) {
      expect(action).toMatch(new RegExp(`^  permission-${scope}:\\n`, "m"));
      expect(action).toContain(`permission-${scope}: \${{ inputs.permission-${scope} }}`);
    }
  });
});
