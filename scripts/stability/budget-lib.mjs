// The pure half of the stability budget run (#4612 slice 1, #4613): what to click, how to read the
// container, and the verdict. Side effects (docker, HTTP) live in budget-run.mjs; everything here
// is specced in tests/scripts/stability-budget.spec.ts.

/**
 * Production's own environment, read from fly.toml's `[env]` block — so the run mounts every
 * durable store at the path production does, and a store added there is measured here for free.
 */
export function flyEnv(toml) {
  const block = /^\[env\]\s*$([\s\S]*?)^\[/m.exec(`${toml}\n[`)?.[1] ?? "";
  const env = {};
  for (const line of block.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"/.exec(line);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

/** Production's start command (fly.toml `[processes] app`), else the Dockerfile's CMD. */
export function flyCommand(toml) {
  const block = /^\[processes\]\s*$([\s\S]*?)^\[/m.exec(`${toml}\n[`)?.[1] ?? "";
  return /^\s*app\s*=\s*"([^"]+)"/m.exec(block)?.[1] ?? "node --enable-source-maps dist/serve.mjs";
}

/**
 * The GETs the shell fires when a signed-in member opens Accounts cold — captured with Playwright
 * against the built shell at 1400px and 390px on 2026-10-04 (both widths fire the same set; only
 * the order differs). `/events?by=month` is left out: it is a held-open stream, not a request. The
 * net-worth card's standing line is what asks for the viewed account's Pulse.
 */
export function accountsOpen(ownerId) {
  const me = encodeURIComponent(ownerId);
  return [
    "/app/accounts",
    "/api/ops-status",
    "/api/settings",
    "/tower?frame=card",
    "/api/trade/plays",
    "/api/accounts/networth",
    `/api/desk/${me}`,
    "/api/board?by=month",
    "/api/council",
    `/api/accounts/${me}/equity-curve?range=1M`,
    "/api/trade/bars?symbol=SPY&days=31",
    `/api/desk/${me}/activity`,
    `/api/desk/${me}/pulse`,
  ];
}

/**
 * The same page load with EVERY participant's Pulse fired with it — any member can open any desk's
 * Pulse tab, so the roster is the bound on how many land at once (#4613's worst case).
 */
export function accountsBurst(ownerId, participantIds) {
  const pulses = participantIds.map((id) => `/api/desk/${encodeURIComponent(id)}/pulse`);
  return [...accountsOpen(ownerId).filter((p) => !p.endsWith("/pulse")), ...pulses];
}

/** A handful of other common GETs: the landing board, a bot's desk, the ladder and the Wire. */
export function commonGets(botId) {
  const bot = encodeURIComponent(botId);
  return [
    "/app/leaderboard",
    "/api/board?by=equity",
    `/api/desk/${bot}`,
    `/api/desk/${bot}/decisions`,
    `/api/desk/${bot}/heartbeat`,
    "/api/learn",
    "/api/playbooks",
    "/api/wire",
  ];
}

const KB = (text, key) => Number(new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, "m").exec(text)?.[1] ?? 0);

/** Resident set from `/proc/<pid>/status`, in MB: now, the high-water mark, and the anon part. */
export function procMemory(status) {
  const mb = (key) => Math.round(KB(status, key) / 1024);
  return { rss: mb("VmRSS"), hwm: mb("VmHWM"), anon: mb("RssAnon") };
}

/**
 * The verdict. Fails on what kills or breaks the server — an OOM kill, an exit, a 5xx or a refused
 * connection — and on the numbers the budget names: peak RSS for the whole run; what opening
 * Accounts adds and how long its Pulse takes inside that load (#4613's Done-when: ≤ 30 MB,
 * ≤ 150 ms at 180 days × 12); and the same two numbers for each Pulse fired alone.
 */
export function verdict({ phases, state, budgets, bootPeakMb = 0 }) {
  const failures = [];
  if (state.oomKilled) failures.push("the kernel OOM-killed the server (OOMKilled=true)");
  else if (!state.running) failures.push(`the server exited (exit ${state.exitCode})`);
  for (const phase of phases)
    for (const row of phase.rows)
      if (typeof row.status !== "number" || row.status >= 500)
        failures.push(`${phase.name}: ${row.path} answered ${row.status}`);
  const peak = Math.max(bootPeakMb, ...phases.map((p) => p.peakMb ?? 0));
  if (peak > budgets.peakMb) failures.push(`peak RSS ${peak} MB > budget ${budgets.peakMb} MB`);
  failures.push(
    ...pageFailures(
      phases.find((p) => p.name === "accounts-open"),
      budgets,
    ),
  );
  const pulses = phases.find((p) => p.name === "pulse-each")?.rows ?? [];
  for (const row of pulses) {
    if (row.addMb > budgets.pulseMb)
      failures.push(`${row.path} added ${row.addMb} MB > budget ${budgets.pulseMb} MB`);
    if (row.ms > budgets.pulseMs)
      failures.push(`${row.path} took ${row.ms} ms > budget ${budgets.pulseMs} ms`);
  }
  return { ok: failures.length === 0, peakMb: peak, failures };
}

/** The Accounts open as one page: what the whole load added, and its Pulse's time within it. */
function pageFailures(open, budgets) {
  if (open?.peakMb === undefined || open.beforeMb === undefined) return []; // died: no peak to read
  const out = [];
  const added = open.peakMb - open.beforeMb;
  if (added > budgets.pageMb)
    out.push(`${open.name}: the page added ${added} MB > budget ${budgets.pageMb} MB`);
  for (const row of open.rows)
    if (row.path.endsWith("/pulse") && row.ms > budgets.pulseMs)
      out.push(`${open.name}: ${row.path} took ${row.ms} ms > budget ${budgets.pulseMs} ms`);
  return out;
}

/** One phase as a markdown table: every request, its status, time, size and memory added. */
export function phaseTable(phase) {
  const head = [
    `#### ${phase.name} — ${phase.note}`,
    "",
    "| request | status | ms | KB | +MB |",
    "|---|--:|--:|--:|--:|",
  ];
  const rows = phase.rows.map(
    (r) => `| \`${r.path}\` | ${r.status} | ${r.ms} | ${r.kb ?? "—"} | ${r.addMb ?? "—"} |`,
  );
  const foot =
    phase.peakMb === undefined
      ? []
      : [
          "",
          `RSS before ${phase.beforeMb} MB → peak ${phase.peakMb} MB (+${phase.peakMb - phase.beforeMb}) · wall ${phase.wallMs} ms`,
        ];
  return [...head, ...rows, ...foot, ""].join("\n");
}

const n = (x) => x.toLocaleString("en-US");

/** The whole run as markdown: what was seeded, boot, one table per phase, and the verdict. */
export function summary(report) {
  const { seeded, boot, state, verdict: v } = report;
  const down = `DOWN (OOMKilled=${state.oomKilled}, exit ${state.exitCode})`;
  const peak = state.running ? `${v.peakMb} MB` : "n/a (killed mid-phase)";
  return [
    `### Stability budget — ${report.commit} · ${report.days} days × ${report.participants} participants · ${report.memory} container`,
    "",
    `Seeded ${n(seeded.historyRowsPerParticipant)} history samples per participant (${n(seeded.historyRows)} total), ${n(seeded.activityRows)} activity lines, ${n(seeded.decisionCycles)} decision cycles in ${n(report.seedMs)} ms.`,
    `Boot: peak RSS ${boot.peakMb} MB, settled ${boot.settledMb} MB (anon ${boot.anonMb} MB).`,
    "",
    ...report.phases.map(phaseTable),
    `Server: ${state.running ? "running" : down} · peak RSS ${peak} (budget ${report.budgets.peakMb} MB) · cgroup memory.peak ${report.cgroupPeakMb ?? "n/a"} MB`,
    "",
    v.ok ? "**PASS** — within budget." : `**FAIL**\n${v.failures.map((f) => `- ${f}`).join("\n")}`,
  ].join("\n");
}
