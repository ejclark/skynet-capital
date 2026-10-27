import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { installGracefulShutdown } from "../../src/server/graceful-shutdown.js";
import { openSseStream } from "../../src/server/sse.js";

// Drain-on-SIGTERM (#4616): a real http.Server, a real open SSE stream, a real slow request. The
// signal is injected through the `on` seam so no spec ever signals the test runner itself.
const servers: Server[] = [];
afterEach(() => {
  for (const s of servers.splice(0)) s.close();
});

const listen = async (server: Server): Promise<number> => {
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return (server.address() as AddressInfo).port;
};

const seams = () => {
  const handlers: Array<() => void> = [];
  const exits: number[] = [];
  const logs: string[] = [];
  return {
    handlers,
    exits,
    logs,
    seams: {
      on: (_signal: NodeJS.Signals, handler: () => void) => handlers.push(handler),
      exit: (code: number) => exits.push(code),
      log: (line: string) => logs.push(line),
    },
  };
};

describe("installGracefulShutdown", () => {
  it("ends an open SSE stream with a retry hint, then exits 0", async () => {
    const server = createServer((req, res) => {
      if (req.url === "/events") {
        openSseStream(res);
        res.write("data: hello\n\n");
        return;
      }
      res.end("ok");
    });
    const port = await listen(server);
    const { handlers, exits, seams: s } = seams();
    installGracefulShutdown(server, s);

    const body = await new Promise<string>((resolve) => {
      const req = request({ port, path: "/events", host: "127.0.0.1" }, (res) => {
        let text = "";
        res.on("data", (chunk) => {
          text += chunk;
          if (text.includes("hello")) handlers[0]?.(); // the signal arrives while the stream is live
        });
        res.on("end", () => resolve(text));
      });
      req.end();
    });

    expect(body).toContain("retry: 2000");
    await new Promise((r) => setTimeout(r, 50));
    expect(exits).toEqual([0]);
  });

  it("lets an in-flight request finish before exiting", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const server = createServer((_req, res) => {
      void gate.then(() => res.end("done"));
    });
    const port = await listen(server);
    const { handlers, exits, seams: s } = seams();
    installGracefulShutdown(server, s);

    const response = new Promise<string>((resolve) => {
      request({ port, host: "127.0.0.1", path: "/" }, (res) => {
        let text = "";
        res.on("data", (c) => {
          text += c;
        });
        res.on("end", () => resolve(text));
      }).end();
    });
    await new Promise((r) => setTimeout(r, 30));
    handlers[0]?.();
    await new Promise((r) => setTimeout(r, 30));
    expect(exits).toEqual([]); // still draining: the request has not finished
    release();
    expect(await response).toBe("done");
    await new Promise((r) => setTimeout(r, 300));
    expect(exits).toEqual([0]);
  });

  it("exits 0 when the budget runs out on a request that never finishes", async () => {
    const server = createServer(() => undefined); // never answers
    const port = await listen(server);
    const { handlers, exits, logs, seams: s } = seams();
    installGracefulShutdown(server, { ...s, budgetMs: 40 });
    const req = request({ port, host: "127.0.0.1", path: "/" });
    req.on("error", () => undefined);
    req.end();
    await new Promise((r) => setTimeout(r, 20));
    handlers[0]?.();
    await new Promise((r) => setTimeout(r, 120));
    expect(exits).toEqual([0]);
    expect(logs.join("\n")).toContain("budget spent");
    req.destroy();
  });

  it("ignores a second signal while already draining", () => {
    const server = createServer(() => undefined);
    const { logs, seams: s } = seams();
    const drain = installGracefulShutdown(server, s);
    drain();
    drain();
    expect(logs.filter((l) => l.includes("signal received"))).toHaveLength(1);
  });
});
