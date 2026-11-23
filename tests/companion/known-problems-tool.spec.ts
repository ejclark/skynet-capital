/**
 * Match before she drafts (#8005 slice 7): Moneypenny checks a member's build or change request
 * against the IA ledger, names a match in plain words, and the draft she hands the member carries
 * it, so the filing lands as evidence on a recorded problem instead of a new, unplaced feature.
 *
 * EARS lines this spec pins:
 *   - The rule SHALL send kinds 3 and 4 to get_known_problems before draft_feedback.
 *   - WHEN get_known_problems is called, it SHALL return every ledger row with its evidence so
 *     far, deskless, and SHALL say when the counts could not be read rather than report zero.
 *   - WHEN draft_feedback names a ledger row, the draft SHALL carry the match and its words.
 *   - WHEN it names a row or plan that does not check out, that part SHALL be dropped and named,
 *     and the draft SHALL still go.
 */
import {
  type CompanionDeskDeps,
  declaredToolNames,
  type FeedbackDraft,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import { ROUTING_RULE } from "../../src/companion/routing-rule.js";
import type { Roadmap } from "../../src/server/roadmap.js";

function deps(overrides: Partial<CompanionDeskDeps> = {}): CompanionDeskDeps {
  return { snapshotFor: () => undefined, ...overrides };
}

const DRAFT = {
  kind: "idea",
  title: "Put every order in one list",
  details: "Activity and Profile both list my orders.\nDone when: one list.",
};

const roadmapWith =
  (number: number): (() => Promise<Roadmap>) =>
  () =>
    Promise.resolve({
      available: true,
      note: "",
      openPlans: 1,
      groups: [
        {
          horizon: "Next",
          meaning: "",
          total: 1,
          items: [
            { number, title: '"x"', horizon: "Next", status: "Up next", labels: [], url: "" },
          ],
        },
      ],
    });

type Answer = { ok: true; result: Record<string, unknown> };

describe("get_known_problems — the IA ledger, before a draft", () => {
  it("is in the rule for build and change requests, before draft_feedback", () => {
    expect(ROUTING_RULE).toContain("call get_known_problems, then draft_feedback");
    expect(ROUTING_RULE).toContain(
      "call get_known_problems and get_roadmap first, together in one step",
    );
    expect(ROUTING_RULE).toContain("MATCH BEFORE YOU DRAFT");
    expect(ROUTING_RULE).toContain('"this is a known problem: what it is, plan #N"');
  });

  it("is offered without a linked desk: it reads repo content and counts only", () => {
    expect(declaredToolNames(undefined)).toContain("get_known_problems");
  });

  it("returns every row with its evidence, by row, never who asked", async () => {
    const out = (await runCompanionTool(
      "get_known_problems",
      deps({
        readKnownProblemEvidence: () =>
          Promise.resolve(new Map([["U1", { members: 2, filings: 3 }]])),
      }),
      undefined,
    )) as Answer;
    const problems = out.result.problems as Record<string, unknown>[];
    expect(out.result.counted).toBe(true);
    expect(problems.length).toBeGreaterThanOrEqual(17);
    expect(problems.find((p) => p.row === "U1")).toMatchObject({
      problem: "One history, three homes",
      screensCited: 3,
      askedBy: 2,
      filings: 3,
    });
    expect(problems.find((p) => p.row === "U3")).toMatchObject({ plans: [5206] });
    expect(problems.find((p) => p.row === "U2")).not.toHaveProperty("askedBy");
    expect(JSON.stringify(out.result)).not.toMatch(/member-|@/);
  });

  it("says the counts could not be read rather than reporting nobody asked", async () => {
    const out = (await runCompanionTool(
      "get_known_problems",
      deps({ readKnownProblemEvidence: () => Promise.reject(new Error("volume down")) }),
      undefined,
    )) as Answer;
    expect(out.result.counted).toBe(false);
  });
});

describe("draft_feedback — the draft carries the match", () => {
  it("hands the rail a draft that names the known problem in plain words", async () => {
    const drafts: FeedbackDraft[] = [];
    const out = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d) }),
      undefined,
      { ...DRAFT, known_problem: "U3" },
    )) as Answer;
    expect(drafts[0]?.match).toMatchObject({ row: "U3" });
    expect(drafts[0]?.match?.words).toBe(
      "a known problem: A section switch that can't hold its sections at 390 · plan #5206",
    );
    expect(out.result.knownProblem).toBe(drafts[0]?.match?.words);
    expect(out.result).not.toHaveProperty("matchDropped");
  });

  it("keeps a plan the roadmap lists, named by its title, and drops one it does not", async () => {
    const drafts: FeedbackDraft[] = [];
    const kept = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d), readRoadmap: roadmapWith(7031) }),
      undefined,
      { ...DRAFT, plan: 7031 },
    )) as Answer;
    expect(drafts[0]?.match).toEqual({ plan: 7031, words: 'an open plan: #7031 "x"' });
    expect(kept.result).not.toHaveProperty("matchDropped");

    const dropped = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d), readRoadmap: roadmapWith(7031) }),
      undefined,
      { ...DRAFT, known_problem: "U1", plan: 4242 },
    )) as Answer;
    expect(drafts[1]?.match).toMatchObject({ row: "U1" });
    expect(drafts[1]?.match).not.toHaveProperty("plan");
    expect(dropped.result.matchDropped).toContain("#4242 is not a plan that known problem lists");

    const alone = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d), readRoadmap: roadmapWith(7031) }),
      undefined,
      { ...DRAFT, plan: 4242 },
    )) as Answer;
    expect(drafts[2]).not.toHaveProperty("match");
    expect(alone.result.matchDropped).toContain("#4242 is not a plan get_roadmap lists");
  });

  it("keeps only a known problem's own plan beside it, even one the roadmap lists", async () => {
    const drafts: FeedbackDraft[] = [];
    const out = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d), readRoadmap: roadmapWith(7031) }),
      undefined,
      { ...DRAFT, known_problem: "U1", plan: 7031 },
    )) as Answer;
    expect(drafts[0]?.match).toMatchObject({ row: "U1" });
    expect(drafts[0]?.match?.plan).toBeUndefined();
    expect(drafts[0]?.match?.words).toMatch(/^a known problem: One history, three homes/);
    expect(drafts[0]?.match?.words).not.toContain("#7031");
    expect(out.result.matchDropped).toContain("#7031 is not a plan that known problem lists");
  });

  it("drops a row the ledger does not hold and still hands the draft over", async () => {
    const drafts: FeedbackDraft[] = [];
    const out = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d) }),
      undefined,
      { ...DRAFT, known_problem: "U99" },
    )) as Answer;
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).not.toHaveProperty("match");
    expect(out.result.captured).toBe(true);
    expect(out.result.matchDropped).toContain("U99 is not a row");
  });

  it("names nothing and drops nothing when no match was named", async () => {
    const drafts: FeedbackDraft[] = [];
    const out = (await runCompanionTool(
      "draft_feedback",
      deps({ onDraft: (d) => drafts.push(d) }),
      undefined,
      DRAFT,
    )) as Answer;
    expect(drafts[0]).not.toHaveProperty("match");
    expect(out.result).not.toHaveProperty("knownProblem");
    expect(out.result).not.toHaveProperty("matchDropped");
  });
});
