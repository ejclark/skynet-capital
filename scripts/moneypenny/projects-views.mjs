#!/usr/bin/env node
// PROJECTS V2 VIEWS — idempotent, runs after projects-setup.mjs in projects-setup.yml. Creates the
// Flow (kanban), Backlog (table) and Horizons (roadmap) views; which ones and why lives beside
// VIEWS in projects.mjs. Needs the same GH_TOKEN as setup: Eric's classic PAT with `project` scope
// (the App token cannot see a personal-account project — see projects-setup.mjs's header).
import { sh, withRetry } from "./gh.mjs";
import { PROJECT_TITLE, viewsToCreate } from "./projects.mjs";

const OWNER = "ejclark";
const gh = (args, opts) => withRetry(() => sh("gh", args, opts));

const userId = JSON.parse(gh(["api", `/users/${OWNER}`])).id;

const projects = JSON.parse(gh(["project", "list", "--owner", OWNER, "--format", "json"]));
const project = (projects.projects ?? projects).find((p) => p.title === PROJECT_TITLE);
if (!project)
  throw new Error(`project "${PROJECT_TITLE}" not found — run projects-setup.mjs first`);

// REST field ids are the numeric ones the view-create body wants (GraphQL's are node ids).
const fields = JSON.parse(
  gh(["api", "--paginate", "--slurp", `/users/${OWNER}/projectsV2/${project.number}/fields`]),
).flat();
const fieldIds = Object.fromEntries(fields.map((f) => [f.name, f.id]));

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

for (const { name, body } of viewsToCreate(existing, fieldIds)) {
  const out = gh(
    ["api", "-X", "POST", `/users/${userId}/projectsV2/${project.number}/views`, "--input", "-"],
    { input: JSON.stringify(body) },
  );
  console.log(`created view "${name}": ${out}`);
}
console.log(`done: ${project.url}`);
