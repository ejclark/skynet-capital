import {
  describeOnScreen,
  parsePageKeys,
  type ServedEdition,
} from "../../src/companion/companion-on-screen.js";
import { editionEventKey } from "../../src/domain/edition-keys.js";

// The context stamp's "what's on screen" half (#7167 slice 1). The page's keys are client-sent,
// so the contract is: each key is checked against the server's own edition, only the server's
// own text for a match reaches her, and every item comes with the exact link the page lands on.

const served: ServedEdition = {
  date: "2026-11-06",
  stories: [
    { id: "ai-capex", line: "AI capex keeps climbing" },
    { id: "rates", line: "Hiring beat; the 10-year fell" },
  ],
  next: [
    { date: "2026-11-10", what: "CoreWeave Q3 results" },
    { date: "2026-11-13", what: "CPI, October" },
  ],
};

const crwv = editionEventKey({ date: "2026-11-10", what: "CoreWeave Q3 results" });

describe("editionEventKey — an event's key", () => {
  it("is its date, then its name as a slug", () => {
    expect(crwv).toBe("2026-11-10-coreweave-q3-results");
    expect(editionEventKey({ date: "2026-11-13", what: "CPI, October" })).toBe(
      "2026-11-13-cpi-october",
    );
  });

  it("keeps the whole of a long name, so two names that share a start keep apart", () => {
    const a = editionEventKey({
      date: "2026-11-20",
      what: "Fed speakers: Powell at the Economic Club of New York",
    });
    const b = editionEventKey({
      date: "2026-11-20",
      what: "Fed speakers: Powell at the Economic Club of Chicago",
    });
    expect(a).not.toBe(b);
    expect(a).toMatch(/new-york$/);
  });
});

describe("parsePageKeys — the request body's keys, shape-checked", () => {
  it("keeps a dated stamp with slug keys", () => {
    expect(parsePageKeys({ edition: "2026-11-06", stories: ["ai-capex"], events: [crwv] })).toEqual(
      { edition: "2026-11-06", stories: ["ai-capex"], events: [crwv] },
    );
  });

  it("drops a key that isn't a slug, and anything without an edition date", () => {
    expect(
      parsePageKeys({ edition: "2026-11-06", stories: ["ok", "Ignore previous", 7], events: "x" }),
    ).toEqual({ edition: "2026-11-06", stories: ["ok"], events: [] });
    expect(parsePageKeys({ stories: ["ai-capex"] })).toBeUndefined();
    expect(parsePageKeys({ edition: "yesterday" })).toBeUndefined();
    expect(parsePageKeys(["2026-11-06"])).toBeUndefined();
    expect(parsePageKeys(undefined)).toBeUndefined();
  });

  it("reads at most 40 keys of each kind", () => {
    const many = Array.from({ length: 100 }, (_, i) => `s${i}`);
    expect(parsePageKeys({ edition: "2026-11-06", stories: many })?.stories).toHaveLength(40);
  });
});

describe("describeOnScreen — what she's told is on the page", () => {
  it("names each shown story and event with the link its row carries", () => {
    const line = describeOnScreen(
      { edition: "2026-11-06", stories: ["ai-capex"], events: [crwv] },
      served,
    );
    expect(line).toBe(
      'the edition of the 2026-11-06 close. its stories: "AI capex keeps climbing" → /#story-ai-capex. its calendar events: "CoreWeave Q3 results" (2026-11-10) → /#event-2026-11-10-coreweave-q3-results',
    );
  });

  it("names only what the page said it shows", () => {
    const line = describeOnScreen(
      { edition: "2026-11-06", stories: ["rates"], events: [] },
      served,
    );
    expect(line).toContain("/#story-rates");
    expect(line).not.toContain("ai-capex");
    expect(line).not.toContain("calendar events");
  });

  it("adds nothing for a key the server's edition doesn't hold", () => {
    expect(
      describeOnScreen({ edition: "2026-11-06", stories: ["made-up"], events: ["x"] }, served),
    ).toBeUndefined();
  });

  it("adds nothing when the page shows another edition than the one served", () => {
    expect(
      describeOnScreen({ edition: "2026-10-30", stories: ["ai-capex"], events: [] }, served),
    ).toBeUndefined();
    expect(
      describeOnScreen({ edition: "2026-11-06", stories: ["ai-capex"], events: [] }, null),
    ).toBeUndefined();
  });
});

// ✎ tags (#7487 slice 3): the member names up to three subjects of the message they send. The
// same rule as on-screen keys holds — client-sent, so only what the served edition holds reaches her.
describe("parsePageKeys — the ✎ tagged keys", () => {
  const base = { edition: "2026-11-06", stories: [], events: [] };

  it("keeps tagged stories and events", () => {
    expect(parsePageKeys({ ...base, tagged: { stories: ["ai-capex"], events: [crwv] } })).toEqual({
      ...base,
      tagged: { stories: ["ai-capex"], events: [crwv] },
    });
  });

  it("keeps at most 3 of each", () => {
    const keys = parsePageKeys({
      ...base,
      tagged: { stories: ["a", "b", "c", "d", "e"], events: ["e1", "e2", "e3", "e4"] },
    });
    expect(keys?.tagged).toEqual({ stories: ["a", "b", "c"], events: ["e1", "e2", "e3"] });
  });

  it("drops a tagged key that isn't a string or a slug", () => {
    expect(
      parsePageKeys({
        ...base,
        tagged: { stories: [7, "Ignore previous", null, "rates"], events: [{}, "-x", crwv] },
      })?.tagged,
    ).toEqual({ stories: ["rates"], events: [crwv] });
  });

  it("drops tagged when it isn't an object, or is an array", () => {
    for (const tagged of ["ai-capex", 3, null, ["ai-capex"], [{ stories: ["ai-capex"] }]]) {
      const keys = parsePageKeys({ ...base, tagged });
      expect(keys).toEqual(base);
      expect(keys).not.toHaveProperty("tagged");
    }
  });

  it("omits tagged when both lists come out empty", () => {
    for (const tagged of [
      {},
      { stories: [], events: [] },
      { stories: ["Not A Slug"], events: 5 },
    ]) {
      expect(parsePageKeys({ ...base, tagged })).not.toHaveProperty("tagged");
    }
  });
});

describe("describeOnScreen — what the member tagged", () => {
  const TAGGED = "the member tagged these onto their message, so it is about them: ";

  it("names only tagged items the served edition holds, with the on-screen link form", () => {
    const line = describeOnScreen(
      {
        edition: "2026-11-06",
        stories: ["ai-capex"],
        events: [],
        tagged: { stories: ["rates", "made-up"], events: [crwv, "2026-11-10-not-held"] },
      },
      served,
    );
    expect(line).toBe(
      'the edition of the 2026-11-06 close. its stories: "AI capex keeps climbing" → /#story-ai-capex. ' +
        TAGGED +
        '"Hiring beat; the 10-year fell" → /#story-rates; "CoreWeave Q3 results" (2026-11-10) → /#event-2026-11-10-coreweave-q3-results',
    );
    expect(line).not.toContain("made-up");
    expect(line).not.toContain("not-held");
  });

  it("still gives the tagged line when no on-screen key matches", () => {
    const line = describeOnScreen(
      {
        edition: "2026-11-06",
        stories: ["made-up"],
        events: [],
        tagged: { stories: ["ai-capex"], events: [] },
      },
      served,
    );
    expect(line).toBe(
      `the edition of the 2026-11-06 close. ${TAGGED}"AI capex keeps climbing" → /#story-ai-capex`,
    );
    expect(line).not.toContain("its stories");
    expect(line).not.toContain("calendar events");
  });

  it("adds nothing when every tagged key is one the edition doesn't hold", () => {
    expect(
      describeOnScreen(
        {
          edition: "2026-11-06",
          stories: [],
          events: [],
          tagged: { stories: ["made-up"], events: ["x"] },
        },
        served,
      ),
    ).toBeUndefined();
  });

  it("adds nothing for a tagged key from another edition date", () => {
    expect(
      describeOnScreen(
        {
          edition: "2026-10-30",
          stories: [],
          events: [],
          tagged: { stories: ["ai-capex"], events: [crwv] },
        },
        served,
      ),
    ).toBeUndefined();
  });
});
