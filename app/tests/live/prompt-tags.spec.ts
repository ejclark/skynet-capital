import {
  MAX_TAGS,
  type PromptTag,
  taggedKeys,
  taggedLine,
  usePromptTags,
  withTag,
} from "../../src/live/prompt-tags";

/**
 * ✎ TAGS (#7487 slice 3): what the member points at when they talk. Up to three, newest kept, a
 * repeat changes nothing; on send the labels lead the member's own line and the anchors ride as keys.
 */

const tag = (label: string, key?: string): PromptTag => (key ? { label, key } : { label });
const labels = (tags: readonly PromptTag[]) => tags.map((t) => t.label);

describe("withTag", () => {
  it("adds a tag at the end, in the order tapped", () => {
    const one = withTag([], tag("A"));
    expect(labels(one)).toEqual(["A"]);
    expect(labels(withTag(one, tag("B")))).toEqual(["A", "B"]);
  });

  it("is one tag per subject: the same key, or keyless the same words", () => {
    const tags = [tag("A", "story-1"), tag("B")];
    // Two calendar events can share a name; their keys tell them apart, so both are kept.
    expect(labels(withTag(tags, tag("A", "story-2")))).toEqual(["A", "B", "A"]);
    expect(withTag(tags, tag("A again", "story-1"))).toBe(tags);
    expect(withTag(tags, tag("B"))).toBe(tags);
  });

  it("keeps the newest three, dropping the oldest", () => {
    expect(MAX_TAGS).toBe(3);
    let tags: readonly PromptTag[] = [];
    for (const l of ["A", "B", "C", "D"]) tags = withTag(tags, tag(l));
    expect(labels(tags)).toEqual(["B", "C", "D"]);
    tags = withTag(tags, tag("E"));
    expect(labels(tags)).toEqual(["C", "D", "E"]);
  });

  it("does not mutate the list it was given", () => {
    const tags = [tag("A")];
    withTag(tags, tag("B"));
    expect(labels(tags)).toEqual(["A"]);
  });
});

describe("taggedLine", () => {
  it("leaves the text unchanged with no tags", () => {
    expect(taggedLine([], "what's moving?")).toBe("what's moving?");
  });

  it("leads with one subject", () => {
    expect(taggedLine([tag("Market · Energy (XLE)")], "why down?")).toBe(
      "✎ Market · Energy (XLE): why down?",
    );
  });

  it("joins several subjects with ' + ', in tag order", () => {
    expect(taggedLine([tag("A"), tag("B"), tag("C")], "compare")).toBe("✎ A + B + C: compare");
  });
});

describe("taggedKeys", () => {
  it("returns the anchors among the tags, skipping those without one, in order", () => {
    expect(taggedKeys([tag("A", "story-1"), tag("B"), tag("C", "event-x")])).toEqual([
      "story-1",
      "event-x",
    ]);
  });

  it("is empty with no tags or no keys", () => {
    expect(taggedKeys([])).toEqual([]);
    expect(taggedKeys([tag("A")])).toEqual([]);
  });
});

describe("usePromptTags store", () => {
  beforeEach(() => usePromptTags.setState({ tags: [], seq: 0 }));
  const state = () => usePromptTags.getState();

  it("add follows withTag and bumps seq on every tap, a repeat included", () => {
    state().add(tag("A"));
    expect(labels(state().tags)).toEqual(["A"]);
    expect(state().seq).toBe(1);
    state().add(tag("A"));
    expect(labels(state().tags)).toEqual(["A"]);
    expect(state().seq).toBe(2);
    for (const l of ["B", "C", "D"]) state().add(tag(l));
    expect(labels(state().tags)).toEqual(["B", "C", "D"]);
    expect(state().seq).toBe(5);
  });

  it("drop removes only the named tag and leaves seq alone", () => {
    for (const l of ["A", "B", "C"]) state().add(tag(l));
    state().drop("B");
    expect(labels(state().tags)).toEqual(["A", "C"]);
    state().drop("missing");
    expect(labels(state().tags)).toEqual(["A", "C"]);
    expect(state().seq).toBe(3);
  });

  it("clear drops every tag and leaves seq alone", () => {
    state().add(tag("A"));
    state().add(tag("B"));
    state().clear();
    expect(state().tags).toEqual([]);
    expect(state().seq).toBe(2);
  });
});
