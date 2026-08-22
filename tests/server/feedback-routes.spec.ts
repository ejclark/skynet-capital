import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import type { Session } from "../../src/server/auth/session.js";
import { serveFeedbackRoute } from "../../src/server/feedback-routes.js";
import type { FeedbackInput } from "../../src/server/feedback-service.js";

// The /feedback surface's dispatch, split out of dashboard-server.ts (2026-08-22). What these
// specs hold: the form renders, a submission only files when the filer is wired, the preview needs
// no token at all, and the coach never files anything.
const NAV = { active: "feedback" as const, canAdd: false, authed: true };

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

const session = (email: string): Session => ({ email, provider: "google", exp: Date.now() + 1000 });

describe("serveFeedbackRoute", () => {
  it("renders the form on GET, warning when filing isn't switched on", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(request(), res, "/feedback", undefined, {}, NAV);

    expect(out.status).toBe(200);
    expect(out.body).toContain("Share feedback");
    expect(out.body).toContain("isn't switched on yet");
  });

  it("files the member's submission through the configured filer", async () => {
    const filed: FeedbackInput[] = [];
    const { res, out } = capture();

    await serveFeedbackRoute(
      request("kind=bug&title=Chart+wobbles&details=it+wobbled", "POST"),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        submitFeedback: (input) => {
          filed.push(input);
          return Promise.resolve({
            ok: true as const,
            url: "https://github.com/x/y/issues/7",
            number: 7,
          });
        },
      },
      NAV,
    );

    expect(filed[0]).toMatchObject({ kind: "bug", title: "Chart wobbles", details: "it wobbled" });
    expect(out.body).toContain("#7");
  });

  it("tells the member nothing was sent when no filer is wired", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request("kind=idea&title=t&details=d", "POST"),
      res,
      "/feedback",
      session("nofiler@example.com"),
      {},
      NAV,
    );

    expect(out.body).toContain("Your note wasn't sent");
  });

  it("throttles a burst from one member rather than filing six issues", async () => {
    const deps = {
      submitFeedback: () => Promise.resolve({ ok: true as const, url: "u", number: 1 }),
    };
    const post = async () => {
      const { res, out } = capture();
      await serveFeedbackRoute(
        request("kind=idea&title=t&details=d", "POST"),
        res,
        "/feedback",
        session("burst@example.com"),
        deps,
        NAV,
      );
      return out;
    };

    for (let i = 0; i < 5; i++) await post();
    const sixth = await post();

    expect(sixth.status).toBe(429);
    expect(sixth.body).toContain("give it a few minutes");
  });

  it("previews markdown with no token, no filer and no coach configured", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request(JSON.stringify({ markdown: "- a point" }), "POST"),
      res,
      "/feedback/preview",
      undefined,
      {},
      NAV,
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
      NAV,
    );

    expect(JSON.parse(out.body)).toMatchObject({ ok: false });
  });
});
