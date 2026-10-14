// Type surface for scripts/steer/outcomes.mjs (scripts/ ships hand-written declarations).
import type { Decision, Saved } from "./model.mjs";

/** An outcome he added, as the read-back has it. */
export interface AddedOutcome {
  id: string;
  text: string;
  at: string;
}

export const MAX_OUTCOME: number;
export const OUTCOME_ID: RegExp;
export const OUTCOME_WORDS: Record<
  "add" | "head" | "by" | "field" | "placeholder" | "save" | "cancel" | "remove",
  string
>;
export const OUTCOME_CLIENT: typeof OUTCOME_WORDS & { max: number };
export const OUTCOMES_HEAD: string;
/** The follow-up an added outcome raises: reachable by today's design, or a plan issue. */
export const CLASSIFY: string;
export function outcomesControl(d: Partial<Decision> & { key: string }): string;
export function addedOutcomes(r: Saved | null | undefined): AddedOutcome[];
export function outcomesSaid(r: Saved | null | undefined): boolean;
export function outcomesBlock(r: Saved | null | undefined): string;
export function outcomesOf(
  d: Pick<Decision, "issue" | "key">,
  r: Saved | null | undefined,
): { issue: number; key: string; text: string; at: string }[];
