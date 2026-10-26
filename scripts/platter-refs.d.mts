// Type surface for scripts/platter-refs.mjs — which issues each boarded platter item closes or is
// part of (#4562). The scripts/ tree is plain ESM with `allowJs` off.
export type ItemRefs = { closes: number[]; refs: number[] };

export function parseIssueList(text: string | null | undefined): number[];
export function stripCode(text: string | null | undefined): string;
export function itemRefs(input?: {
  item?: string;
  subject?: string;
  closes?: number[];
  partOf?: number[];
  prBody?: string;
}): ItemRefs;
export function trailerLines(refs?: Partial<ItemRefs>): string[];
export function parseBoarded(log: string | null | undefined): ItemRefs[];
export function summaryBullets(items?: ItemRefs[]): string[];
