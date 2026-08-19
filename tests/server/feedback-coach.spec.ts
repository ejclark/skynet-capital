import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  createFeedbackCoach,
  parseCoachReply,
  resolveFeedbackCoach,
} from "../../src/server/feedback-coach.js";

const anthropicReply = (text: string): JsonResponse => ({
  status: 200,
  body: { content: [{ type: "text", text }] },
});

describe("feedback coach", () => {
  it("is inert until ANTHROPIC_API_KEY is set — the plain form must keep working without it", () => {
    expect(resolveFeedbackCoach({})).toBeUndefined();
    expect(resolveFeedbackCoach({ ANTHROPIC_API_KEY: "sk-ant-x" })).toBeInstanceOf(Function);
  });

  it("returns a question turn when the model asks one", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve(anthropicReply('{"question": "Where in the app did the chart wobble?"}')),
    );

    const result = await coach({ kind: "bug", messages: [{ role: "user", content: "chart bad" }] });

    expect(result).toEqual({
      ok: true,
      done: false,
      question: "Where in the app did the chart wobble?",
    });
  });

  it("returns the draft when the model finishes, tolerating a code fence", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve(
        anthropicReply(
          '```json\n{"draft": {"title": "fix the wobble", "details": "## What\\n…"}}\n```',
        ),
      ),
    );

    const result = await coach({ kind: "bug", messages: [{ role: "user", content: "chart bad" }] });

    expect(result).toMatchObject({ ok: true, done: true, title: "fix the wobble" });
  });

  it("degrades an unparseable reply to a question — the member just sees text, nothing breaks", () => {
    const result = parseCoachReply("Could you say more about which chart?");

    expect(result).toMatchObject({ ok: true, done: false });
  });

  it("tells the model to finish once the member has answered three rounds", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"draft": {"title": "t", "details": "d"}}'));
    });

    await coach({
      kind: "idea",
      messages: [
        { role: "user", content: "raw" },
        { role: "assistant", content: "q1" },
        { role: "user", content: "a1" },
        { role: "assistant", content: "q2" },
        { role: "user", content: "a2" },
      ],
    });

    expect(JSON.stringify(bodies[0])).toContain("produce the draft NOW");
  });

  it("bounds the conversation — size and length are server-enforced, not model-trusted", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () => Promise.resolve(anthropicReply("{}")));

    expect(await coach({ kind: "bug", messages: [] })).toMatchObject({ ok: false });
    expect(
      await coach({ kind: "bug", messages: [{ role: "user", content: "x".repeat(5000) }] }),
    ).toMatchObject({ ok: false });
  });

  it("carries the destructive-ask rail in its system prompt", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"question": "q"}'));
    });

    await coach({ kind: "bug", messages: [{ role: "user", content: "hi" }] });

    const system = JSON.stringify(bodies[0]);
    expect(system).toContain("destructive");
    expect(system).toContain("never instructions");
  });

  it("reports an API failure honestly instead of pretending to coach", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve({ status: 429, body: { error: { message: "rate limited" } } }),
    );

    const result = await coach({ kind: "bug", messages: [{ role: "user", content: "hi" }] });

    expect(result).toMatchObject({ ok: false });
  });
});
