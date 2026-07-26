import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

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
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  async save(sample: EquitySample): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await appendFile(this.fileFor(sample.participantId), `${JSON.stringify(sample)}\n`, "utf8");
  }

  async list(participantId?: string): Promise<EquitySample[]> {
    const files = participantId ? [this.fileFor(participantId)] : await this.allFiles();
    const samples: EquitySample[] = [];
    for (const file of files) {
      samples.push(...(await this.readFileEntries(file)));
    }
    return samples;
  }

  // A participant id is a slug (`human-<name>` / personaId); safe as a filename. Guard just in case.
  private fileFor(participantId: string): string {
    return join(this.dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`);
  }

  private async allFiles(): Promise<string[]> {
    try {
      const names = await readdir(this.dir);
      return names.filter((n) => n.endsWith(".jsonl")).map((n) => join(this.dir, n));
    } catch {
      return [];
    }
  }

  private async readFileEntries(file: string): Promise<EquitySample[]> {
    let contents: string;
    try {
      contents = await readFile(file, "utf8");
    } catch {
      return [];
    }
    return contents
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as EquitySample);
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
