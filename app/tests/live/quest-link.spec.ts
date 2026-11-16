import { withQuest } from "../../../src/domain/quest";
import { questOfPage, questSearch } from "../../src/live/quest-link";

/**
 * #7028 slice 6: the Trade route keeps `?quest=` only when it is a quest id, and the order helpers
 * read it back off the page's URL to send with the order.
 */

describe("questSearch", () => {
  it("keeps a quest id and drops anything else", () => {
    expect(questSearch({ quest: "conditions:QQQ:buy-shares" })).toEqual({
      quest: "conditions:QQQ:buy-shares",
    });
    expect(questSearch({ quest: 7 })).toEqual({});
    expect(questSearch({ quest: "javascript:alert(1)" })).toEqual({});
    expect(questSearch({})).toEqual({});
  });
});

describe("questOfPage", () => {
  it("reads back the id a quest's own link wrote", () => {
    const id = "position:CRWV261120C00090000:take-profit";
    const href = withQuest("/app/trade?desk=ann-1&symbol=CRWV&section=orders", id);
    expect(questOfPage(href.slice(href.indexOf("?")))).toEqual({ quest: id });
  });

  it("is empty on a ticket no quest opened", () => {
    expect(questOfPage("?desk=ann-1&symbol=QQQ")).toEqual({});
    expect(questOfPage("")).toEqual({});
  });
});
