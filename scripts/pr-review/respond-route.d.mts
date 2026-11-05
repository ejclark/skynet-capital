// Type surface for respond-route.mjs: scripts/ is plain ESM.
import type { Markers } from "./markers.mjs";
import type { Json, ReviewApi } from "./rest.mjs";
import type { Gate } from "./triage.mjs";

export interface RespondVerdict {
  dispatch: boolean;
  reason: string;
  marker?: string;
}
export interface RespondInput {
  pr?: Record<string, Json>;
  files?: string[];
  round?: number;
  importantOpen?: number;
  gate?: Gate | null;
  rules?: { pattern: string; why?: string }[];
  markers?: Markers;
  defaultBranch?: string;
}

export const MAX_ROUNDS: number;
export function routeRespond(input?: RespondInput): RespondVerdict;
export function gatherRespond(
  number: number,
  opts?: {
    api?: ReviewApi;
    gate?: () => Gate;
    rules?: RespondInput["rules"] | (() => RespondInput["rules"]);
  },
): Required<Pick<RespondInput, "pr" | "files" | "markers" | "gate" | "rules">>;
export function respondLine(verdict: RespondVerdict, footer: string): string;
