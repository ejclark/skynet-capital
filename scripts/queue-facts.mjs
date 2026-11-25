// QUEUE FACTS — when each queued issue was last marked `ready`, and which issues it blocks, for the
// whole queue in a few GraphQL reads instead of two REST reads per issue (#8289 slice 2).
//
// WHY. Every session draws on one 5,000/hr REST allowance, and a surge emptied it 28 minutes before
// the refill while the separate GraphQL allowance sat idle (measured 2026-11-24). A logging `curl`
// on PATH on 2026-11-25 counted `npm run rank` at 278 REST calls a run: the open-issue list (3 pages)
// plus `issues/<n>/events` and `issues/<n>/dependencies/blocking` for each of ~138 queued issues.
// The surge orchestrator pulls in rank order, so each read of the queue spent ~5% of the shared hour.
// Here those two per-issue reads become one aliased GraphQL document per BATCH issues: cost 1 point
// each, so the same run spends 3 REST calls and ~3 GraphQL points.
//
// NEWEST LABEL EVENTS. REST's `events?per_page=100` is the OLDEST hundred events, so an issue
// readied, parked and readied again past its hundredth event read a stale ready time. GraphQL's
// `last: 100` labeled events are the newest, which is the one the rank wants.
//
// BACK TO REST WHEN GRAPHQL IS REFUSED. A Claude Code cloud session's proxy answers this document
// with a 403 (`This GraphQL query is not enabled for this session`, docs/vendor/claude-code/
// cloud-environments.md → GitHub proxy), whatever the token, and cloud is where sessions run by
// default. GraphQL-only, `rank` exited 1 there (#8289, 2026-11-25), so the surge orchestrator lost
// its pull order to save REST calls. A failed batch now reads that batch and every later one over
// REST, the two calls an issue `rank` made before, with one stderr line saying so: CI keeps the
// saving, a cloud session gets its rank. A REST failure still throws, so a rank never prints with
// its facts missing. The REST events read is the first page, so the stale-ready caveat above
// applies there.
//
// REST READS ONLY WHAT THE LIST ROW CANNOT SAY. Over REST that was still 2 calls per queued issue,
// about 280 a run (2026-11-25: 211 issues carried a queue label), and cloud sessions are where the
// surge orchestrator reads the queue every wave. The open-issue list rank already holds says which
// facts can matter: a ready time is only used for an issue labeled `ready` (25 of 211 that day), and
// a blocking list only exists where `issue_dependencies_summary.blocking` is above 0 (11 of 211). So
// `need(n)` names the reads an issue needs and the REST path skips the rest. Measured live that day:
// 184 ranked issues took 26 reads instead of 368, in the same order as the GraphQL path. An issue
// with no row to judge from (`need` absent) still gets both reads.
import { graphql } from "./issues-graphql.mjs";
import { ghRest } from "./moneypenny/gh.mjs";

export const BATCH = 50;

/** One aliased document asking for each issue's newest labeled events and what it blocks. Pure. */
export function factsQuery(numbers) {
  const fields = numbers.map(
    (n) =>
      `i${Number(n)}: issue(number: ${Number(n)}) { number ` +
      "timelineItems(itemTypes: [LABELED_EVENT], last: 100) { nodes { ... on LabeledEvent { createdAt label { name } } } } " +
      "blocking(first: 100) { nodes { number state } } }",
  );
  return `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${fields.join(" ")} } }`;
}

/** `{ readyAt, blocks }` from one issue node: the newest `ready` label time (epoch ms, or null) and
 *  the OPEN issues it blocks. A missing node (a deleted issue) reads as no facts. Pure. */
export function factsOf(node) {
  const readyTimes = (node?.timelineItems?.nodes ?? [])
    .filter((e) => e?.label?.name === "ready")
    .map((e) => Date.parse(e.createdAt))
    .filter(Number.isFinite);
  const blocks = (node?.blocking?.nodes ?? [])
    .filter((b) => b?.state === "OPEN")
    .map((b) => b.number);
  return { readyAt: readyTimes.length ? Math.max(...readyTimes) : null, blocks };
}

/** Both reads, for an issue with no list row to judge from. */
export const NEED_ALL = Object.freeze({ ready: true, blocks: true });

/** Which REST reads one open-issue list row needs (see the header): its ready time only when it is
 *  labeled `ready`, its blocking list only when its dependency summary counts one. A row without a
 *  summary reads the list, so a missing field never hides a blocker. Pure. */
export function needOf(issue) {
  const labels = (issue?.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name));
  const blocking = issue?.issue_dependencies_summary?.blocking;
  return { ready: labels.includes("ready"), blocks: blocking == null || Number(blocking) > 0 };
}

/** One issue's facts over REST: the events read and the blocking read `rank` made per issue before
 *  #8471, each only when `need` asks for it. */
export function restFactsOf(n, read = ghRest, need = NEED_ALL) {
  const readyTimes = (need.ready ? (read(`issues/${n}/events?per_page=100`) ?? []) : [])
    .filter((e) => e?.event === "labeled" && e.label?.name === "ready")
    .map((e) => Date.parse(e.created_at))
    .filter(Number.isFinite);
  const blocks = (need.blocks ? (read(`issues/${n}/dependencies/blocking`) ?? []) : [])
    .filter((b) => b?.state !== "closed")
    .map((b) => b.number);
  return { readyAt: readyTimes.length ? Math.max(...readyTimes) : null, blocks };
}

/**
 * The facts for every number, as a Map, in ceil(n / BATCH) GraphQL reads. `send` is
 * issues-graphql.mjs's `graphql` and `read` gh.mjs's `ghRest` (both injected for specs). A batch
 * GraphQL refuses, and every batch after it, is read over REST instead (see the header), asking
 * only for the reads `need(n)` names.
 */
export function readQueueFacts(
  numbers,
  {
    repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital",
    send = graphql,
    read = ghRest,
    log = (line) => console.error(line),
    need = () => NEED_ALL,
  } = {},
) {
  const [owner, name] = repo.split("/");
  const facts = new Map();
  let overRest = false;
  for (let i = 0; i < numbers.length; i += BATCH) {
    const batch = numbers.slice(i, i + BATCH);
    if (!overRest) {
      try {
        const data = send(factsQuery(batch), { owner, name });
        for (const n of batch) facts.set(n, factsOf(data?.repository?.[`i${n}`]));
        continue;
      } catch (err) {
        overRest = true;
        const why = String(err?.message ?? err)
          .split("\n")
          .filter(Boolean)
          .pop();
        log(
          `rank: GraphQL refused the queue read (${String(why).slice(0, 120)}) — reading ${numbers.length - i} issues over REST, only the facts each one's labels and dependency summary leave open (#8289)`,
        );
      }
    }
    for (const n of batch) facts.set(n, restFactsOf(n, read, need(n) ?? NEED_ALL));
  }
  return facts;
}
