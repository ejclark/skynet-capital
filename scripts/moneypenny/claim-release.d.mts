// Type surface for claim-release.mjs — same arrangement as session-hold.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export const EXPIRED_SWEEP_CAP: number;

export interface Lease {
  readonly takenMs: number;
  readonly holder?: string;
}

export interface Release {
  readonly slug: string;
  readonly reason: string;
}

export function mergedPrNumbers(payload?: unknown): number[];
export function feedbackIssueOf(headRef?: string | null): number | null;

export function mergeReleaseVerdict(input?: {
  mergedMs?: number;
  lease?: Lease | null;
  inProgress?: boolean;
}): { action: "release" | "leave"; reason: string };

export function buildEndVerdict(input?: {
  waitingOnMember?: boolean;
  lanePrs?: ReadonlyArray<{ state: string; createdMs: number }> | null;
  leaseTakenMs?: number;
  stillPullable?: boolean;
}): { release: boolean; reason: string };

export function closedIssueClaims(
  refs?: ReadonlyArray<{ ref?: string }>,
  openNumbers?: ReadonlySet<number>,
  cap?: number,
): string[];

export function gatherMergeReleases(
  payload: unknown,
  deps: {
    readPr: (n: number) => { head?: { ref?: string }; merged_at?: string | null } | null;
    readLease: (slug: string) => Lease | null;
    readIssueLabels: (n: number) => string[];
    log?: (line: string) => void;
  },
): Release[];

export function gatherExpiredClaims(deps: {
  readRefs: () => ReadonlyArray<{ ref?: string }>;
  openNumbers: ReadonlySet<number>;
  readLease: (slug: string) => Lease | null;
  nowMs: number;
  ttlMs: number;
  cap?: number;
}): Release[];
