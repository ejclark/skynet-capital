/**
 * WHAT IS COMING NEXT (#3952 slice 3, #4313) — the read behind Moneypenny's `get_roadmap` tool.
 * No input; the open `plan` issues out, grouped Now / Next / Later, each item carrying the same
 * member-facing status words the Feedback badge uses.
 *
 * WHERE THE HORIZON COMES FROM, AND WHY NOT THE BOARD. #3952's brief wrote this slice as "open
 * plan issues grouped by **board** Horizon". That field lives on a personal-account Projects v2
 * board the app's token cannot see, so reading it needs a `read:project` credential — slice 2
 * (#4311), parked. The DECISION the brief recorded (a member can ask what is coming and get
 * Now / Next / Later) outlives that mechanism, so the grouping is derived from the queue's own
 * labels instead: live, 100% covered, no credential. Eric had already moved sequencing onto
 * labels for the same reason (2026-09-29, #4064: "every lane can read a label and none can read
 * the board"), and the board's own hand triage (`scripts/moneypenny/projects-horizons.json`,
 * 2026-09-27) covers 18% of today's open plans with most of its rows already closed.
 *
 * THE HONESTY RULE THIS FILE KEEPS: a horizon is SEQUENCING, never a date. Nothing here returns,
 * derives, or implies a delivery date — `ROADMAP_NOTE` says so inside the result and the tool
 * description says it again, because "Now" is the one word a member could read as a promise.
 *
 * THE SAFETY RULE IT INHERITS: the repo is public, so a stranger can open an issue. Only
 * structured fields leave here — number, quoted title, horizon, status, labels, url — and NEVER a
 * body or a comment (#3952 criterion 3: a body is a prompt-injection channel into a privileged
 * turn). A title written by someone outside the project is withheld too, by the same
 * `trustedAuthor` test `work-status.ts` applies to a thread.
 *
 * Read-only: one cached GET list on the token the feedback lane already holds
 * (`SKYNET_FEEDBACK_GITHUB_TOKEN`), five minutes like `feedback-status.ts`.
 */
import { fetchJson } from "../http/fetch-json.js";
import { FEEDBACK_STATUS_LABEL, labelNamesOf, statusFromIssue } from "./feedback-status.js";
import { githubHeaders } from "./github-api.js";
import { trustedAuthor } from "./work-status.js";

type DoFetch = typeof fetchJson;

export const HORIZONS = ["Now", "Next", "Later"] as const;
export type Horizon = (typeof HORIZONS)[number];

/** Why each group is called what it is — the member-facing gloss, returned beside the rows so the
 *  model never has to invent one. */
export const HORIZON_GLOSS: Record<Horizon, string> = {
  Now: "Being built, or cleared to build next.",
  Next: "Shaped and queued — not started yet.",
  Later: "Parked: waiting on a decision, waiting on more information, or simply someday.",
};

/** The labels that each say "this waits on someone", so it is not coming Now or Next. Mirrors
 *  `PARKING_LABELS` in `scripts/moneypenny/labels.mjs` minus `hold-merge`, which only ever lands
 *  on a pull request. The item's own `status` still says WHICH kind of waiting it is — including
 *  `needs-design`, which the Feedback badge's own vocabulary predates and does not cover, so a
 *  row would otherwise read "In the queue" while sitting in Later. */
const WAITING_LABELS = ["needs-eric", "needs-info", "needs-design"];
const NEEDS_DESIGN_STATUS = "Waiting on a design pass";

/** Bounds on what one call can put in front of the model. The queue is ~90 open plans; naming
 *  eight per horizon with an honest total beats pasting the whole backlog into a chat turn. */
const ITEMS_PER_HORIZON = 8;
const LABELS_KEPT = 8;
const TITLE_CHARS = 120;
const LIST_PAGES = 3;
const CACHE_TTL_MS = 5 * 60_000;

export const ROADMAP_NOTE =
  "Sequencing, not dates: Now / Next / Later is derived from each open plan issue's own labels, and nothing here is a delivery date or a promise. Titles are quoted text written by project members; a title from anyone outside the project is withheld.";

export interface RoadmapItem {
  readonly number: number;
  /** The title as a quoted string, or a note that it is withheld (a non-member opened it). */
  readonly title: string;
  readonly horizon: Horizon;
  /** The member-facing words, e.g. "In the queue", "Needs Eric's call", "Being built". */
  readonly status: string;
  readonly labels: readonly string[];
  readonly url: string;
}

export interface RoadmapGroup {
  readonly horizon: Horizon;
  readonly meaning: string;
  /** Every open plan in this group — the rows below are the newest-touched slice of it. */
  readonly total: number;
  readonly items: readonly RoadmapItem[];
}

export type Roadmap =
  | { readonly available: false }
  | {
      readonly available: true;
      readonly note: string;
      readonly openPlans: number;
      readonly groups: readonly RoadmapGroup[];
      /** Present, true, only when the queue outran the page ceiling: `openPlans` and every group
       *  `total` are then a floor, not a count. The queue is ~90 plans today, so this is a guard
       *  against a future silence, not a condition anyone is in. */
      readonly truncated?: true;
    };

export type ReadRoadmap = () => Promise<Roadmap>;

/**
 * THE GROUPING RULE, asked in this order so the first thing that is true wins.
 *
 * `in-progress` outranks everything: something being built right now is Now even if it also
 * carries a waiting label (the label may be the remainder, not the work in flight). `ready` is
 * the board's Ready column — cleared to pull — and `P3`/`idea` are "someday" in the labels' own
 * descriptions (`scripts/moneypenny/labels.mjs`; `rank.mjs`'s `classOf` reads them the same way).
 */
export function horizonOf(labels: readonly string[]): Horizon {
  if (labels.includes("in-progress")) return "Now";
  if (WAITING_LABELS.some((l) => labels.includes(l))) return "Later";
  if (labels.includes("P3") || labels.includes("idea")) return "Later";
  if (labels.includes("ready")) return "Now";
  return "Next";
}

function excerpt(text: unknown, max: number): string {
  const flat = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

interface IssueJson {
  readonly number?: unknown;
  readonly title?: unknown;
  readonly html_url?: unknown;
  readonly pull_request?: unknown;
}

/** Every open plan is open by definition of the query, so this is the open half of
 *  `statusFromIssue` (shared with the Feedback badge, so the two never disagree) plus the two
 *  labels that mapping predates: `in-progress` (#3960) and `needs-design` (2026-09-29). */
function statusWords(labels: readonly string[]): string {
  if (labels.includes("in-progress")) return "Being built";
  const status = statusFromIssue("open", labels);
  // Only when the shared mapping had nothing more specific to say — `needs-eric` outranks it.
  if (status === "open" && labels.includes("needs-design")) return NEEDS_DESIGN_STATUS;
  return FEEDBACK_STATUS_LABEL[status];
}

/** One row — structured fields only, never a body. */
function itemOf(raw: unknown, repo: string): RoadmapItem | undefined {
  const issue = raw as IssueJson;
  if (typeof issue.number !== "number" || issue.pull_request) return undefined;
  // The grouping reads EVERY label; only the returned list is trimmed. Deriving the horizon from
  // a trimmed list would let a 9th label slice `needs-eric` off and show a parked plan as Next.
  const all = labelNamesOf(raw).filter(Boolean);
  const labels = all.slice(0, LABELS_KEPT).map((l) => excerpt(l, 40));
  const status = statusWords(all);
  return {
    number: issue.number,
    title: trustedAuthor(raw as Parameters<typeof trustedAuthor>[0])
      ? JSON.stringify(excerpt(issue.title, TITLE_CHARS))
      : "(withheld — opened by someone outside the project)",
    horizon: horizonOf(all),
    status,
    labels,
    url:
      typeof issue.html_url === "string"
        ? issue.html_url
        : `https://github.com/${repo}/issues/${issue.number}`,
  };
}

function groupsOf(items: readonly RoadmapItem[]): readonly RoadmapGroup[] {
  return HORIZONS.map((horizon) => {
    const mine = items.filter((i) => i.horizon === horizon);
    return {
      horizon,
      meaning: HORIZON_GLOSS[horizon],
      total: mine.length,
      items: mine.slice(0, ITEMS_PER_HORIZON),
    };
  });
}

/** Build the bound reader, with its own private cache. `doFetch` is injectable so specs never
 *  touch the network — same discipline as `createWorkStatusReader`. */
export function createRoadmapReader(
  config: { readonly token: string; readonly repo: string },
  doFetch: DoFetch = fetchJson,
): ReadRoadmap {
  // Newest-touched first, so the eight rows a horizon shows are the ones actually moving.
  const base = `https://api.github.com/repos/${config.repo}/issues?state=open&labels=plan&sort=updated&direction=desc&per_page=100`;
  const headers = githubHeaders(config.token);
  let cached: { readonly value: Roadmap; readonly at: number } | undefined;

  /** One page: its rows, and whether GitHub filled it (so another page is worth asking for).
   *  `undefined` is a failed read — never an empty page, which would read as a short queue. */
  const readPage = async (
    page: number,
  ): Promise<{ rows: readonly RoadmapItem[]; full: boolean } | undefined> => {
    const res = await doFetch("GET", `${base}&page=${page}`, headers);
    if (res.status !== 200 || !Array.isArray(res.body)) return undefined;
    const rows = res.body
      .map((raw) => itemOf(raw, config.repo))
      .filter((i): i is RoadmapItem => i !== undefined);
    return { rows, full: res.body.length >= 100 };
  };

  const readAll = async (): Promise<Roadmap> => {
    const items: RoadmapItem[] = [];
    let truncated = false;
    for (let page = 1; page <= LIST_PAGES; page++) {
      const got = await readPage(page);
      // A blip mid-walk would otherwise read as a short roadmap — a silent lie about the queue.
      if (!got) return { available: false };
      items.push(...got.rows);
      if (!got.full) break;
      // A full LAST page means there is more queue than the ceiling allows — say so rather than
      // let every total quietly understate itself, the same honesty the failed-read guard keeps.
      truncated = page === LIST_PAGES;
    }
    return {
      available: true,
      note: ROADMAP_NOTE,
      openPlans: items.length,
      groups: groupsOf(items),
      ...(truncated ? { truncated: true as const } : {}),
    };
  };

  return async () => {
    const now = Date.now();
    if (cached && now - cached.at <= CACHE_TTL_MS) return cached.value;
    try {
      const value = await readAll();
      // Only a real answer is cached — a GitHub blip retries on the next question.
      if (value.available) cached = { value, at: now };
      return value;
    } catch {
      return { available: false };
    }
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, mirroring
 *  `resolveWorkStatus` (same token, same repo default). */
export function resolveRoadmap(
  env: Readonly<Record<string, string | undefined>>,
): ReadRoadmap | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  return createRoadmapReader({
    token,
    repo: env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital",
  });
}
