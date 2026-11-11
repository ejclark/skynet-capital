// START CI ON A LANE PR THE JOB TOKEN OPENED (#5936, row 3 of its call sheet). The build jobs in
// moneypenny-events.yml run this after the session ends, with the App token re-minted for the
// post-build steps (`app-token-late`):
//
//   node scripts/moneypenny/rekick-pr.mjs plan-5912
//
// WHY. An App installation token lives one hour, and claude-code-action takes it once. A build past
// the hour pushes and opens its PR with the Actions job token (the prompts say so, #5936 row 2), and
// GitHub's loop guard starts no workflow for that token's events: the PR has no check suite, `verify`
// never runs, and the arm job never fires. #5935 waited 48h for a hand, #7089 16h.
//
// THE ACT. For each open PR on the lane's branch (`plan/<n>`, `feedback/<n>`) whose head has no
// required check run and no live Actions suite (none at all, or only a ghost with no jobs), append one
// line to its body with the fresh App token. That sends `pull_request.edited`, which `pipeline.yml`
// lists in both `types:` and the arm job's `if:` — the same event `scripts/ship.sh` already fires as
// #4168's recovery path. A body edit, not a commit or a close: no branch moves under a session, and no
// `closed` event flaps `in-progress` on the board. The appended line is load-bearing: GitHub sends
// `edited` only when something changed. A healthy PR (the App token opened it, so its suite is queued
// or running) is never touched.
//
// ONCE PER HEAD. A marker naming the head goes into the appended line, so a second run on the same
// head writes nothing. SOFT ON FAILURE: a refused read or edit is a warning, never a red step — the
// audit's headless pass (headless-pr.mjs, #7112) names and nudges a check-less PR 30 minutes later.
import { isMain } from "../is-main.mjs";
import { isGhostSuite, latestRequired, REQUIRED_CHECKS } from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";

/** The hidden memory in the PR body, one per head edited for. */
export const REKICK_MARKER = /<!-- moneypenny:rekick sha=(\S+) -->/g;

/** The lane branch a build slug names, or null for a slug that is no lane build. */
export function laneBranch(slug) {
  const m = /^(feedback|plan)-(\d+)$/.exec(String(slug ?? ""));
  return m ? `${m[1]}/${m[2]}` : null;
}

/** Every head sha a marker in this body names. */
const editedHeads = (body) => [...String(body ?? "").matchAll(REKICK_MARKER)].map((m) => m[1]);

/**
 * Pure: the body edit that starts CI on this PR, or null when CI already started, cannot start, or
 * this head was already edited for.
 */
export function rekickIntent({ pr, checkRuns = [], suites = [], runUrl }) {
  if (!pr || pr.draft) return null; // verify skips drafts; promoting one is the session's job
  if (pr.mergeable_state === "dirty") return null; // no run starts on a conflicted PR; audit.mjs flags it
  if (latestRequired(checkRuns, REQUIRED_CHECKS).size) return null; // CI started
  const live = suites.some((s) => s?.app?.slug === "github-actions" && !isGhostSuite(s));
  if (live) return null; // an Actions suite that is queued, running or ran jobs: the event arrived
  const sha = pr.head?.sha;
  if (!sha || editedHeads(pr.body).includes(sha)) return null;
  const via = runUrl ? ` ([run](${runUrl}))` : "";
  const line =
    `_CI started by the lane after the build outlived its App token (#5936)${via}: this edit sends ` +
    `the event that starts \`verify\`._\n<!-- moneypenny:rekick sha=${sha} -->`;
  const body = pr.body ? `${pr.body}\n\n---\n${line}` : line;
  return { prNumber: pr.number, title: pr.title, headSha: sha, body };
}

/** The text of a failed call, for the warning line. */
const failureText = (err) => String(err?.stderr || err?.message).slice(0, 200);

/** This run's URL, when Actions set the variables that name it. */
function currentRunUrl(env = process.env) {
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: id } = env;
  return server && repo && id ? `${server}/${repo}/actions/runs/${id}` : undefined;
}

/** Read the lane's open PRs and each one's intent. Loud on failure; `rekickPr` softens it. */
function gatherIntents(branch, { rest, runUrl }) {
  const read = (path) => withRetry(() => rest(path));
  const owner = (process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital").split("/")[0];
  const head = encodeURIComponent(`${owner}:${branch}`);
  const open = ghRestAll(`pulls?state=open&head=${head}`, { read: rest });
  return open.flatMap((listed) => {
    const sha = listed.head?.sha;
    const checkRuns = read(`commits/${sha}/check-runs?per_page=100`)?.check_runs ?? [];
    const suites = read(`commits/${sha}/check-suites?per_page=100`)?.check_suites ?? [];
    const pr = read(`pulls/${listed.number}`); // the list omits mergeable_state
    return rekickIntent({ pr, checkRuns, suites, runUrl }) ?? [];
  });
}

/**
 * The post-build step: edit the body of each check-less PR on this build's branch. Returns one line
 * for the log; never throws.
 */
export function rekickPr(
  slug,
  { rest = ghRest, run = sh, log = console.log, runUrl = currentRunUrl() } = {},
) {
  const branch = laneBranch(slug);
  if (!branch) {
    const line = `· \`${slug}\` names no lane build — nothing to re-kick`;
    log(`::notice::${line}`);
    return line;
  }
  let intents;
  try {
    intents = gatherIntents(branch, { rest, runUrl });
  } catch (err) {
    log(`::warning::could not read ${branch}'s PRs to re-kick CI — ${failureText(err)}`);
    return `⚠️ could not read ${branch}'s PRs; the audit's headless pass is the net`;
  }
  if (!intents.length) {
    const line = `· no open PR on ${branch} is waiting for CI to start`;
    log(`::notice::${line}`);
    return line;
  }
  const lines = intents.map((i) => {
    try {
      run("gh", [
        "api",
        "-X",
        "PATCH",
        `repos/{owner}/{repo}/pulls/${i.prNumber}`,
        "-f",
        `body=${i.body}`,
      ]);
      return `🔁 started CI on #${i.prNumber} — \`${i.title}\` opened with no checks`;
    } catch (err) {
      log(`::warning::could not edit #${i.prNumber} to start its CI — ${failureText(err)}`);
      return `⚠️ could not start CI on #${i.prNumber}; the audit's headless pass is the net`;
    }
  });
  for (const line of lines) log(`::notice::${line}`);
  return lines.join("\n");
}

if (isMain(import.meta.url)) rekickPr(process.argv[2]);
