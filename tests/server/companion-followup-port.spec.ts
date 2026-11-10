import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CompanionTurn, CompanionTurnInput } from "../../src/companion/companion-chat.js";
import type { FollowupDraft } from "../../src/companion/companion-followup.js";
import { companionFollowupFor } from "../../src/server/companion-followup-port.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * The follow-up card's server half (#7286, named next slice 8). EARS:
 *  - The tool SHALL read only the signed-in member's own feedback log — the same log
 *    `/api/feedback/followup` checks ownership against — never another member's.
 *  - WHEN she drafts a follow-up, the chat route SHALL relay it as one `followup` frame and post
 *    nothing; only the member's tap posts it, through `/api/feedback/followup`.
 */

const session = (email: string) => ({ email, name: "A Member" }) as never;

describe("companionFollowupFor — the session's own filings, never another's", () => {
  it("reads the feedback log under the session's own opaque id", async () => {
    const asked: string[] = [];
    const config = {
      readFeedback: (id: string) => {
        asked.push(id);
        return Promise.resolve([
          { issueNumber: 6007, title: "Chart freezes", filedAt: "2026-11-01", kind: "bug" },
        ] as never);
      },
    };
    const port = companionFollowupFor(config, session("me@example.com"), () => undefined);

    expect(await port.ownFilings()).toEqual([{ issueNumber: 6007, title: "Chart freezes" }]);
    expect(asked).toEqual([opaqueMemberId("me@example.com")]);
  });

  it("answers an empty list when the feedback log isn't wired", async () => {
    const port = companionFollowupFor({}, session("me@example.com"), () => undefined);
    expect(await port.ownFilings()).toEqual([]);
  });
});

function fakeRes() {
  const out: { chunks: string[] } = { chunks: [] };
  const res = {
    writeHead: () => res,
    write: (chunk: string) => {
      out.chunks.push(chunk);
      return true;
    },
    end: () => undefined,
    once: () => res,
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

describe("the chat route relays a drafted follow-up", () => {
  it("binds the follow-up per turn and writes one followup frame carrying the draft", async () => {
    const draft: FollowupDraft = { issueNumber: 6007, title: "Chart freezes", details: "iPad too" };
    const config = {
      hub: { getState: () => ({ participants: [] }) },
      companion: ((input: CompanionTurnInput, handlers) => {
        input.followup?.onDraft?.(draft);
        handlers.onDone();
        return Promise.resolve();
      }) as CompanionTurn,
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    const mail = `spec-${Math.random().toString(36).slice(2)}@example.com`;

    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "add that it freezes on the iPad too" }] }),
      res,
      "/api/companion/chat",
      config,
      session(mail),
    );

    const frames = out.chunks.filter((c) => c.includes("event: followup"));
    expect(frames).toHaveLength(1);
    const data = frames[0]?.split("\n").find((l) => l.startsWith("data: "));
    expect(JSON.parse(data?.slice("data: ".length) ?? "{}")).toEqual(draft);
    expect(out.chunks.some((c) => c.includes("event: done"))).toBe(true);
  });
});
