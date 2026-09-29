import { act, render, screen } from "@testing-library/react";
import { usePrefs } from "../../src/shell/prefs";
import { cardShowsArt, SauronCard, towerSrc } from "../../src/shell/sauron-card";

// The league reads the board over the network; these cases are about the art column only.
rstest.mock("../../src/shell/league-card", () => ({
  LeagueCard: () => <p>the league</p>,
}));

/** The character card's tower: always the card framing; the dials only when the account has a landmark. */
describe("towerSrc", () => {
  it("frames the tower for the card", () => {
    expect(towerSrc()).toBe("/tower?frame=card");
  });

  it("passes a landmark's own dials through, so its tower reflects its standing and P/L", () => {
    expect(towerSrc({ power: 0.62, health: -0.3 })).toBe(
      "/tower?frame=card&power=0.620&health=-0.300",
    );
  });

  it("asks the scene for rest=still when the member stills the tower (#3807 slice 3b-1)", () => {
    expect(towerSrc(undefined, "still")).toBe("/tower?frame=card&rest=still");
    expect(towerSrc({ power: 0.62, health: -0.3 }, "still")).toBe(
      "/tower?frame=card&power=0.620&health=-0.300&rest=still",
    );
    expect(towerSrc(undefined, "live")).toBe("/tower?frame=card");
  });
});

/** `useMediaQuery` reads `matchMedia`; happy-dom has none (a wide, motion-allowing default). */
function phoneWidth(matches: boolean): () => void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: matches && query.includes("max-width: 860px"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  return () => Reflect.deleteProperty(window, "matchMedia");
}

const card = (besideHead: boolean) => (
  <SauronCard ownedIds={["a1"]} meId="a1" scope=".cockpit" besideHead={besideHead} />
);

describe("the card compare (#3807 slice 3b-1: ?card=art|league, under the flag)", () => {
  afterEach(() =>
    act(() => {
      usePrefs.getState().setShell(undefined);
      usePrefs.getState().setCard("art");
      usePrefs.getState().setCrest("live");
    }),
  );

  it("draws the art only where a second tower would not stand beside the head's", () => {
    const at = { besideHead: true, flag: true, card: "league", phone: false } as const;
    expect(cardShowsArt(at)).toBe(false);
    expect(cardShowsArt({ ...at, phone: true })).toBe(true);
    expect(cardShowsArt({ ...at, flag: false })).toBe(true);
    expect(cardShowsArt({ ...at, card: "art" })).toBe(true);
    expect(cardShowsArt({ ...at, besideHead: false })).toBe(true);
  });

  it("league, on the Overview, wider than a phone: the league alone, no second tower frame", () => {
    act(() => {
      usePrefs.getState().setShell("watchtower");
      usePrefs.getState().setCard("league");
    });
    const { container } = render(card(true));
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("region", { name: "The league" })).toBeInTheDocument();
    expect(screen.getByText("the league")).toBeInTheDocument();
  });

  it("league on a phone keeps the art — the head's tower is hidden there", () => {
    const restore = phoneWidth(true);
    try {
      act(() => {
        usePrefs.getState().setShell("watchtower");
        usePrefs.getState().setCard("league");
      });
      const { container } = render(card(true));
      expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/tower?frame=card");
    } finally {
      restore();
    }
  });

  it("an account's own page (/u/:id, no calendar head) keeps its art whatever the pick", () => {
    act(() => {
      usePrefs.getState().setShell("watchtower");
      usePrefs.getState().setCard("league");
    });
    const { container } = render(card(false));
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/tower?frame=card");
  });

  it("art (the default) keeps the art on the Overview, and the member's Still reaches it", () => {
    act(() => {
      usePrefs.getState().setShell("watchtower");
      usePrefs.getState().setCrest("still");
    });
    const { container } = render(card(true));
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "/tower?frame=card&rest=still",
    );
  });
});
