import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import { feedbackThrottled, serveFeedbackRoute } from "../../src/server/feedback-routes.js";

// `/feedback` and `/feedback/followup` themselves are superseded by the shell's `/api/feedback`
// family (feedback-api-routes.spec.ts). What's left here: the two bare paths the shell's own
// coach box still posts to directly, and the throttle they share with that API.

const request = (body = "", method = "GET"): IncomingMessage => {
  const req = Readable.from([body]) as IncomingMessage;
  Object.defineProperty(req, "method", { value: method });
  return req;
};

const capture = (): { res: ServerResponse; out: { status: number; body: string } } => {
  const out = { status: 0, body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(payload: string) {
      out.body = payload ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
};

describe("serveFeedbackRoute", () => {
  it("previews markdown with no token configured", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request(JSON.stringify({ markdown: "- a point" }), "POST"),
      res,
      "/feedback/preview",
      undefined,
      {},
    );

    expect(out.status).toBe(200);
    expect(JSON.parse(out.body).html).toContain("<li>a point</li>");
  });

  it("answers the coach path honestly when the coach isn't wired", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request(JSON.stringify({ kind: "bug", messages: [] }), "POST"),
      res,
      "/feedback/coach",
      undefined,
      {},
    );

    expect(JSON.parse(out.body)).toMatchObject({ ok: false });
  });
});

describe("feedbackThrottled", () => {
  it("admits up to the burst cap, then throttles the next one in the same window", () => {
    const key = "burst@example.com";
    for (let i = 0; i < 5; i++) {
      expect(feedbackThrottled(key)).toBe(false);
    }
    expect(feedbackThrottled(key)).toBe(true);
  });

  it("forgets hits once the window has passed", () => {
    const key = "cooldown@example.com";
    const start = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(feedbackThrottled(key, start)).toBe(false);
    }
    expect(feedbackThrottled(key, start + 600_001)).toBe(false);
  });
});
