// Type surface for reeval.mjs: scripts/ is plain ESM.
import type { Markers } from "./markers.mjs";
import type { ReviewApi } from "./rest.mjs";

export interface Thread {
  id: string;
  file?: string;
  line?: number | null;
  outcome: "fixed" | "declined" | "open";
  why: string;
  sha?: string | null;
  reason?: string;
}
export interface Reevaluation {
  state: "success" | "failure";
  description: string;
  released: boolean;
  round: number;
  threads: Thread[];
  outcomes: { id: string; outcome: string; sha?: string | null; reason?: string }[];
}

export const MIN_REASON_CHARS: number;
export function reevaluate(input?: {
  markers?: Markers;
  commits?: string[];
  commitFiles?: Record<string, string[]>;
  maxRounds?: number;
}): Reevaluation;
export function gatherReeval(
  number: number,
  opts?: { api?: ReviewApi },
): { markers: Markers; commits: string[]; commitFiles: Record<string, string[]>; head: string };
