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
