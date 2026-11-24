// THE DISCOVERY-PR SWEEP — an open `discovery/<slug>` PR that went red or conflicted, and the
// member's question it holds.
//
// WHY (#7341, found by the 2026-11-10 post-merge audit of #7211). The daily discovery lane
// (moneypenny-discovery.yml → src/domain/discovery-pass.ts) skips any ask whose `discovery/<slug>`
// branch is an open PR, and counts every open `discovery/` head against the pass's research ceiling,
// both with no age limit. That is right while the PR is moving. Once it is red or conflicted nobody
// owns it: research-pr-sweep.mjs takes `research/` heads only, red-lane-pr.mjs takes `plan/` and
// `feedback/`, and the conflict repair stops at its cap with `needs-eric` on a PR it never closes. So
// the ask sat "In line" forever, and six such PRs (two under conserve) stopped the lane taking anything.
// A 30-pass simulation found the fresh ask behind them never taken.
//
// THE ACT IS TO CLOSE IT AND DELETE THE BRANCH, the same act red-lane-pr.mjs takes for a lane PR. A
// closed PR is no longer an open head, so the next daily pass both frees the slot and takes the ask
// again. The branch goes because the research prompt opens its PR on EXACTLY `discovery/<slug>` off
// `origin/main`, and a stale remote branch of that name would reject its push. Nothing is merged; the
// commits stay on the closed PR (`pull/<n>/head`). No workflow edit: the lane's own count of open
// heads is what drops.
//
// WHY THIS IS NOT NEW SPEND. The next pass's research runs inside the same `researchPerTick` ceiling
// the work spigot already sets, so a pass can never run more sessions than it could before; the stuck
// PR was only holding a slot that ceiling already paid for.
//
// THE LOOP HAS AN END. An ask whose research goes red every time would cost one session a day for
// ever, so the closed, unmerged PRs on the same branch count the tries. Past `DISCOVERY_RETAKE_CAP`
// the PR stays open with one flag comment per head sha: a person reads why it keeps failing, and the
// one slot it holds is the price of not burning a session daily on it.
//
// 6 HOURS untouched is the window, the research sweep's floor (#5689): a healthy discovery PR merges
// on green within the hour, the session that opened it has ended by then, and the conflict repair has
// had its tries (each one comments, which moves `updated_at`, so a PR someone is on is left alone).
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";
import { redCheck } from "./red-lane-pr.mjs";

/** How long a discovery PR must sit untouched before the sweep looks at it. */
export const DISCOVERY_PR_HOURS = 6;

/** How many earlier PRs on one ask's branch may close unmerged before the sweep stops retaking it. */
export const DISCOVERY_RETAKE_CAP = 2;

/** The hidden memory on a capped PR: the head it was flagged at. */
export const DISCOVERY_FLAG_MARKER = /<!-- moneypenny:discovery-stale sha=(\S+) -->/;

/** Only the lane's own PRs: a person's discovery branch is theirs. */
const LANE_BOT = "skynet-envoy[bot]";
const DISCOVERY_BRANCH = /^discovery\/([a-z0-9][a-z0-9-]*)$/;

/** The sha the newest flag on this PR names, or null. Comments list oldest-first. */
export function lastFlagSha(comments = []) {
  for (let i = comments.length - 1; i >= 0; i -= 1) {
    const m = DISCOVERY_FLAG_MARKER.exec(comments[i]?.body ?? "");
    if (m) return m[1];
  }
  return null;
}

/** What is wrong with the PR, in one phrase for its comment. */
const whatsWrong = (c) =>
  c.red ? `\`${c.red.name}\` failed ([the check](${c.red.url}))` : "it conflicts with `main`";

/**
 * Pure: one intent per stale discovery PR. Each candidate is `{ number, title, slug, branch, hours,
 * headSha, red, conflicting, priorCloses, flaggedSha }` as `gatherDiscoveryPrs` reads it; a candidate
 * that is neither red nor conflicting is healthy and left alone.
 */
export function discoverySweepIntents(candidates = []) {
  const intents = [];
  for (const c of candidates) {
    if (!(c.red || c.conflicting)) continue;
    if (c.priorCloses < DISCOVERY_RETAKE_CAP) {
      intents.push({
        kind: "close-stale-discovery",
        prNumber: c.number,
        title: c.title,
        branch: c.branch,
        slug: c.slug,
        body: `🧹 **Closing this PR: ${whatsWrong(c)}, and nothing has moved on it for ${c.hours}h.** The session that opened it has ended, and while it stayed open the discovery lane skipped this question and counted it against each pass's research ceiling.\n\nThe next daily pass researches \`${c.slug}\` again from \`main\`. Nothing was merged; the commits stay on this PR (\`git fetch origin pull/${c.number}/head\`).\n\n${FOOTER}`,
      });
      continue;
    }
    if (c.flaggedSha === c.headSha) continue;
    intents.push({
      kind: "flag-stale-discovery",
      prNumber: c.number,
      title: c.title,
      headSha: c.headSha,
      body: `🔴 **This discovery PR is stuck: ${whatsWrong(c)}, and nothing has moved on it for ${c.hours}h.** ${c.priorCloses} earlier PRs for this question already closed unmerged, so the sweep has stopped closing and retaking it: a fourth session would most likely fail the same way.\n\nWhile it is open, the discovery lane skips \`${c.slug}\` and it holds one slot of each pass's research ceiling. Fix the check and it merges, or close the PR and delete the branch to let the lane try again. This is the only flag for this head.\n\n<!-- moneypenny:discovery-stale sha=${c.headSha} -->\n\n${FOOTER}`,
    });
  }
  return intents;
}

/**
 * Pure: the tick's intents for `audit()`. `halt` stops them all, since a close frees an ask for a
 * research session. Nothing at all when the read failed (null).
 */
export function discoverySweep(candidates, halted = false) {
  if (!candidates || halted) return [];
  return discoverySweepIntents(candidates);
}

/** The listed PR's slug, when it is this repo's own undrafted, unheld discovery PR untouched past the
 *  cutoff; null otherwise. Pure over the list row. */
function sweepableSlug(listed, cutoff) {
  const lane = DISCOVERY_BRANCH.exec(listed.head?.ref ?? "");
  if (!lane || listed.draft || listed.user?.login !== LANE_BOT) return null;
  if (listed.head?.repo?.full_name !== listed.base?.repo?.full_name) return null;
  if (Date.parse(listed.updated_at) > cutoff) return null;
  if ((listed.labels ?? []).some((l) => l.name === LABELS.holdMerge.name)) return null;
  return lane[1];
}

/**
 * Audit-mode read: every lane discovery PR untouched past the window, with what the intents need.
 * REST core only; a tick with no discovery PR that old costs the one list call, and a healthy one
 * costs two more (its mergeable state and its checks). Loud on failure, like `gatherResearchPrs`.
 */
export function gatherDiscoveryPrs(nowMs, { hours = DISCOVERY_PR_HOURS, rest = ghRest } = {}) {
  const read = (path) => withRetry(() => rest(path));
  const cutoff = nowMs - hours * 3.6e6;
  const out = [];
  for (const listed of ghRestAll("pulls?state=open", { read: rest })) {
    const slug = sweepableSlug(listed, cutoff);
    if (!slug) continue;
    const sha = listed.head.sha;
    const failed = redCheck(read(`commits/${sha}/check-runs?per_page=100`).check_runs ?? [], nowMs);
    const red = failed ? { name: failed.run.name, url: failed.run.html_url } : null;
    // `mergeable` null is still computing; the next push looks again.
    const conflicting = !red && read(`pulls/${listed.number}`).mergeable === false;
    const stale = Boolean(red || conflicting);
    const owner = listed.head.repo.full_name.split("/")[0];
    const priorCloses = stale
      ? ghRestAll(`pulls?state=closed&head=${owner}:${listed.head.ref}`, { read: rest }).filter(
          (p) => !p.merged_at,
        ).length
      : 0;
    out.push({
      number: listed.number,
      title: listed.title,
      slug,
      branch: listed.head.ref,
      hours: Math.floor((nowMs - Date.parse(listed.updated_at)) / 3.6e6),
      headSha: sha,
      red,
      conflicting,
      priorCloses,
      flaggedSha:
        stale && priorCloses >= DISCOVERY_RETAKE_CAP
          ? lastFlagSha(ghRestAll(`issues/${listed.number}/comments`, { read: rest }))
          : null,
    });
  }
  return out;
}

/**
 * `gatherDiscoveryPrs` for the audit step, soft on failure: the other checks ride the same run, and
 * a read this one cannot make costs one skipped sweep, retried on the next push.
 */
export function discoveryPrsOrNone(nowMs, { log = console.log, ...opts } = {}) {
  try {
    return gatherDiscoveryPrs(nowMs, opts);
  } catch (err) {
    log(`::warning::discovery PR sweep skipped — ${String(err.message).slice(0, 200)}`);
    return null;
  }
}

/** The close. The PR goes first: if it fails nothing changed, and the next push tries again. */
export function closeStaleDiscovery(i, { run = sh } = {}) {
  run("gh", ["pr", "close", String(i.prNumber), "--comment", i.body]);
  run("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/heads/${i.branch}`]);
  return `🧹 closed stale discovery PR #${i.prNumber} — \`${i.slug}\` goes back to the next daily pass`;
}

/** The flag: one comment, whose marker is the memory. */
export function flagStaleDiscovery(i, { run = sh } = {}) {
  run("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  return `🔴 flagged stuck discovery PR #${i.prNumber} — \`${i.title}\``;
}
