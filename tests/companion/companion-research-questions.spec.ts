import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  COMPANION_TOOL_DEFS,
  type CompanionDeskDeps,
  declaredToolNames,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import type { MyResearchQuestions } from "../../src/server/research-answers.js";

/**
 * `get_my_research_questions` — research answers come back to the chat (#7286, named next slice 2).
 *   - WHEN a member with a linked desk asks what came of their research questions, Moneypenny SHALL
 *     read them for that session's own desk, never an id the model supplies.
 *   - WHEN the session has no linked desk, the tool SHALL NOT be declared, and a call SHALL be refused.
 *   - The tool's description SHALL name every field it returns (the model's only contract), and the
 *     prompt SHALL tell her to give a finding with its source and never as a reason to trade.
 */

const answer: MyResearchQuestions = {
  questions: [
    {
      kind: "name",
      subject: "PLTR",
      question: "what drives the backlog?",
      askedAt: "2026-11-08T10:00:00.000Z",
      askedIn: "The AI buildout",
      state: "answered",
      othersAsking: 1,
      writeUp: "docs/research/discovery/name-pltr-in-ai-buildout.md",
      opening: "Stand aside until the backlog prints.",
      findings: [
        {
          kind: "on-watch",
          idea: "Backlog leads revenue.",
          on: "2026-11-09",
          recheckOn: "2026-12-09",
          falsifier: "Backlog falls two quarters running.",
          source: "docs/research/discovery/name-pltr-in-ai-buildout.md",
        },
      ],
    },
    {
      kind: "sector",
      subject: "Energy",
      askedAt: "2026-11-07T10:00:00.000Z",
      state: "waiting",
      ahead: 3,
      passes: 2,
      othersAsking: 0,
      findings: [],
    },
  ],
  more: 0,
  wait: "The house's research pass runs once a day at about 13:23 UTC.",
  note: "Only questions you asked.",
};

function depsFor(overrides: Partial<CompanionDeskDeps> = {}): CompanionDeskDeps {
  return { snapshotFor: () => undefined, ...overrides };
}

const keysOf = (value: unknown): string[] =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];

describe("get_my_research_questions", () => {
  it("reads for the session's own desk and ignores any id in the model's input", async () => {
    const asked: string[] = [];
    const deps = depsFor({
      readMyResearchQuestions: (id) => {
        asked.push(id);
        return answer;
      },
    });
    const result = await runCompanionTool("get_my_research_questions", deps, "acct-1", {
      participantId: "acct-2",
      member: "someone-else",
    });
    expect(result).toEqual({ ok: true, result: answer });
    expect(asked).toEqual(["acct-1"]);
  });

  it("is declared only with a linked desk, and refused without one", async () => {
    expect(declaredToolNames("acct-1")).toContain("get_my_research_questions");
    expect(declaredToolNames(undefined)).not.toContain("get_my_research_questions");
    const result = await runCompanionTool(
      "get_my_research_questions",
      depsFor({ readMyResearchQuestions: () => answer }),
      undefined,
    );
    expect(result).toEqual({ ok: false, error: "no linked desk" });
  });

  it("says it isn't available rather than 'no questions' when the read isn't wired", async () => {
    const result = await runCompanionTool("get_my_research_questions", depsFor(), "acct-1");
    expect(result.ok).toBe(false);
  });

  it("names every field it returns in its description, and takes no input", () => {
    const def = COMPANION_TOOL_DEFS.find((t) => t.name === "get_my_research_questions");
    expect(def).toBeDefined();
    expect(keysOf(def?.input_schema.properties)).toEqual([]);
    const fields = new Set([
      ...keysOf(answer),
      ...answer.questions.flatMap(keysOf),
      ...answer.questions.flatMap((q) => q.findings.flatMap(keysOf)),
    ]);
    for (const field of fields) expect(def?.description).toContain(field);
  });

  it("tells her to give a finding with its source, and never as a reason to buy or sell", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain("get_my_research_questions");
    const rule = COMPANION_SYSTEM_PROMPT.slice(
      COMPANION_SYSTEM_PROMPT.indexOf("YOUR RESEARCH QUESTIONS"),
    );
    expect(rule).toMatch(/source/);
    expect(rule).toMatch(/never .*reason to buy or sell/);
  });
});
