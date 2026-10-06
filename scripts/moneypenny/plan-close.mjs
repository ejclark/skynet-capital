// MONEYPENNY — CLOSE A PLAN WHOSE SUB-ISSUES ARE ALL DONE (#4393 slice 5, criterion 7). A plan is
// finished when every slice is, but nothing noticed: on 2026-10-05 #3651 sat open at 8/8 closed
// sub-issues, and the board kept it among the open plans beside work that was genuinely in flight.
// The push sweep (events.mjs `routeSweep`) already closes the shipped, the researched and the relayed
// on the App token; this is the same level-based tick pointed at the one terminal state it missed.
//
// WHY IT HOLDS INSTEAD OF CLOSING, and says so ONCE. All sub-issues closed is the criterion's trigger,
// not proof the plan is done — a plan that slices by state block can carry work its sub-issues never
// named. Four things on the issue say "more remains", and a close over any of them drops that work:
//   - `next-slice` / `needs-session`: the labels the relay reads as a written, unbuilt remainder
//     (relay.mjs `REMAINDER_LABELS`). Closing over one would also trigger a relay issue.
//   - `needs-eric`: a decision someone is waiting on; the closes-win rule in `routeSweep` would drop
//     the question unanswered.
//   - an unchecked `- [ ]` in the body (the criterion's own wording): a criterion nobody ticked.
// A held plan gets ONE comment naming what is holding it (`HELD_MARKER` is the memory — a bot comment
// carrying it), then silence; the close follows on the first sweep after the reason clears.
// `in-progress` is a silent skip: a build is live on it right now, and the PR it opened will say more.
//
// Zero sub-issues is not "every sub-issue closed" — 66 of 85 open plans had none (projects.mjs
// `isStartedPlan`), and for those the criterion has nothing to read.
//
// SHAPE — decide/do, like relay.mjs: `planCloseVerdict`/`routePlanClose` are pure, `gatherPlanCloseDeps`
// is the one read (a comments page, only for a plan that is held), `executePlanClose` the writes, both
// injected so a spec drives every branch. Specced in tests/scripts/moneypenny/plan-close.spec.ts.
import { ghRestAll, sh } from "./gh.mjs";
import { FOOTER, LABELS, labelNames } from "./labels.mjs";
import { subIssueCounts } from "./projects.mjs";
import { REMAINDER_LABELS } from "./relay.mjs";

/** The one-time "why not" comment's memory. A bot comment carrying this means the plan was already told. */
export const HELD_MARKER = "<!-- moneypenny:plan-close-held -->";

/** Labels that mean the plan has more to do or a question open — see the header. */
export const HOLD_LABELS = [...REMAINDER_LABELS, LABELS.needsEric.name];

/** Writes one tick may make (closes and hold comments together). A rate ceiling, not a policy one:
 *  the first sweep after this lands meets every already-finished plan at once. */
export const PLAN_CLOSE_CAP = 3;

/** Only these authors' comments count as "already told" — the thread is public (plan-build.md). */
const TRUSTED_BOTS = new Set(["skynet-envoy[bot]", "github-actions[bot]"]);

/** `- [ ]` task items outside fenced code, which can show the syntax without being a criterion. */
export function uncheckedCriteria(body) {
  const prose = String(body ?? "").replace(/^(```|~~~)[\s\S]*?^\1/gm, "");
  return [...prose.matchAll(/^[ \t]*[-*+][ \t]+\[ \][ \t]+(.+)$/gm)].map((m) => m[1].trim());
}

/**
 * What the sweep should do about one open issue: `close`, `hold` (with `why`), or `skip`.
 * `issue` is the REST shape the sweep already has (`labels`, `body`, `sub_issues_summary`).
 */
export function planCloseVerdict(issue) {
  const names = labelNames(issue?.labels);
  if (!names.includes(LABELS.plan.name)) return { action: "skip", why: "not a plan" };
  const { total, completed } = subIssueCounts(issue);
  if (total === 0) return { action: "skip", why: "no sub-issues to read" };
  if (completed < total)
    return { action: "skip", why: `${total - completed} sub-issue(s) still open` };
  if (names.includes(LABELS.inProgress.name))
    return { action: "skip", why: "a build is live on it" };
  const held = HOLD_LABELS.filter((l) => names.includes(l));
  const unchecked = uncheckedCriteria(issue?.body);
  const why = [
    ...held.map((l) => `it carries \`${l}\``),
    ...(unchecked.length ? [`its body has ${unchecked.length} unchecked criterion(s)`] : []),
  ];
  return why.length ? { action: "hold", why, unchecked } : { action: "close", why: [] };
}

/**
 * Intents for the sweep. `openPlans` is `[{ ...issue, heldNoted }]` — `heldNoted` is the one read
 * `gatherPlanCloseDeps` makes, so a held plan already told is a no-op here.
 */
export function routePlanClose(deps = {}) {
  const { openPlans = [], planCloseCap = PLAN_CLOSE_CAP } = deps;
  const intents = [];
  for (const issue of openPlans) {
    const verdict = planCloseVerdict(issue);
    if (verdict.action === "close") {
      intents.push({
        kind: "close-plan",
        issueNumber: issue.number,
        title: issue.title,
        body: closeBody(issue),
      });
    } else if (verdict.action === "hold" && !issue.heldNoted) {
      intents.push({
        kind: "hold-plan-close",
        issueNumber: issue.number,
        title: issue.title,
        body: holdBody(issue, verdict),
      });
    }
  }
  intents.sort((a, b) => a.issueNumber - b.issueNumber);
  const batch = intents.slice(0, planCloseCap);
  if (intents.length > batch.length) {
    // stderr only — stdout is the matrix JSON on some call paths (events.mjs `researchCapNow`).
    console.error(
      `::notice::plan close — acting on ${batch.length} of ${intents.length} finished plan(s) ` +
        `this tick (cap ${planCloseCap}); the rest drain on later pushes, lowest number first.`,
    );
  }
  return batch;
}

function closeBody(issue) {
  const { total } = subIssueCounts(issue);
  return [
    `🏁 **Every slice is done** — all ${total} sub-issues are closed, and nothing on this plan says more remains (no \`next-slice\`, no open decision, no unchecked criterion). Closing it.`,
    "",
    "If something is still missing, reopen it and say what — the sweep will not close it again over a `next-slice` label.",
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

function holdBody(issue, verdict) {
  const { total } = subIssueCounts(issue);
  const unchecked = verdict.unchecked.slice(0, 3).map((c) => `  - ${c}`);
  return [
    HELD_MARKER,
    `**All ${total} sub-issues are closed, but I am leaving this plan open** — ${verdict.why.join(" and ")}.`,
    ...(unchecked.length ? ["", "First unchecked:", ...unchecked] : []),
    "",
    "I close a finished plan on the first sweep after that clears, and I will not comment on it again.",
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

/** Has a trusted bot already left the held comment on this issue? */
export function heldAlreadyNoted(comments = []) {
  return comments.some(
    (c) => TRUSTED_BOTS.has(c?.user?.login) && String(c?.body ?? "").includes(HELD_MARKER),
  );
}

/**
 * The sweep's one read. `open` is the open-issue list the router already paged; a comments page is
 * fetched ONLY for a plan whose verdict is `hold`, so a quiet repo pays nothing. A failed read counts
 * as "already told": a skipped comment retries on the next push, a duplicate cannot be unsaid, and
 * this runs inside `gatherDeps`, where a throw would take the whole tick down with it.
 */
export function gatherPlanCloseDeps(open = [], { readComments = defaultReadComments } = {}) {
  const out = [];
  for (const issue of open) {
    const { action } = planCloseVerdict(issue);
    if (action === "skip") continue;
    out.push(
      action === "hold" ? { ...issue, heldNoted: noted(issue.number, readComments) } : issue,
    );
  }
  return out;
}

function noted(number, readComments) {
  try {
    return heldAlreadyNoted(readComments(number));
  } catch (err) {
    console.log(
      `::warning::plan close — could not read #${number}'s comments (${String(err?.message).slice(0, 160)}); skipping its hold comment this tick.`,
    );
    return true;
  }
}

const defaultReadComments = (number) => ghRestAll(`issues/${number}/comments`);

/** The writes. The router delegates here so this file never imports it (the cycle relay.mjs avoids too). */
export function executePlanClose(intent, { run = sh } = {}) {
  if (intent.kind === "hold-plan-close") {
    run("gh", ["issue", "comment", String(intent.issueNumber), "--body", intent.body]);
    return `⏸ left #${intent.issueNumber} open — \`${intent.title}\` is fully sliced but something says more remains`;
  }
  run("gh", [
    "issue",
    "close",
    String(intent.issueNumber),
    "--reason",
    "completed",
    "--comment",
    intent.body,
  ]);
  return `🏁 closed #${intent.issueNumber} — \`${intent.title}\`, every sub-issue done`;
}
