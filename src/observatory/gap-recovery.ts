import type { Participant } from "../participants/participant.js";

/**
 * One account's stream-gap re-reads, serialized (#8251). A socket that flaps can report "listening
 * again" several times while a re-read is still waiting on the broker; two re-reads in flight would
 * each dedupe against a ledger snapshot taken before the other wrote, and journal one fill twice.
 * So: nothing starts before `after` (the boot reconcile) settles, one re-read runs per account at a
 * time, and resumes that land meanwhile coalesce into ONE follow-up from the earliest drop.
 */
export function gapRecovery(opts: {
  readonly after: Promise<unknown>;
  readonly recover: (participant: Participant, droppedAt: string) => Promise<void>;
}): (participant: Participant, droppedAt: string) => void {
  const running = new Set<string>();
  const pending = new Map<string, { participant: Participant; droppedAt: string }>();

  const run = async (participant: Participant, droppedAt: string): Promise<void> => {
    running.add(participant.id);
    try {
      await opts.after.catch(() => undefined);
      await opts.recover(participant, droppedAt).catch(() => undefined);
    } finally {
      running.delete(participant.id);
      const next = pending.get(participant.id);
      pending.delete(participant.id);
      if (next) void run(next.participant, next.droppedAt);
    }
  };

  return (participant, droppedAt) => {
    if (!running.has(participant.id)) {
      void run(participant, droppedAt);
      return;
    }
    const queued = pending.get(participant.id);
    const earliest =
      queued && Date.parse(queued.droppedAt) <= Date.parse(droppedAt)
        ? queued.droppedAt
        : droppedAt;
    pending.set(participant.id, { participant, droppedAt: earliest });
  };
}
