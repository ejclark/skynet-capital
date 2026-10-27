// The recorder's console report (#4943): what `node scripts/study/session.mjs` prints after a run —
// one block per action (what was done, where the page went, what the findings say), then the task's
// numbers. Area-agnostic, print-only: every judgement it shows was made in metrics.mjs.

/** What one action was, in a phrase. */
function actionPhrase(r) {
  const a = r.action;
  if (a.kind === "tap") {
    const hit = r.tap?.hit;
    return `tap (${a.x}, ${a.y}) → ${hit ? `${hit.role} "${hit.name}"` : `miss, nearest ${r.tap?.nearest?.distance}px`}`;
  }
  return a.kind === "scroll" ? `scroll ${a.dir} ${a.screens}` : a.kind;
}

/** One trace record: the action, where the page went, and every finding on it. */
function printRecord(r) {
  console.log(`  #${r.step} ${actionPhrase(r)}`);
  const text = r.before.textHash === r.after.textHash ? "unchanged" : "changed";
  const landed = r.landing ? ` · landed ${r.landing.screens} screens from "${r.landing.name}"` : "";
  console.log(
    `     view ${r.before.view} → ${r.after.view} · scrollY ${r.scroll.before} → ${r.scroll.after} (${r.scroll.samples.length} samples) · shifts ${r.shifts.length} · text ${text}${landed}`,
  );
  if (!r.settled) console.log("     network never went idle — the after may be mid-load");
  for (const u of r.blocked) console.log(`     blocked off-origin request: ${u}`);
  for (const f of r.findings) console.log(`     ${f.severity} ${f.kind}: ${f.what}`);
}

/**
 * A session's trace, one action per block, then the task's numbers and the world's own log (a
 * composed world's unstubbed reads and the writes it recorded and never sent).
 */
export function printSession(trace, metrics, worldLog) {
  for (const r of trace) printRecord(r);
  const { findings, ...numbers } = metrics;
  console.log(`  task: ${JSON.stringify(numbers)}`);
  const kinds = [...new Set(findings.map((f) => f.kind))].join(", ") || "none";
  console.log(`  findings: ${findings.length} (${kinds})`);
  if (worldLog?.unstubbed.length)
    console.log(`  unstubbed reads: ${[...new Set(worldLog.unstubbed)].join(", ")}`);
  if (worldLog?.writes.length)
    console.log(`  writes recorded (never sent): ${worldLog.writes.length}`);
}
