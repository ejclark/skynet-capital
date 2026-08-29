// THE VOCABULARY MONEYPENNY.MJS SPEAKS (formerly POSTMASTER.MJS) — split out of moneypenny.mjs (2026-08-26, the
// noExcessiveLinesPerFile split) so the label/comment vocabulary has one home shared by every lane
// (the router itself, the event lane, the shipped-issue closer, the stall auditor) — and, since a
// label is only real once GitHub has it, the code that provisions it too.
import { sh } from "./postmaster-gh.mjs";

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
  // The `/feedback` intake form applies BOTH of these — `idea` never travels alone
  // (.github/ISSUE_TEMPLATE/idea_to_explore.yml). Grey with no description is what they actually
  // are today; see the header note on why that is recorded rather than improved in passing.
  idea: { name: "idea", color: "ededed", description: "" },
  feedback: { name: "feedback", color: "ededed", description: "" },
  // GitHub's own defaults. Registering them is exactly why `managed` had to exist: this script has
  // no business rewriting labels it did not create.
  bug: { name: "bug", color: "d73a4a", description: "Something isn't working" },
  enhancement: { name: "enhancement", color: "a2eeef", description: "New feature or request" },
  // Owned by moneypenny-repair.mjs's own lane (formerly ci-medic.mjs), which applies it and therefore
  // guarantees it. Registered here so there is ONE vocabulary, not two that can drift.
  ciFailure: { name: "ci-failure", color: "b60205", description: "A run failed on main" },
};

/** The labels this file applies and therefore guarantees. The rest are registered for lookup. */
export const MANAGED_LABELS = Object.values(LABELS).filter((l) => l.managed);

/** Every label name the repo speaks — what `issue-lint` validates an issue's labels against. */
export const LABEL_NAMES = Object.values(LABELS).map((l) => l.name);

/** Appended to every issue/comment body a lane posts, so provenance is never ambiguous. */
export const FOOTER = "---\n_Generated by [Claude Code](https://claude.ai/code)_";

/**
 * Upsert every label this repo's prompts name. Until 2026-08-22 only `event-research` and
 * `stall-flagged` were ever passed to `ensureLabel`, so `curated`, `needs-info` and `next-slice`
 * were declared in LABELS and **never created** — they 404'd on the repo. A build session told to
 * end in `needs-info` therefore hit a failing `gh issue edit --add-label` and fell back to the two
 * exits that did exist: a PR, or `needs-eric`. The four-state design was two-thirds fictional.
 *
 * Cheap and idempotent, so it runs on every postmaster invocation rather than per-intent.
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
