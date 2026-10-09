// Type surface for readout-core.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

import type { Grade } from "./grade-round.mjs";

export interface Moment {
  step: number;
  confusion: number;
  before: string;
  after: string | null;
  action: string;
  quote: string;
}
export interface ReadoutModel {
  study: string;
  grade: Grade;
  picture: (Moment & { member: string; viewport: string }) | null;
  ownerShot: string | null;
  structural: {
    finding: Record<string, unknown> & { what: string };
    class?: string;
    also: number;
    frames: string[];
  }[];
  titles: Record<string, string> | null;
  battle: {
    fork: string;
    least: string;
    shapes: {
      name: string;
      success: number;
      wrongTurns: number;
      involuntaryScroll: number;
      ease: number;
      frame?: string | null;
    }[];
  } | null;
  battleReason: string;
  jobMap:
    | { kind: "md"; text: string }
    | {
        kind: "json";
        stages: { stage: string; served?: boolean; outcomes?: string[]; holds?: string }[];
        measure?: string[];
      }
    | null;
  nextArea: string;
  cost: string;
}

export const SECTIONS: string[];
export function actionWords(
  action: Record<string, unknown> | undefined,
  record?: { tap?: { hit?: { name?: string } } },
): string;
export function worstMoment(
  turns: Record<string, unknown>[],
  trace: Record<string, unknown>[],
): Moment | null;
export function formulaSentence(f: {
  what?: string;
  principle?: string;
  why?: string;
  fix?: string;
}): string;
export function renderReadout(model: ReadoutModel): string;
