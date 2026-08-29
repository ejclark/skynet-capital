import { FEEDBACK_KIND_ICON } from "../../src/observatory/feedback-view.js";

/** The wire's cross-member feedback pulse and the feedback form share this one icon set. */
describe("FEEDBACK_KIND_ICON", () => {
  it("has exactly one icon per feedback kind", () => {
    expect(FEEDBACK_KIND_ICON).toEqual({ bug: "🐞", feature: "✨", idea: "🗺️" });
  });
});
