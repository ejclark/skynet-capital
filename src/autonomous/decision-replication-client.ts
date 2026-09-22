import { fetchJson } from "../http/fetch-json.js";
import type { DecisionDb } from "./decision-db.js";
import type { DecisionRecord } from "./decision-record.js";
import { DECISION_BATCH_KIND, MAX_DECISION_BATCH } from "./decision-wire.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "./insight-record.js";

/**
 * The `bots` process's half of the cursor-based decision replication bridge
 * (`docs/plans/where-are-we-documenting-*.md` PR 4 / issue #2287) — the `insight-bridge-client.ts`
 * donor pattern, pointed at `decision-wire.ts`'s versioned batch format instead of a single insight.
 *
 * Deliberately reads the cursor and the rows to send from LOCAL data only: `cursor` (the app's own
 * `decisionsCursor`, riding the `/controls` poll this process already makes every 30s) says what
 * the app has; `decisionDb.maxAtAll()` says what THIS process's own store holds, for every persona
 * that has ever produced a decision here — no separate "known persona ids" plumbing needed. A
 * persona present locally but absent from the app's cursor (its very first replication) sends
 * everything from `at > 0`. Never throws — a dropped/rejected batch just resends whole on the next
 * poll, since the app's own high-water mark only advances once a batch actually lands.
 */
export interface DecisionReplicationClient {
  replicate(cursor: Readonly<Record<string, number>>): Promise<void>;
}

const NOOP_CLIENT: DecisionReplicationClient = {
  replicate: async () => {
    /* disabled — no bridge URL or no local decision store */
  },
};

/**
 * `getDecisionDb` is a GETTER, not a value: `bootMissionControl`'s single eager boot fetch runs
 * before `run-autonomous.ts` constructs `decisionDb` (it's needed only once the background poll
 * starts, well after), so this client must read the current store fresh on every `replicate()`
 * call rather than close over a value that doesn't exist yet at construction time.
 */
export function resolveDecisionReplication(
  env: NodeJS.ProcessEnv,
  getDecisionDb: () => DecisionDb | undefined,
): DecisionReplicationClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return NOOP_CLIENT;
  const endpoint = `${url.replace(/\/+$/, "")}/decisions`;

  const sendOne = async (personaId: string, records: readonly DecisionRecord[]): Promise<void> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BRIDGE_REQUEST_TIMEOUT_MS);
      try {
        const response = await fetchJson(
          "POST",
          endpoint,
          { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
          { kind: DECISION_BATCH_KIND, personaId, records },
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) {
          process.emitWarning(
            `[decision-replication] ${personaId} batch rejected (${response.status}) — will resend`,
          );
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      // Unreachable bridge, timeout, DNS failure: a resend on the next poll is fine; a crashed
      // trade loop is not. This function must never throw — same posture as insight-bridge-client.
      process.emitWarning(
        `[decision-replication] ${personaId} unreachable — will resend: ${String(error)}`,
      );
    }
  };

  return {
    replicate: async (cursor) => {
      const decisionDb = getDecisionDb();
      if (!decisionDb) return;
      const localMax = decisionDb.maxAtAll();
      for (const personaId of Object.keys(localMax)) {
        const after = cursor[personaId] ?? 0;
        const rows = decisionDb.listSince(personaId, after, MAX_DECISION_BATCH);
        if (rows.length > 0) await sendOne(personaId, rows);
      }
    },
  };
}
