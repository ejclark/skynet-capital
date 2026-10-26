import { BOARD_RANKINGS, PLACE_LINK_RULE, PLACES, placeHref } from "../../src/companion/places.js";

// #5238 — the one allow-list of places Moneypenny may link. The panel's link check and the chat
// prompt both read it; a path not on it never becomes a link, so her words stay plain text.
// (The app-side pairing with the router and the Leaderboard lives in app/tests/live/.)

describe("placeHref — which paths she may link", () => {
  describe("when the path is a route on the list", () => {
    it.each(PLACES.map((p) => p.path))("returns %s untouched", (path) => {
      expect(placeHref(path)).toBe(path);
    });

    it("keeps a query string, because each route validates its own search", () => {
      expect(placeHref("/leaderboard?by=return")).toBe("/leaderboard?by=return");
      expect(placeHref("/trade?play=101&mode=guided")).toBe("/trade?play=101&mode=guided");
    });

    it("keeps a fragment, judging only the path before it", () => {
      expect(placeHref("/settings#keys")).toBe("/settings#keys");
      expect(placeHref("/research?symbol=NVDA#calls")).toBe("/research?symbol=NVDA#calls");
    });

    it("lets an unknown query value ride along — the route drops what it doesn't know", () => {
      expect(placeHref("/leaderboard?by=nonsense")).toBe("/leaderboard?by=nonsense");
    });
  });

  describe("when the path is not exactly a route on the list", () => {
    it("refuses a deeper path, a longer name, or a trailing slash", () => {
      expect(placeHref("/trade/x")).toBeUndefined();
      expect(placeHref("/tradex")).toBeUndefined();
      expect(placeHref("/trade/")).toBeUndefined();
      expect(placeHref("/learn/trading/extra")).toBeUndefined();
    });

    it("refuses a route the app does not have", () => {
      expect(placeHref("/vault")).toBeUndefined();
      expect(placeHref("/admin")).toBeUndefined();
    });

    it("is case-sensitive, like the router", () => {
      expect(placeHref("/Trade")).toBeUndefined();
      expect(placeHref("/LEADERBOARD?by=pl")).toBeUndefined();
    });

    it("refuses the app basepath form, since the list is the paths WITHOUT /app", () => {
      expect(placeHref("/app/trade")).toBeUndefined();
    });

    it("refuses anything that could leave the app", () => {
      expect(placeHref("//evil.com")).toBeUndefined();
      expect(placeHref("//evil.com/trade")).toBeUndefined();
      expect(placeHref("https://example.com/trade")).toBeUndefined();
      expect(placeHref("javascript:alert(1)")).toBeUndefined();
      expect(placeHref("/\\evil.com")).toBeUndefined();
    });

    it("refuses a relative path, an empty one, and a bare query or fragment", () => {
      expect(placeHref("trade")).toBeUndefined();
      expect(placeHref("")).toBeUndefined();
      expect(placeHref("?by=pl")).toBeUndefined();
      expect(placeHref("#trade")).toBeUndefined();
    });

    it("refuses a good route that carries whitespace anywhere, even inside the query", () => {
      expect(placeHref("/trade ")).toBeUndefined();
      expect(placeHref(" /trade")).toBeUndefined();
      expect(placeHref("/trade?play=1 01")).toBeUndefined();
      expect(placeHref("/trade\n/settings")).toBeUndefined();
      expect(placeHref("/trade#a\tb")).toBeUndefined();
    });

    it("does not let a good route hide behind a query on a bad one", () => {
      expect(placeHref("/vault?next=/trade")).toBeUndefined();
      expect(placeHref("/vault#/trade")).toBeUndefined();
    });
  });
});

describe("PLACES — the list itself", () => {
  it("names each route once", () => {
    const paths = PLACES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("holds router paths: rooted, with no basepath, query or fragment", () => {
    for (const { path } of PLACES) {
      expect(path).toMatch(/^\/[a-z-]+(\/[a-z-]+)*$/);
      expect(path.startsWith("/app")).toBe(false);
    }
  });

  it("gives every place a name and a line on what is there, for the prompt to print", () => {
    for (const p of PLACES) {
      expect(p.name.trim()).not.toBe("");
      expect(p.what.trim()).not.toBe("");
    }
  });

  it("includes the places the prompt's own examples send members to", () => {
    const paths = PLACES.map((p) => p.path);
    expect(paths).toEqual(expect.arrayContaining(["/trade", "/leaderboard", "/settings"]));
  });
});

describe("BOARD_RANKINGS — the Leaderboard's ?by= values", () => {
  it("lists each ranking once, with a label a member would read", () => {
    const keys = BOARD_RANKINGS.map((r) => r.by);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of BOARD_RANKINGS) expect(r.label.trim()).not.toBe("");
  });

  it("leads with equity, the board's default ranking", () => {
    expect(BOARD_RANKINGS[0]?.by).toBe("equity");
  });

  it("makes every ranking a link she may use on the Leaderboard", () => {
    for (const r of BOARD_RANKINGS) {
      expect(placeHref(`/leaderboard?by=${r.by}`)).toBe(`/leaderboard?by=${r.by}`);
    }
  });
});

describe("PLACE_LINK_RULE — what the prompt tells the model", () => {
  it("teaches the [words](/path) form with examples that are themselves allowed links", () => {
    expect(PLACE_LINK_RULE).toContain("[your words](/path)");
    const examples = [...PLACE_LINK_RULE.matchAll(/\[[^\]]+\]\((\/[^)\s]*)\)/g)]
      .map((m) => m[1] ?? "")
      .filter((e) => e !== "/path");
    expect(examples.length).toBeGreaterThan(0);
    for (const e of examples) expect(placeHref(e)).toBe(e);
  });

  it("hands over every place — path, name and what is there", () => {
    for (const p of PLACES) expect(PLACE_LINK_RULE).toContain(`${p.path} (${p.name} — ${p.what})`);
  });

  it("hands over every Leaderboard ranking with its label", () => {
    for (const r of BOARD_RANKINGS) expect(PLACE_LINK_RULE).toContain(`${r.by} (${r.label})`);
  });

  it("tells her never to make up a path, since anything else shows as plain text", () => {
    expect(PLACE_LINK_RULE).toContain("Use ONLY these paths, never one you make up");
    expect(PLACE_LINK_RULE).toContain("anything else shows as plain text");
  });

  it("keeps the honesty rule: a link goes somewhere and does nothing, and a ticket link never orders", () => {
    expect(PLACE_LINK_RULE).toContain("lands on the review screen, never an order");
    expect(PLACE_LINK_RULE).toContain("never word it as if tapping it did anything");
  });
});
