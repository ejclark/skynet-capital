import { findAccountCollisions } from "../../src/observatory/account-collisions.js";

describe("findAccountCollisions", () => {
  it("finds nothing when every account id is distinct", () => {
    const result = findAccountCollisions([
      { id: "sauron", accountId: "acct-1" },
      { id: "day-trader", accountId: "acct-2" },
    ]);
    expect(result).toEqual([]);
  });

  it("flags two participants that resolve to the same account", () => {
    const result = findAccountCollisions([
      { id: "sauron", accountId: "acct-1" },
      { id: "jarvis", accountId: "acct-1" },
    ]);
    expect(result).toEqual([{ accountId: "acct-1", ids: ["sauron", "jarvis"] }]);
  });

  it("groups three-way collisions into one entry", () => {
    const result = findAccountCollisions([
      { id: "a", accountId: "acct-1" },
      { id: "b", accountId: "acct-1" },
      { id: "c", accountId: "acct-1" },
    ]);
    expect(result).toEqual([{ accountId: "acct-1", ids: ["a", "b", "c"] }]);
  });

  it("ignores holders with no accountId — absence of information is not a confirmed collision", () => {
    const result = findAccountCollisions([
      { id: "sauron", accountId: undefined },
      { id: "day-trader", accountId: undefined },
    ]);
    expect(result).toEqual([]);
  });

  it("does not flag a single participant on its own account", () => {
    expect(findAccountCollisions([{ id: "sauron", accountId: "acct-1" }])).toEqual([]);
  });
});
