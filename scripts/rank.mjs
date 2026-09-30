#!/usr/bin/env node
// RANK — which open, buildable item should be pulled next, and why (#4064 slices 1–2).
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
//   node scripts/rank.mjs          # markdown table
//   node scripts/rank.mjs --json
import { readFileSync } from "node:fs";
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

// ─── IO (REST core bucket) ───────────────────────────────────────────────────────────────────────

function main() {
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
  console.log(
    process.argv.includes("--json") ? JSON.stringify(rankOrder(rows), null, 2) : renderRank(rows),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
