import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { needsYouLines } from "../../../scripts/digest-scan.mjs";
import { type PlanInput, plan } from "../../../scripts/moneypenny/assignments.mjs";

// #4293 (#3818 criterion 12): the digest's Needs-you list SHALL equal the set the assignment lane
// gives Eric. One selector (`plan()` in scripts/moneypenny/assignments.mjs), two readers — the dry
// run's actions and `digest-scan --needs-you`. These specs fail the moment the two disagree.
const NOW = Date.parse("2026-09-30T12:00:00Z");
const ERIC = [{ login: "ejclark" }];
const callout = (d: string) => `**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. ${d}`;
const issue = (number: number, over: Record<string, unknown> = {}) => ({
  number,
  title: `issue ${number}`,
  body: callout(`decide ${number}`),
  state: "open",
  created_at: "2026-09-28T12:00:00Z",
  labels: [{ name: "needs-eric" }],
  assignees: [] as { login: string }[],
  ...over,
});
const pr = (number: number, over: Record<string, unknown> = {}) => ({
  number,
  title: `pr ${number}`,
  state: "open",
  created_at: "2026-09-29T00:00:00Z",
  labels: [{ name: "hold-merge" }],
  head: { ref: "fix/x" },
  assignees: [] as { login: string }[],
  ...over,
});

// Every case the selector distinguishes. OUT_OF_SCOPE names what Eric holds by hand that the lane
// never assigned (criterion 12 counts the lane's set) — listed here, never re-derived from the rule.
const INPUT: PlanInput = {
  issues: [
    issue(1), // criterion 1: fresh ask → assign
    issue(2, { assignees: ERIC }), // his by hand, stated decision → he holds it
    issue(3, { assignees: ERIC }), // marked + assigned → the lane's, still held
    issue(4), // marked, he unassigned himself → criterion 3: never re-asked
    issue(5, { body: "no callout" }), // no stated decision → clear candidate, never an ask
    issue(6, { labels: [], assignees: ERIC }), // marked, label off → criterion 2 unassign
    issue(7, { state: "closed", assignees: ERIC }), // marked, closed → criterion 2 unassign
    issue(8, { labels: [], assignees: ERIC }), // hand-assigned, no needs-eric → not the lane's
    issue(9, { body: "no callout", assignees: ERIC }), // hand-assigned, no decision → not an ask
    issue(20), // a held PR that also carries needs-eric → asked once
  ],
  prs: [
    pr(20, { created_at: "2026-09-28T00:00:00Z" }),
    pr(21), // criterion 4: held ≥12h → assign
    pr(22, { head: { ref: "platter/a" }, labels: [], assignees: ERIC }), // already his
    pr(23, { created_at: "2026-09-30T06:00:00Z" }), // held 6h → not yet
    pr(24, { draft: true }), // draft → never
    pr(25, { labels: [] }), // not held → never
  ],
  markers: new Set([3, 4, 6, 7]),
  now: NOW,
};
const OUT_OF_SCOPE = new Set([8, 9]);

const digestSet = (input: PlanInput) =>
  new Set(needsYouLines(plan(input)).map((l) => Number(/^- #(\d+)/.exec(l)?.[1])));

/** Apply the dry run's writes: who is assigned to Eric, and which items carry the marker, after. */
function applied(input: PlanInput): PlanInput {
  const { actions } = plan(input);
  const set = (on: boolean) => (on ? ERIC : []);
  const after = (n: number, was: boolean) =>
    actions.some((a) => a.number === n && a.kind === "assign") ||
    (was && !actions.some((a) => a.number === n && a.kind === "unassign"));
  const isEric = (a: unknown) => JSON.stringify(a ?? []).includes("ejclark");
  const markers = new Set(input.markers);
  for (const a of actions) if (a.kind === "assign" && a.criterion === 1) markers.add(a.number);
  return {
    ...input,
    markers,
    issues: input.issues?.map((i) => ({
      ...i,
      assignees: set(after(i.number, isEric(i.assignees))),
    })),
    prs: input.prs?.map((p) => ({ ...p, assignees: set(after(p.number, isEric(p.assignees))) })),
  };
}

const ericHolds = (input: PlanInput) =>
  new Set(
    [...(input.issues ?? []), ...(input.prs ?? [])]
      .filter((x) => JSON.stringify(x.assignees ?? []).includes("ejclark"))
      .map((x) => x.number)
      .filter((n) => !OUT_OF_SCOPE.has(n)),
  );

describe("digest Needs-you == the assignment lane's set (criterion 12)", () => {
  it("equals exactly what Eric holds once the dry run's writes land", () => {
    expect([...digestSet(INPUT)].sort((a, b) => a - b)).toEqual(
      [...ericHolds(applied(INPUT))].sort((a, b) => a - b),
    );
  });

  it("names the expected items, so a shared bug can't hide behind agreement", () => {
    expect([...digestSet(INPUT)].sort((a, b) => a - b)).toEqual([1, 2, 3, 20, 21, 22]);
  });

  it("is stable across the lane's own write: after applying, nothing new to assign, same set", () => {
    const next = applied(INPUT);
    expect(plan(next).actions.filter((a) => a.kind === "assign")).toEqual([]);
    expect(digestSet(next)).toEqual(digestSet(INPUT));
  });

  it("says so plainly when nothing is assigned", () => {
    expect(needsYouLines(plan({ now: NOW }))).toEqual(["_Nothing is assigned to you._"]);
  });

  it("leads each line with the decision (criterion 1) or the hold age (criterion 4)", () => {
    const lines = needsYouLines(plan(INPUT));
    expect(lines).toContain("- #1 issue 1 — decide 1");
    expect(lines.find((l) => l.startsWith("- #21 "))).toMatch(/held PR unmerged \d+h/);
  });
});

describe("one source of truth", () => {
  it("digest-scan reads plan() from the assignment module and selects nothing itself", () => {
    const src = readFileSync("scripts/digest-scan.mjs", "utf8");
    expect(src).toMatch(/import\("\.\/moneypenny\/assignments\.mjs"\)/);
    expect(src).not.toMatch(/needs-eric|NEEDS_ERIC|hold-merge|HOLD_MERGE|decisionLine/);
  });
});
