#!/usr/bin/env node
// RANK — which open, buildable item should be pulled next, and why (#4064).
//
// WHY. #4056's study found the next build was whatever was newest: 57% of picks came from the newest
// tenth of the queue and 1% from the oldest, while Priority was never written or read. This is the
// ordering rule, written down where a lane or a session can read it. It is read-only: it prints and
// changes nothing. Its first reader is `/work-issues`, which pulls in this order (slice 2).
//
// THE RULE (settled on #4064, from Anderson/Vacanti: classes used sparingly, then first-in-first-out
// inside committed work). A coarse class with a one-line why; oldest-ready-first inside a class; an
// item past one delivery unit sorts below the ready units in its class, marked "split first". No
// numeric score: the signal is too thin to defend one, and a class is overruled in one word. A
// `P0`–`P3` label always wins: that is Eric's hand, one tap on the phone (he picked labels over the
// board field on 2026-09-29, because every lane can read a label and none can read the board).
//
// RE-RANK ON EVENTS (slice 3). The rank is derived live on every read and stores nothing, so a merge
// that closes a dependency, lands a slice or retires an item is already in the next read — there is
// no stale score for a merge tick to refresh, and no workflow to add. What a merge does change is
// the ORDER, and that is what `--digest` reports: the current rank diffed against the snapshot the
// previous digest embedded, as one line ("N moved up · M retired") plus the snapshot to embed next.
//
//   node scripts/rank.mjs          # markdown table
//   node scripts/rank.mjs --json
//   node scripts/rank.mjs --digest # the digest's moved/retired line + the snapshot marker to embed
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { digestFiles } from "./digest-scan.mjs";
import { readinessNotes } from "./issue-readiness.mjs";
import { ghRest, ghRestAll } from "./moneypenny/gh.mjs";
import { PRIORITY_LABELS, parkedBy } from "./moneypenny/labels.mjs";

const H = 3600e3;
const HORIZONS = new URL("./moneypenny/projects-horizons.json", import.meta.url);

/** The class, its one-line why, and whether a person set it. `blocks` lists the open issue numbers
 *  this one blocks (native dependencies); `horizon` is the board's hand triage, if any.
 *
 *  `bug` is P0 and `expedite` (Eric, 2026-09-30: "bug resolution opportunities discovered during
 *  development should be weighted with higher priority to expedite to completion compared to other
 *  work in queue and/or WIP"). It is checked before the other derived P0s so its why says so, and
 *  `rankOrder` sorts it first inside P0. A hand-set label still wins over it. */
export function classOf({ labels = [], blocks = [], horizon = null }) {
  const hand = PRIORITY_LABELS.find((p) => labels.includes(p));
  if (hand) return { cls: hand, why: "set by hand", hand: true };
  if (labels.includes("bug"))
    return { cls: "P0", why: "something is broken — expedite", expedite: true };
  if (blocks.length) return { cls: "P0", why: `unblocks #${blocks.join(", #")}` };
  if (labels.includes("bottleneck")) return { cls: "P0", why: "a measured constraint on delivery" };
  if (labels.some((l) => l.startsWith("member-")))
    return { cls: "P1", why: "a member asked for it" };
  if (labels.includes("idea") || horizon === "Later") return { cls: "P3", why: "parked for later" };
  return { cls: "P2", why: "improves a surface or a process" };
}

/** The labels that put an issue in the buildable backlog. `bottleneck` and `bug` are in on purpose:
 *  they carry the P0 signals, and a queue that only read plan/feedback left every bottleneck out
 *  (the first run's own finding). `ci-failure` stays out — the repair lane owns it. */
export const QUEUE_LABELS = ["plan", "feedback", "bottleneck", "bug"];
const inQueue = (labels) =>
  QUEUE_LABELS.some((l) => labels.includes(l)) && !labels.includes("ci-failure");

/** One rank row. Returns null for what is not a buildable backlog item: outside the queue, parked,
 *  or a parent whose work now lives in open sub-issues (the children are ranked instead). */
export function rankRow(issue, { readyAt = null, blocks = [], horizon = null, now }) {
  const labels = (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
  if (!inQueue(labels)) return null;
  if (parkedBy(labels).length) return null;
  const subs = issue.sub_issues_summary;
  if (subs && subs.total > subs.completed) return null;
  const body = issue.body ?? "";
  const notes = readinessNotes({ title: issue.title, body, labels });
  const { cls, why, hand = false, expedite = false } = classOf({ labels, blocks, horizon });
  return {
    number: issue.number,
    title: issue.title,
    cls,
    why,
    hand,
    expedite,
    ready: labels.includes("ready"),
    readyHours: readyAt ? Math.round((now - readyAt) / H) : null,
    splitFirst: notes.some((n) => n.includes("past one delivery unit")),
    remainder: labels.includes("next-slice"),
  };
}

/** Class, then an expedited bug first, then ready before not-ready, then one delivery unit before
 *  split-first, then oldest. */
export function rankOrder(rows) {
  return [...rows].sort(
    (a, b) =>
      a.cls.localeCompare(b.cls) ||
      Number(Boolean(b.expedite)) - Number(Boolean(a.expedite)) ||
      Number(b.ready) - Number(a.ready) ||
      Number(a.splitFirst) - Number(b.splitFirst) ||
      (b.readyHours ?? -1) - (a.readyHours ?? -1) ||
      a.number - b.number,
  );
}

const cell = (s) => String(s).replace(/\|/g, "\\|");
const age = (h) => (h === null ? "not ready" : h < 48 ? `${h}h` : `${Math.round(h / 24)}d`);

export function renderRank(rows) {
  const ordered = rankOrder(rows);
  const counts = ["P0", "P1", "P2", "P3"].map(
    (c) => `${c} ${rows.filter((r) => r.cls === c).length}`,
  );
  const lines = [
    `**${rows.length} buildable items · ${counts.join(" · ")}** — read-only; nothing here moves a label.`,
    "",
    "| # | Class | Issue | Why | Ready for | Note |",
    "|---|---|---|---|---|---|",
  ];
  ordered.forEach((r, i) => {
    const note = [
      r.splitFirst && "split first",
      r.remainder && "remainder pending",
      r.hand && "hand-set",
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `| ${i + 1} | ${r.cls} | #${r.number} ${cell(r.title)} | ${cell(r.why)} | ${age(r.readyHours)} | ${note} |`,
    );
  });
  return lines.join("\n");
}

// ─── The digest delta (slice 3) ──────────────────────────────────────────────────────────────────

const SNAPSHOT_RE = /<!-- rank-snapshot: ([\d,]*) -->/;

/** The ranked issue numbers as an invisible marker a digest carries to the next one. */
export const snapshotMarker = (numbers) => `<!-- rank-snapshot: ${numbers.join(",")} -->`;

/** The ranked numbers a digest embedded, or null when it carries none (every digest before this). */
export function parseSnapshot(text) {
  const m = SNAPSHOT_RE.exec(text ?? "");
  return m ? m[1].split(",").filter(Boolean).map(Number) : null;
}

/** What changed between two ranks. "Moved up" means an item overtook one it used to sit below and
 *  that is still ranked — a retirement shifting everyone below it up a row is not a move, or every
 *  closed issue would report the whole tail as risers. "Retired" left the rank: closed, parked, or
 *  replaced by its sub-issues. "Added" is new since the snapshot. */
export function rankDelta(prev, curr) {
  const was = new Map(prev.map((n, i) => [n, i]));
  const now = new Map(curr.map((n, i) => [n, i]));
  const kept = curr.filter((n) => was.has(n));
  const movedUp = kept.filter((n) =>
    kept.some((m) => m !== n && was.get(m) < was.get(n) && now.get(m) > now.get(n)),
  );
  return {
    movedUp,
    retired: prev.filter((n) => !now.has(n)),
    added: curr.filter((n) => !was.has(n)),
  };
}

/** The digest line. With no prior snapshot it says so plainly instead of reporting a false zero. */
export function digestLine(prev, curr, since) {
  if (!prev) return `Rank: ${curr.length} items — baseline set; the next digest reports movement.`;
  const { movedUp, retired, added } = rankDelta(prev, curr);
  const ids = (ns) => (ns.length ? ` (#${ns.join(", #")})` : "");
  return (
    `Rank since ${since}: ${movedUp.length} moved up${ids(movedUp)} · ${retired.length} retired` +
    `${ids(retired)} · ${added.length} new.`
  );
}

// ─── IO (REST core bucket) ───────────────────────────────────────────────────────────────────────

function liveRows() {
  const now = Date.now();
  // A local file, not the API: the board is unreadable from sessions (#4056's L2 study), and this
  // hand triage is the only Horizon data a script can see.
  let horizons = {};
  try {
    horizons = JSON.parse(readFileSync(HORIZONS, "utf8"));
  } catch {
    horizons = {};
  }
  const open = ghRestAll("issues?state=open").filter((i) => !i.pull_request);
  const openNumbers = new Set(open.map((i) => i.number));
  const rows = [];
  for (const issue of open) {
    const labels = issue.labels.map((l) => l.name);
    if (!inQueue(labels) || parkedBy(labels).length) continue;
    const events = ghRest(`issues/${issue.number}/events?per_page=100`);
    const readyTimes = events
      .filter((e) => e.event === "labeled" && e.label?.name === "ready")
      .map((e) => Date.parse(e.created_at));
    const blocks = ghRest(`issues/${issue.number}/dependencies/blocking`)
      .map((b) => b.number)
      .filter((n) => openNumbers.has(n));
    const row = rankRow(issue, {
      readyAt: labels.includes("ready") && readyTimes.length ? Math.max(...readyTimes) : null,
      blocks,
      horizon: horizons[String(issue.number)] ?? null,
      now,
    });
    if (row) rows.push(row);
  }
  return rows;
}

/** The newest committed digest's snapshot and date — the "since" every digest line reads from. */
function lastSnapshot() {
  const [latest] = digestFiles();
  if (!latest) return { prev: null, since: null };
  const text = readFileSync(join(process.cwd(), "docs", "digests", latest), "utf8");
  return { prev: parseSnapshot(text), since: latest.slice(0, 10) };
}

function main() {
  const rows = liveRows();
  if (process.argv.includes("--digest")) {
    const curr = rankOrder(rows).map((r) => r.number);
    const { prev, since } = lastSnapshot();
    console.log(digestLine(prev, curr, since));
    console.log(snapshotMarker(curr));
    return;
  }
  console.log(
    process.argv.includes("--json") ? JSON.stringify(rankOrder(rows), null, 2) : renderRank(rows),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
