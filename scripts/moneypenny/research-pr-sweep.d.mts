import type { AuditIntent } from "./audit.mjs";

/** What landed a superseded PR's research on `main`: its PR when GitHub links one, else its commit. */
export interface ResearchSuccessor {
  sha: string;
  pr: number | null;
}
/** One `research/<id>` PR open past the floor, as the audit gathers it. */
export interface ResearchPr {
  number: number;
  title: string;
  eventId: string;
  branch: string;
  /** Whole hours since the PR opened. */
  hours: number;
  headSha: string;
  /** Set when it conflicts and `main`'s ledger is assessed on or after the PR's. */
  superseded: {
    prAssessed: string;
    mainAssessed: string;
    successor: ResearchSuccessor | null;
  } | null;
  /** The newest failed check that holds it, or null. */
  red: { name: string; url?: string } | null;
  /** The head sha the newest red flag on the PR names, or null. */
  flaggedSha: string | null;
}
export interface CloseSupersededIntent extends AuditIntent {
  kind: "close-superseded-research";
  prNumber: number;
  branch: string;
  eventId: string;
  successor: ResearchSuccessor | null;
  body: string;
}
export interface FlagRedResearchIntent extends AuditIntent {
  kind: "flag-red-research";
  prNumber: number;
  headSha: string;
  body: string;
}
export interface ResearchSweepReport extends AuditIntent {
  kind: "report-research-sweep";
  open: number;
  rearmed: number;
  closed: number;
  flagged: number;
  left: number;
  line: string;
}
type RestOpts = {
  hours?: number;
  rest?: (path: string) => unknown;
  readMain?: (eventId: string) => string | null;
};

export const RESEARCH_PR_HOURS: number;
export const RESEARCH_RED_MARKER: RegExp;
export function lastAssessed(text: string | null | undefined): string | null;
export function isSuperseded(x: {
  conflicting: boolean;
  prAssessed: string | null;
  mainAssessed: string | null;
}): boolean;
export function lastRedFlagSha(comments?: { body?: string }[]): string | null;
export function researchSweepIntents(
  candidates?: ResearchPr[],
): (CloseSupersededIntent | FlagRedResearchIntent)[];
export function researchSweepReport(
  candidates?: ResearchPr[],
  sweep?: { kind: string }[],
  rearmed?: { prNumber: number }[],
): ResearchSweepReport;
export function researchSweep(
  candidates: ResearchPr[] | null | undefined,
  rearmed?: { prNumber: number }[],
  halted?: boolean,
): (CloseSupersededIntent | FlagRedResearchIntent | ResearchSweepReport)[];
export function gatherResearchPrs(nowMs: number, opts?: RestOpts): ResearchPr[];
export function researchPrsOrNone(
  nowMs: number,
  opts?: RestOpts & { log?: (line: string) => void },
): ResearchPr[] | null;
export function closeSupersededResearch(
  i: CloseSupersededIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
export function flagRedResearch(
  i: FlagRedResearchIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
export function reportResearchSweep(
  i: ResearchSweepReport,
  opts?: { log?: (line: string) => void },
): string;
