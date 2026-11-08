// Collect the newsletter's inputs (#6872): every read that touches GitHub, the meter or the disk.
// build.mjs turns the result into numbers without reading anything else, so saving this object
// (`--save-inputs`) is what makes a week's newsletter reproducible later.
//
// Each source is read on its own: one that fails costs its own metric ("unavailable: …"), never
// the run. REST calls go through the meter's counted layer, so a run reports what it cost.
//
// The meter is spawned for failure-to-fix and the job scoreboard, exactly as `npm run meter --
// --failure-to-fix` and `-- --jobs` print them, so the newsletter reads what a person running the
// meter reads. The full meter is not run: it reads every lane log (about 2 minutes and 189 REST
// calls for half of W45), and only its pull_request CI split is needed, which is read directly.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defectIssues, searchIssues } from "../agent-meter/github.mjs";
import { parseRows } from "../agent-meter/jobs.mjs";
import { createRest, listRuns, REPO } from "../agent-meter/lanes.mjs";
import { CONTRACTS } from "../fitness.mjs";
import { parseLoopList } from "../loop-list-decide.mjs";
import { askRank, decisionLine } from "../moneypenny/ask-card.mjs";
import { trustedComment } from "../moneypenny/gh.mjs";
import { readCorpus, scorecard } from "../research-scorecard.mjs";
import { ciCapsules, decisionsSnapshot, labelHistory, seriesRead } from "./decision-reads.mjs";
import { journeyGaps, memberSurfacePrs, reactionIssues } from "./member-reads.mjs";
import { previousWeek, windowOf } from "./week.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const TRACKER = 4153;
/** Pages of 100 a listing may read before it stops and says it was cut short. */
const PAGE_CAP = 20;

const attempt = (read) => {
  try {
    return read();
  } catch (err) {
    return `unavailable: ${String(err.message).split("\n")[0].slice(0, 200)}`;
  }
};

/** A REST listing paged until `done(page)` or the cap; the cap throws rather than return a part. */
function pages(rest, path, done = () => false) {
  const out = [];
  for (let page = 1; page <= PAGE_CAP; page += 1) {
    const items = rest.api(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    out.push(...items);
    if (items.length < 100 || done(items)) return out;
  }
  throw new Error(`${path.split("?")[0]} ran past ${PAGE_CAP} pages`);
}

function meter(args, w) {
  const res = spawnSync(
    process.execPath,
    [
      join(ROOT, "scripts", "agent-meter.mjs"),
      ...args,
      "--json",
      "--since",
      w.since,
      "--until",
      w.until,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (res.status !== 0) throw new Error(res.stderr.trim() || `meter exited ${res.status}`);
  return JSON.parse(res.stdout);
}

function mergedPrs(rest, w) {
  return pages(
    rest,
    `repos/${REPO}/pulls?state=closed&sort=updated&direction=desc`,
    (items) => Date.parse(items.at(-1).updated_at) < w.sinceMs,
  ).map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login ?? null,
    headRef: pr.head?.ref ?? null,
    mergedAt: pr.merged_at,
  }));
}

// The repo is public, so anyone can comment, file an issue or post text shaped like a state block
// or an audit receipt. Each read below keeps only what this repo's people and bots wrote
// (trustedComment): a stranger's text must not become a public edition's numbers or lines.

export function tracker(rest, w) {
  const issue = rest.api(`repos/${REPO}/issues/${TRACKER}`);
  const comments = pages(rest, `repos/${REPO}/issues/${TRACKER}/comments?since=${w.since}`).filter(
    trustedComment,
  );
  return {
    title: issue.title,
    body: issue.body,
    comments: comments.map((c) => ({ id: c.id, createdAt: c.created_at, body: c.body })),
  };
}

/**
 * When each open `needs-eric` issue last gained the label; its filing date is not its ask's age.
 * `rank` is the assignment card's (askRank), so the oldest ask between watching and trading bots
 * can be named (#6953 slice 4).
 */
function needsEric(rest) {
  return pages(rest, `repos/${REPO}/issues?labels=needs-eric&state=open`)
    .filter((i) => !i.pull_request)
    .map((i) => {
      const events = pages(rest, `repos/${REPO}/issues/${i.number}/events`);
      const labeled = events.filter((e) => e.event === "labeled" && e.label?.name === "needs-eric");
      const rank = askRank({
        labels: i.labels,
        title: i.title,
        decision: decisionLine(i.body) ?? "",
      });
      return { number: i.number, labeledAt: labeled.at(-1)?.created_at ?? null, rank };
    });
}

export function fitnessIssues(rest) {
  return {
    contracts: CONTRACTS.map((c) => c.id),
    issues: searchIssues(rest, `"[fitness]" in:title is:issue`)
      .filter(trustedComment)
      .map((i) => ({
        number: i.number,
        title: i.title,
        createdAt: i.created_at,
        closedAt: i.closed_at,
      })),
  };
}

function loopIterations() {
  const dir = join(ROOT, "loop-iterations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .flatMap((f) => parseRows(readFileSync(join(dir, f), "utf8")).rows);
}

/** Issues closed as completed in the window that are a plan's sub-issue. */
function subIssues(rest, w) {
  return pages(
    rest,
    `repos/${REPO}/issues?state=closed&sort=updated&direction=desc&since=${w.since}`,
  )
    .filter((i) => !i.pull_request && i.parent_issue_url && i.state_reason === "completed")
    .map((i) => ({
      number: i.number,
      title: i.title,
      parent: Number(/\/issues\/(\d+)$/.exec(i.parent_issue_url)?.[1]) || null,
      closedAt: i.closed_at,
    }));
}

/** Every state block edited since the week began, with its issue's title. */
export function stateBlocks(rest, w) {
  const comments = pages(
    rest,
    `repos/${REPO}/issues/comments?sort=updated&direction=asc&since=${w.since}`,
  ).filter((c) => trustedComment(c) && /^#{1,6}[ \t]+State block\b/im.test(c.body ?? ""));
  const titles = new Map();
  return comments.map((c) => {
    const issue = Number(/\/issues\/(\d+)$/.exec(c.issue_url)?.[1]);
    if (!titles.has(issue)) titles.set(issue, rest.api(`repos/${REPO}/issues/${issue}`).title);
    return { issue, title: titles.get(issue), body: c.body };
  });
}

function previous(week) {
  const prior = previousWeek(week);
  const path = `docs/newsletters/${prior}.md`;
  return existsSync(join(ROOT, path)) ? { path, md: readFileSync(join(ROOT, path), "utf8") } : null;
}

/** Everything build.mjs reads, for `week` as of `asOfMs`. */
/** A snapshot read now (the pace title, open needs-eric) stands for a week only if it is that moment. */
const SNAPSHOT_SLACK_MS = 24 * 3600000;

export function gather(week, asOfMs, nowMs = Date.now()) {
  const w = windowOf(week, asOfMs);
  const stale = nowMs - asOfMs > SNAPSHOT_SLACK_MS;
  const snapshot = (read) =>
    stale ? `unavailable: read now, it cannot stand for ${week} as of ${w.until}` : attempt(read);
  const rest = createRest();
  const runsDir = process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs");
  const receipts = join(runsDir, "post-merge-audit.jsonl");
  const prs = attempt(() => mergedPrs(rest, w));
  const inputs = {
    week,
    asOf: new Date(asOfMs).toISOString(),
    prs,
    tracker: attempt(() => tracker(rest, w)),
    usageNow: !stale,
    localReceipts: existsSync(receipts) ? parseRows(readFileSync(receipts, "utf8")).rows : [],
    defectIssues: attempt(() =>
      defectIssues(rest, w.sinceMs)
        .filter(trustedComment)
        .map((i) => ({ created_at: i.created_at, body: i.body })),
    ),
    failureToFix: attempt(() => meter(["--failure-to-fix"], w)),
    jobs: attempt(() => meter(["--jobs"], w)),
    ciRuns: attempt(() =>
      listRuns(rest, "pipeline.yml", w.sinceMs, w.untilMs, "pull_request")
        .filter(
          (r) =>
            Date.parse(r.run_started_at) >= w.sinceMs && Date.parse(r.run_started_at) < w.untilMs,
        )
        .map((r) => ({ event: r.event, conclusion: r.conclusion })),
    ),
    needsEric: snapshot(() => needsEric(rest)),
    // Playthroughs and reactions (#7031 slice 3): the steps still expected to fail, the member-facing
    // merges, and the Revisit and in-app filings that name them.
    journeyGaps: attempt(() => journeyGaps(ROOT)),
    memberPrs: Array.isArray(prs) ? attempt(() => memberSurfacePrs(rest, prs, w)) : prs,
    memberIssues: attempt(() => reactionIssues(rest, w)),
    fitness: attempt(() => fitnessIssues(rest)),
    loopIterations: attempt(loopIterations),
    scorecard: attempt(() => scorecard({ ...readCorpus(), today: w.until.slice(0, 10) })),
    subIssues: attempt(() => subIssues(rest, w)),
    stateBlocks: attempt(() => stateBlocks(rest, w)),
    registry: attempt(() =>
      parseLoopList(readFileSync(join(ROOT, "docs", "process", "LEARNING-LOOP.md"), "utf8")),
    ),
    previous: attempt(() => previous(week)),
    // "Decisions reaching Eric" (#6953 slice 4): the asks as they stand now, the week's label
    // history, the CI capsules, the ledger as written, and the series for last week's values.
    decisions: {
      snapshot: snapshot(() => decisionsSnapshot(rest, asOfMs)),
      episodes: attempt(() => labelHistory(rest, w)),
      capsules: attempt(() => ciCapsules(rest, w)),
      ledger: attempt(() => ({
        text: readFileSync(join(ROOT, "docs", "process", "ALIGNMENT.md"), "utf8"),
      })),
      series: attempt(() => seriesRead(rest)),
    },
  };
  return { inputs, restCalls: rest.calls };
}
