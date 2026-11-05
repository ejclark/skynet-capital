#!/usr/bin/env node
// PROJECTS V2 VIEWS — idempotent, runs after projects-setup.mjs in projects-setup.yml. Creates the
// Flow (kanban), Flow by priority (kanban with priority swimlanes), Backlog (table) and Roadmap
// views; which ones and why lives beside VIEWS in projects.mjs. Needs the same GH_TOKEN as setup:
// Eric's classic PAT with `project` scope (the App token cannot see a personal-account project —
// see projects-setup.mjs's header).
//
// #6871 slice B2 — THE 2026-09-30 RUN GOT A 404 AND COULD SAY NOTHING ELSE. Its log carried
// GitHub's body, and the body was only `{"message":"Not Found"}`: the route matched (the error
// linked "create-a-view-for-a-user-owned-project"), and the path and body match GitHub's OpenAPI
// description (numeric user id; `group_by` / `vertical_group_by` are documented fields). What is
// left is the PAT's reach or the API version, so every REST call now names its version, the run
// logs which versions GitHub serves (`GET /versions`, free), and a failed view prints its status,
// GitHub's body and the body we sent — then the next view is still tried, so one refusal cannot
// hide whether the others would have worked. The run exits non-zero if any view failed.
import { sh, withRetry } from "./gh.mjs";
import { PROJECT_TITLE, viewsToCreate } from "./projects.mjs";

const OWNER = "ejclark";
const API_VERSION = "2022-11-28";
// #6871, run 41964697645 (2026-11-05): the view POST took a bare 404 again with the version header
// set, while the same PAT read the project's fields fine and `GET /versions` named a newer version,
// 2026-03-10. An endpoint added after 2022-11-28 can live only under the newer version, so a 404
// is retried once there before it is reported. Wrong if the retry 404s too: then it is the token.
const NEWER_VERSION = "2026-03-10";
const gh = (args, opts) => withRetry(() => sh("gh", args, opts));
const rest = (args, opts, version = API_VERSION) =>
  gh(["api", "-H", `X-GitHub-Api-Version: ${version}`, ...args], opts);

/** GitHub's own words from a failed `gh api` call: its stderr status line and the JSON body. */
function whyItFailed(err) {
  const status = String(err?.stderr ?? "").trim() || String(err?.message ?? "").split("\n")[0];
  const body = String(err?.stdout ?? "").trim() || "(no body)";
  return `${status} — GitHub said: ${body}`;
}

try {
  console.log(`REST API versions GitHub serves: ${gh(["api", "/versions"]).trim()}`);
} catch (err) {
  console.log(`could not read /versions (${whyItFailed(err)}) — carrying on`);
}

const userId = JSON.parse(rest([`/users/${OWNER}`])).id;

const projects = JSON.parse(gh(["project", "list", "--owner", OWNER, "--format", "json"]));
const project = (projects.projects ?? projects).find((p) => p.title === PROJECT_TITLE);
if (!project)
  throw new Error(`project "${PROJECT_TITLE}" not found — run projects-setup.mjs first`);

// REST field ids are the numeric ones the view-create body wants (GraphQL's are node ids).
const fields = JSON.parse(
  rest(["--paginate", "--slurp", `/users/${OWNER}/projectsV2/${project.number}/fields`]),
).flat();
const fieldIds = Object.fromEntries(fields.map((f) => [f.name, f.id]));
console.log(`fields: ${fields.map((f) => `${f.name}=${f.id}`).join(", ")}`);

const viewsQuery = `query($login:String!,$n:Int!){user(login:$login){projectV2(number:$n){views(first:50){nodes{name}}}}}`;
const existing = JSON.parse(
  gh([
    "api",
    "graphql",
    "-f",
    `query=${viewsQuery}`,
    "-f",
    `login=${OWNER}`,
    "-F",
    `n=${project.number}`,
  ]),
).data.user.projectV2.views.nodes.map((v) => v.name);
console.log(`existing views: ${existing.join(", ") || "(none)"}`);

const failed = [];
for (const { name, body } of viewsToCreate(existing, fieldIds)) {
  const path = `/users/${userId}/projectsV2/${project.number}/views`;
  const post = (version) =>
    rest(["-X", "POST", path, "--input", "-"], { input: JSON.stringify(body) }, version);
  let lastErr;
  for (const version of [API_VERSION, NEWER_VERSION]) {
    try {
      console.log(`created view "${name}" (API ${version}): ${post(version)}`);
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
      console.log(`view "${name}" refused under API ${version}: ${whyItFailed(err)}`);
      if (!/HTTP 404/.test(String(err?.stderr ?? ""))) break;
    }
  }
  if (lastErr) {
    failed.push(name);
    console.log(`FAILED view "${name}": POST ${path}`);
    console.log(`  body sent: ${JSON.stringify(body)}`);
  }
}
console.log(`done: ${project.url}`);
if (failed.length) {
  console.log(
    `::error title=Projects views::not created: ${failed.join(", ")} — see the lines above`,
  );
  process.exit(1);
}
