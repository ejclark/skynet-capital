import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  createFeedbackCoach,
  parseCoachReply,
  resolveFeedbackCoach,
  toSpec,
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

  it("asks the model for the house capsule, not a wall of prose (docs/ISSUES.md)", async () => {
    let sent: { system?: string } = {};
    const coach = createFeedbackCoach({ apiKey: "k" }, (_method, _url, _headers, body) => {
      sent = body as { system?: string };
      return Promise.resolve(anthropicReply('{"question": "where?"}'));
    });

    await coach({ kind: "bug", messages: [{ role: "user", content: "chart bad" }] });

    const system = sent.system ?? "";
    expect(system).toContain("<details><summary><strong>The brief</strong></summary>");
    expect(system).toContain("max 120 chars");
    // #455 filed its whole note twice — the coach is told not to do that to a reader again.
    expect(system).toContain("never repeat the same sentence or paragraph twice");
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

  // The build spec is what earns the wide build envelope: a curated ask is treated as the SPEC and
  // built unattended. So "spec-complete" has to be earned, never merely asserted by the model —
  // a spec that falsely claims completeness is the one failure that reaches production.
  it("parses the build spec and marks it spec-complete only when criteria back the claim", () => {
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
      spec: {
        readiness: "spec-complete",
        criteria: ["When a member opens /feedback, the form shall span 900px."],
      },
    });
  });

  // The coach interrogates "where in the app" as part of its completeness bar, so the answer is
  // already in the conversation. Carrying it to the field is what stops every report arriving as
  // "Area: Somewhere else" — which is how both #449 and #455 themselves were filed.
  it("carries an area it recognises through to the form", () => {
    const result = parseCoachReply(
      JSON.stringify({
        draft: { title: "t", details: "d", area: "Trade", readiness: "partial" },
      }),
    );

    expect(result).toMatchObject({ done: true, area: "Trade" });
  });

  it("drops an area it does not recognise rather than pre-selecting the wrong spot", () => {
    // Conservative degrade, same rule toSpec applies: a wrong pre-selection is worse than none,
    // because the member has no reason to re-check a field that looks already answered.
    const result = parseCoachReply(
      JSON.stringify({
        draft: { title: "t", details: "d", area: "the vibes tab", readiness: "partial" },
      }),
    );

    expect(result).toMatchObject({ done: true });
    expect(result).not.toHaveProperty("area");
  });

  it("downgrades a spec-complete claim with no acceptance criteria to partial", () => {
    const result = parseCoachReply(
      '{"draft": {"title": "t", "details": "d", "readiness": "spec-complete"}}',
    );

    expect(result).toMatchObject({ done: true, spec: { readiness: "partial", criteria: [] } });
  });

  // The issue body is public markdown; a backtick in a capsule field would break the fenced block
  // the build lane parses, and an unbounded list would let one submission flood the issue.
  it("bounds and de-fences build-spec fields — the issue body is public markdown", () => {
    const spec = toSpec({
      criteria: Array.from({ length: 40 }, (_, i) => `c${i}`),
      assumptions: ["```javascript evil"],
      readiness: "spec-complete",
      needsEric: "raises the `spend` cap",
    });

    expect(spec.criteria).toHaveLength(12);
    expect(spec.assumptions[0]).not.toContain("`");
    expect(spec.needsEric).toBe("raises the 'spend' cap");
  });

  it("degrades a malformed spec to the conservative reading rather than throwing", () => {
    expect(toSpec(undefined)).toEqual({
      rounds: 0,
      criteria: [],
      assumptions: [],
      outOfScope: [],
      readiness: "partial",
    });
    expect(toSpec({ criteria: "not an array", readiness: "spec-complete" })).toMatchObject({
      readiness: "partial",
    });
  });

  it("degrades an unparseable reply to a question — the member just sees text, nothing breaks", () => {
    const result = parseCoachReply("Could you say more about which chart?");

    expect(result).toMatchObject({ ok: true, done: false });
  });

  // Six rounds, not three (2026-08-22). Three was too few to clear the completeness bar, and the
  // old nudge force-drafted regardless — manufacturing confident-looking specs out of
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

  // #1020 — a screenshot on the opening note should let the coach actually SEE the bug, not just
  // read a description of it.
  it("forwards an attached screenshot to the model as an image content block", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"question": "where?"}'));
    });
    const dataUrl = "data:image/png;base64,QQ==";

    await coach({
      kind: "bug",
      messages: [
        {
          role: "user",
          content: "chart bad",
          images: [{ name: "bug.png", type: "image/png", dataUrl }],
        },
      ],
    });

    const sent = bodies[0] as { messages: readonly { role: string; content: unknown }[] };
    expect(sent.messages[0]?.content).toEqual([
      { type: "image", source: { type: "base64", media_type: "image/png", data: "QQ==" } },
      { type: "text", text: "chart bad" },
    ]);
  });

  it("sends a plain string content for a turn with no images — unchanged wire shape", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"question": "where?"}'));
    });

    await coach({ kind: "bug", messages: [{ role: "user", content: "chart bad" }] });

    const sent = bodies[0] as { messages: readonly { content: unknown }[] };
    expect(sent.messages[0]?.content).toBe("chart bad");
  });

  it("reports an API failure honestly instead of pretending to coach", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve({ status: 429, body: { error: { message: "rate limited" } } }),
    );

    const result = await coach({ kind: "bug", messages: [{ role: "user", content: "hi" }] });

    expect(result).toMatchObject({ ok: false });
  });
});

// ROUTE THE MODEL BY WHO PAYS (Eric, 2026-08-22). The coach is the METERED lane — ANTHROPIC_API_KEY
// against api.anthropic.com, billed per token — so it takes the cheapest model that clears the bar.
// The expensive reasoning happens downstream in the build session, which is flat-rate.
describe("feedback coach — metered-lane economics", () => {
  it("asks the cheap model, on the wire", async () => {
    const bodies: unknown[] = [];
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      bodies.push(body);
      return Promise.resolve(anthropicReply('{"question": "where?"}'));
    });

    await coach({ kind: "bug", messages: [{ role: "user", content: "broken" }] });

    expect((bodies[0] as { model: string }).model).toBe("claude-haiku-4-5");
  });

  // THE PROPERTY THE CHEAP MODEL RESTS ON. A weaker model is likelier to malform the draft JSON, so
  // every degradation path must land on the conservative side: `partial`, which routes the follow-up
  // to the MEMBER, never a confident `spec-complete` that a build session would treat as a spec.
  it("degrades a weak model's slips to `partial`, never to a false spec-complete", async () => {
    const slips = [
      "{ not json at all",
      '{"draft": {"title": "t", "details": "d", "readiness": "spec-complete"}}',
      '{"draft": {"title": "t", "details": "d", "criteria": "should have been an array", "readiness": "spec-complete"}}',
    ];
    for (const slip of slips) {
      const coach = createFeedbackCoach({ apiKey: "k" }, () =>
        Promise.resolve(anthropicReply(slip)),
      );

      const result = await coach({ kind: "bug", messages: [{ role: "user", content: "x" }] });

      if ("done" in result && result.done) {
        expect(result.spec.readiness, `slip: ${slip}`).toBe("partial");
      } else {
        expect(result).toMatchObject({ ok: true, done: false });
      }
    }
  });

  // Eric asked how many questions it actually takes; nothing measured it. Now every curated issue
  // carries the answer, so the ceiling can next be set from the distribution instead of by argument.
  it("records how many rounds the draft actually took", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve(
        anthropicReply(
          '{"draft": {"title": "t", "details": "d", "criteria": ["The app shall X."], "readiness": "spec-complete"}}',
        ),
      ),
    );

    const result = await coach({
      kind: "feature",
      messages: [
        { role: "user", content: "raw" },
        { role: "assistant", content: "q1" },
        { role: "user", content: "a1" },
      ],
    });

    expect(result).toMatchObject({ done: true, spec: { rounds: 2 } });
  });
});
