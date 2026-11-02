// Type surface for session-hold.mjs — same arrangement as pickup-hold.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export const LANE_HOLDER: "lane";
export const SESSION_HOLDER: "session";
export function holderLine(holder?: string): string;
export function holderOf(message?: string | null): string;
export function lastActivityMs(
  takenMs: number,
  activityMs?: ReadonlyArray<number | undefined>,
): number;

export interface Lease {
  readonly takenMs: number;
  readonly holder: string;
}

export function continuationLeaseVerdict(
  lease: Lease | null,
  pick: { mergedMs?: number; blockEditedMs?: number } | undefined,
  nowMs: number,
  ttlMs: number,
): { action: "leave" | "release"; reason: string };
