#!/usr/bin/env node
// DELIVERY SCORE — did the work we marked ready come out clean? (#4056 slice 2)
//
// WHY IT EXISTS. #4056's calls are held as hypotheses with dated falsifiers: "declared ≤3 PRs
// delivers cleaner", "readiness notes predict rework", "split plans need fewer follow-up fixes".
// A falsifier nobody can re-run is decoration. This is the instrument #3955's loop rows score them
// with. It has two modes, and the first proves the second is wired right:
//
//   node scripts/delivery-score.mjs --fixture          # replay the frozen study cohort (84% vs 68%)
//   node scripts/delivery-score.mjs --since 2026-10-01 # re-score issues handed off since a date, live
//   node scripts/delivery-score.mjs --since 2026-08-15 --compare  # agreement with the frozen cohort
//
// CLEAN means closed completed with no rework signal: no reopen, no needs-info after the build,
// no first attempt closed unmerged, and no fix/revert PR citing the issue within 7 days of its first
// merge unless that PR is worded as a planned slice. It is an upper bound: the study measured the
// rework detector's precision at about 6 in 10, so compare cohorts scored by the same code, never a
// live number against a hand count.
import { readFileSync } from "node:fs";
import { declaredPrs, readinessNotes, sizeCell } from "./issue-readiness.mjs";
import { ghRest } from "./moneypenny/gh.mjs";

const H = 3600e3;
const FIXTURE = new URL("../tests/fixtures/delivery/cohort-2026-09-29.json", import.meta.url);

// ─── pure core ───────────────────────────────────────────────────────────────────────────────────

/** Clean rate for the rows a predicate selects, as { clean, n, pct }. */
export function cleanRate(rows) {
  const clean = rows.filter((r) => r.outcome === "CLEAN").length;
  return { clean, n: rows.length, pct: rows.length ? Math.round((100 * clean) / rows.length) : 0 };
}

/** The study's headline contrasts, each a with/without pair. Rows lacking the field sit out. */
export const CONTRASTS = [
  ["declared ≤3 PRs vs ≥4", (r) => r.declared_prs, (v) => v <= 3],
  [
    "body <450 words vs ≥1100",
    (r) => (r.words < 450 || r.words >= 1100 ? r.words : null),
    (v) => v < 450,
  ],
  ["readiness notes: none vs any", (r) => r.notes ?? null, (v) => v === 0],
  ["EARS criteria", (r) => r.ears, Boolean],
  ["lint-clean", (r) => r.lint_clean, Boolean],
];

export function contrastTable(rows) {
  return CONTRASTS.map(([name, pick, isWith]) => {
    const scored = rows.filter((r) => pick(r) !== null && pick(r) !== undefined);
    return {
      name,
      with: cleanRate(scored.filter((r) => isWith(pick(r)))),
      without: cleanRate(scored.filter((r) => !isWith(pick(r)))),
    };
  }).filter((c) => c.with.n + c.without.n > 0);
}

const refRe = (n) => new RegExp(`#${n}(?!\\d)`);
const stripCode = (s) => String(s ?? "").replace(/`[^`\n]*`/g, " ");

/** Does this PR build issue n (not merely mention it)? Closing keyword, a branch named for it,
 *  #n in the title, or slice/part/phase wording next to #n — the study's "build strength". */
export function buildsIssue(pr, n) {
  const body = stripCode(pr.body);
  const N = `#${n}(?!\\d)`;
  if (new RegExp(`\\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\\s+${N}`, "i").test(body)) return true;
  if (new RegExp(`(^|/|-)${n}(-|$)`).test(pr.head ?? "")) return true;
  if (refRe(n).test(pr.title ?? "")) return true;
  return new RegExp(
    `(slice|part|phase|step)[^\\n#]{0,30}${N}|${N}[^\\n]{0,12}(slice|phase)`,
    "i",
  ).test(body);
}

const convType = (title) => /^(\w+)(\(|!|:)/.exec(title ?? "")?.[1]?.toLowerCase() ?? "";

/** A later PR that repairs issue n's first delivery rather than continuing a planned slice. */
function isFollowUpFix(pr, n) {
  const text = `${pr.title}\n${stripCode(pr.body)}`;
  const N = `#${n}(?!\\d)`;
  if (
    new RegExp(`(slice|phase|step|part)[^\\n#]{0,30}${N}|${N}[^\\n]{0,12}(slice|phase)`, "i").test(
      text,
    )
  )
    return false;
  // Explicit blame wording counts on a plain mention; a bare `fix(` or a regression title only when
  // the PR builds the issue — a fix elsewhere that cites it as context is not rework of it.
  if (
    new RegExp(
      `(regression|broke|broken|introduced (in|by)|missed by|follow-up fix)[^\\n#]{0,40}${N}`,
      "i",
    ).test(text)
  )
    return true;
  if (!buildsIssue(pr, n)) return false;
  if (/\b(regression|revert|broke|broken)\b/i.test(pr.title) || convType(pr.title) === "revert")
    return true;
  return convType(pr.title) === "fix";
}

/**
 * The study's outcome classifier, ported. `issue` is a REST issue, `events` its timeline events,
 * `prs` every PR (REST pulls shape, `head` flattened to the ref name) — only the ones that build
 * or cite it matter. Returns null when nothing merged builds the issue (it is outside the cohort).
 */
export function classify({ issue, events = [], prs, now }) {
  const n = issue.number;
  const building = prs
    .filter((p) => buildsIssue(p, n))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const merged = building.filter((p) => p.merged_at);
  if (!merged.length) return null;
  const first = merged.reduce((a, b) => (a.merged_at < b.merged_at ? a : b));
  const T = (s) => Date.parse(s);
  const labeledAt = (name) =>
    events
      .filter((e) => e.event === "labeled" && e.label?.name === name)
      .map((e) => T(e.created_at));
  const handoff = Math.min(
    ...labeledAt("ready"),
    ...labeledAt("feedback"),
    T(building[0].created_at),
  );
  const reasons = [];
  if (issue.state === "closed" && issue.state_reason && issue.state_reason !== "completed") {
    return { n, outcome: "ABANDONED", reasons: [issue.state_reason], handoff };
  }
  if (events.some((e) => e.event === "reopened")) reasons.push("reopened");
  if (labeledAt("needs-info").some((t) => t > T(building[0].created_at)))
    reasons.push("needs-info after build");
  const failedFirst = building.filter(
    (p) => !p.merged_at && p.state === "closed" && p.created_at <= first.merged_at,
  );
  if (failedFirst.length) reasons.push(`first attempt closed unmerged (#${failedFirst[0].number})`);
  const fixes = prs.filter(
    (p) =>
      p.merged_at &&
      p.number !== first.number &&
      refRe(n).test(`${p.title}\n${stripCode(p.body)}`) &&
      T(p.created_at) >= T(first.merged_at) &&
      T(p.created_at) - T(first.merged_at) <= 7 * 24 * H &&
      isFollowUpFix(p, n),
  );
  if (fixes.length) reasons.push(`fix follow-up (#${fixes.map((p) => p.number).join(", #")})`);
  if (reasons.length) return { n, outcome: "REWORKED", reasons, handoff };
  if (T(building[0].created_at) - handoff > 7 * 24 * H)
    return { n, outcome: "STALLED", reasons: ["handoff→first PR >7d"], handoff };
  const lastMerge = Math.max(...merged.map((p) => T(p.merged_at)));
  if (issue.state === "open" && now - lastMerge > 7 * 24 * H)
    return { n, outcome: "STALLED", reasons: ["remainder idle >7d"], handoff };
  return { n, outcome: issue.state === "closed" ? "CLEAN" : "IN-FLIGHT", reasons: [], handoff };
}

/** Agreement between two outcome maps over the issues both scored. */
export function agreement(ours, theirs) {
  const shared = Object.keys(theirs).filter((n) => ours[n]);
  const same = shared.filter((n) => ours[n] === theirs[n]);
  return {
    shared: shared.length,
    same: same.length,
    pct: shared.length ? Math.round((100 * same.length) / shared.length) : 0,
  };
}

export function renderTable(rows, heading) {
  const fmt = (r) => (r.n ? `${r.pct}% (${r.clean}/${r.n})` : "—");
  const counts = {};
  for (const r of rows) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
  return [
    `**${heading}** · ${rows.length} issues · ${Object.entries(counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ")}`,
    "",
    "| Contrast | Clean with | Clean without |",
    "|---|---|---|",
    ...contrastTable(rows).map((c) => `| ${c.name} | ${fmt(c.with)} | ${fmt(c.without)} |`),
  ].join("\n");
}

// ─── IO (REST core bucket) ───────────────────────────────────────────────────────────────────────

/** Every PR created since `sinceMs` minus a week of slack, newest first, stopping at the edge. */
function pullsSince(sinceMs) {
  const out = [];
  for (let page = 1; page <= 60; page++) {
    const batch = ghRest(`pulls?state=all&sort=created&direction=desc&per_page=100&page=${page}`);
    for (const p of batch) out.push({ ...p, head: p.head?.ref ?? "" });
    if (batch.length < 100 || Date.parse(batch.at(-1).created_at) < sinceMs - 7 * 24 * H)
      return out;
  }
  return out;
}

function live(since) {
  const sinceMs = Date.parse(since);
  const now = Date.now();
  const prs = pullsSince(sinceMs);
  const issues = [];
  for (let page = 1; page <= 60; page++) {
    const batch = ghRest(`issues?state=all&since=${since}T00:00:00Z&per_page=100&page=${page}`);
    issues.push(
      ...batch.filter((i) => !i.pull_request && Date.parse(i.created_at) >= sinceMs - 30 * 24 * H),
    );
    if (batch.length < 100) break;
  }
  const rows = [];
  for (const issue of issues) {
    const labels = issue.labels.map((l) => l.name);
    if (labels.includes("event-research") || labels.includes("ci-failure")) continue;
    const events = ghRest(`issues/${issue.number}/events?per_page=100`);
    const scored = classify({ issue, events, prs, now });
    if (!scored || scored.handoff < sinceMs || scored.outcome === "IN-FLIGHT") continue;
    const body = issue.body ?? "";
    rows.push({
      ...scored,
      declared_prs: declaredPrs(sizeCell(body)),
      words: body.split(/\s+/).filter(Boolean).length,
      notes: readinessNotes({ title: issue.title, body, labels: [...labels, "ready"] }).length,
      ears: /\bshall\b/i.test(body),
    });
  }
  return rows;
}

function main() {
  const argv = process.argv.slice(2);
  const frozen = JSON.parse(readFileSync(FIXTURE, "utf8")).rows;
  if (argv.includes("--fixture"))
    return console.log(renderTable(frozen, "Frozen study cohort, main 25b8c6e8"));
  const at = argv.indexOf("--since");
  if (at === -1)
    throw new Error("usage: delivery-score.mjs --fixture | --since YYYY-MM-DD [--compare]");
  const rows = live(argv[at + 1]);
  console.log(renderTable(rows, `Handed off since ${argv[at + 1]}, scored live`));
  if (argv.includes("--compare")) {
    const a = agreement(
      Object.fromEntries(rows.map((r) => [r.n, r.outcome])),
      Object.fromEntries(frozen.map((r) => [r.n, r.outcome])),
    );
    console.log(
      `\nAgreement with the frozen cohort: ${a.pct}% (${a.same}/${a.shared} shared issues).`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
