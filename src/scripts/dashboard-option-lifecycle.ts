import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { sweepParticipantOptionLifecycle } from "../observatory/activity-backfill.js";
import type { ActivityStore } from "../observatory/activity-store.js";
import type { Participant } from "../participants/participant.js";
import { armSweepClock, OPTION_LIFECYCLE_SWEEP_MS } from "../runtime/sweep-clock.js";

/**
 * Option expiries and assignments, into the dashboard's activity ledger, on a clock (#4650). Neither
 * fills an order, so the boot reconcile (orders only) and the trade_updates stream (fills only) never
 * see one, and a sold put that expired stayed open on Activity until someone ran
 * `npm run backfill:activity` by hand. This asks each account at boot, after the reconcile, and
 * every 30 minutes after, on the bots' own sweep clock. Wiring only; the read-and-journal step is
 * `sweepParticipantOptionLifecycle`, which also explains how a pass resumes.
 *
 * THE CALL BUDGET: one read-only broker call per account per pass, so 2 an hour per account (3 in
 * the hour the server boots), each on that account's own credential.
 */

type Log = { log(line: string): void; warn(line: string): void };

export interface LifecycleSweepDeps {
  /** The live roster, read on every pass: an account added at runtime joins the next one. */
  readonly participants: () => readonly Participant[];
  readonly optionsClientFor: (
    participant: Participant,
  ) => Pick<AlpacaOptionsClient, "readOptionLifecycleActivitiesAfter">;
  /** The dashboard's own (bus-publishing) ledger, so a new line reaches the league feed too. */
  readonly store: ActivityStore;
  /** Told about an account whose ledger just gained lines: the ladder detector's sweep (an
   *  out-of-the-money expiry is one of its milestones). */
  readonly onAppended?: (participantId: string) => void;
  readonly logger?: Log;
}

/** Something the sweep can sign a read with. An account with neither a key pair nor an OAuth token
 *  is skipped, never read on someone else's credential. */
function hasBrokerCredential(participant: Participant): boolean {
  const { accessToken, apiKey, apiSecret } = participant.credentials;
  return Boolean(accessToken || (apiKey && apiSecret));
}

/** An error's class and errno code, never its message: a transport's message can carry a URL. */
function errorKind(error: unknown): string {
  if (!(error instanceof Error)) return "unknown error";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? `${error.name} ${code}` : error.name;
}

/**
 * One pass per call, over every account that has a credential. A failing account is logged once,
 * when it starts failing, and again when it recovers, so a revoked key is one line rather than 48 a
 * day. It never stops the accounts after it; its next read is simply the next pass.
 */
export function lifecycleSweepPass(deps: LifecycleSweepDeps): () => Promise<void> {
  const logger = deps.logger ?? console;
  const failing = new Set<string>();
  const failed = (id: string, why: string) => {
    if (!failing.has(id)) {
      logger.warn(`[activity] ${id}: option expiry/assignment ${why} — next pass retries`);
    }
    failing.add(id);
  };

  return async () => {
    for (const participant of deps.participants()) {
      if (!hasBrokerCredential(participant)) continue;
      const id = participant.id;
      try {
        const client = deps.optionsClientFor(participant);
        const result = await sweepParticipantOptionLifecycle({
          participantId: id,
          store: deps.store,
          readLifecycleAfter: (afterId) => client.readOptionLifecycleActivitiesAfter(afterId),
        });
        if (!result.ok) {
          failed(id, "read failed");
          continue;
        }
        if (failing.delete(id)) {
          logger.log(`[activity] ${id}: option expiry/assignment reads recovered`);
        }
        if (result.appended > 0) {
          logger.log(`[activity] ${id}: banked ${result.appended} expiry/assignment report(s)`);
          deps.onAppended?.(id);
        }
      } catch (error) {
        failed(id, `sweep failed (${errorKind(error)})`);
      }
    }
  };
}

/**
 * Arm the sweep once `afterBoot` (the boot reconcile) settles: a pass at once, then every
 * `everyMs`. Dark in offline mode, where there is no broker record to read, the same refusal the
 * backfill CLI makes. Resolves to the timer so a caller (a spec) can stop it.
 */
export async function wireOptionLifecycleSweep(
  mode: "live" | "offline",
  afterBoot: Promise<unknown>,
  deps: LifecycleSweepDeps,
  everyMs = OPTION_LIFECYCLE_SWEEP_MS,
): Promise<ReturnType<typeof setInterval> | undefined> {
  const logger = deps.logger ?? console;
  if (mode === "offline") {
    logger.log("[activity] option expiry/assignment sweep off — offline mode has no broker record");
    return undefined;
  }
  await afterBoot.catch(() => undefined);
  logger.log(
    `[activity] option expiry/assignment sweep armed — one page per account every ${Math.round(everyMs / 60_000)} min`,
  );
  return armSweepClock(lifecycleSweepPass(deps), everyMs);
}
