// WHICH ISSUES DOES A PR NAME? — #4393 slice 1. "Observe, don't remember" (the plan's settled
// fork 2): the board's Building-now column should derive from evidence a build already leaves — a
// PR that names `#n` — instead of from a label each of five build paths has to remember to apply.
// Measured 2026-10-01: three code paths apply `in-progress`, live sessions / governor / grind /
// repair apply nothing, and three half-built plans never reached the WIP lane at all. A fourth path
// that "remembers to label" repeats the gap #3960 left; reading the PR closes it for every path.
//
// Pure on purpose, like projects.mjs: the evidence rules live here, specced without a network
// call; pr-in-progress.mjs does the IO (is `#n` an open issue? does another open PR still name it?).
//
// WHAT COUNTS AS NAMING AN ISSUE, and why each rule is drawn where it is:
//   - A closing keyword anywhere (`closes #n`, `fixes: #n`, `resolved #n`) — GitHub's own link.
//   - A provenance phrase anywhere (`part of #n`, `slice of #n`, `slice 2 of #n`, `refs #n`) — this
//     repo's plan slices say "Part of #4393", which GitHub does not treat as a link at all.
//   - A bare `#n` in the TITLE (`feat(x): … (#3665 slice 3)`) — but NOT a bare `#n` in the body:
//     bodies cite related issues by the handful ("Related: #3960 · #4320"), and marking every one
//     of those in-progress would fill the column with work nobody is doing.
//   - The branch: `<prefix>/<n>-…` or `<prefix>/<n>` (`feat/4292-ci-burst-alarm`, `feedback/3970`),
//     or a trailing `-<n>` of 3+ digits (`feat/research-scorecard-4061`). The trailing rule refuses
//     a number that follows another number (`…-2026-09-30` is a date, not issue #30) and refuses
//     short tails (`…-2` is a second attempt, not issue #2).
//   - A machine-lane branch (`laneClassOf` below) contributes NO branch number: its tail is a date
//     or a run id (`research/pce-2026-09-30`, `moneypenny/screen-36803254764-1`). Its title and
//     body still count — a research PR that says "refs #n" is naming #n.
//   - Another repo's `owner/repo#n` is not ours and never counts; `ejclark/skynet-capital#n` does.
//
// Returns CANDIDATE numbers. Whether `#n` is an open issue (rather than a PR, or closed) is a
// network question and pr-in-progress.mjs answers it — "the open-issue numbers a PR names" is the
// pure half plus that filter.

export const REPO = "ejclark/skynet-capital";

// A same-repo issue reference: `#n`, or `owner/repo#n` with the owner/repo captured so a caller
// can drop another repo's reference. The lookbehind refuses `abc#1`, `&#123;` and URL fragments.
const REF = String.raw`(?<![\w&/#])(?:([\w.-]+\/[\w.-]+))?#(\d+)\b`;

const CLOSING = String.raw`\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b:?\s+`;
const PROVENANCE = String.raw`\b(?:part\s+of|slice(?:\s+\d+)?\s+of|refs?|references)\b:?\s+`;

const KEYWORD_REF = new RegExp(`(?:${CLOSING}|${PROVENANCE})${REF}`, "gi");
const BARE_REF = new RegExp(REF, "g");

// `feat/4292-ci-burst-alarm`, `feedback/3970`: the number IS the first segment after the prefix.
const BRANCH_LEADING = /^[^/]+\/(\d+)(?:[-_/]|$)/;
// `feat/research-scorecard-4061`: a 3+ digit tail not preceded by another number.
const BRANCH_TRAILING = /(?<!\d)[-_](\d{3,})$/;

/**
 * MACHINE LANES — classes of service, not cards (the plan's settled fork 1). 579 PRs merged in the
 * week to 2026-10-01 and 84% named no issue; one card each would drown the board. Each lane here
 * maps to ONE standing card (slice 5), so a lane PR is recognised by its branch prefix alone.
 */
export const LANE_CLASSES = {
  "research/": "research",
  "moneypenny/": "moneypenny",
  "dependabot/": "dependabot",
  "platter/": "platter",
  "digest/": "digest",
  "docs/digest-": "digest",
};

/** The class of service a machine lane's branch belongs to, or null for any other branch. */
export function laneClassOf(headRef) {
  const ref = String(headRef ?? "");
  for (const [prefix, lane] of Object.entries(LANE_CLASSES)) {
    if (ref.startsWith(prefix)) return lane;
  }
  return null;
}

function refsIn(text, pattern, repo) {
  const out = [];
  for (const m of String(text ?? "").matchAll(pattern)) {
    const [, otherRepo, num] = m;
    if (otherRepo && otherRepo.toLowerCase() !== repo.toLowerCase()) continue;
    const n = Number(num);
    if (n > 0) out.push(n);
  }
  return out;
}

/** The issue number a non-lane branch name carries, or null. */
export function branchIssueOf(headRef) {
  const ref = String(headRef ?? "");
  if (!ref || laneClassOf(ref)) return null;
  const lead = BRANCH_LEADING.exec(ref);
  if (lead) return Number(lead[1]);
  const tail = BRANCH_TRAILING.exec(ref);
  return tail ? Number(tail[1]) : null;
}

/**
 * Every issue number a PR names, ascending and de-duplicated. Pure: title, body and head branch in,
 * numbers out. See the header for what counts and why.
 */
export function derivePrIssues({ title = "", body = "", headRef = "", repo = REPO } = {}) {
  const found = new Set([
    ...refsIn(title, KEYWORD_REF, repo),
    ...refsIn(body, KEYWORD_REF, repo),
    ...refsIn(title, BARE_REF, repo),
  ]);
  const branch = branchIssueOf(headRef);
  if (branch) found.add(branch);
  return [...found].sort((a, b) => a - b);
}

/**
 * Does a PR leave NO trace of what it builds — names no issue and is not a machine lane's? The
 * advisory check for criterion 8 (scripts/pr-provenance-scan.mjs): such a PR is invisible to the
 * board, so the in-flight cap cannot count it. Lane PRs are exempt by class — they map to a
 * standing card, never one each.
 */
export function namesNoIssue({ title = "", body = "", headRef = "", repo = REPO } = {}) {
  return !laneClassOf(headRef) && derivePrIssues({ title, body, headRef, repo }).length === 0;
}
