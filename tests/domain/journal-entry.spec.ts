import {
  JOURNAL_FIELD_MAX_CHARS,
  parseJournalPost,
  WISH_TITLE_MAX_CHARS,
  wishTitle,
} from "../../src/domain/journal-entry.js";

/**
 * #8190: a journal entry is a wish (one text box, the member's words), an experience note, or a
 * trade note with at least one box filled. Over-long and empty are refused by the field's name.
 */

const long = "x".repeat(JOURNAL_FIELD_MAX_CHARS + 1);

describe("parseJournalPost", () => {
  it("takes a wish as its words alone, trimmed, asking for no kind, title or criteria", () => {
    expect(parseJournalPost({ kind: "wish", text: "  I wish it showed my streak.  " })).toEqual({
      ok: true,
      post: { kind: "wish", text: "I wish it showed my streak." },
    });
  });

  it("ignores fields outside the entry's own", () => {
    const parsed = parseJournalPost({ kind: "wish", text: "hi", title: "x", opaqueMemberId: "z" });
    expect(parsed).toEqual({ ok: true, post: { kind: "wish", text: "hi" } });
  });

  it("takes an experience note", () => {
    expect(parseJournalPost({ kind: "experience", text: "The fill came late." })).toEqual({
      ok: true,
      post: { kind: "experience", text: "The fill came late." },
    });
  });

  it("refuses an empty wish or note by name", () => {
    expect(parseJournalPost({ kind: "wish", text: "   " })).toEqual({
      ok: false,
      reason: "Write a few words for a wish first.",
    });
    expect(parseJournalPost({ kind: "experience" })).toMatchObject({
      ok: false,
      reason: expect.stringContaining("what happened"),
    });
  });

  it("refuses an over-long field by name, never trimming it to fit", () => {
    expect(parseJournalPost({ kind: "wish", text: long })).toEqual({
      ok: false,
      reason: "Keep a wish to 4,000 characters.",
    });
    expect(parseJournalPost({ kind: "trade", whyIn: "ok", learned: long })).toEqual({
      ok: false,
      reason: "Keep what you learned to 4,000 characters.",
    });
  });

  it("takes a trade note with any of its boxes, uppercasing the symbol", () => {
    expect(parseJournalPost({ kind: "trade", symbol: " brk.b ", leaveIf: "IV drops" })).toEqual({
      ok: true,
      post: { kind: "trade", symbol: "BRK.B", leaveIf: "IV drops" },
    });
    expect(parseJournalPost({ kind: "trade", symbol: "", learned: "size smaller" })).toEqual({
      ok: true,
      post: { kind: "trade", learned: "size smaller" },
    });
  });

  it("refuses an empty trade note, a symbol alone included", () => {
    const refusal = {
      ok: false,
      reason:
        "Write at least one of why you're in, what would make you leave, or what you learned.",
    };
    expect(parseJournalPost({ kind: "trade" })).toEqual(refusal);
    expect(parseJournalPost({ kind: "trade", symbol: "SPY", whyIn: "  " })).toEqual(refusal);
  });

  it("refuses a symbol that is not a ticker", () => {
    for (const symbol of ["TOOLONGX", "SP Y", "$SPY", 42]) {
      expect(parseJournalPost({ kind: "trade", symbol, whyIn: "x" })).toMatchObject({
        ok: false,
        reason: expect.stringContaining("symbol"),
      });
    }
  });

  it("refuses a missing or unknown kind instead of guessing", () => {
    expect(parseJournalPost({ text: "hi" }).ok).toBe(false);
    expect(parseJournalPost({ kind: "bug", text: "hi" }).ok).toBe(false);
  });

  it("refuses a text field that is not text", () => {
    expect(parseJournalPost({ kind: "wish", text: ["a"] }).ok).toBe(false);
  });
});

describe("wishTitle", () => {
  it("is the first sentence of the member's words", () => {
    expect(wishTitle("I wish the chart showed IV. It would help me.")).toBe(
      "I wish the chart showed IV.",
    );
  });

  it("stops at the first line", () => {
    expect(wishTitle("Streak counter\nso I can see how many days")).toBe("Streak counter");
  });

  it("does not split a decimal or a ticker's dot", () => {
    expect(wishTitle("Show BRK.B at 0.5 delta")).toBe("Show BRK.B at 0.5 delta");
  });

  it("cuts a long sentence at a word boundary, within the cap, marked with an ellipsis", () => {
    const text =
      "I wish the leaderboard let me compare my week against the bots that trade the same underlyings as me";
    const title = wishTitle(text);
    expect(title.length).toBeLessThanOrEqual(WISH_TITLE_MAX_CHARS);
    expect(title.endsWith("…")).toBe(true);
    expect(text.startsWith(title.slice(0, -1))).toBe(true);
    expect(title.slice(0, -1).endsWith(" ")).toBe(false);
  });

  it("hard-cuts a single word longer than the cap", () => {
    expect(wishTitle("a".repeat(100))).toBe(`${"a".repeat(WISH_TITLE_MAX_CHARS - 1)}…`);
  });
});
