// UNSEEN ASKS — #6953 slice 4. Asks that are real but that no list shows him.
//
// The digest's Needs-you list is `plan().needsYou` (assignments.mjs), and that selector only sees an
// ask written the way it reads: a `needs-eric` label AND a `Needs from you` callout in the issue
// body, or a held PR. The 2026-11-06 map found 9 asks it could not see, plus 2 platter branches,
// in four shapes, and those four are what this scan names:
//
//   no-callout      `needs-eric` with no callout in the body: nothing says what the decision is,
//                   so it is never assigned (the honest queue's "clear candidate").
//   comment-only    a `Needs from you` callout that lives only in a comment (#6771's sat in its
//                   11-03 comment): `decisionLine` reads the body, so the digest cannot see it.
//   protected-pr    an open PR touching an envelope-protected path with neither `hold-merge` nor
//                   auto-merge armed (#6768, a dependabot bump of 3 workflow files): the pipeline
//                   never arms it, criterion 4 never sees it (not held), so it waits on no one.
//   platter-branch  a `platter/*` branch with no PR (`platter/night-chain-end-build`, 10-10): a
//                   boarded item nobody can merge because there is nothing to click.
//
// A LINE, NOT A NEEDS-YOU ITEM. Each of these is fixed by a session moving the ask to where the
// lists can read it (the callout into the body, the PR held, the branch opened or deleted), not by
// his answer, so the digest prints them as one "unseen" line under Needs you and lists each.
//
// Reads are bounded: the open `needs-eric` list and open PRs (both usually handed in from the
// assignment gather, so free), one search for callouts in comments (10 hits on 2026-11-07), a
// comment list per hit whose body has no callout, a file list per open PR with neither hold nor
// auto-merge, and one PR lookup per `platter/*` branch with no open PR.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import { calloutLines, decisionLine } from "./ask-card.mjs";
import { NEEDS_ERIC } from "./decision-callout.mjs";
import { ghRest, ghRestAll, trustedComment } from "./gh.mjs";

export const HOLD_MERGE = "hold-merge";
export const PLATTER_PREFIX = "platter/";
/** The search that finds callouts in comments; past one page it says so instead of guessing. */
const SEARCH_CAP = 100;

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const open = (x) => (x.state ?? "open") === "open";
const hasCallout = (body) => decisionLine(body ?? "") !== null;

/**
 * Every unseen ask, one row each, the most specific case winning when two apply (a `needs-eric`
 * issue whose callout is in a comment is `comment-only`, since moving the callout is the fix). Pure.
 *
 * @param {object} input
 * @param {object[]} [input.issues] open issues carrying `needs-eric` (REST shapes)
 * @param {{number: number, title?: string, url?: string}[]} [input.commentCallouts] issues whose
 *   callout is in a trusted comment and not in the body
 * @param {{number: number, title?: string, labels?: unknown[], auto_merge?: unknown,
 *   draft?: boolean, files?: string[]}[]} [input.prs] open PRs; `files` only where read
 * @param {{branch: string, prs: number}[]} [input.platters] each `platter/*` branch and its PR count
 * @param {(path: string) => boolean} [input.isProtected]
 */
export function unseenAsks({
  issues = [],
  commentCallouts = [],
  prs = [],
  platters = [],
  isProtected = () => false,
} = {}) {
  const rows = [];
  const seen = new Set();
  const add = (row) => {
    if (row.number !== undefined && seen.has(row.number)) return;
    if (row.number !== undefined) seen.add(row.number);
    rows.push(row);
  };
  for (const c of commentCallouts)
    add({
      case: "comment-only",
      number: c.number,
      title: c.title ?? "",
      why: "its Needs-from-you callout is only in a comment",
    });
  for (const i of issues) {
    if (!(open(i) && names(i.labels).includes(NEEDS_ERIC)) || hasCallout(i.body)) continue;
    add({
      case: "no-callout",
      number: i.number,
      title: i.title ?? "",
      why: "needs-eric with no callout in the body",
    });
  }
  for (const pr of prs) {
    if (!open(pr) || pr.auto_merge || names(pr.labels).includes(HOLD_MERGE)) continue;
    const hit = (pr.files ?? []).find(isProtected);
    if (!hit) continue;
    add({
      case: "protected-pr",
      number: pr.number,
      title: pr.title ?? "",
      why: `touches protected \`${hit}\` with neither hold-merge nor auto-merge`,
    });
  }
  for (const p of platters) {
    if (p.prs > 0) continue;
    add({ case: "platter-branch", branch: p.branch, why: "a platter branch with no PR" });
  }
  return rows;
}

/** The digest's "unseen" line. `null` means the scan could not read, said as unknown. Pure. */
export function unseenLine(rows, unknown = null) {
  if (rows === null) return `- Unseen: unknown — ${unknown ?? "the scan could not read GitHub"}.`;
  if (!rows.length) return "- Unseen: every open ask is on a list.";
  const items = rows.map((r) => `${r.number ? `#${r.number}` : `\`${r.branch}\``} ${r.why}`);
  const n = rows.length;
  return `- Unseen: ${n} ask${n === 1 ? "" : "s"} no list shows you — ${items.join("; ")}.`;
}

/** `envelope.json`'s test, read once. */
export function protectedTest(root = process.cwd()) {
  const rules = JSON.parse(readFileSync(`${root}/envelope.json`, "utf8")).protected ?? [];
  return (path) => breachOf(path, rules) !== null;
}

/**
 * The live reads. `issues` and `prs` may be handed in from the assignment gather (same REST
 * shapes), which saves both listings. Injectable for specs: `rest` lists, `read` reads one object.
 */
export function gatherUnseen({
  rest = ghRestAll,
  read = ghRest,
  repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital",
  issues,
  prs,
  isProtected = protectedTest(),
} = {}) {
  const asked = issues ?? rest(`issues?state=open&labels=${NEEDS_ERIC}`);
  const openPrs = prs ?? rest("pulls?state=open");

  const q = encodeURIComponent(`repo:${repo} is:open "Needs from you" in:comments`);
  const found = read(`https://api.github.com/search/issues?q=${q}&per_page=${SEARCH_CAP}`);
  if ((found?.total_count ?? 0) > SEARCH_CAP)
    throw new Error(`${found.total_count} issues mention a callout in comments; past one page`);
  const commentCallouts = [];
  for (const hit of found?.items ?? []) {
    if (hasCallout(hit.body)) continue;
    const comments = rest(`issues/${hit.number}/comments`);
    const shown = comments.find((c) => trustedComment(c) && calloutLines(c.body ?? "") !== null);
    if (shown) commentCallouts.push({ number: hit.number, title: hit.title, url: shown.html_url });
  }

  const unheld = openPrs.filter((pr) => !(pr.auto_merge || names(pr.labels).includes(HOLD_MERGE)));
  const prRows = unheld.map((pr) => ({
    ...pr,
    files: rest(`pulls/${pr.number}/files`).map((f) => String(f?.filename ?? "")),
  }));

  const heads = new Set(openPrs.map((pr) => pr.head?.ref).filter(Boolean));
  const owner = repo.split("/")[0];
  const platters = rest(`git/matching-refs/heads/${PLATTER_PREFIX}`)
    .map((r) => String(r.ref ?? "").replace(/^refs\/heads\//, ""))
    .filter(Boolean)
    .map((branch) => ({
      branch,
      prs: heads.has(branch)
        ? 1
        : rest(`pulls?state=all&head=${owner}:${encodeURIComponent(branch)}`).length,
    }));

  return unseenAsks({ issues: asked, commentCallouts, prs: prRows, platters, isProtected });
}
