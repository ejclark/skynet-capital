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
    for (const symbol of ["TOOLONGX", "SP Y", "$SPY", 42, ".", "...", ".B"]) {
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

  it("refuses a text field that is not text as not text, never as too long", () => {
    expect(parseJournalPost({ kind: "experience", text: 123 })).toEqual({
      ok: false,
      reason: "Send what happened as words, and send it again.",
    });
    expect(parseJournalPost({ kind: "trade", whyIn: ["x"] })).toMatchObject({
      ok: false,
      reason: expect.stringContaining("why you're in as words"),
    });
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

  it("reads past an abbreviation instead of titling a wish with it", () => {
    expect(wishTitle("e.g. let me pin a bot to the leaderboard. Then more.")).toBe(
      "e.g. let me pin a bot to the leaderboard.",
    );
    expect(wishTitle("U.S. options should show the settlement style")).toBe(
      "U.S. options should show the settlement style",
    );
  });

  it("reads past a mid-sentence abbreviation, ellipsis or list number (#8261)", () => {
    for (const text of [
      "I wish the leaderboard showed my return vs. the bots over the same week.",
      "I wish I could sort the board by e.g. return or win rate.",
      "Could Moneypenny explain theta decay, i.e. why my option loses value?",
      "I really wish the chart... showed IV rank next to price.",
      "1. Show IV rank on the chart 2. Show my streak",
      "Compare my returns vs. Apple over the same week.",
      "Let the bot copy J. Smith style picks for a week",
    ]) {
      expect(wishTitle(text)).toBe(text);
    }
  });

  it("still ends at a real sentence break after an abbreviation was skipped", () => {
    expect(wishTitle("Show my return vs. the bots. Weekly would be best.")).toBe(
      "Show my return vs. the bots.",
    );
    expect(wishTitle("Could the chart show IV rank? would help a lot")).toBe(
      "Could the chart show IV rank?",
    );
  });

  it("marks with an ellipsis a title cut short of its sentence (#8261)", () => {
    const text =
      "I wish the leaderboard showed my return vs. the bots over the same week and the same tickers too.";
    const title = wishTitle(text);
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(WISH_TITLE_MAX_CHARS);
    expect(text.startsWith(title.slice(0, -1))).toBe(true);
  });

  it("never splits an emoji when it cuts", () => {
    const title = wishTitle(`${"a".repeat(70)}🚀🚀🚀`);
    expect(title).toBe(`${"a".repeat(70)}🚀…`);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(title)).toBe(false);
  });

  it("hard-cuts rather than leaving one word when the only space is near the front", () => {
    const title = wishTitle(`I ${"x".repeat(100)}`);
    expect(title.length).toBe(WISH_TITLE_MAX_CHARS);
    expect(title.startsWith("I xxx")).toBe(true);
  });

  it("hard-cuts a single word longer than the cap", () => {
    expect(wishTitle("a".repeat(100))).toBe(`${"a".repeat(WISH_TITLE_MAX_CHARS - 1)}…`);
  });
});
