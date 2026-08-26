import type { Participant } from "../../src/participants/participant.js";
import { mergeRoster } from "../../src/participants/participant.js";

const envRow = (over: Partial<Participant> = {}): Participant => ({
  id: "human-eric",
  displayName: "Eric",
  kind: "human",
  credentials: { apiKey: "env-key", apiSecret: "env-secret" },
  ownerEmail: "eric@example.com",
  ...over,
});

const storeRow = (over: Partial<Participant> = {}): Participant => ({
  id: "human-eric",
  displayName: "Eric (stale copy)",
  kind: "human",
  credentials: { apiKey: "rotated-key", apiSecret: "rotated-secret" },
  ...over,
});

describe("mergeRoster", () => {
  // Regenerating a key in Alpaca REVOKES the old pair, so on a collision the store's
  // rotation-verified credentials must beat the env's — the env value is the dead one.
  it("lets a store row's credentials override the env row's on an id collision", () => {
    const [eric] = mergeRoster([envRow()], [storeRow()]);
    expect(eric?.credentials.apiKey).toBe("rotated-key");
  });

  it("keeps env identity — displayName, kind, owner link — over the store copy", () => {
    const [eric] = mergeRoster([envRow()], [storeRow({ ownerEmail: "someone@else.com" })]);
    expect(eric?.displayName).toBe("Eric");
    expect(eric?.ownerEmail).toBe("eric@example.com");
  });

  it("appends store-only rows after the env roster, untouched", () => {
    const joe = storeRow({ id: "human-joe", displayName: "Joe" });
    const merged = mergeRoster([envRow()], [joe]);
    expect(merged.map((p) => p.id)).toEqual(["human-eric", "human-joe"]);
    expect(merged[1]).toEqual(joe);
  });

  it("passes an env roster through unchanged when the store is empty", () => {
    expect(mergeRoster([envRow()], [])).toEqual([envRow()]);
  });
});
