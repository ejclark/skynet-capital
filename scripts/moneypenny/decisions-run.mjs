// THE DECISIONS PAGE'S READS AND WRITES — #7939 slice 2. decisions-page.mjs decides; this file
// reads GitHub for it and carries its intents out, so the push sweep (index.mjs) and the by-hand CLI
// take one path.
//
// READS. No second selector: the asks are `plan().needsYou` from the assignment gather the sweep
// already holds (assignments.mjs), so the page and `digest-scan --needs-you` cannot disagree. On top
// of that, one list (the page) and one comments page (his replies).
//
// WRITES, and their order. Every write runs under one lease (`withAskLease("decisions-page")`), and
// an answer re-reads the page's receipts under it, because two sweeps can plan from one snapshot.
// Each answer goes out through answer-readback's own `executeReadback`, under that issue's own ask
// lease, and is skipped when the issue already carries a ledger row from this reply — so a tick that
// dies half-way re-does only what is missing. The receipt on the page comes LAST: it is the memory
// that says the reply is done, so it must never land before the answers it reports.
//
//   node scripts/moneypenny/decisions-run.mjs             # dry run: the page body it would write
//   node scripts/moneypenny/decisions-run.mjs --apply     # write it, the sweep's own path
import { isMain } from "../is-main.mjs";
import { executeReadback, rowsFromComments } from "./answer-readback.mjs";
import { gather as gatherAssignments, plan, withAskLease } from "./assignments.mjs";
import { ERIC, NEEDS_ERIC } from "./decision-callout.mjs";
import {
  clip,
  PAGE_LABEL,
  PAGE_MARKER,
  planDecisions,
  RECEIPT_OPEN,
  receiptedIds,
} from "./decisions-page.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS, labelNames } from "./labels.mjs";

const PAGE_LEASE = "decisions-page";

/** The standing page: the oldest open issue with the label, the marker, and a bot author (this
 *  repo is public; a stranger's look-alike issue is never the page). */
export function findPage(rest = ghRestAll) {
  return (
    rest(`issues?state=open&labels=${PAGE_LABEL}`)
      .filter(
        (i) =>
          !i.pull_request && i.user?.type === "Bot" && String(i.body ?? "").includes(PAGE_MARKER),
      )
      .sort((a, b) => a.number - b.number)[0] ?? null
  );
}

/** The page's inputs, from the assignment gather already in hand (`assignments`). */
export function gatherDecisions({ assignments, rest = ghRestAll, now = Date.now() } = {}) {
  if (!assignments) return null;
  const page = findPage(rest);
  return {
    needsYou: plan({ ...assignments, now }).needsYou,
    issues: assignments.issues ?? [],
    page,
    comments: page ? rest(`issues/${page.number}/comments`) : [],
  };
}

/** The sweep's view: `[]` without the gathered deps, so every other event routes as before. Pure. */
export function routeDecisions(deps = {}) {
  const { decisions, closing = new Set(), now = Date.now() } = deps;
  if (!decisions) return [];
  return planDecisions({ ...decisions, closing, now }).intents;
}

const api = (run, retry, method, path, ...fields) =>
  retry(() => run("gh", ["api", "--method", method, `repos/{owner}/{repo}/${path}`, ...fields]));

/**
 * The one-line receipt on the page: what each part of his reply did, and what was not read and
 * why. `outcomes` is `[{ n, number, said, done }]`, `done` one of applied · already · cleared.
 * The reply id rides in a marker, so a reply is never answered twice. Pure.
 */
export function receiptComment({ replyId, outcomes = [], unread = [], notes = [] }) {
  const read = outcomes.filter((o) => o.done !== "cleared");
  const parts = [];
  if (read.length)
    parts.push(`Read: ${read.map((o) => `${o.n} → #${o.number} ${o.said}`).join(" · ")}.`);
  const skipped = [
    ...outcomes
      .filter((o) => o.done === "cleared")
      .map((o) => ({ raw: `${o.n} ${o.said}`, why: `#${o.number} no longer waits on you` })),
    ...unread,
  ];
  if (skipped.length)
    parts.push(`Not read: ${skipped.map((u) => `\`${clip(u.raw, 40)}\` (${u.why})`).join("; ")}.`);
  if (!(read.length || skipped.length))
    parts.push("Nothing in this reply named an ask on the page.");
  if (notes.length)
    parts.push(`Lines with no number are not read as answers: “${clip(notes.join(" / "), 80)}”.`);
  return [parts.join(" "), "", `${RECEIPT_OPEN}${Number(replyId)} -->`, "", FOOTER].join("\n");
}

/** One answer fanned out to its issue, or what stopped it: applied · cleared · busy. */
function fanOut(rb, replyId, { run, retry, rest, read, lease }) {
  const n = rb.number;
  const got = withAskLease(n, lease, () => {
    const done = rowsFromComments(rest(`issues/${n}/comments`)).some((r) =>
      String(r.key).startsWith(`${n}/${replyId}/`),
    );
    if (done) return "applied";
    const issue = retry(() => read(`issues/${n}`));
    const waiting = issue?.state === "open" && labelNames(issue.labels).includes(NEEDS_ERIC);
    if (!waiting) return "cleared";
    executeReadback(rb, { run, retry, read });
    return "applied";
  });
  return got === "applied" || got === "cleared" ? got : "busy";
}

/** Carry out one page intent. Returns the receipt line the sweep logs. */
export function executeDecisions(
  intent,
  {
    run = sh,
    retry = withRetry,
    rest = ghRestAll,
    read = ghRest,
    lease = null,
    ensure = ensureLabel,
  } = {},
) {
  return withAskLease(PAGE_LEASE, lease, () => {
    if (intent.kind === "decisions-open") {
      if (findPage(rest)) return "· the decisions page already exists; the next tick syncs it";
      ensure(LABELS.decisionsPage);
      api(
        run,
        retry,
        "POST",
        "issues",
        "-f",
        `title=${intent.title}`,
        "-f",
        `body=${intent.body}`,
        "-f",
        `labels[]=${PAGE_LABEL}`,
        "-f",
        `assignees[]=${ERIC}`,
      );
      return `🗂️ opened the decisions page — ${intent.why}`;
    }
    const page = String(intent.number ?? intent.page);
    if (intent.kind === "decisions-sync") {
      if (intent.body) api(run, retry, "PATCH", `issues/${page}`, "-f", `body=${intent.body}`);
      if (intent.assign)
        api(run, retry, "POST", `issues/${page}/assignees`, "-f", `assignees[]=${ERIC}`);
      if (intent.unassign)
        api(run, retry, "DELETE", `issues/${page}/assignees`, "-f", `assignees[]=${ERIC}`);
      if (intent.ping)
        api(run, retry, "POST", `issues/${page}/comments`, "-f", `body=${intent.ping}`);
      return `🗂️ synced the decisions page #${page} — ${intent.why}`;
    }
    // decisions-answer
    if (receiptedIds(rest(`issues/${page}/comments`)).has(intent.replyId)) {
      return `· decisions page #${page} — reply ${intent.replyId} already answered`;
    }
    const io = { run, retry, rest, read, lease };
    const outcomes = intent.readbacks.map((rb) => ({
      n: rb.n,
      number: rb.number,
      said: rb.said,
      done: fanOut(rb, intent.replyId, io),
    }));
    if (outcomes.some((o) => o.done === "busy")) {
      return `· decisions page #${page} — another sweep holds an ask in reply ${intent.replyId}; the next tick finishes it`;
    }
    const body = receiptComment({
      replyId: intent.replyId,
      outcomes,
      unread: intent.unread,
      notes: intent.notes,
    });
    api(run, retry, "POST", `issues/${page}/comments`, "-f", `body=${body}`);
    return `📖 decisions page #${page} — ${body.split("\n")[0]}`;
  });
}

function main(argv) {
  const now = Date.now();
  const decisions = gatherDecisions({ assignments: gatherAssignments({ now }), now });
  const intents = routeDecisions({ decisions, now });
  if (!argv.includes("--apply")) {
    const { body } = planDecisions({ ...decisions, now });
    console.log(body);
    console.log("\n## Would do (dry run — nothing written)\n");
    if (!intents.length) console.log("_nothing_");
    for (const i of intents)
      console.log(
        `- **${i.kind}** ${i.number ? `#${i.number} ` : ""}— ${i.why ?? `reply ${i.replyId}`}`,
      );
    return;
  }
  for (const i of intents) console.log(executeDecisions(i));
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
