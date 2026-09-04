import type { AccountCollision } from "../observatory/account-collisions.js";
import { volumePersistenceWarnings } from "../runtime/volume-guard.js";

/**
 * BOOT-TIME WARNINGS — drift the CI gates can't see, so it has to be caught live instead. Split
 * out of `serve-dashboard.ts` (Biome `noExcessiveLinesPerFile`) alongside the file's other
 * already-extracted `dashboard-*.ts` wiring modules; no behavior change.
 */

/** Volume-persistence backstop (docs/LESSONS.md, "guest list … volume"). */
export function warnUnpinnedVolumes(env: NodeJS.ProcessEnv): void {
  for (const warning of volumePersistenceWarnings(env)) console.warn(warning);
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
