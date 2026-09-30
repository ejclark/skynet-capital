// THE ADMISSION GATE (#3960 criteria 1, 2, 7) — the throttle between "this issue is ready" and "a
// build session starts on it". Both claim lanes (`claimFeedback`, `claimPlan` in index.mjs) ask it
// AFTER their ready/parking checks and BEFORE they take a lease, so a refused issue holds no lease,
// never gets `in-progress`, and keeps its `ready` label — a later tick (the retry sweep, wired in
// the workflow) asks again via `nextAdmissible`.
//
// PURE HALF: `surfaceOf`, `admitBuild`, `nextAdmissible`, `queueNote`, `isDuplicateQueueNote` — no
// network, no clock. IMPURE HALF: `readInFlight` and `gateAdmission`, every read injectable so a
// spec drives them without a fake `gh` (tests/scripts/moneypenny/admission.spec.ts).
//
// THE RULES, in the order they are asked (the first refusal wins):
//   1. `halt` refuses everything — even `fast-track`. A brake is a brake (work-mode.mjs ACTOR_RULES:
//      fast-track "lets an urgent bug/CVE build under conserve; never under halt").
//   2. `conserve` refuses anything without `fast-track`.
//   3. The in-flight cap: `mode.caps.inFlightCap` open issues already carrying `in-progress`
//      (this issue excluded) refuses anything without `fast-track`.
//   4. THE SURFACE FENCE (criterion 7): an in-flight issue on the same capsule `Surface` refuses,
//      and `fast-track` does NOT bypass it. Urgency changes how soon a build may start, never
//      whether two builds may race the same files — an urgent fix colliding with a half-built
//      change on the same surface is still a collision, and a merge conflict mid-incident is the
//      worst time to meet one.
//
// FENCE MATCHING IS DELIBERATELY SIMPLE: the Surface cell, markdown stripped, lowercased,
// whitespace-collapsed, compared exactly. Two issues describing one surface in different words do
// not collide (a missed fence costs a merge conflict, which the conflict sweep already catches); a
// looser match would queue unrelated work (a false fence costs throughput, silently). Tighten it
// only with measured misses in hand.
import { classOf } from "../rank.mjs";
import { sh } from "./gh.mjs";
import { FOOTER, isBuildable, LABELS, labelNames } from "./labels.mjs";
import { noticeLine, readWorkMode } from "./work-mode.mjs";

/** Hidden marker on every queue note, so the dedupe finds this lane's own comments. */
export const QUEUE_MARKER = "<!-- moneypenny:queued -->";

/** Surface cells that name no surface — each would otherwise fence every other issue saying it. */
const NO_SURFACE = new Set(["", "-", "—", "–", "n/a", "na", "none", "tbd", "?"]);

const SURFACE_ROW = /^[ \t]*\|[ \t]*\**[ \t]*surface[ \t]*\**[ \t]*\|([^|\n]*)/im;

/**
 * The capsule's `| **Surface** | … |` cell, normalised for the fence: markdown links reduced to
 * their text, backticks and bold stripped, whitespace collapsed, lowercased. Null when the body has
 * no Surface row or the cell names nothing (`—`, `n/a`, `tbd`).
 */
export function surfaceOf(body) {
  const m = SURFACE_ROW.exec(String(body ?? ""));
  if (!m) return null;
  const text = m[1]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return NO_SURFACE.has(text) ? null : text;
}

const hasLabel = (issue, name) => labelNames(issue?.labels).includes(name);

/**
 * The pure admission decision. `inFlight` is every open issue carrying `in-progress` (this issue
 * is excluded here, so a caller may pass the raw list); `mode` is `readWorkMode()`'s result.
 *
 * @returns {{ admit: boolean, reason: string, queuedBehind?: number }}
 */
export function admitBuild({ issue, inFlight = [], mode }) {
  const fastTrack = hasLabel(issue, LABELS.fastTrack.name);
  const position = mode?.position;
  if (position === "halt") return { admit: false, reason: "work-mode is halt" };
  if (position === "conserve" && !fastTrack) {
    return { admit: false, reason: "queued: conserve mode" };
  }
  const others = (inFlight ?? []).filter((i) => i && i.number !== issue?.number);
  const cap = mode?.caps?.inFlightCap ?? 0;
  if (others.length >= cap && !fastTrack) {
    return { admit: false, reason: `queued: ${others.length} of ${cap} in flight` };
  }
  const surface = surfaceOf(issue?.body);
  const blocker = surface ? others.find((i) => surfaceOf(i.body) === surface) : undefined;
  if (blocker) {
    return {
      admit: false,
      reason: `queued behind #${blocker.number} (same surface: ${surface})`,
      queuedBehind: blocker.number,
    };
  }
  return { admit: true, reason: fastTrack ? `admitted (fast-track, ${position})` : "admitted" };
}

const createdMs = (i) => {
  const t = Date.parse(i?.createdAt ?? i?.created_at ?? "");
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/** The rank class (`P0`–`P3`) and bug-expedite flag `npm run rank` gives an issue, from its labels. */
const rankOf = (i) => classOf({ labels: labelNames(i.labels) });

/**
 * For the retry sweep: the one ready issue to try next, or null. Skips anything already in flight
 * or parked; `fast-track` goes first (it is urgent by definition), then the same order
 * `npm run rank` shows — class (a hand-set `P0`–`P3` wins), an expedited bug first inside its class
 * (Eric, 2026-09-30: bugs found mid-build are the next pull) — then oldest by `createdAt`, then
 * lowest number. Oldest-first alone picked a P3 idea (#784) over P0 work on the sweep's first live
 * tick. One per call — admitting it changes the in-flight list the next pick sees.
 */
export function nextAdmissible(readyIssues = [], inFlight = [], mode) {
  const candidates = (readyIssues ?? [])
    .filter((i) => i && !hasLabel(i, LABELS.inProgress.name) && isBuildable(i.labels))
    .map((i) => ({ i, r: rankOf(i) }))
    .sort(
      (a, b) =>
        Number(hasLabel(b.i, LABELS.fastTrack.name)) -
          Number(hasLabel(a.i, LABELS.fastTrack.name)) ||
        a.r.cls.localeCompare(b.r.cls) ||
        Number(Boolean(b.r.expedite)) - Number(Boolean(a.r.expedite)) ||
        createdMs(a.i) - createdMs(b.i) ||
        (a.i.number ?? 0) - (b.i.number ?? 0),
    )
    .map(({ i }) => i);
  return candidates.find((issue) => admitBuild({ issue, inFlight, mode }).admit) ?? null;
}

/** The first body line a queue note carries — also the dedupe key. */
const reasonLine = (reason) => `⏸ **Not started yet** — ${reason}.`;

/** The comment a refused issue gets. Carries the lane FOOTER and the hidden marker. */
export function queueNote(reason) {
  return [
    QUEUE_MARKER,
    reasonLine(reason),
    "",
    "This issue keeps `ready`; the lane retries it on a later tick — nothing to do here. " +
      "An urgent bug or CVE can take `fast-track` to skip the queue (never the halt, never the " +
      "same-surface fence).",
    "",
    FOOTER,
  ].join("\n");
}

/** Did this lane's newest queue note already say exactly this? (Comments oldest-first, as gh.) */
export function isDuplicateQueueNote(comments = [], reason) {
  const ours = (comments ?? []).filter((c) => String(c?.body ?? "").includes(QUEUE_MARKER));
  const newest = ours[ours.length - 1];
  return Boolean(newest && String(newest.body).includes(reasonLine(reason)));
}

/**
 * Open issues carrying `label`, OLDEST FIRST, over REST (the core bucket — gh.mjs's header). One
 * page of 100: for `in-progress` the cap is single digits, so 100 is far past any legitimate state;
 * for `ready` the sweep wants the oldest, which is exactly what the first ascending page holds.
 * PRs are dropped (the issues endpoint returns them too). A non-list answer throws — never "none".
 */
export function readOpenIssues(label, exec = sh) {
  const rows = JSON.parse(
    exec("gh", [
      "api",
      `repos/{owner}/{repo}/issues?state=open&labels=${label}&sort=created&direction=asc&per_page=100`,
    ]) || "[]",
  );
  if (!Array.isArray(rows)) throw new Error(`the open \`${label}\` read did not return a list`);
  return rows
    .filter((r) => !r.pull_request)
    .map((r) => ({
      number: r.number,
      state: r.state ?? "open",
      body: r.body ?? "",
      labels: r.labels ?? [],
      createdAt: r.created_at,
    }));
}

/** Every open issue carrying `in-progress` — the list the cap and the fence count. */
export const readInFlight = (exec = sh) => readOpenIssues(LABELS.inProgress.name, exec);

const readComments = (n) =>
  JSON.parse(sh("gh", ["issue", "view", String(n), "--json", "comments"]) || "{}").comments ?? [];

const postComment = (n, body) => sh("gh", ["issue", "comment", String(n), "--body", body]);

/**
 * The impure call both claim lanes make. Reads the dial and the in-flight list, asks `admitBuild`,
 * and on refusal posts ONE queue note (skipped when the newest one already says the same thing).
 * An unreadable in-flight list refuses without a note — fail closed, and a GitHub blip is not news
 * for the issue's thread. A broken work-mode CONFIG still throws (work-mode.mjs's doctrine).
 *
 * @returns {{ admit: boolean, reason: string, queuedBehind?: number }}
 */
export function gateAdmission(issue, deps = {}) {
  const {
    readMode = () => readWorkMode(),
    readInFlight: inFlightOf = () => readInFlight(),
    comments = readComments,
    comment = postComment,
    log = console.log,
  } = deps;
  const mode = readMode();
  if (mode.warning) log(`::warning::${mode.warning}`);
  log(noticeLine(mode));
  let inFlight;
  try {
    inFlight = inFlightOf();
  } catch (err) {
    const reason = "queued: the in-flight list could not be read";
    log(`::warning::#${issue.number} ${reason} — ${String(err?.message).slice(0, 200)}`);
    return { admit: false, reason };
  }
  const verdict = admitBuild({ issue, inFlight, mode });
  if (verdict.admit) {
    log(`::notice::#${issue.number} ${verdict.reason}`);
    return verdict;
  }
  log(`::notice::not building #${issue.number} — ${verdict.reason}`);
  try {
    if (isDuplicateQueueNote(comments(issue.number), verdict.reason)) {
      log(`· #${issue.number} already carries this queue note — not repeating it`);
    } else {
      comment(issue.number, queueNote(verdict.reason));
    }
  } catch (err) {
    log(
      `::warning::could not post the queue note on #${issue.number}: ${String(err?.stderr || err?.message).slice(0, 200)}`,
    );
  }
  return verdict;
}
