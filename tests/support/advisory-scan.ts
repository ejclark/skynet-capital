import { execFileSync } from "node:child_process";

/**
 * Runs a fitness-function scanner for visibility only — logs findings, never fails the suite.
 *
 * 2026-08-29 (Eric): reduced the code-quality/debt gates (arch, dupe, dead, clone, dep-graph,
 * spec-gap, doc-rot, open-incidents) from CI-blocking to advisory. This is a closed
 * friends-and-family group — debt gets addressed as it's noticed, not pre-blocked on every PR
 * regardless of blast radius. Only malicious/destructive/insecure changes and actual behavioral
 * regressions (typecheck, lint, the real test suite, envelope.spec.ts) still hard-gate CI.
 */
export function advisoryScan(script: string, env?: NodeJS.ProcessEnv): void {
  try {
    execFileSync("node", [script], { cwd: process.cwd(), stdio: "pipe", env: env ?? process.env });
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    process.stderr.write(
      `[advisory, non-blocking] ${script}:\n${(e.stdout ?? "").toString()}${(e.stderr ?? "").toString()}\n`,
    );
  }
}
