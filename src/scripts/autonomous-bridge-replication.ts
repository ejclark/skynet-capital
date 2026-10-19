/**
 * Everything the bots process sends the app on each `/controls` poll: the decision batches
 * (`decision-replication-client.ts`), COND-SCOUT's ledger snapshot (#3651 slice 7a) and the
 * members' playbooks in a shadow test (#5457 slice 2). One hook
 * for `bootMissionControl`, kept here to hold `run-autonomous.ts` under its line cap.
 */

import type { ShadowReport } from "../autonomous/authored-shadow-wire.js";
import { resolveCondScoutReplication } from "../autonomous/cond-scout-replication-client.js";
import type { CondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import type { DecisionDb } from "../autonomous/decision-db.js";
import { resolveDecisionReplication } from "../autonomous/decision-replication-client.js";
import { resolveSnapshotReplication } from "../autonomous/snapshot-replication-client.js";

export interface BridgeReplication {
  /** The `/controls` poll hook. Never throws; both sends are fire-and-forget. */
  onPoll(cursor: Parameters<ReturnType<typeof resolveDecisionReplication>["replicate"]>[0]): void;
  /** Registered once the scout is armed; dark (nothing sent) until then or when it stays dark. */
  publishCondScout(get: () => CondScoutSnapshot): void;
  /** Registered once the shadow runner exists; nothing is sent before then. */
  publishAuthoredShadow(get: () => ShadowReport): void;
}

export function bridgeReplication(
  env: NodeJS.ProcessEnv,
  getDecisionDb: () => DecisionDb | undefined,
): BridgeReplication {
  const decisions = resolveDecisionReplication(env, getDecisionDb);
  let snapshot: (() => CondScoutSnapshot) | undefined;
  const condScout = resolveCondScoutReplication(env, () => snapshot?.());
  let shadowReport: (() => ShadowReport) | undefined;
  const authoredShadow = resolveSnapshotReplication(
    env,
    "/authored-shadow",
    "authored-shadow",
    () => shadowReport?.(),
  );
  return {
    onPoll: (cursor) => {
      void decisions.replicate(cursor);
      void condScout.send();
      void authoredShadow.send();
    },
    publishCondScout: (get) => {
      snapshot = get;
    },
    publishAuthoredShadow: (get) => {
      shadowReport = get;
    },
  };
}
