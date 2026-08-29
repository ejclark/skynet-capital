import type { ServerResponse } from "node:http";
import { servePublicRoute } from "../../src/server/dashboard-board-routes.js";
import type { ObservatoryHub } from "../../src/server/observatory-hub.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; headers?: Record<string, string>; chunks: string[] };
} {
  const out: { status?: number; headers?: Record<string, string>; chunks: string[] } = {
    chunks: [],
  };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    write(chunk: string) {
      out.chunks.push(chunk);
      return true;
    },
    end(chunk?: string) {
      if (chunk) out.chunks.push(chunk);
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function fakeHub(participants: unknown[]): ObservatoryHub {
  return {
    getState: () => ({ participants, generatedAt: "2026-08-26T00:00:00Z" }),
    subscribe: () => () => undefined,
  } as unknown as ObservatoryHub;
}

describe("servePublicRoute", () => {
  it("serves the aggregate cohort pulse without exposing individual accounts", () => {
    const { res, out } = fakeResponse();
    const hub = fakeHub([
      { kind: "human", equity: 100, error: false },
      { kind: "bot", equity: 50, error: false },
    ]);

    const handled = servePublicRoute("/pulse", res, hub);

    expect(handled).toBe(true);
    const body = JSON.parse(out.chunks.join(""));
    expect(body).toEqual({ humans: 1, bots: 1, humanEquity: 100, botEquity: 50 });
  });

  it("excludes errored participants from the pulse totals", () => {
    const { res, out } = fakeResponse();
    const hub = fakeHub([{ kind: "human", equity: 999, error: true }]);

    servePublicRoute("/pulse", res, hub);

    expect(JSON.parse(out.chunks.join(""))).toMatchObject({ humans: 0, humanEquity: 0 });
  });

  it("serves the welcome page", () => {
    const { res, out } = fakeResponse();
    expect(servePublicRoute("/welcome", res, fakeHub([]))).toBe(true);
    expect(out.status).toBe(200);
  });

  it("leaves an unrecognized path unhandled", () => {
    const { res } = fakeResponse();
    expect(servePublicRoute("/nope", res, fakeHub([]))).toBe(false);
  });
});
