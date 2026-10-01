// THE PROJECTS V2 VOCABULARY — one board, three views (kanban / backlog / roadmap), settled with
// Eric live in chat 2026-09-26 (#3818 slice B) once the Moneypenny GitHub App's installation was
// confirmed to carry Projects admin. Mirrors gh.mjs's split: the pure, testable decisions live
// here; the IO that actually calls `gh project ...` lives in projects-setup.mjs. The first
// `workflow_dispatch` run of projects-setup.yml is that IO's real test.
//
// CORRECTION (2026-09-28, #3914): this header used to claim "GraphQL is blocked from interactive
// Claude Code sessions", and that is not true — `gh api graphql -f query='query{viewer{login}}'`
// answers fine from a session. What is actually blocked is narrower: the App token cannot SEE a
// personal-account project, so `gh project list --owner ejclark` exits 0 with an empty list. A
// session can therefore probe and reproduce this module's failures locally (that is how the block
// below was written); only the writes need Eric's PAT in a workflow. The stale sentence still sits
// in projects-setup.mjs, projects-backfill.mjs and projects.spec.ts — docs/IDEAS.md carries the sweep.

import { isTransientGhError, sleepSync, withRetry } from "./gh.mjs";

export const PROJECT_TITLE = "Skynet Capital — Orchestration";

// Board view: one column per Status, WIP limits set per-column in the Projects UI itself (native
// feature, no code). Order matters — it's the column order gh CLI creates the option list in.
export const STATUS_OPTIONS = ["Backlog", "Ready", "In Progress", "Blocked", "Done"];

// Every new GitHub Project ships with its own default Status field (Todo/In Progress/Done) — the
// setup script's "field already exists, skip" check meant our 5-value set was never actually
// applied on first run (#3818 slice B, logged on the plan issue 2026-09-27). Fixing an EXISTING
// field's options needs `updateProjectV2Field`, which gh CLI has no subcommand for — only a raw
// GraphQL call does this (verified against GitHub's own schema, github.com/octokit/graphql-schema,
// since `gh project field-*` and GitHub's rendered docs don't show it). That mutation REPLACES the
// whole option list when given one, so this carries color/description for every option, not just
// the new ones. Colors are cosmetic only — docs/BRAND.md's colorblind rule doesn't apply here,
// since a board column's position and name already carry the meaning, not the color.
export const STATUS_FIELD_OPTIONS = [
  { name: "Backlog", color: "GRAY", description: "" },
  { name: "Ready", color: "BLUE", description: "" },
  { name: "In Progress", color: "YELLOW", description: "" },
  { name: "Blocked", color: "RED", description: "" },
  { name: "Done", color: "GREEN", description: "" },
];

/**
 * Does an existing Status field (its current option names, in whatever order the API returned)
 * already carry our 5-value set? Order-insensitive — GitHub may not preserve the order we sent.
 * Pure so the setup script's "skip if already correct" decision is unit-tested without a network
 * call.
 */
export function statusOptionsMatch(currentNames = []) {
  const want = new Set(STATUS_OPTIONS);
  const have = new Set(currentNames);
  return want.size === have.size && [...want].every((n) => have.has(n));
}

// Backlog view: table sorted by Priority. Deliberately not derived from anything below — priority
// is Eric's judgment call, not mechanical, so nothing here ever sets it automatically.
export const PRIORITY_OPTIONS = ["P0", "P1", "P2", "P3"];

// Roadmap view: grouped by Horizon, laid out along Target date.
export const HORIZON_OPTIONS = ["Now", "Next", "Later"];

export const FIELDS = [
  { name: "Status", dataType: "SINGLE_SELECT", options: STATUS_OPTIONS },
  { name: "Priority", dataType: "SINGLE_SELECT", options: PRIORITY_OPTIONS },
  { name: "Horizon", dataType: "SINGLE_SELECT", options: HORIZON_OPTIONS },
  { name: "Target date", dataType: "DATE" },
];

/**
 * The sync rule from #3818 slice B, as one pure decision: given what's already knowable about an
 * issue from labels/state/linked PRs (never a network call itself), which Status column does it
 * belong in? Mirrors labels already in use rather than inventing a second taxonomy.
 *
 * Precedence, most authoritative first: closed always wins (an issue can't be both Done and
 * Blocked); needs-eric/needs-info next, because a blocked item should read as blocked even if a
 * PR happens to be open against it; then `in-progress` (or an open linked PR); then ready; else
 * it sits in Backlog.
 *
 * #3960 (2026-09-30): the `in-progress` label is what fills "In Progress" now. The column keyed
 * only on `hasOpenLinkedPr`, which projects-sync.mjs never passed — and live sessions auto-merge
 * within minutes, so an open PR is rarely there to see. Eric set the column's WIP limit to 3 and
 * it read 0 while ~3 stories were being built. `hasOpenLinkedPr` stays as a second way in for a
 * caller that can see one.
 */
export function statusForIssue({
  state = "open",
  labels = [],
  hasOpenLinkedPr = false,
  decisionCalloutMissing = false,
} = {}) {
  if (state === "closed") return "Done";
  const has = (name) => labels.includes(name);
  // #3913 slice 2: a `needs-eric` with no `Needs from you` callout (decision-callout.mjs) is not
  // shown as waiting on Eric — it falls through to its ordinary column until the ask is written.
  if (has("needs-info") || (has("needs-eric") && !decisionCalloutMissing)) return "Blocked";
  if (has("in-progress") || hasOpenLinkedPr) return "In Progress";
  if (has("ready")) return "Ready";
  return "Backlog";
}

// #3818 consolidation pass (2026-09-27): the board's sync job fired on every `issues` event
// unconditionally, which meant `ci-failure`-labeled issues — the recurring Moneypenny Events
// research-queue trackers, an operational log, not product backlog — were being added to the
// orchestration board alongside real work. This is the one label the board should never carry;
// unlike Status/Horizon it needs no per-issue judgment, so it lives as a mechanical predicate.
export function isBacklogCandidate({ labels = [] } = {}) {
  return !labels.includes("ci-failure");
}

// #3914 — `gh project` DESTROYS ITS OWN ERROR, and that is the whole bug this block exists for.
// Every failure of gh's owner-lookup query that isn't a plain NOT_FOUND comes back as one line,
// `unknown owner type`, with the cause thrown away. Reproduced locally on gh 2.101.0: a
// deliberately bogus GH_TOKEN makes `gh project list --owner ejclark` exit 1 with exactly that
// string, while `gh api graphql` on the same token says `Bad credentials (HTTP 401)`.
//
// So the string means "the owner lookup failed, cause withheld" — auth, a 5xx, or a rate limit —
// and never "ejclark is not a real owner": the owner is a hard-coded constant in projects-sync.mjs,
// a typo would have failed on day one, and the board's 39-issue backfill run succeeded 42 minutes
// before the sync failure that filed #3914.
export const MASKED_OWNER_FAILURE = /unknown owner type/i;

/** Is this `gh` failure text gh's masked owner-lookup failure rather than a real diagnosis? */
export function isMaskedOwnerFailure(text) {
  return MASKED_OWNER_FAILURE.test(String(text ?? ""));
}

/**
 * Retry gh's masked failure like the transient it usually is. `isTransientGhError` classifies by
 * HTTP status text — which `gh project` has already discarded — so a GraphQL 504 wearing this
 * disguise got exactly ONE attempt: the same bug docs/LESSONS.md banked on 2026-09-05, invisible to
 * the net built for it. An auth failure hides behind the same string and simply loses all three
 * attempts; ~6s of backoff is the right price for a cause we cannot read from outside.
 */
export function isRetryableProjectsGhError(text) {
  return isTransientGhError(text) || isMaskedOwnerFailure(text);
}

// #4182 — CURL SAYS "5xx" IN ITS OWN WORDS. `syncIssue`'s one REST read (`ghRest`, curl `--fail`)
// reports a GitHub 502 as `curl: (22) The requested URL returned error: 502` — reproduced against a
// local server returning 502/504/403 with curl 8.5. `isTransientGhError` matches gh's `HTTP 502`
// form, not this one, so the issue read got exactly one attempt; 12 of the 2026-09-30 backfill's 20
// failures were GitHub 5xx. Only 5xx: curl's 403/429 is a rate limit or auth, and an hourly window
// does not reopen in six seconds (see `isRateLimitExhausted`, below).
export const CURL_SERVER_ERROR = /returned error: 5\d\d\b/i;

/** Is this `ghRest` (curl) failure a GitHub-side 5xx or network blip that a second try can fix? */
export function isRetryableRestError(text) {
  return isTransientGhError(text) || CURL_SERVER_ERROR.test(String(text ?? ""));
}

// #3954 — `gh project item-add` IS NOT IDEMPOTENT, and every sync after an issue's first one
// depends on it being so. `addProjectV2ItemById` answers a second add for the same content with
// `GraphQL: Content already exists in this project`, so `sync project status` went red on `main`
// the moment a board issue (#3953) got a second `issues` event. Reproduced locally with a fake `gh`
// on PATH returning exactly that stderr: the same stack the CI log shows, down to the frame.
//
// The add is only there to LEARN THE ITEM ID, so "already exists" is success wearing an error's
// clothes — the item id is simply in `item-list` instead of the add's response. Deliberately NOT
// added to `isRetryableProjectsGhError`: retrying it repeats it three times and still fails.
export const ALREADY_ON_BOARD_FAILURE = /Content already exists in this project/i;

/** Is this `gh project item-add` failure just "the issue is already an item on this board"? */
export function isAlreadyOnBoardError(text) {
  return ALREADY_ON_BOARD_FAILURE.test(String(text ?? ""));
}

// #4183 — A BULK SWEEP PRICED BY COST, NOT BY CALL COUNT, DRAINS THE HOUR FOR EVERYTHING ELSE.
//
// `projects-setup.yml`'s backfill job ran 12:14:53Z–12:20:34Z on 2026-09-30 and called `syncIssue`
// once per open issue. Each call re-read the board's ENTIRE item list, plus the project and its
// field definitions — and GraphQL prices an `items(first: 100){ … fieldValues(first: 100) }` page
// by node count (~100 points), not as one call. Ninety-odd issues spent Eric's whole 5,000-point
// hour in under six minutes: the backfill died on its own drain, and every `sync project status`
// run behind it failed the same way until the window rolled over. #4183 is one of those, filed at
// 12:22:43Z — a repair session dispatched against a job that was an innocent bystander.
//
// This is docs/LESSONS.md's 2026-08-26 entry recurring one level up ("A burst of pushes drained the
// postmaster's own GraphQL rate limit"), and that entry's own banked side quest is half the fix:
// GitHub exposes the remaining quota for free (`ghRateLimit`), so a sweep can refuse to start
// instead of failing into it. The other half is `resolveBoardItem`'s `cachedItems` below — reading
// the per-run constants ONCE is what takes the sweep off the ceiling in the first place.
export const RATE_LIMIT_EXHAUSTED = /API rate limit (?:already )?exceeded/i;

/** Is this `gh` failure "the hourly API budget for this token is spent", rather than a code fault? */
export function isRateLimitExhausted(text) {
  return RATE_LIMIT_EXHAUSTED.test(String(text ?? ""));
}

// Deliberately NOT added to `isRetryableProjectsGhError`, for the same reason `isAlreadyOnBoardError`
// is not: the window is HOURLY and the retry ladder is six seconds, so three attempts only restate
// the same refusal three times and spend two more points doing it.

/** `reset` is epoch SECONDS. Renders it as the sentence a log reader can act on. */
function resetPhrase(reset, now) {
  if (typeof reset !== "number" || !Number.isFinite(reset)) {
    return "Re-run once GitHub's hourly GraphQL window has rolled over.";
  }
  const at = new Date(reset * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const mins = Math.max(0, Math.ceil((reset * 1000 - now) / 60_000));
  return `The budget resets at ${at} (${mins} min) — re-run after that.`;
}

/**
 * The sentence a repair session should find in the log instead of a `child_process` stack trace.
 * An exhausted quota is not a defect in this repo's code and no retry can shorten an hourly window,
 * so the only useful output is: which bucket, how much is left, when it comes back. Pure — the
 * caller supplies the free `ghRateLimit` read.
 *
 * KEEPS THE PHRASE `API rate limit exceeded` IN THE TEXT, deliberately: this replaces gh's error as
 * the message a caller further up sees, and projects-backfill.mjs decides whether to abort the whole
 * sweep by running `isRateLimitExhausted` over exactly that message. An explanation its own
 * classifier can no longer recognise would have turned the abort back into a grind. The round trip
 * is specced, not assumed.
 */
export function explainRateLimitExhausted({
  call = "a `gh project` call",
  remaining,
  reset,
  now = Date.now(),
} = {}) {
  const left = typeof remaining === "number" ? ` GitHub reports ${remaining} point(s) left.` : "";
  return (
    `${call} hit "API rate limit exceeded" — this token's hourly GraphQL budget is spent (#4183), ` +
    `which is not a code fault and not retryable: the window is hourly, the retry ladder is ` +
    `seconds.${left} ${resetPhrase(reset, now)}`
  );
}

// #4213 — "API RATE LIMIT EXCEEDED" IS TWO DIFFERENT FAILURES WEARING ONE SENTENCE.
//
// On 2026-09-30 a burst of ~29 `issues` events between 18:07:50Z and 18:09:54Z fanned out that many
// concurrent `sync project status` jobs against Eric's one PAT. The first fourteen synced; from
// 18:08:02Z every one of them died on `GraphQL: API rate limit exceeded for user ID 3472134`, eight
// red runs on `main` and a repair session dispatched for each. #4183's classifier called all of it
// "the hourly budget is spent" — and printed `GitHub reports 4998 point(s) left` in the same
// sentence, because that number came from REST's stale mirror (see `ghGraphqlBudget`).
//
// With a budget we can actually trust, the two cases separate:
//   · budget genuinely low  → an hour is gone; no ladder outwaits it. Fail loudly. (#4183, unchanged)
//   · budget clearly fine   → GitHub is throttling a BURST, not enforcing the hour. Its own guidance
//                             for that is to wait at least a minute and try again — so we do, on a
//                             minute-scale ladder, instead of turning a 60-second squeeze into a red
//                             `main` and a repair session.
//
// The floor is two `item-list` pages' worth (~100 points each by node count). Below that a single
// board read could legitimately exhaust what is left, so "plenty remains" would be a guess; at or
// above it, a refusal cannot be the hourly window and calling it one is the mistake this fixes.
export const THROTTLE_BUDGET_FLOOR = 200;

// Minute-scale on purpose: GitHub's advice for a throttled burst is to wait at least 60s, and
// `withRetry`'s six-second ladder was built for a 502. Three attempts = 60s + 120s of waiting at
// worst, on a job whose happy path is twelve seconds — cheap next to a red run someone must read.
export const THROTTLE_ATTEMPTS = 3;
export const THROTTLE_BASE_MS = 60_000;

/**
 * Which of the two failures is this refusal? `"spent"` when GitHub says the hourly budget really is
 * gone — and when it told us nothing, which keeps an unreadable budget on #4183's proven behaviour
 * rather than inventing a retry on no evidence. `"throttled"` only on a number that says otherwise.
 */
export function classifyRateLimitRefusal({ remaining, floor = THROTTLE_BUDGET_FLOOR } = {}) {
  if (typeof remaining !== "number" || !Number.isFinite(remaining)) return "spent";
  return remaining >= floor ? "throttled" : "spent";
}

/**
 * The sentence for a burst that never cleared. Deliberately keeps the phrase `API rate limit
 * exceeded`, for the same reason `explainRateLimitExhausted` does: projects-backfill.mjs decides
 * whether to abort a whole sweep by running `isRateLimitExhausted` over the message it caught, and
 * a throttle that survives three minutes should abort a sweep exactly as an empty hour does.
 */
export function explainThrottled({
  call = "a `gh project` call",
  remaining,
  attempts = THROTTLE_ATTEMPTS,
  baseMs = THROTTLE_BASE_MS,
} = {}) {
  const left = typeof remaining === "number" ? `${remaining} point(s)` : "an unknown amount";
  const waited = Math.round((baseMs * (2 ** (attempts - 1) - 1)) / 1000);
  return (
    `${call} still hit "API rate limit exceeded" after ${attempts} attempts across ${waited}s — but ` +
    `GitHub's own rateLimit reports ${left} of the hourly GraphQL budget still available, so this ` +
    `is a burst being throttled, not a spent hour (#4213). Something is fanning many concurrent ` +
    `calls at this token; look for a burst of workflow runs around this timestamp before looking ` +
    `for a bug here.`
  );
}

/**
 * THE DECISION BEHIND THE REFUSAL, with its effects injected so it is provable without a network
 * call. Reads the budget once (free), then either fails the #4183 way or rides the burst out.
 *
 * `run` has already failed once at the call site — that first failure is `firstError`, carried as
 * the `cause` so the raw gh wording survives under the explanation.
 */
export function runThroughRateLimit({
  call,
  run,
  firstError,
  readBudget,
  sleep,
  attempts = THROTTLE_ATTEMPTS,
  baseMs = THROTTLE_BASE_MS,
  now = Date.now(),
}) {
  const { graphql } = readBudget();
  const remaining = graphql?.remaining;

  if (classifyRateLimitRefusal({ remaining }) === "spent") {
    throw new Error(explainRateLimitExhausted({ call, remaining, reset: graphql?.reset, now }), {
      cause: firstError,
    });
  }

  try {
    return withRetry(run, {
      attempts,
      baseMs,
      isTransient: isRateLimitExhausted,
      ...(sleep ? { sleep } : {}),
    });
  } catch (err) {
    throw new Error(explainThrottled({ call, remaining, attempts, baseMs }), { cause: err });
  }
}

// The floor a whole-backlog sweep must clear before it starts. Once the per-run constants are read
// once instead of once per issue (`cachedItems`, below), a ~90-issue backfill costs about one
// `item-list` page (~100 points) plus a couple of points per issue for the REST read and the Status
// write — low hundreds, not thousands. 500 is that shape with headroom. Below it the honest move is
// to wait for the reset rather than start: a sweep that dies halfway leaves the board half-written
// and the log carrying one identical failure per remaining issue, which is what #4183 looked like.
export const SWEEP_MIN_GRAPHQL_POINTS = 500;

/**
 * May a whole-backlog sweep start on the budget GitHub currently reports? Returns `{ok, reason}` —
 * the reason is logged either way, so the next run's log carries the budget that was actually seen
 * rather than leaving a future session to infer it.
 *
 * A missing/garbled budget reads as GO, never as STOP: the pre-flight exists to protect a shared
 * quota, not to become a second way for the sweep to fail. If the read was wrong, the sweep's own
 * `isRateLimitExhausted` abort still catches the exhaustion on the first call that hits it.
 */
export function planBoardSweep({
  issueCount = 0,
  remaining,
  reset,
  now = Date.now(),
  minPoints = SWEEP_MIN_GRAPHQL_POINTS,
} = {}) {
  if (typeof remaining !== "number" || !Number.isFinite(remaining)) {
    return {
      ok: true,
      reason:
        "GitHub reported no graphql budget — proceeding rather than blocking on a read that failed.",
    };
  }
  if (remaining >= minPoints) {
    return {
      ok: true,
      reason: `graphql budget ${remaining} ≥ floor ${minPoints} — enough for a ${issueCount}-issue sweep.`,
    };
  }
  return {
    ok: false,
    reason:
      `Only ${remaining} graphql point(s) left, floor ${minPoints} — refusing to start a ` +
      `${issueCount}-issue sweep that would die halfway and half-write the board (#4183). ` +
      resetPhrase(reset, now),
  };
}

/**
 * The board item for one issue, matched on `content.url` — unambiguous where a bare number is not
 * (a project can carry items from several repos, and a draft item has no content at all). Pure, so
 * the match rule is proven without a network call.
 */
export function findBoardItem(items = [], issueUrl) {
  if (!issueUrl) return undefined;
  return items.find((item) => item?.content?.url === issueUrl);
}

// #3979 — THE BOARD READS STALE FOR A FEW SECONDS AFTER SOMEONE ELSE'S ADD, and the add-or-find
// above (#3954) assumed it never did. Filing an issue applies several labels in a same-second
// burst; each `labeled` add is its own `issues` event and moneypenny-events.yml's concurrency key
// carries the label name on purpose (#716), so the syncs for one issue run SIDE BY SIDE. Measured
// on #3977: three runs at 02:06:26Z, one add won, and of the two that got `Content already exists`
// two seconds later, one found the new item in `item-list` and one did not — same board, same
// second, same 60-item count. `addProjectV2ItemById` commits before the items query serving a
// sibling job catches up.
//
// So "already exists but not in the list" is a race first and a permanent state second, and the
// single read could not tell them apart. Re-reading is what separates them: a just-added item
// appears within seconds, an ARCHIVED one never does. Truncation is not a race and never re-reads.
export const BOARD_LOOKUP_ATTEMPTS = 3;
export const BOARD_LOOKUP_BASE_MS = 2000;

/**
 * Read the board for one issue's item, giving a lagging replica `attempts` tries with exponential
 * backoff between them. Returns the last page it saw either way, so the caller's fail-closed error
 * can quote real numbers. Stops early on a truncated page: a short list stays short however long
 * you wait, so re-reading it only spends six seconds restating a `--limit` bug.
 */
function readBoardUntilItemAppears({ listItems, issueUrl, attempts, baseMs, sleep }) {
  let seen = { items: [], counted: 0, truncated: false, reads: 0 };

  for (let n = 0; n < Math.max(1, attempts); n++) {
    if (n > 0) sleep(baseMs * 2 ** (n - 1));

    const page = listItems() ?? {};
    const items = page.items ?? [];
    const counted = typeof page.totalCount === "number" ? page.totalCount : items.length;
    seen = { items, counted, truncated: counted > items.length, reads: n + 1 };

    const item = findBoardItem(items, issueUrl);
    if (item) return { ...seen, item };
    if (seen.truncated) break;
  }

  return seen;
}

/**
 * Get the board item for an issue whether or not it is already on the board: add it, and when
 * GitHub says it is already there, read its id back out of `item-list`. IO-free itself — the two
 * `gh` calls arrive as injected functions (projects-sync.mjs supplies the real ones), which is why
 * this decision lives in the pure module with the rest of the vocabulary.
 *
 * `listItems` hands back `{items, totalCount}`, and is re-read with backoff while the item is
 * missing (#3979, above). Still fails closed once the re-reads are spent — a silent miss here
 * would write Status to nothing at all — naming the two states that survive a re-read: a truncated
 * page, or an item GitHub counts but `item-list` won't show (an ARCHIVED item is the known case).
 *
 * `cachedItems` is a board list the caller ALREADY HOLDS (#4183): a whole-backlog sweep reads the
 * board once and hands the same list to every issue. A hit costs nothing at all — no `item-add`
 * mutation that was only ever going to come back "already exists", and no second `item-list`. A
 * miss falls straight into the add-first path below, unchanged, so the first sync of a brand-new
 * issue still costs one mutation and no list read; and a stale cache can only produce a miss, never
 * a false hit, because the match is on `content.url` against a list GitHub really returned.
 */
export function resolveBoardItem({
  addItem,
  listItems,
  issueUrl,
  cachedItems,
  attempts = BOARD_LOOKUP_ATTEMPTS,
  baseMs = BOARD_LOOKUP_BASE_MS,
  sleep = sleepSync,
}) {
  const known = findBoardItem(cachedItems, issueUrl);
  if (known) return { item: known, added: false };

  try {
    return { item: addItem(), added: true };
  } catch (err) {
    const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
    if (!isAlreadyOnBoardError(text)) throw err;

    const { item, items, counted, truncated, reads } = readBoardUntilItemAppears({
      listItems,
      issueUrl,
      attempts,
      baseMs,
      sleep,
    });
    if (item) return { item, added: false };

    throw new Error(
      `GitHub says ${issueUrl} is already on the board, but it is not among the ${items.length} ` +
        `items listed (${counted} counted) after ${reads} read${reads === 1 ? "" : "s"}. ` +
        (truncated
          ? "The item list came back truncated — raise the --limit on item-list."
          : "An archived item reads this way: un-archive it on the board, or delete it so the " +
            "next sync can re-add it."),
      { cause: err },
    );
  }
}

/**
 * The sentence a future repair session should find in the log instead of `unknown owner type`:
 * what `gh api graphql` says about the very same credential, which is the cause gh withheld.
 * Pure — projects-sync.mjs runs the probe and hands the result here.
 */
export function explainMaskedOwnerFailure({ ok = false, text = "" } = {}) {
  const head = "`gh project` failed with `unknown owner type` — gh hiding the real cause (#3914).";
  const probe = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (ok) {
    return (
      `${head} A direct GraphQL call with the same GH_TOKEN succeeded, so the credential is ` +
      "good: a GitHub-side hiccup outlasted the retries, and re-running the job is the fix."
    );
  }
  if (/Bad credentials|HTTP 401|Resource not accessible|HTTP 403/i.test(probe)) {
    return (
      `${head} The same GH_TOKEN also fails a direct GraphQL call: "${probe}". PROJECTS_PAT ` +
      "can read REST but not Projects v2 — re-save the secret with a classic PAT carrying the " +
      "`project` scope (the stale-secret failure projects-setup.yml's header already records)."
    );
  }
  if (isTransientGhError(probe)) {
    return `${head} The same GH_TOKEN hit a GitHub-side failure too: "${probe}" — transient, re-run.`;
  }
  return `${head} A direct GraphQL probe with the same GH_TOKEN said: "${probe || "(nothing)"}".`;
}

// THE THREE VIEWS (2026-09-29). projects-setup.mjs used to end with "views are one-time UI setup"
// printed to a workflow log nobody read, so the board shipped with only GitHub's default table.
// GitHub's REST API now creates views (POST /users/{id}/projectsV2/{n}/views — layout, filter,
// group_by, vertical_group_by, sort_by), so they are provisioned here instead. The API has no
// update/delete for views, so the rule is create-if-missing by name; the default "View 1" table
// is left alone (renaming or deleting it stays a UI click).
//   Flow     — kanban: one column per Status, the work's state at a glance.
//   Backlog  — table of everything not Done, sorted by Priority.
//   Roadmap  — a dateless Now / Next / Later board: one column per Horizon, one swimlane per
//              Priority. Eric, 2026-09-29: the roadmap is a strategic time-horizon view that
//              informs priority, and nobody will maintain dates. GitHub's roadmap layout only
//              draws bars from date fields, so it was the wrong tool; a board over Horizon is the
//              classic Now/Next/Later roadmap. Target date stays on the project, unused.
export const VIEWS = [
  { name: "Flow", layout: "board", columnsBy: "Status" },
  {
    name: "Backlog",
    layout: "table",
    filter: "-status:Done",
    sortBy: "Priority",
  },
  {
    name: "Roadmap",
    layout: "board",
    columnsBy: "Horizon",
    groupBy: "Priority",
    filter: "-status:Done",
  },
];

/**
 * Which REST view-create bodies still need sending? Pure: takes the existing view names and a
 * field-name → numeric-id map, returns `{ name, body }` per missing view. Throws on a missing
 * field id so a renamed field fails loudly instead of creating an ungrouped view.
 */
export function viewsToCreate(existingNames = [], fieldIds = {}) {
  const have = new Set(existingNames);
  const id = (name) => {
    if (!(name in fieldIds)) throw new Error(`field "${name}" not found on the project`);
    return fieldIds[name];
  };
  return VIEWS.filter((v) => !have.has(v.name)).map((v) => {
    const body = { name: v.name, layout: v.layout };
    if (v.filter) body.filter = v.filter;
    if (v.columnsBy) body.vertical_group_by = [id(v.columnsBy)];
    if (v.groupBy) body.group_by = [id(v.groupBy)];
    if (v.sortBy) body.sort_by = [[id(v.sortBy), "asc"]];
    return { name: v.name, body };
  });
}
