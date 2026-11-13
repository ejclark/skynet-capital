// Type surface for triage-assess.mjs (#7544), the filing check's pure core. The scripts/ tree is
// plain ESM with `allowJs` off, so the spec that imports it needs this.

export interface Gate {
  dispatch: boolean;
  position?: string;
  reason?: string;
}
export interface Ctx {
  eventName?: string;
  action?: string;
  payload?: Record<string, unknown>;
}
export interface Check {
  pass: boolean;
  evidence?: string;
}
export interface Judged {
  issue?: number;
  title?: string;
  state?: string;
  labels?: Array<string | { name: string }>;
  checks?: Record<string, Check | unknown>;
  touchedPaths?: string[];
  comment?: string;
  memberAsks?: string[];
  plainReason?: string;
}
export interface Vote {
  refuted: boolean;
  line: string;
}
export interface FlipResult {
  survivors: Record<string, unknown>[];
  refuted: Array<{ issue: number; title: string; verifiers: string[] }>;
  notClear: Array<{ issue: number; title: string; failed: string[] }>;
}
export type Mode = "filing" | "followup";

export const CHECKS: string[];
export const MEMBER_ANSWERABLE: string[];
export const ASSESS_POSITIONS: string[];
/** Should this event start an assessment, and in which mode? */
export function assessIntent(
  ctx: Ctx,
  gate: Gate,
): { assess: boolean; reason: string; mode?: Mode; number?: number };
/** The checks that failed; empty means clear. */
export function failedChecks(judged: Judged | null, mode?: Mode): string[];
/** Judge + refuters → a clear-path-flip-shaped result. */
export function assemble(input: {
  number: number;
  judged: Judged | null;
  envelope?: Vote | null;
  thread?: Vote | null;
  mode?: Mode;
}): FlipResult;
/** The one write an outcome authorizes. */
export function planWrite(
  result: FlipResult,
  judged: Judged | null,
  mode?: Mode,
): {
  kind: "ready" | "ask" | "backlog";
  issue: number;
  body: string;
  remove: string[];
  add: string[];
};
/** Why to skip writing now, or null. */
export function liveSkip(issue: unknown, mode?: Mode): string | null;
export const TRUSTED_ASSOCIATIONS: string[];
export const TRUSTED_BOTS: string[];
/** The comments a session may read: repo members and this repo's bots. */
export function trustedComments<
  T extends { author_association?: string; user?: { login?: string } },
>(comments?: T[]): T[];
/** One flattened, defused, capped line of session text. */
export function clean(text: unknown, max?: number): string;
/** The flip comment, built from the four checks. */
export function flipComment(judged: Judged | null): string;
