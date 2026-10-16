import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  findScreen,
  framePlan,
  loadScreens,
  parseShootArgs,
  readState,
} from "../../../scripts/redesign/shoot.mjs";
import { WORLDS } from "../../../scripts/study/worlds/index.mjs";

// #5143: a redesign session shoots today's frame with one command. The registry is the contract
// every session reads, so each screen must name a world that exists and a viewer that world has —
// otherwise the camera opens an empty page and the session draws over a broken "today".

describe("the screen registry", () => {
  const screens = loadScreens();

  it("names each screen once, with the words a round page shows and a route in the app", () => {
    expect(new Set(screens.map((s) => s.id)).size).toBe(screens.length);
    for (const s of screens) {
      expect(s.name.length, s.id).toBeGreaterThan(0);
      expect(s.purpose.length, s.id).toBeGreaterThan(20);
      expect(s.route.startsWith("/app/"), s.id).toBe(true);
    }
  });

  it("sees every screen as a viewer of a world the composer can build", () => {
    for (const s of screens) {
      const world = WORLDS.find((w) => w.name === s.world);
      expect(world, `${s.id} → ${s.world}`).toBeDefined();
      expect(Object.keys(world?.viewers ?? {}), `${s.id} → ${s.viewer}`).toContain(s.viewer);
    }
  });
});

describe("parseShootArgs", () => {
  it("needs a screen and an out dir, and defaults to the dark scheme", () => {
    expect(parseShootArgs(["--screen", "activity", "--out", "o"])).toEqual({
      screen: "activity",
      out: "o",
      scheme: "dark",
      rebuild: false,
    });
    expect(() => parseShootArgs(["--screen", "activity"])).toThrow(/usage/);
  });

  it("refuses a scheme it can't shoot and a flag it doesn't know", () => {
    expect(() => parseShootArgs(["--screen", "a", "--out", "o", "--scheme", "sepia"])).toThrow(
      /dark or light/,
    );
    expect(() => parseShootArgs(["--screen", "a", "--out", "o", "--fast"])).toThrow(/--fast/);
    expect(parseShootArgs(["--screen", "a", "--out", "o", "--rebuild"]).rebuild).toBe(true);
  });
});

describe("findScreen", () => {
  it("lists the ids there are when the one asked for is not one", () => {
    expect(() => findScreen(loadScreens(), "trade")).toThrow(/trade-ticket/);
  });
});

describe("readState", () => {
  it("reads inline JSON or a file, keyed by /api reads", () => {
    const dir = mkdtempSync(join(tmpdir(), "shoot-state-"));
    writeFileSync(join(dir, "s.json"), JSON.stringify({ "/api/council": { enabled: false } }));
    expect(readState('{"/api/feedback?x=1": {}}')).toEqual({ "/api/feedback?x=1": {} });
    expect(readState("s.json", dir)).toEqual({ "/api/council": { enabled: false } });
    expect(readState(undefined)).toEqual({});
  });

  it("says why when the overrides can't be used", () => {
    expect(() => readState("{nope")).toThrow(/not JSON/);
    expect(() => readState('{"/feedback": {}}')).toThrow(/\/api\//);
  });
});

describe("framePlan", () => {
  it("hands the camera the screen's route, world and viewer with the session's overrides", () => {
    const screen = findScreen(loadScreens(), "moneypenny");
    const plan = framePlan(screen, { out: "/o", run: "/r", state: { "/api/x": 1 } });
    expect(plan).toMatchObject({
      id: "moneypenny",
      route: screen.route,
      world: screen.world,
      viewer: screen.viewer,
      clicks: screen.clicks,
      scheme: "dark",
      overrides: { "/api/x": 1 },
    });
  });
});
