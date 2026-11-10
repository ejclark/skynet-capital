// Type surface for triage.mjs: scripts/ is plain ESM.
import type { Receipt } from "./markers.mjs";
import type { ReviewApi } from "./rest.mjs";

export interface Gate {
  dispatch: boolean;
  position: string;
  reason?: string;
  caps?: Record<string, number>;
}
export interface PrFile {
  filename: string;
  previous_filename?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}
export interface TriageInput {
  files?: PrFile[];
  patchId?: string | null;
  lastReceipt?: Pick<Receipt, "patchId" | "round"> | null;
  gate?: Gate | null;
  spentToday?: number;
  rules?: { pattern: string; why?: string }[];
}
export interface TriageVerdict {
  tier: "skip" | "light" | "standard" | "deep";
  review: boolean;
  reason: string;
  model: string | null;
  refuters: number;
  estTokens: number;
  adversarial?: boolean;
  lines?: number;
  risky?: string[];
  position?: string;
  budget?: number;
  spentToday?: number;
  reuse?: unknown;
}

export const LIGHT_MAX_LINES: number;
export const OVER_BUDGET_STOP: number;
export const DAILY_TOKEN_BUDGET: Record<string, number>;
export const TIER_PLAN: Record<
  string,
  { model: string | null; refuters: number; estTokens: number }
>;
export function budgetFor(gate: Gate | null | undefined): number;
export function triage(input?: TriageInput): TriageVerdict;
export function patchIdOf(
  base: string,
  head: string,
  opts?: { run?: (cmd: string, args: string[], opts?: object) => string },
): string | null;
export function gatherTriage(
  number: number,
  opts?: {
    api?: ReviewApi;
    gate?: () => Gate;
    rules?: TriageInput["rules"] | (() => TriageInput["rules"]);
    patchId?: (base: string, head: string) => string | null;
    now?: () => Date;
  },
): Required<Omit<TriageInput, "lastReceipt" | "gate">> & Pick<TriageInput, "lastReceipt" | "gate">;
