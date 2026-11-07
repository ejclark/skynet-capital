// The reads behind "Decisions reaching Eric" (#6953 slice 4): every GitHub call the measures in
// decisions.mjs need, kept apart so that file stays pure. Each read is attempted on its own by
// gather.mjs, so one that fails costs its own measures, never the newsletter.
//
// WHAT EACH COSTS (2026-11-07): the snapshot is the assignment lane's own gather (`plan()` is the
// selector for "open asks that need him", never a second one here) plus the unseen scan, about 20
// calls. The label history is the repo's issue-event stream, about 40 pages for a week (3,500+
// events: lanes label a lot), then two reads per issue whose `needs-eric` came off. The capsules
// are one listing. The series is one read.

import { REPO } from "../agent-meter/lanes.mjs";
import { ASSIGN_MARKER, parseAsk } from "../moneypenny/ask-card.mjs";
import { gather as gatherAsks, plan } from "../moneypenny/assignments.mjs";
import { ERIC, NEEDS_ERIC } from "../moneypenny/decision-callout.mjs";
import { gatherUnseen } from "../moneypenny/unseen-asks.mjs";
import { SERIES_BRANCH, SERIES_PATH } from "./series.mjs";

/** The event stream runs ~40 pages a week; past this it says so rather than return part of it. */
const EVENT_PAGE_CAP = 80;
const LANE_FOOTER = /Generated (?:by|with) \[Claude Code\]/;
const DAY = 864e5;

/** A REST listing over the meter's counted layer, paged until `done(page)` or the cap. */
export function lister(rest, cap = 20) {
  return (path, done = () => false) => {
    const out = [];
    const full = path.startsWith("repos/") ? path : `repos/${REPO}/${path}`;
    for (let page = 1; page <= cap; page += 1) {
      const items = rest.api(`${full}${full.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
      if (!Array.isArray(items)) throw new Error(`${full.split("?")[0]} did not return a list`);
      out.push(...items);
      if (items.length < 100 || done(items)) return out;
    }
    throw new Error(`${full.split("?")[0]} ran past ${cap} pages`);
  };
}

/** The asks as the lane sees them now: plan().needsYou, its artifact gaps, predictions, the unseen. */
export function decisionsSnapshot(rest, nowMs) {
  const list = lister(rest);
  const read = (url) => rest.api(url.replace(/^https:\/\/api\.github\.com\//, ""));
  const deps = gatherAsks({ rest: (p) => list(p), now: nowMs });
  const planned = plan(deps);
  const labelled = new Set(deps.sessionIssues.map((i) => i.number));
  const bodies = new Map(deps.issues.map((i) => [i.number, i.body ?? ""]));
  const asks = planned.needsYou.filter((n) => n.criterion === 1).map((n) => n.number);
  const predicted = asks.filter((n) => {
    const items = parseAsk(bodies.get(n) ?? "");
    return items.length > 0 && items.every((it) => it.forecast);
  });
  const unseen = gatherUnseen({ rest: (p) => list(p), read, issues: deps.issues, prs: deps.prs });
  return {
    needsYou: planned.needsYou.map((n) => ({ number: n.number, criterion: n.criterion })),
    // A session-labelled issue is waiting on a session by choice; the gaps are the asks that were
    // aimed at him with nothing his answer could act on.
    artifactGaps: planned.needsSession
      .filter((s) => !labelled.has(s.number))
      .map((s) => ({ number: s.number, why: s.why })),
    asks,
    predicted,
    unseen: unseen.map((u) => ({ case: u.case, ref: u.number ?? u.branch, why: u.why })),
  };
}

/**
 * Every `needs-eric` label that came off inside the window, as an episode: when it went on, when
 * it came off, his first reply in between (a comment as `ejclark` without the lane footer —
 * sessions post under his login too, and plan-claim.mjs relies on the same rule), and the lane's
 * assignment card in between, if one went out.
 */
export function labelHistory(rest, w) {
  const events = lister(rest, EVENT_PAGE_CAP)(
    "issues/events",
    (items) => Date.parse(items.at(-1).created_at) < w.sinceMs,
  );
  const offs = events.filter(
    (e) =>
      e.event === "unlabeled" &&
      e.label?.name === NEEDS_ERIC &&
      Date.parse(e.created_at) >= w.sinceMs &&
      Date.parse(e.created_at) < w.untilMs,
  );
  const list = lister(rest);
  const episodes = [];
  const byIssue = new Map();
  for (const e of offs) byIssue.set(e.issue.number, [...(byIssue.get(e.issue.number) ?? []), e]);
  for (const [number, removals] of byIssue) {
    const ons = list(`issues/${number}/events`)
      .filter((e) => e.event === "labeled" && e.label?.name === NEEDS_ERIC)
      .map((e) => e.created_at);
    const comments = list(`issues/${number}/comments`);
    for (const off of removals) {
      const labeledAt = ons.filter((t) => t <= off.created_at).at(-1) ?? null;
      const inside = (c) =>
        (!labeledAt || c.created_at >= labeledAt) && c.created_at <= off.created_at;
      const answer = comments.find(
        (c) =>
          inside(c) &&
          String(c.user?.login ?? "").toLowerCase() === ERIC &&
          !LANE_FOOTER.test(c.body ?? ""),
      );
      const card = comments.find((c) => inside(c) && (c.body ?? "").includes(ASSIGN_MARKER));
      episodes.push({
        number,
        labeledAt,
        unlabeledAt: off.created_at,
        answeredAt: answer?.created_at ?? null,
        assignedAt: card?.created_at ?? null,
      });
    }
  }
  return episodes.sort((a, b) => a.unlabeledAt.localeCompare(b.unlabeledAt));
}

/** CI capsules created from 14 days before the window to its end: repair.mjs's signatures. */
export function ciCapsules(rest, w) {
  const since = new Date(w.sinceMs - 14 * DAY).toISOString();
  return lister(rest)(`issues?state=all&labels=ci-failure&since=${since}`)
    .filter((i) => !i.pull_request && Date.parse(i.created_at) < w.untilMs)
    .map((i) => ({ number: i.number, title: i.title, createdAt: i.created_at }));
}

/** The stored series, or `[]` when the data branch has none yet (that is "no reading", not a fault). */
export function seriesRead(rest) {
  try {
    const file = rest.api(
      `repos/${REPO}/contents/${SERIES_PATH}?ref=${encodeURIComponent(SERIES_BRANCH)}`,
    );
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  } catch (err) {
    if (/Not Found|404/.test(String(err.message))) return [];
    throw err;
  }
}
