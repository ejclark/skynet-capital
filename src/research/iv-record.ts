/**
 * The IV-history store's shared shapes — split out from `iv-history-store.ts` so the in-memory and
 * JSONL implementations can both depend on them without importing `iv-history-store.ts` itself
 * (which imports the implementations back, to re-export them). Exactly the split
 * `src/observatory/history-record.ts` makes for equity history; this is that shape applied to a
 * different series, not a new idea.
 */

/**
 * One durable point in an underlying's implied-volatility history — at-the-money IV at a moment in
 * time. The append-only unit `iv-rank.ts` reduces into IV rank and IV percentile.
 *
 * `atmIv` is ALWAYS a solved number, never a placeholder: a quote the solver could not honestly
 * price is dropped by the instrument rather than recorded as a zero (see `iv-instrument.ts`). A zero
 * in this series would read as "volatility collapsed", which is a lie about the market.
 */
export interface IvSample {
  /** ISO-8601 wall-clock time the sample was taken. */
  readonly at: string;
  /** The UNDERLYING's ticker (e.g. "NVDA") — never an OCC option symbol. */
  readonly symbol: string;
  /** Annualized at-the-money implied volatility as a decimal — 0.32 is 32%. */
  readonly atmIv: number;
  /** Underlying spot at sample time, kept so a later audit can re-derive the solve. */
  readonly spot: number;
  /** Calendar days to the expiry the IV was read from — the series' tenor, kept for audit. */
  readonly daysToExpiry: number;
}

/**
 * Where IV history is kept. Behind an interface (like `HistoryStore`) so the runtime can sample into
 * a file-backed store while specs use an in-memory one — same contract, no I/O in tests.
 */
export interface IvHistoryPort {
  save(sample: IvSample): Promise<void>;
  /** All samples (order not guaranteed); filtered to one underlying when given. */
  list(symbol?: string): Promise<IvSample[]>;
}
