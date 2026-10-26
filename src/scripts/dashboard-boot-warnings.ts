import { statSync } from "node:fs";
import type { AccountCollision } from "../observatory/account-collisions.js";
import {
  DERIVED_STORES,
  dataRootProblem,
  volumePersistenceWarnings,
} from "../runtime/volume-guard.js";

/**
 * BOOT-TIME WARNINGS — drift the CI gates can't see, so it has to be caught live instead. Split
 * out of `serve-dashboard.ts` (Biome `noExcessiveLinesPerFile`) alongside the file's other
 * already-extracted `dashboard-*.ts` wiring modules; no behavior change.
 */

/** Volume-persistence backstop (docs/LESSONS.md, "guest list … volume"). */
export function warnUnpinnedVolumes(env: NodeJS.ProcessEnv): void {
  for (const warning of volumePersistenceWarnings(env)) console.warn(warning);
}

const deviceOf = (path: string): number | undefined => {
  try {
    return statSync(path).dev;
  } catch {
    return undefined;
  }
};

/**
 * The derived-store root must be a real mount on Fly (#4604). Refuses the boot once any store
 * derives its path from it — a refused boot fails the deploy loudly, where a write inside the
 * image would fail silently on the next one. With no derived store yet it only warns, so the
 * check is proven against production before anything depends on it.
 */
export function assertDataRootMounted(env: NodeJS.ProcessEnv): void {
  const problem = dataRootProblem(env, deviceOf);
  if (!problem) return;
  if (Object.keys(DERIVED_STORES).length > 0) throw new Error(problem);
  console.warn(`⚠️  ${problem.replace("Refusing to boot", "Would refuse to boot")}`);
}

/**
 * Two participants resolving to the SAME Alpaca account look completely healthy individually
 * (both authenticate) — nothing else would ever notice. Checked every boot because it's exactly
 * the shape of mistake a credential rotation can silently introduce (docs/LESSONS.md, 2026-08-11).
 */
export function warnAccountCollisions(collisions: readonly AccountCollision[]): void {
  for (const collision of collisions) {
    console.error(
      `[collision] ${collision.ids.join(" and ")} are BOTH pointed at Alpaca account ${collision.accountId} — positions/P&L will merge and be unattributable. Fix the credentials before trusting either account's numbers.`,
    );
  }
}
