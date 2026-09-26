export type Landing = {
  sha: string;
  pr: number | null;
  subject: string;
  flattened: boolean;
  items: { item: string; why: string; revert: string }[];
};
export function wrapLabel(text: string, width?: number): string;
export function openPicture(count: number | string): string;
export function landedPicture(landing: Landing): string;
export function findLanding(logText: string, pr: number | string): Landing | null;
