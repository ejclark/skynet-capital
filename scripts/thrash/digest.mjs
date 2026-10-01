// THRASH → DIGEST + AUTO-FILE — the pure half of `thrash-scan.mjs --digest` (#3939 slice 2).
//
// Criteria 3–4: when a digest is due, /secretary puts the scan's hits in it as lines; a T1–T5 hit
// seen on TWO CONSECUTIVE scans, with no `bottleneck` issue already carrying its key, files exactly
// one `bottleneck` issue. T6 never files (AUTO_FILE_SIGNALS, signals.mjs).
//
// WHERE "THE PREVIOUS SCAN" LIVES: in the previous digest, as `<!-- thrash-snapshot: … -->` — the
// same move rank.mjs makes with `<!-- rank-snapshot: … -->`. A scan only counts as a scan when it
// reached a digest, so "two consecutive scans" means "two consecutive digests", with no state file
// and no schedule of its own. The marker holds short hashes, not keys: a T2 key is a whole issue
// title, and 164 of them verbatim would be kilobytes of comment in every digest.
//
// TWO REFINEMENTS OVER THE LETTER OF CRITERION 4, both so the auto-filer cannot thrash itself:
//   1. T2 files PER LANE, not per title. The 09-09 storm put 164 titles on one lane; one issue per
//      title would be 164 bottleneck issues for one fact (the report already folds T2 per lane).
//   2. A CLOSED bottleneck carrying the key still counts as filed when it closed on/after the hit's
//      last occurrence. The scan window is 30 days, so a hit outlives a quick fix; re-filing it the
//      day the fix closes would be repetition with no state change — the thing this detects.
// And MAX_FILES_PER_RUN caps a run; the overflow is a digest line, filed on the next digest.
import { createHash } from "node:crypto";

export const MAX_FILES_PER_RUN = 3;
/** Digest lines per run before the rest fold into a "+N more" line — the Noise tier is counts. */
export const MAX_DIGEST_LINES = 8;

const SNAPSHOT_RE = /<!-- thrash-snapshot: ([0-9a-f,]*) -->/;
const KEY_MARKER = (id) => `<!-- thrash-key: ${id} -->`;

const SIGNAL_NAMES = {
  T1: ["same author, near-identical comments", "near-identical comments"],
  T2: ["an issue re-filed under a title filed ≤14 days earlier", "extra filings"],
  T3: ["one lane's filings in a day > 5× its trailing 7-day median", "filings in one day"],
  T4: ["one status label added/removed ≥3× on one issue", "label toggles"],
  T5: ["a revert of a PR merged < 7 days earlier", "revert"],
};

export const unitId = ({ signal, key }) =>
  createHash("sha1").update(`${signal}\u0000${key}`).digest("hex").slice(0, 10);

/** What files: one unit per auto-file hit, except T2, which folds per lane (refinement 1). */
export function filingUnits(hits) {
  const units = [];
  const t2 = new Map();
  for (const h of hits.filter((x) => x.autoFile)) {
    if (h.signal !== "T2") {
      units.push({ ...h });
      continue;
    }
    const key = `lane:${h.lane}`;
    const u = t2.get(key) ?? { signal: "T2", key, lane: h.lane, count: 0, date: h.date, keys: 0 };
    u.count += h.count;
    u.keys += 1;
    if (h.date > u.date) u.date = h.date;
    u.detail = `${u.keys} title(s) re-filed in lane \`${h.lane}\`, ${u.count} extra issue(s)`;
    t2.set(key, u);
  }
  return [...units, ...t2.values()].map((u) => ({ ...u, id: unitId(u) }));
}

export const snapshotMarker = (units) =>
  `<!-- thrash-snapshot: ${[...new Set(units.map((u) => u.id))].sort().join(",")} -->`;

/** The unit ids a digest embedded, or null when it carries none (baseline — never "zero repeats"). */
export function parseSnapshot(text) {
  const m = SNAPSHOT_RE.exec(text ?? "");
  return m ? new Set(m[1].split(",").filter(Boolean)) : null;
}

/** Units on this scan AND the previous one — the two-scan rule. */
export const repeatUnits = (units, prev) => (prev ? units.filter((u) => prev.has(u.id)) : []);

/** The bottleneck issue already carrying this unit's key, if any (refinement 2 for closed ones).
 *  `issues` are GitHub REST rows (`state`, `closed_at`, `body`). */
export function alreadyFiled(unit, issues) {
  return issues.find(
    (i) =>
      String(i.body ?? "").includes(KEY_MARKER(unit.id)) &&
      (i.state !== "closed" || String(i.closed_at ?? "").slice(0, 10) >= unit.date),
  );
}

/** Title + body for one unit, in the /issue capsule shape; `**Before:**` carries the hit's count,
 *  which issue-lint requires of every `bottleneck` body since #4184. */
export function bottleneckIssue(unit, { since, today }) {
  const [name, unitWord] = SIGNAL_NAMES[unit.signal];
  const measure = unit.signal === "T5" ? "1 revert" : `${unit.count} ${unitWord}`;
  const title = `[thrash] ${unit.signal} ${unit.key}: ${measure}`.slice(0, 80);
  const body = [
    `**Thrash, seen on two digests in a row: ${unit.signal} on \`${unit.key}\` — ${measure}, no state change.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Signal** | ${unit.signal} — ${name} |`,
    `| **Key** | \`${unit.key}\` |`,
    `| **Last hit** | ${unit.date} |`,
    "",
    `- **Before:** ${measure} — ${today}, \`npm run thrash:scan\` over ${since} → ${today}`,
    `- ${unit.detail}`.slice(0, 120),
    "- Filed by the thrash scan's two-scan rule (#3939); the bottleneck research grind pursues it.",
    "",
    "<details><summary><strong>How this was found</strong> — reproduce, dedup</summary>",
    "",
    `Reproduce: \`npm run thrash:scan -- --since=${since} --today=${today}\`. The hit was in the`,
    "previous digest's `thrash-snapshot` marker and in this one, so it is not a one-scan blip.",
    "",
    "The scan will not file this key again while this issue is open, or after it closes unless the",
    "thrash recurs later than the close date. Close it with an `**After:**` line counted the same way.",
    "",
    "</details>",
    "",
    KEY_MARKER(unit.id),
  ].join("\n");
  return { title, body, labels: ["bottleneck"] };
}

const fmt = (h) => `${h.signal} ${h.date} ${h.key} — ${h.detail}`;

/** The digest's lines. Only hits dated on/after the last digest get their own line — the window is
 *  30 days, so the rest were in an earlier digest already and are only counted. T3 (a burst) goes
 *  to Needs you, per #3939's response table; everything else is Noise absorbed. */
export function digestLines(hits, units, { since, today, lastDigest, filed = [], skipped = [] }) {
  const fresh = hits.filter((h) => !lastDigest || h.date >= lastDigest);
  const needsYou = fresh
    .filter((h) => h.signal === "T3")
    .map(
      (h) =>
        `Look at the ${h.lane} burst on ${h.date} — ${h.detail}; a bottleneck issue files if it persists.`,
    );
  const rest = fresh.filter((h) => h.signal !== "T3" && h.signal !== "T2");
  const t2 = units.filter((u) => u.signal === "T2" && (!lastDigest || u.date >= lastDigest));
  const lines = [...t2.map((u) => `T2 ${u.date} ${u.key} — ${u.detail}`), ...rest.map(fmt)];
  const shown = lines.slice(0, MAX_DIGEST_LINES);
  if (lines.length > shown.length) {
    shown.push(`+${lines.length - shown.length} more — \`npm run thrash:scan\``);
  }
  const noise = [
    `Thrash scan ${since} → ${today}: ${hits.length} hit(s), ${fresh.length} new since ${lastDigest ?? "the start"}.`,
    ...shown.map((l) => `  - ${l}`),
  ];
  if (filed.length) {
    noise.push(
      `Thrash auto-filed: ${filed.map((f) => `#${f.number} (${f.signal} ${f.key})`).join(", ")}.`,
    );
  }
  if (skipped.length) noise.push(`Thrash auto-file deferred: ${skipped.join("; ")}.`);
  return { needsYou, noise };
}
