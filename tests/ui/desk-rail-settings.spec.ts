import { readFileSync } from "node:fs";
import { ownsAccount, type SettingsIndex } from "../../app/src/live/settings";

/**
 * The desk rail's Settings item is owner-only (#785). Every other item in that rail is scoped to
 * the OPEN desk, so an item that reads as the desk's but always lands on the viewer's own account
 * is a lie the rail tells by position. Two halves are checked: the ownership predicate's truth
 * table, and that the rail actually gates the link on it (the component itself needs a DOM this
 * suite doesn't have, so the gate is asserted against the source the same way theme-css.spec.ts
 * asserts the palette).
 */

const index = (ids: readonly string[]): SettingsIndex => ({
  authConfigured: true,
  adminWired: true,
  accounts: ids.map((id) => ({
    id,
    name: id,
    kind: "human" as const,
    hostConfigured: false,
    profile: null,
  })),
  fleetSuspended: false,
  timezones: [],
});

const railSource = readFileSync("app/src/shell/desk-rail.tsx", "utf8");

describe("desk rail settings ownership", () => {
  describe("ownsAccount", () => {
    it("is true for a desk the session's settings index lists", () => {
      expect(ownsAccount(index(["eric", "news-fader"]), "eric")).toBe(true);
      expect(ownsAccount(index(["eric", "news-fader"]), "news-fader")).toBe(true);
    });

    it("is false for another member's desk", () => {
      expect(ownsAccount(index(["eric"]), "tony")).toBe(false);
    });

    it("is false before the index has loaded — the rail hides rather than guesses", () => {
      expect(ownsAccount(undefined, "eric")).toBe(false);
    });

    it("is false when no account is owned at all (auth not configured)", () => {
      expect(ownsAccount(index([]), "eric")).toBe(false);
    });
  });

  describe("the rail's link", () => {
    it("renders Settings only behind the ownership gate", () => {
      expect(railSource).toContain("ownsAccount");
      expect(railSource).toContain('{isOwnDesk ? <Link to="/settings">Settings</Link> : null}');
    });

    it("never links to /settings unconditionally", () => {
      expect(railSource).not.toMatch(/^\s*<Link to="\/settings">/m);
    });
  });
});
