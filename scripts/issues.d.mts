// Type surface for issues.mjs — same arrangement as code-lines.d.mts (scripts/ is plain ESM with
// `allowJs` off, so a spec importing from it needs this).
interface IssueLike {
  number?: number;
  title: string;
  state?: string;
  labels?: Array<string | { name: string }>;
  body?: string | null;
  user?: { login?: string };
}
export function parseArgs(argv: string[]): {
  cmd: string | undefined;
  positional: string[];
  /** A value flag given last has no value: its key is present, set to undefined (#6285). */
  flags: Record<string, string | true | undefined>;
};
export function csv(s: unknown): string[];
export function titleWords(title: string): Set<string>;
export function findDuplicates<T extends IssueLike>(
  title: string,
  issues: T[],
  threshold?: number,
): T[];
export function withFooter(body: string): string;
export function commentWrite(args: {
  n: number;
  body: string;
  editId?: string | number | boolean;
}): {
  method: "POST" | "PATCH";
  path: string;
  payload: { body: string };
};
/** #6285: update's comment write, decided (and a bad id refused) before any other write. */
export function updateCommentOp(args: {
  n: number;
  flags: Record<string, string | true | undefined>;
  read?: (file: string) => string;
}): { method: "POST" | "PATCH"; path: string; payload: { body: string } } | null;
export function boardStatus(issue: IssueLike): string;
export function row(issue: IssueLike): string;
export function nextLabels(current: string[], add?: string[], remove?: string[]): string[];
export function matches(
  issue: IssueLike & { body?: string | null },
  words: string,
  opts?: { label?: string },
): boolean;
export function followUps(args: {
  child: { id: number; number: number };
  parentNumber?: number;
  blockers?: Array<{ id: number }>;
  afterLinks?: string[];
  closed?: boolean;
}): Array<{ method: string; path: string; payload: Record<string, unknown> }>;
/** #5266: `ready` waits for a filing's parent/blocker links, so a claim never sees it unlinked. */
export function splitLabels(
  labels?: string[],
  links?: { parentNumber?: number; blockers?: Array<{ id: number }> },
): { initial: string[]; afterLinks: string[] };
export function searchQuery(args: {
  repo: string;
  words: string;
  state?: string;
  label?: string;
}): string;
export function searchRemote(args: {
  words: string;
  state: string;
  label?: string;
  limit: number;
  repo?: string;
  read?: (path: string) => unknown;
}): IssueLike[];
export function scanIssues<T extends IssueLike & { pull_request?: unknown }>(
  state: string,
  keep: (issue: T) => boolean,
  limit: number,
  opts: { read: (path: string) => T[]; perPage?: number; maxPages?: number },
): { items: T[]; partial: boolean; scanned?: number };
