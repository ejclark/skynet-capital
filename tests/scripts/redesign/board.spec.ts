import { describe, expect, it } from "@rstest/core";
import { parseBoardArgs } from "../../../scripts/redesign/board.mjs";
import {
  boardFiles,
  boardHtml,
  boardScreens,
  framePath,
  type Sizes,
  worldClock,
} from "../../../scripts/redesign/board-page.mjs";
import { loadScreens, type Screen } from "../../../scripts/redesign/shoot.mjs";

// #5143: the feedback board is one command — every screen in the registry, shot by the same camera
// a redesign round uses, as one page Eric pins comments on and starts a session from. What must
// hold: every screen gets a section a comment can anchor on, phone before desktop; the Start
// button carries the id and route a session is spawned from; a screen the camera failed on says
// so instead of vanishing or showing an older picture; and every refusal gets its own line.

const screen = (over: Partial<Screen> = {}): Screen => ({
  id: "trade-ticket",
  name: "Trade: Ticket",
  purpose: "The order form for one symbol.",
  where: "Trade tab",
  route: "/app/trade?symbol=NVDA&section=ticket",
  world: "profile-today",
  viewer: "eric",
  ...over,
});
const made = { ref: "main", sha: "b13e029", day: "Oct 11" };
const both: Sizes[string] = {
  phone: { width: 780, height: 2682 },
  desk: { width: 1280, height: 1560 },
};

describe("the registry the board reads", () => {
  it("says where a member finds every screen", () => {
    for (const s of loadScreens()) expect(s.where?.length ?? 0, s.id).toBeGreaterThan(0);
  });
});

describe("parseBoardArgs", () => {
  it("needs an out dir, and shoots every screen unless --screens names some", () => {
    expect(parseBoardArgs(["--out", "b"])).toEqual({ out: "b", screens: null, rebuild: false });
    expect(
      parseBoardArgs(["--out", "b", "--screens", "activity, council,activity", "--rebuild"]),
    ).toEqual({
      out: "b",
      screens: ["activity", "council"],
      rebuild: true,
    });
    expect(() => parseBoardArgs([])).toThrow(/usage/);
  });

  it("refuses a flag it doesn't know, a flag with no value and an empty screen list", () => {
    expect(() => parseBoardArgs(["--out", "b", "--fast"])).toThrow(/--fast/);
    expect(() => parseBoardArgs(["--out", "--screens", "a"])).toThrow(/--out needs a value/);
    expect(() => parseBoardArgs(["--out", "b", "--screens", ","])).toThrow(/at least one/);
  });
});

describe("boardScreens", () => {
  const registry = ["a", "b", "c"].map((id) => screen({ id }));

  it("keeps the registry's order, and every screen shot this run even when its shot failed", () => {
    const ids = boardScreens(registry, ["c", "a"], () => false).map((s) => s.id);
    expect(ids).toEqual(["a", "c"]);
  });

  it("keeps a screen an earlier run left frames for, so a partial refresh republishes all", () => {
    const ids = boardScreens(registry, ["a"], (id) => id === "b").map((s) => s.id);
    expect(ids).toEqual(["a", "b"]);
  });
});

describe("boardHtml", () => {
  const two = [screen(), screen({ id: "settings", name: "Settings", route: "/app/settings" })];
  const html = boardHtml(two, { "trade-ticket": both, settings: both }, made);

  it("gives each screen a section a comment anchors on, with its id and route", () => {
    expect(html.match(/<section class="screen"/g)).toHaveLength(2);
    expect(html).toContain(
      '<section class="screen" id="trade-ticket" data-comment-target data-screen="trade-ticket" data-route="/app/trade?symbol=NVDA&amp;section=ticket">',
    );
    expect(html).toContain('<p class="where">Trade tab</p>');
    expect(html).toContain("Jump to a screen (2)");
  });

  it("puts the phone frame before the desktop one, sized, the first screen loaded eagerly", () => {
    const phone = html.indexOf('src="img/trade-ticket-phone.jpg" width="780" height="2682"');
    const desk = html.indexOf('src="img/trade-ticket-desk.jpg" width="1280" height="1560"');
    expect(phone).toBeGreaterThan(-1);
    expect(desk).toBeGreaterThan(phone);
    expect(html.slice(phone, desk)).toContain('loading="eager"');
    expect(html.slice(html.indexOf('id="settings"'))).toContain('loading="lazy"');
  });

  it("says a screen had no picture this time instead of dropping it", () => {
    const missing = boardHtml([screen()], { "trade-ticket": { phone: null, desk: null } }, made);
    expect(missing).toContain("No picture of this screen this time");
    expect(missing).not.toContain("<img");
    expect(missing).toContain('id="go-trade-ticket"');
  });

  it("names what the pictures were built from, and the world's frozen clock", () => {
    expect(worldClock()).toBe("Thu Oct 8, 3:00 pm ET");
    expect(html).toContain("built from main (b13e029) on Oct 11");
    expect(html).toContain("(Thu Oct 8, 3:00 pm ET)");
    const partial = boardHtml(two, { settings: both }, { ...made, reshot: ["Settings"] });
    expect(partial).toContain(
      "Settings as built from main (b13e029) on Oct 11; every other screen from an earlier build",
    );
  });

  it("sends the start line through comments, with its own words for every refusal", () => {
    expect(html).toContain("<title>Screens for feedback</title>");
    expect(html).toContain("c.sendToClaude({ anchor, text: `Start redesign: ");
    expect(html).toContain('use("comments")');
    for (const code of [
      "consent_required",
      "forbidden",
      "claude_unavailable",
      "rate_limited",
      "not_granted",
      "capability_disabled",
    ]) {
      expect(html, code).toContain(`case "${code}":`);
    }
    expect(html).toContain("Open this page on claude.ai to start a session");
  });
});

describe("boardFiles", () => {
  it("publishes each frame that exists at the path the page names", () => {
    const sizes: Sizes = { "trade-ticket": both, settings: { phone: both.phone, desk: null } };
    const two = [screen(), screen({ id: "settings" })];
    expect(boardFiles(two, sizes, "/b/img")).toEqual({
      [framePath("trade-ticket", "phone")]: "/b/img/trade-ticket-phone.jpg",
      [framePath("trade-ticket", "desk")]: "/b/img/trade-ticket-desk.jpg",
      "img/settings-phone.jpg": "/b/img/settings-phone.jpg",
    });
  });
});
