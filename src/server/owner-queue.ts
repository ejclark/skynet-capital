/**
 * WHAT WAITS ON THE OWNER (the Moneypenny operator plan, slice owner-desk-context) — the read
 * behind the "Owner desk" line in Moneypenny's per-turn context, so "what needs me?" from the
 * league's owner gets a real answer instead of a shrug.
 *
 * Two lists, oldest first: open issues labelled `needs-eric` (a decision only he can make, per
 * docs/ISSUES.md) and pull requests labelled `hold-merge` (held for his merge, `pipeline.yml`'s arm
 * job skips them). Both labels are registered in `scripts/moneypenny/labels.mjs`. Oldest first
 * because the oldest ask is the one costing the most — the open `needs-eric` count and its age are
 * the cost CLAUDE.md says the research capability exists to drive down.
 *
 * WHO SEES IT: nothing in this file decides that. `companion-routes.ts`'s `memberContextFor` calls
 * the reader only when the server's own owner check (`config.isOwnerEmail`, the env owner
 * allowlist) passes for the signed-in session — never on anything in the request or the prompt.
 *
 * THE SAFETY RULES IT INHERITS from `work-status.ts` and `roadmap.ts`: the repo is public, so a
 * stranger can open an issue. Only number, a quoted one-line title and days open leave here —
 * never a body or a comment — and a title written by someone outside the project is withheld by
 * the same `trustedAuthor` test. A failed read is `undefined`, never an empty desk: "nothing waits
 * on you" is the one answer it must never invent.
 *
 * Read-only: two GETs on the token the feedback lane already holds (`SKYNET_FEEDBACK_GITHUB_TOKEN`),
 * cached five minutes like the other GitHub reads.
 */

import { fetchJson } from "../http/fetch-json.js";
import { githubHeaders } from "./github-api.js";
import { trustedAuthor } from "./work-status.js";

type DoFetch = typeof fetchJson;

export interface OwnerQueueRow {
  readonly number: number;
  /** The title as a quoted string, or a note that it is withheld (a non-member opened it). */
  readonly title: string;
  /** Whole days since it was opened. */
  readonly openDays: number;
}

export interface OwnerQueue {
  /** Open issues waiting on his decision, oldest first, at most `ROWS_KEPT`. */
  readonly decisions: readonly OwnerQueueRow[];
  readonly decisionsTotal: number;
  /** Open pull requests held for his merge, oldest first, at most `ROWS_KEPT`. */
  readonly heldPullRequests: readonly OwnerQueueRow[];
  readonly heldTotal: number;
}

export type ReadOwnerQueue = () => Promise<OwnerQueue | undefined>;

const DECISION_LABEL = "needs-eric";
const HELD_LABEL = "hold-merge";
const ROWS_KEPT = 5;
const TITLE_CHARS = 80;
const PER_PAGE = 100;
const OWNER_QUEUE_CACHE_TTL_MS = 5 * 60_000;
const DAY_MS = 86_400_000;
const WITHHELD = "(withheld — opened by someone outside the project)";

interface IssueJson {
  readonly number?: unknown;
  readonly title?: unknown;
  readonly created_at?: unknown;
  readonly pull_request?: unknown;
}

function excerpt(text: unknown, max: number): string {
  const flat = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

interface Dated extends OwnerQueueRow {
  readonly createdAt: number;
}

function rowOf(raw: unknown, now: number): Dated | undefined {
  const issue = raw as IssueJson;
  if (typeof issue.number !== "number") return undefined;
  const createdAt =
    typeof issue.created_at === "string" ? Date.parse(issue.created_at) : Number.NaN;
  if (!Number.isFinite(createdAt)) return undefined;
  return {
    number: issue.number,
    title: trustedAuthor(raw as Parameters<typeof trustedAuthor>[0])
      ? JSON.stringify(excerpt(issue.title, TITLE_CHARS))
      : WITHHELD,
    openDays: Math.max(0, Math.floor((now - createdAt) / DAY_MS)),
    createdAt,
  };
}

/** Build the bound reader, with its own private cache. `doFetch` and `now` are injectable so specs
 *  never touch the network or the clock — same discipline as `createRoadmapReader`. */
export function createOwnerQueueReader(
  config: { readonly token: string; readonly repo: string },
  doFetch: DoFetch = fetchJson,
  now: () => number = Date.now,
): ReadOwnerQueue {
  const headers = githubHeaders(config.token);
  const urlFor = (label: string) =>
    `https://api.github.com/repos/${config.repo}/issues?state=open&labels=${label}&sort=created&direction=asc&per_page=${PER_PAGE}`;
  let cached: { readonly value: OwnerQueue; readonly at: number } | undefined;

  /** One label's open rows, oldest first, kept only when `wantPull` matches whether the row is a
   *  pull request. `undefined` is a failed read. */
  const readLabel = async (
    label: string,
    wantPull: boolean,
    at: number,
  ): Promise<readonly Dated[] | undefined> => {
    const res = await doFetch("GET", urlFor(label), headers);
    if (res.status !== 200 || !Array.isArray(res.body)) return undefined;
    return res.body
      .filter((raw) => Boolean((raw as IssueJson)?.pull_request) === wantPull)
      .map((raw) => rowOf(raw, at))
      .filter((r): r is Dated => r !== undefined)
      .sort((a, b) => a.createdAt - b.createdAt);
  };

  const strip = (rows: readonly Dated[]): readonly OwnerQueueRow[] =>
    rows.slice(0, ROWS_KEPT).map(({ number, title, openDays }) => ({ number, title, openDays }));

  return async () => {
    const at = now();
    if (cached && at - cached.at <= OWNER_QUEUE_CACHE_TTL_MS) return cached.value;
    try {
      const [decisions, held] = await Promise.all([
        readLabel(DECISION_LABEL, false, at),
        readLabel(HELD_LABEL, true, at),
      ]);
      if (!(decisions && held)) return undefined;
      const value: OwnerQueue = {
        decisions: strip(decisions),
        decisionsTotal: decisions.length,
        heldPullRequests: strip(held),
        heldTotal: held.length,
      };
      // Only a real answer is cached — a GitHub blip retries on the next question.
      cached = { value, at };
      return value;
    } catch {
      return undefined;
    }
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, mirroring
 *  `resolveRoadmap` (same token, same repo default). */
export function resolveOwnerQueue(
  env: Readonly<Record<string, string | undefined>>,
): ReadOwnerQueue | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  return createOwnerQueueReader({
    token,
    repo: env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital",
  });
}

/** The config slice for `serve-dashboard.ts` to spread: `{ readOwnerQueue }` when the token is
 *  set, else nothing. A helper rather than an inline ternary so the boot function's complexity
 *  does not grow by one for every optional read. */
export function ownerQueueWiring(env: Readonly<Record<string, string | undefined>>): {
  readonly readOwnerQueue?: ReadOwnerQueue;
} {
  const readOwnerQueue = resolveOwnerQueue(env);
  return readOwnerQueue ? { readOwnerQueue } : {};
}

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

function listed(rows: readonly OwnerQueueRow[], total: number): string {
  const named = rows.map((r) => `#${r.number} ${r.title} (${days(r.openDays)})`).join(", ");
  const more = total > rows.length ? `, and ${total - rows.length} more` : "";
  return `${named}${more}`;
}

/** The words for the context line. Plain phrases, never the bare label names. A total at the page
 *  size is a floor, and says so. */
export function describeOwnerQueue(queue: OwnerQueue): string {
  const count = (n: number) => (n >= PER_PAGE ? `${n} or more` : `${n}`);
  const decisions =
    queue.decisionsTotal === 0
      ? "no open issue waits on his decision"
      : `${count(queue.decisionsTotal)} open issue${queue.decisionsTotal === 1 ? " waits" : "s wait"} on his decision, oldest first: ${listed(queue.decisions, queue.decisionsTotal)}`;
  const held =
    queue.heldTotal === 0
      ? "no pull request is held for his merge"
      : `${count(queue.heldTotal)} pull request${queue.heldTotal === 1 ? " is" : "s are"} held for his merge: ${listed(queue.heldPullRequests, queue.heldTotal)}`;
  return `${decisions}; ${held}`;
}
