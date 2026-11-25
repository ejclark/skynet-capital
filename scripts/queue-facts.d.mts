// Type surface for queue-facts.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
export interface QueueFacts {
  readyAt: number | null;
  blocks: number[];
}
/** Which REST reads an issue needs where GraphQL is refused. */
export interface FactsNeed {
  ready: boolean;
  blocks: boolean;
}
export const BATCH: number;
export const NEED_ALL: Readonly<FactsNeed>;
export function needOf(issue: unknown): FactsNeed;
export function factsQuery(numbers: number[]): string;
export function factsOf(node: unknown): QueueFacts;
export function restFactsOf(
  n: number,
  read?: (path: string) => unknown,
  need?: FactsNeed,
): QueueFacts;
export function readQueueFacts(
  numbers: number[],
  opts?: {
    repo?: string;
    send?: (query: string, variables: Record<string, unknown>) => unknown;
    read?: (path: string) => unknown;
    log?: (line: string) => void;
    need?: (n: number) => FactsNeed | undefined;
  },
): Map<number, QueueFacts>;
