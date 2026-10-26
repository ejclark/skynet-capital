import { addShell, readBody } from "../../src/server/page-shell.js";

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
