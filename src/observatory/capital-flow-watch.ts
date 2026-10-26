import { RECENT_ORDER_WINDOW } from "../alpaca/alpaca-trading-client.js";
import type { ActivityStore } from "./activity-record.js";
import {
  type CapitalFlow,
  type CapitalFlowStore,
  inferCapitalFlow,
  mightCarryFlow,
} from "./capital-flow.js";
import type { EquitySample, HistoryStore } from "./history-record.js";
import type { ActivityView } from "./participant-snapshot.js";

/**
 * The watch that fills the capital-flow ledger (#4563 slice 1 — the shadow run).
 *
 * The watch sits beside the history sampler: each new equity sample is compared with that
 * participant's previous one, and only when equity moved beyond tolerance is the fill journal read
 * to ask whether trading explains it (`capital-flow.ts`). Anything left over is appended as an
 * inferred flow in the ledger (`capital-flow-store.ts`). Nothing renders it yet — slice 2 marks
 * the standings row and the equity curve — so a week of shadow lines can tune the tolerance
 * before a member ever sees one.
 *
 * Unlike the ceremony baseline, a flow DOES span a restart: a reset made while the server was down
 * is still capital that arrived, and both witnesses are durable (the last history sample and the
 * fill journal, which the boot reconcile tops up from the broker's window). So the watch is seeded
 * with each participant's last sample from before this boot (`restartBaseline`) and its first
 * comparison waits for that reconcile (`ready`).
 */

export interface CapitalFlowWatchOptions {
  readonly activity: Pick<ActivityStore, "list">;
  readonly flows: Pick<CapitalFlowStore, "record">;
  /** Each participant's last sample from before this boot, so the restart gap is compared too. */
  readonly baseline?: readonly EquitySample[];
  /** Settles once the boot reconcile has banked the broker window's fills into the journal; no
   *  comparison reads the journal before it. A rejection is the reconcile's to log, not ours. */
  readonly ready?: Promise<unknown>;
}

/** Compares each participant's consecutive samples and records the flows that trading does not
 *  explain. One instance per server; it keeps only the previous sample per participant. */
export class CapitalFlowWatch {
  private readonly previous = new Map<string, EquitySample>();
  private readonly ready: Promise<unknown>;

  constructor(private readonly opts: CapitalFlowWatchOptions) {
    for (const sample of opts.baseline ?? []) this.previous.set(sample.participantId, sample);
    this.ready = (opts.ready ?? Promise.resolve()).catch(() => undefined);
  }

  /** Observe one new sample; resolves to the flow recorded for it, if any. Every call waits on the
   *  same `ready`, so continuations run in call order, and the previous sample is replaced before
   *  any later await — overlapping ticks still compare consecutive pairs. */
  async observe(sample: EquitySample): Promise<CapitalFlow | undefined> {
    await this.ready;
    const prev = this.previous.get(sample.participantId);
    this.previous.set(sample.participantId, sample);
    if (!(prev && mightCarryFlow(prev, sample))) return undefined;
    const records = await this.opts.activity.list(sample.participantId);
    const flow = inferCapitalFlow(prev, sample, records);
    if (flow) await this.opts.flows.record(flow);
    return flow;
  }
}

/**
 * Each participant's last durable sample from before this boot — read BEFORE `rehydrateHistory`
 * writes the boot samples, or "latest" would be the present — kept only where the restart gap can
 * honestly be compared:
 *
 *   - the account read cleanly at boot (an errored read has no boot sample and an empty window), and
 *   - the broker's recent-order window covers the gap: it is not full, or its oldest order is no
 *     newer than the prior sample. A full window that starts inside the gap may have dropped fills
 *     the journal never saw, and their cash would read as a flow.
 */
export async function restartBaseline(
  history: Pick<HistoryStore, "latest">,
  participants: ReadonlyArray<{
    readonly id: string;
    readonly error?: string;
    readonly activity?: readonly ActivityView[];
  }>,
  windowSize = RECENT_ORDER_WINDOW,
): Promise<EquitySample[]> {
  const kept: EquitySample[] = [];
  for (const participant of participants) {
    if (participant.error) continue;
    const prior = await history.latest(participant.id).catch(() => undefined);
    if (!prior) continue;
    const window = participant.activity ?? [];
    const oldest = Math.min(...window.map((row) => Date.parse(row.at)));
    const covered = window.length < windowSize || oldest <= Date.parse(prior.at);
    if (covered) kept.push(prior);
  }
  return kept;
}
