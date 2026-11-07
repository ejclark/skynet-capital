// Type surface for scripts/moneypenny/unseen-asks.mjs (see index.d.mts).

export const HOLD_MERGE: string;
export const PLATTER_PREFIX: string;
export const IN_FLIGHT_MS: number;

export type UnseenCase = "no-callout" | "comment-only" | "protected-pr" | "platter-branch";
export interface UnseenRow {
  case: UnseenCase;
  number?: number;
  branch?: string;
  title?: string;
  why: string;
}
export interface UnseenInput {
  issues?: readonly Record<string, unknown>[];
  commentCallouts?: readonly { number: number; title?: string; url?: string }[];
  prs?: readonly Record<string, unknown>[];
  platters?: readonly { branch: string; prs: number }[];
  isProtected?: (path: string) => boolean;
  listed?: Iterable<number>;
  now?: number;
}

export function unseenAsks(input?: UnseenInput): UnseenRow[];
export function unseenLine(rows: readonly UnseenRow[] | null, unknown?: string | null): string;
export function protectedTest(root?: string): (path: string) => boolean;
export function gatherUnseen(deps?: {
  rest?: (path: string) => unknown[];
  read?: (path: string) => unknown;
  repo?: string;
  issues?: readonly Record<string, unknown>[];
  prs?: readonly Record<string, unknown>[];
  listed?: Iterable<number>;
  now?: number;
  isProtected?: (path: string) => boolean;
}): UnseenRow[];
