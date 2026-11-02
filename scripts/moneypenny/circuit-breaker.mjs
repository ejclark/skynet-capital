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
//
// 2026-11-01 (#6020): for six weeks this read $0.00 on every tick. The cost line it looked for was
// `::notice::cost — …`, the form the workflow ECHOES; what a run log actually carries is the
// rendered annotation `##[notice]cost — event=<id> usd=<n> …` (the `::notice::` text survives only
// inside the echoed script source, where `usd=$COST` carries no number). And `gh run list` with no
// event filter returned the newest 50 runs of EVERY event type, which on 155 of 187 ticks reached
// back less than the 4-hour window. Both are fixed here, pinned by a fixture cut from a real run
// log (tests/fixtures/circuit-breaker/). The threshold moved with it, Eric's own pick on #6020
// (2026-11-01T14:31Z, "A2": $100 per 4h, $200 at surge), read off the work-mode dial so a surge he
// set gets the wider line and nothing else does. A trip now also assigns him on the tracking issue
// — the same door the fitness contracts use — because a label and a comment reached nobody.
//
// A trip needs a human to clear it, so it is never spent on a reading the brake is unsure of. The
// window holds past spend while the dial reads now, so two things read as a runaway that were not:
// a dial it could not read (refused for this tick, with no label; the next tick reads it again), and
// the end of a real surge, whose spend sits in the window under the narrower line (the surge's line
// holds until the window has rolled past its end).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ERIC } from "./decision-callout.mjs";
import { sleepSync, withRetry } from "./gh.mjs";
import { loadWorkModeConfig, readWorkMode } from "./work-mode.mjs";

const CONFIG_FILE = join(process.cwd(), "research-circuit-breaker.json");

/** Fail-closed doctrine, same as loadDispatchCap/loadDailyBudget: a missing or malformed
 *  threshold must never read as "no breaker" — that is exactly the shape of the fail-open bug
 *  this whole file exists to guard against a second and third time. `maxSpendUsd` is the line for
 *  every dial position but surge; `maxSpendUsdAtSurge` is surge's own, never below it. */
export function loadBreakerConfig(file = CONFIG_FILE) {
  if (!existsSync(file))
    throw new Error(
      `moneypenny: circuit breaker config missing at ${file}. Refusing to dispatch with no spend ` +
        "ceiling — see issue #2946. Restore the file rather than removing the breaker.",
    );
  const cfg = JSON.parse(readFileSync(file, "utf8"));
  const { maxSpendUsd, maxSpendUsdAtSurge, windowHours, trackingIssue, trippedLabel } = cfg;
  if (!(typeof maxSpendUsd === "number" && maxSpendUsd > 0))
    throw new Error(
      `moneypenny: ${file} maxSpendUsd must be a positive number, got ${JSON.stringify(maxSpendUsd)}.`,
    );
  if (!(typeof maxSpendUsdAtSurge === "number" && maxSpendUsdAtSurge >= maxSpendUsd))
    throw new Error(
      `moneypenny: ${file} maxSpendUsdAtSurge must be a number no lower than maxSpendUsd, got ${JSON.stringify(maxSpendUsdAtSurge)}.`,
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
  return { maxSpendUsd, maxSpendUsdAtSurge, windowHours, trackingIssue, trippedLabel };
}

/** The line the dial position is held to: surge alone gets the wider one. Pure. */
export function thresholdFor(position, { maxSpendUsd, maxSpendUsdAtSurge }) {
  return position === "surge" ? maxSpendUsdAtSurge : maxSpendUsd;
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

/** Every READ below goes through here: a GitHub 5xx gets two more tries with backoff before the
 *  fail-closed refusal fires (#5354, 2026-10-14: one `HTTP 500` on `gh run view --log`, then
 *  another on its jobs fallback a second later, turned a `route` tick red and filed a repair
 *  issue — the same run's log read fine minutes after). Still fail-closed: a 5xx that outlasts the
 *  retries, and any 4xx or "log not found" at once, throws exactly as before. Writes (the trip)
 *  are not retried — a repeated `issue comment` would double-post. */
const ghRead = (exec, args, sleep) => withRetry(() => exec("gh", args), { sleep });

/** Is the breaker CURRENTLY tripped? Reads a GitHub issue label, never a committed file (#915).
 *  Fail-closed: a query failure (network, auth, the issue itself missing) refuses to dispatch —
 *  the same "broken must never read as clear" doctrine as the config load above. This is
 *  deliberately the FIRST thing checked: if already tripped, nothing else in this file needs to
 *  run at all — no spend query, no log fetch, just an immediate no. */
export function isBreakerTripped({
  trackingIssue,
  trippedLabel,
  exec = defaultExec,
  sleep = sleepSync,
}) {
  let out;
  try {
    // REST, not `gh issue view` (GraphQL): a Claude Code cloud session gets a 403 on GraphQL, so
    // the breaker read as tripped in every cloud session (2026-10-18). Same `{ labels }` shape.
    const path = `repos/{owner}/{repo}/issues/${trackingIssue}`;
    out = ghRead(exec, ["api", path, "--jq", "{labels: [.labels[] | {name}]}"], sleep);
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
      `moneypenny: the read of issue #${trackingIssue} returned unparseable output. Refusing to ` +
        "dispatch while the breaker's own state is unreadable — see issue #2946.",
    );
  }
  return (labels ?? []).some((l) => l.name === trippedLabel);
}

/** The cost meter's line as a run log carries it (#2979 writes it; #6020 read the real shape):
 *  `##[notice]cost — event=<id> usd=<n> turns=… is_error=…`. `##[notice]` is how GitHub renders a
 *  `::notice::` annotation into the log; the `::notice::` form is accepted too, since the echoed
 *  script source carries it (with `usd=$COST`, no digits, so it never counts). The dash is matched
 *  loosely: the log is UTF-8 but one wrong decode of the em dash must not blind the brake again. */
export const COST_LINE =
  /(?:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z) )?(?:##\[notice\]|::notice::)cost [^\n]*?event=\S+ usd=([\d.]+)/g;

/** Pure: the `usd=` numbers summed over the cost lines in one log's text. With a window, a line
 *  counts when ITS OWN timestamp (the one `gh run view --log` prints before it, the moment that
 *  leg finished) falls inside `[sinceMs, untilMs]`; a line with no timestamp counts when
 *  `fallbackMs` (the run's start) does. The window is keyed to when a leg FINISHED, not when its
 *  run started: the 4h to 2026-10-30T21:24:50Z holds 103 legs for $83.37 that way (the number
 *  the #6020 threshold was sized against) and 97 for $78.14 by run start, because a tick's run
 *  starts before its legs end — and a brake must see a burst as it lands, not a run later. */
export function sumCostLines(log, window = null) {
  let total = 0;
  for (const m of String(log ?? "").matchAll(COST_LINE)) {
    const usd = Number(m[2]);
    if (!Number.isFinite(usd)) continue;
    if (window) {
      const at = m[1] ? Date.parse(m[1]) : window.fallbackMs;
      if (!(at >= window.sinceMs && at <= window.untilMs)) continue;
    }
    total += usd;
  }
  return total;
}

/** How many `workflow_dispatch` runs the list reads back. Every research leg runs on a dispatch
 *  (the push tick re-fires itself as one), so no other event type can carry a cost line; 200 of
 *  them is four hours at the busiest pace on record (50 in the 4h to 2026-10-30T21:24Z) plus the
 *  slack below. */
export const RUN_LIST_LIMIT = 200;

/** How long before the window a run may have started and still have a leg finish inside it. A
 *  research leg is capped at 150 turns and the longest green one on record ran under an hour. */
export const LEG_SLACK_MS = 2 * 3_600_000;

/** Total `total_cost_usd` across every matrix-leg research session that completed within the
 *  rolling window, read from real GitHub Actions run logs — the cost meter (#2979) already writes
 *  one greppable cost line per session (`COST_LINE` above), on every outcome.
 *
 *  COST OF THIS CHECK, stated plainly (house doctrine: never hide a resource cost). One
 *  `gh run list` (cheap, a single list call), then one `gh run view --log` PER RUN in the window
 *  — not per matrix leg, since a single run's log already carries every leg's cost line, so this
 *  is bounded by TICK frequency, not by session count. The list is filtered to `workflow_dispatch`
 *  — the only event that can carry a cost line — and capped at `RUN_LIST_LIMIT`, so it looks back
 *  the full window on the busiest tick seen and still bounds a real runaway, which is exactly when
 *  this needs to keep working cheaply. This is a read-only safety check, not speculative polling —
 *  the free-diagnostics-first doctrine (CLAUDE.md) governs probes that COULD avoid spending the
 *  resource; there is no cheaper way to learn what a session actually cost than reading what it
 *  reported. `now` is injectable so a window can be replayed against cached logs. */
export function recentResearchSpend({
  windowHours,
  exec = defaultExec,
  sleep = sleepSync,
  now = Date.now(),
}) {
  const sinceMs = now - windowHours * 3_600_000;
  // Runs started up to LEG_SLACK_MS before the window may still have a leg finish inside it. Only
  // COMPLETED runs are read: an in-progress run has no combined log yet, and refusing on it would
  // halt research on every tick a session is running.
  const listedSinceIso = new Date(sinceMs - LEG_SLACK_MS).toISOString();
  let runsOut;
  try {
    runsOut = ghRead(
      exec,
      [
        "run",
        "list",
        "--workflow=moneypenny-events.yml",
        "--event",
        "workflow_dispatch",
        "--json",
        "databaseId,createdAt,status",
        "--limit",
        String(RUN_LIST_LIMIT),
      ],
      sleep,
    );
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
  const inWindow = runs.filter((r) => r.status === "completed" && r.createdAt >= listedSinceIso);

  let totalUsd = 0;
  for (const run of inWindow) {
    let log;
    try {
      log = ghRead(exec, ["run", "view", String(run.databaseId), "--log"], sleep);
    } catch (err) {
      log = costLegLogs(run.databaseId, err, exec, sleep);
    }
    totalUsd += sumCostLines(log, {
      sinceMs,
      untilMs: now,
      fallbackMs: Date.parse(run.createdAt),
    });
  }
  return totalUsd;
}

/** Matrix legs of the `build-events` job — the only job that writes a cost line. GitHub names
 *  each leg "<job name> (<matrix value>)", and an unexpanded skipped matrix keeps the bare name. */
const COST_JOB_PREFIX = "research due events";

/** The fallback when a run's combined log can't be read. `gh run view --log` fails for the WHOLE
 *  run when any one job has no log — a cancelled job does not (#4658, 2026-10-05: run
 *  37373634443's `route` was cancelled and every other job skipped, so `gh` answered
 *  `log not found: <route's job id>` and the breaker refused every tick for the next 4 hours).
 *  So read only the jobs that can carry a cost line, one at a time. A run whose research legs
 *  were all skipped never launched a session and adds $0 — that is a known zero, not a guess.
 *  So does a leg GitHub lists with `steps: []`: it never reached a runner, so it has no log and
 *  no session (#6640, 2026-11-02: run 41369452792's jobs-2026-11-06 leg was cancelled while
 *  queued, and the breaker refused on `log not found: 125037119282` for the rest of its window).
 *  The empty list must be present: a job with no `steps` field at all is read like any other.
 *  Anything else stays fail-closed: a research leg that ran but whose log can't be read, or a
 *  job list that can't be read, still refuses, because an undercounted total is worse than a
 *  loud refusal (this check exists to stop a runaway). */
function costLegLogs(runId, cause, exec, sleep) {
  const refuse = (detail) =>
    new Error(
      `moneypenny: could not read run ${runId}'s log (${detail}) — refusing to ` +
        "dispatch with an incomplete spend total.",
    );
  let jobs;
  try {
    jobs = JSON.parse(ghRead(exec, ["run", "view", String(runId), "--json", "jobs"], sleep)).jobs;
  } catch {
    throw refuse(cause.message);
  }
  if (!Array.isArray(jobs)) throw refuse(cause.message);
  const neverRan = (j) =>
    j.conclusion === "skipped" || (Array.isArray(j.steps) && j.steps.length === 0);
  const legs = jobs.filter((j) => String(j.name ?? "").startsWith(COST_JOB_PREFIX) && !neverRan(j));
  return legs
    .map((leg) => {
      try {
        const args = ["run", "view", String(runId), "--log", "--job", String(leg.databaseId)];
        return ghRead(exec, args, sleep);
      } catch (err) {
        throw refuse(`${cause.message}; job ${leg.databaseId}: ${err.message}`);
      }
    })
    .join("\n");
}

/** Trips the breaker: applies the label (creating it first if the repo doesn't have it yet — a
 *  fresh repo or a first-ever trip may not), posts one comment naming the spend and window so the
 *  clearing human has the number, not just the fact, then assigns the owner on the tracking issue.
 *  The assignment is what reaches him: a label and a comment on #2946 notify nobody, and clearing
 *  the breaker is his hand alone. It goes through REST, the route every other assignment here uses
 *  (assignments.mjs, fitness.mjs), and last, so a refused one costs a warning and never the comment:
 *  the label is on by then, and a throw would leave a halt that explains itself to nobody.
 *  Idempotent — safe to call on a tick that finds itself over threshold again before anyone has
 *  cleared it; `--add-label` and a POST of an existing assignee are no-ops. */
export function tripBreaker({
  trackingIssue,
  trippedLabel,
  spentUsd,
  maxSpendUsd,
  windowHours,
  position = "normal",
  exec = defaultExec,
  warn = console.error,
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
      `$${maxSpendUsd} line for the dial at \`${position}\` (research-circuit-breaker.json). ` +
      "Dispatch is halted on every tick until this is cleared, regardless of what the rolling " +
      `window recomputes to later. @${ERIC} is assigned because clearing it is his: remove the ` +
      `\`${trippedLabel}\` label from this issue to resume.`,
  ]);
  try {
    exec("gh", [
      "api",
      "--method",
      "POST",
      `repos/{owner}/{repo}/issues/${trackingIssue}/assignees`,
      "-f",
      `assignees[]=${ERIC}`,
    ]);
  } catch (err) {
    // stderr: the workflow parses this process's stdout as the verdict's JSON.
    warn(
      `::warning::circuit breaker: could not assign ${ERIC} on #${trackingIssue} (${err.message})`,
    );
  }
}

/** When the dial last stopped being at surge, in ms, or null if it never has. An ended surge keeps
 *  its label until the next push takes it off, and the reader says when it ended; after that the
 *  dial reads a plain `normal` (one REST call, nothing about the past), and the label event that
 *  took it off is the only record. So this read is made only when a total is already over the
 *  narrower line, never on an ordinary tick. Throws when the events cannot be read. */
export function lastSurgeEnd({
  mode,
  exec = defaultExec,
  sleep = sleepSync,
  workMode = loadWorkModeConfig(),
}) {
  const label = `${workMode.labelPrefix}surge`;
  if (mode.endedLabel === label) return mode.endedAtMs;
  const out = ghRead(
    exec,
    [
      "api",
      "--paginate",
      `repos/{owner}/{repo}/issues/${workMode.trackingIssue}/events?per_page=100`,
      "--jq",
      `.[] | select(.event == "unlabeled" and .label.name == "${label}") | .created_at`,
    ],
    sleep,
  );
  const ends = String(out ?? "")
    .split("\n")
    .map((line) => Date.parse(line))
    .filter((ms) => !Number.isNaN(ms));
  return ends.length > 0 ? Math.max(...ends) : null;
}

/** The one function the workflow calls. Returns `{ dispatch: boolean, reason: string }` — never
 *  throws on a NORMAL trip (that is the expected, correct outcome, not a failure); throws only
 *  when the breaker's own machinery (config, GH queries) is itself broken, per the fail-closed
 *  doctrine above. Checks the label FIRST and returns immediately if already tripped, so a repeat
 *  tick after a trip costs one cheap label read, never a spend query. */
export function checkCircuitBreaker({
  config = loadBreakerConfig(),
  exec = defaultExec,
  sleep = sleepSync,
  now = Date.now(),
  // The dial decides which line applies (surge's, or everyone else's). Read only once a spend
  // total exists to compare — a tripped breaker still costs one label read and nothing more.
  readMode = () => readWorkMode(exec),
} = {}) {
  const { windowHours, trackingIssue, trippedLabel } = config;

  if (isBreakerTripped({ trackingIssue, trippedLabel, exec, sleep }))
    return {
      dispatch: false,
      reason: `circuit breaker already tripped on issue #${trackingIssue}`,
    };

  const spentUsd = recentResearchSpend({ windowHours, exec, sleep, now });
  const spent = `spend $${spentUsd.toFixed(2)} over ${windowHours}h`;
  const mode = readMode();
  // Under the narrower line every position agrees, so only an overspend needs the dial's real word.
  const unsure = !mode || mode.unreadable || mode.ambiguous;
  const position = mode?.position ?? "conserve";
  let maxSpendUsd = thresholdFor(position, config);
  let dial = position;
  if (spentUsd > maxSpendUsd) {
    if (unsure)
      return {
        dispatch: false,
        reason: `${spent} is over $${maxSpendUsd} and the brake could not read the dial — refusing this tick without tripping`,
      };
    if (position !== "surge") {
      let endedAt;
      try {
        endedAt = lastSurgeEnd({ mode, exec, sleep });
      } catch (err) {
        return {
          dispatch: false,
          reason: `${spent} is over $${maxSpendUsd} and the brake could not read when the last surge ended (${err.message}) — refusing this tick without tripping`,
        };
      }
      if (endedAt !== null && now - endedAt < windowHours * 3_600_000) {
        maxSpendUsd = thresholdFor("surge", config);
        dial = `${position}, a surge ended inside the window`;
      }
    }
  }
  if (spentUsd > maxSpendUsd) {
    tripBreaker({
      trackingIssue,
      trippedLabel,
      spentUsd,
      maxSpendUsd,
      windowHours,
      position: dial,
      exec,
    });
    return {
      dispatch: false,
      reason: `${spent} exceeds $${maxSpendUsd} (dial at ${dial}) — breaker tripped`,
    };
  }

  return {
    dispatch: true,
    reason: `spend $${spentUsd.toFixed(2)} of $${maxSpendUsd} over ${windowHours}h (dial at ${dial})`,
  };
}
