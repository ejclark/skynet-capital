// ISSUES OVER GRAPHQL — issues.mjs's writes, said as GraphQL mutations, for when the shared REST
// allowance is nearly spent (#8289 slice 1; the routing lives in scripts/rest-budget.mjs).
//
// WHY GRAPHQL. A person's tokens share one 5,000/hr REST allowance; GraphQL is a separate 5,000
// points an hour, and on 2026-11-24 it read 9 used while REST sat empty for 28 minutes of the hour.
// A mutation costs 1 point, the same as the REST write it replaces. The read that resolves ids
// costs 1 more, so a fallback write is ~2 points — cheap against an allowance that sits idle.
//
// SHAPE. issues.mjs describes every write as a REST op `{method, path, payload}` (that is what
// `followUps`, `commentWrite` and `--dry-run` already speak). `mutationFor` translates one op; the
// ids it needs (the repository, issues by number, labels by name, issues and comments by database
// id) come from `ids`, which `createIds` fills with one GraphQL read per op and a cache. What comes
// back is shaped like the REST answer (`number`, `id`, `node_id`, `html_url`, `labels`), so the
// caller prints the same row either way.
//
// The ops this covers are exactly issues.mjs's: create, PATCH an issue (title/body/labels/state),
// comment, edit a comment, add a sub-issue, add a blocked-by edge, add labels. An op it does not
// know throws rather than guessing. One read rides along, `readIssue`: every write command reads
// its issue first, so a write fallback alone still stopped at 0 REST left (#8289, 2026-11-24).
import { sh, withResponseBody } from "./moneypenny/gh.mjs";

const ISSUE_FIELDS =
  "id databaseId number title body state url labels(first: 100) { nodes { name } }";

// A read also asks for the two counts the board column reads (`boardStatus` in issues.mjs): a
// fallback `show` or `update` prints the same `[Status]` its REST read would have.
const READ_FIELDS = `${ISSUE_FIELDS} subIssuesSummary { total completed } issueDependenciesSummary { blockedBy }`;

/** A GraphQL issue node, shaped like the REST issue the caller already prints. Pure. */
export function restShape(node) {
  if (!node) return null;
  const shaped = {
    id: node.databaseId,
    node_id: node.id,
    number: node.number,
    title: node.title,
    body: node.body,
    state: String(node.state ?? "").toLowerCase(),
    html_url: node.url,
    labels: (node.labels?.nodes ?? []).map((l) => ({ name: l.name })),
  };
  if (node.subIssuesSummary) shaped.sub_issues_summary = { ...node.subIssuesSummary };
  if (node.issueDependenciesSummary)
    shaped.issue_dependencies_summary = { blocked_by: node.issueDependenciesSummary.blockedBy };
  return shaped;
}

const REASONS = { completed: "COMPLETED", not_planned: "NOT_PLANNED", duplicate: "DUPLICATE" };

/**
 * What one op needs resolved before it can be sent: issue numbers, label names, and whether the
 * repository id is needed. Database ids (a sub-issue, a blocker, a comment) are not resolvable by
 * GraphQL; the caller registers the REST objects it already holds. Pure.
 */
export function idsNeeded(op) {
  const { kind, n } = classify(op);
  const labels = op.payload?.labels ?? [];
  if (kind === "create") return { repo: true, issues: [], labels };
  if (kind === "edit" || kind === "addLabels") return { repo: false, issues: [n], labels };
  if (kind === "comment" || kind === "subIssue" || kind === "blockedBy")
    return { repo: false, issues: [n], labels: [] };
  return { repo: false, issues: [], labels: [] };
}

/** The REST writes issues.mjs makes: `[kind, method, path pattern]`. */
const ROUTES = [
  ["create", "POST", /^issues$/],
  ["edit", "PATCH", /^issues\/(\d+)$/],
  ["comment", "POST", /^issues\/(\d+)\/comments$/],
  ["editComment", "PATCH", /^issues\/comments\/(\d+)$/],
  ["subIssue", "POST", /^issues\/(\d+)\/sub_issues$/],
  ["blockedBy", "POST", /^issues\/(\d+)\/dependencies\/blocked_by$/],
  ["addLabels", "POST", /^issues\/(\d+)\/labels$/],
];

/** `{ kind, n }` for a REST op — `n` the issue (or comment) number in its path — or kind null. Pure. */
export function classify({ method, path }) {
  for (const [kind, verb, re] of ROUTES) {
    const m = verb === method ? re.exec(path) : null;
    if (m) return { kind, n: m[1] === undefined ? 0 : Number(m[1]) };
  }
  return { kind: null, n: 0 };
}

/** The PATCH of an issue: an updateIssue, then a closeIssue when it closes — one document. */
function editMutation(id, payload, labelIds) {
  const update = { id };
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.body !== undefined) update.body = payload.body;
  if (payload.labels !== undefined) update.labelIds = labelIds(payload.labels);
  if (payload.state === "open") update.state = "OPEN";
  const closing = payload.state === "closed";
  const fields = [];
  const variables = {};
  // Fields of one mutation run in order: the edit lands before the close, as REST's one PATCH did.
  if (Object.keys(update).length > 1 || !closing) {
    fields.push(`u: updateIssue(input: $u) { issue { ${ISSUE_FIELDS} } }`);
    variables.u = update;
  }
  if (closing) {
    const reason = REASONS[payload.state_reason ?? "completed"];
    if (!reason)
      throw new Error(`GraphQL fallback: unknown close reason "${payload.state_reason}"`);
    fields.push(`c: closeIssue(input: $c) { issue { ${ISSUE_FIELDS} } }`);
    variables.c = { issueId: id, stateReason: reason };
  }
  const decl = Object.keys(variables)
    .map((k) => `$${k}: ${k === "u" ? "UpdateIssueInput" : "CloseIssueInput"}!`)
    .join(", ");
  return {
    query: `mutation(${decl}) { ${fields.join(" ")} }`,
    variables,
    pick: (d) => restShape((d.c ?? d.u)?.issue),
  };
}

/** A one-input mutation: `name(input: $input) { selection }`. */
const single = (name, type, input, selection, pick) => ({
  query: `mutation($input: ${type}!) { ${name}(input: $input) { ${selection} } }`,
  variables: { input },
  pick,
});

/**
 * One REST op → `{ query, variables, pick }`, where `pick(data)` returns the REST-shaped answer.
 * `ids` answers `repo()`, `issue(number)`, `label(name)`, `issueByDb(id)`, `commentByDb(id)` with a
 * node id, throwing when it cannot. Pure given `ids`.
 */
export function mutationFor(op, ids) {
  const { payload = {} } = op;
  const { kind, n } = classify(op);
  const labelIds = (names) => names.map((name) => ids.label(name));
  const issueOut = `issue { ${ISSUE_FIELDS} }`;
  switch (kind) {
    case "create": {
      const input = { repositoryId: ids.repo(), title: payload.title, body: payload.body };
      if (payload.labels?.length) input.labelIds = labelIds(payload.labels);
      return single("createIssue", "CreateIssueInput", input, issueOut, (d) =>
        restShape(d.createIssue?.issue),
      );
    }
    case "edit":
      return editMutation(ids.issue(n), payload, labelIds);
    case "comment":
      return single(
        "addComment",
        "AddCommentInput",
        { subjectId: ids.issue(n), body: payload.body },
        "commentEdge { node { id databaseId url } }",
        (d) => commentShape(d.addComment?.commentEdge?.node),
      );
    case "editComment":
      return single(
        "updateIssueComment",
        "UpdateIssueCommentInput",
        { id: ids.commentByDb(n), body: payload.body },
        "issueComment { id databaseId url }",
        (d) => commentShape(d.updateIssueComment?.issueComment),
      );
    case "subIssue":
      return single(
        "addSubIssue",
        "AddSubIssueInput",
        { issueId: ids.issue(n), subIssueId: ids.issueByDb(payload.sub_issue_id) },
        `subIssue { ${ISSUE_FIELDS} }`,
        (d) => restShape(d.addSubIssue?.subIssue),
      );
    case "blockedBy":
      return single(
        "addBlockedBy",
        "AddBlockedByInput",
        { issueId: ids.issue(n), blockingIssueId: ids.issueByDb(payload.issue_id) },
        issueOut,
        (d) => restShape(d.addBlockedBy?.issue),
      );
    case "addLabels":
      return single(
        "addLabelsToLabelable",
        "AddLabelsToLabelableInput",
        { labelableId: ids.issue(n), labelIds: labelIds(payload.labels ?? []) },
        "clientMutationId",
        () => null,
      );
    default:
      throw new Error(`GraphQL fallback: no mutation for ${op.method} ${op.path}`);
  }
}

const commentShape = (n) => (n ? { id: n.databaseId, node_id: n.id, html_url: n.url } : null);

/**
 * The read that resolves `need` in one request: aliases `i<n>` for issues and `l<k>` for labels,
 * label names passed as variables so a name with a quote stays a name. Pure.
 */
export function resolveQuery(need, repo) {
  const [owner, name] = repo.split("/");
  const variables = { owner, name };
  const fields = [];
  if (need.repo) fields.push("id");
  for (const n of need.issues) fields.push(`i${n}: issue(number: ${Number(n)}) { id databaseId }`);
  const decl = ["$owner: String!", "$name: String!"];
  need.labels.forEach((label, k) => {
    decl.push(`$l${k}: String!`);
    variables[`l${k}`] = label;
    fields.push(`l${k}: label(name: $l${k}) { id }`);
  });
  return {
    query: `query(${decl.join(", ")}) { repository(owner: $owner, name: $name) { ${fields.join(" ")} } }`,
    variables,
  };
}

/**
 * POST one GraphQL document over curl; throws on an HTTP failure or any `errors` in the answer. An
 * HTTP failure carries GitHub's own words (`withResponseBody`): a Claude Code cloud session's proxy
 * answers every GraphQL document outside its pinned PR set with a 403 saying `This GraphQL query is
 * not enabled for this session`, and a caller deciding to go back to REST needs to read that.
 */
export function graphql(query, variables, { run = sh, token } = {}) {
  const tok = token ?? (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "");
  let out;
  try {
    out = post(run, tok, query, variables);
  } catch (err) {
    throw withResponseBody(err);
  }
  const res = JSON.parse(out || "null");
  if (res?.errors?.length)
    throw new Error(`GraphQL: ${res.errors.map((e) => e.message).join("; ")}`);
  return res?.data ?? {};
}

function post(run, tok, query, variables) {
  return run(
    "curl",
    [
      "-sS",
      "--fail-with-body",
      "-X",
      "POST",
      "-H",
      `Authorization: Bearer ${tok}`,
      "-H",
      "Content-Type: application/json",
      "-H",
      "User-Agent: skynet-issues",
      "--data-binary",
      "@-",
      "https://api.github.com/graphql",
    ],
    { input: JSON.stringify({ query, variables }) },
  );
}

/**
 * The id book for one process: what the caller registered (REST objects it already read) plus one
 * resolve read per op for anything missing. A label GraphQL cannot find is an error — REST would
 * have created it, GraphQL will not.
 */
export function createIds({ repo, send = graphql } = {}) {
  let repoId = null;
  const issues = new Map(); // number → node id
  const issuesByDb = new Map(); // database id → node id
  const labels = new Map(); // name → node id
  const comments = new Map(); // database id → node id
  const book = {
    register(obj, kind = "issue") {
      if (!obj?.node_id) return;
      if (kind === "comment") return void comments.set(Number(obj.id), obj.node_id);
      if (obj.number) issues.set(Number(obj.number), obj.node_id);
      if (obj.id) issuesByDb.set(Number(obj.id), obj.node_id);
    },
    hasComment: (id) => comments.has(Number(id)),
    /** Resolve whatever `op` needs that is not already known — at most one read. */
    prepare(op) {
      const need = idsNeeded(op);
      const missing = {
        repo: need.repo && !repoId,
        issues: need.issues.filter((n) => !issues.has(n)),
        labels: need.labels.filter((l) => !labels.has(l)),
      };
      if (!(missing.repo || missing.issues.length || missing.labels.length)) return;
      const { query, variables } = resolveQuery(missing, repo);
      const node = send(query, variables).repository ?? {};
      if (missing.repo) repoId = node.id;
      for (const n of missing.issues) {
        const hit = node[`i${n}`];
        if (hit?.id) book.register({ node_id: hit.id, number: n, id: hit.databaseId });
      }
      missing.labels.forEach((l, k) => {
        if (node[`l${k}`]?.id) labels.set(l, node[`l${k}`].id);
      });
    },
    repo: () => repoId ?? fail("the repository id"),
    issue: (n) => issues.get(Number(n)) ?? fail(`issue #${n}`),
    label: (name) =>
      labels.get(name) ?? fail(`label "${name}" (GraphQL cannot create a label; REST would have)`),
    issueByDb: (id) => issuesByDb.get(Number(id)) ?? fail(`the issue with database id ${id}`),
    commentByDb: (id) => comments.get(Number(id)) ?? fail(`comment ${id}`),
  };
  return book;
}

function fail(what) {
  throw new Error(`GraphQL fallback: could not resolve ${what}`);
}

/**
 * Read one issue through GraphQL, REST-shaped — the twin of REST's `GET issues/<n>` (measured gap,
 * 2026-11-24: `update` refused at 0 REST left with GraphQL 4,671 of 5,000 free, because its first
 * act is this read). Throws when the issue does not exist, as the REST 404 would. 1 point.
 */
export function readIssue(n, { repo, send = graphql } = {}) {
  const [owner, name] = repo.split("/");
  const query = `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { issue(number: ${Number(n)}) { ${READ_FIELDS} } } }`;
  const issue = restShape(send(query, { owner, name }).repository?.issue);
  if (!issue) throw new Error(`GraphQL: issue #${n} not found in ${repo}`);
  return issue;
}

/** Send one REST-described op as GraphQL: resolve its ids, mutate, return the REST-shaped answer. */
export function graphqlWrite(op, ids, { send = graphql } = {}) {
  ids.prepare(op);
  const { query, variables, pick } = mutationFor(op, ids);
  const out = pick(send(query, variables));
  if (out?.number) ids.register(out); // a created issue: its follow-ups name it by database id
  return out;
}
