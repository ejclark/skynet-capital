// Type surface for usage.mjs — same arrangement as sealed.d.mts (`allowJs` is off).

export interface UsageTotal {
  calls: number;
  priced: number;
  replayed: number;
  stubbed: number;
  failed: number;
  unpriced: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cost_usd: number;
  duration_ms: number;
  models: Record<string, number>;
}
export function sumUsage(records: Record<string, unknown>[]): UsageTotal;
export function readRequests(dir: string): Record<string, unknown>[];
export function stepUsage(out: string, step: string): UsageTotal;
export function roundUsage(
  out: string,
  steps: readonly string[],
): { steps: Record<string, UsageTotal>; total: UsageTotal };
