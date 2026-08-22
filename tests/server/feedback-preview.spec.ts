import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import { handleFeedbackPreview } from "../../src/server/feedback-preview.js";

// The preview route renders, and only renders: no token, no GitHub call, nothing stored. These
// specs pin that (a member with feedback switched off still gets a preview) plus the HTTP shape.
const request = (body: string): IncomingMessage => Readable.from([body]) as IncomingMessage;

interface Captured {
  status: number;
  json: { ok?: boolean; html?: string; error?: string };
}

const capture = (): { res: ServerResponse; out: Captured } => {
  const out: Captured = { status: 0, json: {} };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(payload: string) {
      out.json = JSON.parse(payload);
    },
  } as unknown as ServerResponse;
  return { res, out };
};

describe("POST /feedback/preview", () => {
  it("renders the member's markdown — no token, no filing, nothing stored", async () => {
    const { res, out } = capture();

    await handleFeedbackPreview(request(JSON.stringify({ markdown: "- a point\n" })), res, "POST");

    expect(out.status).toBe(200);
    expect(out.json.ok).toBe(true);
    expect(out.json.html).toContain("<li>a point</li>");
  });

  it("says something friendly rather than rendering an empty pane", async () => {
    const { res, out } = capture();

    await handleFeedbackPreview(request(JSON.stringify({ markdown: "   " })), res, "POST");

    expect(out.json.html).toContain("Nothing to preview yet");
  });

  it("refuses a non-POST", async () => {
    const { res, out } = capture();

    await handleFeedbackPreview(request(""), res, "GET");

    expect(out.status).toBe(405);
  });

  it("refuses a body that isn't JSON", async () => {
    const { res, out } = capture();

    await handleFeedbackPreview(request("not json"), res, "POST");

    expect(out.status).toBe(400);
  });

  it("caps the payload — a preview is not an upload channel", async () => {
    const { res, out } = capture();

    await handleFeedbackPreview(
      request(JSON.stringify({ markdown: "x".repeat(20_001) })),
      res,
      "POST",
    );

    expect(out.status).toBe(413);
  });
});
