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
  flags: Record<string, string | true>;
};
export function csv(s: unknown): string[];
export function titleWords(title: string): Set<string>;
export function findDuplicates<T extends IssueLike>(
  title: string,
  issues: T[],
  threshold?: number,
): T[];
export function withFooter(body: string): string;
export function boardStatus(issue: IssueLike): string;
export function row(issue: IssueLike): string;
export function nextLabels(current: string[], add?: string[], remove?: string[]): string[];
export function matches(
  issue: IssueLike & { body?: string | null },
  words: string,
  opts?: { label?: string },
): boolean;
