import { COMPANION_TOOL_NAMES, runCompanionTool } from "../../../src/companion/companion-tools.js";
import type { CompanionFixture } from "../../../src/evals/companion/fixture.js";
import {
  type DoStream,
  formatCompanionReport,
  runCompanionEval,
} from "../../../src/evals/companion/run-eval.js";
import {
  checkToolUse,
  DRAFT_TOOL_NAMES,
  FIXTURE_PARTICIPANT_ID,
  stubDesk,
} from "../../../src/evals/companion/tool-use.js";
import type { JsonResponse } from "../../../src/http/fetch-json.js";
import type { Roadmap } from "../../../src/server/roadmap.js";

/**
 * Scoring tool use in the companion eval (#7286, named next slice 5). Before this the runner sent
 * every fixture as a session with no linked desk and no reads wired, so a fixture could only judge
 * what she SAID, never what she looked up or drafted. These specs pin the harness half:
 *
 * - WHEN a fixture declares tool use, the runner SHALL send its turns as a linked session, so the
 *   request carries the real, full tool list.
 * - WHEN she calls a read in such a fixture, the runner SHALL answer it through the real
 *   dispatcher from the fixture's stubbed reads; a read the fixture did not stub SHALL answer
 *   "not available", never a live read.
 * - The runner SHALL record every tool call, round by round.
 * - A fixture SHALL fail when a tool it requires was not called, when a tool it forbids was
 *   called, or when it forbids drafts and any draft_* tool (a card a tap would send) was called.
 * - A fixture without tool use SHALL run exactly as before.
 *
 * Every spec here runs on a fake `doFetch`: no key, no network.
 */
function textReply(text: string): JsonResponse {
  return { status: 200, body: { content: [{ type: "text", text }] } };
}
function toolUseReply(name: string, input: unknown, id = "tu1"): JsonResponse {
  return { status: 200, body: { content: [{ type: "tool_use", id, name, input }] } };
}
const verdict = (pass: boolean) => textReply(JSON.stringify({ pass, reason: "judged" }));

const noopDoStream: DoStream = () => {
  throw new Error("doStream should not be reached by these fixtures");
};

const ROADMAP: Roadmap = {
  available: true,
  note: "Sequencing, not dates.",
  openPlans: 1,
  groups: [
    {
      horizon: "Now",
      meaning: "being built",
      total: 1,
      items: [
        {
          number: 4242,
          title: '"Faster fills on the trade ticket"',
          horizon: "Now",
          status: "Being built",
          labels: ["plan", "in-progress"],
          url: "https://example.test/4242",
        },
      ],
    },
  ],
};

const base: CompanionFixture = {
  id: "grounding-tool-test",
  category: "grounding",
  description: "asks what is being built",
  context: "MEMBER CONTEXT: Jordan.",
  rounds: ["what's being built?"],
  rubric: "must name #4242",
};

const withTools: CompanionFixture = {
  ...base,
  toolUse: {
    desk: { readRoadmap: () => Promise.resolve(ROADMAP) },
    expect: { called: ["get_roadmap"] },
  },
};

/** A fake fetch that answers from a queue and keeps every request body it was sent. */
function scripted(queue: JsonResponse[]) {
  const calls: { body: unknown }[] = [];
  const doFetch = (_m: string, _u: string, _h: unknown, body: unknown) => {
    calls.push({ body });
    return Promise.resolve(queue.shift() as JsonResponse);
  };
  return { doFetch, calls };
}

const toolNamesOf = (body: unknown): string[] =>
  ((body as { tools?: { name: string }[] }).tools ?? []).map((t) => t.name);

describe("checkToolUse", () => {
  describe("when a fixture requires a tool", () => {
    it("passes when she called it", () => {
      expect(
        checkToolUse({ called: ["get_roadmap"] }, [{ name: "get_roadmap", input: {} }]).pass,
      ).toBe(true);
    });

    it("fails and names the tool when she did not", () => {
      const check = checkToolUse({ called: ["get_work_status"] }, [
        { name: "get_roadmap", input: {} },
      ]);
      expect(check.pass).toBe(false);
      expect(check.reason).toContain("get_work_status");
    });
  });

  describe("when a fixture forbids a tool", () => {
    it("fails and names the forbidden call", () => {
      const check = checkToolUse({ notCalled: ["get_roadmap"] }, [
        { name: "get_roadmap", input: {} },
      ]);
      expect(check.pass).toBe(false);
      expect(check.reason).toContain("get_roadmap");
    });
  });

  describe("when a fixture forbids drafts", () => {
    it("fails on any draft_* call", () => {
      for (const name of DRAFT_TOOL_NAMES) {
        const check = checkToolUse({ noDrafts: true }, [{ name, input: {} }]);
        expect(check.pass).toBe(false);
        expect(check.reason).toContain(name);
      }
    });

    it("lets reads through", () => {
      expect(checkToolUse({ noDrafts: true }, [{ name: "get_my_positions", input: {} }]).pass).toBe(
        true,
      );
    });
  });

  describe("when a fixture forbids every tool", () => {
    it("fails on any call at all, and passes on none", () => {
      expect(checkToolUse({ noTools: true }, [{ name: "get_roadmap", input: {} }]).pass).toBe(
        false,
      );
      expect(checkToolUse({ noTools: true }, []).pass).toBe(true);
    });
  });
});

describe("DRAFT_TOOL_NAMES", () => {
  it("is every declared draft_* tool and no read", () => {
    expect(DRAFT_TOOL_NAMES).toContain("draft_feedback");
    expect(DRAFT_TOOL_NAMES).toContain("draft_conviction");
    expect(DRAFT_TOOL_NAMES).toEqual(COMPANION_TOOL_NAMES.filter((n) => n.startsWith("draft_")));
  });
});

describe("stubDesk", () => {
  it("answers a stubbed read through the real dispatcher", async () => {
    const desk = stubDesk({ readRoadmap: () => Promise.resolve(ROADMAP) });
    expect(await runCompanionTool("get_roadmap", desk, FIXTURE_PARTICIPANT_ID)).toEqual({
      ok: true,
      result: ROADMAP,
    });
  });

  it("answers a read the fixture did not stub as not available", async () => {
    const result = await runCompanionTool("get_work_status", stubDesk({}), FIXTURE_PARTICIPANT_ID, {
      issues: [1],
    });
    expect(result.ok).toBe(false);
  });

  it("serves the stubbed snapshot to the fixture's own member only", () => {
    const snapshot = {
      id: FIXTURE_PARTICIPANT_ID,
      displayName: "Jordan",
      kind: "human" as const,
      cash: 1,
      equity: 1,
      positions: [],
    };
    const desk = stubDesk({ snapshot });
    expect(desk.snapshotFor(FIXTURE_PARTICIPANT_ID)).toBe(snapshot);
    expect(desk.snapshotFor("someone-else")).toBeUndefined();
  });
});

describe("runCompanionEval with tool use", () => {
  it("declares the real, full tool list for a fixture that declares tool use", async () => {
    const { doFetch, calls } = scripted([textReply("Now: #4242."), verdict(true)]);
    await runCompanionEval([withTools], "k", doFetch, noopDoStream);
    expect(toolNamesOf(calls[0]?.body)).toEqual([...COMPANION_TOOL_NAMES]);
  });

  it("keeps a fixture without tool use on the deskless list, as before", async () => {
    const { doFetch, calls } = scripted([textReply("Hi."), verdict(true)]);
    await runCompanionEval([base], "k", doFetch, noopDoStream);
    const names = toolNamesOf(calls[0]?.body);
    expect(names).toContain("draft_feedback");
    expect(names).not.toContain("get_my_positions");
  });

  it("answers her lookup from the fixture's stub and records the call", async () => {
    const { doFetch, calls } = scripted([
      toolUseReply("get_roadmap", {}),
      textReply("Now: #4242, faster fills."),
      verdict(true),
    ]);
    const report = await runCompanionEval([withTools], "k", doFetch, noopDoStream);
    const second = calls[1]?.body as { messages: { role: string; content: unknown }[] };
    const toolResult = JSON.stringify(second.messages.at(-1)?.content);
    expect(toolResult).toContain("Faster fills on the trade ticket");
    expect(report.results[0]?.toolCalls).toEqual([[{ name: "get_roadmap", input: {} }]]);
    expect(report.results[0]?.toolCheck?.pass).toBe(true);
    expect(report.passed).toBe(1);
  });

  it("tells the judge which tools she called", async () => {
    const { doFetch, calls } = scripted([
      toolUseReply("get_roadmap", {}),
      textReply("Now: #4242."),
      verdict(true),
    ]);
    await runCompanionEval([withTools], "k", doFetch, noopDoStream);
    const judgeBody = calls[2]?.body as { messages: { content: string }[] };
    expect(judgeBody.messages[0]?.content).toContain("[tools called: get_roadmap]");
  });

  it("fails a fixture the judge passed when a required tool was never called", async () => {
    const { doFetch } = scripted([textReply("Probably something good."), verdict(true)]);
    const report = await runCompanionEval([withTools], "k", doFetch, noopDoStream);
    expect(report.results[0]?.verdict.pass).toBe(true);
    expect(report.results[0]?.toolCheck?.pass).toBe(false);
    expect(report.results[0]?.pass).toBe(false);
    expect(report.passed).toBe(0);
    expect(formatCompanionReport(report)).toContain("get_roadmap");
  });

  it("fails a no-drafts fixture that drafted a filing", async () => {
    const noDrafts: CompanionFixture = {
      ...base,
      toolUse: { desk: {}, expect: { noDrafts: true } },
    };
    const { doFetch } = scripted([
      toolUseReply("draft_feedback", { kind: "bug", title: "Sell NVDA", details: "member asked" }),
      textReply("Drafted."),
      verdict(true),
    ]);
    const report = await runCompanionEval([noDrafts], "k", doFetch, noopDoStream);
    expect(report.results[0]?.pass).toBe(false);
    expect(report.results[0]?.toolCheck?.reason).toContain("draft_feedback");
  });
});
