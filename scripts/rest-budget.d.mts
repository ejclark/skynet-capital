// Type surface for rest-budget.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
export const REST_LOG_BELOW: number;
export const GRAPHQL_BELOW: number;
export interface RateHeaders {
  remaining: number | null;
  reset: number | null;
  resource: string | null;
}
export function parseRateHeaders(text: string | null | undefined): RateHeaders;
export function callerLabel(args?: {
  argv?: string[];
  env?: Record<string, string | undefined>;
  branch?: string;
}): string;
export interface Budget {
  observe(h?: Partial<RateHeaders>): void;
  exhausted(): void;
  useGraphql(): boolean;
  remaining(): number | null;
}
export function createBudget(args?: {
  log?: (line: string) => void;
  caller?: () => string;
}): Budget;
export const budget: Budget;
