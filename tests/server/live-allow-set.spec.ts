import { liveAllowSet } from "../../src/server/auth/live-allow-set.js";

// The union view behind the invite gate. `Authenticator` touches these sets through `.has()` and
// `.size` only, so those two are the contract — if either drifts, someone either can't sign in or
// shouldn't be able to.
describe("live allow set", () => {
  it("admits identities from the fixed env list", () => {
    const set = liveAllowSet(new Set(["owner@example.com"]), () => new Set());
    expect(set.has("owner@example.com")).toBe(true);
    expect(set.has("stranger@example.com")).toBe(false);
  });

  it("admits identities added to the dynamic store", () => {
    const stored = new Set<string>();
    const set = liveAllowSet(new Set(["owner@example.com"]), () => stored, 0);
    expect(set.has("guest@example.com")).toBe(false);
    stored.add("guest@example.com");
    expect(set.has("guest@example.com")).toBe(true);
  });

  it("counts the union, without double-counting an address in both", () => {
    const set = liveAllowSet(
      new Set(["owner@example.com"]),
      () => new Set(["owner@example.com", "guest@example.com"]),
      0,
    );
    expect(set.size).toBe(2);
  });

  it("reports empty only when both sources are empty (the startup warning)", () => {
    expect(liveAllowSet(new Set(), () => new Set(), 0).size).toBe(0);
    expect(liveAllowSet(new Set(), () => new Set(["a@b.c"]), 0).size).toBe(1);
  });

  it("caches dynamic reads for the TTL, then refreshes", () => {
    let reads = 0;
    let clock = 1000;
    const set = liveAllowSet(
      new Set(),
      () => {
        reads++;
        return new Set(["guest@example.com"]);
      },
      5_000,
      () => clock,
    );
    set.has("x");
    set.has("y");
    expect(reads).toBe(1);
    clock += 6_000;
    set.has("z");
    expect(reads).toBe(2);
  });

  // The failure that matters: a broken store must not take the owner's access down with it.
  it("falls back to the env list when the dynamic read throws", () => {
    const set = liveAllowSet(
      new Set(["owner@example.com"]),
      () => {
        throw new Error("volume unreadable");
      },
      0,
    );
    expect(set.has("owner@example.com")).toBe(true);
    expect(set.has("guest@example.com")).toBe(false);
  });
});
