import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import type { Session } from "../../src/server/auth/session.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
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

  it("passes attached images through to the filer, parsed from the hidden field", async () => {
    const filed: FeedbackInput[] = [];
    const { res } = capture();
    const images = JSON.stringify([
      { name: "bug.jpg", type: "image/jpeg", dataUrl: `data:image/jpeg;base64,${"A".repeat(100)}` },
    ]);

    await serveFeedbackRoute(
      request(`kind=bug&title=t&details=d&images=${encodeURIComponent(images)}`, "POST"),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        submitFeedback: (input) => {
          filed.push(input);
          return Promise.resolve({ ok: true as const, url: "u", number: 1 });
        },
      },
      NAV,
    );

    expect(filed[0]?.images).toHaveLength(1);
    expect(filed[0]?.images?.[0]).toMatchObject({ name: "bug.jpg", type: "image/jpeg" });
  });

  it("ignores a malformed images field rather than failing the submission", async () => {
    const filed: FeedbackInput[] = [];
    const { res, out } = capture();

    await serveFeedbackRoute(
      request("kind=bug&title=t&details=d&images=not-json", "POST"),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        submitFeedback: (input) => {
          filed.push(input);
          return Promise.resolve({ ok: true as const, url: "u", number: 1 });
        },
      },
      NAV,
    );

    expect(filed[0]?.images).toBeUndefined();
    expect(out.status).toBe(200);
  });

  it("records a successful filing to the feedback log, keyed by the member's opaque id", async () => {
    const logged: FeedbackLogEntry[] = [];
    const { res } = capture();

    await serveFeedbackRoute(
      request("kind=bug&title=Chart+wobbles&details=it+wobbled", "POST"),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        submitFeedback: () =>
          Promise.resolve({ ok: true as const, url: "https://github.com/x/y/issues/7", number: 7 }),
        recordFeedback: (entry) => {
          logged.push(entry);
          return Promise.resolve();
        },
      },
      NAV,
    );

    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({ issueNumber: 7, title: "Chart wobbles", kind: "bug" });
    // Same marker the issue body carries — never the raw email.
    expect(logged[0]?.opaqueMemberId).not.toContain("@");
  });

  it("never lets a log-write failure cost the member their filed issue", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request("kind=bug&title=t&details=d", "POST"),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        submitFeedback: () =>
          Promise.resolve({ ok: true as const, url: "https://github.com/x/y/issues/7", number: 7 }),
        recordFeedback: () => Promise.reject(new Error("disk full")),
      },
      NAV,
    );

    expect(out.status).toBe(200);
    expect(out.body).toContain("#7");
  });

  it("renders the member's recent feedback under the form on GET", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request(),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        readFeedback: (id) =>
          Promise.resolve([
            {
              uuid: "u-1",
              opaqueMemberId: id,
              issueNumber: 12,
              url: "https://github.com/x/y/issues/12",
              kind: "idea" as const,
              title: "A past idea",
              filedAt: "2026-08-20T00:00:00.000Z",
            },
          ]),
      },
      NAV,
    );

    expect(out.body).toContain("A past idea");
    expect(out.body).toContain("#12");
  });

  it("shows a status badge on the member's recent feedback when the status fetch is wired", async () => {
    const { res, out } = capture();

    await serveFeedbackRoute(
      request(),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        readFeedback: () =>
          Promise.resolve([
            {
              uuid: "u-1",
              opaqueMemberId: "m",
              issueNumber: 12,
              url: "https://github.com/x/y/issues/12",
              kind: "idea" as const,
              title: "A past idea",
              filedAt: "2026-08-20T00:00:00.000Z",
            },
          ]),
        fetchFeedbackStatus: (numbers) =>
          Promise.resolve(new Map(numbers.map((n) => [n, "needs-eric" as const]))),
      },
      NAV,
    );

    expect(out.body).toContain("Needs Eric's call");
  });

  it("never calls the status fetch when there's nothing to check", async () => {
    let called = false;
    const { res } = capture();

    await serveFeedbackRoute(
      request(),
      res,
      "/feedback",
      session("filer@example.com"),
      {
        fetchFeedbackStatus: () => {
          called = true;
          return Promise.resolve(new Map());
        },
      },
      NAV,
    );

    expect(called).toBe(false);
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
