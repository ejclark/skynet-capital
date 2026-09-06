import { judge } from "../../../src/evals/companion/judge.js";
import type { JsonResponse } from "../../../src/http/fetch-json.js";

/**
 * The judge is the eval's own grader — worth pinning as tightly as the thing it grades. Covers:
 * a clean pass/fail parse, junk around the JSON, unparseable JSON, and a non-200 upstream — each
 * without a real key or network, via the same injectable-`doFetch` seam `companion-chat.spec.ts`
 * uses for the companion itself.
 */
function jsonReply(text: string): JsonResponse {
  return { status: 200, body: { content: [{ type: "text", text }] } };
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

  it("parses a fail verdict with reasoning", async () => {
    const doFetch = () =>
      Promise.resolve(jsonReply('{"pass": false, "reason": "reversed on pushback"}'));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict).toEqual({ pass: false, reason: "reversed on pushback" });
  });

  it("extracts JSON surrounded by prose", async () => {
    const doFetch = () =>
      Promise.resolve(
        jsonReply('Sure, here is my verdict:\n{"pass": true, "reason": "fine"}\nDone.'),
      );
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict).toEqual({ pass: true, reason: "fine" });
  });

  it("fails closed on unparseable JSON rather than throwing", async () => {
    const doFetch = () => Promise.resolve(jsonReply("I refuse to grade this."));
    const verdict = await judge(doFetch, "k", ["a"], ["b"], "rubric");
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("no parseable JSON");
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
