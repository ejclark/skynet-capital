/**
 * The equity-history store's shared shapes — split out from `history-store.ts` so the in-memory
 * and JSONL implementations can both depend on them without importing `history-store.ts` itself
 * (which imports the implementations back, to re-export them). Neither implementation needs
 * anything else from this module.
 */

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
