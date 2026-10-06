// THE VOCABULARY MONEYPENNY.MJS SPEAKS (formerly POSTMASTER.MJS) — split out of moneypenny.mjs (2026-08-26, the
// noExcessiveLinesPerFile split) so the label/comment vocabulary has one home shared by every lane
// (the router itself, the event lane, the shipped-issue closer, the stall auditor) — and, since a
// label is only real once GitHub has it, the code that provisions it too.
import { sh } from "./gh.mjs";

// ── labels this repo speaks ───────────────────────────────────────────────────
//
// TWO TIERS, and the flag is the whole design (#500). `managed: true` means "this lane APPLIES the
// label, so it must exist and it must look the way this file says" — those are upserted on every
// run. Everything else is *registered but not owned*: named here so a lookup, a scan, or the
// issue-lint advisory can resolve it, and deliberately never rewritten.
//
// The distinction exists because the naive version of #500 — register the missing labels, let
// `ensureVocabulary()` upsert them all — quietly makes this script the owner of GitHub's own
// defaults (`bug`, `enhancement`) and of anything Eric recolors in the UI: he changes a color,
// the next push to main silently changes it back, and nothing anywhere says why. A registry that
// exists so other code can VALIDATE against it must not also be a writer.
//
// The values below are the repo's REAL ones, read from the API, not aspirational ones. `idea` and
// `feedback` genuinely are default-grey with no description today; recording them as anything
// prettier would make this registry lie about the repo it describes, and validation built on a
// lie is worse than no validation. Upgrading those two is its own deliberate change.
export const LABELS = {
  event: {
    name: "event-research",
    color: "0e8a16",
    description: "A calendar event awaiting initial research",
    managed: true,
  },
  stall: {
    name: "stall-flagged",
    color: "d93f0b",
    description: "The stall audit pinged this once — dispatched work nothing has claimed",
    managed: true,
  },
  // #909 — a PR the audit found conflicted with `main` on some push. Applied to the PR itself
  // (`gh pr edit`, not `gh issue edit`); same one-ping-per-stall memory as `stall`.
  conflictFlagged: {
    name: "conflict-flagged",
    color: "d93f0b",
    description: "The conflict sweep pinged this once — a merge conflict on an open PR",
    managed: true,
  },
  // The feedback lane's terminal-state vocabulary. These were applied only by a build session's
  // prompt compliance, with nothing guaranteeing they existed — `gh issue edit --add-label` on a
  // missing label fails, which would silently void the lane's "never end in silence" rule.
  //
  // Three of the four outcomes below cost Eric NOTHING. That split is the point: before it,
  // `needs-eric` was the only non-PR exit, so "too big", "unclear what the member wants" and
  // "genuinely his call" all landed in one queue and buried the third in the first two.
  curated: {
    name: "curated",
    color: "0e8a16",
    description: "Written through the AI coach — its build spec is the spec; build it unattended",
    managed: true,
  },
  needsInfo: {
    name: "needs-info",
    color: "fbca04",
    description: "Waiting on the MEMBER to clarify — never on Eric",
    managed: true,
  },
  nextSlice: {
    name: "next-slice",
    color: "1d76db",
    description: "First slice shipped; the remainder is captured on the issue",
    managed: true,
  },
  needsEric: {
    name: "needs-eric",
    color: "d93f0b",
    description: "A decision only Eric can make — the irreversible class or a genuine taste fork",
    managed: true,
  },
  // #1357 — the fifth waiting-room, and deliberately NOT a fifth outcome. A Sliced build whose
  // remainder lands under `.claude/` is finished as far as this lane is concerned (`next-slice`
  // still marks it); this label only names WHO can pick the remainder up, because an unattended
  // lane structurally cannot — `.claude/` is harness-protected for it. Measured cost of having no
  // such marker: 52 idle minutes between the hand-off comment on #1352 and the build in #1356.
  //
  // Why not overload `next-slice`: it already means two things (CLAUDE.md's "depends on something
  // landing first", this file's "first slice shipped"), and only a subset of either is an
  // interactive-session item — an interactive session polling `next-slice` would wake for work it
  // cannot act on, which is the cost B exists to avoid paying.
  needsSession: {
    name: "needs-session",
    color: "0052cc",
    description:
      "The lane handed the remainder to an interactive session — nothing unattended can build it",
    managed: true,
  },
  plan: {
    name: "plan",
    color: "5319e7",
    description: "A plan issue awaiting Eric's ready-flip — not blocked on a decision",
    managed: true,
  },
  // The pipeline's `arm-auto-merge` job (added #889) can only mechanically detect one of the
  // three hold reasons `.github/prompts/interactive.md` documents — a protected path. This label
  // is the escape hatch for the other two (an explicit ask on the thread, or a taste fork worth
  // Eric's eyes): a session or Eric applies it, and the job skips arming that PR.
  holdMerge: {
    name: "hold-merge",
    color: "e99695",
    description: "Green but held — a taste call or explicit hold; arm-auto-merge skips this PR",
    managed: true,
  },
  // #3960 — the work spigot. Exactly one of these four sits on tracking issue #4153 and sets how
  // fast every autonomous lane pulls work (scripts/moneypenny/work-mode.mjs reads it). Managed, so
  // the dial exists before anyone reaches for it: a position nobody provisioned would 404 on
  // `--add-label` exactly when someone is trying to hit the brake — the 2026-08-22 defect again.
  workModeHalt: {
    name: "work-mode:halt",
    color: "000000",
    description: "Work spigot: every autonomous lane dispatches nothing (set on #4153)",
    managed: true,
  },
  workModeConserve: {
    name: "work-mode:conserve",
    color: "fbca04",
    description:
      "Work spigot: lanes cut to 1 build in flight and 2 research sessions a tick (#4153)",
    managed: true,
  },
  workModeNormal: {
    name: "work-mode:normal",
    color: "0e8a16",
    description: "Work spigot: lanes run at today's numbers, 3 builds in flight (set on #4153)",
    managed: true,
  },
  workModeSurge: {
    name: "work-mode:surge",
    color: "1d76db",
    description: "Work spigot: raised caps to use spare quota before the reset — Eric only (#4153)",
    managed: true,
  },
  // #3960 — goes on a work issue, not on #4153: an urgent bug or CVE that still builds under
  // `work-mode:conserve` (never under `halt`). Any session may apply it.
  fastTrack: {
    name: "fast-track",
    color: "b60205",
    description:
      "Urgent (a user-harming bug or CVE): builds even when the work spigot is on conserve",
    managed: true,
  },
  // #3960 (decided 2026-09-30) — THE ONE IN-FLIGHT SIGNAL. The board's building column (named
  // "In Progress" until #4393 slice 4 renamed it "Building now") could never fill: it keyed on an
  // open linked PR nobody read, and live sessions auto-merge within minutes, so an open PR is
  // rarely there to see. Every build path applies this when it starts
  // (the claim lanes in index.mjs, `/work-issues`), takes it off at its terminal state, and the
  // stall audit clears one left behind after 6h quiet. Managed: an unprovisioned label would 404 on
  // the very `--add-label` that marks work started.
  inProgress: {
    name: "in-progress",
    color: "fef2c0",
    description: "Being built right now — cleared when the build ends or after 6h with no activity",
    managed: true,
  },

  // ── registered, not owned ───────────────────────────────────────────────────
  // Real labels this repo runs on that no lane here applies. They are named so `feedback-scan`,
  // `moneypenny-repair` (formerly `ci-medic`) and the issue-lint advisory can key off one registry instead of five bare string
  // literals (#500's first EARS criterion), and so a typo'd label name is a resolvable miss rather
  // than a silent no-match. None of these is ever written back to GitHub.
  handoff: {
    name: "handoff",
    color: "5319e7",
    description: "A Claude Design bundle waiting to be built",
  },
  // #1711 — a session files this the moment a constraint is MEASURED (a rate limit hit, a WIP
  // throttle, a shared file every lane races); docs/grind/research-bottleneck.instructions.md
  // fans over the open ones. Registered so issue-lint and the grind resolve the name; nothing here
  // applies it — `/issue` (or the filing session) does, the same as `idea`/`feedback` below.
  bottleneck: {
    name: "bottleneck",
    color: "d4c5f9",
    description:
      "a measured constraint surfaced by fan-out; pursued by the research-bottleneck grind",
  },
  // The `/feedback` intake form applies BOTH of these — `idea` never travels alone
  // (.github/ISSUE_TEMPLATE/idea_to_explore.yml). Grey with no description is what they actually
  // are today; see the header note on why that is recorded rather than improved in passing.
  idea: { name: "idea", color: "ededed", description: "" },
  feedback: { name: "feedback", color: "ededed", description: "" },
  // Plan issues get it from an Eric comment (`plan-claim.mjs`'s `planReadyIntent`), feedback
  // issues from `triageFeedback` (index.mjs) or Eric directly — several writers, no single owner,
  // so registered here (not managed) purely so `workflow-lint.mjs` can resolve the name the
  // events workflow's `if:` now keys the feedback build on (#3818 consolidation, 2026-09-28).
  ready: { name: "ready", color: "ededed", description: "" },
  // Eric, 2026-09-29 (CLAUDE.md label semantics): the next step is a Claude Design session, not a
  // build or a decision. Applied by hand; registered so the lint resolves it and so it can park.
  needsDesign: {
    name: "needs-design",
    color: "D4C5F9",
    description: "The next step is a Claude Design session, not a build or a decision",
  },
  // #4064 slice 2 — priority, set by hand. Eric picked labels over the board field (2026-09-29): one
  // tap on the phone, and every lane and script can read them, which the board field is not. No lane
  // applies them; `scripts/rank.mjs` reads them, and a hand-set class always wins over its own.
  p0: {
    name: "P0",
    color: "B60205",
    description: "Pull first: unblocks another lane or removes a recurring Eric touch",
  },
  p1: {
    name: "P1",
    color: "D93F0B",
    description: "Pull soon: something is broken, or a member or Eric feels it",
  },
  p2: { name: "P2", color: "FBCA04", description: "Normal: improves a surface or a process" },
  p3: { name: "P3", color: "C5DEF5", description: "Someday: parked for later" },
  // GitHub's own defaults. Registering them is exactly why `managed` had to exist: this script has
  // no business rewriting labels it did not create.
  bug: { name: "bug", color: "d73a4a", description: "Something isn't working" },
  enhancement: { name: "enhancement", color: "a2eeef", description: "New feature or request" },
  // Owned by repair.mjs's own lane (formerly ci-medic.mjs), which applies it and therefore
  // guarantees it. Registered here so there is ONE vocabulary, not two that can drift.
  ciFailure: { name: "ci-failure", color: "b60205", description: "A run failed on main" },
  // Owned by burst-alarm.mjs (#4292): a burst of capsules with a dead repair job. Its own label, not
  // `ci-failure`, so an alarm is never counted as a capsule or dispatched to the lane it reports on.
  ciAlarm: {
    name: "ci-alarm",
    color: "5319e7",
    description: "CI failures are piling up and the repair lane is not running",
  },
};

/** The labels this file applies and therefore guarantees. The rest are registered for lookup. */
export const MANAGED_LABELS = Object.values(LABELS).filter((l) => l.managed);

/** Every label name the repo speaks — what `issue-lint` validates an issue's labels against. */
export const LABEL_NAMES = Object.values(LABELS).map((l) => l.name);

/**
 * PARKED — the labels that each say "this waits on someone", so nothing builds the issue while one
 * is on it, `ready` or not. Defined once, here, because every reader used to carry its own set
 * (the board's Blocked column knows two, `/work-issues` lists four in prose, and neither claim path
 * checks any: #3194 sat `ready` + `needs-eric` for nine days). Settled on #4056 before this code:
 * ready + parked is illegal and REPORTED, never auto-fixed, since some flips are Eric's own; ready +
 * `next-slice` is legal — it means "in progress, a remainder pending". #3818 slice 2's claim guards
 * import this rather than hard-coding a fifth copy.
 */
export const PARKING_LABELS = [
  LABELS.needsEric.name,
  LABELS.needsInfo.name,
  LABELS.needsDesign.name,
  LABELS.holdMerge.name,
];

/** Label names from either shape a caller holds: plain strings, or a payload's `[{ name }]`. */
export const labelNames = (labels = []) =>
  (labels ?? []).map((l) => (typeof l === "string" ? l : l?.name)).filter(Boolean);

/** The parking labels present on an issue (empty when it is free to build). */
export const parkedBy = (labels = []) => {
  const names = labelNames(labels);
  return PARKING_LABELS.filter((l) => names.includes(l));
};

/**
 * THE ONE BUILDABLE TEST (#3818 slice 2). Both claim paths (`claimFeedback`, `planReadyIntent`)
 * and the live burn-down (`/work-issues`'s QUEUE step) ask this, so the async lane and a live
 * session can never disagree about whether a parked issue may be built. Accepts names or `{ name }`.
 */
export const isBuildable = (labels = []) => parkedBy(labels).length === 0;

/** The one-line reason a claim path gives when it refuses a parked issue. */
export const parkedReason = (number, labels = []) =>
  `issue #${number} is parked by ${parkedBy(labels).join(", ")} — ready + parked is never built; ` +
  "clear the parking label (or the stale flip) on the issue first";

/**
 * THE ONE PULL RULE (#4393 criterion 10). An automated puller — both claim lanes, the retry sweep
 * (`nextAdmissible`) and `/work-issues` — may start an issue only when the board shows it in
 * **Ready**: open, labelled `ready`, `isBuildable`, not already `in-progress`, and not blocked by
 * an open issue (`openBlockers`). Before this,
 * each puller re-derived its own test, and `/work-issues` pulled any open `feedback`/`plan` issue,
 * Backlog included. Asked in that order, so the reason names the first rule that fails.
 *
 * Pure: accepts a REST row, an event payload's issue, or `gh issue view` JSON (state `OPEN`).
 * A missing `state` counts as open — the same reading the claim lanes already gave it.
 *
 * @returns {string | null} why the issue may not be pulled, or null when it may
 */
export function notPullableReason(issue) {
  if (!issue) return "no issue to pull";
  const n = issue.number;
  if (issue.state && String(issue.state).toLowerCase() !== "open") return `#${n} is not open`;
  const names = labelNames(issue.labels);
  if (!names.includes(LABELS.ready.name)) {
    return `#${n} does not carry \`ready\` — the board shows it in Backlog, not Ready`;
  }
  if (!isBuildable(issue.labels)) return parkedReason(n, issue.labels);
  if (names.includes(LABELS.inProgress.name)) {
    return `#${n} is already \`in-progress\` — another session or lane is building it`;
  }
  const blockers = openBlockers(issue);
  if (blockers > 0) {
    return `#${n} is blocked by ${blockers} open issue${blockers === 1 ? "" : "s"} — it starts when they close`;
  }
  return null;
}

/**
 * OPEN `blocked-by` LINKS ON THE ISSUE ITSELF (2026-10-05). A slice filed as a sub-issue can carry
 * `ready` ahead of time ("ready once slice 1 holds", #4301) with GitHub's dependency link doing the
 * waiting. Only the continuation branch read those links (`nextSubIssue`); rank order did not, so
 * once #4664 stepped past the parent plan the sweep dispatched #4301 itself while #4299 was open.
 * REST rows and webhook payloads both carry `issue_dependencies_summary`, whose `blocked_by` counts
 * OPEN blockers only (`total_blocked_by` counts all). A shape without it (`gh issue view` JSON)
 * reads as 0 — the same unknown-is-unblocked reading the rule gave before this check existed.
 */
const openBlockers = (issue) => Number(issue?.issue_dependencies_summary?.blocked_by) || 0;

/** Is this issue in the board's Ready column — may an automated puller start it? (#4393) */
export const pullable = (issue) => notPullableReason(issue) === null;

/**
 * Which issue a claim-lease slug names — `feedback-1234` / `plan-1234` → 1234, anything else →
 * null. The release paths (`--release <slug>`, the `release-claim` dispatch) only carry the slug,
 * and they are the ones that must take `in-progress` back off (#3960).
 */
export function issueNumberFromSlug(slug) {
  const m = /^(?:feedback|plan)-(\d+)$/.exec(String(slug ?? ""));
  return m ? Number(m[1]) : null;
}

/**
 * Put `in-progress` on (`add: true`) or take it off an issue (#3960). BEST-EFFORT on purpose: the
 * label is how the board SHOWS a build, never what makes the build safe (the lease does that), so a
 * failed write warns and returns false rather than killing a claim that already won. Removing a
 * label an issue does not carry is a harmless no-op.
 */
export function setInProgress(number, add) {
  if (!number) return false;
  const flag = add ? "--add-label" : "--remove-label";
  try {
    sh("gh", ["issue", "edit", String(number), flag, LABELS.inProgress.name]);
    return true;
  } catch (err) {
    const verb = add ? "apply" : "remove";
    console.log(
      `::warning::could not ${verb} \`${LABELS.inProgress.name}\` on #${number}: ${String(err?.stderr || err?.message).slice(0, 200)}`,
    );
    return false;
  }
}

/** The hand-set priority labels, highest first — what `scripts/rank.mjs` reads (#4064). */
export const PRIORITY_LABELS = [LABELS.p0.name, LABELS.p1.name, LABELS.p2.name, LABELS.p3.name];

/** Appended to every issue/comment body a lane posts, so provenance is never ambiguous. */
export const FOOTER = "---\n_Generated by [Claude Code](https://claude.ai/code)_";

/**
 * Upsert every label this repo's prompts name. Until 2026-08-22 only `event-research` and
 * `stall-flagged` were ever passed to `ensureLabel`, so `curated`, `needs-info` and `next-slice`
 * were declared in LABELS and **never created** — they 404'd on the repo. A build session told to
 * end in `needs-info` therefore hit a failing `gh issue edit --add-label` and fell back to the two
 * exits that did exist: a PR, or `needs-eric`. The four-state design was two-thirds fictional.
 *
 * Cheap and idempotent, so it runs on every Moneypenny invocation rather than per-intent.
 *
 * Walks `MANAGED_LABELS`, NOT the whole registry — #500 added six labels this lane reads but never
 * applies, and upserting those would have made this function the silent owner of `bug`,
 * `enhancement` and every color Eric picks in the UI. See the LABELS header.
 */
export function ensureVocabulary() {
  for (const label of MANAGED_LABELS) ensureLabel(label);
}

export function ensureLabel(label) {
  // GitHub auto-creates a label the first time it is applied, but as default grey with no
  // description. Upsert so the repo self-provisions and nobody has to know it needed doing.
  // Only the three fields the API takes — `managed` is this file's bookkeeping, not GitHub's.
  const body = JSON.stringify({
    name: label.name,
    color: label.color,
    description: label.description,
  });
  const base = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/labels`;
  const auth = [
    "-H",
    `Authorization: Bearer ${process.env.GH_TOKEN ?? ""}`,
    "-H",
    "Accept: application/vnd.github+json",
  ];
  try {
    // --fail is load-bearing: without it curl exits 0 on a 404 body (the label doesn't exist
    // yet), the PATCH "succeeds," and the POST-create fallback below never runs — the label is
    // silently never created (docs/LESSONS.md 2026-08-19, the missing `stall-flagged` label).
    sh("curl", ["-sS", "--fail", "-X", "PATCH", ...auth, `${base}/${label.name}`, "-d", body]);
  } catch {
    try {
      sh("curl", ["-sS", "--fail", "-X", "POST", ...auth, base, "-d", body]);
    } catch {
      /* a label that already exists is a harmless 422 */
    }
  }
}
