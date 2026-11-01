// Type surface for scripts/steer/rebuild-rounds.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations).
import type { OpenRound } from "./open-rounds.mjs";

export interface RebuiltPage {
  issue: number;
  id: string;
  url: string;
  source: string;
  file_path: string;
  files: Record<string, string>;
  capabilities: Record<string, object>;
  keptOnPage: number;
  bytes: { was: number | null; now: number };
  changed: string[] | null;
}

export interface RoundRow {
  issue: number;
  id: string | null;
}

export interface RebuildResult {
  tooling: string;
  publish: RebuiltPage[];
  current: RoundRow[];
  failed: (RoundRow & { url: string | null; why: string })[];
  fetch: { id: string; url: string; path: string }[];
  settled: RoundRow[];
  unreadable: string[];
  out: string;
}

export function rebuildRounds(
  rounds: OpenRound[],
  opts: {
    roots: string[];
    out: string;
    tooling: string;
    now?: string;
    commits?: (was: { sha?: string | null; at?: string | null }) => string[] | null;
  },
): RebuildResult;
export function reportText(result: RebuildResult): string;
