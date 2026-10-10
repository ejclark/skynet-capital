// STEER REEL + STRIP — what shipped since the last page, and the last 14 days (#5056).
//
// ONE MERGE READER. Both read the rows `scripts/comms-scan.mjs --json` prints (one per squash-merged
// PR); nothing here walks git itself. The reel opens the page: up to five headlines, then counts.
// Research PRs collapse to one count — 225 of the 400 merges on Oct 3–9 were research call sheets,
// which are publish/subscribe and never routed to Eric. The strip is the "progress beyond
// increments" Eric asked for: plan and feedback builds per day, split by the page's own two blocks
// (08–16 Central is the day, 16–08 the night), plus how steering itself is going.
//
// A BUILD here is a PR the GitHub App authored that is not a research call sheet — the definition
// the plan's baseline used (276 App PRs, 225 research, so ~50 builds a week). A live session's PRs
// land under Eric's token and are not counted: the strip measures what runs without him.
//
// Pure: rows, records and `now` in; plain objects out.
import { activeMinutes, isAnswered, roundRecords } from "./model.mjs";
import { addDays, blockOf, central } from "./time.mjs";

export const HEADLINES = 5;
export const STRIP_DAYS = 14;

export const isResearch = (row) => /^docs\(research\)/.test(row.subject ?? "");
export const isAppBuild = (row) =>
  /\[bot\]$/i.test(row.author ?? "") && !/dependabot/i.test(row.author ?? "") && !isResearch(row);
/** The Conventional-Commit type a subject leads with (`feat`, `fix`, `docs` …). */
export const kindOf = (subject = "") => /^([a-z]+)/.exec(subject)?.[1] ?? "other";
/** Issue numbers a squash subject names, e.g. "fix(x): … (#5046)" → [5046]. */
export const issueRefs = (subject = "") =>
  [...subject.matchAll(/\(#(\d+)\)/g)].map((m) => Number(m[1]));

const KIND_RANK = { feat: 0, fix: 1, perf: 2, refactor: 3, docs: 4, test: 5, ci: 6, chore: 7 };

/**
 * The reel. `because` maps an issue number to the note of the decision that filed it (the
 * read-back marks the issues it files), so a merge Eric caused says so. `shots` maps a PR number to
 * its committed screenshots. Headlines go to what he caused first, then what has pictures, then
 * features before fixes, then newest.
 */
export function reelFrom(rows, { since, because = {}, shots = {}, max = HEADLINES } = {}) {
  const from = Date.parse(since);
  const inWindow = rows.filter((r) => Date.parse(r.mergedAt) >= from);
  const research = inWindow.filter(isResearch);
  const rest = inWindow
    .filter((r) => !isResearch(r))
    .map((r) => {
      const cause = issueRefs(r.subject)
        .map((n) => because[n])
        .find(Boolean);
      return {
        number: r.number,
        subject: r.subject,
        kind: kindOf(r.subject),
        mergedAt: r.mergedAt,
        sha: r.sha,
        app: isAppBuild(r),
        shots: shots[r.number] ?? [],
        because: cause ?? null,
      };
    });
  const order = [...rest].sort(
    (a, b) =>
      Number(Boolean(b.because)) - Number(Boolean(a.because)) ||
      Number(b.shots.length > 0) - Number(a.shots.length > 0) ||
      (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) ||
      Date.parse(b.mergedAt) - Date.parse(a.mergedAt),
  );
  const headlines = order.slice(0, max);
  const byKind = {};
  for (const r of order.slice(max)) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
  return {
    since,
    merged: inWindow.length,
    research: research.length,
    builds: inWindow.filter(isAppBuild).length,
    headlines,
    more: { total: Math.max(0, order.length - max), byKind },
  };
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * What earlier pages left: each round's open/Done times and active minutes, the latest Done (the
 * next reel's start), and how long answered decisions waited from the first page that showed them.
 * `records` maps a store path to its document, as the skill saves them with ArtifactData.
 */
export function historyFrom(records = {}) {
  const ids = Object.keys(records)
    .map((p) => /^tp\/([^/]+)$/.exec(p)?.[1])
    .filter(Boolean)
    .sort();
  const rounds = ids.map((id) => ({ id, ...roundRecords(records, id) }));
  const firstSeen = new Map();
  for (const r of rounds) {
    const opened = Date.parse(r.meta?.openedAt ?? "");
    if (Number.isNaN(opened)) continue;
    for (const key of r.meta?.shown ?? []) if (!firstSeen.has(key)) firstSeen.set(key, opened);
  }
  const waits = [];
  for (const r of rounds) {
    for (const [key, rec] of Object.entries(r.decisions)) {
      const answered = Date.parse(rec?.at ?? "");
      if (!isAnswered(rec) || Number.isNaN(answered) || !firstSeen.has(key)) continue;
      waits.push(Math.max(0, (answered - firstSeen.get(key)) / 864e5));
    }
  }
  const metas = rounds.map((r) => ({
    id: r.id,
    openedAt: r.meta?.openedAt ?? null,
    doneAt: r.meta?.doneAt ?? null,
    minutes: activeMinutes(r.meta?.taps ?? []),
  }));
  const lastDoneAt =
    metas
      .map((m) => m.doneAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  return { metas, waits, lastDoneAt };
}

/** The 14-day strip: builds per day split day/night (and the 23–08 part the loop's aim tracks). */
export function stripFrom(
  rows,
  { now, needsYou = 0, unstated = 0, history = { metas: [], waits: [] } },
) {
  const today = central(now).date;
  const dates = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i - STRIP_DAYS + 1));
  const days = new Map(dates.map((date) => [date, { date, day: 0, night: 0, late: 0 }]));
  for (const r of rows.filter(isAppBuild)) {
    const b = blockOf(r.mergedAt);
    const cell = days.get(b.date);
    if (!cell) continue;
    cell[b.block] += 1;
    if (b.late) cell.late += 1;
  }
  const list = [...days.values()];
  const total = list.reduce((s, d) => s + d.day + d.night, 0);
  const nights = list.reduce((s, d) => s + d.night, 0);
  const round1 = (x) => Math.round(x * 10) / 10;
  return {
    days: list,
    perDay: round1(total / STRIP_DAYS),
    perNight: round1(nights / STRIP_DAYS),
    needsYou,
    unstated,
    medianWaitDays: history.waits.length ? round1(median(history.waits)) : null,
    pages: history.metas.slice(-10),
  };
}
