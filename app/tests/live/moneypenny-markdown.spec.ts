import { formatTranscript } from "../../src/live/moneypenny";
import { plainReply, readMarkdown } from "../../src/live/moneypenny-markdown";

// #7166 — her replies carried `**CRWV earnings**`, asterisks and all. The rail reads a small
// subset as structure; nothing she writes shows a mark as a literal.
const words = (text: string) =>
  readMarkdown(text)
    .flatMap((b) => (b.kind === "lines" ? b.lines : b.items))
    .flatMap((l) => l.map((r) => r.text))
    .join("|");

describe("readMarkdown", () => {
  it("reads **x** as bold, the marks gone", () => {
    expect(readMarkdown("Watch **CRWV earnings** on Tuesday")).toEqual([
      {
        kind: "lines",
        lines: [
          [{ text: "Watch " }, { text: "CRWV earnings", strong: true }, { text: " on Tuesday" }],
        ],
      },
    ]);
  });

  it("reads __x__ as bold only at word edges, so snake_case survives", () => {
    expect(readMarkdown("a __big__ day")[0]).toEqual({
      kind: "lines",
      lines: [[{ text: "a " }, { text: "big", strong: true }, { text: " day" }]],
    });
    expect(words("see max__pain__level")).toBe("see max__pain__level");
  });

  it("reads *x* as italic, inside bold too, and never a multiplication", () => {
    expect(readMarkdown("**a *b* c**")[0]).toEqual({
      kind: "lines",
      lines: [
        [
          { text: "a ", strong: true },
          { text: "b", strong: true, em: true },
          { text: " c", strong: true },
        ],
      ],
    });
    expect(words("5 * 3 * 2")).toBe("5 * 3 * 2");
  });

  it("drops a stray ** — a reply still streaming in", () => {
    expect(words("the **CRWV")).toBe("the CRWV");
  });

  it("reads a leading # as a bold line, the marks gone", () => {
    expect(readMarkdown("## The plan\nbuy the dip")).toEqual([
      {
        kind: "lines",
        lines: [[{ text: "The plan", strong: true }], [{ text: "buy the dip" }]],
      },
    ]);
  });

  it("groups - and 1. lines into lists, keeping the number she started from", () => {
    expect(
      readMarkdown("Two things:\n\n- **CRWV** reports\n* NVDA after\n\n3. sell\n4. hold"),
    ).toEqual([
      { kind: "lines", lines: [[{ text: "Two things:" }]] },
      {
        kind: "list",
        ordered: false,
        start: 1,
        items: [[{ text: "CRWV", strong: true }, { text: " reports" }], [{ text: "NVDA after" }]],
      },
      { kind: "list", ordered: true, start: 3, items: [[{ text: "sell" }], [{ text: "hold" }]] },
    ]);
  });

  it("keeps link markup whole inside bold, and drops bold inside a link's words", () => {
    expect(words("**see [the board](/leaderboard)**")).toBe("see [the board](/leaderboard)");
    expect(words("[**open Trade**](/trade)")).toBe("[open Trade](/trade)");
  });

  it("leaves a plain reply exactly as it was", () => {
    expect(words("P/L is up 3% since /trade.")).toBe("P/L is up 3% since /trade.");
  });
});

describe("the copied thread", () => {
  it("is plain text: no marks, links as words, list items readable", () => {
    expect(plainReply("# Plan\n**[open Trade](/trade)** then:\n- buy\n- *wait*")).toBe(
      "Plan\nopen Trade then:\n- buy\n- wait",
    );
    expect(
      formatTranscript([
        { role: "user", text: "what about **CRWV**?" },
        { role: "mp", text: "**CRWV earnings** are Tuesday." },
      ]),
    ).toBe("You: what about **CRWV**?\n\nCRWV earnings are Tuesday.");
  });
});
