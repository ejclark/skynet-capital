import { readTowerMessage } from "../../src/three/kit/messages.js";

/**
 * What the tower's frame listens to (plan #3807 slice 3a, the panel's §4 contract). A message counts
 * only from our origin AND from the window that embeds us; anything else is ignored.
 */
const parent = { name: "the embedding page" };
const here = { origin: "https://skynet.test", parent };
const from = (data: unknown, over: { origin?: string; source?: unknown } = {}) => ({
  origin: over.origin ?? here.origin,
  source: "source" in over ? over.source : parent,
  data,
});

describe("readTowerMessage — who may speak", () => {
  const glance = { type: "tower:glance", x: -400, y: 20 };

  it("accepts a glance from the embedding page on our own origin", () => {
    expect(readTowerMessage(from(glance), here)).toEqual(glance);
  });

  it("ignores the same message from a window that is not our parent (a popup, a sibling frame)", () => {
    expect(readTowerMessage(from(glance, { source: { name: "another window" } }), here)).toBe(
      undefined,
    );
    expect(readTowerMessage(from(glance, { source: null }), here)).toBe(undefined);
  });

  it("ignores another origin, even from the parent", () => {
    expect(readTowerMessage(from(glance, { origin: "https://evil.test" }), here)).toBe(undefined);
  });
});

describe("readTowerMessage — the shapes", () => {
  it("reads a regard and a release", () => {
    expect(readTowerMessage(from({ type: "tower:regard", x: 1, y: 2 }), here)).toEqual({
      type: "tower:regard",
      x: 1,
      y: 2,
    });
    expect(readTowerMessage(from({ type: "tower:release" }), here)).toEqual({
      type: "tower:release",
    });
  });

  it("reads the live dials and the run switch", () => {
    expect(readTowerMessage(from({ type: "tower:mood", power: 0.8, health: -0.2 }), here)).toEqual({
      type: "tower:mood",
      power: 0.8,
      health: -0.2,
    });
    expect(readTowerMessage(from({ type: "tower:run", on: false }), here)).toEqual({
      type: "tower:run",
      on: false,
    });
  });

  it("drops anything malformed: non-finite points, missing dials, a string for a boolean", () => {
    for (const bad of [
      { type: "tower:glance", x: Number.NaN, y: 0 },
      { type: "tower:regard", x: 1 },
      { type: "tower:mood", power: 0.5 },
      { type: "tower:run", on: "false" },
      { type: "tower:flare", kind: "high" },
      "tower:glance",
      null,
    ]) {
      expect(readTowerMessage(from(bad), here)).toBe(undefined);
    }
  });

  it("reads a flare for a new high (slice 3b-3), with nothing but its kind", () => {
    expect(
      readTowerMessage(from({ type: "tower:flare", kind: "new-high", value: "$1M" }), here),
    ).toEqual({ type: "tower:flare", kind: "new-high" });
  });

  it("reads a flare for a fill of the member's own order (#3977 slice 3)", () => {
    expect(
      readTowerMessage(from({ type: "tower:flare", kind: "fill", orderId: "o-1" }), here),
    ).toEqual({ type: "tower:flare", kind: "fill" });
  });

  it("reads a flare for a milestone the member claimed (#3977 slice 3)", () => {
    expect(readTowerMessage(from({ type: "tower:flare", kind: "milestone" }), here)).toEqual({
      type: "tower:flare",
      kind: "milestone",
    });
  });

  it("ignores a flare of an unknown kind, or with no kind at all", () => {
    for (const kind of ["new-low", "NEW-HIGH", "FILL", "order.filled", "", 1, null, undefined]) {
      expect(readTowerMessage(from({ type: "tower:flare", kind }), here)).toBe(undefined);
    }
    expect(readTowerMessage(from({ type: "tower:flare" }), here)).toBe(undefined);
  });

  it("ignores a flare from another origin or from a window that is not our parent", () => {
    const flare = { type: "tower:flare", kind: "new-high" };
    expect(readTowerMessage(from(flare, { origin: "https://evil.test" }), here)).toBe(undefined);
    expect(readTowerMessage(from(flare, { source: { name: "a sibling frame" } }), here)).toBe(
      undefined,
    );
  });

  it("carries nothing across beyond the contract's own keys", () => {
    const m = readTowerMessage(from({ type: "tower:glance", x: 1, y: 2, account: "x" }), here);
    expect(Object.keys(m ?? {}).sort()).toEqual(["type", "x", "y"]);
  });
});
