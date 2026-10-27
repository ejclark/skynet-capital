// Type surface for scripts/steer/areas.mjs (scripts/ ships hand-written declarations).
import type { Decision } from "./model.mjs";

/** A manifest area: a number kept across rounds, a section's label or a box per frame. */
export interface AreaSpec {
  n: number;
  label?: string;
  box?: { phone?: number[]; desk?: number[] };
  problem?: string;
  words?: string;
}
/** An area resolved on one frame, every number in % of the frame. */
export interface Area {
  n: number;
  label: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  words: string;
  problem: string | null;
  /** An active area's line height, or null (inactive, or no clear height). */
  ly: number | null;
}

export const AREA_MAX_WORDS: number;
export const LANE: number;
export const AREAS_HOW: string;
export function wordCount(s: string | null | undefined): number;
export function areaSpecProblems(q: { areas?: unknown; active?: unknown }, at: string): string[];
export function lineY(
  a: { x: number; y: number; w: number; h: number },
  all: { x: number; y: number; w: number; h: number }[],
): number | null;
export function areasFor(
  spec: { areas?: AreaSpec[]; active?: number[] },
  pic: {
    size: "phone" | "desk";
    sections?: { label: string; x: number; y: number; w: number; h: number }[];
  },
): Area[];
export function areaAt<T extends { x: number; y: number; w: number; h: number }>(
  areas: T[] | null | undefined,
  x: number,
  y: number,
): T | null;
export function hasAreas(d: Partial<Decision> | null | undefined): boolean;
export function arealFrame(
  inner: string,
  areas: Area[],
): { cls: string; attrs: string; inner: string };
