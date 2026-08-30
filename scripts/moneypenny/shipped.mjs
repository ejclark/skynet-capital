// THE LAST MILE — closing feedback and event-research issues whose work has already merged. Split
// out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { ghRest } from "./gh.mjs";
import { FOOTER } from "./labels.mjs";

/**
 * THE LAST MILE. An issue whose work has MERGED but which is still open.
 *
 * GitHub is supposed to close it: PR #448 carried `Closes #447` on line 1 and merged to the default
 * branch. #447 is still open, and so is #449 (via #452). Both of those PRs were authored AND merged
 * by `github-actions[bot]`; the two that did close were merged by a human. That is the same
 * GITHUB_TOKEN-actor suppression class this file's header documents twice already, and the standing
 * doctrine from it is: never depend on an event firing.
 *
 * So this does not depend on one. Every push to main is Moneypenny's tick, so the sweep can
 * simply look at which labelled issues have a merged PR and are no longer open, and close them
 * itself. Pure: the caller supplies the joined lists — originally `feedback` only; `event-research`
 * joined 2026-08-28 once the same silent-miss class turned up there too (#510/#706/#707/#720).
 */
export function routeShipped(deps = {}) {
  const { shippedFeedback = [], shippedEvents = [] } = deps;
  return [...shippedFeedback, ...shippedEvents].map((f) => ({
    kind: "close-shipped",
    issueNumber: f.number,
    title: f.title,
    pr: f.pr,
    body: `🚀 **Shipped** — this landed in #${f.pr} and is live.\n\nClosing the loop explicitly: GitHub's own \`Closes #\` link does not fire reliably for PRs a bot both opens and merges (it silently missed #447 and #449), so Moneypenny closes these itself rather than depending on an event.\n\n${FOOTER}`,
  }));
}

/**
 * WHICH REFERENCE IS THE MERGED PR — and why this needed its own function.
 *
 * `gh issue list --json closedByPullRequestsReferences` returns, per reference, exactly
 * `{ id, number, repository, url }`. **There is no state key.** The sweep filtered
 * `refs.find((p) => p.state === "MERGED")`, which evaluates `undefined === "MERGED"` for every
 * reference `gh` has ever handed back — so `close-shipped` could not fire for any issue, ever.
 * It was dead by construction from the day it was written, and silent because "no shipped
 * feedback" is also the correct answer on the overwhelming majority of pushes (2026-08-22, #475:
 * `· nothing to do` on two separate runs while the PR side plainly showed #492 MERGED).
 *
 * The merged state therefore has to be READ, not filtered — hence the injected predicate, which
 * keeps this half pure and fixture-drivable. A reference that carries its own state is still
 * honoured first, so a future `gh` that returns one costs us zero extra calls.
 *
 * @param refs      closing references as `gh` returns them
 * @param isMerged  (ref) => boolean — the impure lookup, injected
 */
export function mergedReference(refs = [], isMerged = () => false) {
  for (const r of refs ?? []) {
    if (r?.number == null) continue;
    if (r.state ? String(r.state).toUpperCase() === "MERGED" : isMerged(r)) return r.number;
  }
  return undefined;
}

/**
 * Join the list query to the per-issue re-check, and be LOUD when the two disagree.
 *
 * The re-check is a FALLBACK, never the default path: it runs only for an issue the list query
 * showed no merged reference for, so a quiet repo pays nothing and the one case that matters —
 * "the queue looks empty" — is the case that gets a second look. That ordering is the whole lesson
 * of #475: an under-reporting query and an empty queue printed the same sentence.
 *
 * Pure, given its three injected dependencies, so every branch is fixture-drivable.
 *
 * @param issues  `[{ number, title, closedByPullRequestsReferences }]` from the list query
 * @param deps    { isMerged, recheckRefs, warn }
 */
export function resolveShipped(issues = [], deps = {}) {
  const silent = () => {
    /* a caller that does not care where the warning goes */
  };
  const { isMerged = () => false, recheckRefs = () => [], warn = silent } = deps;
  const shipped = [];
  for (const issue of issues ?? []) {
    const listed = issue?.closedByPullRequestsReferences ?? [];
    let pr = mergedReference(listed, isMerged);
    if (pr === undefined) {
      const rechecked = recheckRefs(issue?.number) ?? [];
      pr = mergedReference(rechecked, isMerged);
      if (pr !== undefined) {
        warn(
          `#${issue?.number}: the list query showed no merged PR, but the per-issue re-check found #${pr} — the list query is under-reporting`,
        );
      }
    }
    if (pr !== undefined) shipped.push({ number: issue.number, title: issue.title, pr });
  }
  return shipped;
}

/**
 * Is this closing reference a MERGED PR? The read `gh issue list` cannot do for us (see
 * `mergedReference`). Addressed by URL when there is one, so a PR in another repo is asked about
 * in its own repo rather than mistaken for a local number.
 *
 * Memoised per run: one issue can reference the same PR twice, and the sweep rides every push.
 *
 * NOT fail-closed, unlike everything else in `gatherDeps`, and deliberately: a reference we cannot
 * read (a deleted PR, an inaccessible fork) would otherwise wedge EVERY push sweep — the event lane
 * and the stall audit included — over one dangling link. It degrades to "not merged" instead, but
 * loudly: a `::warning::` annotation on the run, which is the opposite of the silence #475 died of.
 */
const prMergedCache = new Map();
export function prIsMerged(ref) {
  const target = ref?.url ?? String(ref?.number ?? "");
  if (!target) return false;
  if (!prMergedCache.has(target)) {
    let merged = false;
    try {
      // REST, not `gh pr view --json` (2026-08-26). This runs once PER REFERENCED PR on every
      // push, and `gh … --json` compiles to GraphQL — the scarce bucket. `merged` is a plain
      // boolean here, where GraphQL returned a "MERGED" state string.
      merged = Boolean(ghRest(prPath(ref)).merged);
    } catch (err) {
      const detail = String(err.stderr || err.message)
        .trim()
        .slice(0, 200);
      console.log(`::warning::shipped sweep — could not read the state of ${target}: ${detail}`);
    }
    prMergedCache.set(target, merged);
  }
  return prMergedCache.get(target);
}

/** A reference is either a bare number in THIS repo, or a full API/HTML url in any repo — the
 *  cross-repo case `prIsMerged`'s own doc warns about. Both reduce to one REST pulls path. */
function prPath(ref) {
  const url = String(ref?.url ?? "");
  const cross =
    url.match(/repos\/([^/]+)\/([^/]+)\/pulls?\/(\d+)/) ??
    url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (cross) return `https://api.github.com/repos/${cross[1]}/${cross[2]}/pulls/${cross[3]}`;
  return `pulls/${Number(ref?.number)}`;
}
