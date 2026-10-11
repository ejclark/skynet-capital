import { siblingPath } from "../../src/storage/sibling-path.js";

describe("siblingPath", () => {
  it("names a file in the same directory", () => {
    expect(siblingPath("/data/bot-controls.json", "council.json")).toBe("/data/council.json");
    expect(siblingPath("C:\\data\\bot-controls.json", "council.json")).toBe(
      "C:\\data\\council.json",
    );
  });

  it("keeps a bare file name bare", () => {
    expect(siblingPath("bot-controls.json", "council.json")).toBe("council.json");
  });
});
