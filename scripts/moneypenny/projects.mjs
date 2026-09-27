// THE PROJECTS V2 VOCABULARY — one board, three views (kanban / backlog / roadmap), settled with
// Eric live in chat 2026-09-26 (#3818 slice B) once the Moneypenny GitHub App's installation was
// confirmed to carry Projects admin. Mirrors gh.mjs's split: the pure, testable decisions live
// here; the IO that actually calls `gh project ...` lives in projects-setup.mjs, which this session
// could not exercise live (GraphQL is blocked from interactive Claude Code sessions — confirmed by
// calling it directly; only a real GitHub Actions run, using the App's installation token, can).
// The first `workflow_dispatch` run of projects-setup.yml is this module's real test.

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
