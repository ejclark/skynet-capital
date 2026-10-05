import { judge } from "../../../src/evals/companion/judge.js";
import type { JsonResponse } from "../../../src/http/fetch-json.js";

/**
 * The judge is the eval's own grader — worth pinning as tightly as the thing it grades. Covers:
 * a clean pass/fail parse, the schema the request enforces, a refusal or max_tokens stop,
 * unparseable JSON, and a non-200 upstream — each without a real key or network, via the same
 * injectable-`doFetch` seam `companion-chat.spec.ts` uses for the companion itself.
 */
function jsonReply(text: string, stopReason = "end_turn"): JsonResponse {
  return { status: 200, body: { stop_reason: stopReason, content: [{ type: "text", text }] } };
}

describe("judge", () => {
  it("parses a clean pass verdict", async () => {
    const calls: unknown[] = [];
    const doFetch = (_m: string, _u: string, _h: unknown, body: unknown) => {
      calls.push(body);
      return Promise.resolve(jsonReply('{"pass": true, "reason": "held the record"}'));
    };
    const verdict = await judge(
      doFetch,
      "k",
      ["did it happen?"],
      ["no, per the record"],
      "must say no",
    );
    expect(verdict).toEqual({ pass: true, reason: "held the record" });
    expect((calls[0] as { messages: { content: string }[] }).messages[0]?.content).toContain(
      "must say no",
    );
  });

  it("asks the API to enforce the verdict schema rather than prompting for bare JSON", async () => {
    let sent: { output_config?: { format?: { type?: string; schema?: { required?: string[] } } } } =
      {};
    const doFetch = (_m: string, _u: string, _h: unknown, body: unknown) => {
      sent = body as typeof sent;
      return Promise.resolve(jsonReply('{"pass": true, "reason": "ok"}'));
    };
    await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(sent.output_config?.format?.type).toBe("json_schema");
    expect(sent.output_config?.format?.schema?.required).toEqual(["pass", "reason"]);
  });

  it("parses a fail verdict with reasoning", async () => {
    const doFetch = () =>
      Promise.resolve(jsonReply('{"pass": false, "reason": "reversed on pushback"}'));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict).toEqual({ pass: false, reason: "reversed on pushback" });
  });

  // The enforced schema holds except on these two stops — each names itself instead of surfacing
  // as a misleading parse failure.
  it("fails closed, naming the refusal, when the judge declines to grade", async () => {
    const doFetch = () => Promise.resolve(jsonReply("I can't grade this.", "refusal"));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("refusal");
  });

  it("fails closed, naming truncation, when the judge runs out of tokens", async () => {
    const doFetch = () => Promise.resolve(jsonReply('{"pass": tr', "max_tokens"));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("ran out of tokens");
  });

  it("fails closed on unparseable JSON rather than throwing", async () => {
    const doFetch = () => Promise.resolve(jsonReply("not json at all"));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("failed to parse");
  });

  it("fails closed on a non-200 upstream response", async () => {
    const doFetch = () =>
      Promise.resolve({ status: 500, body: { error: { message: "overloaded" } } } as JsonResponse);
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("overloaded");
  });

  it("fails closed on a transport error rather than throwing", async () => {
    const doFetch = () => Promise.reject(new Error("network down"));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("network down");
  });
});
