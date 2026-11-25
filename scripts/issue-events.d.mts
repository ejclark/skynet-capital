// Type surface for issue-events.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
/** One event in REST's `issues/<n>/events` shape, the fields delivery-score's `classify` reads. */
export interface IssueEvent {
  [field: string]: unknown;
  event: string;
  label?: { name?: string };
  created_at: string;
}
export const BATCH: number;
export function eventsQuery(numbers: number[]): string;
export function eventsOf(node: unknown): IssueEvent[];
export function readIssueEvents(
  numbers: number[],
  opts?: {
    repo?: string;
    send?: (query: string, variables: Record<string, unknown>) => unknown;
    read?: (path: string) => unknown;
    log?: (line: string) => void;
  },
): Map<number, IssueEvent[]>;
