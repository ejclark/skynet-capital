import { describe, expect, it } from "@rstest/core";
import {
  APP_ROOTS,
  appOf,
  noteLoadStart,
  readLastApp,
  reopenTarget,
} from "../../src/shell/last-app";

// Returning opens the last app used (#8189 criterion 7): its root, only on the session's first load
// at bare `/`, and the home whenever storage has nothing usable.

const stored = (value: string | null) => ({ getItem: () => value });

describe("which app a page belongs to", () => {
  it("maps each app's pages to its root, the home to home, and anything else to no record", () => {
    expect(appOf("/")).toBe("home");
    expect(appOf("/app/")).toBe("home");
    expect(appOf("/trade")).toBe("/trade");
    expect(appOf("/accounts")).toBe("/accounts");
    expect(appOf("/research")).toBe("/research");
    expect(appOf("/campaign")).toBe("/campaign");
    expect(appOf("/activity")).toBe("/activity");
    expect(appOf("/leaderboard")).toBeUndefined();
    expect(appOf("/u/sauron")).toBeUndefined();
    expect(appOf("/settings")).toBeUndefined();
    expect(appOf("/trades")).toBeUndefined();
  });
});

describe("the record", () => {
  it("reopens one of the five, and nothing for home, junk or no storage", () => {
    for (const root of APP_ROOTS) expect(readLastApp(stored(root))).toBe(root);
    expect(readLastApp(stored("home"))).toBeUndefined();
    expect(readLastApp(stored("/trade?symbol=NVDA"))).toBeUndefined();
    expect(readLastApp(stored(null))).toBeUndefined();
    expect(readLastApp(undefined)).toBeUndefined();
  });

  it("reads storage that throws as no record, so the home shows", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readLastApp(throwing)).toBeUndefined();
  });
});

describe("only a fresh load at bare / reopens", () => {
  it("never on a preload, a search or a hash, and never once a second load has started", () => {
    window.localStorage.setItem("skynet.last-app", "/trade");
    expect(noteLoadStart()).toBe(false);
    expect(reopenTarget({ preload: false, searchStr: "", hash: "" })).toBe("/trade");
    expect(reopenTarget({ preload: true, searchStr: "", hash: "" })).toBeUndefined();
    expect(reopenTarget({ preload: false, searchStr: "?by=return", hash: "" })).toBeUndefined();
    expect(reopenTarget({ preload: false, searchStr: "", hash: "main" })).toBeUndefined();
    // A second load starting settles it, with no resolve in between (#8494).
    expect(noteLoadStart()).toBe(true);
    expect(reopenTarget({ preload: false, searchStr: "", hash: "" })).toBeUndefined();
    window.localStorage.removeItem("skynet.last-app");
  });
});
