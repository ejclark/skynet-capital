import { readFileSync } from "node:fs";
import { ownsAccount, type SettingsIndex } from "../../app/src/live/settings";

/**
 * The any-account page's head (#3807 slice 2d — 2a's link row folded into the page's own head,
 * `account-head.tsx`): its Settings item is owner-only (#785). Every other item in the section
 * switch is scoped to the OPEN account, so an item that reads as the account's but always lands on
 * the viewer's own is a lie the row tells by position. Two halves are checked: the ownership
 * predicate's truth table, and that the head actually gates the link on it (the component itself
 * needs a DOM this suite doesn't have, so the gate is asserted against the source the same way
 * theme-css.spec.ts asserts the palette; the write-control gate has a DOM spec in
 * `app/tests/shell/blotter-row-ownership.spec.tsx`).
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

const railSource = readFileSync("app/src/shell/account-head.tsx", "utf8");

describe("the any-account head's settings ownership", () => {
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

  describe("the head's switch", () => {
    it("renders Settings only behind the ownership gate", () => {
      expect(railSource).toContain("ownsAccount");
      expect(railSource).toContain('{isOwn ? <Link to="/settings">Settings</Link> : null}');
    });

    it("links the same account on your Profile page only when it is yours (dead end 6)", () => {
      expect(railSource).toMatch(
        /\{isOwn \? \(\s*<Link to="\/accounts" search=\{\{ account: id \}\}/,
      );
    });

    it("never links to /settings unconditionally", () => {
      expect(railSource).not.toMatch(/^\s*<Link to="\/settings">/m);
    });

    it("folds Decisions into Heartbeat and drops the rail's way out (#3807 slices 2a, 2d)", () => {
      expect(railSource).toContain("Overview");
      expect(railSource).toContain("Heartbeat");
      expect(railSource).not.toMatch(/>\s*Decisions\s*</);
      expect(railSource).toContain('<Link to="/u/$id/decisions" params={{ id }}>');
      expect(railSource).not.toContain("← Leaderboard");
      expect(railSource).not.toContain('className="rail-label"');
    });

    it("gives the page an Activity section and its own sticky head (#3807 slice 2d)", () => {
      expect(railSource).toContain('<Link to="/u/$id/activity" params={{ id }}>');
      expect(railSource).toContain('className="cockpit-head acct-head"');
      expect(railSource).toContain("<h1>{name}</h1>");
    });

    it("never says the retired word in copy", () => {
      const copy = railSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(copy).not.toMatch(/>[^<>{}]*\bdesk\b[^<>{}]*</i);
    });
  });
});
