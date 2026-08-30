import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { CycleReport } from "../engine/trading-engine.js";

/** A cycle report plus the wall-clock time it was recorded. The unit the dashboard reads. */
export interface PersistedCycleReport {
  /** ISO-8601 wall-clock time the cycle was run and stored. */
  readonly recordedAt: string;
  readonly report: CycleReport;
}

/**
 * Where cycle reports are kept. Behind an interface so the run loop is testable with an
 * in-memory store and the dashboard can read from a file-backed one — same contract.
 */
export interface CycleReportStore {
  save(entry: PersistedCycleReport): Promise<void>;
  /** All reports, newest-first is not guaranteed; filter by persona when given. */
  list(personaId?: string): Promise<PersistedCycleReport[]>;
}

/** In-memory store: the reference implementation, used by tests and in-process runs. */
export class InMemoryCycleReportStore implements CycleReportStore {
  private readonly store = new InMemoryKeyedStore<PersistedCycleReport>(
    (e) => e.report.personaId,
  );

  save(entry: PersistedCycleReport): Promise<void> {
    return this.store.append(entry);
  }

  list(personaId?: string): Promise<PersistedCycleReport[]> {
    return this.store.list(personaId);
  }
}
