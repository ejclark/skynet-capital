import { createServer, request } from "node:http";
import type { AddressInfo } from "node:net";
import { addShell, readBody, readJsonPost, sendJson } from "../../src/server/page-shell.js";

describe("addShell", () => {
  it("wraps inner content with the page title and brand mark", () => {
    const html = addShell("My Title", "<p>hello</p>");
    expect(html).toContain("<title>My Title</title>");
    expect(html).toContain("<p>hello</p>");
    expect(html).toContain("SKYNET");
  });

  it("adds the wide layout class only when asked", () => {
    expect(addShell("T", "x", true)).toContain('class="wrap wide"');
    expect(addShell("T", "x", false)).toContain('<div class="wrap">');
    // Default (omitted) behaves the same as explicit false.
    expect(addShell("T", "x")).toContain('<div class="wrap">');
  });
});

describe("readBody", () => {
  const fakeRequest = (chunks: Array<Buffer | string>) => {
    return {
      on(event: string, cb: (...args: unknown[]) => void) {
        if (event === "data") {
          for (const chunk of chunks) cb(chunk);
        }
        if (event === "end") {
          cb();
        }
        return this;
      },
      destroy() {
        /* no-op — the fake has nothing to tear down */
      },
      // biome-ignore lint/suspicious/noExplicitAny: minimal IncomingMessage double for this test only
    } as any;
  };

  it("concatenates data chunks into the full body", async () => {
    const body = await readBody(fakeRequest(["displayName=", "Uncle+Joe"]));
    expect(body).toBe("displayName=Uncle+Joe");
  });

  it("rejects a body over the 1MB cap", async () => {
    const huge = "x".repeat(1_000_001);
    await expect(readBody(fakeRequest([huge]))).rejects.toThrow("body too large");
  });

  it("keeps a 4-byte emoji whole when a TCP chunk boundary splits it", async () => {
    const bytes = Buffer.from('{"text":"up 🚀 today"}', "utf8");
    const split = bytes.indexOf(0xf0) + 2; // inside the emoji's four bytes
    const body = await readBody(fakeRequest([bytes.subarray(0, split), bytes.subarray(split)]));
    expect(body).toBe('{"text":"up 🚀 today"}');
    expect(body).not.toContain("�");
  });

  it("caps by UTF-8 bytes, so multibyte text under the cap in characters is still refused", async () => {
    const accented = "é".repeat(60); // 60 UTF-16 units, 120 bytes
    expect(accented.length).toBeLessThan(100);
    await expect(readBody(fakeRequest([Buffer.from(accented, "utf8")]), 100)).rejects.toThrow(
      "body too large",
    );
  });

  it("accepts a multibyte body exactly at the byte cap", async () => {
    const accented = "é".repeat(50); // 100 bytes
    await expect(readBody(fakeRequest([Buffer.from(accented, "utf8")]), 100)).resolves.toBe(
      accented,
    );
  });
});

/**
 * #6291: the 413 contract observed on a real socket, not a Readable double. Destroying the request
 * on the cap trip killed the connection before readJsonPost's 413 was written, so every client saw
 * a reset ("Failed to fetch") — the fakes above have a no-op destroy() and could never see that.
 */
describe("readJsonPost on a real socket", () => {
  const CAP = 4_096;

  async function withServer(run: (port: number) => Promise<void>): Promise<void> {
    const server = createServer((req, res) => {
      void readJsonPost(req, res, CAP).then((raw) => {
        if (raw !== undefined) sendJson(res, 200, { bytes: Buffer.byteLength(raw) });
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    try {
      await run((server.address() as AddressInfo).port);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  /** POST `pieces` as one request — chunked transfer when there is more than one piece. */
  function postPieces(
    port: number,
    pieces: string[],
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string | number> = { "content-type": "application/json" };
      if (pieces.length === 1) headers["content-length"] = Buffer.byteLength(pieces[0] ?? "");
      const req = request({ port, method: "POST", path: "/", headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>,
          }),
        );
      });
      req.on("error", reject);
      for (const piece of pieces) req.write(piece);
      req.end();
    });
  }

  it("answers 413 to an oversized body sent in one write", async () => {
    await withServer(async (port) => {
      const reply = await postPieces(port, ["x".repeat(CAP * 10)]);
      expect(reply).toEqual({ status: 413, body: { error: "body too large" } });
    });
  });

  it("answers 413 to an oversized body streamed in chunks", async () => {
    await withServer(async (port) => {
      const reply = await postPieces(
        port,
        Array.from({ length: 10 }, () => "x".repeat(CAP)),
      );
      expect(reply).toEqual({ status: 413, body: { error: "body too large" } });
    });
  });

  it("still reads a body exactly at the cap", async () => {
    await withServer(async (port) => {
      const reply = await postPieces(port, ["x".repeat(CAP)]);
      expect(reply).toEqual({ status: 200, body: { bytes: CAP } });
    });
  });
});
