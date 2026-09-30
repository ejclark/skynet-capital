// Type surface for scripts/moneypenny/projects-sync.mjs — the board context #4183 added, which a
// spec exercises directly with injected readers (no network). The scripts/ tree is plain ESM with
// `allowJs` off (see index.d.mts for the same reasoning).
import type { BoardItem } from "./projects.d.mts";

export interface BoardItemPage {
  items?: BoardItem[];
  totalCount?: number;
}

export interface BoardContext {
  items(opts?: { refresh?: boolean }): BoardItemPage;
  fields(): { id: string; name: string; options?: { id: string; name: string }[] }[];
  project(): { id: string; number: number };
  noteAdded(item?: BoardItem): void;
}

export function createBoardContext(readers?: {
  readItems?: () => BoardItemPage;
  readFields?: () => { id: string; name: string; options?: { id: string; name: string }[] }[];
  readProject?: () => { id: string; number: number };
}): BoardContext;

export function syncIssue(
  issueNumber: string,
  opts?: { horizon?: string; board?: BoardContext },
):
  | { skipped: true; reason: string }
  | {
      status: string;
      horizon: string | null;
      added: boolean;
      decisionCalloutMissing?: boolean;
    };
