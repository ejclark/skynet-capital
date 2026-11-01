// The meter's text form. One line per number, each saying what it leaves out (#6470).

const k = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n);
const usd = (n) => `$${n.toFixed(2)}`;
const counts = (obj) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name} ×${n}`)
    .join(", ");

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
  if (c.unreadRuns)
    lines.push(
      `  no totals: ${c.unreadRuns} run(s) left unread at the REST cap — run again to continue from the cache`,
    );
  if (c.unreadableRuns)
    lines.push(
      `  floor, not the week: ${c.unreadableRuns} run(s) had no readable log today and are retried next run`,
    );
  lines.push(
    `  runs: ${c.newRuns} read now, ${c.cachedRuns} from cache, ${c.inProgress} in flight, ${c.skippedShort} under ${l.floorSec}s (no session sets up that fast)`,
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

function agents(a) {
  const lines = ["", "workflow agents (local transcripts, deduped by message id)"];
  if (!a.agents) return [...lines, "  none in the window"];
  lines.push(
    `  first call p50 by type: ${Object.entries(a.firstCallP50ByType)
      .map(([type, row]) => `${type} ${k(row.p50)} (n=${row.n})`)
      .join(" · ")}`,
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
  if (w.crossesRepeatedHour)
    lines.push(
      "  note: the window crosses the repeated hour of 2026-11-01 (06:00 to 08:00Z); the API's times there read an hour late, so a figure near that edge can sit on either side",
    );
  lines.push(...firstPass(m.firstPass), ...lanes(m.lanes), ...speed(m.speed), ...agents(m.agents));
  lines.push(...startup(m.startup));
  lines.push("", "limits");
  lines.push(`  CLAUDE.md: ${m.limits.claudeMdBytes} bytes; orient: ${m.limits.orientBytes} bytes`);
  lines.push(
    `  memory index: ${m.limits.memoryIndexLines} of ${m.limits.memoryIndexLimit} lines, ${m.limits.memoryFiles} files`,
  );
  lines.push("", `rest calls this run: ${m.rest.calls} (cap ${m.rest.cap})`);
  return lines.join("\n");
}
