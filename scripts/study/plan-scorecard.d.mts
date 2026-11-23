// Type surface for plan-scorecard.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

export interface Range {
  lo: number;
  hi: number;
}
export interface PlanSession {
  rel: string;
  viewport: string;
  success: boolean;
  lostness: number | null;
  backtracks: number | null;
  chat: { kind: string; n: number; said?: string; drafts?: { kind: string }[] }[];
}
export interface ChatLabel {
  session: string;
  n: number;
  friction: boolean;
  why?: string;
}
export interface ViewportRow {
  sessions: number;
  succeeded: number;
  rate: number | null;
  wilson: Range | null;
  lostness: number | null;
  backtracks: number | null;
}
export type ChatRecall =
  | { messages: number; labelled: false }
  | {
      messages: number;
      labelled: true;
      unlabelled: number;
      voiced: number;
      drafted: number;
      rate: number | null;
      wilson: Range | null;
    };
export interface PlanScorecard {
  byViewport: Record<string, ViewportRow>;
  chat: ChatRecall;
}

export function median(values: (number | null | undefined)[]): number | null;
export function chatRecall(sessions: PlanSession[], labels: ChatLabel[] | null): ChatRecall;
export function planScorecard(input: {
  sessions: PlanSession[];
  labels?: ChatLabel[] | null;
}): PlanScorecard;
export function planScorecardLines(card: PlanScorecard): string[];
