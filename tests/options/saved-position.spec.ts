import { parseSavedPositionsState } from "../../src/options/saved-position.js";

/** The saved-positions file's own shape gate (#3968) — a torn file or an old schema degrades to
 *  dropping the bad rows, never a throw (mirrors `subscription-state.ts`). */

const VALID = {
  id: "pos-1",
  symbol: "CRWV",
  name: "My Fidelity CRWV calls",
  stake: { shares: 400, costBasis: 70, goal: "income" },
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
};

describe("parseSavedPositionsState", () => {
  it("parses a well-formed file, cleaning each position's stake through the shared parser", () => {
    expect(parseSavedPositionsState({ "member-abc": [VALID] })).toEqual({
      "member-abc": [{ ...VALID, stake: { shares: 400, costBasis: 70, goal: "income" } }],
    });
  });

  it("drops a stake's untrusted fields the same way the browser's parser would", () => {
    const dirty = { ...VALID, stake: { shares: -5, goal: "yolo" } };
    expect(parseSavedPositionsState({ "member-abc": [dirty] })?.["member-abc"]?.[0]?.stake).toEqual(
      {},
    );
  });

  it("drops one malformed position without failing the rest of the file", () => {
    const malformed = { ...VALID, id: "" };
    const state = parseSavedPositionsState({ "member-abc": [VALID, malformed] });
    expect(state?.["member-abc"]).toHaveLength(1);
  });

  it("rejects a symbol that isn't a plain ticker", () => {
    const bad = { ...VALID, symbol: "not a ticker!" };
    expect(parseSavedPositionsState({ "member-abc": [bad] })).toEqual({});
  });

  it("rejects an over-long or blank name", () => {
    expect(
      parseSavedPositionsState({ "member-abc": [{ ...VALID, name: "x".repeat(61) }] }),
    ).toEqual({});
    expect(parseSavedPositionsState({ "member-abc": [{ ...VALID, name: "   " }] })).toEqual({});
  });

  it("drops an account with no valid positions left, rather than keeping an empty array", () => {
    expect(parseSavedPositionsState({ "member-abc": [{ ...VALID, id: "" }] })).toEqual({});
  });

  it("degrades to null (caller falls back to EMPTY_SAVED_POSITIONS) on a torn or hostile file", () => {
    expect(parseSavedPositionsState(null)).toBeNull();
    expect(parseSavedPositionsState("nonsense")).toBeNull();
    expect(parseSavedPositionsState([VALID])).toBeNull();
  });
});
