import {
  createFollowupLane,
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

// #7286 slice 8 review: the tap is the member's only consent, so a draft the card could not show
// exactly as it posts never reaches the route, however it got onto the card.
describe("createFollowupLane — posts only what the card showed", () => {
  it("refuses a draft carrying a hidden link target, and sends nothing", async () => {
    const realFetch = globalThis.fetch;
    let fetched = 0;
    globalThis.fetch = (() => {
      fetched++;
      return Promise.reject(new Error("no network in this spec"));
    }) as typeof fetch;
    const said: string[] = [];
    try {
      const done = await createFollowupLane({
        say: async (lines) => void said.push(...lines),
      }).act("post", {
        issueNumber: 6007,
        title: "Chart freezes",
        details: "the [phone](moneypenny:hidden_words_here) too",
      });
      expect(done).toBe(true);
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(fetched).toBe(0);
    expect(said.join(" ")).toContain("nothing was posted");
  });
});
