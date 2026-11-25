import { readFileSync } from "node:fs";
import { describePage } from "../../src/companion/companion-page.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  BOARD_RANKINGS,
  LANDING_ROW_RULE,
  PLACE_LINK_RULE,
  PLACES,
  POSITION_ROW_RULE,
  placeHref,
  positionRow,
} from "../../src/companion/places.js";

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
      // Home is the root, `/` (#8189); every other place is a named segment.
      expect(path).toMatch(/^\/([a-z-]+(\/[a-z-]+)*)?$/);
      expect(path.startsWith("/app")).toBe(false);
    }
  });

  it("gives every place a name and a line on what is there, for the prompt to print", () => {
    for (const p of PLACES) {
      expect(p.name.trim()).not.toBe("");
      expect(p.what.trim()).not.toBe("");
    }
  });

  it("names a place the top bar has a tab for with the tab's own word (#8005: one place, one word)", () => {
    const root = readFileSync("app/src/routes/__root.tsx", "utf8");
    const tabs = [...root.matchAll(/<Link\s+to="([^"]+)"[^>]*>\s*([^<{]+?)\s*<\/Link>/g)].map(
      (m) => ({
        path: m[1],
        label: (m[2] ?? "").replace(/&amp;/g, "&"),
      }),
    );
    expect(tabs.map((t) => t.path)).toEqual(
      expect.arrayContaining(["/campaign", "/accounts", "/trade", "/research"]),
    );
    for (const tab of tabs) {
      const place = PLACES.find((p) => p.path === tab.path);
      if (place) expect(place.name).toBe(tab.label);
    }
  });

  it("includes the places the prompt's own examples send members to", () => {
    const paths = PLACES.map((p) => p.path);
    expect(paths).toEqual(expect.arrayContaining(["/trade", "/leaderboard", "/settings"]));
  });
});

// #8369: `/` became the home screen and Campaign moved to `/campaign` (#8189), but her list still
// named `/` as Campaign, so a Campaign link she wrote opened the home screen and `/campaign` was
// plain text. Her list and the Page line (`companion-page.ts`) must name the same page per path.
describe("PLACES — Campaign and the home screen after the move to /campaign (#8369)", () => {
  const named = (name: string) => PLACES.find((p) => p.name === name);

  it("sends Campaign to /campaign, a link she may write", () => {
    expect(named("Campaign")?.path).toBe("/campaign");
    expect(placeHref("/campaign")).toBe("/campaign");
  });

  it("names `/` as Home, the brand's own word for it, and never as Campaign", () => {
    expect(named("Home")?.path).toBe("/");
    expect(PLACE_LINK_RULE).not.toContain("/ (Campaign");
    expect(PLACE_LINK_RULE).toContain("/campaign (Campaign — ");
  });

  it("agrees with the Page line: each path names the page the server says the member is on", () => {
    expect(describePage(`/app${named("Campaign")?.path}`)).toContain("Campaign");
    expect(describePage(`/app${named("Home")?.path}`)).toContain("home screen");
  });

  it("keeps her landing-row links live, since those forward to Campaign on their own", () => {
    expect(placeHref("/#story-ai-capex")).toBe("/#story-ai-capex");
    expect(placeHref("/#calendar")).toBe("/#calendar");
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

// #7167: the page owns the numbers, she owns the pointers. Her link to a position meets the
// blotter row on one key, `/accounts#pos-<symbol>` (app/src/shell/position-anchor.ts).
describe("positionRow — a position's address on Profile", () => {
  it("is the blotter row's own anchor on /accounts, and an allowed link", () => {
    expect(positionRow("NVDA")).toBe("/accounts#pos-NVDA");
    expect(placeHref(positionRow("NVDA261218P00100000"))).toBe("/accounts#pos-NVDA261218P00100000");
  });

  it("names the account when it is given, so Profile never opens a default account instead (#7305)", () => {
    expect(positionRow("NVDA", "human-eric")).toBe("/accounts?account=human-eric#pos-NVDA");
    expect(positionRow("NVDA", "a b&c")).toBe("/accounts?account=a%20b%26c#pos-NVDA");
    expect(placeHref(positionRow("NVDA", "human-eric"))).toBe(
      "/accounts?account=human-eric#pos-NVDA",
    );
  });
});

describe("POSITION_ROW_RULE — link the row, never retype or compute its figures", () => {
  it("rides in her system prompt", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain(POSITION_ROW_RULE);
  });

  it("teaches the row link with the symbol exactly as her tool writes it", () => {
    expect(POSITION_ROW_RULE).toContain(`[your words](${positionRow("SYMBOL")})`);
    expect(POSITION_ROW_RULE).toContain(
      "exactly as get_my_positions or the Position line wrote it",
    );
  });

  it("caps a reply at 3 named positions, the rest as one link", () => {
    expect(POSITION_ROW_RULE).toContain("at most 3 positions");
    expect(POSITION_ROW_RULE).toContain("[N more on Profile](/accounts)");
  });

  it("quotes a figure verbatim from the tool and never computes one", () => {
    expect(POSITION_ROW_RULE).toContain("quote the tool's field verbatim (unrealizedPl");
    expect(POSITION_ROW_RULE).toContain("Never compute a P/L, a change, a percentage or a total");
  });
});

// #7167 slice 2: asked from the landing page, she links a story or an event's row by its key.
describe("the landing page's rows", () => {
  it("lets her link a story, an event and the calendar on the landing page", () => {
    expect(placeHref("/#story-ai-capex")).toBe("/#story-ai-capex");
    expect(placeHref("/#event-2026-11-10-coreweave-q3-results")).toBe(
      "/#event-2026-11-10-coreweave-q3-results",
    );
    expect(placeHref("/#calendar")).toBe("/#calendar");
  });

  it("still refuses a protocol-relative path dressed as the landing page", () => {
    expect(placeHref("//evil.com/#story-x")).toBeUndefined();
  });

  it("tells her to link the rows the On screen line lists, name at most 3, and not restate them", () => {
    expect(LANDING_ROW_RULE).toContain('"On screen" line');
    expect(LANDING_ROW_RULE).toContain("at most 3");
    expect(LANDING_ROW_RULE).toContain("(/#calendar)");
    expect(LANDING_ROW_RULE).toMatch(/Don't restate a date, price, percentage or dollar figure/);
    expect(COMPANION_SYSTEM_PROMPT).toContain(LANDING_ROW_RULE);
  });
});
