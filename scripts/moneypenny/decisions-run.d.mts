// Type surface for scripts/moneypenny/decisions-run.mjs (see index.d.mts).
import type { ReplyComment } from "./answer-readback.mjs";
import type { DecisionsIntent, NeedsYouRow, PageIssue } from "./decisions-page.mjs";

export interface DecisionsDeps {
  needsYou: NeedsYouRow[];
  issues: PageIssue[];
  page: PageIssue | null;
  comments: ReplyComment[];
}
type Rest = (path: string) => unknown;

export function findPage(rest?: Rest): PageIssue | null;
export function gatherDecisions(input?: {
  assignments?: Record<string, unknown> | null;
  rest?: Rest;
  now?: number;
}): DecisionsDeps | null;
export function routeDecisions(deps?: {
  decisions?: DecisionsDeps | null;
  closing?: Set<number>;
  now?: number;
}): DecisionsIntent[];
export function executeDecisions(
  intent: DecisionsIntent,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
    rest?: Rest;
    read?: Rest;
    lease?: {
      claim: (slug: string) => { claimed: boolean; reason?: string };
      release: (slug: string) => void;
    } | null;
    ensure?: (label: unknown) => void;
  },
): string;
export function receiptComment(input: {
  replyId: number;
  outcomes?: readonly { n: number; number: number; said: string; done: string }[];
  unread?: readonly { raw: string; why: string }[];
  notes?: readonly string[];
}): string;
