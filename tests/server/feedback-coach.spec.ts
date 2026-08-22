import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  createFeedbackCoach,
  parseCoachReply,
  resolveFeedbackCoach,
  toCapsule,
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

  // The capsule is what earns the wide build envelope: a curated ask is treated as the SPEC and
  // built unattended. So "spec-complete" has to be earned, never merely asserted by the model —
  // a capsule that falsely claims completeness is the one failure that reaches production.
  it("parses the story capsule and marks it spec-complete only when criteria back the claim", () => {
    const complete = parseCoachReply(
      JSON.stringify({
        draft: {
          title: "widen the form",
          details: "## What",
          criteria: ["When a member opens /feedback, the form shall span 900px."],
          assumptions: [],
          outOfScope: ["Changing the Send button copy"],
          readiness: "spec-complete",
        },
      }),
    );

    expect(complete).toMatchObject({
      done: true,
      capsule: {
        readiness: "spec-complete",
        criteria: ["When a member opens /feedback, the form shall span 900px."],
      },
    });
  });

  it("downgrades a spec-complete claim with no acceptance criteria to partial", () => {
    const result = parseCoachReply(
      '{"draft": {"title": "t", "details": "d", "readiness": "spec-complete"}}',
    );

    expect(result).toMatchObject({ done: true, capsule: { readiness: "partial", criteria: [] } });
  });

  // The issue body is public markdown; a backtick in a capsule field would break the fenced block
  // the build lane parses, and an unbounded list would let one submission flood the issue.
  it("bounds and de-fences capsule fields — the issue body is public markdown", () => {
    const capsule = toCapsule({
      criteria: Array.from({ length: 40 }, (_, i) => `c${i}`),
      assumptions: ["```javascript evil"],
      readiness: "spec-complete",
      needsEric: "raises the `spend` cap",
    });

    expect(capsule.criteria).toHaveLength(12);
    expect(capsule.assumptions[0]).not.toContain("`");
    expect(capsule.needsEric).toBe("raises the 'spend' cap");
  });

  it("degrades a malformed capsule to the conservative reading rather than throwing", () => {
    expect(toCapsule(undefined)).toEqual({
      criteria: [],
      assumptions: [],
      outOfScope: [],
      readiness: "partial",
    });
    expect(toCapsule({ criteria: "not an array", readiness: "spec-complete" })).toMatchObject({
      readiness: "partial",
    });
  });

  it("degrades an unparseable reply to a question — the member just sees text, nothing breaks", () => {
    const result = parseCoachReply("Could you say more about which chart?");

    expect(result).toMatchObject({ ok: true, done: false });
  });

  // Six rounds, not three (2026-08-22). Three was too few to clear the completeness bar, and the
  // old nudge force-drafted regardless — manufacturing confident-looking capsules out of
  // unresolved asks, which downstream had only one exit: escalating to Eric.
  it("keeps asking through six member rounds before nudging toward a draft", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"question": "which page?"}'));
    });
    const rounds = (n: number) =>
      Array.from({ length: n }, (_, i) => [
        { role: "assistant" as const, content: `q${i}` },
        { role: "user" as const, content: `a${i}` },
      ]).flat();

    await coach({ kind: "idea", messages: [{ role: "user", content: "raw" }, ...rounds(3)] });

    expect(JSON.stringify(bodies[0])).not.toContain("asked enough questions");
  });

  // The cut-off demands HONESTY about the gaps rather than a confident guess — a truthful
  // "partial" routes the follow-up back to the member, never to Eric.
  it("at the cut-off asks for partial readiness rather than a guessed-full draft", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"draft": {"title": "t", "details": "d"}}'));
    });
    const messages = Array.from({ length: 6 }, (_, i) => [
      { role: "user" as const, content: `a${i}` },
      { role: "assistant" as const, content: `q${i}` },
    ]).flat();

    await coach({ kind: "idea", messages });

    const sent = JSON.stringify(bodies[0]);
    expect(sent).toContain("asked enough questions");
    expect(sent).toContain("partial");
    expect(sent).toContain("Do not guess it full");
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
