// Type surface for the parts of red-session-pr.mjs a spec imports directly: scripts/ is plain ESM.
export interface RedPrFailure {
  job: string;
  step?: string;
  logTail?: string;
}
export interface RedPrGate {
  dispatch: boolean;
  reason: string;
}
export interface RedPrIntent {
  type: "skip" | "say-on-pr" | "open-issue";
  issue?: number;
  reason?: string;
  /** say-on-pr: the PR to speak on. */
  number?: number;
  title?: string;
  body?: string;
  labels?: string[];
  dispatch?: boolean;
  /** open-issue: the line for the PR, with `CAPSULE_SLOT` where the capsule's number goes. */
  sayOnPr?: { number: number; body: string };
}
export interface RedPrDeps {
  pr?: Record<string, unknown> & { number?: number };
  files?: string[];
  comments?: Record<string, unknown>[];
  gate?: RedPrGate;
  rules?: { pattern: string; why?: string }[];
  openIssues?: { number: number; title: string }[];
}

export const RED_ATTEMPT_CAP: number;
export const CAPSULE_SLOT: string;
export function markerFor(sha: string, attempted: boolean): string;
export function capsuleTitle(number: number): string;
export function routeRedSessionPr(
  ctx: { run?: Record<string, unknown>; defaultBranch?: string; failures?: RedPrFailure[] },
  deps?: RedPrDeps,
): RedPrIntent[];
export function gatherRedSessionPr(
  run: Record<string, unknown>,
  failures: RedPrFailure[],
  opts?: {
    rest?: (path: string) => unknown;
    gate?: () => RedPrGate;
    rules?: RedPrDeps["rules"] | (() => RedPrDeps["rules"]);
    defaultBranch?: string;
  },
): RedPrDeps;
export function sayOnPr(
  number: number,
  body: string,
  opts?: { run?: (cmd: string, args: string[]) => string },
): void;
