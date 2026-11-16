// Scoring one lens's replay: what counts as a hit, what counts against a clean control, and what
// is unknown. Kept apart from the runner (scripts/review-replay.mjs) so the rules a score rests on sit
// in one place, pinned by tests/scripts/review-replay.spec.ts and review-replay-pre-merge.spec.ts.
// A reviewer that never returned, or a finding no refuter judged, is unknown: never a miss, never clean.

const SERIOUS = (finding) => ["high", "medium", "important"].includes(finding.severity);
// A finding its refuter knocked down never reaches an author, so it counts for nothing either way.
const STANDS = (finding) => finding.refuted !== true;

// The set's defect files are repo-relative, but a reviewer runs in its own worktree and often cites
// `file:line`, so an exact string match read correct catches as misses (#6719). Drop any `:line[:col]`
// and a leading `./`, then accept the path itself or any absolute path ending in `/<defect file>` at a
// folder boundary: the reviewer's root is never known here, and `xsrc/a.ts` must not pass for `src/a.ts`.
export const FILE_FORM =
  "Give each finding's file as a repo-relative path such as src/server/app.ts: never absolute, never with :line (the line has its own field).";

function sameFile(cited, defectFile) {
  if (typeof cited !== "string") return false;
  const path = cited
    .trim()
    .replace(/(:\d+)+$/, "")
    .replace(/^\.\//, "");
  return path === defectFile || (path.startsWith("/") && path.endsWith(`/${defectFile}`));
}

// `changed` (PR → the paths it changed) splits hits the shipped job could post from file matches on
// a file the PR never touched; without it, hitsInDiff is null and nothing claims to know.
function scoreDefects(rows, seen, changed) {
  const prs = [...new Set(rows.map((row) => row.pr))];
  const recall = {
    prs: prs.length,
    reviewed: 0,
    hit: 0,
    hitsInDiff: changed ? 0 : null,
    withFindings: 0, // PRs with any standing serious finding: the most a reading could count

    hits: [],
    lowOnly: [],
    refutedOnly: [],
    missed: [],
    unknown: [],
  };
  for (const pr of prs) {
    const result = seen.get(pr);
    if (!result) {
      recall.unknown.push(pr);
      continue;
    }
    recall.reviewed += 1;
    if (result.findings.some((f) => SERIOUS(f) && STANDS(f))) recall.withFindings += 1;
    const onDefect = (row) => (finding) => sameFile(finding.file, row.defect.file);
    const counted = (finding) => SERIOUS(finding) && finding.mechanism !== false && STANDS(finding);
    const cases = rows.filter((row) => row.pr === pr);
    const matched = cases.filter((row) =>
      result.findings.some((f) => onDefect(row)(f) && counted(f)),
    );
    if (matched.length) {
      recall.hit += 1;
      if (changed && matched.some((row) => changed.get(pr)?.has(row.defect.file))) {
        recall.hitsInDiff += 1;
      }
      // Both sentences, because a file match is only an upper bound until someone reads them.
      recall.hits.push({
        pr,
        caseIds: matched.map((row) => row.id),
        defect: matched[0].defect.summary,
        found: result.findings.find((f) => onDefect(matched[0])(f) && counted(f)).summary,
      });
    } else if (
      cases.some((row) =>
        result.findings.some((f) => onDefect(row)(f) && SERIOUS(f) && f.mechanism !== false),
      )
    ) {
      recall.refutedOnly.push(pr); // found, then refuted: read these, the refuter may be wrong
    } else if (
      cases.some((row) =>
        result.findings.some((f) => onDefect(row)(f) && ["low", "nit"].includes(f.severity)),
      )
    ) {
      recall.lowOnly.push(pr);
    } else {
      recall.missed.push(pr);
    }
  }
  return recall;
}

function scoreControls(rows, facet, seen) {
  const controls = { reviewed: 0, clean: 0, flagged: [], traps: [], unknown: [] };
  for (const row of rows) {
    const result = seen.get(row.pr);
    if (!result) {
      controls.unknown.push(row.pr);
      continue;
    }
    controls.reviewed += 1;
    const serious = result.findings
      .filter((f) => SERIOUS(f) && STANDS(f))
      .map((f) => ({ id: row.id, pr: row.pr, ...f }));
    if (!serious.length) controls.clean += 1;
    else if (row.trapFor === facet) controls.traps.push(...serious);
    else controls.flagged.push(...serious);
  }
  return controls;
}

/** The rows one lens runs on, scored. A reviewer that never returned is unknown, never clean. */
export function scoreRows(rows, { lens, facet, results, changed }) {
  const seen = new Map(results.filter((row) => row.returned !== false).map((row) => [row.pr, row]));
  const report = {
    lens,
    facet,
    recall: scoreDefects(
      rows.filter((row) => !row.isControl),
      seen,
      changed,
    ),
    controls: scoreControls(
      rows.filter((row) => row.isControl),
      facet,
      seen,
    ),
  };
  // A dead refuter marks its findings refuted, which reads a flagged control as clean: name those PRs.
  report.unjudged = results
    .filter(
      (row) =>
        row.returned !== false &&
        row.findings?.some((f) => SERIOUS(f) && (f.judged === false || row.refuterDied)),
    )
    .map((row) => row.pr);
  const refuterRan = results.some((row) => row.findings?.some((f) => "refuted" in f));
  if (refuterRan) {
    // What the reviewer alone said, so the refuter's share of the score can be read off.
    const unrefuted = results.map((row) => ({
      ...row,
      findings: (row.findings ?? []).map(({ refuted: _r, ...f }) => f),
    }));
    const raw = scoreRows(rows, { lens, facet, results: unrefuted, changed });
    report.beforeRefuters = { hit: raw.recall.hit, controlFlags: raw.controls.flagged.length };
  }
  return report;
}

export const summary = ({ lens, recall, controls, beforeRefuters, bar, unjudged }) =>
  [
    `${lens}: recall ${recall.hit} of ${recall.reviewed} PRs reviewed (${recall.prs} labelled), by file match; read each hit`,
    `  low only: ${recall.lowOnly.join(", ") || "none"} · refuted: ${recall.refutedOnly.join(", ") || "none"} · missed: ${recall.missed.join(", ") || "none"} · not reviewed: ${recall.unknown.join(", ") || "none"}`,
    `  controls: ${controls.clean} clean of ${controls.reviewed} reviewed; ${controls.flagged.length} serious counted against the lens, ${beforeRefuters ? "after its refuter" : "before any refuter"}; ${controls.traps.length} on a trap, to read; not reviewed: ${controls.unknown.join(", ") || "none"}`,
    ...(recall.hitsInDiff === null
      ? []
      : [
          `  hits on a file in the diff: ${recall.hitsInDiff} · PRs with a standing serious finding: ${recall.withFindings}`,
        ]),
    ...(unjudged.length ? [`  unjudged by a refuter, re-run: ${unjudged.join(", ")}`] : []),
    ...(beforeRefuters
      ? [
          `  before the refuter: ${beforeRefuters.hit} hits, ${beforeRefuters.controlFlags} serious on controls`,
        ]
      : []),
    ...(bar
      ? [
          `  bar: at least ${bar.hits} hits and at most ${bar.controlImportant} Important on controls — ${bar.verdict}`,
        ]
      : []),
  ].join("\n");
