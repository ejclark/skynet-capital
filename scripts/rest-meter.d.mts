// Type surface for rest-meter.mjs (#8289 slice 2) — scripts/ is plain ESM with `allowJs` off.
export interface MeterEntry {
  via: "gh" | "curl" | "fetch" | string;
  args?: string[];
  url?: string;
  method?: string;
  caller?: string;
  at?: number;
}
export interface CallCost {
  kind: "rest" | "graphql" | "gh-cli" | "none" | "other";
  endpoint?: string;
  paginated?: boolean;
}
export interface CallerRow {
  caller: string;
  rest: number;
  graphql: number;
  ghCli: number;
  paginated: number;
}
export interface MeterSummary {
  totals: { rest: number; graphql: number; ghCli: number; paginated: number };
  callers: CallerRow[];
  endpoints: { endpoint: string; count: number }[];
}
export function normalizePath(path: string): string;
export function callerOf(commandLine: string | null | undefined): string;
export function classify(entry: MeterEntry): CallCost;
export function summarize(entries: MeterEntry[]): MeterSummary;
export function formatSummary(summary: MeterSummary, opts?: { topEndpoints?: number }): string;
