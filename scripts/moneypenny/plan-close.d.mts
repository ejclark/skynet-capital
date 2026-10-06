// Type surface for plan-close.mjs — same arrangement as relay.d.mts: the scripts/ tree is plain ESM
// with `allowJs` off, so a spec that imports from it needs this.

type LabelLike = string | { name?: string };

export interface PlanIssue {
  readonly number: number;
  readonly title?: string;
  readonly body?: string | null;
  readonly labels?: readonly LabelLike[];
  readonly sub_issues_summary?: { total?: number; completed?: number };
  readonly heldNoted?: boolean;
}

export type PlanCloseVerdict =
  | { action: "skip"; why: string }
  | { action: "close"; why: string[] }
  | { action: "hold"; why: string[]; unchecked: string[] };

export interface PlanCloseIntent {
  readonly kind: "close-plan" | "hold-plan-close";
  readonly issueNumber: number;
  readonly title?: string;
  readonly body: string;
}

export const HELD_MARKER: string;
export const HOLD_LABELS: string[];
export const PLAN_CLOSE_CAP: number;

export function uncheckedCriteria(body?: string | null): string[];
export function planCloseVerdict(issue: PlanIssue | null | undefined): PlanCloseVerdict;
export function routePlanClose(deps?: {
  openPlans?: readonly PlanIssue[];
  planCloseCap?: number;
}): PlanCloseIntent[];
export function heldAlreadyNoted(
  comments?: readonly { user?: { login?: string }; body?: string }[],
): boolean;
export function gatherPlanCloseDeps(
  open?: readonly PlanIssue[],
  opts?: {
    readComments?: (number: number) => readonly { user?: { login?: string }; body?: string }[];
  },
): PlanIssue[];
export function executePlanClose(
  intent: PlanCloseIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
