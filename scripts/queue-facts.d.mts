// Type surface for queue-facts.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
export interface QueueFacts {
  readyAt: number | null;
  blocks: number[];
}
export const BATCH: number;
export function factsQuery(numbers: number[]): string;
export function factsOf(node: unknown): QueueFacts;
export function restFactsOf(n: number, read?: (path: string) => unknown): QueueFacts;
export function readQueueFacts(
  numbers: number[],
  opts?: {
    repo?: string;
    send?: (query: string, variables: Record<string, unknown>) => unknown;
    read?: (path: string) => unknown;
    log?: (line: string) => void;
  },
): Map<number, QueueFacts>;
