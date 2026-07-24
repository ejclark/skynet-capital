import { sseFrame } from "../../src/server/sse.js";

describe("sseFrame", () => {
  it("frames a data-only message", () => {
    expect(sseFrame('{"x":1}')).toBe('data: {"x":1}\n\n');
  });

  it("includes a named event when given", () => {
    expect(sseFrame("payload", "state")).toBe("event: state\ndata: payload\n\n");
  });
});
