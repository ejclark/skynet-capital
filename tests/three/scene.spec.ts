import { threeScenePage } from "../../src/three/serve-scene.js";

/**
 * The `/tower` shell's contract. It is deliberately dumb — a canvas plus a script tag — because all
 * the scene logic lives in the typed kit (src/three/kit, src/three/pieces) and ships as a bundle.
 * The rendered IMAGE is verified by scripts/shoot-tower.mjs, not here.
 */
describe("threeScenePage", () => {
  it("renders a canvas for the engine to attach to", () => {
    expect(threeScenePage()).toContain("<canvas");
  });

  it("loads the locally-served bundle rather than a third-party CDN", () => {
    const html = threeScenePage();
    expect(html).toContain("/three/scene.js");
    // A CDN would be unpinned in production and unreachable from the headless verification browser.
    expect(html).not.toContain("cdn.babylonjs.com");
  });

  it("hands the canvas to the bundle's entry point", () => {
    expect(threeScenePage()).toContain("__startTower");
  });

  it("keeps the decorative canvas labelled for assistive tech", () => {
    expect(threeScenePage()).toContain('role="img"');
  });
});
