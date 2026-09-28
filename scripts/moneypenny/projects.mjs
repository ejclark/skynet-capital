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

import { isTransientGhError } from "./gh.mjs";

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
 * PR happens to be open against it; then an open linked PR; then ready; else it sits in Backlog.
 */
export function statusForIssue({ state = "open", labels = [], hasOpenLinkedPr = false } = {}) {
  if (state === "closed") return "Done";
  const has = (name) => labels.includes(name);
  if (has("needs-eric") || has("needs-info")) return "Blocked";
  if (hasOpenLinkedPr) return "In Progress";
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

/**
 * The board item for one issue, matched on `content.url` — unambiguous where a bare number is not
 * (a project can carry items from several repos, and a draft item has no content at all). Pure, so
 * the match rule is proven without a network call.
 */
export function findBoardItem(items = [], issueUrl) {
  if (!issueUrl) return undefined;
  return items.find((item) => item?.content?.url === issueUrl);
}

/**
 * Get the board item for an issue whether or not it is already on the board: add it, and when
 * GitHub says it is already there, read its id back out of `item-list`. IO-free itself — the two
 * `gh` calls arrive as injected functions (projects-sync.mjs supplies the real ones), which is why
 * this decision lives in the pure module with the rest of the vocabulary.
 *
 * `listItems` hands back `{items, totalCount}`. Fail-closed on both ways the lookup can come up
 * empty — a truncated page, or an item GitHub counts but `item-list` won't show (an ARCHIVED item
 * is the known case) — because a silent miss here would write Status to nothing at all.
 */
export function resolveBoardItem({ addItem, listItems, issueUrl }) {
  try {
    return { item: addItem(), added: true };
  } catch (err) {
    const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
    if (!isAlreadyOnBoardError(text)) throw err;

    const { items = [], totalCount } = listItems() ?? {};
    const item = findBoardItem(items, issueUrl);
    if (item) return { item, added: false };

    const counted = typeof totalCount === "number" ? totalCount : items.length;
    const truncated = counted > items.length;
    throw new Error(
      `GitHub says ${issueUrl} is already on the board, but it is not among the ${items.length} ` +
        `items listed (${counted} counted). ` +
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
