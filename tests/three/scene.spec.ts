import { threeScenePage } from "../../src/three/serve-scene.js";

describe("threeScenePage", () => {
  it("serves a self-contained Babylon scene page", () => {
    const html = threeScenePage();
    expect(html).toContain("<canvas");
    expect(html).toContain("babylon.js");
    expect(html).toContain("BABYLON.Engine");
  });
});
