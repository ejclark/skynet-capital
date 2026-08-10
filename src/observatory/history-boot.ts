import type { DashboardData } from "./dashboard-data.js";
import {
  createHistoryStore,
  type EquitySample,
  type HistoryStore,
  InMemoryHistoryStore,
} from "./history-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * Boot-time history concern: make cumulative realized P/L survive a restart.
 *
 * Why this exists (docs/plans/history-layer.md, slice 1): `reduce.ts` accumulates `realizedPl` in
 * memory only and raw Alpaca reads never carry it, so every deploy reset the running total to 0 —
 * writing a false cliff into the permanent record and threatening false `took_profit` ceremonies
 * (docs/GAPS-2026-08.md:46-48). Seeding the initial snapshot from the newest durable sample closes
 * the cliff.
 *
 * It lives in its own module because `serve-dashboard.ts` sits at its architecture budget and
 * because the ordering below is load-bearing enough to deserve a spec of its own.
 *
 * **Honesty bound (accepted, documented):** this restores *continuity*, not perfection. Fills in the
 * ≤5-minute tail before a shutdown, and any fill while the dashboard is down (the bots process keeps
 * trading), are never observed by the reducer and cannot be recovered here — the restored figure is a
 * documented undercount at those boundaries, never an overcount. True backfill needs the per-fill
 * ledger / Alpaca activities read, which the plan names a non-goal.
 */

/** The newest sample per participant, by `at` — `HistoryStore.list` does not guarantee order. */
export function latestByParticipant(samples: readonly EquitySample[]): Map<string, EquitySample> {
  const latest = new Map<string, EquitySample>();
  for (const sample of samples) {
    const held = latest.get(sample.participantId);
    if (!held || sample.at > held.at) latest.set(sample.participantId, sample);
  }
  return latest;
}

/**
 * Seed cumulative `realizedPl` onto snapshots that carry none, from durable history. A snapshot that
 * already carries a value keeps it: a live fill folded before seeding is fresher than any sample.
 */
export function seedRealizedPl(
  data: DashboardData,
  samples: readonly EquitySample[],
): DashboardData {
  const latest = latestByParticipant(samples);
  return {
    ...data,
    participants: data.participants.map((snapshot): ParticipantSnapshot => {
      if (snapshot.realizedPl !== undefined) return snapshot;
      const sample = latest.get(snapshot.id);
      return sample ? { ...snapshot, realizedPl: sample.realizedPl } : snapshot;
    }),
  };
}

/**
 * The synchronization samples written once at boot. They give the durable stream a fresh, trusted
 * baseline immediately after seeding — and are what the ceremony sampler baselines against, so
 * transitions only ever span post-boot pairs (never a stale pre-restart cash delta).
 * Error snapshots are skipped, matching the sampler: a failed read must never record a false $0.
 */
export function bootSamples(data: DashboardData, at: string): EquitySample[] {
  return data.participants
    .filter((snapshot) => !snapshot.error)
    .map((snapshot) => ({
      at,
      participantId: snapshot.id,
      equity: snapshot.equity,
      cash: snapshot.cash,
      realizedPl: snapshot.realizedPl ?? 0,
    }));
}

/**
 * Offline runs get an in-memory store. The fixture replay loops
 * (`replay-event-stream.ts`), so every loop re-books the same sells — persisting that to
 * `data/history` and rehydrating it would compound a fabricated realized-P/L climb across restarts,
 * and the taste-gated offline renders would display it as real.
 */
export function createBootHistoryStore(env: NodeJS.ProcessEnv, mode: string): HistoryStore {
  return mode === "offline" ? new InMemoryHistoryStore() : createHistoryStore(env);
}

/**
 * Seed `initial` from durable history and write the boot baseline. Await this **before** constructing
 * the hub: doing it afterwards would let a live fill land on an unseeded 0 and then be clobbered, and
 * would let the sampler record a `realizedPl: 0` sample that the *next* boot rehydrates — the cliff
 * would become self-propagating.
 */
export async function rehydrateHistory(
  store: HistoryStore,
  initial: DashboardData,
  now: () => Date = () => new Date(),
): Promise<DashboardData> {
  const seeded = seedRealizedPl(initial, await store.list());
  await Promise.all(
    bootSamples(seeded, now().toISOString()).map((sample) =>
      store.save(sample).catch(() => {
        /* fire-and-forget: a history write must never block startup */
      }),
    ),
  );
  return seeded;
}

/**
 * The founding-record writer handed to `ParticipantService`. Idempotent by design: a participant who
 * already has history is re-onboarding (the participant store and the history dir are independent, so
 * a wiped store can re-add someone whose history survived), and writing the `realizedPl: 0` seed over
 * their record would re-introduce the very cliff slice 1 removes.
 */
export function seedSampleRecorder(
  store: HistoryStore,
): (snapshot: ParticipantSnapshot, at: string) => void {
  return (snapshot, at) => {
    void (async () => {
      if ((await store.list(snapshot.id)).length > 0) return;
      await store.save({
        at,
        participantId: snapshot.id,
        equity: snapshot.equity,
        cash: snapshot.cash,
        realizedPl: snapshot.realizedPl ?? 0,
      });
    })().catch(() => {
      /* fire-and-forget: a history write failure must never break onboarding */
    });
  };
}
