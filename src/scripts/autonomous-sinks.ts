/**
 * Output + audit sinks shared by both the offline replay and live runners in
 * `run-autonomous.ts`: the trader-mode default, the order-fill logger, the JSONL audit-store
 * wiring, and the per-cycle decision sink that feeds it. Pulled out to keep that file's own
 * complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate) — pure functions of env/args,
 * no state of their own beyond the audit store they construct.
 */
import type { TraderMode } from "../autonomous/autonomous-trader.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { JsonlAuditStore } from "../autonomous/jsonl-audit-store.js";
import { createBotActivityEventBus } from "../observatory/activity-bus.js";
import { type ActivityEventBus, activityEventFromBotOrder } from "../observatory/activity-event.js";

/**
 * The trader's execution mode. **Defaults to `observe`** — safe by default: a persona must be
 * explicitly flipped to `live` (SKYNET_AUTONOMOUS_MODE=live), the market-open validation step in
 * `docs/AUTONOMY-PLAN.md`, before it can place a real (paper) order. Offline replay passes `live`
 * itself, since the in-memory broker carries no risk and the demo is meant to act.
 */
export function traderMode(env: NodeJS.ProcessEnv): TraderMode {
  return env.SKYNET_AUTONOMOUS_MODE === "live" ? "live" : "observe";
}

/** Audit sink: append every decision to a JSONL store when SKYNET_AUDIT_DIR is set. */
export function auditStore(env: NodeJS.ProcessEnv): JsonlAuditStore | undefined {
  return env.SKYNET_AUDIT_DIR ? new JsonlAuditStore(env.SKYNET_AUDIT_DIR) : undefined;
}

/** #1211 slice 2: a bot's own accepted orders publish `order.submitted` — dark unless a durable
 *  dir is configured. See `createBotActivityEventBus` for why it nests where it does. */
export function botBus(env: NodeJS.ProcessEnv): ActivityEventBus | undefined {
  return createBotActivityEventBus(env);
}

/** Wraps a bus so a bot's own accepted orders publish `order.submitted` (#1211 slice 2) — a
 *  publish failure logs via `process.emitWarning` and never propagates, same posture as
 *  `activity-publishing.ts`'s `logBusFailure` for the human-desk path. */
export function botOrderPublisher(
  personaId: string,
  bus: ActivityEventBus,
): (info: {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  at: string;
}) => void {
  return (info) => {
    bus.publish(activityEventFromBotOrder({ participantId: personaId, ...info })).catch((error) => {
      process.emitWarning(
        `[activity-bus] bot order ${info.orderId} (${personaId}) failed: ${error}`,
      );
    });
  };
}

/** Console + audit-store sink for one decision cycle. Never throws on the audit write. */
export function decisionSink(audit: JsonlAuditStore | undefined): (r: DecisionRecord) => void {
  return (r) => {
    const placed = r.outcomes.filter((o) => o.action === "placed").length;
    const observed = r.outcomes.filter((o) => o.action === "observed").length;
    if (r.mode === "observe" && observed > 0) {
      const names = r.guardedIntents.map((i) => `${i.side} ${i.quantity} ${i.symbol}`).join(", ");
      console.log(`[observe] ${r.personaId} would place: ${names}`);
    }
    if (placed > 0) console.log(`[cycle] ${r.personaId} placed ${placed} order(s)`);
    audit?.record(r).catch((e) => console.error("[audit] write failed:", e));
  };
}

export function logResult(r: {
  intent: { side: string; quantity: number; symbol: string };
  status: string;
  reason?: string;
}): void {
  console.log(
    `[order] ${r.intent.side} ${r.intent.quantity} ${r.intent.symbol} -> ${r.status}${r.reason ? ` (${r.reason})` : ""}`,
  );
}
