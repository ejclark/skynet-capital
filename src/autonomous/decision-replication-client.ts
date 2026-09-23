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
 * Deliberately reads the rows to send from LOCAL data only: `decisionDb.maxAtAll()` says what THIS
 * process's own store holds, for every persona that has ever produced a decision here — no
 * separate "known persona ids" plumbing needed. The `cursor` parameter (the app's own
 * `decisionsCursor`, riding the `/controls` poll this process already makes every 30s) is received
 * but deliberately NOT used to resume the ascending leg — see the bug note below for why. Never
 * throws — a dropped/rejected batch just resends whole on the next poll, since the ascending leg's
 * own local high-water mark only advances once a batch actually lands.
 *
 * SECOND, INDEPENDENT LEG (2026-09-23, found live in prod after issue #2287's own directory-
 * creation bug — #3576 — was fixed): the ascending leg above is strictly chronological and can
 * only advance `MAX_DECISION_BATCH` rows per 30s poll. After ANY outage longer than a few minutes
 * (that bug's own dark period was hours), the app's cursor sits far behind "now," and the ascending
 * leg would need to drain the ENTIRE gap — at 15s/cycle, potentially hours of polls — before a
 * single recent decision becomes visible. That is a materially worse failure mode than the outage
 * itself: the dashboard looks frozen on stale history precisely when a member goes looking for
 * "what did the bot just do."
 *
 * The preview leg below is the fix: every poll, UNCONDITIONALLY (no cursor check at all), also
 * send the newest `LIVE_PREVIEW_BATCH` rows this process holds locally. This never replaces the
 * ascending leg — that one is left untouched and remains the sole source of truth for "is
 * everything present with no gaps," and will, on its own timeline, eventually drain any backlog in
 * full. The preview leg is purely additive: idempotent (`DecisionDb.record()`'s own
 * `UNIQUE(persona_id, at)`), so re-sending an already-known row every poll is a no-op on receipt,
 * and cheap (a few hundred bytes × a small batch, over the private internal bridge). Its ONLY job
 * is to guarantee recent activity surfaces within one poll interval of happening, regardless of how
 * deep a historical backlog the ascending leg still has to work through — trading a temporary,
 * self-healing gap in the MIDDLE of the app's history (it closes the moment the ascending leg
 * catches up) for immediate visibility at the front, which is what the dashboard is actually for.
 *
 * THAT "SELF-HEALING" CLAIM WAS WRONG (found live, 2026-09-23): the ascending leg's resume point
 * used to be `cursor[personaId]` — the app's own `decisionsCursor`, which is `maxAtAll()` over
 * EVERYTHING the app has ever stored, preview-leg sends included. The instant one preview batch
 * landed, the app started echoing back "now" as the cursor, and the ascending leg read that as
 * "nothing left to send" — permanently, since nothing local is ever newer than "now" either. The
 * gap between the last real ascending progress and today never closed; it just stopped being
 * visible as a gap. `ascendingCursor` below fixes this by tracking the ascending leg's own resume
 * point ENTIRELY LOCALLY, never blending in what the app reports — the two legs' jobs ("drain the
 * backlog with no gaps" vs. "show the newest thing right now") must never be allowed to share one
 * number, or the fast one silently stalls the slow one. The cost: a bots restart resends the
 * ascending leg from scratch (idempotent, just wasted bandwidth) rather than resuming — an
 * acceptable trade since restarts are rare here and correctness matters more than that saving.
 */
export interface DecisionReplicationClient {
  replicate(cursor: Readonly<Record<string, number>>): Promise<void>;
}

/** Small on purpose: this only needs to comfortably exceed how many rows accumulate between two
 *  polls (one per persona per ~15s cycle, polled every 30s — so ~2 in the steady state) with wide
 *  margin for a burst. It is NOT a backlog-draining budget; `MAX_DECISION_BATCH` still owns that
 *  job on the ascending leg. */
const LIVE_PREVIEW_BATCH = 20;

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

  // The ascending leg's own resume point per persona, tracked ENTIRELY LOCALLY — see this
  // module's own doc for why blending in the app's echoed `decisionsCursor` (the `cursor`
  // parameter below, now otherwise unused) silently stalls this leg forever the moment the
  // preview leg's first send lands. Lives for this process's lifetime; a restart starts a
  // persona back at 0, resending its full known history — safe (idempotent on receipt) and rare.
  const ascendingCursor: Record<string, number> = {};

  return {
    replicate: async (_cursor) => {
      const decisionDb = getDecisionDb();
      if (!decisionDb) return;
      const localMax = decisionDb.maxAtAll();
      for (const personaId of Object.keys(localMax)) {
        const after = ascendingCursor[personaId] ?? 0;
        const rows = decisionDb.listSince(personaId, after, MAX_DECISION_BATCH);
        if (rows.length > 0) {
          await sendOne(personaId, rows);
          ascendingCursor[personaId] = Math.max(after, ...rows.map((r) => r.at));
        }

        // The preview leg — see this module's own doc for why it exists and why it's safe to run
        // unconditionally alongside the ascending leg above.
        const preview = decisionDb.listByPersona(personaId, { limit: LIVE_PREVIEW_BATCH });
        if (preview.length > 0) await sendOne(personaId, preview);
      }
    },
  };
}
