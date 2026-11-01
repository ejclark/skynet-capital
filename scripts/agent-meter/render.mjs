// The meter's text form. One line per number, each saying what it leaves out (#6470).
import { formatDuration, formatStage } from "./failure-to-fix.mjs";

const k = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
const usd = (n) => `$${n.toFixed(2)}`;
const counts = (obj) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name} ×${n}`)
    .join(", ");

const REPEATED_HOUR_NOTE =
  "  note: the window crosses the repeated hour of 2026-11-01 (06:00 to 08:00Z); the API's times there read an hour late, so a figure near that edge can sit on either side";

function firstPass(fp) {
  const lines = ["", "first-pass"];
  const d = fp.defects;
  if (typeof d === "string") lines.push(`  post-merge defects: ${d}`);
  else {
    const audited = d.audited
      ? `${d.audited.prs} PRs audited in ${d.audited.audits} audit(s)`
      : "PRs audited: unknown (no audit receipt in the window)";
    const finders = Object.keys(d.byFinder).length ? ` (${counts(d.byFinder)})` : "";
    lines.push(
      `  post-merge defects: ${d.confirmed} confirmed${finders} on ${d.prsWithDefect} PR(s) · ${audited}`,
    );
  }
  const mf = fp.mainFailures;
  if (typeof mf === "string") lines.push(`  main pushes: ${mf}`);
  else
    lines.push(
      `  main pushes: ${mf.failed} of ${mf.runs} failed${mf.failed ? ` — ${counts(mf.byJob)}` : ""}`,
    );
  if (typeof fp.ci === "string") lines.push(`  ci: ${fp.ci}`);
  else
    for (const [event, row] of Object.entries(fp.ci))
      if (event !== "push") lines.push(`  ci ${event}: ${row.failed} of ${row.runs} failed`);
  const lv = fp.localVerify;
  lines.push(
    `  local verify: ${lv.failed} of ${lv.runs} failed${lv.failed ? ` — ${counts(lv.bySteps)}` : ""}`,
  );
  lines.push(`  ${fp.note}`);
  return lines;
}

function lanes(l) {
  const lines = ["", "lanes (imputed USD from each job's rendered log; not a charge)"];
  if (typeof l === "string") return [...lines, `  ${l}`];
  for (const [lane, row] of Object.entries(l.rows).sort((a, b) => b[1].usd - a[1].usd))
    lines.push(
      `  ${lane}: ${usd(row.usd)} (${row.jobs} jobs${row.unpriced ? `, ${row.unpriced} unpriced` : ""})`,
    );
  const c = l.counts;
  if (c.unreadRuns || c.unlisted.length)
    lines.push(
      `  no totals: ${c.unreadRuns} run(s) left unread at the REST cap${c.unlisted.length ? ` and ${c.unlisted.join(", ")} not listed` : ""} — run again to continue from the cache`,
    );
  if (c.unreadableRuns)
    lines.push(
      `  floor, not the week: ${c.unreadableRuns} run(s) had no readable log today and are retried next run`,
    );
  lines.push(
    `  runs: ${c.newRuns} read now, ${c.cachedRuns} from cache, ${c.inProgress} in flight; skipped ${c.skippedEvent} on route-only events, ${c.skippedCancelled} cancelled, ${c.skippedShort} under ${l.floorSec}s`,
  );
  return lines;
}

function speed(s) {
  const merge = s.openToMergeMinutes;
  const lines = [
    "",
    "speed",
    typeof merge === "string"
      ? `  ${merge}`
      : `  open to merge: p50 ${merge.p50?.toFixed(1)} min, p90 ${merge.p90?.toFixed(1)} min (n=${merge.n})`,
  ];
  for (const run of s.runs)
    lines.push(
      `  run ${run.run}: ${run.attempts} attempts, ${run.verified ? `verified in ${run.minutesToVerified.toFixed(0)} min` : "not verified"}`,
    );
  return lines;
}

/** One agent type: what it starts at, and how many stages a missing tool cost. */
function stageRow(row) {
  const lines = [
    `  ${row.type}: ${row.n} stage${row.n === 1 ? "" : "s"}, median first call ${k(row.median)} (${k(row.min)} to ${k(row.max)}), ${row.stopped} stopped for a missing tool, ${row.triedMissing} tried one`,
  ];
  for (const stage of row.stoppedStages) lines.push(`    stopped: ${stage}`);
  return lines;
}

/** `--worker-stages` alone: first calls by agent type and the worker's oracle, with no REST read. */
export function renderWorkerStages({ window: w, stages, oracle }) {
  return [
    `workflow stages, ${w.hours} hours: ${w.since} to ${w.until}`,
    ...stages.flatMap(stageRow),
    "",
    oracle.line,
  ].join("\n");
}

const SOURCES = [
  [
    "mainCi",
    "main CI, pipeline.yml",
    (s) => {
      const count = (test) => s.episodes.filter(test).length;
      const notes = [
        [count((e) => e.stillRed), "still red"],
        [count((e) => e.startedBeforeWindow), "began before the window"],
        [count((e) => e.recurrence), "recurred under an open capsule"],
        [count((e) => e.greenBeforeFix), "went green before any linked fix merged"],
      ].flatMap(([n, what]) => (n ? [`${n} ${what}`] : []));
      const others = s.otherWorkflowCapsules
        ? `; ${s.otherWorkflowCapsules} capsule(s) on lane workflows not read here`
        : "";
      return `${s.episodes.length} red streak(s)${notes.length ? `, ${notes.join(", ")}` : ""}${others}; verified is the next green run, a floor, since a push with nothing to deploy also reads green`;
    },
  ],
  [
    "contracts",
    "[fitness] contracts",
    (s) =>
      `${s.episodes.length} failed${s.blind ? `, ${s.blind} could not read their source` : ""}; the failing read files the issue and when the failure began is stored nowhere, so lag is unknown`,
  ],
  [
    "audit",
    "post-merge audit, time the defect sat on main",
    (s) => {
      const floors = s.episodes.filter((e) => e.floor).length;
      return `${s.episodes.length} finding(s)${floors ? `, ${floors} a floor ("before #N")` : ""}`;
    },
  ],
];

const when = (ms) => (ms === null ? "unknown" : formatDuration(ms / 60000));

function failureRow(e) {
  const parts = [
    e.id,
    e.name,
    e.failedAt ? `failed ${e.failedAt.slice(0, 16)}Z` : null,
    "capsule" in e ? (e.capsule ? `capsule #${e.capsule}` : "no capsule") : null,
    `lag ${when(e.lagMs)}`,
    e.fix ? `fix #${e.fix}` : e.fixedAt ? "fix merged, no PR number" : "fix unknown",
    `filed to fix ${when(e.filedToFixMs)}`,
    `to verified ${e.floor ? "at least " : ""}${when(e.toVerifiedMs)}`,
  ];
  return `    ${parts.filter(Boolean).join(" · ")}`;
}

/** Each source's three stages; `perFailure` adds a row per failure, so a number can be checked. */
export function failureToFix(f, { perFailure = false } = {}) {
  const lines = ["", "failure to fix (failed → filed → fix merged → verified)"];
  if (typeof f === "string") return [...lines, `  ${f}`];
  if (f.commits !== "origin/main")
    lines.push(`  ${f.commits}: fix and Introduced in links read unknown`);
  for (const [key, label, summary] of SOURCES) {
    const source = f.sources[key];
    lines.push(`  ${label}: ${summary(source)}`);
    lines.push(`    ${formatStage("detection lag", source.stages.detectionLag)}`);
    lines.push(`    ${formatStage("filed to fix merged", source.stages.filedToFix)}`);
    lines.push(`    ${formatStage("failure to verified", source.stages.toVerified)}`);
    if (perFailure) lines.push(...source.episodes.map(failureRow));
  }
  return lines;
}

/** `--failure-to-fix` alone: this section, per failure, with no lane log read. */
export function renderFailureToFix(f) {
  const w = f.window;
  return [
    `failure to fix, ${w.hours} hours: ${w.since} to ${w.until}`,
    ...(w.crossesRepeatedHour ? [REPEATED_HOUR_NOTE] : []),
    ...failureToFix(f, { perFailure: true }),
    "",
    `rest calls this run: ${f.rest.calls} (cap ${f.rest.cap})`,
  ].join("\n");
}

function agents(a) {
  const lines = ["", "workflow agents (local transcripts, deduped by message id)"];
  if (!a.agents) return [...lines, "  none in the window"];
  lines.push(
    `  first call p50 by type: ${Object.entries(a.firstCallP50ByType)
      .map(([type, row]) => `${type} ${k(row.p50)} (n=${row.n})`)
      .join(" · ")}`,
    `  ${a.workerOracle.line}`,
  );
  for (const [wf, row] of Object.entries(a.tokensByWorkflow).sort(
    (x, y) => y[1].total - x[1].total,
  ))
    lines.push(
      `  ${wf}: ${k(row.total)} tokens over ${row.agents} agents (in ${k(row.input)} · cache write ${k(row.cacheWrite)} · cache read ${k(row.cacheRead)} · out ${k(row.output)})`,
    );
  return lines;
}

function startup(s) {
  const lines = [
    "",
    "startup (sessions)",
    `  recent first calls: ${s.recentFirstCalls.join(", ") || "none"} tokens`,
  ];
  if (s.newest) {
    const entries = Object.entries(s.newest.sources).sort((x, y) => y[1] - x[1]);
    for (const [source, tokens] of entries) lines.push(`  ${source}: ${tokens}`);
    lines.push(`  system prompt and tool schemas (unitemized): ${s.newest.unitemized}`);
  }
  lines.push(`  ${s.note}`);
  return lines;
}

export function render(m) {
  const w = m.window;
  const lines = [`agent meter, ${w.hours} hours: ${w.since} to ${w.until}`];
  if (w.crossesRepeatedHour) lines.push(REPEATED_HOUR_NOTE);
  lines.push(...firstPass(m.firstPass), ...lanes(m.lanes), ...speed(m.speed));
  lines.push(...failureToFix(m.failureToFix), ...agents(m.agents));
  lines.push(...startup(m.startup));
  lines.push("", "limits");
  lines.push(`  CLAUDE.md: ${m.limits.claudeMdBytes} bytes; orient: ${m.limits.orientBytes} bytes`);
  lines.push(
    `  memory index: ${m.limits.memoryIndexLines} of ${m.limits.memoryIndexLimit} lines, ${m.limits.memoryFiles} files`,
  );
  lines.push("", `rest calls this run: ${m.rest.calls} (cap ${m.rest.cap})`);
  return lines.join("\n");
}
