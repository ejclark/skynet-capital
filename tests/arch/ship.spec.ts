import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Ship contract gate — the eval Eric asked for after three PRs shipped with a literal "{}"
// description (docs/LESSONS.md 2026-08-15): a PR is a document, and ship.sh must refuse to open
// one without a real body. The refusal fires before verify/push, so exercising it here has no
// side effects. If someone re-introduces a silent body default, this goes red the same day.
const run = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    execFileSync("bash", ["scripts/ship.sh", ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, GH_TOKEN: "test-token-never-used", ...env },
    });
    return { code: 0, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer };
    return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
  }
};

describe("ship open — the PR-description contract", () => {
  it("refuses to open a PR with no --body-file", () => {
    const { code, stderr } = run(["open", "test: no body"]);
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });

  it("refuses an EMPTY body file — a blank document is no document", () => {
    const dir = mkdtempSync(join(tmpdir(), "ship-spec-"));
    const empty = join(dir, "empty.md");
    writeFileSync(empty, "");
    const { code, stderr } = run(["open", "test: empty body", "--body-file", empty]);
    rmSync(dir, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });
});
