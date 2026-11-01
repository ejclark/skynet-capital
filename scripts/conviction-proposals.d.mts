// Type surface for conviction-proposals.mjs — same arrangement as bottleneck-baseline.d.mts (scripts/
// is plain ESM with `allowJs` off, so a spec importing it needs this).

export const CONVICTIONS_DIR: string;

export interface Proposal {
  /** `<conviction-slug>/<Id>`, e.g. `ai-dip-2026-10/P3` — what the lane cites to answer it. */
  key: string;
  /** The event id whose fragment the row belongs in. */
  fragment: string;
  scoreBy: string;
  hypothesis: string;
}

export function parseProposals(slug: string, text: string): Proposal[];
export function citesToken(key: string, text: string): boolean;
export function pendingFor(
  eventId: string,
  today: string,
  proposals: Proposal[],
  answeredText: string,
): Proposal[];
export function loadProposals(dir?: string): Proposal[];
export function answeredTextFor(
  eventId: string,
  dirs?: { fragmentDir?: string; ledgerDir?: string },
): string;
