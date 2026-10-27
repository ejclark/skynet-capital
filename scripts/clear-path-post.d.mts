// Type surface for clear-path-post.mjs — same arrangement as issues.d.mts (scripts/ is plain ESM
// with `allowJs` off, so a spec importing from it needs this).
interface Check {
  pass: boolean;
  evidence?: string;
}
export interface Survivor {
  issue: number;
  title?: string;
  checks?: Partial<Record<"criteria" | "size" | "noFork" | "notBlocked", Check>>;
  addFeedback?: boolean;
  comment: string;
  verifiers: string[];
}
export function unescapeHtml(s: unknown): string;
export function renderBody(survivor: Survivor): string;
export function malformed(s: Partial<Survivor> | null | undefined): string | null;
export function planPosts(result: unknown): Array<{
  issue: number;
  title: string;
  body: string;
  labels: string[];
}>;
export function liveSkip(
  issue: { state?: string; labels?: Array<string | { name: string }> } | null | undefined,
): string | null;
