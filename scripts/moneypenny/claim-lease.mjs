// SUPPORT FOR THE CLAIM LEASE — split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the
// noExcessiveLinesPerFile split), but only the parts that aren't pinned by source text elsewhere.
//
// `claimHandoff` and `releaseClaim` THEMSELVES STAY IN index.mjs, deliberately: they are the
// two regression tests in `tests/arch/lease-namespace.spec.ts` that read `scripts/moneypenny/index.mjs`'s
// literal source (the `ref=refs/tags/${ref}` template, `readRef("tags") ?? readRef("heads")`, the
// `for (const ns of ["tags", "heads"])` loop) — a static stand-in for the 2026-08-22 outage that a
// live `gh` call can only fail on a runner. Moving those two functions here would make that check
// pass on an empty string instead of the real lease, silently. This file holds everything the lease
// calls that carries no such pin: the TTL, the age computation, the tag stamp, and the failure
// classifier.
import { sh } from "./gh.mjs";

/**
 * ATOMIC CLAIM (Eric, 2026-08-17: "waiting for commits to a doc file — seems flimsy af"). He was
 * right, and the canary proved it: a session ran 11 minutes, spent 43k tokens, and left the repo
 * with no trace at all, because the only claim signal was a commit that had not happened yet.
 *
 * The lease fixes that with git's own atomicity: `POST /git/refs` **fails with 422 if the ref
 * already exists**, so creating `claim/<slug>` is a genuine compare-and-set — first writer wins, no
 * read-then-write race, no prose parsing. And it happens BEFORE any work, so a claim is visible in
 * seconds rather than at first commit.
 *
 * It is a LEASE, not a lock: a claim older than `staleAfterMs` is reclaimable, because a session
 * that died holding a permanent lock would wedge the work forever — which is the failure mode
 * this whole exercise exists to remove.
 *
 * (Named for its handoff-lane origin; since 2026-08-21 its only production caller is the feedback
 * lane — `claim/feedback-<n>` in moneypenny-events.yml (formerly postmaster.yml). The name stays to keep the yml call sites stable.)
 */
export const CLAIM_TTL_MS = 2 * 60 * 60 * 1000; // 2h — well past any honest build

/**
 * Why a lease create failed, in words that distinguish the two cases.
 *
 * A 422 IS the lock working — another runner won the race between our check and our create. Every
 * OTHER failure (a token without `contents: write`, a malformed sha, a ruleset refusing the ref)
 * used to be reported with that same sentence, so a lane that could never claim looked exactly
 * like a lane that was merely busy. On 2026-08-22 that cost three rounds of diagnosis on issue
 * #475 while no lease existed at all.
 */
export function claimFailureReason(err) {
  const detail = String(err?.stderr || err?.message || "")
    .trim()
    .split("\n")
    .slice(-2)
    .join(" ")
    .trim();
  // MESSAGE, not status. GitHub answers 422 for several unrelated problems — "Reference already
  // exists" (the genuine race), "Object does not exist" (a bad sha), "Reference update failed"
  // (a ruleset) — so matching the CODE re-hid everything this function exists to reveal. Caught by
  // using it: three more retriggers of #475 read as a race with no lease anywhere (2026-08-22).
  if (/already exists/i.test(detail)) return "lost the race to a concurrent claim";
  return `could not create the lease — ${detail || "no error text"}`;
}

/** Committer date of the claim's commit, for lease age. */
/**
 * When was this lease TAKEN? Not "when was the commit it points at authored" — that was the bug.
 *
 * Until 2026-08-22 the ref pointed at `GITHUB_SHA` (main's head at claim time) and the age was read
 * from that COMMIT's committer date. Two ways wrong, in opposite directions: on a quiet repo the
 * head can be hours old, so a brand-new lease is **born stale** and dedupes nothing exactly when it
 * is cheapest to have; on a busy repo a lease from a build that died five minutes ago looks fresh
 * for the full 2h, wedging the issue.
 *
 * The fix is an annotated tag object, whose `tagger.date` we set to the claim moment — the one
 * primitive git gives us for "a ref that carries its own timestamp". Legacy commit-backed refs
 * still resolve through the fallback, so existing leases age out normally rather than wedging.
 */
export function claimAgeOf(sha) {
  try {
    const tag = JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/tags/${sha}`]));
    if (tag?.tagger?.date) return tag.tagger.date;
  } catch {
    /* not a tag object — fall through to the legacy commit read */
  }
  try {
    return JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/commits/${sha}`])).commit.committer
      .date;
  } catch {
    return new Date(0).toISOString(); // unreadable → treat as ancient, i.e. reclaimable
  }
}

/** A tag object stamped with the claim moment; the ref points at this, not at the head commit. */
export function claimStamp(slug, sha, nowMs) {
  const tag = JSON.parse(
    sh("gh", [
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/git/tags",
      "-f",
      `tag=claim-${slug}-${nowMs}`,
      "-f",
      `message=lease taken ${new Date(nowMs).toISOString()}`,
      "-f",
      `object=${sha}`,
      "-f",
      "type=commit",
      "-f",
      `tagger[name]=moneypenny`,
      "-f",
      `tagger[email]=noreply@anthropic.com`,
      "-f",
      `tagger[date]=${new Date(nowMs).toISOString()}`,
    ]),
  );
  return tag.sha;
}
