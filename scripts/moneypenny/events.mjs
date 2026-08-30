// THE EVENT-RESEARCH DISPATCH LANE — opening one issue per never-assessed calendar event, plus the
// per-push dedupe that keeps back-to-back merges from double-researching one. Split out of
// moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { FOOTER, LABELS } from "./labels.mjs";
import { routeShipped } from "./shipped.mjs";

/** Something landed on main (or the `scan` command re-ran the sweep by hand — same path, never a
 *  second one that can drift). One issue per never-assessed event, deduped by exact open-issue
 *  title; plus the close-the-loop pass below. */
export function routeSweep(deps) {
  const { dueEvents = [], openIssueTitles = [] } = deps;
  const intents = [];
  const queued = new Set(openIssueTitles);
  for (const e of dueEvents.filter((x) => x.reason === "never-assessed")) {
    const title = `[event-research] ${e.id}`;
    if (queued.has(title)) continue;
    queued.add(title);
    intents.push({ kind: "open-issue", label: LABELS.event, title, body: eventIssueBody(e) });
  }
  return [...intents, ...routeShipped(deps)];
}

/**
 * Which due events actually get researched this run. Pure, and the reason the event lane can ride
 * EVERY push without double-working: the research session's branch name is mandated as
 * `research/<event-id>`, so an event whose research PR is still open (merged PRs leave the list)
 * is filtered out here. Concurrency serializes Moneypenny's runs, so each run sees the last one's
 * open PRs — the pair is the dedupe.
 */
export function dueForResearch(dueEvents = [], openPrHeads = []) {
  const inFlight = new Set(openPrHeads);
  return dueEvents.filter((e) => !inFlight.has(`research/${e.id}`));
}

function eventIssueBody(e) {
  return [
    `@claude — a calendar event is awaiting initial research: **${e.title}** (${e.date}, ${e.status}, impact: ${e.impact})`,
    "",
    "Run the `never-assessed` mode of [`docs/process/EVENT-RESEARCH.md`](../blob/main/docs/process/EVENT-RESEARCH.md):",
    `produce \`${e.ledger}\` from its TEMPLATE (initial research + stance + kill switches + first`,
    "ledger row), and ship it via `/ship`. Moneypenny's push-driven sweep takes the pulse",
    "checks from there.",
    "",
    FOOTER,
  ].join("\n");
}
