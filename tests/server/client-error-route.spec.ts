import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { Session } from "../../src/server/auth/session.js";
import {
  CLIENT_ERROR_PATH,
  formatClientError,
  parseClientError,
  serveClientErrorApi,
} from "../../src/server/client-error-route.js";

// The shell's error beacon (#4618): a caught route error becomes one server log line.
function post(body: string, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([body]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

function response() {
  const out: { status?: number; body: string } = { body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(chunk?: string) {
      if (chunk) out.body += chunk;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const report = {
  kind: "stale-chunk",
  name: "ChunkLoadError",
  message: "Loading chunk 775 failed.",
  path: "/app/trade",
};
let seq = 0;
const session = (): Session =>
  ({ email: `member${++seq}@example.com`, provider: "google", exp: 0 }) as Session;

describe("POST /api/client-error", () => {
  it("logs one line naming the member by opaque id, never by email", async () => {
    const logs: string[] = [];
    const { res, out } = response();
    const s = session();
    const handled = await serveClientErrorApi(
      post(JSON.stringify(report)),
      res,
      CLIENT_ERROR_PATH,
      s,
      (l) => logs.push(l),
    );
    expect(handled).toBe(true);
    expect(out.status).toBe(204);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/^\[client-error\] stale-chunk on "\/app\/trade" for /);
    expect(logs[0]).not.toContain(s.email);
  });

  it("ignores every other path", async () => {
    const { res } = response();
    expect(await serveClientErrorApi(post("{}"), res, "/api/other", session())).toBe(false);
  });

  it("refuses a body that is not the shell's report shape", async () => {
    const logs: string[] = [];
    const { res, out } = response();
    await serveClientErrorApi(
      post(JSON.stringify({ ...report, kind: "anything" })),
      res,
      CLIENT_ERROR_PATH,
      session(),
      (l) => logs.push(l),
    );
    expect(out.status).toBe(400);
    expect(logs).toEqual([]);
  });

  it("refuses a non-JSON post — the CSRF seam every write shares", async () => {
    const { res, out } = response();
    await serveClientErrorApi(post("x", "text/plain"), res, CLIENT_ERROR_PATH, session());
    expect(out.status).toBe(415);
  });

  it("stops logging a member's render loop after 20 in ten minutes", async () => {
    const logs: string[] = [];
    const s = session();
    for (let n = 0; n < 25; n++) {
      const { res } = response();
      await serveClientErrorApi(
        post(JSON.stringify(report)),
        res,
        CLIENT_ERROR_PATH,
        s,
        (l) => logs.push(l),
        () => 1_000_000 + n,
      );
    }
    expect(logs).toHaveLength(20);
  });

  it("keeps a forged newline inside the one line it writes", () => {
    const parsed = parseClientError(
      JSON.stringify({ ...report, message: "boom\n[gauge] rss 1 MB" }),
    );
    expect(parsed).toBeDefined();
    const line = formatClientError(parsed as NonNullable<typeof parsed>, "m1");
    expect(line.split("\n")).toHaveLength(1);
  });

  it("accepts an empty path, which the shell sends when there is no location", () => {
    expect(parseClientError(JSON.stringify({ ...report, path: "" }))).toMatchObject({ path: "" });
  });
});
