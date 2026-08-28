import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createFeedbackCoach } from "../../src/server/feedback-coach.js";
import {
  GARBLED_REPLY,
  parseCoachReply,
  repeatsLastQuestion,
  salvageTruncatedDraft,
  stalledDraft,
} from "../../src/server/feedback-coach-reply.js";

const anthropicReply = (text: string): JsonResponse => ({
  status: 200,
  body: { content: [{ type: "text", text }] },
});

// #702, reported by a member: the draft is the one large reply the coach ever writes, so it can run
// past the token cap mid-`details`. The old degrade showed that raw blob as the next question, the
// member answered it, and the model re-drafted into the same wall — a loop with no exit.
describe("feedback coach reply recovery", () => {
  const truncated =
    '{"draft": {"title": "Add limit and stop-market orders with an Open Orders panel", "details": "- Paper trading supports only market orders today\\n- Pending orders stay open until fil';

  it("recovers a truncated draft instead of echoing it back as a question", () => {
    const result = parseCoachReply(truncated, 3);

    expect(result).toMatchObject({
      ok: true,
      done: true,
      title: "Add limit and stop-market orders with an Open Orders panel",
    });
    expect((result as { details: string }).details).toContain("Pending orders stay open");
  });

  it("marks a recovered draft partial and names the truncation as an assumption", () => {
    const result = parseCoachReply(truncated, 3) as {
      spec: { readiness: string; assumptions: readonly string[] };
    };

    expect(result.spec.readiness).toBe("partial");
    expect(result.spec.assumptions.join(" ")).toContain("cut off mid-write");
  });

  // Truncation usually lands inside the capsule's fold; an unclosed <details> would swallow every
  // template section below it in the filed issue.
  it("closes a fold the cut-off draft left open", () => {
    const cut =
      '{"draft": {"title": "t", "details": "- a bullet\\n\\n<details><summary><strong>The brief</strong></summary>\\n\\n**What**\\nhalf a sen';

    const details = salvageTruncatedDraft(cut)?.details ?? "";

    expect(details.match(/<details>/g)).toHaveLength(1);
    expect(details.match(/<\/details>/g)).toHaveLength(1);
    expect(details.trimEnd().endsWith("</details>")).toBe(true);
  });

  it("salvages nothing from text that was never a draft", () => {
    expect(salvageTruncatedDraft('{"question": "which page?"}')).toBeNull();
    expect(salvageTruncatedDraft('{"draft": {"details": "no title here')).toBeNull();
  });

  // The member's words: "the structured output was accidentally being exposed to me". Whatever else
  // goes wrong, raw machine shape is never what a member is asked to respond to.
  it("never shows a member structured output it could not salvage", () => {
    const result = parseCoachReply('{"draft": {"criteria": ["a", "b"');

    expect(result).toEqual({ ok: true, done: false, question: GARBLED_REPLY });
  });

  it("still passes plain prose through — a readable reply is readable", () => {
    const result = parseCoachReply("Which page were you on when it happened?");

    expect(result).toEqual({
      ok: true,
      done: false,
      question: "Which page were you on when it happened?",
    });
  });

  it("reads a repeated question as a stall, whitespace and case aside", () => {
    const messages = [
      { role: "user" as const, content: "orders are limited" },
      { role: "assistant" as const, content: "Where should Open Orders live?" },
      { role: "user" as const, content: "the trade page" },
    ];

    expect(repeatsLastQuestion(messages, "where   should Open Orders LIVE?")).toBe(true);
    expect(repeatsLastQuestion(messages, "How should stops behave?")).toBe(false);
    expect(repeatsLastQuestion([], "anything")).toBe(false);
  });

  it("ends a stalled conversation with a draft built from the member's own words", () => {
    const result = stalledDraft(
      [
        { role: "user", content: "Limit orders are missing from paper trading" },
        { role: "assistant", content: "Where should Open Orders live?" },
        { role: "user", content: "On the trade page" },
      ],
      2,
    ) as { done: boolean; title: string; details: string; spec: { readiness: string } };

    expect(result.done).toBe(true);
    expect(result.title).toBe("Limit orders are missing from paper trading");
    expect(result.details).toContain("> Limit orders are missing from paper trading");
    expect(result.details).toContain("**Coach asked:** Where should Open Orders live?");
    expect(result.details).toContain("**Member answered:** On the trade page");
    // The capsule's single fold has to survive member prose (docs/ISSUES.md).
    expect(result.details.match(/<details>/g)).toHaveLength(1);
    expect(result.spec.readiness).toBe("partial");
  });

  it("strips a fold marker a member typed, so the capsule keeps exactly one", () => {
    const result = stalledDraft([
      { role: "user", content: "the </details> tag broke my page" },
    ]) as { details: string };

    expect(result.details.match(/<\/details>/g)).toHaveLength(1);
  });

  it("turns a repeated question from the model into the stall exit, not another round", async () => {
    const coach = createFeedbackCoach({ apiKey: "k" }, () =>
      Promise.resolve(anthropicReply('{"question": "Where should Open Orders live?"}')),
    );

    const result = await coach({
      kind: "feature",
      messages: [
        { role: "user", content: "Limit orders are missing" },
        { role: "assistant", content: "Where should Open Orders live?" },
        { role: "user", content: "the trade page" },
      ],
    });

    expect(result).toMatchObject({ ok: true, done: true });
  });

  it("tells the model to keep the draft short — the prevention under the recovery net", async () => {
    let sent: { system?: string } = {};
    const coach = createFeedbackCoach({ apiKey: "k" }, (_m, _u, _h, body) => {
      sent = body as { system?: string };
      return Promise.resolve(anthropicReply('{"question": "where?"}'));
    });

    await coach({ kind: "bug", messages: [{ role: "user", content: "orders" }] });

    expect(sent.system ?? "").toContain("SIZE DISCIPLINE");
  });
});
