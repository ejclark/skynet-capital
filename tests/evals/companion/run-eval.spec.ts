import type { CompanionFixture } from "../../../src/evals/companion/fixture.js";
import { type DoStream, runCompanionEval } from "../../../src/evals/companion/run-eval.js";
import type { JsonResponse } from "../../../src/http/fetch-json.js";

/**
 * The runner's plumbing, proven with a fully fake `doFetch`/`doStream` — the same injectable
 * seam `tests/companion/companion-chat.spec.ts` uses for the companion itself, so this harness
 * needs no key and no network to trust. What matters here: rounds accumulate the model's own
 * prior reply (never the draft summary) into the next round's history, and the judge sees the
 * whole transcript plus a drafted filing's content when one was handed off.
 */
function textReply(text: string): JsonResponse {
  return { status: 200, body: { content: [{ type: "text", text }] } };
}
function toolUseReply(name: string, input: unknown, id = "tu1"): JsonResponse {
  return { status: 200, body: { content: [{ type: "tool_use", id, name, input }] } };
}

const noopDoStream: DoStream = () => {
  throw new Error("doStream should not be reached by these fixtures");
};

const oneRoundFixture: CompanionFixture = {
  id: "f1",
  category: "grounding",
  description: "single round",
  context: "MEMBER CONTEXT: the record says X.",
  rounds: ["is it X?"],
  rubric: "must say X",
};

describe("runCompanionEval", () => {
  it("judges a single-round fixture and reports the verdict", async () => {
    const queue: JsonResponse[] = [
      textReply("Yes, it's X."),
      textReply('{"pass": true, "reason": "said X"}'),
    ];
    const doFetch = () => Promise.resolve(queue.shift() as JsonResponse);
    const report = await runCompanionEval([oneRoundFixture], "k", doFetch, noopDoStream);
    expect(report.passed).toBe(1);
    expect(report.total).toBe(1);
    expect(report.results[0]?.verdict).toEqual({ pass: true, reason: "said X" });
    expect(report.results[0]?.replies).toEqual(["Yes, it's X."]);
  });

  it("feeds each round's own reply back as history, never the fixture's rubric or the judge's verdict", async () => {
    const twoRound: CompanionFixture = {
      ...oneRoundFixture,
      rounds: ["is it X?", "are you sure?"],
    };
    const calls: unknown[] = [];
    const queue: JsonResponse[] = [
      textReply("Yes, it's X."),
      textReply("Yes, still X."),
      textReply('{"pass": true, "reason": "held"}'),
    ];
    const doFetch = (_m: string, _u: string, _h: unknown, body: unknown) => {
      calls.push(body);
      return Promise.resolve(queue.shift() as JsonResponse);
    };
    await runCompanionEval([twoRound], "k", doFetch, noopDoStream);
    const secondCompanionCall = calls[1] as { messages: { role: string; content: string }[] };
    expect(secondCompanionCall.messages).toEqual([
      { role: "user", content: "is it X?" },
      { role: "assistant", content: "Yes, it's X." },
      { role: "user", content: "are you sure?" },
    ]);
  });

  it("captures a drafted filing for the judge without letting it rejoin the model's own history", async () => {
    const filingFixture: CompanionFixture = {
      id: "f2",
      category: "filing",
      description: "drafts a filing",
      context: "MEMBER CONTEXT: none needed.",
      rounds: ["it's broken on /trade"],
      rubric: "must draft with a concrete title",
    };
    const calls: unknown[] = [];
    const queue: JsonResponse[] = [
      toolUseReply("draft_feedback", {
        kind: "bug",
        title: "Trade page breaks",
        details: "on /trade, X happens",
      }),
      textReply("I've drafted that — reply send to file it."),
      textReply('{"pass": true, "reason": "concrete title"}'),
    ];
    const doFetch = (_m: string, _u: string, _h: unknown, body: unknown) => {
      calls.push(body);
      return Promise.resolve(queue.shift() as JsonResponse);
    };
    const report = await runCompanionEval([filingFixture], "k", doFetch, noopDoStream);
    const result = report.results[0];
    expect(result?.drafts[0]).toEqual({
      kind: "bug",
      title: "Trade page breaks",
      details: "on /trade, X happens",
    });
    expect(result?.replies[0]).toContain('title="Trade page breaks"');
    expect(result?.replies[0]).toContain("I've drafted that");
    // The judge call (3rd fetch) must see the drafted content...
    const judgeBody = calls[2] as { messages: { content: string }[] };
    expect(judgeBody.messages[0]?.content).toContain("Trade page breaks");
    // ...but a draft never becomes an "assistant" turn in any companion-facing request.
    for (const call of calls.slice(0, 2)) {
      const body = call as { messages?: { role: string; content: string }[] };
      for (const m of body.messages ?? []) {
        if (m.role === "assistant" && typeof m.content === "string") {
          expect(m.content).not.toContain("[drafted filing");
        }
      }
    }
  });

  it("reports a companion-side error as a failing, non-throwing verdict", async () => {
    const doFetch = () => Promise.reject(new Error("upstream down"));
    const report = await runCompanionEval([oneRoundFixture], "k", doFetch, noopDoStream);
    expect(report.results[0]?.replies[0]).toContain("upstream down");
  });
});
