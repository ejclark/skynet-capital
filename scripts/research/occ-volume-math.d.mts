export function parseVolume(csv: string): Map<string, { call: number; put: number; total: number }>;
export function surgeRatio(
  today: number,
  history: readonly number[],
  lookback?: number,
): number | undefined;
