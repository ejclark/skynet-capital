import { anthropicApiError } from "../../src/http/anthropic-reply.js";

/**
 * The shared response-validation preamble the feedback coach and the companion both call —
 * promoted out of two near-identical pastes (`scripts/clone-scan.mjs`) into one spot.
 */
describe("anthropicApiError", () => {
  it("reads a usable 200 JSON object as fine — no error", () => {
    expect(anthropicApiError({ status: 200, body: { content: [] } }, "coach")).toBeUndefined();
  });

  it("names the caller and the status on a non-200 response", () => {
    expect(anthropicApiError({ status: 429, body: {} }, "companion")).toBe(
      "companion responded 429",
    );
  });

  it("carries the upstream's own error message when it has one", () => {
    const res = { status: 401, body: { error: { message: "invalid x-api-key" } } };
    expect(anthropicApiError(res, "coach")).toBe("coach responded 401: invalid x-api-key");
  });

  it("treats a 200 with a non-object body as an error too", () => {
    expect(anthropicApiError({ status: 200, body: null }, "companion")).toBe(
      "companion responded 200",
    );
  });
});
