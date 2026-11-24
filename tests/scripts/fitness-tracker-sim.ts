import {
  CONTRACTS,
  reportActions,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";
import {
  ASSIGNED_MARKER,
  REOPENED_MARKER,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness-rungs.mjs";
import { iso, MIN } from "./fitness-harness";

// What fitness.spec.ts and fitness-owner.spec.ts share: a clock to start from, and a stand-in for
// the issue tracker, so a run of ticks can be fed through reportActions and tallied.
export const NOW = Date.parse("2026-11-01T06:00:00Z");

export type Run = { sha: string; createdAt: string; updatedAt: string; conclusion: string };

/** deploy-lag's shape rebuilt from push runs at one moment: a run's success stands in for the deploy job. */
export function lagAt(runs: Run[], now: number) {
  const seen = runs.filter((r) => Date.parse(r.createdAt) <= now);
  const head = seen.at(-1);
  const released = [...seen]
    .reverse()
    .find((r) => r.conclusion === "success" && Date.parse(r.updatedAt) <= now);
  const stranded = released
    ? seen.filter((r) => Date.parse(r.createdAt) > Date.parse(released.createdAt))
    : [];
  const lagging = Boolean(head && released && head.sha !== released.sha);
  return { lagging, since: stranded[0]?.createdAt, bots: { known: true, lagging: false } };
}

/** Feed one contract's results tick by tick through reportActions, playing GitHub's part. */
export function simulate(
  ticks: { id: string; detail: string; at?: number }[],
  onAssign?: (at: number) => void,
) {
  const tally = { opens: 0, comments: 0, closes: 0, reopens: 0, assigns: 0 };
  type Thread = {
    number: number;
    title: string;
    body: string;
    lastComment: string;
    createdAt: string;
    assignees: { login: string }[];
    botComments: { type: string; body: string; at: string }[];
    state?: string;
    closedAt?: string;
  };
  let issue: Thread | null = null;
  let closed: Thread | null = null;
  ticks.forEach((r, i) => {
    const nowMs = r.at ?? NOW + i * 15 * MIN;
    const say = (body: string) => {
      issue?.botComments.push({ type: "Bot", body, at: iso(nowMs) });
    };
    const actions = reportActions([r], issue ? [issue] : [], {
      nowMs,
      closedIssues: closed ? [closed] : [],
    });
    for (const a of actions) {
      if (a.kind === "open") {
        tally.opens++;
        issue = {
          number: 1,
          title: `[fitness] ${r.id}`,
          body: `**What failed:** ${r.detail}.`,
          lastComment: "",
          createdAt: iso(nowMs),
          assignees: [],
          botComments: [],
        };
      }
      if (a.kind === "reopen" && closed) {
        tally.reopens++;
        issue = { ...closed, assignees: [], state: "OPEN" };
        closed = null;
        say(REOPENED_MARKER);
      }
      if (a.kind === "comment" && issue) {
        tally.comments++;
        issue.lastComment = `Still failing, and it changed: ${r.detail}.`;
      }
      if (a.kind === "assign" && issue) {
        tally.assigns++;
        onAssign?.(nowMs);
        issue.assignees = [{ login: "ejclark" }];
        issue.lastComment = `Assigned to the owner: ${a.why}. Still failing: ${a.detail}.`;
        say(ASSIGNED_MARKER);
      }
      if (a.kind === "close") {
        tally.closes++;
        if (issue) closed = { ...issue, state: "CLOSED", closedAt: iso(nowMs) };
        issue = null;
      }
    }
  });
  return tally;
}

/** A real contract's fields, so a spec reads the rung the contract actually declares. */
export function contract(id: string) {
  const found = CONTRACTS.find((c: { id: string }) => c.id === id);
  if (!found) throw new Error(`no contract ${id}`);
  const { probe: _probe, ...fields } = found;
  return fields;
}
