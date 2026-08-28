import type { Collection, CollectionMember } from "../../src/discovery/collection.js";
import { collectionsJsonView } from "../../src/observatory/collections-json-view.js";

/** The discovery JSON twin: claims ride every shelf, desks resolve for personas only, absence
 *  stays explicit, and the unshelved section survives the trip. */

const member = (over: Partial<CollectionMember> = {}): CollectionMember => ({
  kind: "persona",
  id: "sauron",
  name: "Sauron",
  thesis: "watches one symbol, strikes on momentum",
  evidence: "probe: bought the breakout at +2.1%",
  ...over,
});

const shelf = (members: CollectionMember[]): Collection => ({
  id: "all-seeing",
  name: "The All-Seeing",
  claim: "every member holds at most one symbol at a time",
  blurb: "single-name obsessives",
  members,
});

describe("collectionsJsonView", () => {
  it("carries the claim on every shelf and resolves a persona's live desk", () => {
    const view = collectionsJsonView(
      [shelf([member()])],
      [],
      new Map([["sauron", { participantId: "sauron", displayName: "Sauron" }]]),
    );
    expect(view.collections[0]?.claim).toBe("every member holds at most one symbol at a time");
    expect(view.collections[0]?.members[0]?.desk).toEqual({ id: "sauron", name: "Sauron" });
  });

  it("renders absence explicitly — a persona nobody runs has NO desk, never a guess", () => {
    const view = collectionsJsonView([shelf([member({ id: "smaug" })])], [], new Map());
    expect(view.collections[0]?.members[0]?.desk).toBeUndefined();
  });

  it("never resolves a desk for a playbook — its link is the study it cites", () => {
    const view = collectionsJsonView(
      [shelf([member({ kind: "playbook", id: "s2-nvda", href: "/research/s2" })])],
      [],
      new Map([["s2-nvda", { participantId: "x", displayName: "X" }]]),
    );
    expect(view.collections[0]?.members[0]?.desk).toBeUndefined();
    expect(view.collections[0]?.members[0]?.href).toBe("/research/s2");
  });

  it("keeps the unshelved loud", () => {
    const view = collectionsJsonView([], [member({ id: "orphan" })], new Map());
    expect(view.unshelved).toHaveLength(1);
    expect(view.unshelved[0]?.id).toBe("orphan");
  });
});
