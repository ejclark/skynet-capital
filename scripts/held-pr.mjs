// A HELD PR, AND HOW LONG IT HAS WAITED ON ERIC'S MERGE — #7317.
//
// WHY THIS EXISTS. On 2026-11-10 four held PRs took a median 37.6 h from green to merged, 134 h in
// all, and once a session asked, all four merged inside five minutes (4 clicks in 93 s). The wait
// was the ask, not him. The ask's timer used to start when the PR OPENED (12 h), so a PR that went
// green at hour 1 sat silent for 11 more; and `npm run meter` folded held PRs into open-to-merge,
// so nothing measured the wait at all. Both now read one clock: the moment both required checks
// last went green on the head (`greenHead`, shared with the stuck-PR scan so "green" means one
// thing in this repo).
//
// Two readers: moneypenny/assignments.mjs (criterion 4 — when to ask, and what the ask names) and
// agent-meter.mjs (the held-PR row). Pure, except `readHeldFacts`, whose reads are injected.
import { derivePrIssues } from "./moneypenny/pr-issues.mjs";
import { greenHead } from "./stuck-pr-decide.mjs";

export const HOLD_MERGE = "hold-merge";
/** Green this long on a held PR and it is Eric's click: ask (#7317's first criterion). */
export const HELD_GREEN_HOURS = 4;
/**
 * The old timer, kept as the backstop: a held PR open this long is asked about whatever its checks
 * say (red, still running, or a check-runs read that failed), as it was before #7317 — the new rule
 * only ever asks earlier, never less. Its card claims green only when the check runs said so.
 */
export const HELD_OPEN_HOURS = 12;

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));

/** Held: open, not a draft, and labelled `hold-merge` or built from a `platter/` branch. Pure. */
export function isHeldPr(pr) {
  if (!pr || (pr.state ?? "open") !== "open" || pr.draft) return false;
  return names(pr.labels).includes(HOLD_MERGE) || /^platter\//.test(pr.head?.ref ?? "");
}

/** When the head last went green, in ms, else `null` (red, running, or never reported). Pure. */
export function greenSince(checkRuns = []) {
  return greenHead(checkRuns)?.at ?? null;
}

/**
 * One held PR's age, both clocks: hours open and hours green (null when not green). The meter's
 * row and the ask's "green 26h" read this, so the two never disagree. Pure.
 */
export function heldAge(pr, { greenAt = null, now = Date.now() } = {}) {
  const openHours = (now - Date.parse(pr.created_at ?? now)) / 36e5;
  const greenHours = greenAt === null ? null : Math.max(0, (now - greenAt) / 36e5);
  return { number: pr.number, title: pr.title ?? "", openHours, greenHours };
}

/**
 * Is this held PR due an ask, and on which clock? Due once green for `HELD_GREEN_HOURS`, or once
 * open for `HELD_OPEN_HOURS` whatever its checks say. Returns `{ green, hours }` — when the head is
 * green now, `green: true` and the GREEN hours (so the ask never says "not green" about a green
 * PR); otherwise `green: false` and the OPEN hours — or `null` when not due. `greenAt` is ms,
 * `null` (not green) or `undefined` (unknown); an unknown one also carries `unknown: true`, so a
 * reader says "checks unknown" and never "not green" about checks nobody read (#8212).
 *
 * Why the backstop also covers a green PR: a held PR takes merges from main while it waits (#7080
 * took 5), and each push restarts its checks and so its green clock. Past 12 h open it stays due
 * through those, instead of leaving the page for 4 h after every update. Pure.
 */
export function heldDue(pr, { greenAt, now = Date.now() } = {}) {
  if (!isHeldPr(pr)) return null;
  const { openHours, greenHours } = heldAge(pr, { greenAt: greenAt ?? null, now });
  const due = (greenHours ?? 0) >= HELD_GREEN_HOURS || openHours >= HELD_OPEN_HOURS;
  if (!due) return null;
  if (greenHours !== null) return { green: true, hours: greenHours };
  return greenAt === undefined
    ? { green: false, hours: openHours, unknown: true }
    : { green: false, hours: openHours };
}

/**
 * What one held PR blocks: the open issues it names (pr-issues.mjs's rules — closing keywords,
 * `Part of #n`, the title, the branch), each flagged `plan` when it carries the `plan` label. A
 * lane skips an issue an open PR names, so every one of these waits on this merge. `readIssue` is
 * one REST read per number; a read that fails drops that number rather than the ask. Pure but for
 * the injected read.
 */
export function blockedBy(pr, readIssue) {
  const nums = derivePrIssues({
    title: pr.title ?? "",
    body: pr.body ?? "",
    headRef: pr.head?.ref ?? "",
  }).filter((n) => n !== pr.number);
  const out = [];
  for (const n of nums) {
    let issue;
    try {
      issue = readIssue(n);
    } catch {
      continue;
    }
    if (!issue || issue.pull_request || (issue.state ?? "open") !== "open") continue;
    out.push({ number: n, title: issue.title ?? "", plan: names(issue.labels).includes("plan") });
  }
  return out;
}

/**
 * The facts criterion 4 needs for every held PR, keyed by number: `greenAt` (ms or null) and, once
 * the PR is due an ask (`heldDue`), what it `blocks`. One check-runs read per held PR, and
 * issue reads only for the few that are due — held PRs are a handful, never one per open PR. A
 * failed check-runs read leaves `greenAt` unknown (`undefined`), which criterion 4 treats as "not
 * known green": the 12 h-since-open backstop still asks, and the card claims nothing.
 */
export function readHeldFacts(prs = [], { read, now = Date.now() } = {}) {
  const facts = new Map();
  if (!read) return facts; // nothing to read with: every held PR's green time stays unknown
  for (const pr of prs) {
    if (!isHeldPr(pr)) continue;
    const sha = pr.head?.sha;
    let greenAt;
    try {
      greenAt = sha
        ? greenSince(read(`commits/${sha}/check-runs?per_page=100`)?.check_runs)
        : undefined;
    } catch {
      greenAt = undefined;
    }
    const due = heldDue(pr, { greenAt, now }) !== null;
    facts.set(pr.number, { greenAt, blocks: due ? blockedBy(pr, (n) => read(`issues/${n}`)) : [] });
  }
  return facts;
}

/** "plan #6871 and #7034" — what a held PR blocks, plans first, as the ask and the page say it. */
export function blocksPhrase(blocks = []) {
  if (!blocks.length) return "";
  const sorted = [...blocks].sort((a, b) => Number(b.plan) - Number(a.plan) || a.number - b.number);
  const refs = sorted.map((b) => `${b.plan ? "plan " : ""}#${b.number}`);
  return refs.length === 1 ? refs[0] : `${refs.slice(0, -1).join(", ")} and ${refs.at(-1)}`;
}
