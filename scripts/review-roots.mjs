// THE REVIEW ROOTS — which changed paths earn the deepest review, and which are not code at all.
//
// WHY ONE FILE. Two reviewers route a PR by its paths: the post-merge audit
// (.claude/workflows/post-merge-audit.js) after it lands, and the pre-merge reviewer
// (scripts/pr-review/triage.mjs, #6870) before. If they disagreed, a PR the audit calls deep could be
// reviewed light before merge, and the miss rate S7 measures would compare two different routings.
//
// WHY THE AUDIT KEEPS A COPY. A workflow script runs inside the Workflow tool's harness and cannot
// import, so post-merge-audit.js holds its own `DEEP_ROOTS` and `DOCS_ONLY`. That copy is the
// original; this file is the importable one. tests/scripts/review-roots.spec.ts reads both and fails
// when they differ, so widening one means widening the other in the same PR.
//
// Grown from where the audit's deep pass found what the standard pass missed (2026-10-27: every
// defect the deep tier alone caught sat under src/trading, src/storage, src/server or pipeline.yml).

/** Path prefixes where a wrong line costs money, state or access. */
export const DEEP_ROOTS = [
  "src/trading/",
  "src/options/",
  "src/risk/",
  "src/math/",
  "src/engine/",
  "src/playbooks/",
  "src/autonomous/",
  "src/bots/",
  "src/alpaca/",
  "src/storage/",
  "src/server/",
  "src/scripts/",
  "app/src/live/",
  ".github/workflows/",
  "scripts/bots-",
];

/** Prefixes that hold no code: research ledgers and digests, and proposal JSON CI already validates. */
export const DOCS_ONLY_ROOTS = ["docs/", "src/domain/market-events/proposals/"];

/** Is this path documentation only? A PR whose every path is skips review. */
export const DOCS_ONLY = (f) => DOCS_ONLY_ROOTS.some((r) => f.startsWith(r));

/** Does this path sit under a deep root? */
export const isDeepPath = (f) => DEEP_ROOTS.some((r) => f.startsWith(r));
