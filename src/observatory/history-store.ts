import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * One durable point in a participant's history — an equity + realized-P/L sample at a moment in time.
 * The append-only unit the observatory replays to draw performance-over-time and win rate, and the
 * signal the sim-city event ceremonies read (a jump in realizedPl = a win booked → a building tops out).
 * Deliberately tiny (a few numbers) so a long history costs almost nothing on disk.
 */
export interface EquitySample {
  /** ISO-8601 wall-clock time the sample was taken. */
  readonly at: string;
  readonly participantId: string;
  readonly equity: number;
  readonly cash: number;
  /** Cumulative realized P/L at this instant (see ParticipantSnapshot.realizedPl); 0 when unknown. */
  readonly realizedPl: number;
}

/**
 * Where equity/realized history is kept. Behind an interface (like `CycleReportStore`) so the runtime
 * can sample into a file-backed store while tests use an in-memory one — same contract, no I/O in tests.
 */
export interface HistoryStore {
  save(sample: EquitySample): Promise<void>;
  /** All samples (order not guaranteed); filtered to one participant when given. */
  list(participantId?: string): Promise<EquitySample[]>;
}

/** In-memory store: the reference implementation, used by tests and in-process runs. */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly samples: EquitySample[] = [];

  save(sample: EquitySample): Promise<void> {
    this.samples.push(sample);
    return Promise.resolve();
  }

  list(participantId?: string): Promise<EquitySample[]> {
    const all = [...this.samples];
    return Promise.resolve(
      participantId ? all.filter((s) => s.participantId === participantId) : all,
    );
  }
}

/**
 * File-backed store: one append-only JSONL file per participant under `dir` (mirrors
 * `JsonlCycleReportStore`). Append-only keeps writes cheap and the history immutable — every sample is
 * a durable line the dashboard can replay. On Fly this `dir` lives on the mounted `/data` volume, so
 * history survives redeploys with **no database and no host change** (set `SKYNET_HISTORY_DIR=/data/history`).
 */
export class JsonlHistoryStore implements HistoryStore {
  private readonly store: JsonlKeyedStore<EquitySample>;

  constructor(dir: string) {
    // A participant id is a slug (`human-<name>` / personaId); safe as a filename. Guard just in case.
    this.store = new JsonlKeyedStore<EquitySample>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async save(sample: EquitySample): Promise<void> {
    await this.store.append(sample.participantId, sample);
  }

  list(participantId?: string): Promise<EquitySample[]> {
    return this.store.list(participantId);
  }
}

/**
 * Build the history store from the environment. `SKYNET_HISTORY_DIR` sets the directory (in production,
 * a path on the mounted volume, e.g. `/data/history`); it defaults to a local `data/history` for dev.
 * Always returns a store — history is additive and safe to record everywhere.
 */
export function createHistoryStore(env: NodeJS.ProcessEnv): HistoryStore {
  return new JsonlHistoryStore(env.SKYNET_HISTORY_DIR ?? "data/history");
}
