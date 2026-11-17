// The faculty round's TABLE — one row per session and the ranked markdown a readout starts from.
// Pure, so the round runner (round.mjs) and the re-grader (regrade.mjs) share one shape without the
// re-grader importing the driver and its browser.

/** One row of the round's table — what a readout ranks. */
export function rowOf(scenario, run, summary, error) {
  if (error)
    return { id: scenario.id, member: scenario.member, viewport: scenario.viewport, run, error };
  const v = summary.verdict;
  return {
    id: scenario.id,
    member: scenario.member,
    viewport: summary.viewport,
    run,
    success: v.success,
    reason: v.reason,
    unintended: v.unintended,
    newOrders: v.newOrders,
    ended: summary.ended,
    ...(summary.confounded ? { confounded: summary.confounded } : {}),
    turns: summary.turns,
    cap: summary.cap,
    ease: summary.ease?.score ?? null,
    easeWhy: summary.ease?.reason ?? null,
    maxConfusion: summary.maxConfusion,
    said: summary.said,
  };
}

/** The table in words, worst first: errors, unintended writes, failures, then the rest. */
export function roundMarkdown(rows) {
  const rank = (r) =>
    r.error ? 0 : r.confounded ? 4 : r.unintended?.length ? 1 : r.success ? 3 : 2;
  const sorted = [...rows].sort((a, b) => rank(a) - rank(b) || String(a.id).localeCompare(b.id));
  // A confounded session measured the harness, not the app: listed, never counted either way.
  const counted = rows.filter((r) => !(r.error || r.confounded));
  const ok = counted.filter((r) => r.success).length;
  const harm = counted.filter((r) => r.unintended?.length).length;
  const set = rows.length - counted.length;
  const lines = [
    `# Faculty round — ${ok} of ${counted.length} changes landed as meant · ${harm} with an unintended write${set ? ` · ${set} set aside (confounded or errored)` : ""}`,
    "",
    "| id | member · device | landed? | why | unintended | turns | ease | confusion |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of sorted) {
    if (r.error) {
      lines.push(`| ${r.id} | ${r.member} · ${r.viewport} | error | ${clip(r.error)} | | | | |`);
      continue;
    }
    if (r.confounded) {
      lines.push(
        `| ${r.id} | ${r.member} · ${r.viewport} | set aside | ${clip(r.confounded)} | | ${r.turns}/${r.cap} | | |`,
      );
      continue;
    }
    lines.push(
      `| ${r.id} | ${r.member} · ${r.viewport} | ${r.success ? "yes" : "no"} | ${clip(r.reason)} | ${clip((r.unintended ?? []).join("; "))} | ${r.turns}/${r.cap} | ${r.ease ?? "—"} | ${r.maxConfusion} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

const clip = (s) =>
  String(s ?? "")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ")
    .slice(0, 160);
