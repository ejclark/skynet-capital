/**
 * What an open filing is waiting on, why, and what would move it — the fields Moneypenny's
 * `get_work_status` adds beside the status words, so she can explain a stall instead of
 * repeating a badge (the Moneypenny operator plan, slice filing-wait-explained).
 *
 * WHY THIS EXISTS. A filing from the rail carries no build spec, so it lands in the backlog with
 * no `ready` label and nothing builds it; #6007 (Eric's own rail filing) sat 15 days that way and
 * #6271 counted 2 app filings, 0 readied, 0 shipped in 30 days. The badge said "Filed — waiting
 * to be picked" and nothing told the member who picks it, or what would get it picked sooner.
 *
 * Pure (no network, no node), beside `feedback-status.ts`, which it must agree with: the checks
 * run in the same order as `statusFromIssue` (a question outranks the build claim), and
 * `tests/domain/work-waiting.spec.ts` proves the two never contradict for any label set in its
 * table. Label meanings come from `scripts/moneypenny/labels.mjs` (`needs-session`: a remainder
 * the lane handed to a person's working session; nothing unattended builds it). The words never
 * name a label and never carry a date or say that it ships: what an issue waits on is honest,
 * when it ships is not knowable here. A pull request that references an issue may be one slice of
 * several, so even "being built" never promises the issue is done when that pull request merges.
 */

export interface Waiting {
  readonly on:
    | "nobody has picked it"
    | "a decision from Eric"
    | "an answer from the person who filed it"
    | "a free build session"
    | "a person opening a working session"
    | "nothing: a build session has it";
  readonly why: string;
  readonly next: string;
}

const NOBODY: Waiting = {
  on: "nobody has picked it",
  why: "Nobody has marked it ready to build yet. A filing from the chat is not built automatically; it waits in the backlog until a triage pass or Eric marks it ready.",
  next: "It gets picked sooner when it says what done looks like, is small, and needs no decision.",
};

const ERIC: Waiting = {
  on: "a decision from Eric",
  why: "It waits on a decision only Eric can make.",
  next: "Eric answers on the issue.",
};

const FILER: Waiting = {
  on: "an answer from the person who filed it",
  why: "The build session asked a question and waits for the answer.",
  next: "Answer the question on the issue thread.",
};

const FREE_SESSION: Waiting = {
  on: "a free build session",
  why: "It is cleared to build and waits for a free build session.",
  next: "Nothing is needed from you.",
};

const WORKING_SESSION: Waiting = {
  on: "a person opening a working session",
  why: "What is left needs a person to open a working session on it.",
  next: "Nothing is needed from you.",
};

const BEING_BUILT: Waiting = {
  on: "nothing: a build session has it",
  why: "A build session has it.",
  next: "Nothing is needed from you. Its changes have to merge and a deploy has to land before any of it is live.",
};

/** What an issue waits on, from its state, its FULL label list and the open pull requests that
 *  reference it. `undefined` once it is closed or merged: nothing is waiting any more. */
export function waitingOn(
  state: string,
  labels: readonly string[],
  openPullRequests: readonly number[],
): Waiting | undefined {
  if (state !== "open") return undefined;
  if (labels.includes("needs-eric")) return ERIC;
  if (labels.includes("needs-info")) return FILER;
  if (labels.includes("in-progress") || openPullRequests.length > 0) return BEING_BUILT;
  if (labels.includes("needs-session")) return WORKING_SESSION;
  if (labels.includes("ready")) return FREE_SESSION;
  return NOBODY;
}
