// Type surface for scripts/moneypenny/projects-sync.mjs — the board context #4183 added, which a
// spec exercises directly with injected readers (no network). The scripts/ tree is plain ESM with
// `allowJs` off (see index.d.mts for the same reasoning).
import type { BoardItem } from "./projects.d.mts";

export interface BoardItemPage {
  items?: BoardItem[];
  totalCount?: number;
}

export interface SyncIssueRef {
  number?: number | string;
  html_url?: string;
}

export interface BoardContext {
  items(opts?: { refresh?: boolean }): BoardItemPage;
  /** One issue's candidate board items, from the cached list if there is one, else asked of GitHub about that issue alone (#4439). */
  itemsFor(issue: SyncIssueRef): BoardItem[];
  fields(): { id: string; name: string; options?: { id: string; name: string }[] }[];
  project(): { id: string; number: number };
  noteAdded(item?: BoardItem): void;
}

export function createBoardContext(readers?: {
  readItems?: () => BoardItemPage;
  readFields?: () => { id: string; name: string; options?: { id: string; name: string }[] }[];
  readProject?: () => { id: string; number: number };
  readIssueItems?: (issue: SyncIssueRef) => BoardItem[];
  log?: (line: string) => void;
}): BoardContext;

export function readIssueItemsFromGh(
  issue: SyncIssueRef,
  deps?: { gh?: (argv: string[]) => string },
): BoardItem[];

export function readIssue(
  issueNumber: string,
  deps?: { read?: (path: string) => unknown; sleep?: (ms: number) => void },
): {
  number?: number;
  labels?: { name: string }[];
  state?: string;
  body?: string;
  html_url?: string;
  user?: { login?: string };
};

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
