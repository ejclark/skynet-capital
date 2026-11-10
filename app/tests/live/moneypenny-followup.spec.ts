import {
  FOLLOWUP_CHIPS,
  followupAnswerFor,
  followupCardText,
} from "../../src/live/moneypenny-followup";

// #7286 slice 8: the follow-up card's exits and text. Exact words only act on the card, so a
// question about it (or "send", the filing draft's word) never posts a follow-up.
describe("followupAnswerFor — exact words only", () => {
  it("reads the two chips, typed in any case with a trailing stop", () => {
    expect(followupAnswerFor("Post the follow-up")).toBe("post");
    expect(followupAnswerFor("  post the follow-up. ")).toBe("post");
    expect(followupAnswerFor("Not now!")).toBe("not-now");
  });

  it("reads anything else as a normal message", () => {
    for (const note of ["yes", "send", "post the follow-up on #7286 too", "ready"])
      expect(followupAnswerFor(note)).toBeUndefined();
  });

  it("offers the same two exits as chips", () => {
    expect(FOLLOWUP_CHIPS.map((c) => c.label)).toEqual(["Post the follow-up", "Not now"]);
  });
});

describe("followupCardText", () => {
  it("names the filing, quotes the words and says nothing is posted until the tap", () => {
    const text = followupCardText({
      issueNumber: 6007,
      title: "Chart freezes",
      details: "iPad too",
    });
    expect(text).toContain("Follow-up on #6007 · “Chart freezes”");
    expect(text).toContain("“iPad too”");
    expect(text).toContain("nothing is posted until you tap");
  });
});
