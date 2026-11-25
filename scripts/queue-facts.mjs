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
import { graphql } from "./issues-graphql.mjs";

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

/**
 * The facts for every number, as a Map, in ceil(n / BATCH) GraphQL reads. `send` is
 * issues-graphql.mjs's `graphql` (injected for specs); it throws on any GraphQL error, so a failed
 * batch is loud, never a silently empty rank.
 */
export function readQueueFacts(
  numbers,
  { repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital", send = graphql } = {},
) {
  const [owner, name] = repo.split("/");
  const facts = new Map();
  for (let i = 0; i < numbers.length; i += BATCH) {
    const batch = numbers.slice(i, i + BATCH);
    const data = send(factsQuery(batch), { owner, name });
    for (const n of batch) facts.set(n, factsOf(data?.repository?.[`i${n}`]));
  }
  return facts;
}
