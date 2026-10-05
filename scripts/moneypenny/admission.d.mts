// Type surface for admission.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec
// that imports from it needs this (same arrangement as plan-claim.d.mts / work-mode.d.mts).
import type { WorkMode } from "./work-mode.mjs";

type Label = string | { name?: string };

export interface AdmissionIssue {
  number?: number;
  title?: string;
  state?: string;
  body?: string;
  labels?: readonly Label[];
  createdAt?: string;
  /** GitHub's dependency summary; the pull rule refuses `blocked_by > 0` (open blockers). */
  issue_dependencies_summary?: { blocked_by?: number };
}

export interface AdmissionVerdict {
  admit: boolean;
  reason: string;
  /** The in-flight issue this one waits behind, when the surface fence refused it. */
  queuedBehind?: number;
}

export type AdmissionMode = Pick<WorkMode, "position"> & {
  caps: Pick<WorkMode["caps"], "inFlightCap">;
};

export interface AdmissionDeps {
  readMode?: () => WorkMode | (AdmissionMode & { warning?: string; until?: string | null });
  readInFlight?: () => AdmissionIssue[];
  comments?: (n: number) => Array<{ body?: string }>;
  comment?: (n: number, body: string) => unknown;
  log?: (line: string) => void;
}

export const QUEUE_MARKER: string;
/** The capsule `Surface` cell, normalised (lowercase, markdown stripped); null when absent/empty. */
export function surfaceOf(body: unknown): string | null;
/** The pure gate: halt → conserve → in-flight cap → same-surface fence. */
export function admitBuild(opts: {
  issue: AdmissionIssue;
  inFlight?: readonly AdmissionIssue[];
  mode: AdmissionMode;
}): AdmissionVerdict;
/** The pullable issues (`pullable`, labels.mjs) in pick order: fast-track, rank class, oldest. */
export function pullQueue<T extends AdmissionIssue>(readyIssues: readonly T[]): T[];
/** The first `pullQueue` issue the gate admits now, or null (#4393: pullable issues only). */
export function nextAdmissible<T extends AdmissionIssue>(
  readyIssues: readonly T[],
  inFlight: readonly AdmissionIssue[],
  mode: AdmissionMode,
): T | null;
/** The comment a refused issue gets. */
export function queueNote(reason: string): string;
/** Did this lane's newest queue note already carry this reason? */
export function isDuplicateQueueNote(
  comments: ReadonlyArray<{ body?: string }> | undefined,
  reason: string,
): boolean;
/** Open issues carrying `label`, oldest first, over REST; PRs dropped. */
export function readOpenIssues(
  label: string,
  exec?: (cmd: string, args: string[]) => string,
): Array<Required<Pick<AdmissionIssue, "number" | "body" | "labels">> & AdmissionIssue>;
/** Open issues carrying `in-progress`, over REST; PRs dropped. */
export function readInFlight(
  exec?: (cmd: string, args: string[]) => string,
): Required<Pick<AdmissionIssue, "number" | "body" | "labels">>[];
/** The impure gate both claim lanes call before taking a lease. */
export function gateAdmission(issue: AdmissionIssue, deps?: AdmissionDeps): AdmissionVerdict;
/** Is it pullable at all (#4393 criterion 10), then would the gate admit it now (criterion 11)? */
export function checkAdmission(opts: {
  issue: AdmissionIssue;
  inFlight?: readonly AdmissionIssue[];
  mode: AdmissionMode;
}): AdmissionVerdict;
/** One issue over REST; throws on a PR number or an unreadable row. */
export function readIssue(
  n: number,
  exec?: (cmd: string, args: string[]) => string,
): Required<Pick<AdmissionIssue, "number" | "title" | "state" | "body" | "labels">> &
  AdmissionIssue;
export interface AdmissionCliIO {
  readMode?: AdmissionDeps["readMode"];
  readInFlight?: () => AdmissionIssue[];
  readReady?: () => AdmissionIssue[];
  readIssue?: (n: number) => AdmissionIssue;
  print?: (line: string) => void;
  printErr?: (line: string) => void;
}
/** The read-only CLI: `--check <n>` | `--next` | `--queue`. Returns the exit code (0 · 2 · 3). */
export function runCli(argv?: readonly string[], io?: AdmissionCliIO): number;
