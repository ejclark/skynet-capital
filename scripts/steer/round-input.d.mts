// Type surface for scripts/steer/round-input.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations).
export const INPUT_FILE: string;

export interface RoundPicture {
  src: string;
  local?: string | null;
  [k: string]: unknown;
}

export interface BuiltStamp {
  sha: string | null;
  at: string | null;
  pageSha256: string;
  bytes: number;
}

export interface RoundInput {
  id: string;
  decisions: unknown[];
  generatedAt?: string | null;
  built?: BuiltStamp;
  [k: string]: unknown;
}

export function decisionPictures(tp: unknown): { pic: RoundPicture; published: string }[];
export function builtStamp(
  html: string,
  from?: { sha?: string | null; at?: string | null },
): BuiltStamp;
export function inputToPublish<T extends object>(
  tp: T,
  built: BuiltStamp,
): T & { built: BuiltStamp };
