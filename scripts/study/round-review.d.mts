// Type surface for round-review.mjs's pure helpers (`allowJs` is off; same arrangement as round.d.mts).

/** An expert batch that timed out twice: where it was, and the last timeout's message. */
export interface MissingBatch {
  batch: number;
  source: string;
  route: string;
  viewport: string;
  controls: number;
  reason: string;
}

/** The expert step's coverage: batches answered of batches asked, every missing one named. */
export function expertCoverage(
  settled: { k: number; summary: { batches: number; missing: MissingBatch[] } }[],
): { answered: number; of: number; missing: (MissingBatch & { expert: number })[] };

/** One batch's call, asked once more on a timeout; a second timeout is `{missing}`, not a throw. */
export function askBatch<Req, Ans>(
  call: (request: Req) => Promise<Ans>,
  request: Req,
  onRetry?: (e: Error) => void,
): Promise<{ answer: Ans; missing?: undefined } | { missing: string; answer?: undefined }>;
