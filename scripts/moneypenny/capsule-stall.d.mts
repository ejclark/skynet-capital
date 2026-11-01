// Type surface for capsule-stall.mjs (#5727) — the scripts/ tree is plain ESM with `allowJs` off, so
// a spec that imports from it needs this (the pattern audit.d.mts mirrors).
export const ORPHAN_AFTER_HOURS: number;
export const GREEN_PUSHES: number;
export const ORPHAN_MARKER: string;
export const PROVEN_MARKER: string;
export const ERODED_MARKER: string;
export const RECURRENCE: string;

type Label = { name?: string } | string;
export interface CapsuleStep {
  name?: string;
  conclusion?: string | null;
}
export interface CapsuleJob {
  name?: string;
  conclusion?: string | null;
  steps?: readonly CapsuleStep[];
}
export interface CapsuleRun {
  id: number;
  url?: string;
  createdAt: string;
  jobs: readonly CapsuleJob[];
}
export interface Capsule {
  number: number;
  title: string;
  body?: string;
  createdAt: string;
  ageHours: number;
  labels: readonly Label[];
  comments?: readonly string[];
  /** When the fault last came back (the newest trusted `Failed again` comment), if ever. */
  recurredAt?: string;
  hasLinkedPr?: boolean;
  recentRuns?: readonly CapsuleRun[];
  /** The PR a red-PR capsule tracks (#6605), as last read. */
  redPr?: { number: number; state?: string; merged: boolean };
}
export interface CapsuleIntent {
  kind: "flag-capsule-orphan" | "close-proven-capsule";
  issueNumber: number;
  title: string;
  body: string;
  /** On a close: the capsule carries `needs-eric`, which comes off before the close. */
  clearNeedsEric?: boolean;
  /** On a close: what to report instead of "is passing again". */
  said?: string;
}
export interface TimelineEvent {
  event?: string;
  source?: { issue?: { state?: string; pull_request?: { merged_at?: string | null } } };
}
type Run = (cmd: string, args: string[]) => string;

type Target = { workflow: string; job: string; step?: string };
export function capsuleTarget(issue?: { body?: string | null; title?: string }): Target | null;
export function jobVerdict(
  jobs: readonly CapsuleJob[] | undefined,
  job: string,
  step?: string,
): "pass" | "fail" | null;
export function jobPassed(
  jobs: readonly CapsuleJob[] | undefined,
  job: string,
  step?: string,
): boolean;
export function hasLinkedPr(timeline?: readonly TimelineEvent[], since?: string): boolean;
export function lookupsFor(
  issue: { labels?: readonly Label[]; created_at?: string; createdAt?: string },
  nowMs: number,
  orphanAfterHours?: number,
): { orphan: boolean };
export function provenRuns(
  runs: readonly CapsuleRun[] | undefined,
  target: Target,
  n?: number,
): { passes: CapsuleRun[]; ended: boolean };
/** Epoch ms the proof counts from: the filing, or the last recurrence if later. */
export function proofCut(capsule: Pick<Capsule, "createdAt" | "recurredAt">): number;
export function greenProof(capsule: Capsule, n?: number): (Target & { runs: CapsuleRun[] }) | null;
export function capsuleIntents(deps?: {
  capsules?: readonly Capsule[];
  orphanAfterHours?: number;
}): CapsuleIntent[];
export function gatherCapsules(
  nowMs: number,
  io?: { rest?: (path: string) => unknown; restAll?: (path: string) => unknown[] },
): Capsule[];
export function capsuleAudit(
  fixture: { capsules?: readonly Capsule[] } | undefined,
  opts?: { gather?: (nowMs: number) => Capsule[]; nowMs?: number },
): CapsuleIntent[];
export function flagCapsuleOrphan(
  i: CapsuleIntent,
  io?: { run?: Run; ensure?: (label: { name: string }) => void },
): string;
export function closeProvenCapsule(i: CapsuleIntent, io?: { run?: Run }): string;
