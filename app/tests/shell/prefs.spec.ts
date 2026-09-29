import { act } from "@testing-library/react";
import { cardFromUrl, usePrefs } from "../../src/shell/prefs";

/**
 * The viewer's tower preferences (#3807 slice 3b-1): the motion setting is a real setter now —
 * Settings → Preferences → "Tower motion" writes it — and the card compare reads `?card=` the way
 * the motion reads `?crest=`, stored so a pick survives navigation.
 */

describe("the tower's motion setting", () => {
  afterEach(() => act(() => usePrefs.getState().setCrest("live")));

  it("moves by default (Eric's pick, 2026-09-27)", () => {
    expect(usePrefs.getState().crest).toBe("live");
  });

  it("setCrest stills the tower and remembers it in this browser; moving again forgets it", () => {
    act(() => usePrefs.getState().setCrest("still"));
    expect(usePrefs.getState().crest).toBe("still");
    expect(localStorage.getItem("skynet-crest")).toBe("still");
    act(() => usePrefs.getState().setCrest("live"));
    expect(usePrefs.getState().crest).toBe("live");
    expect(localStorage.getItem("skynet-crest")).toBeNull();
  });
});

describe("the card compare (?card=, only read under the flag)", () => {
  afterEach(() => act(() => usePrefs.getState().setCard("art")));

  it("?card=league picks the art-less card, ?card=art the default, anything else keeps what is stored", () => {
    expect(cardFromUrl("?shell=watchtower&card=league", undefined)).toBe("league");
    expect(cardFromUrl("?card=art", "league")).toBe("art");
    expect(cardFromUrl("?on=2026-09-28", "league")).toBe("league");
    expect(cardFromUrl("", undefined)).toBe("art");
    expect(cardFromUrl("?card=LEAGUE", undefined)).toBe("art");
  });

  it("defaults to the art, and setCard stores a league pick until art is picked again", () => {
    expect(usePrefs.getState().card).toBe("art");
    act(() => usePrefs.getState().setCard("league"));
    expect(usePrefs.getState().card).toBe("league");
    expect(localStorage.getItem("skynet-card")).toBe("league");
    act(() => usePrefs.getState().setCard("art"));
    expect(localStorage.getItem("skynet-card")).toBeNull();
  });
});
