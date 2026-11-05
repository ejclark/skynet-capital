// Type surface for post.mjs: scripts/ is plain ESM.
import type { Markers } from "./markers.mjs";
import type { RespondVerdict } from "./respond-route.mjs";
import type { Json, ReviewApi } from "./rest.mjs";
import type { PrFile } from "./triage.mjs";

export interface Finding {
  severity: string;
  category: string;
  file: string;
  line: number;
  summary: string;
  detail: string;
  lens: string;
  id: string;
}
export interface Dropped {
  file: string;
  line: number | null;
  why: string;
}
export interface Status {
  state: "success" | "failure";
  context: string;
  description: string;
}
export interface BuiltReview {
  review: {
    commit_id: string;
    event: "COMMENT";
    body: string;
    comments: { path: string; line: number; side: "RIGHT"; body: string }[];
  };
  status: Status;
}
type Place = {
  file?: string;
  line?: number | null;
  lens?: string;
  round?: number;
  summary?: string;
};

export const CAPS: { important: number; nit: number };
export const STATUS_CONTEXT: string;
export function sameDefect(f: Place, g: Place): boolean;
export function hunksOf(patch: string | null | undefined): { start: number; end: number }[];
export function suppressedCategories(markdown: string | null | undefined): string[];
export function parseReviewJson(text: string): { findings: unknown[] };
export function checkFindings(
  findings: unknown[],
  opts?: { files?: PrFile[]; suppressed?: string[]; prior?: Place[]; round?: number },
): { kept: Finding[]; dropped: Dropped[] };
export function buildReview(input: {
  kept?: Finding[];
  dropped?: Dropped[];
  sha: string;
  round: number;
  tier: string;
  patchId?: string | null;
  respond?: RespondVerdict | null;
  gateOn?: boolean;
}): BuiltReview;
export function gatherPost(
  number: number,
  opts?: { api?: ReviewApi },
): {
  pr: Json;
  files: PrFile[];
  suppressed: string[];
  prior: Place[];
  markers: Markers;
  round: number;
};
export function runPost(
  args: string[],
  deps?: { api?: ReviewApi; gate?: () => { dispatch: boolean; position: string; reason?: string } },
): string;
