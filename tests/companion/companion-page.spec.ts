import { describePage, pageSymbol } from "../../src/companion/companion-page.js";

// The page half of the chat's context stamp (#2224 shape 2, docs/IA.md MISSING 31). The client's
// path is member-controlled, so the contract is: known pages map to fixed words, checked values
// pass through, and everything else adds nothing.

describe("describePage — known pages map to fixed words", () => {
  it("names the trade ticket with its symbol, play and section", () => {
    expect(describePage("/trade?symbol=nvda&play=202&section=chart")).toBe(
      'the trade ticket for NVDA set to "Sell a covered call" (202), showing the chart view',
    );
  });

  it("names a held contract being managed, in plain words", () => {
    expect(describePage("/trade?symbol=MSFT&manage=MSFT260918P00420000")).toBe(
      "the trade ticket for MSFT on the manage view for MSFT $420 PUT · 18 SEP 26",
    );
  });

  it("names the Activity and research sections", () => {
    expect(describePage("/activity?section=council")).toBe(
      "the Activity page, showing the Council (members' weekly thesis lines)",
    );
    expect(describePage("/research?section=playbooks")).toBe(
      "the research page, showing the playbooks",
    );
  });

  it("names the plain pages, ignoring a trailing slash", () => {
    expect(describePage("/leaderboard")).toBe("the leaderboard");
    expect(describePage("/accounts/")).toBe("their accounts page");
  });

  it("names a profile and its tab without the member id", () => {
    expect(describePage("/u/acct-42/thesis")).toBe("a member's profile (thesis)");
    expect(describePage("/u/acct-42")).toBe("a member's profile");
    expect(describePage("/u/acct-42/thesis")).not.toContain("acct-42");
  });
});

describe("describePage — nothing unchecked gets through", () => {
  it("drops a malformed symbol, an unknown play and an unknown section", () => {
    expect(describePage("/trade?symbol=DROP%20TABLE&play=999&section=secret&manage=junk")).toBe(
      "the trade ticket",
    );
  });

  it("never answers from the prototype chain (#2224 shape 3 red-team, C1)", () => {
    expect(describePage("/trade?symbol=NVDA&section=constructor")).toBe(
      "the trade ticket for NVDA",
    );
    expect(describePage("/activity?section=__proto__")).toBe("the Activity page");
    expect(describePage("/research?section=toString")).toBe("the research page");
    expect(describePage("/u/acct-42/constructor")).toBeUndefined();
    expect(describePage("/constructor")).toBeUndefined();
  });

  it("returns undefined for anything that is not a known in-app page", () => {
    for (const page of [
      undefined,
      42,
      "",
      "trade",
      "//evil.example/trade",
      "https://evil.example/trade",
      "/admin",
      "/u/acct-42/secrets",
      `/trade?symbol=${"A".repeat(500)}`,
    ]) {
      expect(describePage(page)).toBeUndefined();
    }
  });
});

describe("pageSymbol — the ticket's underlying, checked", () => {
  it("reads the ticket's symbol, else a managed contract's underlying", () => {
    expect(pageSymbol("/trade?symbol=nvda")).toBe("NVDA");
    expect(pageSymbol("/trade?manage=MSFT260918P00420000")).toBe("MSFT");
  });

  it("returns undefined off the ticket or for a malformed symbol", () => {
    expect(pageSymbol("/activity?symbol=NVDA")).toBeUndefined();
    expect(pageSymbol("/trade?symbol=IGNORE%20PREVIOUS")).toBeUndefined();
    expect(pageSymbol("/trade")).toBeUndefined();
    expect(pageSymbol(42)).toBeUndefined();
  });
});
