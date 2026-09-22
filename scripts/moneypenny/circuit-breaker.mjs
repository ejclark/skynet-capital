// THE SPEND CIRCUIT BREAKER (#2946, requested by Eric 2026-09-16 — a stopgap ahead of the
// batching/model-tier redesign, landed alone rather than folded into that larger work).
//
// The count-based caps (research-dispatch-budget.json, the held research-daily-budget.json) bound
// how many SESSIONS dispatch. Neither bounds relative USAGE — a cap of "6 sessions" says nothing
// if one of those six sessions runs away and burns 10x a normal session's share. This is keyed to
// `total_cost_usd` from the cost meter (#2979) instead, and it fails HARD rather than slow: once
// tripped, dispatch is zero on every tick until a human clears it — never a lower rate, and never
// a rolling window that quietly reopens once the expensive burst ages out on its own.
//
// 2026-09-18: this repo runs on a Claude Max 20 flat-fee subscription, not metered API billing —
// `total_cost_usd` is the CLI's imputed API-equivalent cost, never a literal charge (no dollars
// actually change hands per session; see research-circuit-breaker.json's `$why`). Treat every
// dollar figure below as a relative token-usage proxy for sizing the threshold, not real spend.
//
// WHY THIS CANNOT LIVE AS A PURE LOCAL DEFAULT, unlike the count-based caps. Those are computed
// from `git log` — local, fast, side-effect-free, safe to leave as a shared function's default
// parameter (and events.mjs's dueForResearch deliberately keeps that property: see its header,
// and the wiring bug this file's sibling spec caught the same day this was built). Spend data does
// not exist locally: it lives in GitHub Actions run logs, and the trip state is a GitHub issue
// label (never a committed file — this repo's research lane never pushes to main outside a PR,
// issue #915, Eric 2026-08-30: "some merge to main, open PRs for research; non-negotiable"). Both
// require network calls through `gh`, which is exactly the kind of external dependency that must
// never hide inside a shared function's default — it belongs behind an explicit call, made once,
// at the one real call site that has GH_TOKEN and is willing to pay for the round trip.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONFIG_FILE = join(process.cwd(), "research-circuit-breaker.json");

/** Fail-closed doctrine, same as loadDispatchCap/loadDailyBudget: a missing or malformed
 *  threshold must never read as "no breaker" — that is exactly the shape of the fail-open bug
 *  this whole file exists to guard against a second and third time. */
export function loadBreakerConfig(file = CONFIG_FILE) {
  if (!existsSync(file))
    throw new Error(
      `moneypenny: circuit breaker config missing at ${file}. Refusing to dispatch with no spend ` +
        "ceiling — see issue #2946. Restore the file rather than removing the breaker.",
    );
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  const { maxSpendUsd, windowHours, trackingIssue, trippedLabel } = cfg;
  if (!(typeof maxSpendUsd === "number" && maxSpendUsd > 0))
    throw new Error(
      `moneypenny: ${file} maxSpendUsd must be a positive number, got ${JSON.stringify(maxSpendUsd)}.`,
    );
  if (!(Number.isInteger(windowHours) && windowHours >= 1))
    throw new Error(
      `moneypenny: ${file} windowHours must be a positive integer, got ${JSON.stringify(windowHours)}.`,
    );
  if (!(Number.isInteger(trackingIssue) && trackingIssue > 0))
    throw new Error(
      `moneypenny: ${file} trackingIssue must be a positive integer, got ${JSON.stringify(trackingIssue)}.`,
    );
  if (!(typeof trippedLabel === "string" && trippedLabel.length > 0))
    throw new Error(
      `moneypenny: ${file} trippedLabel must be a non-empty string, got ${JSON.stringify(trippedLabel)}.`,
    );
  return { maxSpendUsd, windowHours, trackingIssue, trippedLabel };
}

/** Real `gh` calls by default; every function below takes `exec` so specs can inject a fake one
 *  and never touch the network. Matches `child_process.execFileSync`'s signature — `(cmd, args,
 *  opts) => string` — so a fake is a drop-in, not a reinterpretation.
 *
 *  maxBuffer is explicit at 64MB, not Node's 1MB default: `recentResearchSpend` calls `gh run
 *  view --log` on real event-research runs, and one run's combined matrix-leg log routinely
 *  exceeds 1MB (2026-09-17 — a real tick hit `spawnSync gh ENOBUFS` reading a run log the day
 *  dispatch resumed, which correctly fail-closed per doctrine but then blocked every subsequent
 *  tick for the rest of that run's rolling window). Fail-closed on an unreadable log is right;
 *  fail-closed on a log that's merely large is a bug this raises the ceiling on, not a doctrine
 *  change. */
function defaultExec(cmd, args, opts) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}

/** Is the breaker CURRENTLY tripped? Reads a GitHub issue label, never a committed file (#915).
 *  Fail-closed: a query failure (network, auth, the issue itself missing) refuses to dispatch —
 *  the same "broken must never read as clear" doctrine as the config load above. This is
 *  deliberately the FIRST thing checked: if already tripped, nothing else in this file needs to
 *  run at all — no spend query, no log fetch, just an immediate no. */
export function isBreakerTripped({ trackingIssue, trippedLabel, exec = defaultExec }) {
  let out;
  try {
    out = exec("gh", ["issue", "view", String(trackingIssue), "--json", "labels"]);
  } catch (err) {
    throw new Error(
      `moneypenny: could not check circuit breaker state on issue #${trackingIssue} (${err.message}). ` +
        "Refusing to dispatch while the breaker's own state is unreadable — see issue #2946.",
    );
  }
  let labels;
  try {
    labels = JSON.parse(out).labels;
  } catch {
    throw new Error(
      `moneypenny: 'gh issue view ${trackingIssue}' returned unparseable output. Refusing to ` +
        "dispatch while the breaker's own state is unreadable — see issue #2946.",
    );
  }
  return (labels ?? []).some((l) => l.name === trippedLabel);
}

/** Total `total_cost_usd` across every matrix-leg research session that completed within the
 *  rolling window, read from real GitHub Actions run logs — the cost meter (#2979) already writes
 *  one greppable `::notice::cost — event=<id> usd=<n> ...` line per session, on every outcome.
 *
 *  COST OF THIS CHECK, stated plainly (house doctrine: never hide a resource cost). One
 *  `gh run list` (cheap, a single list call), then one `gh run view --log` PER RUN in the window
 *  — not per matrix leg, since a single run's log already carries every leg's cost line, so this
 *  is bounded by TICK frequency, not by session count. `--limit 50` caps the worst case even
 *  during a real runaway, which is exactly when this needs to keep working cheaply. This is a
 *  read-only safety check, not speculative polling — the free-diagnostics-first doctrine
 *  (CLAUDE.md) governs probes that COULD avoid spending the resource; there is no cheaper way to
 *  learn what a session actually cost than reading what it reported. */
export function recentResearchSpend({ windowHours, exec = defaultExec }) {
  const sinceIso = new Date(Date.now() - windowHours * 3_600_000).toISOString();
  let runsOut;
  try {
    runsOut = exec("gh", [
      "run",
      "list",
      "--workflow=moneypenny-events.yml",
      "--json",
      "databaseId,createdAt,status",
      "--limit",
      "50",
    ]);
  } catch (err) {
    throw new Error(
      `moneypenny: 'gh run list' failed (${err.message}) — refusing to dispatch with unreadable spend.`,
    );
  }
  let runs;
  try {
    runs = JSON.parse(runsOut);
  } catch {
    throw new Error(
      "moneypenny: 'gh run list' returned unparseable output — refusing to dispatch with unreadable spend.",
    );
  }
  const inWindow = runs.filter((r) => r.status === "completed" && r.createdAt >= sinceIso);

  let totalUsd = 0;
  const COST_LINE = /::notice::cost — event=\S+ usd=([\d.]+)/g;
  for (const run of inWindow) {
    let log;
    try {
      log = exec("gh", ["run", "view", String(run.databaseId), "--log"]);
    } catch (err) {
      // A single unreadable run log is a real failure of the same class as the others — this
      // check exists to prevent a runaway, so an undercounted total is worse than a loud refusal.
      throw new Error(
        `moneypenny: could not read run ${run.databaseId}'s log (${err.message}) — refusing to ` +
          "dispatch with an incomplete spend total.",
      );
    }
    for (const m of log.matchAll(COST_LINE)) {
      const usd = Number(m[1]);
      if (Number.isFinite(usd)) totalUsd += usd;
    }
  }
  return totalUsd;
}

/** Trips the breaker: applies the label (creating it first if the repo doesn't have it yet — a
 *  fresh repo or a first-ever trip may not) and posts one comment naming the spend and window so
 *  the clearing human has the number, not just the fact. Idempotent — safe to call on a tick that
 *  finds itself over threshold again before anyone has cleared it; `gh issue edit --add-label` on
 *  an already-present label is a no-op, and the comment says so rather than re-alarming. */
export function tripBreaker({
  trackingIssue,
  trippedLabel,
  spentUsd,
  maxSpendUsd,
  windowHours,
  exec = defaultExec,
}) {
  try {
    exec("gh", [
      "label",
      "create",
      trippedLabel,
      "--color",
      "B60205",
      "--description",
      "Research lane spend circuit breaker is OPEN — dispatch halted, needs a human to clear it",
      "--force",
    ]);
  } catch {
    // --force makes "already exists" a no-op on success; a real failure here surfaces on the
    // --add-label call immediately after, so this is deliberately not fail-closed on its own.
  }
  exec("gh", ["issue", "edit", String(trackingIssue), "--add-label", trippedLabel]);
  exec("gh", [
    "issue",
    "comment",
    String(trackingIssue),
    "--body",
    `🔴 **Research circuit breaker tripped** — imputed usage in the trailing ${windowHours}h is ` +
      `$${spentUsd.toFixed(2)} (Claude Max 20 API-equivalent, not a literal charge), over the ` +
      `$${maxSpendUsd} threshold (research-circuit-breaker.json). Dispatch is halted on every tick ` +
      "until this is cleared, regardless of what the rolling window recomputes to later. To resume: " +
      `remove the \`${trippedLabel}\` label from this issue.`,
  ]);
}

/** The one function the workflow calls. Returns `{ dispatch: boolean, reason: string }` — never
 *  throws on a NORMAL trip (that is the expected, correct outcome, not a failure); throws only
 *  when the breaker's own machinery (config, GH queries) is itself broken, per the fail-closed
 *  doctrine above. Checks the label FIRST and returns immediately if already tripped, so a repeat
 *  tick after a trip costs one cheap label read, never a spend query. */
export function checkCircuitBreaker({ config = loadBreakerConfig(), exec = defaultExec } = {}) {
  const { maxSpendUsd, windowHours, trackingIssue, trippedLabel } = config;

  if (isBreakerTripped({ trackingIssue, trippedLabel, exec }))
    return {
      dispatch: false,
      reason: `circuit breaker already tripped on issue #${trackingIssue}`,
    };

  const spentUsd = recentResearchSpend({ windowHours, exec });
  if (spentUsd > maxSpendUsd) {
    tripBreaker({ trackingIssue, trippedLabel, spentUsd, maxSpendUsd, windowHours, exec });
    return {
      dispatch: false,
      reason: `spend $${spentUsd.toFixed(2)} over ${windowHours}h exceeds $${maxSpendUsd} — breaker tripped`,
    };
  }

  return {
    dispatch: true,
    reason: `spend $${spentUsd.toFixed(2)} of $${maxSpendUsd} over ${windowHours}h`,
  };
}
