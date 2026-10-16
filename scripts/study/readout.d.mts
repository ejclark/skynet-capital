// Type surface for readout.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

export interface ReadoutOptions {
  grade: string;
  round: string;
  study: string;
  nextArea: string;
  cost: string;
  ownerShot?: string;
  battle?: string;
  battleReason?: string;
  jobMap?: string;
  picture?: string;
  reveal?: boolean;
  sealed?: string;
  root: string;
}

export const FRAME_CAP: number;
export function jobMapOf(j: Record<string, unknown>): {
  stages: { stage: string; served?: boolean; outcomes?: string[]; holds?: string }[];
  measure: string[];
  jobs: string[];
};
export function readoutArgs(argv: string[]): ReadoutOptions;
export function copySmall(src: string, dest: string): string;
export function insideRoot(root: string, path: string): string;
export function buildReadout(opts: ReadoutOptions): {
  page: string;
  shots: string;
  markdown: string;
};
