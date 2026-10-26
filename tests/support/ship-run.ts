import { execFileSync } from "node:child_process";

// Ship contract gate — the eval Eric asked for after three PRs shipped with a literal "{}"
// description (docs/LESSONS.md 2026-08-15): a PR is a document, and ship.sh must refuse to open
// one without a real body. The refusal fires before verify/push, so exercising it here has no
// side effects. If someone re-introduces a silent body default, this goes red the same day.
export const run = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    const out = execFileSync("bash", ["scripts/ship.sh", ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, GH_TOKEN: "test-token-never-used", ...env },
    });
    return { code: 0, stderr: "", stdout: out.toString() };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer; stdout?: Buffer };
    return {
      code: e.status ?? -1,
      stderr: e.stderr?.toString() ?? "",
      stdout: e.stdout?.toString() ?? "",
    };
  }
};
