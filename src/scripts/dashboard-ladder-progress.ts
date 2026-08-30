import type { ActivityStore, TradeActivityRecord } from "../observatory/activity-store.js";
import { detectAndRecordLadderProgress } from "../server/ladder-activity-detector.js";
import { createLadderProgressLogStore } from "../server/ladder-progress-log.js";

/**
 * Boot-time wiring for ladder milestone auto-completion (#469 slice 3): OTM expiry / first
 * realized profit, detected from the durable activity ledger as it arrives — never a client claim.
 * Pulled out of `serve-dashboard.ts` to keep that file's own complexity budget
 * (`scripts/arch-scan.mjs`'s line-count gate), mirroring `setupFeedback` in `dashboard-feedback.ts`
 * and `wireOpsStatus` in `dashboard-ops-status.ts`.
 */
export interface LadderProgressHandle {
  /** Wraps the boot `onActivity` callback: journals the record, then detects for its participant.
   *  Safe to call as often as activity arrives — read-side dedup keeps re-detection a no-op. */
  readonly onActivity: (record: TradeActivityRecord) => void;
  /** Sweep every given participant once — for activity written outside `onActivity` (the boot
   *  reconcile, and any pre-detector history it never fired). */
  readonly sweep: (participants: readonly { readonly id: string }[]) => void;
}

/** Wire the detector against the environment's ladder-progress store and a given activity ledger. */
export function wireLadderProgress(
  env: NodeJS.ProcessEnv,
  activity: ActivityStore,
): LadderProgressHandle {
  const progress = createLadderProgressLogStore(env);
  const detect = (participantId: string) => {
    void detectAndRecordLadderProgress(progress, activity, participantId).catch((e) =>
      console.error("[ladder-progress] detection failed:", e),
    );
  };
  return {
    onActivity: (record) => {
      void activity
        .record(record)
        .then(() => detect(record.participantId))
        .catch((e) => console.error("[activity] write failed:", e));
    },
    sweep: (participants) => {
      for (const participant of participants) detect(participant.id);
    },
  };
}
