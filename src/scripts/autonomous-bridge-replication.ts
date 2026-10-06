/**
 * Everything the bots process sends the app on each `/controls` poll: the decision batches
 * (`decision-replication-client.ts`) and COND-SCOUT's ledger snapshot (#3651 slice 7a). One hook
 * for `bootMissionControl`, kept here to hold `run-autonomous.ts` under its line cap.
 */

import { resolveCondScoutReplication } from "../autonomous/cond-scout-replication-client.js";
import type { CondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import type { DecisionDb } from "../autonomous/decision-db.js";
import { resolveDecisionReplication } from "../autonomous/decision-replication-client.js";

export interface BridgeReplication {
  /** The `/controls` poll hook. Never throws; both sends are fire-and-forget. */
  onPoll(cursor: Parameters<ReturnType<typeof resolveDecisionReplication>["replicate"]>[0]): void;
  /** Registered once the scout is armed; dark (nothing sent) until then or when it stays dark. */
  publishCondScout(get: () => CondScoutSnapshot): void;
}

export function bridgeReplication(
  env: NodeJS.ProcessEnv,
  getDecisionDb: () => DecisionDb | undefined,
): BridgeReplication {
  const decisions = resolveDecisionReplication(env, getDecisionDb);
  let snapshot: (() => CondScoutSnapshot) | undefined;
  const condScout = resolveCondScoutReplication(env, () => snapshot?.());
  return {
    onPoll: (cursor) => {
      void decisions.replicate(cursor);
      void condScout.send();
    },
    publishCondScout: (get) => {
      snapshot = get;
    },
  };
}
