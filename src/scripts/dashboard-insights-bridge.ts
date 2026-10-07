/**
 * The interim insight bridge (docs/plans/trade-insights-loop.md, slice 2): an internal-only
 * listener so the `bots` process (no Fly Volume of its own) can persist retrospectives through
 * this process's mounted volume, and poll Mission Control state over the same private-net bridge.
 * Bound to a port deliberately NOT in fly.toml's [http_service]: unreachable from the public
 * internet, reachable only over Fly's private 6PN network. See `../server/insights-listener.ts`
 * for the full reasoning + what was verified. Pulled out of `serve-dashboard.ts` to keep that
 * file's own complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate).
 */

import { join } from "node:path";
import { stampCredentialVersions } from "../autonomous/bot-controls.js";
import type { CondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import type { PersonaGateVerdict } from "../autonomous/controls-poll-wire.js";
import {
  type DecisionDb,
  type DecisionFunnel,
  openDecisionDb,
  type RetrospectiveRecord,
} from "../autonomous/decision-db.js";
import type { OptionOrderLeg } from "../autonomous/decision-db-leg-orders.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { storeDecisionBatch } from "../autonomous/decision-wire.js";
import type { HouseRosterReport } from "../autonomous/house-roster-wire.js";
import { createInsightStore } from "../autonomous/jsonl-insight-store.js";
import { buildSubscriptionsSnapshot } from "../autonomous/subscriptions-wire.js";
import type { OrderIntent } from "../domain/types.js";
import type { Participant } from "../participants/participant.js";
import type { createBotControlsStore } from "../server/bot-controls-store.js";
import { resolveBotCredentials } from "../server/bot-credentials-gate.js";
import { createInsightsListener, resolveInsightsBridgePort } from "../server/insights-listener.js";
import { pollSeedsFromEnv } from "../server/subscription-seed-store.js";
import { createSubscriptionStore } from "../server/subscription-store.js";
import { memoPerKey } from "../storage/ttl-memo.js";

/**
 * Opens the app-side decision store — this listener's own copy of what `bots` replicates over
 * `POST /decisions` (`decision-wire.ts`). Derived from `SKYNET_INSIGHTS_DIR` (already pinned for
 * `JsonlInsightStore`), never a new env var: `tests/arch/volume-persistence.spec.ts` is a blocking
 * gate on exactly that shape. Dark when `SKYNET_INSIGHTS_DIR` is unset — same best-effort posture
 * as `seedDecisionDb`'s bots-side counterpart, a missing/corrupt file must never fail boot.
 */
function seedAppDecisionDb(env: NodeJS.ProcessEnv): DecisionDb | undefined {
  const dir = env.SKYNET_INSIGHTS_DIR;
  if (!dir) return undefined;
  try {
    const db = openDecisionDb(join(dir, "decisions.db"));
    console.log(`[decision-db] app-side replication store armed: ${join(dir, "decisions.db")}`);
    return db;
  } catch (error) {
    console.warn("[decision-db] app-side open failed (non-fatal) — replication stays dark:", error);
    return undefined;
  }
}

export interface InsightsBridgeHandle {
  /** ISO time of the last authenticated `GET /controls` poll this app run, or `undefined` before
   *  the first one lands — the ops-status panel's credential-free "is the bots process alive"
   *  proxy. */
  readonly lastControlsPollAt: () => string | undefined;
  /** The commit the bots process reported on its most recent poll (`controls-poll-wire.ts`), or
   *  `undefined` when it reported none — an older bots build, or `GIT_SHA` dropped by a rollback.
   *  Re-read from every poll rather than remembered, so a redeploy onto an unstamped build stops
   *  claiming the old commit instead of quietly keeping it. */
  readonly botsRunningSha: () => string | undefined;
  /** This boot's per-persona readiness-gate verdicts, as the bots process reported them on its
   *  most recent poll (`controls-poll-wire.ts`); `undefined` when it reported none — an older bots
   *  build, no live bots wired, or a malformed payload. Re-read from every poll, same posture as
   *  `botsRunningSha`. */
  readonly botsGate: () => readonly PersonaGateVerdict[] | undefined;
  /** The app-side decision store's own read, for `readDecisions` wiring in `serve-dashboard.ts` —
   *  `undefined` when `SKYNET_INSIGHTS_DIR` is unset, exactly mirroring `seedAppDecisionDb`. */
  readonly readDecisions?: (
    personaId: string,
    page?: { readonly before?: number; readonly limit?: number },
  ) => Promise<DecisionRecord[]>;
  /** The exact order-id join (PR 6) — same dark-when-unset posture as `readDecisions`, and the
   *  SAME store: a decision surfaces here the instant replication has landed it, no separate wait. */
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
  /** Which personas decided these orders, ids only — the Decisions tab's cross-persona join
   *  without a decision record per order (#4612 slice 7). */
  readonly personasOfOrders?: (orderIds: readonly string[]) => string[];
  /** A spread leg's order id → its spread — the same store, filled by the same replicated
   *  records, so a leg resolves the moment its decision has landed. */
  readonly findSpreadLeg?: (legOrderId: string) => OptionOrderLeg | undefined;
  /** The decision funnel (PR 7b, #2287) — same store, same dark-when-unset posture. */
  readonly funnelFor?: (personaId: string) => DecisionFunnel;
  /** Every closed position the retrospective writer has recorded (PR 7c, #2287) — same store,
   *  same dark-when-unset posture. */
  readonly listRetrospectives?: (personaId: string) => readonly RetrospectiveRecord[];
  /** COND-SCOUT's latest snapshot (#3651 slice 7a) — memory only, refilled by the next poll. */
  readonly readCondScout: () => CondScoutSnapshot | undefined;
  /** The bots app's env house roster as its most recent poll reported it (#4650) — re-read from
   *  every poll like `botsGate`, so a bots build that stops reporting stops being quoted. */
  readonly readHouseRoster: () => HouseRosterReport | undefined;
}

export interface CredentialsBridgeDeps {
  /** Every known persona id — whose credential a `/controls` poll should try to fingerprint. */
  readonly knownPersonaIds: readonly string[];
  /** The live roster resolver every other credential seam in this app already uses. */
  readonly findParticipant: (id: string) => Participant | undefined;
}

const FUNNEL_TTL_MS = 30_000;

/** Start the internal insights listener; logs the port it bound once it's up. */
export function startInsightsBridge(
  env: NodeJS.ProcessEnv,
  botControls: ReturnType<typeof createBotControlsStore>,
  credentialsDeps?: CredentialsBridgeDeps,
): InsightsBridgeHandle {
  const insights = createInsightStore(env);
  const insightsPort = resolveInsightsBridgePort(env);
  const botCredentialsSecret = env.SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET;
  const fingerprintSalt = env.SKYNET_STORE_SECRET;
  const decisionDb = seedAppDecisionDb(env);
  // Read fresh on every poll, exactly like `botControls.load()` below — one small synchronous
  // read of the same file the Playbook Store just wrote, so a subscribe reaches the bots process
  // on the next poll with nothing to invalidate (issue #3595). Its own store instance rather than
  // a threaded-through one: `SKYNET_SUBSCRIPTIONS_FILE` already pins the path on this app, and
  // `JsonFileStore` holds no state between reads.
  const subscriptions = createSubscriptionStore(env, (message) => console.error(message));
  // Seeds bot accounts' subscriptions once each, from what the poll reports: #4535 slice 1b's env
  // roster (uncapped, behaviour-preserving), then #4642 slice 9b's own-rules playbook (`SAURON` on
  // `sauron` — standard, uncapped, unfiltered, so only the label on his orders changes). Runs before
  // the response reads the store, so the poll that seeds already gets the seeded snapshot back.
  const seed = pollSeedsFromEnv(env, (message) => console.error(message));
  let lastControlsPollAt: string | undefined;
  let botsRunningSha: string | undefined;
  let botsGate: readonly PersonaGateVerdict[] | undefined;
  let houseRoster: HouseRosterReport | undefined;
  let condScout: CondScoutSnapshot | undefined;
  createInsightsListener({
    record: (entry) => insights.record(entry),
    condScout: {
      accept: (snapshot) => {
        condScout = snapshot;
      },
    },
    ...(decisionDb
      ? {
          decisionsCursor: () => decisionDb.maxAtAll(),
          decisions: { recordBatch: (batch) => storeDecisionBatch(decisionDb, batch) },
        }
      : {}),
    // The bots process polls Mission Control state over the same private-net bridge. Stamps a
    // credentialsVersion fingerprint per known bot when the deps to do so are wired — never the
    // credential itself, see bot-credential-fingerprint.ts.
    controls: () => {
      const state = botControls.load();
      if (!(credentialsDeps && fingerprintSalt)) return state;
      return stampCredentialVersions(
        state,
        credentialsDeps.knownPersonaIds,
        (id) => credentialsDeps.findParticipant(id)?.credentials,
        fingerprintSalt,
      );
    },
    subscriptions: () =>
      buildSubscriptionsSnapshot(subscriptions.load(), Date.now(), subscriptions.loadAllocations()),
    onControlsPoll: (report) => {
      lastControlsPollAt = new Date().toISOString();
      botsRunningSha = report.gitSha;
      botsGate = report.gate;
      houseRoster = report.houseRoster;
      for (const line of seed(report)) console.log(line);
    },
    ...(credentialsDeps && botCredentialsSecret
      ? {
          botCredentials: {
            secret: botCredentialsSecret,
            resolve: (id: string) =>
              resolveBotCredentials({ findParticipant: credentialsDeps.findParticipant }, id),
          },
        }
      : {}),
  }).listen(insightsPort, () => {
    console.log(`[insights-bridge] internal listener on port ${insightsPort} (private-net only)`);
  });
  return {
    lastControlsPollAt: () => lastControlsPollAt,
    botsRunningSha: () => botsRunningSha,
    botsGate: () => botsGate,
    readCondScout: () => condScout,
    readHouseRoster: () => houseRoster,
    ...(decisionDb
      ? {
          readDecisions: async (personaId, page) =>
            decisionDb.listByPersona(personaId, {
              ...(page?.limit !== undefined ? { limit: page.limit } : {}),
              ...(page?.before !== undefined ? { beforeAt: page.before } : {}),
            }),
          findByOrderId: (orderId: string) => decisionDb.findByOrderId(orderId),
          personasOfOrders: (orderIds: readonly string[]) => decisionDb.personasOfOrders(orderIds),
          findSpreadLeg: (legOrderId: string) => decisionDb.findSpreadLeg(legOrderId),
          // Remembered for 30 s: a grouped scan of the persona's whole history (~190 ms at 180
          // days) that no viewer can tell is half a minute old (#4612 slice 7).
          funnelFor: memoPerKey(FUNNEL_TTL_MS, (personaId: string) =>
            decisionDb.funnelFor(personaId),
          ),
          // Bounded to the store's own max page (100) — retrospectives accrue one per CLOSED
          // position, not one per cycle, so this is generous headroom at this app's trade volume
          // rather than the "growing feed" concern `listByPersona`'s own bound addresses.
          listRetrospectives: (personaId: string) =>
            decisionDb.listRetrospectives(personaId, { limit: 100 }),
        }
      : {}),
  };
}
