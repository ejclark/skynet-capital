import { anthropicApiError, logAnthropicUsage, usageOf } from "../../src/http/anthropic-reply.js";

describe("logAnthropicUsage — one token-accounting line per Claude call (#6080)", () => {
  it("logs input, output and both cache counts, keyed by surface and model", () => {
    const lines: string[] = [];
    logAnthropicUsage(
      "companion-tool-round",
      "claude-sonnet-5-5",
      {
        input_tokens: 120,
        output_tokens: 45,
        cache_read_input_tokens: 3000,
        cache_creation_input_tokens: 7,
      },
      (l) => lines.push(l),
    );
    expect(lines).toEqual([
      "claude-usage surface=companion-tool-round model=claude-sonnet-5-5 input=120 output=45 cache_read=3000 cache_creation=7",
    ]);
  });

  it("reads a missing count as zero rather than dropping the line", () => {
    const lines: string[] = [];
    logAnthropicUsage("coach", "m", { output_tokens: 9 }, (l) => lines.push(l));
    expect(lines[0]).toContain("input=0 output=9 cache_read=0 cache_creation=0");
  });

  it("writes nothing when the caller wired no sink", () => {
    expect(() => logAnthropicUsage("coach", "m", { input_tokens: 1 }, undefined)).not.toThrow();
  });

  it("logs nothing when the reply carried no usage object", () => {
    const lines: string[] = [];
    logAnthropicUsage("coach", "m", undefined, (l) => lines.push(l));
    expect(lines).toEqual([]);
  });

  it("usageOf reads `usage` off a body or event, and nothing off one without it", () => {
    expect(usageOf({ usage: { input_tokens: 1 } })).toEqual({ input_tokens: 1 });
    expect(usageOf({ content: [] })).toBeUndefined();
    expect(usageOf(undefined)).toBeUndefined();
  });
});

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
