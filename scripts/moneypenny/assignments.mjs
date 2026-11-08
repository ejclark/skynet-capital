// ASSIGNMENTS — #3818 slice 5 (#4289): send Eric only decisions, as GitHub assignments.
//
// WHY ASSIGNMENTS. Every ask used to post under `ejclark`, and GitHub never notifies you of your
// own posts — so nothing came back to him (#3818's call 2: 0 call sites assigned him; 8 open
// `needs-eric`, median ~15.5 days). An assignment by a bot DOES push to GitHub Mobile.
//
// THE DRY RUN CAME FIRST, AND IT IS STILL THE CLI DEFAULT. Assigning is a GitHub write on Eric's
// own queue, so the plan's rule was "dry run for one day first". Two dry runs are on #4289's thread
// — 2026-10-01 (1 would-be assignment) and 2026-10-02 (2) — both tiny and both correct, which is the
// reading that rule existed to produce. So this file now has a write path, behind `--apply`;
// `--dry-run` remains what you get by default and what the report is for.
//
// WHY THE PUSH SWEEP, NOT A WORKFLOW STEP. #4289's own note planned the live half as a
// `.github/**` platter item — an envelope-protected file, so one more merge of Eric's. It does not
// need to be: the sweep already runs `index.mjs` on every push with the App token, so this lane
// folds in beside the relay (slice 4) as a routed intent and costs him nothing. Same outcome, one
// fewer touch point, which is this whole plan's point.
//
// THE BLAST-RADIUS BOUND IS `ASSIGN_CAP`. A live lane that reads the queue wrong could assign Eric
// to everything it can see once. Three new assignments per tick means a wrong read costs three
// notifications and three `unassign`s, not a queue-wide fan-out — the same instinct as the relay's
// watermark (#4484) and the receipt sweep's batch cap. Removals are uncapped: they only ever shrink
// his queue, and holding one back would leave a stale assignment pushing at him.
//
// WHAT IT PLANS (#3818's EARS criteria):
//   1. `needs-eric` + a `Needs from you` line → assign ejclark, one comment quoting the line.
//   2. label removed / issue closed → remove only the assignments this lane made (its marker),
//      and leave an unassign marker, so a label that returns later asks again (#5955).
//   3. never a second assignment comment on one issue — the marker is the memory — unless this
//      lane's own unassign came after it; his unassign leaves no marker and stays his answer.
//      `askOnce` is what holds this when two sweeps overlap.
//   4. a held or platter PR unmerged ≥12h → assign ejclark.
//   And never an ask his answer cannot complete yet (#6953 slice 2, `artifactGap`): a merge of a
//   branch with no PR, or of a PR that carries only a patch. Those go to `needsSession` — the
//   digest's "needs a session" line, with every `needs-session` issue — because the missing actor is
//   a session that can open the PR or apply the patch, not Eric.
// And the HONEST QUEUE half: every open `needs-eric` with the one decision it waits on, flagging the
// ones that state none — `needs-eric` means exactly one thing, a decision only Eric can make
// (CLAUDE.md), so a label with no stated decision is a candidate to clear, never an assignment.
//
// #4293 (digest criterion 12): `plan()` also returns `needsYou` — the set Eric holds once this run's
// writes land — and `digest-scan.mjs --needs-you` prints exactly that list. One selector, two
// readers; tests/scripts/moneypenny/needs-you.spec.ts fails if they ever disagree.

import { isMain } from "../is-main.mjs";
import { executeReadback, ledgerRows, readbackComment, readbackFor } from "./answer-readback.mjs";
import {
  ASSIGN_MARKER,
  askRank,
  assignmentComment,
  calloutLines,
  decisionLine,
  missingParts,
  parseAsk,
  UNASSIGN_MARKER,
} from "./ask-card.mjs";
import { ERIC, NEEDS_ERIC, withoutLaneAsk, writeIssueBody } from "./decision-callout.mjs";
import { ghRest, ghRestAll, sh, trustedComment, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";

// The card and its markers moved to ask-card.mjs (#6953 slice 3); callers keep importing them here.
export { ASSIGN_MARKER, assignmentComment, decisionLine, UNASSIGN_MARKER };
export const HOLD_MERGE = "hold-merge";
export const HELD_PR_HOURS = 12;
/** New assignments one sweep tick may make. See the header: the bound on a wrong read. */
export const ASSIGN_CAP = 3;
/** Asks he may hold at once (#6953 section 3); the rest wait in rank order and the card says how many. */
export const OPEN_CAP = 5;
/** His two touch points, UTC: 08:00 and 15:30 central. */
export const BATCH_STARTS_UTC = [
  [14, 0],
  [21, 30],
];
/** How long a dead sweep's lease on one ask can block the next: its writes take seconds. */
export const ASK_LEASE_MS = 10 * 60 * 1000;
/** How long a closed capsule's carried ask stays listed: repair.mjs's `REOPEN_DAYS`, in ms. Not
 *  imported — repair.mjs's own imports would ride into the digest's lazy import; a spec pins them. */
export const REOPEN_SINCE_MS = 14 * 864e5;

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const logins = (users = []) => users.map((u) => (typeof u === "string" ? u : u?.login));
const isEric = (login) => String(login ?? "").toLowerCase() === ERIC;

/** A branch the callout names: `` branch `x/y` `` or `` `x/y` branch ``. */
const DEFAULT_BRANCH = "main";
const NAMED_BRANCH = /\bbranch\s+`([^`\s]+)`|`([^`\s]+)`\s+branch\b/gi;

/**
 * Why this ask cannot be completed by his answer yet, or `null` (#6953 slice 2, call 1). Two
 * shapes, both measured on 2026-11-06's queue, where 5 of the digest's 10 lines were like this:
 *   - a merge ask naming a branch no open PR is built from (#6942: the fix sat on
 *     `fix/breaker-stepless-cancelled-leg` with no PR, because the lane could not open one);
 *   - a held PR whose files are all `*.patch` (#6620), or a merge ask naming one (#6618). The App
 *     cannot push workflow files, so the edit rides as a patch, and merging it changes nothing.
 * The actor missing in both is a session, so the ask goes to "needs a session", never to him.
 * `openHeads` is every open PR's head branch; `patchOnly` the PR numbers read as patch-only. Pure.
 */
export function artifactGap(item, { openHeads = new Set(), patchOnly = new Set() } = {}) {
  if (patchOnly.has(item.number)) return "a held PR whose only files are patches";
  const text = (calloutLines(item.body) ?? []).join("\n");
  if (!/\bmerge/i.test(text)) return null;
  for (const m of text.matchAll(NAMED_BRANCH)) {
    const branch = m[1] ?? m[2];
    // The base a PR merges INTO is named the same way ("into the `main` branch"); it is never a head.
    if (branch === DEFAULT_BRANCH) continue;
    if (!openHeads.has(branch))
      return `asks for a merge of branch \`${branch}\`, which no open PR is built from`;
  }
  for (const m of text.matchAll(/#(\d+)\b/g)) {
    const n = Number(m[1]);
    if (patchOnly.has(n))
      return `asks for a merge of #${n}, a held PR whose only files are patches`;
  }
  return null;
}

/** The comment criterion 2 leaves: why the assignment came off, and the marker that lets a
 *  returning label ask again (the ask marker above it no longer counts as "asked"). Criterion 1
 *  asks only on an open issue, so a closed one is promised a re-ask on reopen, not on relabel. */
export function unassignmentComment({ why }) {
  const back = `\`${NEEDS_ERIC}\` comes back with a stated decision`;
  const when = why === "issue closed" ? `it is reopened and ${back}` : back;
  return [
    `Unassigned — ${why}. If ${when}, this lane asks again.`,
    "",
    UNASSIGN_MARKER,
    "",
    FOOTER,
  ].join("\n");
}

/**
 * Is this issue "marked" — asked by this lane, and not since cleared by it? True when the newest
 * trusted comment carrying either marker is an ask. An unassign he did by hand leaves no marker, so
 * it still reads as his answer (criterion 3); only the lane's own unassign re-opens the question.
 * Comments arrive oldest first from REST. A stranger's marker never counts: this repo is public
 * (`trustedComment`). Pure.
 */
export function markedByComments(comments = []) {
  let marked = false;
  for (const c of comments) {
    if (!trustedComment(c)) continue;
    const body = c.body ?? "";
    if (body.includes(UNASSIGN_MARKER)) marked = false;
    else if (body.includes(ASSIGN_MARKER)) marked = true;
  }
  return marked;
}

/** When the lane last posted an ask (an ask marker from a trusted comment), in ms, else 0. Pure. */
export function lastAskedAt(comments = []) {
  let at = 0;
  for (const c of comments) {
    if (trustedComment(c) && (c.body ?? "").includes(ASSIGN_MARKER)) {
      at = Math.max(at, Date.parse(c.created_at ?? "") || 0);
    }
  }
  return at;
}

/**
 * Plan every action, write nothing. Inputs are REST shapes (labels/assignees as objects or
 * strings); `markers` is the set of issue/PR numbers already carrying this lane's marker comment.
 * Returns `{ queue, actions, needsYou }`: `queue` is the honest-queue listing, `actions` the
 * would-be writes, each with the criterion and a one-line why, and `needsYou` the set Eric holds
 * once those writes land (criterion 12 — the digest's Needs-you list). Pure.
 */
export function plan({
  issues = [],
  prs = [],
  markers = new Set(),
  patchOnly = new Set(),
  sessionIssues = [],
  replies = [],
  now = Date.now(),
} = {}) {
  const queue = [];
  const actions = [];
  const needsYou = [];
  const needsSession = [];
  // Asks he already holds (counted against OPEN_CAP) and the asks whose callout lacks part of the card.
  const holding = new Set();
  const incomplete = [];
  const ask = (row) => needsYou.some((n) => n.number === row.number) || needsYou.push(row);
  const session = (row) =>
    needsSession.some((n) => n.number === row.number) || needsSession.push(row);
  const gaps = { openHeads: new Set(prs.map((pr) => pr.head?.ref).filter(Boolean)), patchOnly };
  // CRITERION 4 OUTRANKS CRITERION 2 ON THE SAME NUMBER, and this set is what makes that true.
  // GitHub lists a PR among `issues`, so a PR assigned under criterion 4 reaches `planIssue` as an
  // issue that is marked, assigned and has no `needs-eric` — which reads as "the label came off,
  // clear it". The first live run (2026-10-02, #4436) assigned the held PR and the next tick wanted
  // to unassign it: an assign/unassign loop pushing at Eric twice per cycle. Computed before either
  // loop, because the issue pass runs first (its results are what dedupes criterion 4's own ask).
  const stillHeld = new Set(
    prs.filter((pr) => heldPrHours(pr, now) !== null).map((pr) => pr.number),
  );
  const reading = new Set(replies.filter((r) => markers.has(r.number)).map((r) => r.number));
  for (const issue of issues) {
    planIssue(issue, {
      reading,
      markers,
      now,
      queue,
      actions,
      ask,
      session,
      gaps,
      stillHeld,
      holding,
      incomplete,
    });
  }
  // His reply under an ask the lane stands behind: read it back, clear the ask (answer-readback.mjs).
  for (const r of replies) {
    if (!markers.has(r.number)) continue;
    reading.add(r.number);
    holding.delete(r.number);
    actions.push({
      kind: "readback",
      criterion: 1,
      number: r.number,
      title: r.title,
      why: "his reply under the ask",
      readback: r,
    });
  }
  for (const pr of prs) planHeldPr(pr, { markers, now, actions, ask, session, gaps, holding });
  for (const i of sessionIssues) sessionRow(i, now, session);
  return { queue, actions, needsYou, needsSession, incomplete, holding: holding.size };
}

/** Criterion 4 for one PR: a held PR unmerged past the window is his click, or a session's. */
function planHeldPr(pr, { markers, now, actions, ask, session, gaps, holding }) {
  const hours = heldPrHours(pr, now);
  if (hours === null) return;
  if (logins(pr.assignees).some(isEric)) holding.add(pr.number);
  const why = `held PR unmerged ${Math.floor(hours)}h (≥${HELD_PR_HOURS}h)`;
  const gap = artifactGap(pr, gaps);
  if (gap) {
    session({ number: pr.number, title: pr.title, why: gap });
    // Already his (by hand, or asked before this rule): he holds it, so the digest says so.
    if (logins(pr.assignees).some(isEric))
      ask({ number: pr.number, title: pr.title, criterion: 4, why });
    return;
  }
  ask({ number: pr.number, title: pr.title, criterion: 4, why });
  if (actions.some((a) => a.kind === "assign" && a.number === pr.number)) return; // one ask each
  // `!markers.has` is criterion 3 applied to criterion 4, and it is load-bearing, not symmetry.
  // Without it: Eric unassigns himself from a still-held PR, which drops it out of `gather()`'s
  // issue reads (no `needs-eric`, no longer assigned to him) so nothing else can see it — and
  // every later push re-assigns him and posts another marker comment, forever, with `stillHeld`
  // blocking criterion 2 from ever clearing it. Marked means asked; an unassign after that is his
  // answer.
  if (!(markers.has(pr.number) || logins(pr.assignees).some(isEric))) {
    actions.push({
      kind: "assign",
      criterion: 4,
      number: pr.number,
      title: pr.title,
      why,
      // A held PR carries no callout, so name the one thing that IS known: it is held, and a held
      // PR only moves on his click. Deliberately does NOT claim green or protected — `heldPrHours`
      // reads state, draft, label and age and nothing else, and `hold-merge` also goes on a PR
      // held for a taste fork, so either word would be the app telling him something it never
      // checked.
      decision: `Merge this held PR, or say what it's waiting on — it has been open and held ${Math.floor(hours)}h, and a held PR moves only on your click.`,
      heldPr: true,
      rank: askRank({ labels: pr.labels, title: pr.title }),
    });
  }
}

// What a session already holds: `needs-session`, open — or a CI capsule closed by capsule-stall's
// proof ("not planned") with its ask carried, which is the one way a closed issue still waits on
// work. Only while repair.mjs would reopen it (`REOPEN_SINCE_MS`): a fault quiet that long has
// nothing left waiting, and the label stays on closed issues, so without a bound the line grows.
function sessionRow(i, now, session) {
  const open = (i.state ?? "open") === "open";
  if (!open) {
    if (i.pull_request || i.state_reason !== "not_planned") return;
    if (!names(i.labels).includes(LABELS.ciFailure.name)) return;
    if (!(now - Date.parse(i.closed_at ?? "") <= REOPEN_SINCE_MS)) return;
  }
  session({
    number: i.number,
    title: i.title,
    why: open ? "labelled needs-session" : "closed with its ask handed to a session",
    decision: decisionLine(i.body) ?? undefined,
  });
}

/** Criterion 1's assign action for an issue whose callout states a decision, ranked and carded. */
function queueAsk(issue, { decision, why, actions }) {
  const items = parseAsk(issue.body);
  actions.push({
    kind: "assign",
    criterion: 1,
    number: issue.number,
    title: issue.title,
    why,
    decision,
    items,
    rank: askRank({ labels: issue.labels, title: issue.title, decision }),
  });
}

/** Criteria 1–3 and the honest queue, for one issue (or a PR GitHub lists as one). */
function planIssue(
  issue,
  {
    markers,
    now,
    queue,
    actions,
    ask,
    session,
    gaps,
    stillHeld = new Set(),
    holding = new Set(),
    incomplete = [],
    reading = new Set(),
  },
) {
  const assigned = logins(issue.assignees).some(isEric);
  const marked = markers.has(issue.number);
  const open = (issue.state ?? "open") === "open";
  const act = (kind, criterion, why) =>
    actions.push({ kind, criterion, number: issue.number, title: issue.title, why });

  if (!(open && names(issue.labels).includes(NEEDS_ERIC))) {
    if (marked && assigned && !stillHeld.has(issue.number) && !reading.has(issue.number)) {
      act("unassign", 2, open ? "needs-eric removed" : "issue closed");
    }
    return;
  }
  const decision = decisionLine(issue.body);
  queue.push({
    number: issue.number,
    title: issue.title,
    decision,
    author: issue.user?.login ?? "",
    assigned,
    ageDays: Math.floor((now - Date.parse(issue.created_at ?? now)) / 864e5),
  });
  // No stated decision → a clear candidate, never an ask. Marked → criterion 3, asked once
  // already and not since cleared by this lane (`markedByComments`: a label that comes back after
  // the lane's own unassign is unmarked, and asks again). Assigned → his by hand; nothing to add.
  const why = `needs-eric with a stated decision: "${decision}"`;
  // Nothing his answer could act on exists yet: a session's, not his — unless he already holds it.
  const gap = decision ? artifactGap(issue, gaps) : null;
  if (gap) {
    session({ number: issue.number, title: issue.title, why: gap, decision });
    if (assigned) ask({ number: issue.number, title: issue.title, criterion: 1, why, decision });
    return;
  }
  if (decision && assigned) holding.add(issue.number);
  if (decision && !marked && !assigned) queueAsk(issue, { decision, why, actions });
  // Needs-you = what he holds after this run: stated, and either his already or about to be. A
  // marked issue he unassigned himself stays off — criterion 3 means the lane won't re-ask. (One
  // the LANE unassigned is not marked any more, so it is back on the list the moment it asks.)
  if (decision && (assigned || !marked)) {
    ask({ number: issue.number, title: issue.title, criterion: 1, why, decision });
    const missing = missingParts(parseAsk(issue.body));
    if (missing.length) incomplete.push({ number: issue.number, title: issue.title, missing });
  }
}

/** Criterion 4's test for one PR: held (`hold-merge` or `platter/`), open, ready, ≥12h → hours. */
function heldPrHours(pr, now) {
  if ((pr.state ?? "open") !== "open" || pr.draft) return null;
  const held = names(pr.labels).includes(HOLD_MERGE) || /^platter\//.test(pr.head?.ref ?? "");
  if (!held) return null;
  const hours = (now - Date.parse(pr.created_at ?? now)) / 36e5;
  return hours < HELD_PR_HOURS ? null : hours;
}

/** The dry run's report, as markdown — what Eric reads before anything is switched on. Pure. */
export function report({ queue, actions, needsSession = [] }) {
  const out = ["## Honest queue — open `needs-eric`", ""];
  if (!queue.length) out.push("_none_");
  else {
    out.push("| # | Waits on | Age | Assigned | Verdict |", "|---|---|---|---|---|");
    for (const q of queue) {
      const verdict = q.decision ? "keep" : "**clear candidate** — no stated decision";
      const waits = q.decision ? q.decision.replaceAll("|", "\\|") : "—";
      out.push(
        `| #${q.number} | ${waits} | ${q.ageDays}d | ${q.assigned ? "yes" : "no"} | ${verdict} |`,
      );
    }
  }
  const clear = queue.filter((q) => !q.decision).length;
  out.push("", `${queue.length} open · ${clear} with no stated decision (listed, not cleared).`);
  out.push("", "## Needs a session, not Eric", "");
  if (!needsSession.length) out.push("_none_");
  for (const s of needsSession) out.push(`- #${s.number} — ${s.why}`);
  out.push("", "## Would do (dry run — nothing written)", "");
  if (!actions.length) out.push("_nothing_");
  for (const a of actions)
    out.push(`- **${a.kind}** #${a.number} (criterion ${a.criterion}) — ${a.why}`);
  return out.join("\n");
}

/**
 * The latest batch start at or before `now`: 14:00Z and 21:30Z, his two touch points (08:00 and
 * 15:30 central). One batch is the first tick after a start; `routeAssignments` sends nothing more
 * until the next. Pure.
 */
export function batchStart(now = Date.now()) {
  const d = new Date(now);
  const at = (days, h, m) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, h, m);
  return Math.max(
    ...BATCH_STARTS_UTC.flatMap(([h, m]) => [at(0, h, m), at(-1, h, m)]).filter((t) => t <= now),
  );
}

/**
 * The sweep's view of `plan()`: `plan`'s actions as intents `index.mjs` can execute, batched.
 *
 * Pure, and a no-op without `deps.assignments` — every non-push event and every `routeSweep`
 * fixture that predates this lane therefore routes exactly as it did before.
 *
 * Removals and read-backs go first and are never capped or batched (criterion 2: a stale assignment
 * is still pushing at him; a reply he has given should clear at once). New asks follow
 * #6953's rhythm: one batch per window (`batchStart`), at most `ASSIGN_CAP` per tick, never past
 * `OPEN_CAP` open at once, ranked by `askRank` and then oldest number first — REST hands back
 * `labels=` newest-first and a cap applied to that order would starve the items that have waited
 * longest, which is exactly the 15.5-day median this plan set out to fix. Only an ask that stops
 * bots or production (rank 1) goes between batches and past the open cap. `lastAskAt` is the newest
 * ask the lane posted; without it nothing is known to have gone out this window.
 *
 * @param deps { assignments: { issues, prs, markers, replies, lastAskAt }, now }
 * @returns Intent[] — `[]` on most pushes, which is the correct answer.
 */
export function routeAssignments(deps = {}) {
  const { assignments, now = Date.now() } = deps;
  if (!assignments) return [];
  const { actions, holding } = plan({ ...assignments, now });
  const removals = actions.filter((a) => a.kind === "unassign");
  const readbacks = actions.filter((a) => a.kind === "readback");
  const asks = actions
    .filter((a) => a.kind === "assign")
    .sort((a, b) => (a.rank ?? 4) - (b.rank ?? 4) || a.number - b.number);
  const windowOpen = !((assignments.lastAskAt ?? 0) >= batchStart(now));
  const room = Math.max(0, OPEN_CAP - holding);
  const urgent = asks.filter((a) => a.rank === 1).slice(0, ASSIGN_CAP);
  const regular = windowOpen
    ? asks.filter((a) => a.rank !== 1).slice(0, Math.min(ASSIGN_CAP - urgent.length, room))
    : [];
  const batch = [...urgent, ...regular];
  const more = asks.length - batch.length;
  if (more > 0) {
    // stderr only — stdout carries machine-read output on some call paths of this router.
    console.error(
      `::notice::assignments — asking Eric about ${batch.length} of ${asks.length} item(s) this ` +
        `tick (cap ${ASSIGN_CAP}, ${holding} open of ${OPEN_CAP}, ${windowOpen ? "batch window open" : "next batch later"}).`,
    );
  }
  const intents = [...removals, ...readbacks, ...batch].map((a) => {
    if (a.kind === "readback") return readbackIntent(a);
    return {
      kind: a.kind === "assign" ? "assign-eric" : "unassign-eric",
      number: a.number,
      title: a.title,
      criterion: a.criterion,
      why: a.why,
      body:
        a.kind === "assign"
          ? assignmentComment({ decision: a.decision, items: a.items, more, heldPr: a.heldPr })
          : undefined,
    };
  });
  return intents;
}

/** A planned read-back as the intent index.mjs executes (`askOnce`, under the issue's lease). */
function readbackIntent(a) {
  const { answer, card, reply } = a.readback;
  const rows = ledgerRows({ number: a.number, title: a.title, card, answer, reply });
  const body = readbackComment({ answer, rows });
  return {
    kind: "readback-eric",
    number: a.number,
    title: a.title,
    criterion: 1,
    why: a.why,
    said: body.split("\n")[0],
    body,
  };
}

/**
 * Carry out one assignment intent. THE ASSIGNMENT GOES FIRST, and which order is a real choice.
 *
 * Two writes cannot be atomic, so one can land alone — so pick the order whose half-write is the
 * recoverable one, and the marker comment is what decides that. The marker IS this lane's memory
 * (criteria 2 and 3), so:
 *   - comment first, assign fails → the issue is marked, so criterion 1 never asks again AND
 *     `needsYou` drops it (`decision && (assigned || !marked)`). The decision disappears from the
 *     assignment channel and from `digest-scan --needs-you` at once. Unrecoverable and silent.
 *   - assign first, comment fails → Eric holds the assignment, so the phone push (the entire point)
 *     landed and the digest still lists it; only the convenience quote is missing, and the issue's
 *     own `Needs from you` callout is the real copy anyway.
 * The second is strictly the better failure, so: assign, then comment. Both writes are retried for
 * GitHub's own 5xx, which is the overwhelmingly likely cause of a single-write failure.
 *
 * `gh api`, not `gh issue edit`/`gh issue comment`: criterion 4's targets are PRs, and the issue
 * subcommands refuse a PR number while the `issues/` REST route serves both.
 */
export function executeAssignments(intent, { run = sh, retry = withRetry } = {}) {
  const n = String(intent.number);
  const assignees = (method) =>
    retry(() =>
      run("gh", [
        "api",
        "--method",
        method,
        `repos/{owner}/{repo}/issues/${n}/assignees`,
        "-f",
        `assignees[]=${ERIC}`,
      ]),
    );
  const comment = (body) =>
    retry(() =>
      run("gh", [
        "api",
        "--method",
        "POST",
        `repos/{owner}/{repo}/issues/${n}/comments`,
        "-f",
        `body=${body}`,
      ]),
    );
  if (intent.kind === "unassign-eric") {
    // Same order, same reasoning: the removal is the write that matters, the marker is memory. A
    // marker lost after a good removal costs one thing — a label that returns reads as his answer
    // and is not re-asked, which is exactly what every unassign did before #5955's fix.
    assignees("DELETE");
    comment(unassignmentComment({ why: intent.why }));
    return `🧹 unassigned #${n} — ${intent.why}`;
  }
  assignees("POST");
  comment(intent.body);
  return `📬 assigned #${n} to @${ERIC} (criterion ${intent.criterion}) — ${intent.why}`;
}

/**
 * Run `work` while holding the one lease this issue's asks share, or return the line saying why not.
 *
 * WHY A LEASE. A push sweep and a `scan` dispatch run in separate concurrency groups (#5130), so both
 * can gather no marker and both can write one: #4621 and #5709 got the same ask twice, 6 seconds
 * apart, on 2026-11-01. A read just before the write closes most of that window but not a read
 * landing between another sweep's two writes. Creating a ref is a real compare-and-set
 * (claim-lease.mjs), and the read under it is what stops the sweep that takes the lease just after
 * the first one lets go.
 *
 * A LEASE GITHUB REFUSES NEVER COSTS HIM THE ASK. A duplicate comment is the smaller failure, so any
 * refusal other than another holder writes anyway. `lease` is left out by the by-hand CLI, which is
 * one person at a keyboard, and `index.mjs` supplies it because `claimHandoff` lives there.
 */
export function withAskLease(number, lease, work) {
  const slug = `ask-${number}`;
  const taken = lease ? lease.claim(slug) : null;
  if (taken && !taken.claimed) {
    if (!/^could not create the lease/.test(taken.reason ?? "")) {
      return `· #${number} — another sweep holds this ask (${taken.reason})`;
    }
    console.error(`::warning::#${number} — ${taken.reason}; writing without the lease`);
  }
  try {
    return work();
  } finally {
    if (taken?.claimed) lease.release(slug);
  }
}

/**
 * `executeAssignments`, once: the marker comments are re-read under the lease, because the plan was
 * made from a read that can be minutes old by now. Clearing the label also takes back any ask this
 * lane wrote into the body, so an answered question stops reading as open. That comes first: the
 * unassign marker ends this lane's interest in the issue, so a failure after it would never retry.
 */
export function askOnce(
  intent,
  { run = sh, retry = withRetry, rest = ghRestAll, read = ghRest, lease = null } = {},
) {
  const n = intent.number;
  return withAskLease(n, lease, () => {
    const asking = intent.kind === "assign-eric";
    if (markedByComments(rest(`issues/${n}/comments`)) === asking) {
      return `· #${n} — another sweep already ${asking ? "asked" : "cleared this"}`;
    }
    // A read-back clears the body's ask itself, after it has checked the issue still wants it.
    if (intent.kind === "readback-eric") return executeReadback(intent, { run, retry, read });
    if (!asking) {
      const body = retry(() => read(`issues/${n}`))?.body ?? "";
      const cleared = withoutLaneAsk(body);
      if (cleared !== body) writeIssueBody(n, cleared, { run, retry });
    }
    return executeAssignments(intent, { run, retry });
  });
}

/** The live REST read both the dry run and the digest plan from — one gather, one `plan()`.
 *  `rest` and `now` are injectable so a spec can drive the marker read without GitHub or a clock. */
export function gather({ rest = ghRestAll, now = Date.now() } = {}) {
  // PRs stay in: a held PR can carry `needs-eric` too (#4361), and GitHub lists it as an issue.
  const issues = rest(`issues?state=open&labels=${NEEDS_ERIC}`);
  // Criterion 2's candidates: things Eric holds that may have lost the label or closed since.
  const seen = new Set(issues.map((i) => i.number));
  const since = new Date(now - 14 * 864e5).toISOString();
  for (const i of rest(`issues?state=all&assignee=${ERIC}&since=${since}`)) {
    if (!seen.has(i.number)) issues.push(i);
  }
  const prs = rest("pulls?state=open");
  // Marker candidates: every issue above, PLUS the held PRs criterion 4 targets. The PRs matter —
  // without their markers, a PR Eric unassigned himself from is invisible to every other read here
  // and gets re-asked on every push (see `plan`'s `!markers.has(pr.number)`). Only the ones already
  // past the hold window, so this is normally one or two extra reads, not one per open PR.
  const candidates = new Set(issues.map((i) => i.number));
  for (const pr of prs) if (heldPrHours(pr, now) !== null) candidates.add(pr.number);
  const markers = new Set();
  const replies = [];
  let lastAskAt = 0;
  const byNumber = new Map(issues.map((i) => [i.number, i]));
  for (const n of candidates) {
    const comments = rest(`issues/${n}/comments`);
    if (markedByComments(comments)) markers.add(n);
    lastAskAt = Math.max(lastAskAt, lastAskedAt(comments));
    const found = byNumber.has(n) ? readbackFor(byNumber.get(n), comments) : null;
    if (found) replies.push(found);
  }
  // Patch-only reads (`artifactGap`): the held PRs above, any PR that is itself an ask, and any
  // open PR an ask names — a handful of file lists, never one per open PR.
  const open = new Set(prs.map((pr) => pr.number));
  const named = issues.flatMap((i) =>
    [...(calloutLines(i.body) ?? []).join("\n").matchAll(/#(\d+)\b/g)].map((m) => Number(m[1])),
  );
  const patchOnly = new Set();
  for (const n of new Set([...candidates, ...named])) {
    if (!open.has(n)) continue;
    const files = rest(`pulls/${n}/files`);
    if (files.length && files.every((f) => String(f?.filename ?? "").endsWith(".patch"))) {
      patchOnly.add(n);
    }
  }
  // Open ones, and closed CI capsules updated inside the window — both bounded reads.
  const label = LABELS.needsSession.name;
  const closedSince = new Date(now - REOPEN_SINCE_MS).toISOString();
  const sessionIssues = [
    ...rest(`issues?state=open&labels=${label}`),
    ...rest(`issues?state=closed&labels=${label},${LABELS.ciFailure.name}&since=${closedSince}`),
  ];
  return { issues, prs, markers, patchOnly, sessionIssues, replies, lastAskAt };
}

function main(argv) {
  const apply = argv.includes("--apply");
  const deps = gather();
  const planned = plan(deps);
  if (!apply) {
    console.log(argv.includes("--json") ? JSON.stringify(planned, null, 2) : report(planned));
    if (planned.actions.length) console.log("\nRun again with --apply to write them.");
    return;
  }
  // By hand, the same path the push sweep takes — one route, never a second that can drift.
  const intents = routeAssignments({ assignments: deps });
  if (!intents.length) {
    console.log("· nothing to assign or clear");
    return;
  }
  for (const i of intents) console.log(askOnce(i));
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
