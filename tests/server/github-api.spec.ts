import { githubErrorMessage, githubHeaders } from "../../src/server/github-api.js";

// Shared by every feedback module that calls GitHub's REST API — split out after dupe-scan.mjs
// and clone-scan.mjs caught near-identical copies drifting across feedback-service.ts,
// feedback-images.ts, feedback-status.ts, and feedback-followup.ts.
describe("githubHeaders", () => {
  it("carries the bot token as a bearer credential", () => {
    expect(githubHeaders("tok_123").Authorization).toBe("Bearer tok_123");
  });

  it("asks for GitHub's structured JSON response shape", () => {
    expect(githubHeaders("t").Accept).toBe("application/vnd.github+json");
  });
});

describe("githubErrorMessage", () => {
  it("includes GitHub's own message when the response body has one", () => {
    expect(githubErrorMessage({ status: 403, body: { message: "no write access" } })).toBe(
      "GitHub responded 403: no write access.",
    );
  });

  it("still reports the status when the body carries no message", () => {
    expect(githubErrorMessage({ status: 500, body: null })).toBe("GitHub responded 500.");
  });

  it("ignores a non-object body rather than throwing", () => {
    expect(githubErrorMessage({ status: 404, body: "not found" })).toBe("GitHub responded 404.");
  });
});
