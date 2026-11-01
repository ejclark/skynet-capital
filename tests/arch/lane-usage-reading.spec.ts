import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";

// THE LANES PUBLISH THE USAGE READING (2026-11-01, #6470's study). After each of the three
// claude-code-action steps — research, feedback, plan — one step reads the session's own
// `rate_limit_event` out of claude-execution-output.json and writes the weekly percent into
// #4153's body under the marker scripts/moneypenny/pace-reading.mjs reads. Pinned by reading the
// YAML, as tests/arch/workflows.spec.ts does: GITHUB_TOKEN (the App token may have expired after
// a long build, and a body edit fires no workflow), continue-on-error (a report never fails a
// lane), and the step sits after the action step it reports on.
const WORKFLOW = ".github/workflows/moneypenny-events.yml";
const STEP = "Publish the session's usage reading (report only)";
const events = readFileSync(WORKFLOW, "utf8");

/** One job's text, from its key to the next job key at the same indent. */
function jobBody(name: string): string {
  const start = events.indexOf(`\n  ${name}:\n`);
  expect(start, `${WORKFLOW} must carry the ${name} job`).toBeGreaterThan(-1);
  const rest = events.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][a-z-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("each lane publishes its usage reading after its session, as a report that cannot fail it", () => {
  for (const job of ["build-events", "build-feedback", "build-plan"]) {
    it(`${job}: the step follows the claude-code-action step and runs on GITHUB_TOKEN, continue-on-error`, () => {
      const body = jobBody(job);
      const action = body.indexOf("uses: anthropics/claude-code-action@");
      const step = body.indexOf(`name: ${STEP}`);
      expect(action).toBeGreaterThan(-1);
      expect(step).toBeGreaterThan(action);
      const text = body.slice(step, body.indexOf("\n      - ", step + 1));
      expect(text).toContain("continue-on-error: true");
      expect(text).toContain("GH_TOKEN: ${{ github.token }}");
      expect(text).toContain(
        "node scripts/moneypenny/quota.mjs --publish-from /home/runner/work/_temp/claude-execution-output.json",
      );
      expect(text).toContain(`--source "lane:${job}"`);
      expect(text).not.toContain("steps.app-token");
    });
  }

  it("says in the file that a lane at plain allowed status is unverified until the first run", () => {
    expect(events).toMatch(/plain `allowed` status[^\n]*\n[^\n]*(unverified|settled by|first run)/);
  });
});
