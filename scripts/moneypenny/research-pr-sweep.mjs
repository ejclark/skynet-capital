// THE RESEARCH-PR SWEEP — an open `research/<id>` PR that stopped moving, and the event it holds.
//
// WHY (#5689). `dueForResearch` (events.mjs) skips every event whose `research/<id>` PR is open, with
// no age limit. That is right while the PR is moving and a silent block once it is stuck: on
// 2026-10-26 #5798 had sat 177h, CONFLICTING after #5787 landed the same pulse, and the apec pulse
// `event-scan --due` listed was dropped every tick. #6225 (stranded-pr.mjs) shipped the green half:
// a green, unarmed PR's failed arm job is re-run. This module owns the other two shapes, past 6h:
//
//   - SUPERSEDED. The PR conflicts with `main`, and `main`'s ledger already carries an assessment
//     dated on or after the PR's newest one. Its work is on `main` in a later form, so it is closed,
//     naming the PR that landed it, and its branch goes (the next research session branches the same
//     name off `main`; the commits stay on the closed PR). The comparison is the ledger's own
//     `**Last assessed:**` contract (event-scan.mjs's `loadLedgers`, last occurrence wins), never
//     "a merged PR exists for this event": two pulses on different dates are both wanted, so a PR
//     carrying a NEWER assessment than `main` is left for the conflict repair to merge.
//   - RED. A check that holds the PR failed. Nothing re-runs a research PR's checks (red-lane-pr.mjs
//     takes `plan/` and `feedback/` heads only), so it gets one comment per head sha naming the
//     check and what the open PR is costing. Flag only: a fix is a session, and a session is spend.
//
// 6 HOURS is the bottleneck research's floor (#5689, 2026-10-26): 155 of 158 research PRs merged
// inside 0.6h. The conflict repair (moneypenny-repair.yml) gets the first try at a superseded PR,
// and since 2026-11-02 it closes the same-day duplicates itself (#6680, #6685); this is the net for
// what it escalated or capped, which is how #5798 sat.
//
// THE COUNT. Each tick reports re-armed / closed / flagged / left among the research PRs past 6h,
// so the issue's Before number (10 stuck on 2026-10-18) has an After counted the same way.
import { readFileSync } from "node:fs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";
import { redCheck } from "./red-lane-pr.mjs";

/** How long a research PR may sit open before the sweep looks at it. */
export const RESEARCH_PR_HOURS = 6;

/** The hidden memory on a red research PR: the head it was flagged at. */
export const RESEARCH_RED_MARKER = /<!-- moneypenny:research-red sha=(\S+) -->/;

const RESEARCH_BRANCH = /^research\/([a-z0-9][a-z0-9.-]*)$/;
const LAST_ASSESSED = /^\*\*Last assessed:\*\*\s*(\d{4}-\d{2}-\d{2})/gm;

/** Pure: the ledger's newest `**Last assessed:**` date, or null. The last occurrence wins, because
 *  every pulse appends its own (docs/research/events/TEMPLATE.md). */
export function lastAssessed(text) {
  return [...String(text ?? "").matchAll(LAST_ASSESSED)].at(-1)?.[1] ?? null;
}

/**
 * Pure: is this PR's work already on `main` in a later form? It must conflict (a PR that merges
 * cleanly is the re-arm's to land), both ledgers must carry a date, and `main`'s must be on or after
 * the PR's. ISO dates compare as strings.
 */
export function isSuperseded({ conflicting, prAssessed, mainAssessed }) {
  return Boolean(conflicting && prAssessed && mainAssessed && mainAssessed >= prAssessed);
}

/** The sha the newest red flag on this PR names, or null. Comments list oldest-first. */
export function lastRedFlagSha(comments = []) {
  for (let i = comments.length - 1; i >= 0; i -= 1) {
    const m = RESEARCH_RED_MARKER.exec(comments[i]?.body ?? "");
    if (m) return m[1];
  }
  return null;
}

/** How the close comment names what landed the PR's work. */
const successorText = (s) =>
  s?.pr ? `#${s.pr}` : s?.sha ? `commit ${String(s.sha).slice(0, 9)}` : "an earlier merge";

/**
 * Pure: one intent per research PR the sweep acts on. Superseded wins over red: a closed PR needs no
 * fix. Each candidate is `{ number, title, eventId, branch, hours, headSha, superseded, red,
 * flaggedSha }` as `gatherResearchPrs` reads it.
 */
export function researchSweepIntents(candidates = []) {
  const intents = [];
  for (const c of candidates) {
    if (c.superseded) {
      const s = c.superseded;
      const by = successorText(s.successor);
      intents.push({
        kind: "close-superseded-research",
        prNumber: c.number,
        title: c.title,
        branch: c.branch,
        eventId: c.eventId,
        successor: s.successor ?? null,
        body: `🧹 **Closing this PR: its research is already on \`main\`.** \`docs/research/events/${c.eventId}.md\` on \`main\` was last assessed **${s.mainAssessed}**, landed by ${by}; this PR's newest assessment is **${s.prAssessed}**, and it has conflicted with \`main\` for ${c.hours}h.\n\nWhile it stayed open, the research lane skipped \`${c.eventId}\`. It can be researched again from the next push. Nothing was merged; the commits stay on this PR (\`git fetch origin pull/${c.number}/head\`).\n\n${FOOTER}`,
      });
      continue;
    }
    if (c.red && c.flaggedSha !== c.headSha) {
      intents.push({
        kind: "flag-red-research",
        prNumber: c.number,
        title: c.title,
        headSha: c.headSha,
        body: `🔴 **This research PR is red: \`${c.red.name}\` failed** ([the check](${c.red.url})), and it has been open ${c.hours}h.\n\nNothing re-runs a research PR's checks, and while it is open the research lane skips \`${c.eventId}\`, so its next pulse waits on this one. Fix the check, or close the PR to let the event be researched again. This is the only flag for this head.\n\n<!-- moneypenny:research-red sha=${c.headSha} -->\n\n${FOOTER}`,
      });
    }
  }
  return intents;
}

/**
 * Pure: the tick's count over the research PRs past 6h — what this sweep did, what the re-arm did to
 * them, and what is left standing. `rearmed` is the re-arm intents the same tick emitted.
 */
export function researchSweepReport(candidates = [], sweep = [], rearmed = []) {
  const ours = new Set(candidates.map((c) => c.number));
  const count = (kind) => sweep.filter((i) => i.kind === kind).length;
  const counts = {
    open: candidates.length,
    rearmed: rearmed.filter((i) => ours.has(i.prNumber)).length,
    closed: count("close-superseded-research"),
    flagged: count("flag-red-research"),
  };
  const left = counts.open - counts.rearmed - counts.closed - counts.flagged;
  const line =
    `research PR sweep — ${counts.open} open past ${RESEARCH_PR_HOURS}h: re-armed ${counts.rearmed}, ` +
    `closed ${counts.closed} as superseded, flagged ${counts.flagged} red, left ${left}`;
  return { kind: "report-research-sweep", title: "research PR sweep", ...counts, left, line };
}

/**
 * Pure: the tick's intents for `audit()`. `halt` stops the acts, since a close frees the event for a
 * session; the count is not work, so it reports under `halt` too. Nothing at all when the read
 * failed (null): a count of zero would claim a look this tick never took.
 */
export function researchSweep(candidates, rearmed = [], halted = false) {
  if (!candidates) return [];
  const sweep = halted ? [] : researchSweepIntents(candidates);
  return [...sweep, researchSweepReport(candidates, sweep, rearmed)];
}

/** The PR head's ledger text, or null when the head has none. */
function headLedger(read, eventId, sha) {
  try {
    const file = read(`contents/docs/research/events/${eventId}.md?ref=${sha}`);
    return Buffer.from(
      file.content ?? "",
      file.encoding === "base64" ? "base64" : "utf8",
    ).toString();
  } catch {
    return null;
  }
}

/** `main`'s ledger, from the checkout the audit runs on (the push's own sha), or null. */
function mainLedger(eventId) {
  try {
    return readFileSync(`docs/research/events/${eventId}.md`, "utf8");
  } catch {
    return null;
  }
}

/** The merge that last wrote `main`'s ledger: its PR when GitHub links one, else its commit. */
function successorOf(read, eventId) {
  const [last] = read(`commits?path=docs/research/events/${eventId}.md&sha=main&per_page=1`) ?? [];
  if (!last?.sha) return null;
  const [pr] = read(`commits/${last.sha}/pulls`) ?? [];
  return { sha: last.sha, pr: pr?.number ?? null };
}

/**
 * Audit-mode read: every research PR open past the floor, with what the intents and the count need.
 * REST core only; a tick with no research PR that old costs the one list call. Only this repo's own
 * branches: the close deletes `research/<id>` here, which a fork's same-named branch must never
 * reach. Loud on failure, like `gatherStranded`.
 */
export function gatherResearchPrs(
  nowMs,
  { hours = RESEARCH_PR_HOURS, rest = ghRest, readMain = mainLedger } = {},
) {
  const read = (path) => withRetry(() => rest(path));
  const cutoff = nowMs - hours * 3.6e6;
  const out = [];
  for (const listed of ghRestAll("pulls?state=open", { read: rest })) {
    const eventId = sweepableEvent(listed, cutoff);
    if (!eventId) continue;
    const sha = listed.head.sha;
    const superseded = supersededBy(read, readMain, listed.number, eventId, sha);
    const red = superseded ? null : redOf(read, sha, nowMs);
    out.push({
      number: listed.number,
      title: listed.title,
      eventId,
      branch: listed.head.ref,
      hours: Math.floor((nowMs - Date.parse(listed.created_at)) / 3.6e6),
      headSha: sha,
      superseded,
      red,
      flaggedSha: red
        ? lastRedFlagSha(ghRestAll(`issues/${listed.number}/comments`, { read: rest }))
        : null,
    });
  }
  return out;
}

/** The event a listed PR holds, when it is this repo's own undrafted, unheld research PR past the
 *  cutoff; null otherwise. Pure over the list row. */
function sweepableEvent(listed, cutoff) {
  const lane = RESEARCH_BRANCH.exec(listed.head?.ref ?? "");
  if (!lane || listed.draft) return null;
  if (listed.head?.repo?.full_name !== listed.base?.repo?.full_name) return null;
  if (Date.parse(listed.created_at) > cutoff) return null;
  if ((listed.labels ?? []).some((l) => l.name === LABELS.holdMerge.name)) return null;
  return lane[1];
}

/** The superseded reading, or null. The ledgers are read only for a PR GitHub calls conflicting
 *  (`mergeable` false; null is still computing, and the next push looks again). */
function supersededBy(read, readMain, number, eventId, sha) {
  if (read(`pulls/${number}`).mergeable !== false) return null;
  const prAssessed = lastAssessed(headLedger(read, eventId, sha));
  const mainAssessed = lastAssessed(readMain(eventId));
  if (!isSuperseded({ conflicting: true, prAssessed, mainAssessed })) return null;
  return { prAssessed, mainAssessed, successor: successorOf(read, eventId) };
}

/** The newest failed check that holds the head, or null. */
function redOf(read, sha, nowMs) {
  const failed = redCheck(read(`commits/${sha}/check-runs?per_page=100`).check_runs ?? [], nowMs);
  return failed ? { name: failed.run.name, url: failed.run.html_url } : null;
}

/**
 * `gatherResearchPrs` for the audit step, soft on failure: the other checks ride the same run, and a
 * read this one cannot make costs one skipped sweep, retried on the next push. Null, not [], so the
 * tick reports nothing rather than a count of zero it never took.
 */
export function researchPrsOrNone(nowMs, { log = console.log, ...opts } = {}) {
  try {
    return gatherResearchPrs(nowMs, opts);
  } catch (err) {
    log(`::warning::research PR sweep skipped — ${String(err.message).slice(0, 200)}`);
    return null;
  }
}

/** The close. The PR goes first: if it fails nothing changed, and the next push tries again. */
export function closeSupersededResearch(i, { run = sh } = {}) {
  run("gh", ["pr", "close", String(i.prNumber), "--comment", i.body]);
  run("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/heads/${i.branch}`]);
  return `🧹 closed superseded research PR #${i.prNumber} — \`${i.eventId}\` already on main via ${successorText(i.successor)}`;
}

/** The flag: one comment, whose marker is the memory. */
export function flagRedResearch(i, { run = sh } = {}) {
  run("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  return `🔴 flagged red research PR #${i.prNumber} — \`${i.title}\``;
}

/** The count, as a notice in the log and a line on the run's receipt. */
export function reportResearchSweep(i, { log = console.log } = {}) {
  log(`::notice::${i.line}`);
  return `🔭 ${i.line}`;
}
