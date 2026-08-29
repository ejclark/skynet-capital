import { browseCollections, findCollection, unshelved } from "../../src/discovery/collections.js";
import { personaCollections } from "../../src/discovery/persona-collections.js";
import { playbookCollections } from "../../src/discovery/playbook-collections.js";

const collections = browseCollections();

describe("browseCollections", () => {
  it("puts the persona shelves first, then the dated plays", () => {
    expect(collections.map((c) => c.id)).toEqual([
      ...personaCollections().map((c) => c.id),
      ...playbookCollections().map((c) => c.id),
    ]);
  });

  it("gives every shelf a unique id, a name, a claim and a blurb", () => {
    const ids = collections.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const collection of collections) {
      expect(collection.name.length, `${collection.id} has no name`).toBeGreaterThan(0);
      expect(collection.claim.length, `${collection.id} has no claim`).toBeGreaterThan(0);
      expect(collection.blurb.length, `${collection.id} has no blurb`).toBeGreaterThan(0);
    }
  });

  it("shelves both catalogs — bots and plays reachable from one browse surface", () => {
    const kinds = new Set(collections.flatMap((c) => c.members.map((m) => m.kind)));

    expect([...kinds].sort()).toEqual(["persona", "playbook"]);
  });

  it("groups rather than flattens — no shelf holds the entire catalog", () => {
    const personaIds = new Set(
      collections.flatMap((c) => c.members.filter((m) => m.kind === "persona").map((m) => m.id)),
    );

    expect(personaIds.size).toBeGreaterThan(1);
    for (const collection of collections) {
      expect(collection.members.length).toBeLessThan(personaIds.size);
    }
  });
});

describe("findCollection", () => {
  it("resolves a shelf by id", () => {
    expect(findCollection("against-the-crowd", collections)?.name).toBe("Against the Crowd");
  });

  it("resolves nothing for an unknown or hostile id rather than guessing", () => {
    expect(findCollection("../../etc/passwd", collections)).toBeUndefined();
    expect(findCollection("", collections)).toBeUndefined();
  });
});

describe("unshelved", () => {
  it(
    "is empty for personas; TACO-DJT is the one honest playbook exception — event-driven, so " +
      "the calendar-window shelf probe can never find it a window to shelve",
    () => {
      expect(unshelved(collections).map((m) => m.id)).toEqual(["TACO-DJT"]);
    },
  );

  it("reports both catalogs' entries when nothing is shelved", () => {
    const kinds = new Set(unshelved([]).map((m) => m.kind));

    expect([...kinds].sort()).toEqual(["persona", "playbook"]);
  });
});
