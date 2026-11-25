// ISSUE EVENTS — the label and reopen events of many issues in one GraphQL read per BATCH issues,
// instead of one REST `issues/<n>/events` read each (#8289 slice 2).
//
// WHY. Every session draws on one 5,000/hr REST allowance, and a surge emptied it 28 minutes before
// the refill while the separate GraphQL allowance sat idle (measured 2026-11-24). `npm run
// rest:meter` counted a bare `npm run delivery:score` at 412 REST calls on 2026-11-25, 363 of them
// `issues/<n>/events`, one per issue a merged PR builds. Here those reads become one aliased GraphQL
// document per BATCH issues (1 point each), so the same run spends its list pages and ~8 points.
//
// ONLY THE EVENTS THE SCORE READS. `classify` in delivery-score.mjs looks at `labeled` events (for
// `ready`, `feedback`, `needs-info`) and `reopened` events, nothing else. The document asks for
// those two types and hands them back in the REST shape (`event`, `label.name`, `created_at`), so
// `classify` is unchanged and its specs still pin it.
//
// COVERAGE. REST's `events?per_page=100` is an issue's OLDEST hundred events of every kind. The
// filtered `first: 100` here is the oldest hundred label and reopen events, so it holds every one
// the REST page held, and more on an issue past a hundred events. The earliest `ready` label (the
// handoff) is the same either way.
//
// BACK TO REST WHEN GRAPHQL IS REFUSED. A Claude Code cloud session's proxy refuses GraphQL with a
// 403 whatever the token (docs/vendor/claude-code/cloud-environments.md → GitHub proxy). A batch
// GraphQL refuses is read one issue at a time over REST, the read delivery-score made before, with
// one stderr line saying so. Per batch, not sticky, like feedback-scan's closing-PR reads: one
// number GraphQL cannot resolve costs its own batch the saving, not the whole run. A REST failure
// still throws, so a score never prints with an issue's events silently missing.
import { graphql } from "./issues-graphql.mjs";
import { ghRest } from "./moneypenny/gh.mjs";

export const BATCH = 50;

/** One aliased document asking each issue for its oldest 100 label and reopen events. Pure. */
export function eventsQuery(numbers) {
  const fields = numbers.map(
    (n) =>
      `i${Number(n)}: issue(number: ${Number(n)}) { ` +
      "timelineItems(itemTypes: [LABELED_EVENT, REOPENED_EVENT], first: 100) { nodes { __typename " +
      "... on LabeledEvent { createdAt label { name } } ... on ReopenedEvent { createdAt } } } }",
  );
  return `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${fields.join(" ")} } }`;
}

/** One issue node's events in REST's shape (`event`, `label`, `created_at`). A missing node reads
 *  as no events; a node of any other type is dropped. Pure. */
export function eventsOf(node) {
  const out = [];
  for (const e of node?.timelineItems?.nodes ?? []) {
    if (e?.__typename === "LabeledEvent")
      out.push({ event: "labeled", label: { name: e.label?.name }, created_at: e.createdAt });
    else if (e?.__typename === "ReopenedEvent")
      out.push({ event: "reopened", created_at: e.createdAt });
  }
  return out;
}

/**
 * Every number's events, as a Map, in ceil(n / BATCH) GraphQL reads. `send` is issues-graphql.mjs's
 * `graphql` and `read` gh.mjs's `ghRest` (both injected for specs). A batch GraphQL refuses is read
 * over REST instead (see the header).
 */
export function readIssueEvents(
  numbers,
  {
    repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital",
    send = graphql,
    read = ghRest,
    log = (line) => console.error(line),
  } = {},
) {
  const [owner, name] = repo.split("/");
  const events = new Map();
  for (let i = 0; i < numbers.length; i += BATCH) {
    const batch = numbers.slice(i, i + BATCH);
    let data;
    try {
      data = send(eventsQuery(batch), { owner, name });
    } catch (err) {
      const why = String(err?.stderr || err?.message || err)
        .trim()
        .split("\n")
        .filter(Boolean)
        .pop();
      log(
        `· issue-events: GraphQL refused ${batch.length} issues' event reads (${String(why).slice(0, 120)}) — reading them over REST (#8289)`,
      );
      for (const n of batch) events.set(n, read(`issues/${n}/events?per_page=100`) ?? []);
      continue;
    }
    for (const n of batch) events.set(n, eventsOf(data?.repository?.[`i${n}`]));
  }
  return events;
}
