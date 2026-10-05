import { accountKind } from "../../src/server/account-kind.js";

/**
 * The bots-only gate's question (#4610). Falsifier for the store map's risk: a bot whose board
 * row has not loaded yet must never read as human (`settings-api-routes.ts` defaults it so).
 */
describe("accountKind", () => {
  it("takes the board's own kind when the row is there", () => {
    expect(accountKind("x", [{ id: "x", kind: "bot" }])).toBe("bot");
    expect(accountKind("sauron", [{ id: "sauron", kind: "human" }])).toBe("human");
  });

  it("reads a registered persona id as a bot when its row has not loaded", () => {
    expect(accountKind("sauron", [])).toBe("bot");
    expect(accountKind("news-fader", [{ id: "someone-else", kind: "human" }])).toBe("bot");
  });

  it("reads the human- prefix both human constructors stamp as human", () => {
    expect(accountKind("human-joe", [])).toBe("human");
  });

  it("answers unknown — not human — for anything else, so nothing is refused on a guess", () => {
    expect(accountKind("acct-mine", [])).toBeUndefined();
  });
});
