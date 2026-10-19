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
/** One new structural problem: a checker `same_as` group, led by its first finding. */
export interface StructuralItem {
  /** round-contract.mjs → findingView */
  finding: Record<string, unknown> & { what: string; severity?: string | null };
  class?: string;
  /** How many more times the group reported it. */
  also: number;
  /** How many distinct members the group's findings came from. */
  members?: number;
  /** The worst severity across the group's reports; ranks and bylines it (else the lead's). */
  severity?: string | null;
  frames: string[];
}
export interface ReadoutModel {
  study: string;
  grade: Grade;
  picture: (Moment & { member: string; viewport: string }) | null;
  ownerShot: string | null;
  structural: StructuralItem[];
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
        jobs?: string[];
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
export const STRUCTURAL_TOP: number;
export const RANKING: string;
export function severityRank(raw: unknown): number;
export function worstSeverity<T>(list: T[]): T | null;
export function rankStructural<T extends StructuralItem>(items: T[]): T[];
export function structuralSection(model: {
  structural: StructuralItem[];
  grade: { structural: { refound?: Record<string, unknown>; held?: Record<string, unknown> } };
}): string[];
export function renderReadout(model: ReadoutModel): string;
