import { toClaimAccounts } from "../../src/server/claim-form.js";

/**
 * Board participants → the claim surface's shape. Credentials never cross this boundary — only
 * id/displayName/kind/ownerEmail make the trip.
 */
describe("toClaimAccounts", () => {
  it("carries id, displayName and kind through unchanged", () => {
    const [account] = toClaimAccounts([{ id: "sauron", displayName: "Sauron", kind: "bot" }]);
    expect(account).toEqual({ id: "sauron", displayName: "Sauron", kind: "bot" });
  });

  it("includes ownerEmail only when the account actually has one", () => {
    const [linked, unlinked] = toClaimAccounts([
      { id: "human-ann", displayName: "Ann", kind: "human", ownerEmail: "ann@x.com" },
      { id: "human-bob", displayName: "Bob", kind: "human" },
    ]);
    expect(linked?.ownerEmail).toBe("ann@x.com");
    expect(unlinked && "ownerEmail" in unlinked).toBe(false);
  });
});
