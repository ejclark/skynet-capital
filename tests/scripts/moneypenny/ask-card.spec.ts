import { describe, expect, it } from "@rstest/core";
import { calloutIncompleteLine } from "../../../scripts/digest-scan.mjs";
import {
  askRank,
  assignmentComment,
  cardOf,
  missingParts,
  NO_DEFAULT_SILENCE,
  parseAsk,
} from "../../../scripts/moneypenny/ask-card.mjs";
import { withLaneAsk } from "../../../scripts/moneypenny/decision-callout.mjs";

// #6953 slice 3: the assignment comment carries the whole callout as a card, not its first line.
const FULL = [
  "> [!IMPORTANT]",
  "> **Needs from you**",
  "> 1. Keep the breaker latched until a session? — a bot safety rule",
  ">    - A (predicted, medium): re-arm at the next session",
  ">    - B: stay latched until you say so",
  ">    - On silence: stays latched; nothing is decided for you",
  ">    - Unblocks: #5730",
  "> 2. Allow tickers below the fit bar? — playbook rule",
  ">    - Predicted: C (low)",
  ">    - A: yes",
  ">    - C: log only",
].join("\n");

describe("parseAsk: a callout's whole ask", () => {
  it("reads options, the predicted option, the silence line and what it unblocks", () => {
    const [one, two] = parseAsk(FULL);
    expect(one).toMatchObject({
      question: "Keep the breaker latched until a session? — a bot safety rule",
      predicted: "A",
      confidence: "medium",
      onSilence: "stays latched; nothing is decided for you",
      unblocks: "#5730",
    });
    expect(one?.options.map((o) => o.key)).toEqual(["A", "B"]);
    expect(two).toMatchObject({ predicted: "C", confidence: "low", onSilence: null });
  });

  it("treats a bare one-line callout as one question with nothing else said", () => {
    const [only, ...rest] = parseAsk("> [!IMPORTANT]\n> **Needs from you**\n> Press the button.");
    expect(rest).toEqual([]);
    expect(only).toMatchObject({ question: "Press the button.", options: [], forecast: null });
  });

  it("takes a prose prediction from the body's Predicted answers table", () => {
    const body = `${FULL.split("\n> 2.")[0]}\n\n### Predicted answers\n\n| Ask | Predicted | A | S |\n|---|---|---|---|\n| 1 · breaker | A, re-arm (medium) | — | — |`;
    const body2 = body.replace(
      ">    - A (predicted, medium): re-arm at the next session",
      ">    - A: re-arm at the next session",
    );
    expect(parseAsk(body2)[0]?.forecast).toBe("A, re-arm (medium)");
  });
});

describe("assignmentComment: the card", () => {
  const body = assignmentComment({ items: parseAsk(FULL), more: 2 });

  it("carries every numbered question, each option and the prediction", () => {
    expect(body).toContain("> 1. Keep the breaker latched");
    expect(body).toContain("> 2. Allow tickers below the fit bar?");
    expect(body).toContain("| A (predicted, medium) | re-arm at the next session |");
    expect(body).toContain("| B | stay latched until you say so |");
    expect(body).toContain("| C (predicted, low) | log only |");
  });

  it("states what silence does, per question when the rules differ", () => {
    expect(body).toContain("On silence, 1: stays latched; nothing is decided for you");
    expect(body).toContain(`On silence, 2: ${NO_DEFAULT_SILENCE}`);
  });

  it("says how many asks wait and what to reply", () => {
    expect(body).toContain("2 more asks next batch.");
    expect(body).toContain("Reply one letter per question");
  });

  it("still assigns a thin callout, saying what it does not have", () => {
    const thin = assignmentComment({ decision: "Pick A or B? — why" });
    expect(thin).toContain("> Pick A or B? — why");
    expect(thin).toContain("Predicted: none recorded.");
    expect(thin).toContain(`On silence: ${NO_DEFAULT_SILENCE}`);
  });

  it("stops at three questions", () => {
    const five = parseAsk(
      [
        "> [!IMPORTANT]",
        "> **Needs from you**",
        ...[1, 2, 3, 4, 5].map((n) => `> ${n}. Q${n}?`),
      ].join("\n"),
    );
    expect(assignmentComment({ items: five })).not.toContain("Q4?");
  });

  it("carries a machine twin the reply reader trusts", () => {
    expect(cardOf(body)?.items.map((i) => i.keys)).toEqual([
      ["A", "B"],
      ["A", "C"],
    ]);
    expect(cardOf("no card here")).toBeNull();
  });

  it("tells a held-PR ask why the merge button may be missing, without claiming green", () => {
    const held = assignmentComment({ decision: "Merge this held PR.", heldPr: true });
    expect(held).toMatch(/checks are still running/);
    expect(held).not.toMatch(/green|protected/i);
  });
});

describe("missingParts and the digest's callout-incomplete line", () => {
  it("names what a callout leaves out", () => {
    expect(missingParts(parseAsk(FULL))).toEqual(["a silence line"]);
    expect(missingParts([])).toEqual(["a question"]);
  });

  it("lists the asks, or says every ask is whole", () => {
    expect(calloutIncompleteLine({ incomplete: [] })).toMatch(/full card/);
    const line = calloutIncompleteLine({
      incomplete: [{ number: 9, missing: ["options", "a prediction"] }],
    });
    expect(line).toContain("#9 lacks options, a prediction");
  });
});

describe("askRank: who goes first when asks outnumber the batch", () => {
  it("ranks a stop first, then the bot rules, then members, then internal", () => {
    expect(askRank({ labels: [{ name: "fast-track" }] })).toBe(1);
    expect(askRank({ title: "Let the breaker re-arm?" })).toBe(2);
    expect(askRank({ labels: ["feedback"], title: "Trade form copy" })).toBe(3);
    expect(askRank({ title: "Raise the debt gates?" })).toBe(4);
  });
});

describe("withLaneAsk writes the grammar the card reads", () => {
  it("round-trips options, prediction, silence and unblocks", () => {
    const written = withLaneAsk("Body.\n", "Pick A or B? — why", undefined, {
      options: [
        { key: "A", text: "do it", predicted: true, confidence: "medium" },
        { key: "B", text: "wait" },
      ],
      onSilence: "stays assigned",
      unblocks: "#12",
    });
    const [item] = parseAsk(written);
    expect(item).toMatchObject({
      predicted: "A",
      confidence: "medium",
      onSilence: "stays assigned",
      unblocks: "#12",
    });
    expect(item?.options).toHaveLength(2);
  });

  it("is unchanged for a lane that passes nothing", () => {
    expect(withLaneAsk("Body.\n", "Q?")).toContain("> 1. Q?");
    expect(withLaneAsk("Body.\n", "Q?")).not.toContain("Predicted");
  });
});
