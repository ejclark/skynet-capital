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

  it("cuts a long name without leaving a trailing hyphen", () => {
    const key = editionEventKey({
      date: "2026-11-20",
      what: "Federal Reserve chair speaks at the economic club of new york",
    });
    expect(key.length).toBeLessThanOrEqual(51);
    expect(key).not.toMatch(/-$/);
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
