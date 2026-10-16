import type { CondScoutSnapshot } from "./cond-scout-wire.js";
import {
  resolveSnapshotReplication,
  type SnapshotReplication,
} from "./snapshot-replication-client.js";

/**
 * Sends COND-SCOUT's ledger snapshot (`cond-scout-wire.ts`) to the app on every `/controls` poll
 * — the `decision-replication-client.ts` donor pattern, minus the cursor: the snapshot is whole
 * every time, so a dropped send is healed by the next. Never throws; dark without a bridge URL or
 * while the scout itself is dark (the getter returns undefined). The send itself is shared with the
 * shadow tests of members' playbooks (`snapshot-replication-client.ts`).
 */
export type CondScoutReplication = SnapshotReplication;

export function resolveCondScoutReplication(
  env: NodeJS.ProcessEnv,
  getSnapshot: () => CondScoutSnapshot | undefined,
): CondScoutReplication {
  return resolveSnapshotReplication(env, "/cond-scout", "cond-scout", getSnapshot);
}
