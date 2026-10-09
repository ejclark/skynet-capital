// Type surface for round-frames.mjs (`allowJs` is off).

export const MAX_IMAGES: number;
export const BATCH: number;

export interface KeyFrame {
  path: string;
  route: string | null;
  why: string[];
  turns: number[];
}
export function keyFrames(args: {
  turns: Record<string, unknown>[];
  trace: Record<string, unknown>[];
  opening: string;
  start: string;
}): KeyFrame[];
export function capFrames<S extends { frames: KeyFrame[] }>(
  sessions: S[],
  max?: number,
): { sessions: S[]; dropped: number };

export interface Batch {
  source: string;
  route: string;
  viewport: string;
  entries: Record<string, unknown>[];
}
export function batchCensus(
  censuses: { source: string; entries: Record<string, unknown>[] }[],
  size?: number,
): Batch[];
export function batchFrames(
  entries: Record<string, unknown>[],
): { label: string; rel: string; which: string; order: number; name: string }[];
