import { act } from "@testing-library/react";
import { usePrefs } from "../../src/shell/prefs";

/**
 * The viewer's tower preferences (#3807 slice 3b-1): the motion setting is a real setter now —
 * Settings → Preferences → "Tower motion" writes it. (The `?card=` compare is retired, #3977.)
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
