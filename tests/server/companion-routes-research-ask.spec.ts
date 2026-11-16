import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CompanionHandlers, CompanionTurn } from "../../src/companion/companion-chat.js";
import type { ResearchAskDraft } from "../../src/companion/companion-research-ask.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * A drafted research question reaches the rail as its own `research-ask` frame (the Moneypenny
 * operator plan, research slice). The chat route only relays the card; the member's tap on it
 * posts to `/api/campaigns/ask`, never this route.
 */

function fakeRes() {
  const out: { status?: number; chunks: string[] } = { chunks: [] };
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
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

const email = () => `spec-${Math.random().toString(36).slice(2)}@example.com`;
const sessionFor = (mail: string) => ({ email: mail, name: "A Member" }) as never;

const DRAFT: ResearchAskDraft = {
  kind: "name",
  subject: "PLTR",
  label: "PLTR",
  question: "Why is it moving?",
};

describe("the chat route relays a drafted research question", () => {
  it("writes one research-ask frame carrying the draft", async () => {
    const config = {
      hub: { getState: () => ({ participants: [] }) },
      companion: ((_input, handlers: CompanionHandlers) => {
        handlers.onResearchAskDraft?.(DRAFT);
        handlers.onDone();
        return Promise.resolve();
      }) as CompanionTurn,
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "why is PLTR moving?" }] }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(email()),
    );
    const frames = out.chunks.filter((c) => c.includes("event: research-ask"));
    expect(frames).toHaveLength(1);
    const data = frames[0]?.split("\n").find((l) => l.startsWith("data: "));
    expect(JSON.parse(data?.slice("data: ".length) ?? "{}")).toEqual(DRAFT);
    expect(out.chunks.some((c) => c.includes("event: done"))).toBe(true);
  });
});
